import ISvgType from "./isvg-type";
import { SvgCanvas } from "./svg-canvas-model";

export interface ISvgAction {
    applyOperation(): void;
    undoOperation(): void;
}
