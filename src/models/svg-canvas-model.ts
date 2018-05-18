const uniqid = require("uniqid");

import * as $ from "jquery";
import { AutoWired, Inject } from 'typescript-ioc';
import * as d3 from "d3";

import { DefaultCircleArc } from "./islice";
import { ISvgHandles } from "./isvg-handles-model";
import { IViewBox } from "../services/svg-canvas-service";
import { Names } from "./names";
import { NS } from "../helpers/namespaces-helper";
import { SvgDefs, ISvgDefs, SvgDefsV2 } from "./svg-defs-model";
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
import { ActivatableServiceSingleton } from "../services/activatable-service";
import { SvgActionService } from "../services/action-service";

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
    
    //#region Fields

    private svgCanvas_el: SVGSVGElement;

    private _defs: ISvgDefs;
    private _editor: SvgEditor;
    private _handles?: ISvgHandles;

    private svgCanvasSelection: d3.Selection<SVGSVGElement, {}, null, undefined>;

    private transformService: SvgTransformService;
    
    // @Inject
    // private maskService: SvgMaskService;

    //#endregion

    //#region Ctor

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
        this.svgCanvasSelection = d3.select(parentElement)
            .append<SVGSVGElement>("svg")
            .attr("viewBox", `${viewbox.minX} ${viewbox.minY} ${viewbox.width} ${viewbox.height}`)
            .attr("width", width.toString())
            .attr("height", height.toString())
            .attr("data-name", Names.SvgCanvas.DATA_NAME)
            .attr("class", Names.SvgCanvas.CLASS)
            .attr("overflow", "auto")
            .attr("id", uniqid());

        let svgCanvas_el = this.svgCanvasSelection.node();

        if (svgCanvas_el == null) {
            throw new Error("Failed to create the canvas? Not sure how that happened...");
        }

        this.svgCanvas_el = svgCanvas_el;
        ActivatableServiceSingleton.register(svgCanvas_el, true);

        // Create defs element & symbolsContainer element
        this._defs = new SvgDefsV2(svgCanvas_el);

        // Create editor
        this._editor = new SvgEditor(svgCanvas_el, this.defs, new SvgActionService());
    }

    //#endregion

    //#region Properties

    get canvasEl() {
        return this.svgCanvas_el;
    }

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

    set handles(value: ISvgHandles|undefined) {
        
        if (this.handles != undefined) {
            this.handles.onRemovedFromEditor();
            this.editor.handles = undefined;
        }

        this._handles = value;

        if (this.handles != undefined) {
            this.editor.handles = this.handles;
            this.handles.onAddedToEditor();
        }
    }

    //#endregion

    //#region Functions

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

    //#endregion
}