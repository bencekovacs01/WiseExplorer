import { useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import ReactDOMServer from 'react-dom/server';
import { Button } from '@mui/material';
import { SelectAll, Deselect, PushPin } from '@mui/icons-material';
import { useEffect, useState } from 'react';
import { useShallow } from 'zustand/shallow';
import usePOIStore from '@/src/store/poiStore';

import InterestsIcon from '@mui/icons-material/Interests';
import { useMapContext } from '@/src/contexts/MapContext';

const Selector = () => {
    const map = useMap();

    const [isSelecting, setIsSelecting] = useState<boolean>(false);
    const [corners, setCorners] = useState<L.LatLng[]>([]);

    const { setPois } = useMapContext();

    const [fetchPois] = usePOIStore(useShallow((state) => [state.fetchPois]));

    const handleAreaSelect = (e: any) => {
        fetchPois({
            start: {
                latitude: corners[0].lat,
                longitude: corners[0].lng,
            },
            end: {
                latitude: e.latlng.lat,
                longitude: e.latlng.lng,
            },
            buffer: 250,
        }).then((res) => {
            // console.log(
            //     'res?.features',
            //     res?.features?.map((feature: any) => ({
            //         latitude: feature.geometry.coordinates[1],
            //         longitude: feature.geometry.coordinates[0],
            //     })),
            // );

            const mapPositions = res?.features?.map((feature: any) => ({
                coords: {
                    lat: feature.geometry.coordinates[1],
                    lng: feature.geometry.coordinates[0],
                },
                text: feature.properties.type,
            }));
            setPois(mapPositions);

            res?.features?.forEach?.((feature: any) => {
                const [lng, lat] = feature.geometry.coordinates;
                L.marker([lat, lng], {
                    icon: L.divIcon({
                        html: ReactDOMServer.renderToString(
                            <InterestsIcon color="success" />,
                        ),
                        iconSize: [20, 20],
                        iconAnchor: [10, 17],
                    }),
                }).addTo(map);
            });
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
        <Button
            variant="contained"
            color="primary"
            onClick={handleSelect}
            style={{
                position: 'absolute',
                top: '20px',
                right: '20px',
                zIndex: 1000,
                height: '50px',
                width: '50px',
                borderRadius: '10%',
                padding: 0,
                minWidth: 0,
            }}
        >
            {isSelecting ? <SelectAll /> : <Deselect />}
        </Button>
    );
};

export default Selector;
