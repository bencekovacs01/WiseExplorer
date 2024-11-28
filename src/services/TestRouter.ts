// src/services/TestRouter.ts

import L from 'leaflet';
import 'leaflet-routing-machine';

/**
 * Interface for routing options.
 */
interface TestRouterOptions {
    serviceUrl?: string;
    profile?: string; // e.g., 'driving-car', 'cycling-regular'
    language?: string;
    apiKey?: string;
}

/**
 * Interface for route summary.
 */
interface RouteSummary {
    totalDistance: number; // in meters
    totalTime: number; // in seconds
}

/**
 * Interface for a complete route.
 */
interface Route extends L.Routing.IRoute {
    summary: RouteSummary;
    coordinates: L.LatLng[];
    instructions: L.Routing.IInstruction[];
}

/**
 * TestRouter implements the L.Routing.IRouter interface using OpenRouteService V2.
 * It handles routing requests by communicating with the ORS API and processing responses.
 */
class TestRouter implements L.Routing.IRouter {
    private serviceUrl?: string;
    private profile?: string;
    private language?: string;
    private apiKey?: string;

    /**
     * Constructor for TestRouter.
     * @param options - Configuration options for the router.
     */
    constructor(options: TestRouterOptions) {
        this.serviceUrl =
            options.serviceUrl ||
            'https://api.openrouteservice.org/v2/directions';
        this.profile = options.profile || 'driving-car';
        this.language = options.language || 'en';
        this.apiKey = options.apiKey || process.env.ORS_KEY;

        if (!this.apiKey) {
            throw new Error('OpenRouteService API key is required');
        }
    }

    /**
     * Routes waypoints and returns route data via the callback.
     * @param waypoints - Array of waypoints to route between.
     * @param callback - Function to handle routing result or error.
     * @param context - Optional context for the callback.
     */
    route(
        waypoints: L.Routing.Waypoint[],
        callback: (err?: any, routes?: Route[]) => void,
        context?: any,
    ): void {
        if (waypoints.length < 2) {
            callback(
                new Error('At least two waypoints are required'),
                undefined,
            );
            return;
        }

        const coordinates = waypoints.map((wp) => [
            wp.latLng.lng,
            wp.latLng.lat,
        ]);

        const url = `${this.serviceUrl}/${this.profile}/geojson`;

        fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: this.apiKey || '',
            },
            body: JSON.stringify({
                coordinates: coordinates,
                instructions: true,
                language: this.language,
            }),
        })
            .then((response) => {
                if (!response.ok) {
                    throw new Error(`ORS API error: ${response.statusText}`);
                }
                return response.json();
            })
            .then((data) => {
                const routes: Route[] = data.features.map((feature: any) => {
                    const coords = feature.geometry.coordinates.map(
                        (coord: [number, number]) =>
                            new L.LatLng(coord[1], coord[0]),
                    );

                    const summary: RouteSummary = {
                        totalDistance: feature.properties.summary.distance,
                        totalTime: feature.properties.summary.duration,
                    };

                    const instructions: Instruction[] =
                        feature.properties.segments[0].steps.map(
                            (step: any, index: number) => ({
                                text: step.instruction,
                                distance: step.distance,
                                duration: step.duration,
                                type: step.type,
                                index: index,
                            }),
                        );

                    return {
                        summary: summary,
                        coordinates: coords,
                        instructions: instructions,
                    };
                });

                callback(null, routes);
            })
            .catch((error) => {
                console.error('ORS API Error:', error);
                callback(error, undefined);
            });
    }
}

export default TestRouter;
