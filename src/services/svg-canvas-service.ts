// import { AutoWired, Singleton } from 'typescript-ioc';
const uniqid = require("uniqid");

import * as d3 from "d3";
import * as $ from "jquery";

import { NS } from "../helpers/namespaces-helper";

interface IViewBox {
    minX: number;
    minY: number;
    width: number;
    height: number;
}

// @Singleton
export class SvgCanvasService {
    private svgCanvases: SVGElement[];

    constructor() {
        this.svgCanvases = [];
    }

    get canvas() {
        if (this.svgCanvases.length > 0) {
            return this.svgCanvases[0];
        } else {
            return null;
        }
    }

    public createNewCanvas(): SVGElement {
        // Create canvas
        let svgCanvas = <SVGElement>document.createElementNS(NS.SVG, "svg");
        $(svgCanvas).attr({
            id: uniqid(),
            height: 500,
            width: 500,
            viewBox: "0 0 500 500"
        });
        return svgCanvas;
    }

    public registerCanvas(): void {

    }

    public unregisterCanvas(): void {

    }

    public showCanvas(canvas: SVGElement): void {

    }

    public hideCanvas(canvas: SVGElement): void {

    }

    public magnifyCanvas(canvas: SVGElement, focusOn: IViewBox, durationMS: number = 0): void {

        // Verify that the canvas has an id
        if (canvas.id == null || canvas.id == "") {
            canvas.id = uniqid();
        }

        // Setup the attr value
        let attrValueString = `${focusOn.minX} ${focusOn.minY} ${focusOn.width} ${focusOn.height}`;

        // Check if it should be animated
        if (durationMS == 0) {
            canvas.setAttributeNS(NS.SVG, "viewBox", attrValueString);
        } else {

            // If there is no viewbox attribute create one with defaults
            if (!canvas.hasAttributeNS(NS.SVG, "viewBox")) {
                let { width, height } = canvas.getBoundingClientRect();
                canvas.setAttributeNS(NS.SVG, "viewBox", `0 0 ${width} ${height}`);
            }

            // Animate the viewBox changing
            let transition = d3.select(canvas)
                .transition()
                .attr("viewBox", attrValueString)
                .ease(d3.easeCubic)
                .duration(durationMS);
        }
    }
}