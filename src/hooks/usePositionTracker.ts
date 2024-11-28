import { useEffect, useState } from 'react';
import { useMapEvents } from 'react-leaflet';
import { useMapContext } from '@/src/contexts/MapContext';

const usePositionTracker = () => {
    const { setCurrentPosition, coordinates } = useMapContext();

    const map = useMapEvents({
        locationfound(e) {
            // setTimeout(() => {
            //     map.locate();
            // }, 3000);

            setCurrentPosition({
                coords: e.latlng,
            });
            console.log('e.latlng', e.latlng);

            map.flyTo(e.latlng, map.getZoom(), {
                animate: true,
                duration: 0.5,
            });
        },
    });

    // useEffect(() => {
    //     map && map.locate();
    // }, [map]);

    const [isPaused, setIsPaused] = useState(true);
    const [index, setIndex] = useState(0);

    const togglePause = () => {
        setIsPaused((prevState) => !prevState);
    };

    useEffect(() => {
        if (isPaused) return;

        const intervalId = setInterval(() => {
            if (coordinates && coordinates.length > 0) {
                setCurrentPosition({
                    coords: {
                        lat: coordinates?.[index]?.lat,
                        lng: coordinates?.[index]?.lng,
                    },
                });
                map.flyTo(coordinates[index], map.getZoom(), {
                    animate: true,
                    duration: 0.5,
                });
                setIndex((prevIndex) => (prevIndex + 1) % coordinates.length);
            }
        }, 200);

        return () => clearInterval(intervalId);
    }, [coordinates, setCurrentPosition, map, isPaused, index]);

    return { togglePause, isPaused };

    //     const success = (pos: GeolocationPosition) => {
    //         setCurrentPosition({
    //             coords: { lat: pos.coords.latitude, lng: pos.coords.longitude },
    //         });
    //     };

    //     const error = (err: any) => {
    //         console.warn(`ERROR(${err.code}): ${err.message}`);
    //     };

    //     if (navigator.geolocation) {
    //         const watchId = navigator.geolocation.watchPosition(
    //             success,
    //             error,
    //             {
    //                 enableHighAccuracy: true,
    //             },
    //         );

    //         return () => {
    //             navigator.geolocation.clearWatch(watchId);
    //         };
    //     }
    // }, [setCurrentPosition]);
};

export default usePositionTracker;
