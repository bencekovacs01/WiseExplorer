import L, { Routing } from 'leaflet';
import 'leaflet-routing-machine';

interface ORSRouterOptions {
    serviceUrl?: string;
    // apiKey: string;
    profile: string; // e.g., 'driving-car', 'cycling-regular'
    language: string;
}

class Alma extends Routing.IR

const ORS_Router = (options: ORSRouterOptions) => {
    return new (L.Class.extend({
        options: {
            serviceUrl:
                options.serviceUrl ||
                'https://api.openrouteservice.org/v2/directions',
            profile: options.profile || 'driving-car',
            language: options.language || 'en',
            apiKey: process.env.ORS_KEY,
        },

        initialize: function () {
            if (!this.options.apiKey) {
                throw new Error('OpenRouteService API key is required');
            }
        },

        async route(
            waypoints: any[],
            callback: (err: any, routes: any[]) => void,
            context?: any,
        ): Promise<void> {
            if (waypoints.length < 2) {
                throw new Error('At least two waypoints are required');
            }

            const coordinates = waypoints.map((wp) => [
                wp.latLng.lng,
                wp.latLng.lat,
            ]);

            const url = `${this.options.serviceUrl}/${this.options.profile}/geojson?api_key=${this.options.apiKey}`;

            fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    coordinates: coordinates,
                    instructions: true,
                    language: this.options.language,
                }),
            })
                .then((response) => {
                    if (!response.ok) {
                        throw new Error(
                            `ORS API error: ${response.statusText}`,
                        );
                    }
                    return response.json();
                })
                .then((data) => {
                    const routes: any[] = data.features.map((feature: any) => {
                        const coords = feature.geometry.coordinates.map(
                            (coord: [number, number]) =>
                                new L.LatLng(coord[1], coord[0]),
                        );

                        const summary = {
                            totalDistance: feature.properties.summary.distance,
                            totalTime: feature.properties.summary.duration,
                        };
                        console.log(
                            'feature.properties.segments',
                            feature.properties.segments,
                        );

                        const instructions =
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
                            name: feature.properties.segments[0].distance,
                            coordinates: coords,
                            summary: summary,
                            instructions: instructions,
                        };
                    });

                    callback(null, routes);
                })
                .catch((error) => {
                    console.log('error', error);
                    callback(error, []);
                });
        },

        // route: function (
        //     waypoints: any[],
        //     callback: { call: (arg0: any, arg1: never[], arg2: null) => void },
        //     context: any,
        // ) {
        //     console.log('waypoints', waypoints);
        //     const coordinates = waypoints.map((wp: any) => [
        //         wp?.latLng?.lng,
        //         wp?.latLng?.lat,
        //     ]);

        //     console.log('coordinates', coordinates);

        //     const url = `${this.options.serviceUrl}/${this.options.profile}?api_key=${this.options.apiKey}`;

        //     fetch(url, {
        //         method: 'POST',
        //         headers: {
        //             'Content-Type': 'application/json',
        //         },
        //         body: JSON.stringify({
        //             coordinates: coordinates,
        //             instructions: 'true',
        //             language: this.options.language,
        //         }),
        //     })
        //         .then((response) => response.json())
        //         .then((data) => {
        //             console.log('data', data);
        //             const routes = data.features.map((feature: any) => {
        //                 const coords = feature.geometry.coordinates.map(
        //                     (coord: number[]) => L.latLng(coord[1], coord[0]),
        //                 );
        //                 const instructions =
        //                     feature.properties.segments[0].steps.map(
        //                         (step: any) => ({
        //                             instruction: step.instruction,
        //                             distance: step.distance,
        //                             duration: step.duration,
        //                             type: step.type,
        //                             way_name: step.name,
        //                         }),
        //                     );

        //                 return {
        //                     name: feature.properties.summary.label,
        //                     coordinates: coords,
        //                     instructions: instructions,
        //                 };
        //             });

        //             callback.call(context, routes, null);
        //         })
        //         .catch((error) => {
        //             callback.call(context, [], error);
        //         });
        // },
    }))();
};

export default ORS_Router;
