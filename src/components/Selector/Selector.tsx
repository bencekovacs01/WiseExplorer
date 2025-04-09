import { useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import ReactDOMServer from 'react-dom/server';
import { Button } from '@mui/material';
import { SelectAll, Deselect, PushPin } from '@mui/icons-material';
import { useEffect, useState } from 'react';
import { useShallow } from 'zustand/shallow';
import usePOIStore from '@/src/store/poiStore';

import { useMapContext } from '@/src/contexts/MapContext';
import { IPosition } from '@/src/models/models';
import { BacktrackingService } from '@/src/services/BacktrackingService';
import BitonicService from '@/src/services/BitonicService';
import Loader from '../Loader/Loader';

const Selector = () => {
    const map = useMap();

    const [isSelecting, setIsSelecting] = useState<boolean>(false);
    const [corners, setCorners] = useState<L.LatLng[]>([]);

    const { setPois, selectedCategories, selectedCategoryGroups } =
        useMapContext();

    const [fetchPois] = usePOIStore(useShallow((state) => [state.fetchPois]));

    const [poiData, setPoiData] = useState<any>(null);
    const [isPoiLoaded, setIsPoiLoaded] = useState<boolean>(false);

    const [isLoading, setIsLoading] = useState<boolean>(false);

    const handleAreaSelect = (e: any) => {
        setIsLoading(true);

        fetchPois({
            start: {
                latitude: corners[0].lat,
                longitude: corners[0].lng,
            },
            end: {
                latitude: e.latlng.lat,
                longitude: e.latlng.lng,
            },
            buffer: 300,
            categoryIds: Object.keys(selectedCategories)
                .map(Number)
                .filter((key) => selectedCategories[key]),
            categoryGroupIds: Object.keys(selectedCategoryGroups)
                .map(Number)
                .filter((key) => selectedCategoryGroups[key]),
        }).then((res) => {
            setPoiData(res);
            setIsPoiLoaded(true);
            setIsLoading(false);

            // const pois = res.pois || [];
            // const features = res.features || [];

            // const positions = transformPoisToPositions(pois, features);
            // setPois(positions);
        });

        L.rectangle(
            [
                [corners[0].lat, corners[0].lng],
                [e.latlng.lat, e.latlng.lng],
            ],
            {
                color: 'black',
                weight: 0,
                fillOpacity: 0.1,
            },
        ).addTo(map);

        setIsSelecting(false);
        setCorners([]);
    };

    const transformPoisToPositions = (
        pois: any[],
        features: any[],
    ): IPosition[] => {
        if (!pois || !features) {
            return [];
        }

        const featureMap = new Map();
        features.forEach((feature: any) => {
            if (feature?.geometry?.coordinates) {
                const key = `${feature.geometry.coordinates[1]},${feature.geometry.coordinates[0]}`;
                featureMap.set(key, {
                    category_ids: feature.properties?.category_ids || [],
                    osm_tags: feature.properties?.osm_tags || {},
                    name: feature.properties?.name || '',
                });
            }
        });

        return pois.map((poi, index) => {
            const key = `${poi.latitude},${poi.longitude}`;
            const props = featureMap.get(key) || {};

            return {
                coords: {
                    lat: poi.latitude,
                    lng: poi.longitude,
                },
                categories: props.category_ids || [],
                tags: {
                    name: props.name || `POI ${index}`,
                    ...props.osm_tags,
                },
            };
        });
    };

    const transformRouteToPositions = (
        route: any,
        originalPois: any[],
    ): IPosition[] => {
        if (!route?.points) {
            return [];
        }

        const positions = route.points.map((point: any, index: number) => {
            const originalPoi = originalPois.find(
                (poi) =>
                    poi.latitude === point.latitude &&
                    poi.longitude === point.longitude,
            );

            return {
                coords: {
                    lat: point.latitude,
                    lng: point.longitude,
                },
                categories: originalPoi?.categories || [],
                tags: originalPoi?.tags || {
                    name:
                        index === 0
                            ? 'Start'
                            : index === route.points.length - 1
                            ? 'End'
                            : `POI ${index}`,
                },
            };
        });

        if (route.clusterInfo && positions.length > 0) {
            positions[0].clusterInfo = route.clusterInfo;
        }

        return positions;
    };

    const calculateBacktrackingRoute = async () => {
        if (!poiData || !poiData.pois || !poiData.poiMetadata) {
            console.error('No POI data available to calculate route');
            return;
        }

        try {
            const service = new BacktrackingService();

            const routeResult = await service.findMinimumTimeRouteBt(
                poiData.pois,
                poiData.poiMetadata,
            );
            console.log('routeResult', routeResult);

            const positions = transformRouteToPositions(
                routeResult,
                poiData.pois,
            );

            setPois(positions);
        } catch (error) {
            console.error('Error calculating route:', error);
        }
    };

    const calculateBitonicRoute = async () => {
        if (!poiData || !poiData.pois || !poiData.poiMetadata) {
            console.error('No POI data available to calculate route');
            return;
        }

        try {
            const service = new BitonicService();

            const routeResult = await service.findBitonicRoute(
                poiData.pois,
                poiData.poiMetadata,
            );
            console.log('Bitonic route result', routeResult);

            // Now routeResult is the Route object directly, not wrapped in optimalRoute
            const positions = transformRouteToPositions(
                routeResult, // No need to access .optimalRoute anymore
                poiData.pois,
            );

            setPois(positions);
        } catch (error) {
            console.error('Error calculating bitonic route:', error);
        }
    };

    useMapEvents({
        click(e) {
            if (!isSelecting) return;

            if (corners.length < 2) {
                setCorners((prevCorners) => [...prevCorners, e.latlng]);

                L.marker(e.latlng, {
                    icon: L.divIcon({
                        html: ReactDOMServer.renderToString(
                            <PushPin color="action" />,
                        ),
                        className: 'pushpin-marker',
                        iconSize: [20, 20],
                        iconAnchor: [10, 17],
                    }),
                }).addTo(map);
            }

            if (corners.length === 1) {
                handleAreaSelect(e);
            }
        },
    });

    const handleSelect = () => {
        map.eachLayer((layer) => {
            if (
                layer instanceof L.Rectangle ||
                (layer instanceof L.Marker &&
                    layer.options.icon?.options.className === 'pushpin-marker')
            ) {
                map.removeLayer(layer);
            }
        });
        setIsSelecting((prevState) => !prevState);
        setCorners([]);
    };

    useEffect(() => {
        if (isSelecting) {
            const layer = L.layerGroup().addTo(map);

            const worldBounds = L.latLngBounds(
                L.latLng(-90, -180),
                L.latLng(90, 180),
            );
            L.rectangle(worldBounds, {
                color: 'black',
                weight: 0,
                fillOpacity: 0.2,
            }).addTo(layer);

            return () => {
                layer.remove();
            };
        }
    }, [isSelecting, map]);

    return (
        <>
            <Button
                variant="contained"
                color="primary"
                onClick={handleSelect}
                style={{
                    position: 'absolute',
                    top: '70px',
                    right: '10px',
                    zIndex: 998,
                    height: '50px',
                    width: '50px',
                    borderRadius: '10%',
                    padding: 0,
                    minWidth: 0,
                }}
            >
                {isSelecting ? <SelectAll /> : <Deselect />}
            </Button>

            {isPoiLoaded && (
                <>
                    <Button
                        variant="contained"
                        color="secondary"
                        onClick={calculateBacktrackingRoute}
                        style={{
                            position: 'absolute',
                            top: '250px',
                            right: '10px',
                            zIndex: 998,
                        }}
                    >
                        Backtracking Route
                    </Button>

                    <Button
                        variant="contained"
                        color="primary"
                        onClick={calculateBitonicRoute}
                        style={{
                            position: 'absolute',
                            top: '300px',
                            right: '10px',
                            zIndex: 998,
                        }}
                    >
                        Bitonic Route
                    </Button>

                    {/* <Button
                        variant="contained"
                        color="primary"
                        onClick={calculateBacktrackingRoute}
                        style={{
                            position: 'absolute',
                            top: '250px',
                            right: '10px',
                            zIndex: 998,
                        }}
                    >
                        Calculate Route
                    </Button> */}
                </>
            )}

            <Loader loading={isLoading} />
        </>
    );
};

export default Selector;
