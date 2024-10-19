export interface IPosition {
    coords: {
        lat: number;
        lng: number;
    };
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
