import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
// import 'leaflet-routing-machine';
import { useMap } from 'react-leaflet';
import { IInstruction, IPosition, IWaypoint } from '@/src/models/models';
import { useMapContext } from '@/src/contexts/MapContext';

interface RoutingControlProps {
    positions: IPosition[];
}

const RoutingControl: React.FC<RoutingControlProps> = ({ positions }) => {
    const {
        setInstructions,
        setInstructionsVisible,
        markersRef,
        instructionWaypointsRef,
        mapRef,
    } = useMapContext();

    // const [instructionsVisible, setInstructionsVisible] =
    //     useState<boolean>(false);

    // const instructionWaypointsRef = useRef<L.LatLng[]>([]);
    // const markersRef = useRef<L.Circle[]>([]);
    const map = useMap();

    useEffect(() => {
        if (map && mapRef)
            mapRef?.current?.splice?.(0, mapRef?.current.length, map);
    }, [map, mapRef]);

    useEffect(() => {
        return;

        if (!map || positions?.length < 2) return;

        const waypoints = positions.map((position) =>
            L.latLng(position.coords.lat, position.coords.lng),
        );

        const routingControl = L.Routing.control({
            waypoints,
            lineOptions: {
                styles: [{ color: 'blue', weight: 2 }],
                extendToWaypoints: true,
                missingRouteTolerance: 0,
            },
            addWaypoints: false,
            routeWhileDragging: true,
            fitSelectedRoutes: true,
            showAlternatives: false,
            show: false,
        })?.addTo?.(map);

        routingControl.on('routesfound', (e: any) => {
            const routes = e.routes;

            const newInstructions = routes.map((route: any, index: number) => ({
                routeNumber: index + 1,
                instructions: route?.instructions?.map?.(
                    (instruction: string, i: number) => ({
                        text: instruction || 'No instructions',
                        index: i,
                    }),
                ),
            }));

            const instructionWaypoints = routes[0]?.instructions?.map?.(
                (instruction: IInstruction) => {
                    const { lat, lng } =
                        routes[0]?.coordinates?.[instruction?.index];
                    return L.latLng(lat, lng);
                },
            );

            setInstructions(newInstructions);
            instructionWaypointsRef?.current?.splice(
                0,
                instructionWaypointsRef.current.length,
                ...instructionWaypoints,
            );

            if ((markersRef && markersRef?.current?.length) || 0 > 0) {
                markersRef?.current?.forEach?.((marker) =>
                    map.removeLayer(marker),
                );
                markersRef?.current?.splice(0, markersRef?.current?.length);
            }

            instructionWaypoints.forEach(
                (waypoint: IWaypoint, index: number) => {
                    const circle = L.circle(waypoint, {
                        radius: 5,
                        color: 'red',
                        fillColor: '#f03',
                        fillOpacity: 0,
                        opacity: 0,
                    }).addTo(map);

                    markersRef.current?.push(circle);
                },
            );

            setInstructionsVisible(true);
        });

        return () => {
            if (map && routingControl) {
                map.removeControl(routingControl);
            }
        };
    }, [
        instructionWaypointsRef,
        map,
        markersRef,
        positions,
        setInstructions,
        setInstructionsVisible,
    ]);

    // const handleInstructionClicked = (index: number) => {
    //     if (instructionWaypointsRef.current) {
    //         const waypoint = instructionWaypointsRef.current[index];
    //         markersRef.current.forEach((marker) =>
    //             marker.setStyle({ opacity: 0 }),
    //         );
    //         markersRef.current[index].setStyle({ opacity: 1 });
    //         map.setView(waypoint, 17);
    //     }
    // };

    // const handleMouseLeave = (index: number) => {
    //     if (markersRef.current[index]) {
    //         markersRef.current[index].setStyle({ opacity: 0 });
    //     }
    // };

    return null;
    // return instructionsVisible ? (
    //     <div
    //         style={{
    //             position: 'absolute',
    //             top: '10px',
    //             right: '10px',
    //             background: 'white',
    //             zIndex: 100000,
    //             padding: '10px',
    //             borderRadius: '4px',
    //             boxShadow: '0 0 5px rgba(0,0,0,0.8)',
    //             height: 'calc(100vh / 2)',
    //             width: 'calc(100vw / 2)',
    //             overflow: 'scroll',
    //         }}
    //         onMouseDown={handleMouseDown}
    //     >
    //         <button
    //             onClick={() => setInstructionsVisible(false)}
    //             style={{
    //                 position: 'absolute',
    //                 top: '5px',
    //                 right: '5px',
    //                 background: 'red',
    //                 color: 'white',
    //                 border: 'none',
    //                 borderRadius: '50%',
    //                 width: '50px',
    //                 height: '50px',
    //                 cursor: 'pointer',
    //                 fontSize: 20,
    //             }}
    //         >
    //             X
    //         </button>

    //         {instructions.length > 0 ? (
    //             instructions.map(({ routeNumber, instructions }) => (
    //                 <div key={routeNumber}>
    //                     <div style={{ fontWeight: 'bold', fontSize: 20 }}>
    //                         Instructions
    //                     </div>
    //                     <ul style={{}}>
    //                         {instructions.map(({ text, index }) => (
    //                             <li
    //                                 key={index}
    //                                 // onMouseEnter={() => handleMouseEnter(index)}
    //                                 // onMouseLeave={() => handleMouseLeave(index)}
    //                                 onMouseDownCapture={() =>
    //                                     handleMouseEnter(index)
    //                                 }
    //                                 style={{
    //                                     cursor: 'pointer',
    //                                     marginTop: 5,
    //                                 }}
    //                             >
    //                                 {`${index + 1}. ${text?.text}`}
    //                             </li>
    //                         ))}
    //                     </ul>
    //                 </div>
    //             ))
    //         ) : (
    //             <p>No routes found. Please adjust your waypoints.</p>
    //         )}
    //     </div>
    // ) : (
    //     <button
    //         onClick={() => setInstructionsVisible(true)}
    //         style={{
    //             position: 'absolute',
    //             top: '10px',
    //             right: '10px',
    //             background: 'white',
    //             zIndex: 1000,
    //             padding: '10px',
    //             borderRadius: '4px',
    //             boxShadow: '0 0 5px rgba(0,0,0,0.8)',
    //         }}
    //     >
    //         Show Instructions
    //     </button>
    // );
};

export default RoutingControl;
