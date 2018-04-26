const uniqid = require("uniqid");

import * as $ from "jquery";
import { AutoWired, Inject } from 'typescript-ioc';

import { IViewBox } from "../services/svg-canvas-service";
import { NS } from "../helpers/namespaces-helper";
import { SvgMaskService } from "../services/svg-mask-service";

const NAMES = {
    symbolsContainer_Class: "symbols-container"
};

/**
 * This is a replacement for the SvgCanvasService.
 */
export class SvgCanvas {
    
    // [Fields]

    // private readonly defs: any;
    // private readonly symbols: any;
    // private readonly editorMask: any;
    // private readonly underEditor: any;
    // private readonly editor: any;
    // private readonly overEditor: any;
    // private readonly handles: any;


    private readonly svgCanvasElement: SVGElement;

    // private readonly editorElement: SVGGraphicsElement;

    private _includedItems: SVGGraphicsElement[];

    private _exludedItems: SVGGraphicsElement[];

    // @Inject
    // private maskService: SvgMaskService;

    // [End Fields]

    // [Ctor]

    public constructor(width: number,
        height: number,
        viewbox: IViewBox,
        private parentElement: HTMLElement,
        private maskService: SvgMaskService)
    {
        
        // Create svg element
        let svgEl = <SVGElement>document.createElementNS(NS.SVG, "svg");

        // Set attributes
        let svgEl_id = uniqid();
        svgEl.id = svgEl_id;
        svgEl.setAttribute("viewBox", `${viewbox.minX}px ${viewbox.minY}px ${viewbox.width}px ${viewbox.height}px`);
        svgEl.setAttribute("width", width.toString());
        svgEl.setAttribute("height", height.toString());

        // Create defs element & symbolsContainer element
        let defsEl = document.createElementNS(NS.SVG, "defs");
        let symbolsContainerEl = document.createElementNS(NS.SVG, "g");

        let symbolsContainerEl_id = uniqid();
        symbolsContainerEl.id = symbolsContainerEl_id;
        symbolsContainerEl.classList.add(NAMES.symbolsContainer_Class);

        // Create underEditor element
        let underEditor = document.createElementNS

        // Create editor element
        let editorEl = document.createElementNS(NS.SVG, "g");

        // Set attributes
        let editorEl_id = uniqid();
        editorEl.id = editorEl_id;
        editorEl.classList.add("editor");

        this.svgCanvasElement = svgEl;
        this._includedItems = [];
        this._exludedItems = [];
    }

    // [End Ctor]

    // [Properties]

    /**
     * Returns a copy of the svg items
     */
    public get items() {
        return [ ...this._includedItems ];
    }

    public get defs() {
        return $(this
            .svgCanvasElement
            .getElementsByTagNameNS(NS.SVG, "defs"));
    }

    // [End Properties]

    // [Functions]

    public addItem(item: SVGGraphicsElement): void {
        this._includedItems.push(item);
    }

    public removeItem(item: SVGGraphicsElement): void {
        this._includedItems = this._includedItems.filter(_item => _item !== item);
    }

    // [End Functions]
}