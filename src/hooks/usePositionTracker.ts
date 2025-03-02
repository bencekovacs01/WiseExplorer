import { useEffect, useState } from 'react';
import { useMapEvents } from 'react-leaflet';
import { useMapContext } from '@/src/contexts/MapContext';

const usePositionTracker = () => {
    const { setCurrentPosition, coordinates } = useMapContext();

    const map = useMapEvents({
        locationfound(e) {
            setCurrentPosition({
                coords: e.latlng,
            });

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
                if (index === coordinates.length - 1) {
                    setIsPaused(true);
                } else {
                    setIndex(
                        (prevIndex) => (prevIndex + 1) % coordinates.length,
                    );
                }
            }
        }, 200);

        return () => clearInterval(intervalId);
    }, [coordinates, setCurrentPosition, map, isPaused, index]);

    return { togglePause, isPaused };
};

export default usePositionTracker;
