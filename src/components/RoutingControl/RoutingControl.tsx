import React, { useEffect } from 'react';
import L from 'leaflet';
import { useMap } from 'react-leaflet';
import { IInstruction, IPosition, IWaypoint } from '@/src/models/models';
import { useMapContext } from '@/src/contexts/MapContext';
import 'leaflet-routing-machine';
import '../../plugins/L.Routing.OpenRouteServiceV2';

interface RoutingControlProps {
    positions: IPosition[];
}

const RoutingControl: React.FC<RoutingControlProps> = ({ positions }) => {
    const {
        setInstructions,
        setInstructionsVisible,
        markersRef,
        instructionWaypointsRef,
        // mapRef,
        setCoordinates,
        navigationType,
    } = useMapContext();

    const map = useMap();

    // useEffect(() => {
    //     if (map && mapRef)
    //         mapRef?.current?.splice?.(0, mapRef?.current.length, map);
    // }, [map, mapRef]);

    // useEffect(() => {
    //     if (!map || positions?.length < 2) return;

    //     const waypoints = positions.map((position) =>
    //         L.latLng(position.coords.lat, position.coords.lng),
    //     );

    //     const customMarker = L.icon({
    //         iconUrl:
    //             'https://unpkg.com/leaflet@1.9.3/dist/images/marker-icon.png',
    //         iconSize: [25, 41],
    //         iconAnchor: [12, 41],
    //         popupAnchor: [1, -34],
    //     });

    //     const routingControl = L.Routing.control({
    //         waypoints,
    //         lineOptions: {
    //             styles: [{ color: 'blue', weight: 2 }],
    //             extendToWaypoints: true,
    //             missingRouteTolerance: 0,
    //         },
    //         addWaypoints: false,
    //         routeWhileDragging: true,
    //         fitSelectedRoutes: true,
    //         showAlternatives: true,
    //         show: false,
    //         waypointMode: 'snap',
    //         createMarker: function (i: number, waypoint: any) {
    //             return L.marker(waypoint.latLng, {
    //                 icon: customMarker,
    //             }).bindPopup(`${positions[i]?.tags?.name || ''}`);
    //         },
    //         router: L.Routing.osrmv1({
    //             // serviceUrl: 'https://router.project-osrm.org/route/v1/',
    //             serviceUrl: `http://localhost:${
    //                 navigationType === 'car'
    //                     ? process.env.CAR_NAV_PORT
    //                     : process.env.FOOT_NAV_PORT
    //             }/route/v1`,
    //             profile: 'car',
    //             language: 'en',
    //             geometryOnly: false,
    //             optimizeWaypoints: true,
    //         }),
    //     })?.addTo?.(map);

    //     routingControl.on('routesfound', (e: any) => {
    //         const routes = e.routes;

    //         setCoordinates(routes[0]?.coordinates);

    //         const newInstructions = routes.map((route: any, index: number) => ({
    //             routeNumber: index + 1,
    //             instructions: route?.instructions?.map?.(
    //                 (instruction: string, i: number) => ({
    //                     text: instruction || 'No instructions',
    //                     index: i,
    //                 }),
    //             ),
    //         }));

    //         const instructionWaypoints = routes[0]?.instructions?.map?.(
    //             (instruction: IInstruction) => {
    //                 const { lat, lng } =
    //                     routes[0]?.coordinates?.[instruction?.index];
    //                 return L.latLng(lat, lng);
    //             },
    //         );

    //         setInstructions(newInstructions);

    //         instructionWaypointsRef?.current?.splice(
    //             0,
    //             instructionWaypointsRef.current.length,
    //             ...instructionWaypoints,
    //         );

    //         if ((markersRef && markersRef?.current?.length) || 0 > 0) {
    //             markersRef?.current?.forEach?.((marker) =>
    //                 map.removeLayer(marker),
    //             );
    //             markersRef?.current?.splice(0, markersRef?.current?.length);
    //         }

    //         instructionWaypoints.forEach((waypoint: IWaypoint) => {
    //             const circle = L.circle(waypoint, {
    //                 radius: 5,
    //                 color: 'red',
    //                 fillColor: '#f03',
    //                 fillOpacity: 0,
    //                 opacity: 0,
    //             }).addTo(map);

    //             markersRef.current?.push(circle);
    //         });

    //         setInstructionsVisible(true);
    //     });

    //     return () => {
    //         if (map && routingControl) {
    //             map.removeControl(routingControl);
    //         }
    //     };
    // }, [
    //     instructionWaypointsRef,
    //     map,
    //     markersRef,
    //     navigationType,
    //     positions,
    //     setCoordinates,
    //     setInstructions,
    //     setInstructionsVisible,
    // ]);

    useEffect(() => {
        if (!map || positions?.length < 2) return;

        const clusterInfo = positions[0]?.clusterInfo || [];

        const useProximityBasedClustering = clusterInfo.length === 0;
        const isPartOfCluster: boolean[] = new Array(positions.length).fill(
            false,
        );

        if (!useProximityBasedClustering) {
            for (const cluster of clusterInfo) {
                if (cluster.clusteredIds?.length > 1) {
                    for (let i = 1; i < cluster.clusteredIds.length; i++) {
                        const index = cluster.clusteredIds[i];
                        if (index < positions.length) {
                            isPartOfCluster[index] = true;
                        }
                    }
                }
            }
        }

        const customMarker = L.icon({
            iconUrl:
                'https://unpkg.com/leaflet@1.9.3/dist/images/marker-icon.png',
            iconSize: [25, 41],
            iconAnchor: [12, 41],
            popupAnchor: [1, -34],
        });

        const waypoints = positions
            .filter((_, index) => !isPartOfCluster[index])
            .map((position) =>
                L.latLng(position.coords.lat, position.coords.lng),
            );

        positions.forEach((position, index) => {
            const markerIcon = isPartOfCluster[index]
                ? L.icon({
                      iconUrl:
                          'https://unpkg.com/leaflet@1.9.3/dist/images/marker-icon.png',
                      iconSize: [20, 32],
                      iconAnchor: [10, 32],
                      className: 'clustered-poi-marker',
                      popupAnchor: [1, -34],
                  })
                : customMarker;

            const marker = L.marker(
                [position.coords.lat, position.coords.lng],
                {
                    icon: markerIcon,
                },
            ).addTo(map);

            if (position.tags?.name) {
                marker.bindPopup(`
                <h4>${position.tags.name}</h4>
                ${
                    isPartOfCluster[index]
                        ? '<p><i>This location is part of a cluster and will be visited with nearby points</i></p>'
                        : ''
                }
            `);
            }
        });

        const routingControl = L.Routing.control({
            waypoints,
            lineOptions: {
                styles: [{ color: 'blue', weight: 2 }],
                extendToWaypoints: true,
                missingRouteTolerance: 0,
            },
            addWaypoints: false,
            routeWhileDragging: true,
            fitSelectedRoutes: true,
            showAlternatives: true,
            show: false,
            waypointMode: 'snap',
            createMarker: function (i: number, waypoint: any) {
                return null;
            },
            router: L.Routing.osrmv1({
                serviceUrl:
                    process.env.NODE_ENV === 'production'
                        ? 'https://router.project-osrm.org/route/v1'
                        : `http://localhost:${
                              navigationType === 'car'
                                  ? process.env.CAR_NAV_PORT
                                  : process.env.FOOT_NAV_PORT
                          }/route/v1`,
                profile: 'car',
                language: 'en',
            }),
            fetchOptions: {
                headers: {
                    Authorization: process.env.ORS_KEY,
                },
            },
        } as any)?.addTo?.(map);

        routingControl.on('routesfound', (e: any) => {
            const routes = e.routes;

            setCoordinates(routes[0]?.coordinates);

            const newInstructions = routes.map((route: any, index: number) => ({
                routeNumber: index + 1,
                instructions: route?.instructions?.map?.(
                    (instruction: string, i: number) => ({
                        text: instruction || 'No instructions',
                        index: i,
                    }),
                ),
            }));

            const instructionWaypoints = routes[0]?.instructions?.map?.(
                (instruction: IInstruction) => {
                    const { lat, lng } =
                        routes[0]?.coordinates?.[instruction?.index];
                    return L.latLng(lat, lng);
                },
            );

            setInstructions(newInstructions);

            instructionWaypointsRef?.current?.splice(
                0,
                instructionWaypointsRef.current.length,
                ...instructionWaypoints,
            );

            if ((markersRef && markersRef?.current?.length) || 0 > 0) {
                markersRef?.current?.forEach?.((marker) =>
                    map.removeLayer(marker),
                );
                markersRef?.current?.splice(0, markersRef?.current?.length);
            }

            positions.forEach((position, index) => {
                const markerIcon = isPartOfCluster[index]
                    ? L.icon({
                          iconUrl:
                              'https://unpkg.com/leaflet@1.9.3/dist/images/marker-icon.png',
                          iconSize: [20, 32],
                          iconAnchor: [10, 32],
                          className: 'clustered-poi-marker',
                          popupAnchor: [1, -34],
                      })
                    : customMarker;

                const marker = L.marker(
                    [position.coords.lat, position.coords.lng],
                    {
                        icon: markerIcon,
                    },
                ).addTo(map);

                if (position.tags?.name) {
                    marker.bindPopup(`
                    <h4>${position.tags.name}</h4>
                    ${
                        isPartOfCluster[index]
                            ? '<p><i>This location is part of a cluster and will be visited with nearby points</i></p>'
                            : ''
                    }
                `);
                }
            });

            instructionWaypoints.forEach((waypoint: IWaypoint) => {
                const circle = L.circle(waypoint, {
                    radius: 5,
                    color: 'red',
                    fillColor: '#f03',
                    fillOpacity: 0,
                    opacity: 0,
                }).addTo(map);

                markersRef.current?.push(circle);
            });

            setInstructionsVisible(true);
        });

        return () => {
            if (routingControl) {
                map.removeControl(routingControl);
            }
        };
    }, [
        instructionWaypointsRef,
        map,
        markersRef,
        navigationType,
        positions,
        setCoordinates,
        setInstructions,
        setInstructionsVisible,
    ]);

    return null;
};

export default RoutingControl;
