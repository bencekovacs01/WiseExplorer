import React, { useState, useRef, useEffect } from 'react';
import {
    MapContainer,
    TileLayer,
    Marker,
    Popup,
    useMapEvents,
    Polyline,
} from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { greedyPois } from '@/src/constants/constants';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import 'leaflet-routing-machine';
import { IPosition } from '@/src/models/models';
import RoutingControl from '../RoutingControl/RoutingControl';
import { useMapContext } from '@/src/contexts/MapContext';
import PositionTracker from '../PositionTracker/PositionTracker';

interface IRouteResponse {
    route: IRoute[];
    totalDistance: number;
}

interface IRoute {
    latitude: number;
    longitude: number;
}

const OpenStreetMap = () => {
    const [routeResponse, setRouteResponse] = useState<IRouteResponse>();
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const {
        instructions,
        instructionsVisible,
        setInstructionsVisible,
        handleInstructionClicked,
    } = useMapContext();

    const [positions, setPositions] = useState<IPosition[]>([]);
    // console.log(
    //     '🚀 ~ file: OpenStreetMap.tsx:43 ~ OpenStreetMap ~ positions:',
    //     positions,
    // );
    const [userLocationSet, setUserLocationSet] = useState<boolean>(false);

    const fetchDataGreedy = async () => {
        try {
            const response = await fetch('/api/pois/find-route-greedy', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(greedyPois),
            });
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            const result = await response.json();
            setRouteResponse(result?.[0]);
        } catch (error) {
            setError(error instanceof Error ? error.message : 'Unknown error');
        } finally {
            setLoading(false);
        }
    };

    const LocationMarker = () => {
        const map = useMapEvents({
            // click(e) {
            //     setPositions((currentPositions) => [
            //         ...currentPositions,
            //         { coords: e.latlng },
            //     ]);
            // },
            // locationfound(e) {
            //     if (!userLocationSet) {
            //         setPositions((currentPositions) => [
            //             ...currentPositions,
            //             { coords: e.latlng, text: 'My position!' },
            //         ]);
            //         setUserLocationSet(true);
            //         map.flyTo(e.latlng, map.getZoom() * 1.3, {
            //             animate: true,
            //             duration: 2,
            //         });
            //     }
            // },
        });

        // useEffect(() => {
        //     if (map) {
        //         map.locate();
        //     }
        // }, [map]);

        return null;
    };

    useEffect(() => {
        fetchDataGreedy();
    }, []);

    useEffect(() => {
        if (routeResponse) {
            const newPositions = routeResponse.route.map((route) => ({
                coords: { lat: route.longitude, lng: route.latitude },
                text: 'POI Description!',
            }));
            setPositions((currentPositions) => [
                ...currentPositions,
                ...newPositions,
            ]);
        }
    }, [routeResponse]);

    return (
        <div
            style={{
                height: '100%',
                width: '100%',
                overflow: 'hidden',
                borderWidth: 1,
                borderColor: 'black',
            }}
        >
            <MapContainer
                style={{
                    height: '85%',
                    width: '100%',
                    borderColor: 'black',
                }}
                center={[46.5417, 24.5617]}
                zoom={13}
                scrollWheelZoom={true}
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                {positions.map((position, index) => (
                    <Marker
                        key={index}
                        position={position?.coords}
                        icon={
                            new L.Icon({
                                iconUrl:
                                    'https://unpkg.com/leaflet@1.9.3/dist/images/marker-icon.png',
                                iconSize: [25, 41],
                                iconAnchor: [12, 41],
                                popupAnchor: [1, -34],
                            })
                        }
                    >
                        <Popup>
                            {position.text || (
                                <div>
                                    <div
                                        style={{
                                            width: '100%',
                                            textAlign: 'center',
                                            fontWeight: '800',
                                            marginBottom: '5px',
                                        }}
                                    >
                                        Marker {index + 1}
                                    </div>
                                    Latitude: {position.coords.lat}
                                    <br />
                                    Longitude: {position.coords.lng}
                                </div>
                            )}
                        </Popup>
                    </Marker>
                ))}
                {positions?.length > 1 && (
                    <RoutingControl positions={positions} />
                )}

                <LocationMarker />
                <PositionTracker />
            </MapContainer>
        </div>
    );
};

export default OpenStreetMap;
