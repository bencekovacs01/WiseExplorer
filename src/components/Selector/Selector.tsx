import { useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import ReactDOMServer from 'react-dom/server';
import { Button, ButtonGroup, Tooltip } from '@mui/material';
import {
    SelectAll,
    Deselect,
    PushPin,
    CompareArrows,
    Speed,
} from '@mui/icons-material';
import { useEffect, useState } from 'react';
import { useShallow } from 'zustand/shallow';
import usePOIStore from '@/src/store/poiStore';

import { useMapContext } from '@/src/contexts/MapContext';
import { IPosition } from '@/src/models/models';
import { BacktrackingService } from '@/src/services/BacktrackingService';
import BitonicService, { SortStrategy } from '@/src/services/BitonicService';
import Loader from '../Loader/Loader';
import PerformanceMetrics from '../Comparison/PerformanceMetrics';

import mockPoiData from './poiData.json';

const Selector = () => {
    const map = useMap();

    const [isSelecting, setIsSelecting] = useState<boolean>(false);
    const [corners, setCorners] = useState<L.LatLng[]>([]);

    const { setPois, selectedCategories, selectedCategoryGroups } =
        useMapContext();

    const [fetchPois] = usePOIStore(useShallow((state) => [state.fetchPois]));

    const [poiData, setPoiData] = useState<any>(mockPoiData);
    console.log('poiData', poiData);
    const [isPoiLoaded, setIsPoiLoaded] = useState<boolean>(true);

    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [runningAlgo, setRunningAlgo] = useState<string | null>(null);

    // Update performance data state to include all algorithm variations
    const [performanceData, setPerformanceData] = useState<{
        backtracking: any | null;
        bitonic: any | null;
        bitonicWE: any | null;
        bitonicEW: any | null;
        bitonicSN: any | null;
        bitonicNS: any | null;
        branchAndBound: any | null;
        dynamicProgramming: any | null;
    }>({
        backtracking: null,
        bitonic: null,
        bitonicWE: null,
        bitonicEW: null,
        bitonicSN: null,
        bitonicNS: null,
        branchAndBound: null,
        dynamicProgramming: null,
    });
    console.log('performanceData', performanceData);

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
            buffer: 500,
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

            handleSelect(true);

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

    // const [performanceData, setPerformanceData] = useState<{
    //     backtracking: any | null;
    //     bitonic: any | null;
    // }>({
    //     backtracking: null,
    //     bitonic: null,
    // });

    const calculateBitonicRoute = async (
        strategy: SortStrategy = SortStrategy.WEST_TO_EAST,
    ) => {
        if (!poiData || !poiData.pois || !poiData.poiMetadata) {
            console.error('No POI data available to calculate route');
            return;
        }

        setRunningAlgo(`bitonic-${strategy}`);
        setIsLoading(true);

        try {
            const response = await fetch('/api/pois/bitonic-time', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    pois: poiData.pois,
                    poiMetadata: poiData.poiMetadata,
                    strategy,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(
                    errorData.message || 'Error calculating bitonic route',
                );
            }

            const routeResult = await response.json();
            console.log('Bitonic route result', routeResult);

            const positions = transformRouteToPositions(
                routeResult.route,
                poiData.pois,
            );

            setPois(positions);
        } catch (error) {
            console.error('Error calculating bitonic route:', error);
        } finally {
            setIsLoading(false);
            setRunningAlgo(null);
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

    const handleSelect = (isAuto: boolean = false) => {
        map.eachLayer((layer) => {
            if (
                layer instanceof L.Rectangle ||
                (layer instanceof L.Marker &&
                    layer.options.icon?.options.className === 'pushpin-marker')
            ) {
                map.removeLayer(layer);
            }
        });

        if (isAuto) return;

        setCorners([]);
        setIsSelecting((prevState) => !prevState);
    };

    const calculateBacktrackingRoute = async () => {
        if (!poiData || !poiData.pois || !poiData.poiMetadata) {
            console.error('No POI data available to calculate route');
            return;
        }

        setRunningAlgo('backtracking');
        setIsLoading(true);

        // Start client-side timing
        const clientStartTime = performance.now();

        try {
            const response = await fetch('/api/pois/bt-time', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    pois: poiData.pois,
                    poiMetadata: poiData.poiMetadata,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Error calculating route');
            }

            const result = await response.json();
            console.log('Backtracking result', result);

            // Calculate client-side metrics
            const clientEndTime = performance.now();
            const clientTotalTime = clientEndTime - clientStartTime;

            // Store performance data
            setPerformanceData((prev) => ({
                ...prev,
                backtracking: {
                    ...result?.metrics,
                    ...result?.route,
                    clientTotalTime,
                },
            }));

            const positions = transformRouteToPositions(
                result.route,
                poiData.pois,
            );

            setPois(positions);
        } catch (error) {
            console.error('Error calculating route:', error);
        } finally {
            setIsLoading(false);
            setRunningAlgo(null);
        }
    };

    const calculateBranchAndBoundRoute = async () => {
        if (!poiData || !poiData.pois || !poiData.poiMetadata) {
            console.error('No POI data available to calculate route');
            return;
        }
        setRunningAlgo('branch-and-bound');
        setIsLoading(true);
        
        // Start client-side timing
        const clientStartTime = performance.now();
        
        try {
            const response = await fetch('/api/pois/bab', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    pois: poiData.pois,
                    poiMetadata: poiData.poiMetadata,
                }),
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Error calculating route');
            }
            const result = await response.json();
            console.log('Branch and Bound result', result);
            
            // Calculate client-side metrics
            const clientEndTime = performance.now();
            const clientTotalTime = clientEndTime - clientStartTime;
            
            // Extract the route and metrics
            const route = result.route?.[0];
            
            // Store performance data
            setPerformanceData((prev) => ({
                ...prev,
                branchAndBound: {
                    ...result?.metrics,
                    clientTotalTime,
                    routeDistance: route?.totalDistance,
                    routeDuration: route?.duration,
                    routeVisitTime: route?.visitTime,
                    routeTotalTime: route?.totalTime,
                },
            }));

            const positions = transformRouteToPositions(
                route,
                poiData.pois,
            );
            console.log('positions', positions);
            setPois(positions);
        } catch (error) {
            console.error('Error calculating route:', error);
        } finally {
            setIsLoading(false);
            setRunningAlgo(null);
        }
    };
    
    const calculateDynamicProgrammingRoute = async () => {
        if (!poiData || !poiData.pois || !poiData.poiMetadata) {
            console.error('No POI data available to calculate route');
            return;
        }
        setRunningAlgo('dynamic-programming');
        setIsLoading(true);
        
        // Start client-side timing
        const clientStartTime = performance.now();
        
        try {
            const response = await fetch('/api/pois/dp', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    pois: poiData.pois,
                    poiMetadata: poiData.poiMetadata,
                }),
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Error calculating route');
            }
            const result = await response.json();
            console.log('Dynamic Programming result', result);
            
            // Calculate client-side metrics
            const clientEndTime = performance.now();
            const clientTotalTime = clientEndTime - clientStartTime;
            
            // Extract the route and metrics
            const route = result.route?.[0];
            console.log('route', route)
            
            // Store performance data
            setPerformanceData((prev) => ({
                ...prev,
                dynamicProgramming: {
                    ...result?.metrics,
                    clientTotalTime,
                    routeDistance: route?.totalDistance,
                    routeDuration: route?.duration,
                    routeVisitTime: route?.visitTime,
                    routeTotalTime: route?.totalTime,
                },
            }));

            const positions = transformRouteToPositions(
                route,
                poiData.pois,
            );
            console.log('positions', positions);
            setPois(positions);
        } catch (error) {
            console.error('Error calculating route:', error);
        } finally {
            setIsLoading(false);
            setRunningAlgo(null);
        }
    };

    // Calculate all bitonic variations
    const calculateAllBitonicVariations = async () => {
        if (!poiData || !poiData.pois || !poiData.poiMetadata) {
            console.error('No POI data available to calculate bitonic routes');
            return;
        }

        setRunningAlgo('bitonic-all');
        setIsLoading(true);

        try {
            // Calculate West to East (W-E) variation with individual timing
            const weStartTime = performance.now();
            const weResponse = await fetch('/api/pois/bitonic-time', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    pois: poiData.pois,
                    poiMetadata: poiData.poiMetadata,
                    strategy: SortStrategy.WEST_TO_EAST,
                }),
            });

            if (!weResponse.ok) {
                throw new Error('Error calculating W-E bitonic route');
            }

            const weResult = await weResponse.json();
            const weEndTime = performance.now();
            const weTotalTime = weEndTime - weStartTime;

            // Calculate East to West (E-W) variation with individual timing
            const ewStartTime = performance.now();
            const ewResponse = await fetch('/api/pois/bitonic-time', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    pois: poiData.pois,
                    poiMetadata: poiData.poiMetadata,
                    strategy: SortStrategy.EAST_TO_WEST,
                }),
            });

            if (!ewResponse.ok) {
                throw new Error('Error calculating E-W bitonic route');
            }

            const ewResult = await ewResponse.json();
            const ewEndTime = performance.now();
            const ewTotalTime = ewEndTime - ewStartTime;

            // Calculate South to North (S-N) variation with individual timing
            const snStartTime = performance.now();
            const snResponse = await fetch('/api/pois/bitonic-time', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    pois: poiData.pois,
                    poiMetadata: poiData.poiMetadata,
                    strategy: SortStrategy.SOUTH_TO_NORTH,
                }),
            });

            if (!snResponse.ok) {
                throw new Error('Error calculating S-N bitonic route');
            }

            const snResult = await snResponse.json();
            const snEndTime = performance.now();
            const snTotalTime = snEndTime - snStartTime;

            // Calculate North to South (N-S) variation with individual timing
            const nsStartTime = performance.now();
            const nsResponse = await fetch('/api/pois/bitonic-time', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    pois: poiData.pois,
                    poiMetadata: poiData.poiMetadata,
                    strategy: SortStrategy.NORTH_TO_SOUTH,
                }),
            });

            if (!nsResponse.ok) {
                throw new Error('Error calculating N-S bitonic route');
            }

            const nsResult = await nsResponse.json();
            const nsEndTime = performance.now();
            const nsTotalTime = nsEndTime - nsStartTime;

            // Store all performance metrics with individual total times
            setPerformanceData((prev) => ({
                ...prev,
                bitonicWE: {
                    ...weResult.metrics,
                    clientTotalTime: weTotalTime,
                    strategy: 'WEST_TO_EAST',
                    routeDistance: weResult.route.totalDistance,
                    routeDuration: weResult.route.duration,
                    routeVisitTime: weResult.route.visitTime,
                    routeTotalTime: weResult.route.totalTime,
                },
                bitonicEW: {
                    ...ewResult.metrics,
                    clientTotalTime: ewTotalTime,
                    strategy: 'EAST_TO_WEST',
                    routeDistance: ewResult.route.totalDistance,
                    routeDuration: ewResult.route.duration,
                    routeVisitTime: ewResult.route.visitTime,
                    routeTotalTime: ewResult.route.totalTime,
                },
                bitonicSN: {
                    ...snResult.metrics,
                    clientTotalTime: snTotalTime,
                    strategy: 'SOUTH_TO_NORTH',
                    routeDistance: snResult.route.totalDistance,
                    routeDuration: snResult.route.duration,
                    routeVisitTime: snResult.route.visitTime,
                    routeTotalTime: snResult.route.totalTime,
                },
                bitonicNS: {
                    ...nsResult.metrics,
                    clientTotalTime: nsTotalTime,
                    strategy: 'NORTH_TO_SOUTH',
                    routeDistance: nsResult.route.totalDistance,
                    routeDuration: nsResult.route.duration,
                    routeVisitTime: nsResult.route.visitTime,
                    routeTotalTime: nsResult.route.totalTime,
                },
            }));

            // const bestStrategy = getBestBitonicStrategy();
            // let bestRoute;

            // switch (bestStrategy) {
            //     case SortStrategy.WEST_TO_EAST:
            //         bestRoute = weResult.route;
            //         break;
            //     case SortStrategy.EAST_TO_WEST:
            //         bestRoute = ewResult.route;
            //         break;
            //     case SortStrategy.SOUTH_TO_NORTH:
            //         bestRoute = snResult.route;
            //         break;
            //     case SortStrategy.NORTH_TO_SOUTH:
            //         bestRoute = nsResult.route;
            //         break;
            //     default:
            //         bestRoute = weResult.route; // Default
            // }

            // const positions = transformRouteToPositions(
            //     bestRoute,
            //     poiData.pois,
            // );

            // setPois(positions);
        } catch (error) {
            console.error('Error calculating bitonic variations:', error);
        } finally {
            setIsLoading(false);
            setRunningAlgo(null);
        }
    };

    // Get the best bitonic strategy based on execution time
    const getBestBitonicStrategy = (): SortStrategy => {
        const strategies = [
            {
                strategy: SortStrategy.WEST_TO_EAST,
                time: performanceData.bitonicWE?.executionTimeMs,
            },
            {
                strategy: SortStrategy.EAST_TO_WEST,
                time: performanceData.bitonicEW?.executionTimeMs,
            },
            {
                strategy: SortStrategy.SOUTH_TO_NORTH,
                time: performanceData.bitonicSN?.executionTimeMs,
            },
            {
                strategy: SortStrategy.NORTH_TO_SOUTH,
                time: performanceData.bitonicNS?.executionTimeMs,
            },
        ].filter((s) => s.time !== undefined);

        if (strategies.length === 0) {
            return SortStrategy.WEST_TO_EAST; // Default if no data
        }

        // Sort by execution time (fastest first)
        strategies.sort((a, b) => (a.time || Infinity) - (b.time || Infinity));
        return strategies[0].strategy;
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
            <div
                style={{
                    position: 'fixed',
                    top: '210px',
                    right: '20px',
                    zIndex: 999,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-end',
                    gap: '15px',
                }}
            >
                <Button
                    variant="contained"
                    color="primary"
                    onClick={() => handleSelect()}
                    style={{
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
                        <Tooltip title="Find route using Backtracking algorithm">
                            <Button
                                variant="contained"
                                color="secondary"
                                onClick={calculateBacktrackingRoute}
                                disabled={runningAlgo !== null}
                            >
                                Backtracking Route
                            </Button>
                        </Tooltip>

                        <Tooltip title="Find route using Branch and Bound algorithm">
                            <Button
                                variant="contained"
                                color="secondary"
                                onClick={calculateBranchAndBoundRoute}
                                disabled={runningAlgo !== null}
                            >
                                Branch & Bound Route
                            </Button>
                        </Tooltip>
                        
                        <Tooltip title="Find route using Dynamic Programming algorithm">
                            <Button
                                variant="contained"
                                color="secondary"
                                onClick={calculateDynamicProgrammingRoute}
                                disabled={runningAlgo !== null || poiData?.pois?.length > 20}
                            >
                                Dynamic Programming Route
                            </Button>
                        </Tooltip>

                        <Tooltip title="Calculate & compare all Bitonic variations">
                            <Button
                                variant="contained"
                                color="primary"
                                onClick={calculateAllBitonicVariations}
                                disabled={runningAlgo !== null}
                                startIcon={<CompareArrows />}
                            >
                                Compare All Bitonic
                            </Button>
                        </Tooltip>

                        <Tooltip title="Use previously identified best bitonic strategy">
                            <Button
                                variant="contained"
                                color="success"
                                onClick={() =>
                                    calculateBitonicRoute(
                                        getBestBitonicStrategy(),
                                    )
                                }
                                disabled={
                                    runningAlgo !== null ||
                                    (!performanceData.bitonicWE &&
                                        !performanceData.bitonicEW &&
                                        !performanceData.bitonicSN &&
                                        !performanceData.bitonicNS)
                                }
                                startIcon={<Speed />}
                            >
                                Best Bitonic Route
                            </Button>
                        </Tooltip>

                        <ButtonGroup orientation="vertical" variant="outlined">
                            <Tooltip title="West to East (W-E) strategy">
                                <Button
                                    onClick={() =>
                                        calculateBitonicRoute(
                                            SortStrategy.WEST_TO_EAST,
                                        )
                                    }
                                    disabled={runningAlgo !== null}
                                    color={
                                        performanceData.bitonicWE
                                            ?.executionTimeMs ===
                                        Math.min(
                                            performanceData.bitonicWE
                                                ?.executionTimeMs || Infinity,
                                            performanceData.bitonicEW
                                                ?.executionTimeMs || Infinity,
                                            performanceData.bitonicSN
                                                ?.executionTimeMs || Infinity,
                                            performanceData.bitonicNS
                                                ?.executionTimeMs || Infinity,
                                        )
                                            ? 'primary'
                                            : 'inherit'
                                    }
                                >
                                    W→E
                                </Button>
                            </Tooltip>
                            <Tooltip title="East to West (E-W) strategy">
                                <Button
                                    onClick={() =>
                                        calculateBitonicRoute(
                                            SortStrategy.EAST_TO_WEST,
                                        )
                                    }
                                    disabled={runningAlgo !== null}
                                    color={
                                        performanceData.bitonicEW
                                            ?.executionTimeMs ===
                                        Math.min(
                                            performanceData.bitonicWE
                                                ?.executionTimeMs || Infinity,
                                            performanceData.bitonicEW
                                                ?.executionTimeMs || Infinity,
                                            performanceData.bitonicSN
                                                ?.executionTimeMs || Infinity,
                                            performanceData.bitonicNS
                                                ?.executionTimeMs || Infinity,
                                        )
                                            ? 'primary'
                                            : 'inherit'
                                    }
                                >
                                    E→W
                                </Button>
                            </Tooltip>
                            <Tooltip title="South to North (S-N) strategy">
                                <Button
                                    onClick={() =>
                                        calculateBitonicRoute(
                                            SortStrategy.SOUTH_TO_NORTH,
                                        )
                                    }
                                    disabled={runningAlgo !== null}
                                    color={
                                        performanceData.bitonicSN
                                            ?.executionTimeMs ===
                                        Math.min(
                                            performanceData.bitonicWE
                                                ?.executionTimeMs || Infinity,
                                            performanceData.bitonicEW
                                                ?.executionTimeMs || Infinity,
                                            performanceData.bitonicSN
                                                ?.executionTimeMs || Infinity,
                                            performanceData.bitonicNS
                                                ?.executionTimeMs || Infinity,
                                        )
                                            ? 'primary'
                                            : 'inherit'
                                    }
                                >
                                    S→N
                                </Button>
                            </Tooltip>
                            <Tooltip title="North to South (N-S) strategy">
                                <Button
                                    onClick={() =>
                                        calculateBitonicRoute(
                                            SortStrategy.NORTH_TO_SOUTH,
                                        )
                                    }
                                    disabled={runningAlgo !== null}
                                    color={
                                        performanceData.bitonicNS
                                            ?.executionTimeMs ===
                                        Math.min(
                                            performanceData.bitonicWE
                                                ?.executionTimeMs || Infinity,
                                            performanceData.bitonicEW
                                                ?.executionTimeMs || Infinity,
                                            performanceData.bitonicSN
                                                ?.executionTimeMs || Infinity,
                                            performanceData.bitonicNS
                                                ?.executionTimeMs || Infinity,
                                        )
                                            ? 'primary'
                                            : 'inherit'
                                    }
                                >
                                    N→S
                                </Button>
                            </Tooltip>
                        </ButtonGroup>
                    </>
                )}
            </div>
            <PerformanceMetrics data={performanceData} />

            <Loader loading={isLoading} />
        </>
    );
};

export default Selector;
