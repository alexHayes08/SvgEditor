const uniqid = require("uniqid");

import * as d3 from "d3";
import { ActivatableServiceSingleton } from "../services/activatable-service";
import { isSvgGraphicsElement, getFurthestSvgOwner } from "./../helpers/svg-helpers";
import { nodeListToArray } from "../helpers/node-helper";
import { ICoords2D, SvgTransformService, SvgTransformServiceSingleton, ITransformable } from "./../services/svg-transform-service";
import { isSvgElement } from "../helpers/svg-helpers";
import { SvgItem } from "./svg-item-model";
import { ISvgAction } from './isvg-action';
import { ISvgHandles } from "./isvg-handles-model";
import { Names } from "./names";
import { NS } from "../helpers/namespaces-helper";
import { InternalError, NotImplementedError } from "./errors";
import { ISvgDefs } from './svg-defs-model';
import { SvgActionService } from '../services/action-service';
import { AddItemAction } from "./actions/add-item-action";
import { RemoveItemAction } from "./actions/remove-item-action";

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

    private clipPathEl: d3.Selection<SVGClipPathElement, {}, null, undefined>;
    private editorMask: d3.Selection<SVGUseElement, {}, null, undefined>;
    private underEditor: d3.Selection<SVGGElement, {}, null, undefined>;
    private editor: d3.Selection<SVGGElement, {}, null, undefined>;
    private overEditor: d3.Selection<SVGGElement, {}, null, undefined>;

    private _maskUrl?: string;

    private readonly transformService: SvgTransformService;
    private readonly actionService: SvgActionService;
    private readonly dataMap: WeakMap<Element, SvgItem>;
    private readonly defs: ISvgDefs;

    public handles?: ISvgHandles;

    //#endregion

    //#region Ctor

    public constructor(parent: SVGSVGElement, defs: ISvgDefs, actionService: SvgActionService)
    {
        this.dataMap = new WeakMap();
        this.defs = defs;
        this.transformService = SvgTransformServiceSingleton;
        this.actionService = actionService;

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

        // Create section for the handles
        this.defs.createSection(Names.SvgDefs.SubElements.EditorOnlyDefsContainer.DATA_NAME);

        // Create a section named masks
        this.defs.createSection("masks");

        // Create clip-path
        let editorClipPath = document.createElementNS(NS.SVG, "clipPath");
        let use = document.createElementNS(NS.SVG, "use");
        editorClipPath.appendChild(use);

        let editorClipPath_ref = <SVGClipPathElement>this.defs.pushToSection(editorClipPath, 
            Names.SvgDefs.SubElements.EditorOnlyDefsContainer.DATA_NAME);

        this.clipPathEl = d3.select<SVGClipPathElement, {}>(editorClipPath_ref);
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
            this.clipPathEl
                .select("use")
                .attr("href", null);
            this.editorMask.attr("href", null);
            this.editor.attr("clip-path", null);
        } else {
            let maskElSubEl = d3.select(`#${id}`)
                .selectAll<Element, {}>("*")
                .node();

            // Don't set the mask if the mask contained no sub elements.
            if (maskElSubEl == undefined) {
                this.mask = undefined;
                return;
            }

            let clipPathData: string[] = [];

            // Check if the node is a group
            if (maskElSubEl.childElementCount > 1) {
                d3.select(maskElSubEl)
                    .selectAll<Element, {}>("*")
                    .nodes()
                    .map(function(node) {
                        clipPathData.push(node.id);
                    });
            } else {
                clipPathData.push(maskElSubEl.id);
            }

            let clipPathSelection = this.clipPathEl
                .selectAll("use")
                .data(clipPathData)
                .attr("href", d => `#${d}`);
            clipPathSelection.enter()
                .append("use")
                .attr("href", d => `#${d}`)
            clipPathSelection.exit()
                .remove();

            this.editorMask.attr("href", `#${maskElSubEl.id}`);
            this.editor.attr("clip-path", `url(#${this.clipPathEl.attr("id")})`);
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
     * non-SVGGraphics element will be ignored.
     * @param items 
     */
    public add(items: DocumentFragment): void {
        let addAction = new AddItemAction(this.getEditorNode(),
            items,
            this.dataMap,
            this.handles ? this.handles.onBeforeItemsAdded.bind(this.handles) : undefined,
            this.handles ? this.handles.onAfterItemsAdded.bind(this.handles) : undefined,
            this.handles ? this.handles.onBeforeItemsRemoved.bind(this.handles) : undefined,
            this.handles ? this.handles.onAfterItemsRemoved.bind(this.handles) : undefined);
        
        this.actionService.applyAction(addAction);
    }

    public remove(...items: SvgItem[]): void {        
        if (this.handles != undefined) {
            this.handles.onBeforeItemsRemoved(items);
        }

        let removeAction = new RemoveItemAction(this.getEditorNode(),
            items,
            this.dataMap,
            this.handles ? this.handles.onBeforeItemsAdded.bind(this.handles) : undefined,
            this.handles ? this.handles.onAfterItemsAdded.bind(this.handles) : undefined,
            this.handles ? this.handles.onBeforeItemsRemoved.bind(this.handles) : undefined,
            this.handles ? this.handles.onAfterItemsRemoved.bind(this.handles) : undefined);
        this.applyAction(removeAction);

        if (this.handles != undefined) {
            this.handles.onAfterItemsRemoved(items);
        }
    }

    /**
     * Have handles call this to save the "state" of the editor_items?
     * @param action 
     */
    public applyAction(action: ISvgAction): void {
        this.actionService.applyAction(action);
    }

    public undo(): boolean {
        let result = this.actionService.undoAction();
        if (result && this.handles) {
            this.handles.selectObjects();
        }
        return result;
    }

    public redo(): boolean {
        let result = this.actionService.redoAction();
        if (result && this.handles) {
            this.handles.selectObjects();
        }
        return result;
    }

    public getData(element: SVGElement): SvgItem|undefined {
        return this.dataMap.get(element);
    }

    //#endregion
}