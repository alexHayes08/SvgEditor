import { AutoWired, Singleton } from "typescript-ioc";
const uniqid = require("uniqid");

import * as d3 from "d3";
import * as $ from "jquery";

import { NS } from "../helpers/namespaces-helper";

export interface IViewBox {
    minX: number;
    minY: number;
    width: number;
    height: number;
}

@Singleton
export class SvgCanvasService {
    private svgCanvases: SVGGraphicsElement[];

    constructor() {
        this.svgCanvases = [];
    }

    get canvases() {

        // This returns a copy of the list.
        return [ ...this.svgCanvases ];
    }

    /**
     * Creates a new svg canvas and gives it a unique id. This doesn't register
     * the canvas though.
     */
    public createNewCanvas(): SVGGraphicsElement {
        // Create canvas
        let svgCanvas = <SVGGraphicsElement>document.createElementNS(NS.SVG, "svg");
        $(svgCanvas).attr({
            id: uniqid(),
            height: 500,
            width: 500,
            viewBox: "0 0 500 500"
        });
        return svgCanvas;
    }

    /**
     * Stores a reference to a svg canvas. Will also add an id to the canvas
     * if not present.
     * @param canvas 
     */
    public registerCanvas(canvas: SVGGraphicsElement): void {
        
        // Check if the canvas has an id.
        if (canvas.id == "") {
            canvas.id = uniqid();
        }
        this.svgCanvases.push(canvas);
    }

    /**
     * Removes a canvas from the 'registered' canvases list.
     * @param canvas
     */
    public unregisterCanvas(canvas: SVGGraphicsElement): void {
        this.svgCanvases = this.svgCanvases.filter(c => c !== canvas);
    }

    public magnifyCanvas(canvas: SVGGraphicsElement, focusOn: IViewBox, durationMS: number = 0): void {

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