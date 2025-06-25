import { useMap } from 'react-leaflet';
import L, { LatLngLiteral } from 'leaflet';
import { Button } from '@mui/material';
import { Route } from '@mui/icons-material';
import { useEffect, useMemo, useState } from 'react';
import { useShallow } from 'zustand/shallow';
import usePOIStore from '@/src/store/poiStore';

import { useMapContext } from '@/src/contexts/MapContext';
import { clusterNearbyPOIs } from '@/src/utils/cluster.utils';
import { calculateHaversineDistance } from '@/src/utils/route.utils';

import poiData100 from '../Selector/poiData100.json';
import { ACO } from '@/src/services/AcoService';
import Coordinate from '@/src/models/Coordinate';

interface POI {
    lat: number;
    lng: number;
}

const AcoComponent = () => {
    const map = useMap();

    const [corners, setCorners] = useState<L.LatLng[]>([]);

    const { pois, setPois, navigationType, evaporationRate, iterations } =
        useMapContext();

    const [loadDistanceMatrix] = usePOIStore(
        useShallow((state) => [state.loadDistanceMatrix]),
    );

    const [pheromones, setPheromones] = useState<number[][]>([]);
    const [antPaths, setAntPaths] = useState<number[][]>([]);

    const poiList = poiData100?.pois.map((poi: any) => ({
        latitude: poi?.latitude,
        longitude: poi?.longitude,
    }));

    const [data, setData] = useState<Coordinate[]>(poiList);

    const { clusteredPois } = clusterNearbyPOIs(data);

    const clusteredDistanceMatrix = useMemo(() => {
        return clusteredPois.map((from) =>
            clusteredPois.map((to) =>
                from === to
                    ? 0
                    : calculateHaversineDistance(
                          from.latitude,
                          from.longitude,
                          to.latitude,
                          to.longitude,
                      ),
            ),
        );
    }, [clusteredPois]);

    const aco = useMemo(() => {
        if (clusteredDistanceMatrix?.length === 0) return null;
        return new ACO({
            distanceMatrix: clusteredDistanceMatrix,
            numAnts: 10,
            alpha: 1,
            beta: 5,
            evaporationRate: evaporationRate,
            iterations: iterations,
        });
    }, [clusteredDistanceMatrix, evaporationRate, iterations]);

    const handleSelect = () => {
        if (!aco || clusteredDistanceMatrix?.length === 0) return;
        aco.run(
            (
                iteration,
                bestTour,
                bestDistance,
                antsTours,
                currentPheromones,
            ) => {
                if (currentPheromones) {
                    setPheromones(currentPheromones);
                }
                if (antsTours) {
                    setAntPaths(antsTours);
                }
            },
        );
    };

    // useEffect(
    //     () => {
    //         data.forEach((poi) => {
    //             L.circleMarker([poi.latitude, poi.longitude], {
    //                 radius: 6,
    //                 color: 'red',
    //                 fillColor: 'red',
    //                 fillOpacity: 1,
    //             }).addTo(map);
    //         });

    //         // loadDistanceMatrix(data).then((matrix: any) => {
    //         //     setDistanceMatrix(matrix);
    //         // });

    //     },
    //     [
    //         /*, loadDistanceMatrix*/
    //     ],
    // );

    const getPheromoneColor = (value: number): string => {
        const maxPheromone = 10; // Adjust based on expected max value
        const normalized = Math.min(value / maxPheromone, 1);
        const red = Math.floor(255 * normalized);
        const blue = Math.floor(255 * (1 - normalized));
        return `rgb(${red}, 0, ${blue})`;
    };

    useEffect(() => {
        if (pheromones.length === 0) return;
        map.eachLayer((layer) => {
            if ((layer as any).options?.isPheromone) {
                map.removeLayer(layer);
            }
        });
        pheromones.forEach((row, i) => {
            row.forEach((pheromone, j) => {
                if (i < j) {
                    const from = clusteredPois[i];
                    const to = clusteredPois[j];
                    const midpoint: LatLngLiteral = {
                        lat: (from.latitude + to.latitude) / 2,
                        lng: (from.longitude + to.longitude) / 2,
                    };
                    L.circleMarker([midpoint.lat, midpoint.lng], {
                        radius: 2,
                        color: getPheromoneColor(pheromone),
                        fillColor: getPheromoneColor(pheromone),
                        fillOpacity: 0.6,
                    }).addTo(map);
                }
            });
        });
    }, [pheromones, map, clusteredPois]);

    useEffect(() => {
        if (antPaths.length === 0) return;
        map.eachLayer((layer) => {
            if ((layer as any).options?.isAntPath) {
                map.removeLayer(layer);
            }
        });
        antPaths.forEach((tour, antIndex) => {
            const coordinates: LatLngLiteral[] = tour.map((nodeIndex) => ({
                lat: clusteredPois[nodeIndex].latitude,
                lng: clusteredPois[nodeIndex].longitude,
            }));
            L.Routing.control({
                waypoints: coordinates.map((coord) =>
                    L.latLng(coord.lat, coord.lng),
                ),
                createMarker: () => null,
                lineOptions: {
                    styles: [
                        {
                            color: getPheromoneColor(antIndex),
                            weight: 8,
                            opacity: 1,
                        },
                    ],
                    extendToWaypoints: true,
                    missingRouteTolerance: 0,
                },
                addWaypoints: false,
                routeWhileDragging: true,
                fitSelectedRoutes: true,
                showAlternatives: false,
                show: false,
                router: L.Routing.osrmv1({
                    serviceUrl: `http://localhost:$
                        {navigationType === 'car'
                            ? process.env.CAR_NAV_PORT
                            : process.env.FOOT_NAV_PORT
                        }/route/v1`,
                    language: 'en',
                }),
            } as any).addTo(map);
        });
    }, [antPaths, map, clusteredPois, navigationType]);

    const handleOnClick = () => {
        data.forEach((poi) => {
            L.circleMarker([poi.latitude, poi.longitude], {
                radius: 6,
                color: 'red',
                fillColor: 'red',
                fillOpacity: 1,
            }).addTo(map);
        });

        handleSelect();
    };

    return (
        <Button
            variant="contained"
            color="primary"
            onClick={handleOnClick}
            style={{
                position: 'absolute',
                top: '75px',
                right: '20px',
                zIndex: 998,
                height: '50px',
                width: '50px',
                borderRadius: '10%',
                padding: 0,
                minWidth: 0,
            }}
        >
            <Route />
        </Button>
    );
};

export default AcoComponent;
