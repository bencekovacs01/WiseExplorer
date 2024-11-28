declare namespace L.Routing {
    class OpenRouteServiceV2 extends L.Class {
        constructor(apiKey: string, orsOptions: any, options?: any);
        route(
            waypoints: L.Routing.Waypoint[],
            callback: (error: any, routes: any) => void,
            context?: any,
        ): this;
    }

    function openrouteserviceV2(
        apiKey: string,
        orsOptions: any,
        options?: any,
    ): OpenRouteServiceV2;
}
