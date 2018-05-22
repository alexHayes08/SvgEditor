import * as d3 from "d3";

import { IDrawable } from "../idrawable";
import { NS } from "./../../helpers/namespaces-helper";
import { SvgNumber } from "./../svg-number";

export class StopData {
    //#region Fields

    public color: d3.ColorSpaceObject;
    public offset: SvgNumber;

    //#endregion

    //#region Ctor

    public constructor(color?: d3.ColorSpaceObject, offset?: SvgNumber) {
        this.color = color || d3.color("rgb(0,0,0)");
        this.offset = offset || new SvgNumber();
    }

    //#endregion

    //#region Properties

    // public get color() {
    //     return this._color;
    // }

    // public set color(value: d3.ColorSpaceObject) {
    //     this._color = value;
    // }

    // public get offset() {
    //     return this._offset
    // }

    // public set offset(value: SvgNumber) {
    //     this._offset = value;
    // }

    // public get opacity(): number {
    //     return this.color.opacity;
    // }

    //#endregion
}