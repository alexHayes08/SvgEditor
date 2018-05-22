import * as d3 from "d3";

import { IDrawable } from "../idrawable";
import { NS } from "./../../helpers/namespaces-helper";
import { SvgNumber } from "./../svg-number";

export class StopData {
    //#region Fields

    private _color: d3.ColorSpaceObject;
    private _offset: SvgNumber;

    //#endregion

    //#region Ctor

    public constructor() {
        this._color = d3.color("rgb(0,0,0)");
        this._offset = new SvgNumber();
    }

    //#endregion

    //#region Properties

    public get color() {
        return this._color;
    }

    public set color(value: d3.ColorSpaceObject) {
        this._color = value;
    }

    public get offset() {
        return this._offset
    }

    public set offset(value: SvgNumber) {
        this._offset = value;
    }

    public get opacity(): number {
        return this.color.opacity;
    }

    //#endregion
}