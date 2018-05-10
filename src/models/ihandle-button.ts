export interface IMode {
    label: string;
    selected: boolean;
}

export interface IHandleButton {
    dataName: string;
    modes: IMode[];
    arcDataName: string;
}