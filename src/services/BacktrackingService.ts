import axios, { AxiosInstance } from 'axios';
import Coordinate from '../models/Coordinate';
import Route from '../models/Route';
import CategoryDurations from '../components/CategorySelector/category_times.json';
import { IPoiData } from '../models/models';
import { clusterNearbyPOIs } from '../utils/cluster.utils';
import {
    calculateRouteMetric,
    expandClusteredRoute,
    getRouteMatrices,
} from '../utils/route.utils';

/**
 * BacktrackingService provides methods to find the optimal route among a set of points using the backtracking method.
 */
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
        return getRouteMatrices(coordinates);
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
        // Cluster nearby POIs
        const { clusteredPois, clusteredMetadata } = clusterNearbyPOIs(
            pois,
            100,
            poiMetadata,
        );

        // Recalculate matrices for clustered POIs
        let clusterDistanceMatrix = [];
        let clusterDurationMatrix = [];

        const matrices = await this.getRouteMatrices(clusteredPois);
        clusterDistanceMatrix = matrices.distanceMatrix;
        clusterDurationMatrix = matrices.durationMatrix; // Find optimal route using clustered POIs
        const permutations = this.getPermutationsBt(clusteredPois);
        let minRoute: Route | null = null;
        let minTotalDistance = Number.MAX_VALUE; // Find the route with minimum total time
        for (const permutation of permutations) {
            // Calculate total distance for this route
            const totalDistance = calculateRouteMetric(
                permutation,
                clusterDistanceMatrix,
            );

            // Calculate travel time and visit time to store on the route
            const travelTime = calculateRouteMetric(
                permutation,
                clusterDurationMatrix,
            );

            // Calculate visit time at each POI
            let visitTime = 0;
            for (let i = 0; i < permutation.length; i++) {
                // Skip calculating visit time for start and end points
                if (i === 0 || i === permutation.length - 1) continue;

                // Get the cluster metadata
                const metadata = clusteredMetadata?.[i];                // Calculate visit time for all POIs in this cluster
                if (metadata && metadata.clusteredIds) {
                    for (const origPOIIndex of metadata.clusteredIds) {
                        const origMetadata = poiMetadata?.[origPOIIndex];
                        visitTime += this.getVisitDuration(
                            origMetadata?.category,
                            origMetadata?.subCategory,
                        ) * 60; // Convert minutes to seconds to match duration matrix units
                    }
                }
            } // Calculate total time (travel time + visit time)
            const totalTime = travelTime + visitTime;

            // Now optimizing for total time (travel + visit time)
            if (totalTime < minTotalDistance) {
                // reusing minTotalDistance variable, but for time now
                minTotalDistance = totalTime;
                console.log(
                    'Found better total time route:',
                    totalTime,
                    'seconds, distance:',
                    totalDistance,
                );                minRoute = new Route(permutation, totalDistance);
                minRoute.duration = travelTime;
                minRoute.visitTime = visitTime / 60; // Convert back to minutes for reporting
                minRoute.totalTime = totalTime / 60; // Convert back to minutes for reporting
            }
        }
        if (!minRoute) {
            // Fallback in case no route is found
            return new Route(pois, 0);
        }
        // When returning the route, map the clustered POIs back to original POIs
        // to preserve all points for display
        const expandedRoute = expandClusteredRoute(
            minRoute,
            clusteredMetadata,
            pois,
            false, // Use index-based matching (default)
        );

        return expandedRoute;
    } // Using shared calculateRouteMetric from route.utils.ts

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
    } // Using expandClusteredRoute from route.utils.ts
}
