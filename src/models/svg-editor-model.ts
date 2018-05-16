import { ISvgAction } from './isvg-action';
const uniqid = require("uniqid");

import * as d3 from "d3";
import { ActivatableServiceSingleton } from "../services/activatable-service";
import { isSvgGraphicsElement, getFurthestSvgOwner } from "./../helpers/svg-helpers";
import { nodeListToArray } from "../helpers/node-helper";
import { ICoords2D, SvgTransformService, SvgTransformServiceSingleton, ITransformable } from "./../services/svg-transform-service";
import { isSvgElement } from "../helpers/svg-helpers";
import { SvgItem } from "./svg-item-model";
import { ISvgHandles } from "./isvg-handles-model";
import { Names } from "./names";
import { NS } from "../helpers/namespaces-helper";
import { InternalError } from "./errors";

export interface ITotal {
    colors: d3.ColorSpaceObject[];
    items: SVGGraphicsElement[];
}

/**
 * Used for managing the underEditor, editor, and overEditor group elements
 * on a SvgCanvas object.
 */
export class SvgEditor {

    //#region Fields

    private editorMask: d3.Selection<SVGUseElement, {}, null, undefined>;
    private underEditor: d3.Selection<SVGGElement, {}, null, undefined>;
    private editor: d3.Selection<SVGGElement, {}, null, undefined>;
    private overEditor: d3.Selection<SVGGElement, {}, null, undefined>;
    private editor_items: SvgItem[];

    private _maskUrl?: string;

    private readonly transformService: SvgTransformService;
    // TODO: Start mapping elements by id to their ITransformable
    private readonly transformMap: WeakMap<Element, ITransformable>;

    public handles?: ISvgHandles;

    //#endregion

    //#region Ctor

    public constructor(parent: SVGSVGElement)
    {
        this.transformService = SvgTransformServiceSingleton;
        this.editor_items = [];
        this.transformMap = new WeakMap();

        let parentSelection = d3.select(parent);

        this.underEditor = parentSelection
            .append<SVGGElement>("g")
            .attr("id", uniqid())
            .attr("data-name", Names.SvgEditor.UnderEditor.DATA_NAME);

        this.editor = parentSelection
            .append<SVGGElement>("g")
            .attr("id", uniqid())
            .attr("data-name", Names.SvgEditor.Editor.DATA_NAME);

        this.editorMask = parentSelection
            .append<SVGUseElement>("use")
            .attr("id", uniqid())
            .attr("data-name", Names.SvgEditor.Mask.DATA_NAME);

        this.overEditor = parentSelection
            .append<SVGGElement>("g")
            .attr("id", uniqid())
            .attr("data-name", Names.SvgEditor.OverEditor.DATA_NAME);
    }

    //#endregion

    //#region Properties

    get mask() {
        return this._maskUrl;
    }

    /**
     * @param id - The id of an element to use as the mask or null to stop
     * using the mask.
     */
    set mask(id: string|undefined) {
        if (id == undefined) {
            this.editorMask.attr("href", null);
            this.editor.attr("mask", null);
        } else {
            this.editorMask.attr("href", `#${id}`);
            this.editor.attr("mask", `url(#${id})`);
        }
    }

    get items() {
        let editorNode = this.getEditorNode();

        let items: SVGGraphicsElement[] = [];

        for (let i = 0; i < editorNode.childNodes.length; i++) {
            let item = editorNode.childNodes[i];

            if (isSvgGraphicsElement(item)) {
                items.push(item);
            }
        }

        return items;
    }

    get totals(): ITotal {
        let colors: d3.ColorSpaceObject[] = []
        let items: SVGGraphicsElement[] = [];

        let editorNode = this.getEditorNode();
        for (let i = 0; i < editorNode.childNodes.length; i++) {
            let item = <SVGGraphicsElement>editorNode.childNodes[i];
            items.push(item);
        }
        
        return {
            colors: colors,
            items: items
        };
    }

    //#endregion

    //#region Functions

    private getEditorNode(): SVGGElement {
        let editorNode = this.editor.node();

        if (editorNode == null) {
            throw new Error("The impossible happened...");
        }
        
        return editorNode;
    }

    private cleanSvgString(svgString: string): string {

        // IE9 also adds extra namespaced attributes for some reason, this
        // removes the bad attributes.
        let reg1 = /([^\s]+:\w+="")/g; // Removes emtpy namespaced attr (ns1:attr="")
        let reg2 = /([^\s]+:[^\s]+:[^\s]+="[^"']*")/g; // Removes multiple namespace attr (ns1:xsi:attrName="attrval")

        return svgString
            .replace(reg1, "")
            .replace(reg2, "");
    }

    /**
     * Returns all child nodes of the editor that intersect a point.
     * @param point - This is relative to the svg element.
     */
    public getItemsIntersectionPoint(point: ICoords2D): d3.Selection<SVGGraphicsElement, {}, null, undefined> {
        let intersectingItems: SVGGraphicsElement[] = [];
        let items = this.items;

        for (let item of items) {
            let bbox = this.transformService.getBBox(item);

            // Check to see if point lays outside bbox
            if (bbox.x >= point.x) {
                continue;
            } else if ((bbox.x + bbox.width) <= point.x) {
                continue;
            } else if (bbox.y >= point.y) {
                continue;
            } else if ((bbox.y + bbox.height) <= point.y) {
                continue;
            }

            // Point must lay inside bbox, add it to array
            intersectingItems.push(item);
        }

        return d3.selectAll(intersectingItems);
    }

    /**
     * Exports the svg as a string.
     */
    public export(): string
    {
        let result = "";
        let ownerSvg = getFurthestSvgOwner(this.getEditorNode());

        // Since IE9 doesn't support outerHTML for svg elements, have to use
        // the innerHTML of the svg parents element.
        if (ownerSvg != null) {
            result = this.cleanSvgString($(ownerSvg).html());
        }

        return result;
    }

    /**
     * Replaces or appends a stringified svg to the editor.
     * @param svgString 
     */
    public import(svgString: string, 
        replaceExistingContent: boolean = true): Error|null 
    {
        let error: Error|null = null;
        let $editor = $(this.getEditorNode());
        let cleanedStr = this.cleanSvgString(svgString);

        if (replaceExistingContent) {
            $editor.empty();
        }

        let parser = new DOMParser();
        try {
            let newSvgFrag = parser.parseFromString(cleanedStr, "image/svg+xml");
            this.add(newSvgFrag);
        } catch (e) {
            error = e;
        }

        return error;
    }

    /**
     * Adds a DocumentFragment to the editor and centers each item. Any
     * non-SVGGraphics will be ignored.
     * @param items 
     */
    public add(items: DocumentFragment): void {

        // This is also for IE9, would prefer to iterate over items.children but oh well
        for (let i = 0; i < items.childNodes.length; i++) {
            let el = <Element>items.childNodes[i];

            // Setup default transformations
            if (isSvgGraphicsElement(el)) {

                // Wrapper to all transforms originate on the upper left hand
                // side of the parent element. Without this circles in
                // particular will have their transform origin behave
                // unexpectedly.
                //
                // Another benifit is that now calling
                // this.editor.selectAll(`.${Names.Handles.} > g`) will select all items.
                let itemWrapper = document.createElementNS(NS.SVG, "g");
                itemWrapper.classList.add(Names.SvgEditor.Items.CLASS_NAME);
                itemWrapper.appendChild(el);

                if (!isSvgGraphicsElement(itemWrapper)) {
                    throw new Error("Internal error occurred.");
                }

                this.transformService.standardizeTransforms(itemWrapper);

                if (itemWrapper.id == "") {
                    itemWrapper.id = uniqid();
                }

                let svgItem = new SvgItem(<any>itemWrapper);

                if (this.handles != undefined) {
                    this.handles.onBeforeItemAdded(svgItem)
                }

                this.editor_items.push(svgItem);
                let editorNode = this.getEditorNode();
                let svgCanvas = getFurthestSvgOwner(editorNode);

                // Add item to editor & editor_items
                editorNode.appendChild(itemWrapper);

                // Scale the item so it doesn't take up more than 50% of the
                // editor-mask or canvas if the editor-mask isn't set.
                let canvas = this.mask ? this.editorMask.node() : svgCanvas;

                // Null check
                if (canvas == undefined) {
                    throw InternalError;
                }

                let canvasBBox = SvgTransformServiceSingleton.getBBox(canvas);
                let itemBBox = SvgTransformServiceSingleton.getBBox(itemWrapper);
                let scaleRatio = 1;

                if (itemBBox.height > (canvasBBox.height / 2)) {
                    scaleRatio = (canvasBBox.height / 2) / itemBBox.height;
                }

                if (itemBBox.width > (canvasBBox.width / 2) * scaleRatio) {
                    scaleRatio = (canvasBBox.width / 2) / itemBBox.width;
                }

                // Apply scale
                svgItem.transforms.setScale({x: scaleRatio, y: scaleRatio}, 0);
                
                // Need to call this so we can get an updated bbox.
                svgItem.update();

                // Attempt to center element
                let centerOfSvg = this.transformService.getCenter(svgCanvas);
                let centerOfItem = svgItem.center;

                svgItem.transforms.setTranslate({
                    x: Math.abs(centerOfSvg.x - centerOfItem.y),
                    y: Math.abs(centerOfSvg.y - centerOfItem.y) 
                });
                svgItem.update();

                if (this.handles != undefined) {
                    this.handles.onAfterItemAdded(svgItem)
                }
            }
        }
    }

    public remove(id: string): void {
        let svgItem = this.editor_items.find(el => el.element.id == id);

        // Check that the element does exist
        if (svgItem == null) {
            return;
        }

        if (this.handles != undefined) {
            this.handles.onBeforeItemRemoved(svgItem)
        }

        this.editor.select(`#${id}`).remove();

        if (this.handles != undefined) {
            this.handles.onAfterItemRemoved(svgItem)
        }
    }

    /**
     * Have handles call this to save the "state" of the editor_items?
     * @param action 
     */
    applyAction(action: ISvgAction): void {

    }

    /**
     * Call this to apply updates to the items?
     * 
     * Possibly seperate this into updateTransforms, updateColors, and 
     * update
     */
    update() {
        this.editor
            .selectAll(`[data-name='${Names.SvgEditor.Editor.DATA_NAME}'] > .item`)
            .data(this.editor_items)
            .attr("transform", function(d) { return d.transforms.toTransformString() })
            .each(function(d) {
                // Update more specialized attributes like strokes/colors here
            });
    }

    public getItems(element: SVGElement): ITransformable {
        throw new Error("Not implemented error.");
    }

    //#endregion
}