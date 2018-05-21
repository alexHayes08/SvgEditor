const uniqid = require("uniqid");

import * as d3 from "d3";

import { IDrawable } from "./idrawable";
import { NS } from "../helpers/namespaces-helper";

class Stop implements IDrawable {
    //#region Fields

    private _color: d3.ColorSpaceObject;
    private element: SVGStopElement;

    //#endregion

    //#region Ctor

    public constructor() {
        this._color = d3.color("rgb(0,0,0)");
        this.element = <SVGStopElement>document.createElementNS(NS.SVG, "stop");
    }

    //#endregion

    //#region Properties

    public get color {
        return this._color;
    }

    public set color(value: d3.ColorSpaceObject) {
        this._color = value;
        this.update();
    }

    //#endregion

    //#region Functions

    public getElement(): SVGStopElement {
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

    public setStop(): void {

    }

    public draw(): void {

    }

    public update(): void {

    }

    public erase(): void {

    }

    //#endregion
}