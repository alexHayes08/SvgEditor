import { ISvgAction } from './../isvg-action';
import { IRotationMatrix } from '../../services/svg-geometry-service';
import { SvgItem } from '../svg-item-model';

export class RotationAction implements ISvgAction {
    //#region Fields

    private items: SvgItem[];
    private matrix: IRotationMatrix;

    //#endregion

    //#region Ctor

    public constructor(matrix: IRotationMatrix, items: SvgItem[]) {

        // Create copy of items.
        this.items = items;
        this.matrix = matrix;
    }

    //#endregion

    //#region Functions

    applyOperation(): void {
        throw new Error("Method not implemented.");
    }

    undoOperation(): void {
        throw new Error("Method not implemented.");
    }

    //#endregion
}