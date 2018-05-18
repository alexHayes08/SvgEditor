import { ISvgAction } from "../models/isvg-action";

export interface ISvgActionService {
    setActionLimit(value: number): void;
    getActionLimit(): number;
    getCurrentActionIndex(): number;
    applyAction(action: ISvgAction): void;
    undoAction(): boolean;
    redoAction(): boolean;
}