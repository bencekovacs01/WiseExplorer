import Coordinate from '../models/Coordinate';
import Route from '../models/Route';
import { orsApi } from '../utils/apiWrapper';
import { metricsService } from './MetricsService';

import CategoryDurations from '../components/CategorySelector/category_times.json';
import axios, { AxiosInstance } from 'axios';
import { IPoiData } from '../models/models';
import { clusterNearbyPOIs } from '../utils/cluster.utils';
import {
    calculateRouteMetric,
    expandClusteredRoute,
    getRouteMatrices,
} from '../utils/route.utils';
import matrices from '../../matrices_output.json';

export enum SortStrategy {
    WEST_TO_EAST = 'west-to-east', // Default W-E
    EAST_TO_WEST = 'east-to-west', // E-W
    SOUTH_TO_NORTH = 'south-to-north', // S-N
    NORTH_TO_SOUTH = 'north-to-south', // N-S
    CLOCKWISE = 'clockwise', // Circular - clockwise
    COUNTERCLOCKWISE = 'counterclockwise', // Circular - counterclockwise
    INSIDE_OUT = 'inside-out', // Radial - center to periphery
    OUTSIDE_IN = 'outside-in', // Radial - periphery to center
}

/**
 * BitonicService provides methods to find routes using the bitonic TSP algorithm.
 * The bitonic algorithm produces a tour without crossings by visiting points
 * in order based on a chosen coordinate strategy:
 * - West to East (default): visit points in non-decreasing longitude order, then non-increasing
 * - East to West: visit points in non-increasing longitude order, then non-decreasing
 * - South to North: visit points in non-decreasing latitude order, then non-increasing
 * - North to South: visit points in non-increasing latitude order, then non-decreasing
 *
 * The algorithm now optimizes for total time (travel time + visit time) rather than just
 * distance. This means the chosen route will prioritize minimizing the overall
 * experience time, including both travel between points and time spent at each location.
 */
export class BitonicService {
    private orsApi = orsApi;
    private ORS_KEY = process.env.ORS_KEY as string;
    private client: AxiosInstance = axios.create();
    private matrixBaseUrl: string =
        'https://api.openrouteservice.org/v2/matrix/driving-car';
    private categoryDurations: Record<
        string,
        Record<string, { duration: number; unit: string }>
    > = CategoryDurations || {};

    // Add this method to get visit durations
    public getVisitDuration(
        category?: string | null,
        subCategory?: string | null,
    ): number {
        if (!category || !subCategory) return 0;

        const categoryLower = category.toLowerCase();
        const subCategoryLower = subCategory.toLowerCase();

        if (
            this.categoryDurations[categoryLower] &&
            this.categoryDurations[categoryLower][subCategoryLower]
        ) {
            const data =
                this.categoryDurations[categoryLower][subCategoryLower];
            return data.duration;
        }

        // Default visit time if not found (30 minutes)
        return 30;
    }

    // Add method to get matrices from ORS API
    public async getRouteMatrices(coordinates: Coordinate[]): Promise<{
        distanceMatrix: number[][];
        durationMatrix: number[][];
    }> {
        return {
            distanceMatrix: (matrices as any).distanceMatrix,
            durationMatrix: (matrices as any).durationMatrix,
        };
    }

    // public async getRouteMatrices(coordinates: Coordinate[]): Promise<{
    //     distanceMatrix: number[][];
    //     durationMatrix: number[][];
    // }> {
    //     // Use static matrices from matrices_output.json
    //     return {
    //         distanceMatrix: (matrices as any).distanceMatrix,
    //         durationMatrix: (matrices as any).durationMatrix,
    //     };
    // }

    private calculateCenter(pois: Coordinate[]): Coordinate {
        const sumLat = pois.reduce((sum, poi) => sum + poi.latitude, 0);
        const sumLon = pois.reduce((sum, poi) => sum + poi.longitude, 0);
        return {
            latitude: sumLat / pois.length,
            longitude: sumLon / pois.length,
        };
    }

    private calculateDistance(point1: Coordinate, point2: Coordinate): number {
        const latDiff = point1.latitude - point2.latitude;
        const lonDiff = point1.longitude - point2.longitude;
        return Math.sqrt(latDiff * latDiff + lonDiff * lonDiff);
    }

    /**
     * Finds an optimal route using the bitonic tour algorithm.
     * This method optimizes for total time (travel time + visit time).
     *
     * @param pois Array of coordinates representing points of interest
     * @param poiMetadata Optional metadata about POIs including category information
     * @param maxClusterDistance Maximum distance in meters to cluster nearby POIs
     * @param sortStrategy Strategy to use for sorting points (determines the direction of the tour)
     * @returns A promise that resolves to the optimal route
     */
    public async findBitonicRoute(
        pois: Coordinate[],
        poiMetadata?: IPoiData[],
        maxClusterDistance: number = 100,
        sortStrategy: SortStrategy = SortStrategy.WEST_TO_EAST,
    ): Promise<Route> {
        const startTime = performance.now();
        
        try {
            const result = await this.findBitonicRouteInternal(
                pois,
                poiMetadata,
                maxClusterDistance,
                sortStrategy
            );
            
            const endTime = performance.now();
            const executionTime = endTime - startTime;
            
            // Record metrics
            metricsService.recordMetric({
                algorithmName: 'Bitonic',
                variant: sortStrategy,
                nodeCount: pois.length,
                executionTimeMs: executionTime,
                routeDistance: result.totalDistance,
                routeDuration: result.duration,
                routeVisitTime: result.visitTime,
                routeTotalTime: result.totalTime,
                timestamp: Date.now()
            });
            
            return result;
        } catch (error) {
            const endTime = performance.now();
            const executionTime = endTime - startTime;
            
            // Record failed attempt
            metricsService.recordMetric({
                algorithmName: 'Bitonic',
                variant: sortStrategy,
                nodeCount: pois.length,
                executionTimeMs: executionTime,
                timestamp: Date.now()
            });
            
            throw error;
        }
    }

    private async findBitonicRouteInternal(
        pois: Coordinate[],
        poiMetadata?: IPoiData[],
        maxClusterDistance: number = 100,
        sortStrategy: SortStrategy = SortStrategy.WEST_TO_EAST,
    ): Promise<Route> {
        if (pois.length < 2) {
            throw new Error(
                'At least start and end points are required for route calculation',
            );
        }

        const { clusteredPois, clusteredMetadata } = clusterNearbyPOIs(
            pois,
            maxClusterDistance,
            poiMetadata,
        );

        const { distanceMatrix, durationMatrix } = await this.getRouteMatrices(
            clusteredPois,
        );
        // console.log('durationMatrix', durationMatrix.length, clusteredPois.length);

        const sortedPois = [...clusteredPois];

        switch (sortStrategy) {
            case SortStrategy.EAST_TO_WEST:
                sortedPois.sort((a, b) => b.longitude - a.longitude);
                break;
            case SortStrategy.SOUTH_TO_NORTH:
                sortedPois.sort((a, b) => a.latitude - b.latitude);
                break;
            case SortStrategy.NORTH_TO_SOUTH:
                sortedPois.sort((a, b) => b.latitude - a.latitude);
                break;
            case SortStrategy.CLOCKWISE:
            case SortStrategy.COUNTERCLOCKWISE:
                {
                    const center = this.calculateCenter(clusteredPois);

                    sortedPois.sort((a, b) => {
                        const angleA = Math.atan2(
                            a.latitude - center.latitude,
                            a.longitude - center.longitude,
                        );
                        const angleB = Math.atan2(
                            b.latitude - center.latitude,
                            b.longitude - center.longitude,
                        );
                        return sortStrategy === SortStrategy.CLOCKWISE
                            ? angleA - angleB
                            : angleB - angleA;
                    });
                }
                break;
            case SortStrategy.INSIDE_OUT:
            case SortStrategy.OUTSIDE_IN:
                {
                    const center = this.calculateCenter(clusteredPois);

                    sortedPois.sort((a, b) => {
                        const distA = this.calculateDistance(a, center);
                        const distB = this.calculateDistance(b, center);
                        return sortStrategy === SortStrategy.INSIDE_OUT
                            ? distA - distB
                            : distB - distA;
                    });
                }
                break;
            case SortStrategy.WEST_TO_EAST:
            default:
                sortedPois.sort((a, b) => a.longitude - b.longitude);
                break;
        }

        const sortedToOriginalIndex = new Map<string, number>();
        sortedPois.forEach((poi, index) => {
            const originalIndex = clusteredPois.findIndex(
                (origPoi) =>
                    origPoi.latitude === poi.latitude &&
                    origPoi.longitude === poi.longitude,
            );
            if (originalIndex === -1) {
                console.warn(
                    `POI not found in clusteredPois: ${poi.latitude},${poi.longitude}`,
                );
            }
            sortedToOriginalIndex.set(
                this.getPoiKey(poi),
                originalIndex === -1 ? index : originalIndex,
            );
        });

        const n = sortedPois.length;
        const dp: number[][] = Array(n)
            .fill(0)
            .map(() => Array(n).fill(Infinity));
        const next: number[][] = Array(n)
            .fill(0)
            .map(() => Array(n).fill(-1));

        for (let i = 0; i < n; i++) {
            dp[i][i] = 0;
            if (i < n - 1) {
                const origI =
                    sortedToOriginalIndex.get(this.getPoiKey(sortedPois[i])) ||
                    i;
                const origJ =
                    sortedToOriginalIndex.get(
                        this.getPoiKey(sortedPois[i + 1]),
                    ) || i + 1;

                // console.log(
                //     'durationMatrix',
                //     origI,
                //     origJ,
                //     durationMatrix[origI]?.[origJ],
                // );
                if (
                    origI === undefined ||
                    origJ === undefined ||
                    origI < 0 ||
                    origJ < 0 ||
                    durationMatrix[origI] === undefined ||
                    durationMatrix[origI][origJ] === undefined
                ) {
                    throw new Error(
                        `Invalid index: origI=${origI}, origJ=${origJ}`,
                    );
                }

                let combinedTime = durationMatrix[origI][origJ];

                const metadata = clusteredMetadata[origJ];
                if (metadata) {
                    const visitDuration = this.getVisitDuration(
                        metadata.category,
                        metadata.subCategory,
                    );
                    combinedTime += visitDuration * 60;
                }

                dp[i][i + 1] = combinedTime;
                next[i][i + 1] = i + 1;
            }
        }

        for (let l = 3; l <= n; l++) {
            for (let i = 0; i <= n - l; i++) {
                const j = i + l - 1;

                for (let k = i + 1; k < j; k++) {
                    const origK =
                        sortedToOriginalIndex.get(
                            this.getPoiKey(sortedPois[k]),
                        ) || k;
                    const origJ =
                        sortedToOriginalIndex.get(
                            this.getPoiKey(sortedPois[j]),
                        ) || j;

                    let travelTime = durationMatrix[origK][origJ];

                    let totalTime = dp[i][k] + travelTime;
                    if (j < n - 1) {
                        const metadata = clusteredMetadata[origJ];
                        if (metadata) {
                            const visitDuration = this.getVisitDuration(
                                metadata.category,
                                metadata.subCategory,
                            );
                            totalTime += visitDuration * 60;
                        }
                    }

                    if (totalTime < dp[i][j]) {
                        dp[i][j] = totalTime;
                        next[i][j] = k;
                    }
                }
            }
        }

        const route: Coordinate[] = [];
        this.reconstructBitonicPath(
            0,
            sortedPois.length - 1,
            sortedPois,
            next,
            route,
        );

        if (
            route[0].latitude !== clusteredPois[0].latitude ||
            route[0].longitude !== clusteredPois[0].longitude
        ) {
            route.unshift(clusteredPois[0]);
        }

        if (
            route[route.length - 1].latitude !==
                clusteredPois[clusteredPois.length - 1].latitude ||
            route[route.length - 1].longitude !==
                clusteredPois[clusteredPois.length - 1].longitude
        ) {
            route.push(clusteredPois[clusteredPois.length - 1]);
        }

        let travelDuration = 0;
        let visitTime = 0;

        const coordToIndex = new Map<string, number>();
        clusteredPois.forEach((poi, index) => {
            const key = `${poi.latitude},${poi.longitude}`;
            coordToIndex.set(key, index);
        });

        const routeIndices = route
            .map((point) => {
                const key = `${point.latitude},${point.longitude}`;
                return coordToIndex.get(key) || -1;
            })
            .filter((index) => index !== -1);

        const totalDistance = calculateRouteMetric(
            route,
            distanceMatrix,
            coordToIndex,
        );

        for (let i = 0; i < route.length - 1; i++) {
            const key1 = `${route[i].latitude},${route[i].longitude}`;
            const key2 = `${route[i + 1].latitude},${route[i + 1].longitude}`;
            const origI = coordToIndex.get(key1);
            const origJ = coordToIndex.get(key2);

            if (origI !== undefined && origJ !== undefined) {
                travelDuration += durationMatrix[origI][origJ];
            } else {
                console.warn(
                    `Coordinates not found in matrix: ${key1} or ${key2}`,
                );

                break;
            }

            if (i < route.length - 1) {
                const metadata = clusteredMetadata[origI];
                if (metadata) {
                    const duration = this.getVisitDuration(
                        metadata.category,
                        metadata.subCategory,
                    );
                    visitTime += duration * 60;
                }
            }
        }

        const totalTime = travelDuration + visitTime;
        const bitonicRoute = new Route(
            route,
            totalDistance,
            travelDuration,
            visitTime / 60,
            totalTime / 60,
        );

        const expandedRoute = expandClusteredRoute(
            bitonicRoute,
            clusteredMetadata,
            pois,
            true,
        );

        return expandedRoute;

        // return {
        //     optimalRoute: expandedRoute,
        //     matrices: {
        //         distance: distanceMatrix,
        //         duration: durationMatrix
        //     }
        // };
    }

    private reconstructBitonicPath(
        i: number,
        j: number,
        pois: Coordinate[],
        next: number[][],
        route: Coordinate[],
    ): void {
        if (i === j) {
            route.push(pois[i]);
            return;
        }

        if (j === i + 1) {
            route.push(pois[i]);
            route.push(pois[j]);
            return;
        }

        const k = next[i][j];
        this.reconstructBitonicPath(i, k, pois, next, route);
        this.reconstructBitonicPath(k, j, pois, next, route);
    }

    private getPoiKey(poi: Coordinate): string {
        return `${poi.latitude},${poi.longitude}`;
    }
}

export default BitonicService;
