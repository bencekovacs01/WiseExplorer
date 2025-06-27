import Coordinate from '../models/Coordinate';
import Route from '../models/Route';
import { expandClusteredRoute } from '../utils/route.utils';
import { metricsService } from './MetricsService';
import { IPoiData } from '../models/models';
import matrices from '../../matrices_output.json';
import { clusterNearbyPOIs } from '../utils/cluster.utils';
import CategoryDurations from '../components/CategorySelector/category_times.json';

/**
 * GreedyService provides methods to find the minimum distance route among a set of points using greedy method.
 */
class GreedyService {
    private categoryDurations: Record<
        string,
        Record<string, { duration: number; unit: string }>
    > = CategoryDurations || {};

    /**
     * Finds the minimum distance route among a set of points using greedy nearest neighbor.
     * @param pois Array of coordinates representing points of interest.
     * @param poiMetadata Optional metadata about POIs including category information
     * @returns A promise that resolves to an array of Route objects.
     */
    public async findMinimumDistanceRoute(
        pois: Coordinate[],
        poiMetadata?: IPoiData[],
    ): Promise<Route[]> {
        const startTime = performance.now();

        try {
            const result = await this.findGreedyRoute(pois, poiMetadata);

            const endTime = performance.now();
            const executionTime = endTime - startTime;

            metricsService.recordMetric({
                algorithmName: 'Greedy',
                nodeCount: pois.length,
                executionTimeMs: executionTime,
                routeDistance: result.totalDistance,
                routeDuration: result.duration,
                routeVisitTime: result.visitTime,
                routeTotalTime: result.totalTime,
                timestamp: Date.now(),
            });

            return [result];
        } catch (error) {
            const endTime = performance.now();
            const executionTime = endTime - startTime;

            metricsService.recordMetric({
                algorithmName: 'Greedy',
                nodeCount: pois.length,
                executionTimeMs: executionTime,
                timestamp: Date.now(),
            });

            throw error;
        }
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
     * Internal method to find greedy route using nearest neighbor heuristic.
     * @param pois Array of coordinates representing points of interest.
     * @param poiMetadata Optional metadata about POIs
     * @returns A promise that resolves to a Route object.
     */
    private async findGreedyRoute(
        pois: Coordinate[],
        poiMetadata?: IPoiData[],
    ): Promise<Route> {
        const { clusteredPois, clusteredMetadata } = clusterNearbyPOIs(
            pois,
            100,
            poiMetadata,
        );

        const matrices = await this.getRouteMatrices(clusteredPois);
        const distanceMatrix = matrices.distanceMatrix;
        const durationMatrix = matrices.durationMatrix;

        const n = clusteredPois.length;

        if (n <= 1) {
            return new Route(clusteredPois, 0);
        }

        if (n === 2) {
            const routeCoordinates = [
                clusteredPois[0],
                clusteredPois[1],
                clusteredPois[0],
            ];
            const totalDistance = distanceMatrix[0][1] * 2;
            const totalDuration = durationMatrix[0][1] * 2;

            let visitTime = 0;
            if (clusteredMetadata && clusteredMetadata.length > 1) {
                const metadata = clusteredMetadata[1];
                if (metadata && metadata.clusteredIds) {
                    for (const origPOIIndex of metadata.clusteredIds) {
                        const origMetadata = poiMetadata?.[origPOIIndex];
                        visitTime +=
                            this.getVisitDuration(
                                origMetadata?.category,
                                origMetadata?.subCategory,
                            ) * 60;
                    }
                }
            }

            const duration = totalDuration / 60;
            const totalTime = (duration + visitTime) / 60;

            const route = new Route(
                routeCoordinates,
                totalDistance,
                duration,
                visitTime,
                totalTime,
            );

            return route;
        }

        const visited = new Array(n).fill(false);
        const route: number[] = [0];
        visited[0] = true;
        let totalDistance = 0;
        let totalDuration = 0;

        let currentIndex = 0;

        for (let step = 1; step < n; step++) {
            let nearestIndex = -1;
            let minDistance = Number.MAX_VALUE;

            for (let i = 0; i < n; i++) {
                if (
                    !visited[i] &&
                    distanceMatrix[currentIndex][i] < minDistance
                ) {
                    minDistance = distanceMatrix[currentIndex][i];
                    nearestIndex = i;
                }
            }

            visited[nearestIndex] = true;
            route.push(nearestIndex);
            totalDistance += distanceMatrix[currentIndex][nearestIndex];
            totalDuration += durationMatrix[currentIndex][nearestIndex];
            currentIndex = nearestIndex;
        }

        route.push(0);
        totalDistance += distanceMatrix[currentIndex][0];
        totalDuration += durationMatrix[currentIndex][0];

        const routeCoordinates = route.map((index) => clusteredPois[index]);

        let visitTime = 0;
        if (clusteredMetadata) {
            for (let i = 1; i < clusteredMetadata.length - 1; i++) {
                const metadata = clusteredMetadata[i];
                if (metadata && metadata.clusteredIds) {
                    for (const origPOIIndex of metadata.clusteredIds) {
                        const origMetadata = poiMetadata?.[origPOIIndex];
                        visitTime +=
                            this.getVisitDuration(
                                origMetadata?.category,
                                origMetadata?.subCategory,
                            ) * 60;
                    }
                }
            }
        }

        const duration = totalDuration;
        const totalTime = duration + visitTime;

        const clusteredRoute = new Route(
            routeCoordinates,
            totalDistance,
            totalDuration + visitTime / 60,
            visitTime / 60,
            totalTime / 60,
        );

        const expandedRoute = expandClusteredRoute(
            clusteredRoute,
            clusteredMetadata || [],
            pois,
        );

        return expandedRoute;
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

        return 30;
    }
}

export default GreedyService;
