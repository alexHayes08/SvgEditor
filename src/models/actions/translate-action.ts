const uniqid = require("uniqid");

import * as d3 from "d3";

import { ISvgAction } from "../isvg-action";
import { SvgCanvas } from "../svg-canvas-model";
import { SvgItem } from "../svg-item-model";
import { isSvgGraphicsElement, getFurthestSvgOwner } from "../../helpers/svg-helpers";
import { Names } from "../names";
import { NS } from "../../helpers/namespaces-helper";
import { SvgTransformServiceSingleton, ICoords2D, TransformType, SvgTransformString } from "../../services/svg-transform-service";
import { ITranslationMatrix } from "./../../services/svg-transform-service";

export class TranslateAction implements ISvgAction {
    //#region Fields

    private items: SvgItem[];
    private matrix: ITranslationMatrix;

    //#endregion

    //#region Ctor

    public constructor(matrix: ITranslationMatrix, items: SvgItem[]) {
        this.items = items;
        this.matrix = matrix;
    }

    //#endregion

    //#region Properties

    //#endregion

    //#region Functions

    public undoOperation(): void {
        let self = this;
        this.items.map(item => {
            let element = item.getElement();
            d3.select(element)
                .attr("transform", function() {
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
                    return item.transforms.toTransformString();
                });
        });
    }

    public applyOperation(): void {
        let self = this;
        this.items.map(item => {
            let element = item.getElement();
            d3.select(element)
                .attr("transform", function() {
                    let newTransform = new SvgTransformString([
                        TransformType.TRANSLATE,
                        TransformType.MATRIX
                    ]);
                    newTransform.setMatrix(item.transforms
                            .consolidate()
                            .getMatrix())
                        .setTranslate(self.matrix);
                    item.transforms = newTransform.consolidate();
                    return item.transforms.toTransformString();
                });
        });
    }

    //#endregion
}