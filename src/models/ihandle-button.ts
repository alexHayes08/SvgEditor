export enum HandleMode {
    PAN = 0,
    SCALE = 1,
    ROTATE = 2,
    COLORS = 3,
    EDIT = 4,
    DELETE = 5,
    SELECT_MODE = 6
};

export interface IMode {
    label: string;
    selected: boolean;
}

export interface IHandleButton {
    dataName: string;
    modes: IMode[];
    arcDataName: string;
}