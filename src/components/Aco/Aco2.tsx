import { useMap, useMapEvents } from 'react-leaflet';
import L, { LatLngLiteral } from 'leaflet';
import ReactDOMServer from 'react-dom/server';
import { Button } from '@mui/material';
import { SelectAll, Deselect, Route } from '@mui/icons-material';
import { use, useEffect, useMemo, useState } from 'react';
import { useShallow } from 'zustand/shallow';
import usePOIStore from '@/src/store/poiStore';

import InterestsIcon from '@mui/icons-material/Interests';
import { useMapContext } from '@/src/contexts/MapContext';

import points from './data.json';
import distances from './distances.json';
import ACO from '@/src/services/AcoService';
import Coordinate from '@/src/models/Coordinate';

interface POI {
    lat: number;
    lng: number;
}

const AcoComponent = () => {
    const map = useMap();

    const [corners, setCorners] = useState<L.LatLng[]>([]);

    const { setPois, navigationType } = useMapContext();

    const [loadDistanceMatrix] = usePOIStore(
        useShallow((state) => [state.loadDistanceMatrix]),
    );

    const [distanceMatrix, setDistanceMatrix] = useState<number[][]>([]);
    console.log('distances', distances);
    const [pheromones, setPheromones] = useState<number[][]>([]);
    const [antPaths, setAntPaths] = useState<number[][]>([]);

    const [data, setData] = useState<Coordinate[]>(
        points?.map
            ? points.map((poi: POI) => new Coordinate(poi.lat, poi.lng))
            : [],
    );

    useEffect(() => {
        setData(data);
    }, [data]);

    const aco = useMemo(() => {
        if (distanceMatrix.length === 0) return null;
        return new ACO({
            distanceMatrix,
            numAnts: 10,
            alpha: 1,
            beta: 5,
            evaporationRate: 0.5,
            iterations: 60,
        });
    }, [distanceMatrix]);

    const handleSelect = () => {
        if (!aco || distanceMatrix.length === 0) return;

        aco.run(
            (
                iteration,
                bestTour,
                bestDistance,
                antsTours,
                currentPheromones,
            ) => {
                console.log(
                    `Iteration: ${iteration}, Best Tour: ${bestTour}, Best Distance: ${bestDistance}`,
                );

                if (currentPheromones) {
                    setPheromones(currentPheromones);
                }

                if (antsTours) {
                    setAntPaths(antsTours);
                }
            },
        );
    };

    // useEffect(() => {
    //     if (!aco || distanceMatrix.length === 0) return;

    //     // return;

    //     aco.run(
    //         (
    //             iteration,
    //             bestTour,
    //             bestDistance,
    //             antsTours,
    //             currentPheromones,
    //         ) => {
    //             console.log(
    //                 `Iteration: ${iteration}, Best Tour: ${bestTour}, Best Distance: ${bestDistance}`,
    //             );

    //             if (currentPheromones) {
    //                 setPheromones(currentPheromones);
    //             }

    //             if (antsTours) {
    //                 setAntPaths(antsTours);
    //             }
    //         },
    //     );
    // }, [aco, distanceMatrix]);

    useEffect(() => {
        data.forEach((poi) => {
            L.circleMarker([poi.latitude, poi.longitude], {
                radius: 6,
                color: 'red',
                fillColor: 'red',
                fillOpacity: 1,
            }).addTo(map);
        });

        loadDistanceMatrix(data).then((matrix: any) => {
            console.log('matrix', matrix);
            setDistanceMatrix(matrix);
        });
    }, [map, data, loadDistanceMatrix]);

    const getPheromoneColor = (value: number): string => {
        const maxPheromone = 10; // Adjust based on expected max value
        const normalized = Math.min(value / maxPheromone, 1);
        const red = Math.floor(255 * normalized);
        const blue = Math.floor(255 * (1 - normalized));
        return `rgb(${red}, 0, ${blue})`;
    };

    const getAntPathColor = (antIndex: number): string => {
        const colors = [
            'blue',
            'orange',
            'purple',
            'cyan',
            'magenta',
            'yellow',
            'lime',
            'pink',
            'teal',
            'brown',
        ];
        return colors[antIndex % colors.length];
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
                    const from = data[i];
                    const to = data[j];
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
    }, [pheromones, map, data]);

    useEffect(() => {
        if (antPaths.length === 0) return;

        map.eachLayer((layer) => {
            if ((layer as any).options?.isAntPath) {
                map.removeLayer(layer);
            }
        });

        antPaths.forEach((tour, antIndex) => {
            const coordinates: LatLngLiteral[] = tour.map((nodeIndex) => ({
                lat: data[nodeIndex].latitude,
                lng: data[nodeIndex].longitude,
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
                    serviceUrl: `http://localhost:${
                        navigationType === 'car'
                            ? process.env.CAR_NAV_PORT
                            : process.env.FOOT_NAV_PORT
                    }/route/v1`,
                    // profile: 'car',
                    // profile: 'foot',

                    language: 'en',
                }),
            }).addTo(map);
        });
    }, [antPaths, map, data]);

    return (
        <Button
            variant="contained"
            color="primary"
            onClick={handleSelect}
            style={{
                position: 'absolute',
                top: '80px',
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
