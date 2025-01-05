import { useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import ReactDOMServer from 'react-dom/server';
import { Button } from '@mui/material';
import { SelectAll, Deselect, PushPin } from '@mui/icons-material';
import { use, useEffect, useState } from 'react';
import { useShallow } from 'zustand/shallow';
import usePOIStore from '@/src/store/poiStore';

import InterestsIcon from '@mui/icons-material/Interests';
import { useMapContext } from '@/src/contexts/MapContext';

import data from './data.json';
import distances from './distances.json';
import ACO from '@/src/services/AcoService';
import Coordinate from '@/src/models/Coordinate';

const Aco = () => {
    const map = useMap();

    const [isSelecting, setIsSelecting] = useState<boolean>(false);
    const [corners, setCorners] = useState<L.LatLng[]>([]);

    const { setPois } = useMapContext();

    const [loadDistanceMatrix] = usePOIStore(
        useShallow((state) => [state.loadDistanceMatrix]),
    );

    const [distanceMatrix, setDistanceMatrix] = useState<number[][]>(distances);
    console.log('distanceMatrix', distanceMatrix);

    const points = data?.map((poi) => new Coordinate(poi.lat, poi.lng));

    const aco = new ACO({
        distanceMatrix,
        numAnts: 10,
        alpha: 1,
        beta: 5,
        evaporationRate: 0.5,
        iterations: 100,
    });

    // aco.run((iteration, bestTour, bestDistance, colors) => {
    //     console.log('colors', colors);
    //     console.log(
    //         `Iteration: ${iteration}, Best Tour: ${bestTour}, Best Distance: ${bestDistance}`,
    //     );

    //     map.eachLayer((layer) => {
    //         if (layer instanceof L.CircleMarker) {
    //             map.removeLayer(layer);
    //         }
    //     });

    //     colors.forEach((color, index) => {
    //         const point = points[index];
    //         L.circleMarker([point.latitude, point.longitude], {
    //             radius: 6,
    //             color,
    //             fillColor: color,
    //             fillOpacity: 1,
    //         }).addTo(map);
    //     });
    // });

    console.log('points', points);

    useEffect(() => {
        data.forEach((poi) => {
            L.circleMarker(poi, {
                radius: 6,
                color: '#7da832',
                fillColor: '#7da832',
                fillOpacity: 1,
            }).addTo(map);
        });

        // loadDistanceMatrix(points).then((matrix: any) => {
        //     console.log('matrix', matrix);
        //     setDistanceMatrix(matrix);
        // });
    }, [map]);

    return null;
};

export default Aco;
