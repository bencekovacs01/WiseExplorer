import axios, { AxiosInstance } from 'axios';
import Coordinate from '../models/Coordinate';
import Route from '../models/Route';
import CategoryDurations from '../components/CategorySelector/category_times.json';
import { IPoiData } from '../models/models';
import { clusterNearbyPOIs } from '../utils/cluster.utils';
import { metricsService } from './MetricsService';
import { expandClusteredRoute, getRouteMatrices } from '../utils/route.utils';

export class Ant {
  public tour: number[];
  public distanceTraveled: number;

  constructor(startNode: number) {
    this.tour = [startNode];
    this.distanceTraveled = 0;
  }

  visitNode(node: number, distance: number) {
    this.tour.push(node);
    this.distanceTraveled += distance;
  }
}

interface ACOOptions {
  distanceMatrix: number[][];
  numAnts: number;
  alpha: number;
  beta: number;
  evaporationRate: number;
  iterations: number;
}

export class ACO {
  private distanceMatrix: number[][];
  private numAnts: number;
  private alpha: number;
  private beta: number;
  private evaporationRate: number;
  private iterations: number;
  private pheromones: number[][];
  private ants: Ant[] = [];
  private inverseDistances: number[][];

  constructor(options: ACOOptions) {
    this.distanceMatrix = options.distanceMatrix;
    this.numAnts = options.numAnts;
    this.alpha = options.alpha;
    this.beta = options.beta;
    this.evaporationRate = options.evaporationRate;
    this.iterations = options.iterations;
    this.pheromones = this.initializePheromones();
    this.inverseDistances = this.computeInverseDistances();
  }

  initializePheromones(): number[][] {
    const n = this.distanceMatrix.length;
    return Array.from({ length: n }, () => Array(n).fill(1));
  }

  computeInverseDistances(): number[][] {
    return this.distanceMatrix.map((row) =>
      row.map((distance) => (distance === 0 ? 0 : 1 / distance)),
    );
  }

  calculateProbability(ant: Ant, currentNode: number): number[] {
    const probabilities = Array(this.distanceMatrix.length).fill(0);
    const pheromone = this.pheromones[currentNode];
    const distances = this.inverseDistances[currentNode];

    let denominator = 0;
    for (let i = 0; i < pheromone.length; i++) {
      if (!ant.tour.includes(i)) {
        denominator +=
          Math.pow(pheromone[i], this.alpha) *
          Math.pow(distances[i], this.beta);
      }
    }

    for (let i = 0; i < pheromone.length; i++) {
      if (!ant.tour.includes(i)) {
        const numerator =
          Math.pow(pheromone[i], this.alpha) *
          Math.pow(distances[i], this.beta);
        probabilities[i] = numerator / denominator;
      }
    }
    return probabilities;
  }

  chooseNextNode(probabilities: number[]): number {
    const random = Math.random();
    let cumulativeProbability = 0;

    for (let i = 0; i < probabilities.length; i++) {
      cumulativeProbability += probabilities[i];
      if (random <= cumulativeProbability) {
        return i;
      }
    }
    return -1;
  }

  updatePheromones() {
    const pheromoneMultiplier = 1.0 / this.numAnts;
    const n = this.distanceMatrix.length;

    this.pheromones = this.pheromones.map((row) =>
      row.map((pher) => pher * (1 - this.evaporationRate)),
    );

    this.ants.forEach((ant) => {
      const { tour, distanceTraveled } = ant;
      const pheromoneUpdate = pheromoneMultiplier / distanceTraveled;

      tour.slice(0, -1).forEach((from, index) => {
        const to = tour[index + 1];
        this.pheromones[from][to] += pheromoneUpdate;
        this.pheromones[to][from] += pheromoneUpdate;
      });
    });
  }

  async run(
    callback?: (
      iteration: number,
      bestTour: number[] | null,
      bestDistance: number,
      antsTours: number[][],
      pheromones?: number[][],
    ) => void,
  ): Promise<{ bestTour: number[] | null; bestDistance: number }> {
    let bestTour: number[] | null = null;
    let bestDistance = Infinity;

    for (let iter = 0; iter < this.iterations; iter++) {
      this.ants = [];

      for (let antIndex = 0; antIndex < this.numAnts; antIndex++) {
        const startNode = 0;
        const ant = new Ant(startNode);

        for (let i = 0; i < this.distanceMatrix.length - 1; i++) {
          const currentNode = ant.tour[ant.tour.length - 1];
          const probabilities = this.calculateProbability(ant, currentNode);
          const nextNode = this.chooseNextNode(probabilities);
          if (nextNode !== -1) {
            ant.visitNode(nextNode, this.distanceMatrix[currentNode][nextNode]);
          }
        }
        ant.visitNode(
          startNode,
          this.distanceMatrix[ant.tour[ant.tour.length - 1]][startNode],
        );
        this.ants.push(ant);
      }

      this.updatePheromones();

      const antsTours = this.ants.map((ant) => [...ant.tour]);

      this.ants.forEach((ant) => {
        if (ant.distanceTraveled < bestDistance) {
          bestDistance = ant.distanceTraveled;
          bestTour = [...ant.tour];
        }
      });

      if (callback) {
        callback(iter, bestTour, bestDistance, antsTours, this.pheromones);
      }

      // await new Promise((resolve) => setTimeout(resolve, 50));
    }

    return { bestTour, bestDistance };
  }

  getPheromones(): number[][] {
    return this.pheromones;
  }
}

/**
 * AcoService provides methods to find routes using the Ant Colony Optimization algorithm.
 * ACO is a metaheuristic optimization algorithm inspired by the foraging behavior of ants.
 * It uses pheromone trails and heuristic information to find good solutions to the TSP.
 */
export class AcoService {
  private client: AxiosInstance = axios.create();
  private ORS_KEY: string = process.env.ORS_KEY as string;
  private matrixBaseUrl: string =
    'https://api.openrouteservice.org/v2/matrix/driving-car';
  private categoryDurations: Record<
    string,
    Record<string, { duration: number; unit: string }>
  > = CategoryDurations || {};

  constructor() {
    if (!this.ORS_KEY) {
      throw new Error('Cannot fetch OpenRouteService API key!');
    }
  }

  /**
   * Finds the optimal route using Ant Colony Optimization algorithm.
   * @param pois Array of coordinates representing points of interest.
   * @param poiMetadata Optional metadata about POIs including category information
   * @param maxClusterDistance Maximum distance to consider for clustering nearby POIs
   * @returns A promise that resolves to an array of Route objects.
   */
  public async findOptimalRoute(
    pois: Coordinate[],
    poiMetadata?: IPoiData[],
    maxClusterDistance: number = 100,
  ): Promise<Route[]> {
    const startTime = performance.now();

    try {
      const result = await this.findOptimalRouteInternal(
        pois,
        poiMetadata,
        maxClusterDistance,
      );

      const endTime = performance.now();
      const executionTime = endTime - startTime;

      metricsService.recordMetric({
        algorithmName: 'ACO',
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
        algorithmName: 'ACO',
        nodeCount: pois.length,
        executionTimeMs: executionTime,
        timestamp: Date.now(),
      });

      throw error;
    }
  }

  /**
   * Internal method to find optimal route using ACO algorithm with clustering.
   */
  private async findOptimalRouteInternal(
    pois: Coordinate[],
    poiMetadata?: IPoiData[],
    maxClusterDistance: number = 100,
  ): Promise<Route> {
    if (pois.length < 2) {
      throw new Error('At least 2 POIs are required for route optimization');
    }

    const { clusteredPois, clusteredMetadata } = clusterNearbyPOIs(
      pois,
      maxClusterDistance,
      poiMetadata,
    );

    const routeMatrices = await getRouteMatrices(clusteredPois);
    const distanceMatrix = routeMatrices.distanceMatrix;
    const durationMatrix = routeMatrices.durationMatrix;

    const numNodes = clusteredPois.length;
    const acoOptions: ACOOptions = {
      distanceMatrix,
      numAnts: Math.min(numNodes, 20),
      alpha: 1.0,
      beta: 2.0,
      evaporationRate: 0.1,
      iterations: Math.min(100, numNodes * 2),
    };

    const aco = new ACO(acoOptions);
    const { bestTour } = await aco.run();

    if (!bestTour) {
      throw new Error('ACO algorithm failed to find a solution');
    }

    let totalDistance = 0;
    let totalDuration = 0;

    for (let i = 0; i < bestTour.length - 1; i++) {
      const fromIndex = bestTour[i];
      const toIndex = bestTour[i + 1];
      totalDistance += distanceMatrix[fromIndex][toIndex];
      totalDuration += durationMatrix[fromIndex][toIndex];
    }

    const route: Route = new Route(
      bestTour.map((index: number) => clusteredPois[index]),
      totalDistance,
      totalDuration / 60,
      0,
      0,
    );

    if (clusteredMetadata && clusteredMetadata.length > 0) {
      let visitTime = 0;
      for (let i = 1; i < clusteredMetadata.length - 1; i++) {
        const metadata = clusteredMetadata[i];
        if (metadata && metadata.clusteredIds) {
          for (const origPOIIndex of metadata.clusteredIds) {
            const origMetadata = poiMetadata?.[origPOIIndex];
            visitTime +=
              this.getVisitDuration(
                origMetadata?.category || undefined,
                origMetadata?.subCategory || undefined,
              ) * 60;
          }
        }
      }
      route.visitTime = visitTime / 60;
      route.totalTime = (route.duration ?? 0) + visitTime;
      console.log('route.duration', totalDuration, visitTime);
      route.duration = totalDuration + visitTime / 60;
    }

    if (clusteredPois.length < pois.length) {
      return expandClusteredRoute(route, clusteredMetadata, pois);
    }

    return route;
  }

  /**
   * Get visit duration for a POI category
   */
  private getVisitDuration(category?: string, subCategory?: string): number {
    if (!category) return 15;

    const categoryData = this.categoryDurations[category];
    if (!categoryData) return 15;

    if (subCategory && categoryData[subCategory]) {
      return categoryData[subCategory].duration;
    }

    const durations = Object.values(categoryData).map((item) => item.duration);
    return (
      durations.reduce((sum, duration) => sum + duration, 0) / durations.length
    );
  }
}

export default AcoService;
