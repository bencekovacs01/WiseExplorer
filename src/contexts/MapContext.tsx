import React, {
    createContext,
    useContext,
    useState,
    ReactNode,
    useRef,
} from 'react';
import L from 'leaflet';
import { IMainInstruction } from '../models/models';

interface MapContextType {
    instructions: IMainInstruction[];
    setInstructions: (instructions: IMainInstruction[]) => void;
    instructionsVisible: boolean;
    setInstructionsVisible: (visible: boolean) => void;
    markersRef: React.RefObject<L.Circle[]>;
    instructionWaypointsRef: React.RefObject<L.LatLng[]>;
    mapRef: React.RefObject<L.Map[] | null>;
    handleInstructionClicked: (index: number) => void;
}

const MapContext = createContext<MapContextType | undefined>(undefined);

export const MapProvider: React.FC<{ children: ReactNode }> = ({
    children,
}) => {
    const [instructions, setInstructions] = useState<IMainInstruction[]>([]);
    const [instructionsVisible, setInstructionsVisible] =
        useState<boolean>(false);

    const markersRef = useRef<L.Circle[]>([]);
    const instructionWaypointsRef = useRef<L.LatLng[]>([]);
    const mapRef = useRef<L.Map[] | null>([]);

    const handleInstructionClicked = (index: number) => {
        if (instructionWaypointsRef.current && mapRef.current) {
            const waypoint = instructionWaypointsRef.current[index];
            markersRef.current.forEach((marker) =>
                marker.setStyle({ opacity: 0 }),
            );
            markersRef.current[index].setStyle({ opacity: 1 });
            mapRef.current?.[0]?.setView(waypoint, 17);
        }
    };

    const value = {
        instructions,
        setInstructions,
        instructionsVisible,
        setInstructionsVisible,
        markersRef,
        instructionWaypointsRef,
        mapRef,
        handleInstructionClicked,
    };

    return <MapContext.Provider value={value}>{children}</MapContext.Provider>;
};

export const useMapContext = (): MapContextType => {
    const context = useContext(MapContext);
    if (!context) {
        throw new Error('useMapContext must be used within a MapProvider');
    }
    return context;
};
