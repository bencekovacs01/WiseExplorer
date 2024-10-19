import axios from 'axios';
import Coordinate from '../models/Coordinate';
import Route from '../models/Route';
import dotenv from 'dotenv';

dotenv.config();

/**
 * GreedyService provides methods to find the minimum distance route among a set of points using greedy method.
 */
class GreedyService {
    private client = axios.create();
    private ORS_KEY = process.env.ORS_KEY as string;
    private openRouteServiceBaseUrl =
        'https://api.openrouteservice.org/v2/directions/driving-car';

    /**
     * Creates an instance of GreedyService.
     * @throws Will throw an error if the OpenRouteService API key is not set.
     */
    constructor() {
        if (!this.ORS_KEY) {
            throw new Error('Cannot fetch OpenRouteService API key!');
        }
    }

    /**
     * Finds the minimum distance route among a set of points.
     * @param pois Array of coordinates representing points of interest.
     * @returns A promise that resolves to an array of Route objects.
     */
    public async findMinimumDistanceRoute(
        pois: Coordinate[],
    ): Promise<Route[]> {
        const points = [...pois];
        let current = points[0];
        points.splice(0, 1);

        const route: Coordinate[] = [current];

        while (points.length > 0) {
            let nearestIndex = -1;
            let minDistance = Number.MAX_VALUE;

            for (const point of points) {
                const distance = await this.getRouteDistance(current, point);
                if (distance < minDistance) {
                    minDistance = distance;
                    nearestIndex = points.indexOf(point);
                }
            }

            current = points[nearestIndex];
            points.splice(nearestIndex, 1);
            route.push(current);
        }

        route.push(route[0]);

        return [new Route(route, await this.getTotalDistance(route))];
    }

    /**
     * Calculates the total distance for a given route.
     * @param route Array of coordinates representing the route.
     * @returns A promise that resolves to the total distance of the route in meters.
     */
    private async getTotalDistance(route: Coordinate[]): Promise<number> {
        let totalDistance = 0;

        for (let i = 0; i < route.length - 1; i++) {
            totalDistance += await this.getRouteDistance(
                route[i],
                route[i + 1],
            );
        }
        return totalDistance;
    }

    /**
     * Fetches the distance between two points from the OpenRouteService API.
     * @param start The starting coordinate.
     * @param end The ending coordinate.
     * @returns A promise that resolves to the distance between the two points in meters.
     * @throws Will throw an error if the API request fails.
     */
    private async getRouteDistance(
        start: Coordinate,
        end: Coordinate,
    ): Promise<number> {
        const startString = `${start.latitude},${start.longitude}`;
        const endString = `${end.latitude},${end.longitude}`;

        try {
            const response = await this.client.get(
                this.openRouteServiceBaseUrl,
                {
                    params: {
                        api_key: this.ORS_KEY,
                        start: startString,
                        end: endString,
                    },
                },
            );
            return this.parseDistanceFromResponse(response.data);
        } catch (error: any) {
            console.error(`Error getting directions: ${error.response.status}`);
            throw new Error(
                `Error getting directions: ${error.response.status}`,
            );
        }
    }

    /**
     * Parses the distance from the OpenRouteService API response.
     * @param responseData The response data from the OpenRouteService API.
     * @returns The distance in meters.
     * @throws Will throw an error if the response data is not in the expected format.
     */
    private parseDistanceFromResponse(responseData: any): number {
        const features = responseData.features;
        if (!features || features.length === 0) {
            console.error('Features property not found or is empty.');
            throw new Error(
                'Failed to parse distance from OpenRouteService response.',
            );
        }

        const properties = features[0].properties;
        if (!properties || !properties.summary) {
            console.error('Properties or Summary property not found.');
            throw new Error(
                'Failed to parse distance from OpenRouteService response.',
            );
        }

        const distance = properties.summary.distance;
        if (typeof distance !== 'number') {
            console.error('Distance property not found or is not a number.');
            throw new Error(
                'Failed to parse distance from OpenRouteService response.',
            );
        }

        return distance;
    }
}

export default GreedyService;
