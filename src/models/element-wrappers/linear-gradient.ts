const uniqid = require("uniqid");

import * as d3 from "d3";

import { IDrawable } from "../idrawable";
import { NS } from "../../helpers/namespaces-helper";
import { StopData } from "./stop-data";

export class LinearGradient implements IDrawable {
    //#region Fields

    private _id: string;
    private element?: SVGLinearGradientElement;
    private stopData: StopData[];

    //#endregion

    //#region Ctor

    public constructor() {
        this._id = uniqid();
        this.stopData = [];
    }

    //#endregion

    //#region Functions

    public getElement(): SVGLinearGradientElement {
        if (this.element == undefined) {
            throw new Error("The element was undefined.");
        }

        return this.element;
    }

    public setStop(index: number = 0, stop: StopData): void {
        if (this.stopData.length < index) {
            return;
        }

        this.stopData[index] = stop;
    }

    public getStop(index: number = 0): StopData {
        return this.stopData[index];
    }

    public draw(): void {
        d3.select(this.getElement())
            .selectAll("stops")
            .data(this.stopData)
            .enter()
            .append("stops")
            .attr("offset", function(d) { return d.offset.toString(); })
            .attr("stop-color", function(d) { return d.color.toString(); })
    }

    public update(): void {
        let stops = d3.select(this.getElement())
            .selectAll("stops")
            .data(this.stopData)
            .attr("offset", function(d) { return d.offset.toString(); })
            .attr("stop-color", function(d) { return d.color.toString(); })

        stops.exit().remove();
    }

    public erase(): void {
        this.getElement().remove();
    }

    //#endregion
}