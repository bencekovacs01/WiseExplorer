export interface IPosition {
    coords: {
        lat: number;
        lng: number;
    };
    tags?: {
        name?: string;
        [key: string]: any;
    };
    clusterInfo?: Array<{
        category?: string | null;
        subCategory?: string | null;
        clusteredIds: number[];
    }>;
}

interface ICategory {
    category_name: string;
    category_group: string;
}

interface IOsmTag {
    opening_hours: string;
    website: string;
    phone: string;
    name: string;
}

export interface IText {
    type: string;
    distance: number;
    time: number;
    road: string;
    direction: string;
    index: number;
    mode: string;
    text: string;
}

export interface IInstruction {
    index: number;
    text: IText;
}

export interface IMainInstruction {
    routeNumber: number;
    instructions: IInstruction[];
}

export interface IWaypoint {
    lat: number;
    lng: number;
}

export interface ICoordinate {
    lat: number;
    lng: number;
}
