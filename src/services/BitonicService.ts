import Coordinate from '../models/Coordinate';
import Route from '../models/Route';
import { orsApi } from '../utils/apiWrapper';

import CategoryDurations from '../components/CategorySelector/category_times.json';
import axios, { AxiosInstance } from 'axios';

/**
 * BitonicService provides methods to find routes using the bitonic TSP algorithm.
 * The bitonic algorithm produces a tour without crossings by visiting points
 * in non-decreasing x-coordinate order and then non-increasing order.
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
        if (coordinates.length < 2) {
            throw new Error(
                'At least two coordinates are required for matrix calculation',
            );
        }

        const locations = coordinates.map((coord) => [
            coord.longitude,
            coord.latitude,
        ]);

        try {
            const response = await this.client.post(
                `${this.matrixBaseUrl}?api_key=${this.ORS_KEY}`,
                {
                    locations,
                    metrics: ['distance', 'duration'],
                },
                {
                    headers: {
                        Accept: 'application/json, application/geo+json, application/gpx+xml',
                        'Content-Type': 'application/json',
                    },
                },
            );

            const distanceMatrix = response.data.distances;
            const durationMatrix = response.data.durations;

            return { distanceMatrix, durationMatrix };
        } catch (error: any) {
            console.error(
                'Error fetching route matrices:',
                error?.response?.data || error,
            );
            throw new Error('Failed to fetch route matrices');
        }
    }

    // Update the findBitonicRoute method to include time calculations
    public async findBitonicRoute(
        pois: Coordinate[],
        poiMetadata?: Array<{
            category?: string | null;
            subCategory?: string | null;
        }>,
        maxClusterDistance: number = 100,
    ): Promise<Route> {
        if (pois.length < 2) {
            throw new Error(
                'At least start and end points are required for route calculation',
            );
        }

        // Cluster nearby POIs for efficiency
        const { clusteredPois, clusteredMetadata } = this.clusterNearbyPOIs(
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

        // Sort by longitude (x-coordinate)
        sortedPois.sort((a, b) => a.longitude - b.longitude);

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
                // Use actual distance from matrix
                const origI =
                    sortedToOriginalIndex.get(this.getPoiKey(sortedPois[i])) ||
                    i;
                const origJ =
                    sortedToOriginalIndex.get(
                        this.getPoiKey(sortedPois[i + 1]),
                    ) || i + 1;
                dp[i][i + 1] = distanceMatrix[origI][origJ];
                next[i][i + 1] = i + 1;
            }
        }

        // Dynamic programming to build the bitonic tour
        for (let l = 3; l <= n; l++) {
            for (let i = 0; i <= n - l; i++) {
                const j = i + l - 1;

                // Try all possible connections from i to j
                for (let k = i + 1; k < j; k++) {
                    // Use actual distances from matrix
                    const origK =
                        sortedToOriginalIndex.get(
                            this.getPoiKey(sortedPois[k]),
                        ) || k;
                    const origJ =
                        sortedToOriginalIndex.get(
                            this.getPoiKey(sortedPois[j]),
                        ) || j;

                    const newDist = dp[i][k] + distanceMatrix[origK][origJ];

                    if (newDist < dp[i][j]) {
                        dp[i][j] = newDist;
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
        let totalDistance = 0;
        let travelDuration = 0;
        let visitTime = 0;

        // Calculate route metrics using matrices
        for (let i = 0; i < route.length - 1; i++) {
            // Find indices in the original clusteredPois array
            const origI = clusteredPois.findIndex(
                (poi) =>
                    poi.latitude === route[i].latitude &&
                    poi.longitude === route[i].longitude,
            );

            const origJ = clusteredPois.findIndex(
                (poi) =>
                    poi.latitude === route[i + 1].latitude &&
                    poi.longitude === route[i + 1].longitude,
            );

            if (origI !== -1 && origJ !== -1) {
                totalDistance += distanceMatrix[origI][origJ];
                travelDuration += durationMatrix[origI][origJ];
            }

            // Add visit time for current POI
            if (i < route.length - 1) {
                // Don't add visit time for the last point (destination)
                const metadata = clusteredMetadata[origI];
                if (metadata) {
                    const duration = this.getVisitDuration(
                        metadata.category,
                        metadata.subCategory,
                    );
                    visitTime += duration;
                }
            }
        }

        // Create the route object with all metrics
        const bitonicRoute = new Route(
            route,
            totalDistance,
            travelDuration, // Travel duration in seconds
            visitTime, // Visit time in seconds (convert from minutes)
            travelDuration + visitTime, // Total time in seconds
        );

        // Expand the route to include all original POIs
        const expandedRoute = this.expandClusteredRoute(
            bitonicRoute,
            clusteredMetadata,
            pois,
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
     * Clusters nearby POIs for routing efficiency but preserves all POIs for display
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
            const point = clusteredRoute.points[i];

            // Find the metadata entry for this point
            const metadata = clusteredMetadata.find((meta) =>
                meta.clusteredIds.some((id) => {
                    const origPoi = originalPois[id];
                    return (
                        origPoi.latitude === point.latitude &&
                        origPoi.longitude === point.longitude
                    );
                }),
            );

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

export default BitonicService;
