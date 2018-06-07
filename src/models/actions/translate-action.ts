import { TransformType } from '../../services/svg-geometry-service';
import { ISvgAction } from '../isvg-action';
import { SvgItem } from '../svg-item-model';
import { SvgTransformString } from '../svg-transform-string';
import { ITranslationMatrix } from './../../services/svg-geometry-service';

const uniqid = require("uniqid");

export class TranslateAction implements ISvgAction {
    //#region Fields

    private items: SvgItem[];
    private matrix: ITranslationMatrix;

    //#endregion

    //#region Ctor

    public constructor(matrix: ITranslationMatrix, items: SvgItem[]) {
        
        // Create copy of items
        this.items = [...items];
        this.matrix = matrix;
    }

    //#endregion

    //#region Functions

    public applyOperation(): void {
        let self = this;
        this.items.map(item => {
            let element = item.getElement();
            let newTransform = new SvgTransformString([
                TransformType.TRANSLATE,
                TransformType.MATRIX
            ]);
            newTransform.setMatrix(item.transforms
                    .consolidate()
                    .getMatrix())
                .setTranslate(self.matrix);
            item.transforms = newTransform.consolidate();
            item.update();
        });
    }
    
    public undoOperation(): void {
        let self = this;
        this.items.map(item => {
            let element = item.getElement();
            let newTransform = new SvgTransformString([
                TransformType.TRANSLATE,
                TransformType.MATRIX
            ]);
            newTransform.setMatrix(item.transforms
                    .consolidate()
                    .getMatrix())
                .setTranslate({
                    x: -1 * self.matrix.x,
                    y: -1 * self.matrix.y
                });

            newTransform.consolidate();
            item.transforms = newTransform;
            item.update();
        });
    }

    //#endregion
}