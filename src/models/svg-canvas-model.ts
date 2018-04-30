const uniqid = require("uniqid");

import * as $ from "jquery";
import { AutoWired, Inject } from 'typescript-ioc';
import * as d3 from "d3";

import { IViewBox } from "../services/svg-canvas-service";
import { NS } from "../helpers/namespaces-helper";
import { SvgMaskService } from "../services/svg-mask-service";
import { SvgEditor } from "./svg-editor-model";
import { SvgTransformService } from "../services/svg-transform-service";
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

    private _editor: SvgEditor;

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
        this.transformService = new SvgTransformService();

        // Create svg element
        this.svgCanvas_el = <SVGElement>document.createElementNS(NS.SVG, "svg");

        // Set attributes
        this.svgCanvas_id = uniqid();
        this.svgCanvas_el.id = this.svgCanvas_id;
        this.svgCanvas_el.setAttribute("viewBox", `${viewbox.minX} ${viewbox.minY} ${viewbox.width} ${viewbox.height}`);
        this.svgCanvas_el.setAttribute("width", width.toString());
        this.svgCanvas_el.setAttribute("height", height.toString());

        // Create defs element & symbolsContainer element
        this.defs_el = <SVGDefsElement>document.createElementNS(NS.SVG, "defs");
        this.symbols_el = <SVGGElement>document.createElementNS(NS.SVG, "g");

        this.symbols_id = uniqid();
        this.symbols_el.id = this.symbols_id;
        this.symbols_el.classList.add(SVG_CANVAS_NAMES.SYMBOLS_CLASS);

        // Create underEditor element
        this.underEditor_el = <SVGGElement>document.createElementNS(NS.SVG, "g");
        this.underEditor_id = uniqid();
        this.underEditor_el.id = this.underEditor_id;

        // Create editor element
        this.editor_el = <SVGGElement>document.createElementNS(NS.SVG, "g");
        this.editor_id = uniqid();
        this.editor_el.id = this.editor_id;
        this.editor_el.classList.add(SVG_CANVAS_NAMES.EDITOR_CLASS);

        // Create overEditor element
        this.overEditor_el = <SVGGElement>document.createElementNS(NS.SVG, "g");
        this.overEditor_id = uniqid();
        this.overEditor_el.id = this.overEditor_id;

        // Create handles element
        this.handles_el = <SVGGElement>document.createElementNS(NS.SVG, "g");
        this.handles_id = uniqid();
        this.handles_el.id = this.handles_id;

        // Compose elements together
        this.svgCanvas_el.appendChild(this.defs_el);
        this.svgCanvas_el.appendChild(this.symbols_el);
        this.svgCanvas_el.appendChild(this.underEditor_el);
        this.svgCanvas_el.appendChild(this.editor_el);
        this.svgCanvas_el.appendChild(this.overEditor_el);
        this.svgCanvas_el.appendChild(this.handles_el);

        // And append the svg to the parent container
        parentElement.appendChild(this.svgCanvas_el);

        // Attach event listener to canvas
        // this.svgCanvas_el.addEventListener("click", this.onSvgCanvasMouseDown);
        $(this.svgCanvas_el).on("click", e => this.onSvgCanvasMouseDownV2(e));

        this._editor = new SvgEditor(this.underEditor_el, 
            this.editor_el, 
            this.overEditor_el);
    }

    // [End Ctor]

    // [Properties]

    get defs() {
        return {};
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
        return {};
    }

    // [End Properties]

    // [Functions]

    // [Evt Handlers]

    public onSvgCanvasMouseDownV2(event: JQuery.Event<HTMLElement, null>) {
        let { pageX:x, pageY:y } = event;
        
        let point = this.transformService.convertScreenCoordsToSvgCoords(
            { x, y }, 
            <SVGSVGElement>this.svgCanvas_el);

        let items = this.editor.getItemsIntersectionPoint(point);
        console.log(items);
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