import React, {
    createContext,
    useContext,
    useState,
    ReactNode,
    useRef,
} from 'react';
import L from 'leaflet';
import { ICoordinate, IMainInstruction, IPosition } from '../models/models';

interface MapContextType {
    pois: IPosition[];
    setPois: (pois: IPosition[] | ((prev: IPosition[]) => IPosition[])) => void;
    instructions: IMainInstruction[];
    setInstructions: (instructions: IMainInstruction[]) => void;
    instructionsVisible: boolean;
    setInstructionsVisible: (visible: boolean) => void;
    markersRef: React.RefObject<L.Circle[]>;
    instructionWaypointsRef: React.RefObject<L.LatLng[]>;
    mapRef: React.RefObject<L.Map[] | null>;
    handleInstructionClicked: (index: number) => void;
    currentPosition: IPosition | null;
    setCurrentPosition: (position: IPosition | null) => void;
    coordinates: ICoordinate[] | null;
    setCoordinates: (coords: ICoordinate[]) => void;
    navigationType: NavigationType;
    setNavigationType: (type: NavigationType) => void;
    evaporationRate: number;
    setEvaporationRate: (rate: number) => void;
    iterations: number;
    setIterations: (iterations: number) => void;
    selectedCategoryGroups: SelectedCategories;
    setSelectedCategoryGroups: (
        categories:
            | SelectedCategories
            | ((prev: SelectedCategories) => SelectedCategories),
    ) => void;
    selectedCategories: SelectedCategories;
    setSelectedCategories: (
        categories:
            | SelectedCategories
            | ((prev: SelectedCategories) => SelectedCategories),
    ) => void;
    mainContentStyle: React.CSSProperties;
    setMainContentStyle: (style: React.CSSProperties) => void;
}

interface SelectedCategories {
    [id: string]: boolean;
}

export type NavigationType = 'car' | 'foot';

export const MapContext = createContext<MapContextType>({
    mainContentStyle: { height: '100%' },
    setMainContentStyle: () => {},
    pois: [],
    setPois: function (
        pois: IPosition[] | ((prev: IPosition[]) => IPosition[]),
    ): void {
        throw new Error('Function not implemented.');
    },
    instructions: [],
    setInstructions: function (instructions: IMainInstruction[]): void {
        throw new Error('Function not implemented.');
    },
    instructionsVisible: false,
    setInstructionsVisible: function (visible: boolean): void {
        throw new Error('Function not implemented.');
    },
    markersRef: React.createRef<L.Circle[]>(),
    instructionWaypointsRef: React.createRef<L.LatLng[]>(),
    mapRef: React.createRef<L.Map[] | null>(),
    handleInstructionClicked: function (index: number): void {
        throw new Error('Function not implemented.');
    },
    currentPosition: null,
    setCurrentPosition: function (position: IPosition | null): void {
        throw new Error('Function not implemented.');
    },
    coordinates: null,
    setCoordinates: function (coords: ICoordinate[]): void {
        throw new Error('Function not implemented.');
    },
    navigationType: 'car',
    setNavigationType: function (type: NavigationType): void {
        throw new Error('Function not implemented.');
    },
    evaporationRate: 0,
    setEvaporationRate: function (rate: number): void {
        throw new Error('Function not implemented.');
    },
    iterations: 0,
    setIterations: function (iterations: number): void {
        throw new Error('Function not implemented.');
    },
    selectedCategoryGroups: {},
    setSelectedCategoryGroups: function (
        categories:
            | SelectedCategories
            | ((prev: SelectedCategories) => SelectedCategories),
    ): void {
        throw new Error('Function not implemented.');
    },
    selectedCategories: {},
    setSelectedCategories: function (
        categories:
            | SelectedCategories
            | ((prev: SelectedCategories) => SelectedCategories),
    ): void {
        throw new Error('Function not implemented.');
    },
});
export const MapProvider: React.FC<{ children: ReactNode }> = ({
    children,
}) => {
    const [pois, setPois] = useState<IPosition[]>([]);
    const [instructions, setInstructions] = useState<IMainInstruction[]>([]);
    const [instructionsVisible, setInstructionsVisible] =
        useState<boolean>(false);
    const [currentPosition, setCurrentPosition] = useState<IPosition | null>(
        null,
    );
    const [coordinates, setCoordinates] = useState<ICoordinate[] | null>(null);
    const [navigationType, setNavigationType] = useState<NavigationType>('car');

    const [evaporationRate, setEvaporationRate] = useState<number>(0.5);
    const [iterations, setIterations] = useState<number>(100);

    const markersRef = useRef<L.Circle[]>([]);
    const instructionWaypointsRef = useRef<L.LatLng[]>([]);
    const mapRef = useRef<L.Map[] | null>([]);

    const [mainContentStyle, setMainContentStyle] =
        useState<React.CSSProperties>({ height: '100%' });

    const [selectedCategoryGroups, setSelectedCategoryGroups] =
        useState<SelectedCategories>({});
    const [selectedCategories, setSelectedCategories] =
        useState<SelectedCategories>({});

    const handleInstructionClicked = (index: number) => {
        if (instructionWaypointsRef.current && mapRef.current) {
            const waypoint = instructionWaypointsRef.current[index];
            markersRef.current.forEach((marker) => {
                marker.setStyle({ opacity: 0 });
            });
            markersRef.current[index].setStyle({ opacity: 1 });
            mapRef.current?.[0]?.setView(waypoint, 17);
        }
    };

    const value = {
        pois,
        setPois,
        instructions,
        setInstructions,
        instructionsVisible,
        setInstructionsVisible,
        markersRef,
        instructionWaypointsRef,
        mapRef,
        handleInstructionClicked,
        currentPosition,
        setCurrentPosition,
        coordinates,
        setCoordinates,
        navigationType,
        setNavigationType,
        evaporationRate,
        setEvaporationRate,
        iterations,
        setIterations,
        selectedCategoryGroups,
        setSelectedCategoryGroups,
        selectedCategories,
        setSelectedCategories,
        mainContentStyle,
        setMainContentStyle,
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
