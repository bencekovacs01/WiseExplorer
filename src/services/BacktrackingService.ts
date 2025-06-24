import axios, { AxiosInstance } from 'axios';
import Coordinate from '../models/Coordinate';
import Route from '../models/Route';
import CategoryDurations from '../components/CategorySelector/category_times.json';
import { IPoiData } from '../models/models';
import { clusterNearbyPOIs } from '../utils/cluster.utils';
import { metricsService } from './MetricsService';
import {
    calculateRouteMetric,
    expandClusteredRoute,
    getRouteMatrices,
} from '../utils/route.utils';
import matrices from '../../matrices_output.json';

export class BacktrackingService {
    private client: AxiosInstance = axios.create();
    private ORS_KEY: string = process.env.ORS_KEY as string;
    private matrixBaseUrl: string =
        'https://api.openrouteservice.org/v2/matrix/driving-car';
    private categoryDurations: Record<
        string,
        Record<string, { duration: number; unit: string }>
    > = CategoryDurations || {};

    /**
     * Creates an instance of BacktrackingService.
     * @throws Will throw an error if the OpenRouteService API key is not set.
     */
    constructor() {
        if (!this.ORS_KEY) {
            throw new Error('Cannot fetch OpenRouteService API key!');
        }
    }

    /**
     * Get visit duration for a POI category
     * @param category The category of the POI
     * @param subCategory The sub-category of the POI
     * @returns Visit duration in minutes, default to 30 if not found
     */
    public getVisitDuration(
        category?: string | null,
        subCategory?: string | null,
    ): number {
        if (!category || !subCategory) return 30;

        try {
            const duration =
                this.categoryDurations?.[category]?.[subCategory]?.duration;
            return duration || 30;
        } catch (error) {
            return 30;
        }
    }

    /**
     * Finds the optimal route between points using backtracking.
     * This method optimizes for total time (travel time + visit time).
     * Both the `findMinimumRouteBt` and `findMinimumDistanceRouteBt` methods now
     * prioritize time optimization including both travel time and visit durations.
     */
    public async findMinimumDistanceRouteBt(
        pois: Coordinate[],
        poiMetadata?: IPoiData[],
    ): Promise<Route> {
        return this.findMinimumRouteBt(pois, poiMetadata);
    }

    /**
     * Gets the distance and duration matrices for a set of coordinates.
     * @param coordinates Array of coordinates to calculate matrices for
     * @returns An object containing distance and duration matrices
     */
    public async getRouteMatrices(coordinates: Coordinate[]): Promise<{
        distanceMatrix: number[][];
        durationMatrix: number[][];
    }> {
        return {
            distanceMatrix: (matrices as any).distanceMatrix,
            durationMatrix: (matrices as any).durationMatrix,
        };
    }

    /**
     * Finds the optimal route between points using backtracking.
     * This method optimizes for total time (travel time + visit time).
     *
     * @param pois Array of coordinates representing points of interest
     * @param poiMetadata Optional metadata about POIs including category information
     * @returns A promise that resolves to the optimal route
     */
    public async findMinimumRouteBt(
        pois: Coordinate[],
        poiMetadata?: IPoiData[],
    ): Promise<Route> {
        const startTime = performance.now();
        
        try {
            const result = await this.findMinimumRouteBtInternal(pois, poiMetadata);
            
            const endTime = performance.now();
            const executionTime = endTime - startTime;
            
            metricsService.recordMetric({
                algorithmName: 'Backtracking',
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
            
            metricsService.recordMetric({
                algorithmName: 'Backtracking',
                nodeCount: pois.length,
                executionTimeMs: executionTime,
                timestamp: Date.now()
            });
            
            throw error;
        }
    }

    private async findMinimumRouteBtInternal(
        pois: Coordinate[],
        poiMetadata?: IPoiData[],
    ): Promise<Route> {
        const { clusteredPois, clusteredMetadata } = clusterNearbyPOIs(
            pois,
            100,
            poiMetadata,
        );

        let clusterDistanceMatrix = [];
        let clusterDurationMatrix = [];

        const matrices = await this.getRouteMatrices(clusteredPois);
        clusterDistanceMatrix = matrices.distanceMatrix;
        clusterDurationMatrix = matrices.durationMatrix;
        const permutations = this.getPermutationsBt(clusteredPois);
        let minRoute: Route | null = null;
        let minTotalDistance = Number.MAX_VALUE;
        for (const permutation of permutations) {
            const totalDistance = calculateRouteMetric(
                permutation,
                clusterDistanceMatrix,
            );

            const travelTime = calculateRouteMetric(
                permutation,
                clusterDurationMatrix,
            );

            let visitTime = 0;
            for (let i = 0; i < permutation.length; i++) {
                if (i === 0 || i === permutation.length - 1) continue;

                const metadata = clusteredMetadata?.[i];
                if (metadata && metadata.clusteredIds) {
                    for (const origPOIIndex of metadata.clusteredIds) {
                        const origMetadata = poiMetadata?.[origPOIIndex];
                        visitTime += this.getVisitDuration(
                            origMetadata?.category,
                            origMetadata?.subCategory,
                        ) * 60;
                    }
                }
            }
            const totalTime = travelTime + visitTime;

            if (totalTime < minTotalDistance) {
                minTotalDistance = totalTime;
                console.log(
                    'Found better total time route:',
                    totalTime,
                    'seconds, distance:',
                    totalDistance,
                );
                minRoute = new Route(permutation, totalDistance);
                minRoute.duration = travelTime;
                minRoute.visitTime = visitTime / 60;
                minRoute.totalTime = totalTime / 60;
            }
        }
        if (!minRoute) {
            return new Route(pois, 0);
        }
        const expandedRoute = expandClusteredRoute(
            minRoute,
            clusteredMetadata,
            pois,
            false,
        );

        return expandedRoute;
    }

    /**
     * Generates all permutations of a list of coordinates using backtracking.
     * @param points An array of coordinates to generate permutations for.
     * @returns An array of permutations where each permutation is an array of coordinates.
     */
    private getPermutationsBt(points: Coordinate[]): Coordinate[][] {
        if (points.length === 1) {
            return [points];
        }

        const permutations: Coordinate[][] = [];

        for (const point of points) {
            const remaining = points.filter((p) => p !== point);
            const subPermutations = this.getPermutationsBt(remaining);
            for (const permutation of subPermutations) {
                permutations.push([point, ...permutation]);
            }
        }
        return permutations;
    }
}
