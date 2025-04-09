import axios, { AxiosInstance } from 'axios';
import Coordinate from '../models/Coordinate';
import Route from '../models/Route';
import { FeatureCollection } from '../models/FeatureCollection';
import * as fs from 'fs';
import * as path from 'path';

import CategoryDurations from '../components/CategorySelector/category_times.json';

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
        if (!category || !subCategory) return 30; // Default duration if category info missing

        try {
            const duration =
                this.categoryDurations?.[category]?.[subCategory]?.duration;
            return duration || 30; // Return the duration or default to 30 minutes
        } catch (error) {
            return 30; // Default to 30 minutes on error
        }
    }

    /**
     * Calculates the optimal route using backtracking, considering travel duration and visit durations.
     * @param pois Array of coordinates representing points of interest
     * @param distanceMatrix Optional distance matrix between points
     * @param durationMatrix Optional duration matrix between points
     * @param poiMetadata Optional metadata about POIs including category information
     * @returns A promise that resolves to the optimal route
     */
    // public async findMinimumTimeRouteBt(
    //     pois: Coordinate[],
    //     distanceMatrix?: number[][],
    //     durationMatrix?: number[][],
    //     poiMetadata?: Array<{
    //         category?: string | null;
    //         subCategory?: string | null;
    //     }>,
    // ): Promise<Route> {
    //     // If matrices weren't provided, fetch them
    //     if (!distanceMatrix || !durationMatrix) {
    //         const matrices = await this.getRouteMatrices(pois);
    //         distanceMatrix = matrices.distanceMatrix;
    //         durationMatrix = matrices.durationMatrix;
    //     }

    //     const permutations = this.getPermutationsBt(pois);
    //     let minRoute: Route | null = null;
    //     let minTotalTime = Number.MAX_VALUE;

    //     // Find the route with minimum total time (travel time + visit time)
    //     for (const permutation of permutations) {
    //         // Calculate travel time between POIs
    //         const travelTime = this.calculateRouteMetric(
    //             permutation,
    //             durationMatrix,
    //         );

    //         // Calculate visit time at each POI
    //         let visitTime = 0;
    //         for (let i = 0; i < permutation.length; i++) {
    //             // Skip calculating visit time for start and end points
    //             if (i === 0 || i === permutation.length - 1) continue;

    //             // Get POI metadata if available
    //             const metadata = poiMetadata?.[i];
    //             visitTime += this.getVisitDuration(
    //                 metadata?.category,
    //                 metadata?.subCategory,
    //             );
    //         }

    //         // Total time is travel time + visit time
    //         const totalTime = travelTime + visitTime;

    //         if (totalTime < minTotalTime) {
    //             minTotalTime = totalTime;

    //             // Calculate distance for this route as well
    //             const totalDistance = this.calculateRouteMetric(
    //                 permutation,
    //                 distanceMatrix,
    //             );

    //             minRoute = new Route(permutation, totalDistance);
    //             minRoute.duration = travelTime;
    //             minRoute.visitTime = visitTime;
    //             minRoute.totalTime = totalTime;
    //         }
    //     }

    //     return minRoute as Route;
    // }

    /**
     * Backwards compatible method that calls the new time-optimized route finder
     */
    public async findMinimumDistanceRouteBt(
        pois: Coordinate[],
        poiMetadata?: Array<{ category?: string; subCategory?: string }>,
    ): Promise<Route> {
        return this.findMinimumTimeRouteBt(
            pois,
            poiMetadata,
        );
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
        const payloadCoords = coordinates.map((coord) => [
            coord.longitude,
            coord.latitude,
        ]);
        const jsonContent = {
            locations: payloadCoords,
            metrics: ['distance', 'duration'],
        };

        const response = await this.client
            .post(this.matrixBaseUrl, jsonContent, {
                headers: {
                    Authorization: this.ORS_KEY,
                    'Content-Type': 'application/json',
                },
            })
            .catch((error) => {
                console.error('Matrix_error:', error?.response?.data);
                throw new Error(`Matrix_error: ${error?.response?.data}`);
            });

        return {
            distanceMatrix: response.data.distances,
            durationMatrix: response.data.durations,
        };
    }

    public async findMinimumTimeRouteBt(
        pois: Coordinate[],
        poiMetadata?: Array<{
            category?: string | null;
            subCategory?: string | null;
        }>,
    ): Promise<Route> {
        // Cluster nearby POIs
        const { clusteredPois, clusteredMetadata } = this.clusterNearbyPOIs(
            pois,
            100,
            poiMetadata,
        );

        // Recalculate matrices for clustered POIs
        let clusterDistanceMatrix = [];
        let clusterDurationMatrix = [];

        const matrices = await this.getRouteMatrices(clusteredPois);
        clusterDistanceMatrix = matrices.distanceMatrix;
        clusterDurationMatrix = matrices.durationMatrix;

        // Find optimal route using clustered POIs
        const permutations = this.getPermutationsBt(clusteredPois);
        let minRoute: Route | null = null;
        let minTotalTime = Number.MAX_VALUE;

        // Find the route with minimum total time (travel time + visit time)
        for (const permutation of permutations) {
            // Calculate travel time between POIs
            const travelTime = this.calculateRouteMetric(
                permutation,
                clusterDurationMatrix,
            );

            // Calculate visit time at each POI
            let visitTime = 0;
            for (let i = 0; i < permutation.length; i++) {
                // Skip calculating visit time for start and end points
                if (i === 0 || i === permutation.length - 1) continue;

                // Get the cluster metadata
                const metadata = clusteredMetadata?.[i];
                console.log('metadata', metadata)
                console.log('metadata.clusteredIds', metadata.clusteredIds)

                // Calculate visit time for all POIs in this cluster
                if (metadata && metadata.clusteredIds) {
                    for (const origPOIIndex of metadata.clusteredIds) {
                        const origMetadata = poiMetadata?.[origPOIIndex];
                        visitTime += this.getVisitDuration(
                            origMetadata?.category,
                            origMetadata?.subCategory,
                        );
                    }
                }
            }

            // Total time is travel time + visit time
            const totalTime = travelTime + visitTime;

            if (totalTime < minTotalTime) {
                minTotalTime = totalTime;

                // Calculate distance for this route as well
                const totalDistance = this.calculateRouteMetric(
                    permutation,
                    clusterDistanceMatrix,
                );

                minRoute = new Route(permutation, totalDistance);
                minRoute.duration = travelTime;
                minRoute.visitTime = visitTime;
                minRoute.totalTime = totalTime;
            }
        }

        // When returning the route, map the clustered POIs back to original POIs
        // to preserve all points for display
        if (minRoute) {
            const expandedRoute = this.expandClusteredRoute(
                minRoute,
                clusteredMetadata,
                pois,
            );

            return expandedRoute;
        }

        // Fallback in case no route is found
        return new Route(pois, 0);
    }

    /**
     * Calculates a route metric (distance or duration) based on the given matrix
     * @param route An array of coordinates representing the route
     * @param matrix The matrix (distance or duration) to use for calculation
     * @returns The total metric value for the route
     */
    private calculateRouteMetric(
        route: Coordinate[],
        matrix: number[][],
    ): number {
        let total = 0;
        for (let i = 0; i < route.length - 1; i++) {
            total += matrix[i][i + 1];
        }
        return total;
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

    /**
     * Clusters nearby POIs for routing efficiency but preserves all POIs for display
     * @param pois Array of coordinates representing points of interest
     * @param maxClusterDistance Maximum distance (in meters) to consider POIs as part of the same cluster
     * @param poiMetadata Metadata for each POI
     * @returns Clustered POIs and updated metadata with reference to original POIs
     */
    private clusterNearbyPOIs(
        pois: Coordinate[],
        maxClusterDistance: number = 100, // 100 meters by default
        poiMetadata?: Array<{
            category?: string | null;
            subCategory?: string | null;
        }>,
    ): {
        clusteredPois: Coordinate[];
        clusteredMetadata: Array<{
            category?: string | null;
            subCategory?: string | null;
            clusteredIds: number[];
        }>;
    } {
        // Don't cluster start and end points
        const startPoint = pois[0];
        const endPoint = pois[pois.length - 1];

        // Skip processing if we only have start and end points
        if (pois.length <= 2) {
            return {
                clusteredPois: pois,
                clusteredMetadata:
                    poiMetadata?.map((meta, index) => ({
                        ...meta,
                        clusteredIds: [index],
                    })) || [],
            };
        }

        // Get the POIs between start and end
        const poiList = pois.slice(1, pois.length - 1);
        const metadataList =
            poiMetadata?.slice(1, poiMetadata.length - 1) || [];

        const clusters: number[][] = [];
        const visited = new Set<number>();

        // Create clusters based on proximity
        for (let i = 0; i < poiList.length; i++) {
            if (visited.has(i)) continue;

            const cluster = [i];
            visited.add(i);

            for (let j = 0; j < poiList.length; j++) {
                if (i === j || visited.has(j)) continue;

                // Calculate distance between POIs
                const distance = this.calculateHaversineDistance(
                    poiList[i].latitude,
                    poiList[i].longitude,
                    poiList[j].latitude,
                    poiList[j].longitude,
                );

                if (distance <= maxClusterDistance) {
                    cluster.push(j);
                    visited.add(j);
                }
            }

            clusters.push(cluster);
        }

        // Create clustered POIs and metadata
        const clusteredPois: Coordinate[] = [startPoint];
        const clusteredMetadata: Array<{
            category?: string | null;
            subCategory?: string | null;
            clusteredIds: number[];
        }> = [{ category: null, subCategory: null, clusteredIds: [0] }];

        for (const cluster of clusters) {
            // Use the first POI in the cluster as the representative point for navigation
            const representativePOI = poiList[cluster[0]];
            clusteredPois.push(representativePOI);

            // Store all POI indices that belong to this cluster (add 1 to account for start point)
            const clusterMetadata = {
                category: metadataList[cluster[0]]?.category || null,
                subCategory: metadataList[cluster[0]]?.subCategory || null,
                clusteredIds: cluster.map((idx) => idx + 1), // Add 1 because we removed the start point
            };
            clusteredMetadata.push(clusterMetadata);
        }

        // Add end point
        clusteredPois.push(endPoint);
        clusteredMetadata.push({
            category: null,
            subCategory: null,
            clusteredIds: [pois.length - 1],
        });

        return { clusteredPois, clusteredMetadata };
    }

    /**
     * Calculate distance between two points using the Haversine formula
     */
    private calculateHaversineDistance(
        lat1: number,
        lon1: number,
        lat2: number,
        lon2: number,
    ): number {
        const R = 6371e3; // Earth radius in meters
        const φ1 = (lat1 * Math.PI) / 180;
        const φ2 = (lat2 * Math.PI) / 180;
        const Δφ = ((lat2 - lat1) * Math.PI) / 180;
        const Δλ = ((lon2 - lon1) * Math.PI) / 180;

        const a =
            Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        return R * c; // distance in meters
    }

    /**
     * Expands a clustered route back to include all original POIs for display
     */
    private expandClusteredRoute(
        clusteredRoute: Route,
        clusteredMetadata: Array<{
            category?: string | null;
            subCategory?: string | null;
            clusteredIds: number[];
        }>,
        originalPois: Coordinate[],
    ): Route {
        if (!clusteredRoute) return clusteredRoute;

        // Create a mapping to reconstruct the full route with all POIs
        const expandedPoints: Coordinate[] = [];
        const visitedOriginalIndices = new Set<number>();

        // For each point in the clustered route
        for (let i = 0; i < clusteredRoute.points.length; i++) {
            const metadata = clusteredMetadata[i];

            // Add all POIs from this cluster
            if (metadata && metadata.clusteredIds) {
                for (const origIndex of metadata.clusteredIds) {
                    if (!visitedOriginalIndices.has(origIndex)) {
                        expandedPoints.push(originalPois[origIndex]);
                        visitedOriginalIndices.add(origIndex);
                    }
                }
            }
        }

        // Create a new route with all original POIs but preserving the optimal order
        const expandedRoute = new Route(
            expandedPoints,
            clusteredRoute.totalDistance,
            clusteredRoute.duration,
            clusteredRoute.visitTime,
            clusteredRoute.totalTime,
        );

        // Store the clustering information for the frontend
        expandedRoute.clusterInfo = clusteredMetadata;

        return expandedRoute;
    }
}
