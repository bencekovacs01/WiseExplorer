// components/UserLocationTracker.js
import { useMapEvents, Marker, Popup } from 'react-leaflet';
import { useEffect, useState } from 'react';
import L from 'leaflet';
import { IPosition } from '@/src/models/models';

const PositionTracker = () => {
    const [currentPosition, setCurrentPosition] = useState<IPosition | null>(
        null,
    );

    console.log(
        '🚀 ~ file: PositionTracker.tsx:13 ~ PositionTracker ~ currentPosition:',
        currentPosition,
    );

    const map = useMapEvents({
        locationfound(e) {
            setTimeout(() => {
                map.locate();
            }, 3000);

            console.log('Found location: ', e.latlng);

            setCurrentPosition({
                coords: e.latlng,
            });

            map.flyTo(e.latlng, map.getZoom() * 1, {
                animate: true,
                duration: 2,
            });
        },
    });

    useEffect(() => {
        map && map.locate();
    }, [map]);

    useEffect(() => {
        const success = (pos: GeolocationPosition) => {
            console.log(
                '🚀 ~ file: PositionTracker.tsx:44 ~ success ~ pos:',
                pos,
            );
            setCurrentPosition({
                coords: { lat: pos.coords.latitude, lng: pos.coords.longitude },
            });
        };

        const error = (err: any) => {
            console.warn(`ERROR(${err.code}): ${err.message}`);
        };

        if (navigator.geolocation) {
            const watchId = navigator.geolocation.watchPosition(
                success,
                error,
                {
                    enableHighAccuracy: true,
                },
            );

            return () => {
                navigator.geolocation.clearWatch(watchId);
            };
        }
    }, [map]);

    return (
        currentPosition && (
            <Marker
                key={currentPosition?.coords.lat}
                position={currentPosition?.coords || { lat: 0, lng: 0 }}
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
                <Popup>My Current Location</Popup>
            </Marker>
        )
    );
};

export default PositionTracker;
