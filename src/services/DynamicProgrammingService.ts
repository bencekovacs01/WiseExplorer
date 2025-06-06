import axios, { AxiosInstance } from 'axios';
import Coordinate from '../models/Coordinate';
import Route from '../models/Route';
import { IPoiData } from '../models/models';

import CategoryDurations from '../components/CategorySelector/category_times.json';
import { clusterNearbyPOIs } from '../utils/cluster.utils';
import { expandClusteredRoute, getRouteMatrices } from '../utils/route.utils';

/**
 * DynamicProgrammingService provides methods to find the optimal route
 * among a set of points using the Held-Karp dynamic programming algorithm
 */
export class DynamicProgrammingService {
    private ORS_KEY: string = process.env.ORS_KEY as string;
    private categoryDurations: Record<
        string,
        Record<string, { duration: number; unit: string }>
    > = CategoryDurations || {};

    /**
     * Creates an instance of DynamicProgrammingService.
     * @throws Will throw an error if the OpenRouteService API key is not set.
     */
    constructor() {
        if (!this.ORS_KEY) {
            throw new Error('Cannot fetch OpenRouteService API key!');
        }
    }

    /**
     * Finds the minimum time route among a set of points using dynamic programming.
     * This method optimizes for total time (travel time + visit time).
     *
     * @param pois Array of coordinates representing points of interest.
     * @param poiMetadata Optional metadata about POIs including category information
     * @param maxClusterDistance Maximum distance to consider for clustering nearby POIs
     * @returns A promise that resolves to an array of Route objects.
     */
    public async findMinimumTimeRoute(
        pois: Coordinate[],
        poiMetadata?: IPoiData[],
        maxClusterDistance: number = 100,
    ): Promise<Route[]> {
        return [
            await this.findOptimalRoute(pois, poiMetadata, maxClusterDistance),
        ];
    }

    /**
     * Finds the optimal route using the Held-Karp dynamic programming algorithm with clustering.
     * @param pois Array of coordinates representing points of interest
     * @param poiMetadata Optional metadata about POIs including category information
     * @param maxClusterDistance Maximum distance to consider for clustering nearby POIs
     * @returns A promise that resolves to the optimal Route
     */
    private async findOptimalRoute(
        pois: Coordinate[],
        poiMetadata?: IPoiData[],
        maxClusterDistance: number = 100,
    ): Promise<Route> {
        const { clusteredPois, clusteredMetadata } = clusterNearbyPOIs(
            pois,
            maxClusterDistance,
            poiMetadata,
        );

        const matrices = await getRouteMatrices(clusteredPois);
        const distanceMatrix = matrices.distanceMatrix;
        const durationMatrix = matrices.durationMatrix;

        const n = clusteredPois.length;

        if (n <= 1) {
            return new Route(clusteredPois, 0);
        }

        if (n === 2) {
            const route = new Route(clusteredPois, distanceMatrix[0][1]);
            route.duration = durationMatrix[0][1];

            // Calculate visit time
            let visitTime = 0;
            if (clusteredMetadata && clusteredMetadata.length > 0) {
                const metadata = clusteredMetadata[1];
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

            route.visitTime = visitTime;
            route.totalTime = route.duration + visitTime * 60;

            return route;
        }

        const visitDurations: number[] = clusteredPois.map((_, index) => {
            if (index === 0) return 0;

            let visitTime = 0;
            const metadata = clusteredMetadata[index];
            if (metadata && metadata.clusteredIds) {
                for (const origPOIIndex of metadata.clusteredIds) {
                    const origMetadata = poiMetadata?.[origPOIIndex];
                    const duration = this.getVisitDuration(
                        origMetadata?.category,
                        origMetadata?.subCategory,
                    );
                    visitTime += duration * 60;
                    console.log(
                        `POI ${index}, origPOI ${origPOIIndex}, category: ${
                            origMetadata?.category
                        }, subCategory: ${
                            origMetadata?.subCategory
                        }, duration: ${duration} minutes (${
                            duration * 60
                        } seconds)`,
                    );
                }
            } else {
                visitTime = this.getVisitDuration(null, null) * 60;
                console.log(
                    `POI ${index} has no metadata, using default duration: ${visitTime} seconds`,
                );
            }
            return visitTime;
        });

        console.log(
            'Visit durations for all POIs (seconds):',
            visitDurations.map((d) => `${d}s (${(d / 60).toFixed(1)}min)`),
        );

        const memo = new Map<string, [number, number]>();

        const allVisitedMask = (1 << n) - 1;

        for (let city = 1; city < n; city++) {
            const mask = (1 << 0) | (1 << city);
            const key = this.createMemoKey(mask, city);
            const totalTime = durationMatrix[0][city] + visitDurations[city];
            memo.set(key, [totalTime, 0]);
            console.log(
                `Base case: mask=${mask.toString(
                    2,
                )}, city=${city}, time=${totalTime}`,
            );
        }

        for (let subsetSize = 3; subsetSize <= n; subsetSize++) {
            const subsets = this.generateSubsets(n, subsetSize);

            for (const subset of subsets) {
                if ((subset & (1 << 0)) === 0) continue;

                for (let lastCity = 1; lastCity < n; lastCity++) {
                    if ((subset & (1 << lastCity)) === 0) continue;

                    const key = this.createMemoKey(subset, lastCity);
                    let minTotalTime = Infinity;
                    let minParent = -1;

                    const prevSubset = subset & ~(1 << lastCity);
                    for (let prevCity = 0; prevCity < n; prevCity++) {
                        if ((prevSubset & (1 << prevCity)) === 0) continue;
                        if (prevCity === lastCity) continue;

                        const prevKey = this.createMemoKey(
                            prevSubset,
                            prevCity,
                        );
                        if (memo.has(prevKey)) {
                            const [prevTotalTime, _] = memo.get(prevKey)!;
                            const newTotalTime =
                                prevTotalTime +
                                durationMatrix[prevCity][lastCity] +
                                visitDurations[lastCity];

                            if (newTotalTime < minTotalTime) {
                                minTotalTime = newTotalTime;
                                minParent = prevCity;
                            }
                        }
                    }

                    if (minTotalTime < Infinity) {
                        memo.set(key, [minTotalTime, minParent]);
                        console.log(
                            `DP: subset=${subset.toString(
                                2,
                            )}, lastCity=${lastCity}, time=${minTotalTime}, parent=${minParent}`,
                        );
                    }
                }
            }
        }

        let minTotalTime = Infinity;
        let lastCity = -1;

        console.log(
            `Finding optimal last city to visit before returning to start...`,
        );

        for (let city = 1; city < n; city++) {
            const key = this.createMemoKey(allVisitedMask, city);
            if (memo.has(key)) {
                const [totalTime, parent] = memo.get(key)!;
                const completeTime = totalTime + durationMatrix[city][0];
                console.log(
                    `City ${city}: total time = ${totalTime}, parent = ${parent}, complete time = ${completeTime}`,
                );

                if (completeTime < minTotalTime) {
                    minTotalTime = completeTime;
                    lastCity = city;
                    console.log(
                        `New best last city: ${lastCity} with time: ${minTotalTime}`,
                    );
                }
            }
        }

        if (lastCity === -1) {
            console.error(
                'Could not find a valid tour - this should not happen',
            );
            const fallbackPath = Array.from({ length: n }, (_, i) => i);
            fallbackPath.push(0); // Return to start

            let fallbackDistance = 0;
            let fallbackDuration = 0;
            let fallbackVisitTime = 0;

            for (let i = 0; i < fallbackPath.length - 1; i++) {
                const fromIndex = fallbackPath[i];
                const toIndex = fallbackPath[i + 1];

                fallbackDistance += distanceMatrix[fromIndex][toIndex];
                fallbackDuration += durationMatrix[fromIndex][toIndex];

                if (toIndex !== 0) {
                    fallbackVisitTime += visitDurations[toIndex];
                }
            }

            const fallbackRoute = new Route(
                fallbackPath.map((index) => clusteredPois[index]),
                fallbackDistance,
            );
            fallbackRoute.duration = fallbackDuration;
            fallbackRoute.visitTime = fallbackVisitTime / 60;
            fallbackRoute.totalTime = fallbackDuration + fallbackVisitTime;

            return expandClusteredRoute(
                fallbackRoute,
                clusteredMetadata,
                pois,
                false,
            );
        }

        const path: number[] = [];
        let currentMask = allVisitedMask;
        let currentCity = lastCity;

        console.log(
            `Starting path reconstruction with lastCity: ${lastCity}, minTotalTime: ${minTotalTime}`,
        );

        while (currentCity !== -1) {
            path.unshift(currentCity);
            const key = this.createMemoKey(currentMask, currentCity);
            if (memo.has(key)) {
                const [time, parent] = memo.get(key)!;
                console.log(
                    `Added city ${currentCity} to path, parent: ${parent}, time: ${time}`,
                );
                currentMask = currentMask & ~(1 << currentCity);
                currentCity = parent;
            } else {
                console.log(
                    `No memo entry found for city ${currentCity}, mask ${currentMask.toString(
                        2,
                    )}`,
                );
                break;
            }
        }

        if (path[0] !== 0) {
            path.unshift(0);
        }
        path.push(0);

        console.log(`Final reconstructed path: ${path.join(' -> ')}`);

        const optimalPoints: Coordinate[] = path.map(
            (index) => clusteredPois[index],
        );

        let totalDistance = 0;
        let totalDuration = 0;
        let totalVisitTime = 0;

        if (path.length < 2) {
            console.error('Path is too short to calculate distance/duration.');
        } else {
            for (let i = 0; i < path.length - 1; i++) {
                const fromIndex = path[i];
                const toIndex = path[i + 1];
                if (
                    fromIndex >= 0 &&
                    toIndex >= 0 &&
                    fromIndex < n &&
                    toIndex < n
                ) {
                    totalDistance += distanceMatrix[fromIndex][toIndex];
                    if (i < path.length - 2) {
                        totalDuration += durationMatrix[fromIndex][toIndex];
                    }
                    console.log(
                        `Segment ${i}: from ${fromIndex} to ${toIndex}, distance: ${distanceMatrix[fromIndex][toIndex]}, duration: ${durationMatrix[fromIndex][toIndex]}`,
                    );
                } else {
                    console.warn(
                        `Invalid index in path: from ${fromIndex} to ${toIndex}`,
                    );
                }
            }
        }

        const visitedPOIs = new Set<number>();
        for (let i = 1; i < path.length - 1; i++) {
            const cityIndex = path[i];
            if (!visitedPOIs.has(cityIndex)) {
                visitedPOIs.add(cityIndex);
                totalVisitTime += visitDurations[cityIndex];
            }
        }
        console.log('totalVisitTime', totalVisitTime, totalDuration);

        const totalTime = totalDuration + totalVisitTime;

        const route = new Route(optimalPoints, totalDistance);
        route.duration = totalDuration;
        route.visitTime = totalVisitTime / 60;
        route.totalTime = totalTime / 60;

        return expandClusteredRoute(route, clusteredMetadata, pois, false);
    }

    /**
     * Creates a unique key for the memoization table
     * @param mask Bitmask representing visited cities
     * @param lastCity The last city visited
     * @returns A string key
     */
    private createMemoKey(mask: number, lastCity: number): string {
        return `${mask},${lastCity}`;
    }

    /**
     * Generate all subsets of given size from n cities
     * @param n Total number of cities
     * @param size Size of subsets to generate
     * @returns Array of bitmasks representing subsets
     */
    private generateSubsets(n: number, size: number): number[] {
        const subsets: number[] = [];

        const generateCombinations = (
            start: number,
            currentSubset: number,
            remaining: number,
        ) => {
            if (remaining === 0) {
                subsets.push(currentSubset);
                return;
            }

            for (let i = start; i <= n - remaining; i++) {
                generateCombinations(
                    i + 1,
                    currentSubset | (1 << i),
                    remaining - 1,
                );
            }
        };

        generateCombinations(0, 0, size);
        return subsets;
    }

    /**
     * Get visit duration for a POI category
     * @param category The category of the POI
     * @param subCategory The sub-category of the POI
     * @returns Visit duration in minutes, default to 30 if not found
     */
    private getVisitDuration(
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
}

export default DynamicProgrammingService;
