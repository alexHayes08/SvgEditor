const uniqid = require("uniqid");

import * as $ from "jquery";
import { AutoWired, Inject } from 'typescript-ioc';
import * as d3 from "d3";

import { DefaultCircleArc } from "./islice";
import { ISvgHandles } from "./isvg-handles-model";
import { IViewBox } from "../services/svg-canvas-service";
import { NS } from "../helpers/namespaces-helper";
import { SvgDefs } from "./svg-defs-model";
import { SvgEditor } from "./svg-editor-model";
import { SvgHandles } from "./svg-handles-model";
import { SvgMaskService } from "../services/svg-mask-service";
import { SvgTransformService, SvgTransformServiceSingleton } from "../services/svg-transform-service";
import {
    DefaultTransitionStartEvtData, 
    DefaultTransitionEndEvtData, 
    DefaultTransitionInterruptEvtData, 
    TransitionStatus, 
    ITransitionEventData 
} from "./transition-status";

export const SVG_CANVAS_NAMES = {
    
    // [Class Names]
    
    EDITOR_CLASS: "editor",
    SYMBOLS_CLASS: "symbol-container",

    // [End Class Names]

    // [Event Names]

    ON_VIEWBOX_EVT_NAME: "canvas-viewbox-change",
    ON_WIDTH_EVT_NAME: "canvas-width-change",
    ON_HEIGHT_EVT_NAME: "canvas-height-change"

    // [End Event Names]
}

/**
 * This is a replacement for the SvgCanvasService.
 */
export class SvgCanvas {
    
    // [Fields]

    public readonly svgCanvas_el: SVGElement;
    public readonly svgCanvas_id: string;
    private defs_el: SVGDefsElement;
    private symbols_el: SVGGElement;
    private symbols_id: string;
    private underEditor_el: SVGGElement;
    private underEditor_id: string;
    private editor_el: SVGGElement;
    private editor_id: string;
    private overEditor_el: SVGGElement;
    private overEditor_id: string;
    private handles_el: SVGGElement;
    private handles_id: string;

    private _defs: SvgDefs;
    private _editor: SvgEditor;
    private _handles: ISvgHandles;

    private transformService: SvgTransformService;
    
    // @Inject
    // private maskService: SvgMaskService;

    // [End Fields]

    // [Ctor]

    /**
     * Creates an SvgCanvas object.
     * @param width - Sets the width of the svg element.
     * @param height - Sets the height of the svg element.
     * @param viewbox - Sets the viewBox of the svg element.
     * @param parentElement - The element the svg element will be appended to.
     * @param importSvg - Optional string of the raw svg data.
     */
    public constructor(width: number,
        height: number,
        viewbox: IViewBox,
        parentElement: HTMLElement,
        importSvg: string|null = null)
    {
        this.transformService = SvgTransformServiceSingleton;

        // Create svg element
        this.svgCanvas_el = <SVGElement>document.createElementNS(NS.SVG, "svg");

        // Set attributes
        this.svgCanvas_id = uniqid();
        this.svgCanvas_el.id = this.svgCanvas_id;
        $(this.svgCanvas_el).attr({
            "viewBox": `${viewbox.minX} ${viewbox.minY} ${viewbox.width} ${viewbox.height}`,
            "width": width.toString(),
            "height": height.toString(),
            "data-name": "svg-canvas-editor",
            "overflow": "auto"
        });

        // Create defs element & symbolsContainer element
        this.defs_el = <SVGDefsElement>document.createElementNS(NS.SVG, "defs");
        this.defs_el.setAttribute("data-name", "defs-container");
        this.symbols_el = <SVGGElement>document.createElementNS(NS.SVG, "g");

        this.symbols_id = uniqid();
        $(this.symbols_el).attr({
            id: this.svgCanvas_id,
            "data-name": "symbols-container",
            "class": SVG_CANVAS_NAMES.SYMBOLS_CLASS
        });

        // Create underEditor element
        this.underEditor_el = <SVGGElement>document.createElementNS(NS.SVG, "g");
        this.underEditor_id = uniqid();
        $(this.underEditor_el).attr({
            id: this.underEditor_id,
            "data-name": "under-editor-area"
        });

        // Create editor element
        this.editor_el = <SVGGElement>document.createElementNS(NS.SVG, "g");
        this.editor_id = uniqid();
        $(this.editor_el).attr({
            id: this.editor_id,
            // viewBox: "0 0 500 500",
            // x: 0,
            // y: 0,
            // width: 500,
            // height: 500,
            "class": SVG_CANVAS_NAMES.EDITOR_CLASS,
            "data-name": "editor-area"
        });

        // Create overEditor element
        this.overEditor_el = <SVGGElement>document.createElementNS(NS.SVG, "g");
        this.overEditor_id = uniqid();
        $(this.overEditor_el).attr({
            id: this.overEditor_id,
            "data-name": "over-editor-area"
        });

        // Create handles element
        this.handles_el = <SVGGElement>document.createElementNS(NS.SVG, "g");
        this.handles_id = uniqid();
        $(this.handles_el).attr({
            id: this.handles_id,
            "data-name": "handles-area"
        });

        // Create handles

        // Compose elements together
        this.svgCanvas_el.appendChild(this.defs_el);
        this.svgCanvas_el.appendChild(this.symbols_el);
        this.svgCanvas_el.appendChild(this.underEditor_el);
        this.svgCanvas_el.appendChild(this.editor_el);
        this.svgCanvas_el.appendChild(this.overEditor_el);
        this.svgCanvas_el.appendChild(this.handles_el);

        // And append the svg to the parent container
        parentElement.appendChild(this.svgCanvas_el);

        this._defs = new SvgDefs(this.defs_el);

        this._editor = new SvgEditor(this.underEditor_el, 
            this.editor_el, 
            this.overEditor_el);

        // Handles data
        // Handles should have five parts:
        // 1) 30 deg red close arc
        // 2) 30 deg yellow pan arc
        // 3) 30 deg blue scale arc
        // 4) 30 deg green rotate arc
        // 5) 240 deg grey fill arc
        let handlesData = new DefaultCircleArc({
            startAngleOffset: 0,
            defaultColor: "gray",
            radius: 100,
            defaultWidth: 8,
            slices: [
                {
                    name: "fill",
                    angle: 270
                },
                {
                    name: "rotate-arc",
                    angle: 30,
                    color: "green"
                },
                {
                    name: "scale-arc",
                    angle: 30,
                    color: "blue"
                },
                {
                    name: "pan-arc",
                    angle: 30,
                    color: "yellow"
                },
                {
                    name: "close-arc",
                    angle: 30,
                    color: "red"
                }
            ]
        });

        this._handles = new SvgHandles(this.handles_el, 
            this._defs, 
            handlesData);

        /**
         * [EVENT LISTENERS]
         * 
         * Ideally ALL event listeners will be added thru the ui instead of
         * here. There should be only TWO event listeners, on for the handles
         * and one for the editor area. The handle events must NOT be
         * propagated to the editor.
         */

        // Attach event listener to canvas
        // this.svgCanvas_el.addEventListener("click", this.onSvgCanvasMouseDown);
        // $(this.svgCanvas_el).on("mousedown", this.onSvgCanvasMouseDownV2.bind(this));

        // Capture class vars
        let editor = this.editor;
        let handles = this.handles;
        let svgCanvas_el = this.svgCanvas_el;
        let transformService = this.transformService;
        d3.select(this.svgCanvas_el).on("mousedown", function(d,i) {
            let { pageX:x, pageY:y } = d3.event;
            // let point = transformService.convertScreenCoordsToSvgCoords(
            //     { x, y }, 
            //     <SVGSVGElement>svgCanvas_el);

            // let items = editor.getItemsIntersectionPoint(point);
            
            // If ctrl is not down, deselect all objects and only select the
            // topmost element clicked.
            // if (!d3.event.ctrlKey) {
            //     handles.deselectObjects();
            //     let topMostItem = items.pop();

            //     if (topMostItem != undefined) {
            //         handles.selectObjects(topMostItem);
            //     }
            // } else {
            //     handles.selectObjects(...items);
            // }
            
            // console.log(items);
            handles.deselectObjects();     
        });

        // $(this.handles_el).on("mousedown", function(e) {
            
        //     console.log("Handles evt occurred");

        //     // Stop propagation, the editor must NOT recieve handle events.
        //     return false;
        // });

        /**
         * [End EVENT LISTENERS]
         */
    }

    // [End Ctor]

    // [Properties]

    get defs() {
        return this._defs;
    }

    get symbols() {
        return {};
    }

    get underEditor() {
        return {};
    }

    get editor() {
        return this._editor;
    }

    get overEditor() {
        return {};
    }

    get handles() {
        return this._handles;
    }

    // [End Properties]

    // [Functions]

    // [Evt Handlers]

    public onSvgCanvasMouseDownV2(data: {}, i: number) {
        // let { pageX:x, pageY:y } = data;
        
        // let point = this.transformService.convertScreenCoordsToSvgCoords(
        //     { x, y }, 
        //     <SVGSVGElement>this.svgCanvas_el);

        // let items = this.editor.getItemsIntersectionPoint(point);
        
        // If ctrl is not down, deselect all objects and only select the
        // topmost element clicked.
        // if (!data.ctrlKey) {
        //     this._handles.deselectObjects();
        // }

        // this._handles.selectObjects(...items);
        
        // console.log(items);
    }

    // [End Evt Handlers]

    /**
     * Used to get and set the height of the svg element.
     * @param hx - The height of the svg element.
     * @param transitionMS - The duration of the transition.
     */
    public height(hx?: number, transitionMS: number = 0): number|null {
        
        let result: number|null = null;

        if (hx == null) {
            let attrVal = this.svgCanvas_el.getAttribute("height");

            if (attrVal == null) {
                result = this.svgCanvas_el.getBoundingClientRect().height;
            } else {
                result = Number(attrVal);
            } 
        } else {

            result = hx;
            let $canvasEl = $(this.svgCanvas_el)

            if (transitionMS == 0) {
                $canvasEl.trigger(
                    SVG_CANVAS_NAMES.ON_HEIGHT_EVT_NAME,
                    DefaultTransitionStartEvtData
                );
                this.svgCanvas_el.setAttribute("height", hx.toString());
                $canvasEl.trigger(
                    SVG_CANVAS_NAMES.ON_HEIGHT_EVT_NAME,
                    DefaultTransitionEndEvtData
                );
            } else {

                // Don't need to remove evt listeners as they will be replaced
                // when new evt listeners are added.
                d3.select(this.svgCanvas_el)
                    .transition()
                    .attr("height", transitionMS)
                    .ease(d3.easeCubic)
                    .duration(transitionMS)
                    .on("end", function(e) {
                        $canvasEl.trigger(
                            SVG_CANVAS_NAMES.ON_HEIGHT_EVT_NAME,
                            DefaultTransitionEndEvtData
                        );
                    }).on("start", function(e) {
                        $canvasEl.trigger(
                            SVG_CANVAS_NAMES.ON_HEIGHT_EVT_NAME,
                            DefaultTransitionStartEvtData
                        );
                    }).on("interrupt", function(e) {
                        $canvasEl.trigger(
                            SVG_CANVAS_NAMES.ON_HEIGHT_EVT_NAME,
                            DefaultTransitionInterruptEvtData
                        );
                    });
            }
        }

        return result;
    }

    /**
     * Used to get and set the width of the svg element.
     * @param wx - If a width is passed the svg canvas will be set to it.
     * @param transitionMS - The duration of the transition.
     * @returns - The width as defined in the attribute of the svg canvas
     * element.
     */
    public width(wx?: number, transitionMS: number = 0): number|null {

        let result: number|null = null;

        if (wx == null) {
            let attrVal = this.svgCanvas_el.getAttribute("width");

            if (attrVal == null) {
                result = this.svgCanvas_el.getBoundingClientRect().width;
            }
        } else {
            result = wx;
            let $canvas = $(this.svgCanvas_el);

            if (transitionMS == 0) {
                $canvas.trigger(
                    SVG_CANVAS_NAMES.ON_WIDTH_EVT_NAME, 
                    DefaultTransitionStartEvtData
                );
                this.svgCanvas_el.setAttribute("width", wx.toString());
                $canvas.trigger(
                    SVG_CANVAS_NAMES.ON_WIDTH_EVT_NAME, 
                    DefaultTransitionEndEvtData
                );
            } else {
                d3.select(this.svgCanvas_el)
                    .transition()
                    .attr("height", wx.toString())
                    .ease(d3.easeCubic)
                    .duration(transitionMS)
                    .on("start", function(e) {
                        $canvas.trigger(
                            SVG_CANVAS_NAMES.ON_WIDTH_EVT_NAME,
                            DefaultTransitionStartEvtData
                        );
                    }).on("end", function(e) {
                        $canvas.trigger(
                            SVG_CANVAS_NAMES.ON_WIDTH_EVT_NAME,
                            DefaultTransitionEndEvtData
                        );
                    }).on("end", function(e) {
                        $canvas.trigger(
                            SVG_CANVAS_NAMES.ON_WIDTH_EVT_NAME,
                            DefaultTransitionInterruptEvtData
                        );
                    });
            }
        }

        return result;
    }

    /**
     * Used to get and set the viewBox attribute of the canvas.
     * @param viewbox - If null then returns the values of the current viewBox.
     * @param transitionMS - The number of milliseconds the transition takes
     * place over.
     * @returns IViewBox
     */
    public viewBox(viewbox?: IViewBox, transitionMS: number = 0): IViewBox|null {
        
        let result: IViewBox|null = null;
        
        if (viewbox == null) {

            // Get the canvas attribute viewbox
            let attrVal = this.svgCanvas_el.getAttribute("viewBox");
            
            if (attrVal != null) {
                let parsedAttr = attrVal.split(" ").map(val => Number(val));

                if (parsedAttr.length == 4) {
                    result = { 
                        minX: parsedAttr[0],
                        minY: parsedAttr[1],
                        width: parsedAttr[2],
                        height: parsedAttr[3]
                    };
                }
            }
        } else {
            result = viewbox;

            let { minX, minY, width, height } = viewbox;
            let attrStr = `${minX} ${minY} ${width} ${height}`;

            let $canvas = $(this.svgCanvas_el);

            if (transitionMS == 0) {
                $canvas.trigger(
                    SVG_CANVAS_NAMES.ON_VIEWBOX_EVT_NAME,
                    DefaultTransitionStartEvtData
                );
                this.svgCanvas_el.setAttribute("viewBox", attrStr);
                $canvas.trigger(
                    SVG_CANVAS_NAMES.ON_VIEWBOX_EVT_NAME,
                    DefaultTransitionEndEvtData
                );
            } else {
                d3.select(this.svgCanvas_el)
                    .transition()
                    .attr("viewBox", attrStr)
                    .ease(d3.easeCubic)
                    .duration(transitionMS)
                    .on("start", function(e) {
                        $canvas.trigger(
                            SVG_CANVAS_NAMES.ON_VIEWBOX_EVT_NAME,
                            DefaultTransitionStartEvtData
                        );
                    }).on("end", function(e) {
                        $canvas.trigger(
                            SVG_CANVAS_NAMES.ON_VIEWBOX_EVT_NAME,
                            DefaultTransitionEndEvtData
                        );
                    }).on("interrupt", function(e) {
                        $canvas.trigger(
                            SVG_CANVAS_NAMES.ON_VIEWBOX_EVT_NAME,
                            DefaultTransitionInterruptEvtData
                        );
                    });
            }
        }

        return result;
    }

    // [End Functions]
}