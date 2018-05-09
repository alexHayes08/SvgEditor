export interface IMode {
    label: string
}

export interface IHandleButton {
    dataName: string;
    modes: IMode[];
    arcDataName: string;
}