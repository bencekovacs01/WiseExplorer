export interface IPosition {
    coords: ICoordinate;
    text?: string;
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
