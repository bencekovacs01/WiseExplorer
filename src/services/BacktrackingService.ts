import axios, { AxiosInstance } from 'axios';
import Coordinate from '../models/Coordinate';
import Route from '../models/Route';
import { FeatureCollection } from '../models/FeatureCollection';
import { POIService } from './POIService';

/**
 * BacktrackingService provides methods to find the minimum distance route among a set of points using the backtracking method.
 */
export class BacktrackingService {
    private client: AxiosInstance = axios.create();
    private ORS_KEY: string = process.env.ORS_KEY as string;
    private matrixBaseUrl: string =
        'https://api.openrouteservice.org/v2/matrix/driving-car';
    private poiService: POIService = new POIService();

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
     * Calculates the minimum distance route using backtracking.
     * @param start The starting coordinate.
     * @param end The ending coordinate.
     * @param buffer The buffer distance for POI search.
     * @returns A promise that resolves to the minimum distance route.
     */
    public async findMinimumDistanceRouteBt(
        start: Coordinate,
        end: Coordinate,
        buffer: number = 250,
    ): Promise<Route> {
        const standardPois = await this.poiService.getPOIsStandard(
            start,
            end,
            buffer,
        );

        const pois = this.extractPointsFromResponse(standardPois);

        pois.push(new Coordinate(start.latitude, start.longitude));
        pois.push(new Coordinate(end.latitude, end.longitude));

        if (buffer > 250) {
            return new Route(pois, 0);
        }

        const payloadPois = pois.map((poi) => [poi.longitude, poi.latitude]);
        const jsonContent = {
            locations: payloadPois,
            metrics: ['distance'],
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

        const distanceMatrix: number[][] = response.data.distances;

        const permutations = this.getPermutationsBt(pois);
        let minRoute: Route | null = null;
        let minDistance = Number.MAX_VALUE;

        for (const permutation of permutations) {
            const totalDistance = this.calculateRouteDistance(
                permutation,
                distanceMatrix,
            );
            if (totalDistance < minDistance) {
                minDistance = totalDistance;
                minRoute = new Route(permutation, totalDistance);
            }
        }

        return minRoute as Route;
    }

    /**
     * Extracts coordinates from a JSON response.
     * @param jsonString The JSON string containing POI data.
     * @returns An array of coordinates.
     */
    private extractPointsFromResponse(jsonString: string): Coordinate[] {
        try {
            const featureCollection: FeatureCollection = JSON.parse(jsonString);
            const points: Coordinate[] = [];

            if (!featureCollection.features) {
                return points;
            }

            for (const feature of featureCollection?.features) {
                const coordinates = feature?.geometry?.coordinates;
                points.push(new Coordinate(coordinates?.[1], coordinates?.[0]));
            }

            return points;
        } catch (error) {
            console.error('Parse_error:', error);
            throw new Error(`Parse_error: ${error}`);
        }
    }

    /**
     * Calculates the total distance of a route based on a distance matrix.
     * @param route An array of coordinates representing the route.
     * @param distanceMatrix A 2D array representing the distance matrix.
     * @returns The total distance of the route.
     */
    private calculateRouteDistance(
        route: Coordinate[],
        distanceMatrix: number[][],
    ): number {
        let totalDistance = 0;
        for (let i = 0; i < route.length - 1; i++) {
            totalDistance += distanceMatrix[i][i + 1];
        }
        return totalDistance;
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
