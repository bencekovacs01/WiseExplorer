import { Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { useMapContext } from '@/src/contexts/MapContext';
import usePositionTracker from '@/src/hooks/usePositionTracker';
import { PersonPin } from '@mui/icons-material';
import ReactDOMServer from 'react-dom/server';
import { Button } from '@mui/material';
import { Pause, PlayArrow } from '@mui/icons-material';
import { useEffect } from 'react';

const PositionTracker = () => {
    const { currentPosition, mapRef } = useMapContext();
    const { togglePause, isPaused } = usePositionTracker();

    const map = useMap();

    useEffect(() => {
        if (map && mapRef)
            mapRef?.current?.splice?.(0, mapRef?.current.length, map);
    }, [map, mapRef]);

    return (
        <>
            {currentPosition && (
                <Marker
                    key={currentPosition?.coords.lat}
                    position={currentPosition?.coords || { lat: 0, lng: 0 }}
                    icon={L.divIcon({
                        html: `<div style="background-color: transparent">
                                  ${ReactDOMServer.renderToString(
                                      <PersonPin
                                          style={{
                                              fontSize: 30,
                                              color: 'darkblue',
                                          }}
                                      />,
                                  )}
                               </div>`,
                        className: '',
                        iconAnchor: [14, 20],
                    })}
                >
                    <Popup>{"I'm here"}</Popup>
                </Marker>
            )}

            <Button
                variant="contained"
                color="primary"
                onClick={togglePause}
                style={{
                    position: 'absolute',
                    bottom: '100px',
                    right: '10px',
                    zIndex: 1000,
                    height: '50px',
                    width: '50px',
                    borderRadius: '10%',
                    padding: 0,
                    minWidth: 0,
                }}
            >
                {isPaused ? <PlayArrow /> : <Pause />}
            </Button>
        </>
    );
};

export default PositionTracker;
