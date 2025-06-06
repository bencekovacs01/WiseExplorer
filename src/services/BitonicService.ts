import Coordinate from '../models/Coordinate';
import Route from '../models/Route';
import { orsApi } from '../utils/apiWrapper';

import CategoryDurations from '../components/CategorySelector/category_times.json';
import axios, { AxiosInstance } from 'axios';
import { IPoiData } from '../models/models';
import { clusterNearbyPOIs } from '../utils/cluster.utils';
import {
    calculateRouteMetric,
    expandClusteredRoute,
    getRouteMatrices,
} from '../utils/route.utils';

export enum SortStrategy {
    WEST_TO_EAST = 'west-to-east', // Default W-E
    EAST_TO_WEST = 'east-to-west', // E-W
    SOUTH_TO_NORTH = 'south-to-north', // S-N
    NORTH_TO_SOUTH = 'north-to-south', // N-S
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
        // Using shared implementation from route.utils.ts
        return getRouteMatrices(coordinates);
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
        if (pois.length < 2) {
            throw new Error(
                'At least start and end points are required for route calculation',
            );
        }

        // Cluster nearby POIs for efficiency
        const { clusteredPois, clusteredMetadata } = clusterNearbyPOIs(
            pois,
            maxClusterDistance,
            poiMetadata,
        );

        // Get distance and duration matrices
        const { distanceMatrix, durationMatrix } = await this.getRouteMatrices(
            clusteredPois,
        );

        // Create a copy for sorting
        const sortedPois = [...clusteredPois];

        // Sort based on selected strategy
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
            case SortStrategy.WEST_TO_EAST:
            default:
                sortedPois.sort((a, b) => a.longitude - b.longitude);
                break;
        }

        // Create index mapping from sorted to original
        const sortedToOriginalIndex = new Map<string, number>();
        sortedPois.forEach((poi, index) => {
            const originalIndex = clusteredPois.findIndex(
                (origPoi) =>
                    origPoi.latitude === poi.latitude &&
                    origPoi.longitude === poi.longitude,
            );
            sortedToOriginalIndex.set(this.getPoiKey(poi), originalIndex);
        });

        // Create distance matrix
        const n = sortedPois.length;
        const dp: number[][] = Array(n)
            .fill(0)
            .map(() => Array(n).fill(Infinity));
        const next: number[][] = Array(n)
            .fill(0)
            .map(() => Array(n).fill(-1));

        // Initialize base cases
        for (let i = 0; i < n; i++) {
            dp[i][i] = 0;
            if (i < n - 1) {
                // Use duration matrix instead of distance matrix for optimization
                const origI =
                    sortedToOriginalIndex.get(this.getPoiKey(sortedPois[i])) ||
                    i;
                const origJ =
                    sortedToOriginalIndex.get(
                        this.getPoiKey(sortedPois[i + 1]),
                    ) || i + 1;

                // Calculate total time: travel time + visit time
                let combinedTime = durationMatrix[origI][origJ];

                // Add visit time for middle point (not for start/end if this is a 2-point path)
                // No visit time for destination point
                const metadata = clusteredMetadata[origJ];
                if (metadata) {
                    const visitDuration = this.getVisitDuration(
                        metadata.category,
                        metadata.subCategory,
                    );
                    combinedTime += visitDuration * 60; // Convert minutes to seconds
                }

                dp[i][i + 1] = combinedTime;
                next[i][i + 1] = i + 1;
            }
        }

        // Dynamic programming to build the bitonic tour optimized for total time
        for (let l = 3; l <= n; l++) {
            for (let i = 0; i <= n - l; i++) {
                const j = i + l - 1;

                // Try all possible connections from i to j
                for (let k = i + 1; k < j; k++) {
                    // Use travel time + visit time for optimization
                    const origK =
                        sortedToOriginalIndex.get(
                            this.getPoiKey(sortedPois[k]),
                        ) || k;
                    const origJ =
                        sortedToOriginalIndex.get(
                            this.getPoiKey(sortedPois[j]),
                        ) || j;

                    // Calculate travel time between these points
                    let travelTime = durationMatrix[origK][origJ];

                    // Add visit time for the destination point (if not the final destination)
                    // No visit time for the very last point in the tour
                    let totalTime = dp[i][k] + travelTime;
                    if (j < n - 1) {
                        const metadata = clusteredMetadata[origJ];
                        if (metadata) {
                            const visitDuration = this.getVisitDuration(
                                metadata.category,
                                metadata.subCategory,
                            );
                            totalTime += visitDuration * 60; // Convert minutes to seconds
                        }
                    }

                    if (totalTime < dp[i][j]) {
                        dp[i][j] = totalTime;
                        next[i][j] = k;
                    }
                }
            }
        }

        // Reconstruct the route
        const route: Coordinate[] = [];
        this.reconstructBitonicPath(
            0,
            sortedPois.length - 1,
            sortedPois,
            next,
            route,
        );

        // Ensure start and end points are preserved
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

        // Calculate total distance and time
        let travelDuration = 0;
        let visitTime = 0;

        // Create a mapping of coordinates to their indices in the clusteredPois array
        const coordToIndex = new Map<string, number>();
        clusteredPois.forEach((poi, index) => {
            const key = `${poi.latitude},${poi.longitude}`;
            coordToIndex.set(key, index);
        });

        // Transform route into indices for matrix calculations
        const routeIndices = route
            .map((point) => {
                const key = `${point.latitude},${point.longitude}`;
                return coordToIndex.get(key) || -1;
            })
            .filter((index) => index !== -1);

        // Use the shared utility to calculate total distance
        const totalDistance = calculateRouteMetric(
            route,
            distanceMatrix,
            coordToIndex,
        );

        // Calculate travel duration
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
                // Don't add visit time for the last point (destination)
                const metadata = clusteredMetadata[origI];
                if (metadata) {
                    const duration = this.getVisitDuration(
                        metadata.category,
                        metadata.subCategory,
                    );
                    visitTime += duration * 60; // Convert minutes to seconds
                }
            }
        }

        // Add visit time for current POI

        console.log('totalDistance', totalDistance);
        const totalTime = travelDuration + visitTime;
        // Create the route object with all metrics
        const bitonicRoute = new Route(
            route,
            totalDistance,
            travelDuration, // Travel duration in seconds
            visitTime / 60, // Visit time in minutes for reporting
            totalTime / 60, // Total time in minutes
        );

        // Expand the route to include all original POIs
        const expandedRoute = expandClusteredRoute(
            bitonicRoute,
            clusteredMetadata,
            pois,
            true, // Use point-based matching
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

    /**
     * Helper method to recursively reconstruct the bitonic path
     */
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

    /**
     * Generate a unique key for a POI based on coordinates
     */
    private getPoiKey(poi: Coordinate): string {
        return `${poi.latitude},${poi.longitude}`;
    }

    // Using expandClusteredRoute from route.utils.ts
}

export default BitonicService;
