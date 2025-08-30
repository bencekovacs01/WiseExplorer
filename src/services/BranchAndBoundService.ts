import axios, { AxiosInstance } from 'axios';
import Coordinate from '../models/Coordinate';
import Route from '../models/Route';
import { IPoiData } from '../models/models';
import { metricsService } from './MetricsService';

import CategoryDurations from '../components/CategorySelector/category_times.json';
import { clusterNearbyPOIs } from '../utils/cluster.utils';
import {
  calculateRouteMetric,
  getRouteMatrices,
  expandClusteredRoute,
} from '../utils/route.utils';
import matrices from '../../matrices_output.json';
import { write } from 'fs';

/**
 * Interface representing a node in the branch and bound tree
 */
interface BBNode {
  path: number[]; // Current path (indices of points)
  visited: Set<number>; // Set of indices of visited points
  cost: number; // Current cost of the path
  bound: number; // Lower bound on possible complete solutions
  level: number; // Level in the search tree (number of points visited)
}

/**
 * BranchAndBoundService provides methods to find the minimum distance route
 * among a set of points using branch and bound algorithm with optimization.
 */
class BranchAndBoundService {
  private client: AxiosInstance = axios.create();
  private ORS_KEY: string = process.env.ORS_KEY as string;
  private matrixBaseUrl: string =
    'https://api.openrouteservice.org/v2/matrix/driving-car';
  private categoryDurations: Record<
    string,
    Record<string, { duration: number; unit: string }>
  > = CategoryDurations || {};

  /**
   * Creates an instance of BranchAndBoundService.
   * @throws Will throw an error if the OpenRouteService API key is not set.
   */
  constructor() {
    if (!this.ORS_KEY) {
      throw new Error('Cannot fetch OpenRouteService API key!');
    }
  }

  /**
   * Finds the minimum distance route among a set of points using branch and bound.
   * @param pois Array of coordinates representing points of interest.
   * @param poiMetadata Optional metadata about POIs including category information
   * @returns A promise that resolves to an array of Route objects.
   */
  public async findMinimumDistanceRoute(
    pois: Coordinate[],
    poiMetadata?: IPoiData[],
    maxClusterDistance: number = 100,
  ): Promise<Route[]> {
    const startTime = performance.now();

    try {
      const result = await this.findOptimalRoute(
        pois,
        poiMetadata,
        maxClusterDistance,
      );

      const endTime = performance.now();
      const executionTime = endTime - startTime;

      // Record metrics
      metricsService.recordMetric({
        algorithmName: 'BranchAndBound',
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

      // Record failed attempt
      metricsService.recordMetric({
        algorithmName: 'BranchAndBound',
        nodeCount: pois.length,
        executionTimeMs: executionTime,
        timestamp: Date.now(),
      });

      throw error;
    }
  }

  /**
   * Finds the optimal route using branch and bound algorithm with clustering.
   * @param pois Array of coordinates representing points of interest
   * @param poiMetadata Optional metadata about POIs including category information
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

    const matrices = await this.getRouteMatrices(clusteredPois);
    console.log('clusteredPois', clusteredPois);
    console.log('matrices', matrices);

    // return;

    const distanceMatrix = matrices.distanceMatrix;
    const durationMatrix = matrices.durationMatrix;

    // const fs = await import('fs');
    // const path = await import('path');
    // const outputPath = path.resolve(process.cwd(), 'matrices_output.json');
    // const matricesData = {
    //     distanceMatrix,
    //     durationMatrix,
    // };
    // fs.writeFileSync(
    //     outputPath,
    //     JSON.stringify(matricesData, null, 2),
    //     'utf-8',
    // );
    // console.log(`Matrices written to ${outputPath}`);

    // return null;

    // Write matrices to a file for debugging
    // const fs = await import('fs');
    // const path = await import('path');
    // const outputPath = path.resolve(process.cwd(), 'matrices_output.json');
    // const matricesData = {
    //     distanceMatrix,
    //     durationMatrix,
    // };
    // fs.writeFileSync(outputPath, JSON.stringify(matricesData, null, 2), 'utf-8');
    // console.log(`Matrices written to ${outputPath}`);

    const n = clusteredPois.length;

    // If there are only 1 or 2 points, return direct path
    if (n <= 2) {
      const route = new Route(
        clusteredPois,
        n === 2 ? distanceMatrix[0][1] : 0,
      );
      route.duration = durationMatrix[0][1] ?? 0;

      // Calculate visit time for any POIs (excluding start/end)
      let visitTime = 0;
      if (clusteredMetadata && clusteredMetadata.length > 0) {
        for (let i = 1; i < clusteredMetadata.length - 1; i++) {
          const metadata = clusteredMetadata[i];
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
      }
      route.visitTime = visitTime;
      route.totalTime = (route.duration ?? 0) + visitTime * 60; // Convert minutes to seconds for totalTime
      return route;
    }

    // Initialize branch and bound algorithm
    const queue: BBNode[] = [];
    let bestPath: number[] = [];
    let bestCost = Number.MAX_VALUE;

    // Create the root node (always start from point 0)
    const rootNode: BBNode = {
      path: [0],
      visited: new Set([0]),
      cost: 0,
      bound: this.calculateLowerBound(durationMatrix, [0], n),
      level: 1,
    };

    queue.push(rootNode);

    // Branch and bound main loop
    while (queue.length > 0) {
      // Find node with minimum bound (priority queue behavior)
      let minIndex = 0;
      for (let i = 1; i < queue.length; i++) {
        if (queue[i].bound < queue[minIndex].bound) {
          minIndex = i;
        }
      }

      const currentNode = queue.splice(minIndex, 1)[0];

      // Prune this branch if its bound is higher than the best solution
      if (currentNode.bound >= bestCost) {
        continue;
      }

      // If we've visited all cities, check if we can complete the tour
      if (currentNode.level === n) {
        const lastPoint = currentNode.path[currentNode.path.length - 1];
        const startPoint = currentNode.path[0];
        const returnCost = durationMatrix[lastPoint][startPoint];

        const totalCost = currentNode.cost + returnCost;

        if (totalCost < bestCost) {
          // Complete the cycle by returning to the start
          const completePath = [...currentNode.path, startPoint];
          bestCost = totalCost;
          bestPath = [...currentNode.path];
        }
        continue;
      }

      // Try to visit each unvisited city
      for (let i = 0; i < n; i++) {
        if (!currentNode.visited.has(i)) {
          const lastVisited = currentNode.path[currentNode.path.length - 1];
          const nextCost = currentNode.cost + durationMatrix[lastVisited][i];

          // Create a new node
          const newVisited = new Set(currentNode.visited);
          newVisited.add(i);

          const newPath = [...currentNode.path, i];

          const newNode: BBNode = {
            path: newPath,
            visited: newVisited,
            cost: nextCost,
            bound: this.calculateLowerBound(
              durationMatrix,
              Array.from(newVisited),
              n,
            ),
            level: currentNode.level + 1,
          };

          // Only add the node if its bound is better than best cost
          if (newNode.bound < bestCost) {
            queue.push(newNode);
          }
        }
      }
    }

    // Create the optimal route using the best path
    const optimalPoints: Coordinate[] = [];
    let totalDistance = 0;
    let totalDuration = 0;

    for (let i = 0; i < bestPath.length; i++) {
      optimalPoints.push(clusteredPois[bestPath[i]]);

      if (i > 0) {
        const fromIndex = bestPath[i - 1];
        const toIndex = bestPath[i];
        totalDistance += distanceMatrix[fromIndex][toIndex];
        totalDuration += durationMatrix[fromIndex][toIndex];
      }
    }

    // Add the end point (return to start)
    if (bestPath.length > 0) {
      optimalPoints.push(clusteredPois[0]); // Return to start
      totalDistance += distanceMatrix[bestPath[bestPath.length - 1]][0];
      totalDuration += durationMatrix[bestPath[bestPath.length - 1]][0];
    }

    // Calculate visit time for POIs
    let visitTime = 0;
    if (bestPath.length > 0) {
      for (const index of bestPath) {
        // Skip first and last points (start/end)
        if (index === 0) continue;

        const metadata = clusteredMetadata[index];
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

    const totalTime = totalDuration + visitTime;

    // Create the route object
    const route = new Route(optimalPoints, totalDistance);
    route.duration = totalDuration;
    route.visitTime = visitTime / 60; // Convert seconds to minutes for visitTime
    route.totalTime = totalTime / 60; // Convert minutes to seconds for totalTime

    // Expand the clustered route to include all original POIs
    return expandClusteredRoute(route, clusteredMetadata, pois, false);
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
   * Calculates a lower bound for a partial solution using MST approximation.
   * @param durationMatrix The duration matrix between all points.
   * @param visited Array of indices of visited points.
   * @param totalPoints Total number of points.
   * @returns A lower bound for any complete solution extending the partial one.
   */
  private calculateLowerBound(
    durationMatrix: number[][],
    visited: number[],
    totalPoints: number,
  ): number {
    // If all points are visited, the bound is 0
    if (visited.length === totalPoints) {
      return 0;
    }

    let bound = 0;
    const current = visited[visited.length - 1];

    // Add the minimum outgoing edge from the current vertex
    let minOutgoing = Number.MAX_VALUE;
    for (let j = 0; j < totalPoints; j++) {
      if (!visited.includes(j) && durationMatrix[current][j] < minOutgoing) {
        minOutgoing = durationMatrix[current][j];
      }
    }

    if (minOutgoing !== Number.MAX_VALUE) {
      bound += minOutgoing;
    }

    // Add minimum outgoing edge from each unvisited vertex
    for (let i = 0; i < totalPoints; i++) {
      if (!visited.includes(i)) {
        let min = Number.MAX_VALUE;
        for (let j = 0; j < totalPoints; j++) {
          if (i !== j && durationMatrix[i][j] < min) {
            min = durationMatrix[i][j];
          }
        }
        if (min !== Number.MAX_VALUE) {
          bound += min;
        }
      }
    }

    // Add minimum incoming edge to the start vertex
    if (visited.length > 1) {
      // Only if we have more than just the start vertex
      let minIncoming = Number.MAX_VALUE;
      for (let i = 0; i < totalPoints; i++) {
        if (!visited.includes(i) && durationMatrix[i][0] < minIncoming) {
          minIncoming = durationMatrix[i][0];
        }
      }
      if (minIncoming !== Number.MAX_VALUE) {
        bound += minIncoming;
      }
    }

    return bound;
  }

  /**
   * Gets the distance and duration matrices for a set of coordinates.
   * @param coordinates Array of coordinates to calculate matrices for
   * @returns An object containing distance and duration matrices
   */
  // private async getRouteMatrices(coordinates: Coordinate[]): Promise<{
  //     distanceMatrix: number[][];
  //     durationMatrix: number[][];
  // }> {
  //     // Use static matrices from matrices_output.json
  //     return {
  //         distanceMatrix: (matrices as any).distanceMatrix,
  //         durationMatrix: (matrices as any).durationMatrix,
  //     };
  // }

  public async getRouteMatrices(coordinates: Coordinate[]): Promise<{
    distanceMatrix: number[][];
    durationMatrix: number[][];
  }> {
    // return getRouteMatrices(coordinates);
    // Use static matrices from matrices_output.json
    return {
      distanceMatrix: (matrices as any).distanceMatrix,
      durationMatrix: (matrices as any).durationMatrix,
    };
  }

  /**
   * Clusters nearby POIs for routing efficiency but preserves all POIs for display
   * @param pois Array of coordinates representing points of interest
   * @param maxClusterDistance Maximum distance (in meters) to consider POIs as part of the same cluster
   * @param poiMetadata Metadata for each POI
   * @returns Clustered POIs and updated metadata with reference to original POIs
   */
  // private clusterNearbyPOIs(
  //     pois: Coordinate[],
  //     maxClusterDistance: number = 100, // 100 meters by default
  //     poiMetadata?: IPoiData[],
  // ): {
  //     clusteredPois: Coordinate[];
  //     clusteredMetadata: Array<{
  //         category?: string | null;
  //         subCategory?: string | null;
  //         clusteredIds: number[];
  //     }>;
  // } {
  //     // Don't cluster start and end points
  //     const startPoint = pois[0];
  //     const endPoint = pois[pois.length - 1];

  //     // Skip processing if we only have start and end points
  //     if (pois.length <= 2) {
  //         return {
  //             clusteredPois: pois,
  //             clusteredMetadata:
  //                 poiMetadata?.map((meta, index) => ({
  //                     ...meta,
  //                     clusteredIds: [index],
  //                 })) || [],
  //         };
  //     }

  //     // Get the POIs between start and end
  //     const poiList = pois.slice(1, pois.length - 1);
  //     const metadataList =
  //         poiMetadata?.slice(1, poiMetadata.length - 1) || [];

  //     const clusters: number[][] = [];
  //     const visited = new Set<number>();

  //     // Create clusters based on proximity
  //     for (let i = 0; i < poiList.length; i++) {
  //         if (visited.has(i)) continue;

  //         const cluster = [i];
  //         visited.add(i);

  //         for (let j = 0; j < poiList.length; j++) {
  //             if (i === j || visited.has(j)) continue;

  //             // Calculate distance between POIs
  //             const distance = this.calculateHaversineDistance(
  //                 poiList[i].latitude,
  //                 poiList[i].longitude,
  //                 poiList[j].latitude,
  //                 poiList[j].longitude,
  //             );

  //             if (distance <= maxClusterDistance) {
  //                 cluster.push(j);
  //                 visited.add(j);
  //             }
  //         }

  //         clusters.push(cluster);
  //     }

  //     // Create clustered POIs and metadata
  //     const clusteredPois: Coordinate[] = [startPoint];
  //     const clusteredMetadata: Array<{
  //         category?: string | null;
  //         subCategory?: string | null;
  //         clusteredIds: number[];
  //     }> = [{ category: null, subCategory: null, clusteredIds: [0] }];

  //     for (const cluster of clusters) {
  //         // Use the first POI in the cluster as the representative point for navigation
  //         const representativePOI = poiList[cluster[0]];
  //         clusteredPois.push(representativePOI);

  //         // Store all POI indices that belong to this cluster (add 1 to account for start point)
  //         const clusterMetadata = {
  //             category: metadataList[cluster[0]]?.category || null,
  //             subCategory: metadataList[cluster[0]]?.subCategory || null,
  //             clusteredIds: cluster.map((idx) => idx + 1), // Add 1 because we removed the start point
  //         };
  //         clusteredMetadata.push(clusterMetadata);
  //     }

  //     // Add end point
  //     clusteredPois.push(endPoint);
  //     clusteredMetadata.push({
  //         category: null,
  //         subCategory: null,
  //         clusteredIds: [pois.length - 1],
  //     });

  //     return { clusteredPois, clusteredMetadata };
  // }

  // /**
  //  * Calculate distance between two points using the Haversine formula
  //  */
  // private calculateHaversineDistance(
  //     lat1: number,
  //     lon1: number,
  //     lat2: number,
  //     lon2: number,
  // ): number {
  //     const R = 6371e3; // Earth radius in meters
  //     const φ1 = (lat1 * Math.PI) / 180;
  //     const φ2 = (lat2 * Math.PI) / 180;
  //     const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  //     const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  //     const a =
  //         Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
  //         Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  //     const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  //     return R * c; // distance in meters
  // }

  // Using expandClusteredRoute from route.utils.ts
}

export default BranchAndBoundService;
