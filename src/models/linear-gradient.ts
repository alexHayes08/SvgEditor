const uniqid = require("uniqid");

import { IDrawable } from "./idrawable";

export class LinearGradient implements IDrawable {
    //#region Fields

    private _id: string;
    private element?: SVGLinearGradientElement;
    private parent: d3.Selection<Element, {}, null, undefined>;

    //#endregion

    //#region Ctor

    public constructor(parent: d3.Selection<Element, {}, null, undefined>) {
        this._id = uniqid();
        this.parent = parent;
    }

    //#endregion

    //#region Properties

    //#endregion

    //#region Functions

    public getElement(): SVGLinearGradientElement {
        if (this.element == undefined) {
            throw new Error("The element was undefined.");
        }

        return this.element;
    }

    public draw(): void {

    }

    public update(): void {

    }

    public erase(): void {

    }

    //#endregion
}