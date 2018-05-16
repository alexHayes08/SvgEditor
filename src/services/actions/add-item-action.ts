const uniqid = require("uniqid");

import { ISvgActionV2, ActionType } from "../../models/isvg-action";
import { SvgCanvas } from "../../models/svg-canvas-model";
import { SvgItem } from "../../models/svg-item-model";

// import { Singleton } from 'typescript-ioc';

export class AddItemAction implements ISvgActionV2 {
    //#region Fields

    private readonly _targets: SVGElement[];
    private readonly _data?: WeakMap<Element,SvgItem>;

    //#endregion

    //#region Ctor

    public constructor(elements: SVGElement[], dataMap?: WeakMap<Element,SvgItem>) {
        this._targets = elements;
        this._data = dataMap;
    }

    //#endregion

    //#region Properties

    //#endregion

    //#region Functions

    public type(): ActionType {
        return ActionType.ADD;
    }

    public targets(): SVGElement[] {
        return this._targets;
    }

    public beforeOperation(editor: SvgCanvas): void { }

    public operation(editor: SvgCanvas): void {
        this.targets().map(element => {
            
            // Check if there was is any data relative to this element
            if (this._data) {
                
                if (this._data.has(element)) {

                    let data = this._data.get(element);
                }
            }
        });
    }

    public afterOperation(editor: SvgCanvas): void { }

    //#endregion
}
