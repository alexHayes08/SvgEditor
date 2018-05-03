const uniqid = require("uniqid");

import * as d3 from "d3";
import { ActivatableServiceSingleton } from "../services/activatable-service";
import { isSvgGraphicsElement } from "./../helpers/svg-helpers";
import { nodeListToArray } from "../helpers/node-helper";
import { ICoords2D, SvgTransformService, SvgTransformServiceSingleton } from "./../services/svg-transform-service";
import { isSvgElement } from "../helpers/svg-helpers";
import { SvgItem } from "./svg-item-model";

export interface ITotal {
    colors: d3.ColorSpaceObject[];
    items: SVGElement[];
}

/**
 * Used for managing the underEditor, editor, and overEditor group elements
 * on a SvgCanvas object.
 */
export class SvgEditor {

    // [Fields]

    private underEditor_el: SVGGElement;
    private editor_el: SVGGElement;
    private overEditor_el: SVGGElement;
    private editor_items: SvgItem[];

    private readonly transformService: SvgTransformService;

    // [End Fields]

    // [Ctor]

    public constructor(underEditor: SVGGElement,
        editor: SVGGElement,
        overEditor: SVGGElement)
    {
        this.transformService = SvgTransformServiceSingleton;
        this.editor_items = [];

        this.underEditor_el = underEditor;
        this.editor_el = editor;
        this.overEditor_el = editor;
    }

    // [End Ctor]

    // [Properties]

    get items() {
        return this.editor_items;
    }

    get totals(): ITotal {
        let colors: d3.ColorSpaceObject[] = []
        let items: SVGElement[] = [];

        for (let i = 0; i < this.editor_el.childNodes.length; i++) {
            let item = <SVGElement>this.editor_el.childNodes[i];
            items.push(item);
        }
        
        return {
            colors: colors,
            items: items
        };
    }

    // [End Properties]

    // [Functions]

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
    public getItemsIntersectionPoint(point: ICoords2D): SvgItem[] {
        let intersectingItems: SvgItem[] = [];
        let items = this.items;

        for (let item of items) {
            let bbox = this.transformService.getBBox(item.element);

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

        return intersectingItems;
    }

    /**
     * Exports the svg as a string.
     */
    public export(): string
    {
        let result = "";
        let ownerSvg = this.editor_el.ownerSVGElement;

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
        let $editor = $(this.editor_el);
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
            if (el.id == "") {
                el.id = uniqid();
            }

            // Setup default transformations
            if (isSvgGraphicsElement(el)) {
                let svgItem = new SvgItem(el);
                let svgCanvas = <SVGSVGElement>this.editor_el.ownerSVGElement;

                // Add item to editor & editor_items
                this.editor_el.appendChild(el);
                this.editor_items.push(svgItem);

                // Capture els
                let tmp = this;
                d3.select(svgItem.element)
                    .on("click", function(data: {}, i: number) {
                        console.log('test');
                    });

                // Attempt to center element
                let centerOfSvg = this.transformService.getCenter(svgCanvas);
                let centerOfItem = svgItem.center;

                this.transformService.setTranslation(el, {
                    x: Math.abs(centerOfSvg.x - centerOfItem.y),
                    y: Math.abs(centerOfSvg.y - centerOfItem.y)
                });
            }
        }
    }

    public remove(id: string): boolean {
        let result = false;

        for (let i = 0; i < this.editor_el.childNodes.length; i++) {
            let el = <Element>this.editor_el.childNodes[i];
            if (el.id == id) {
                result = true;
                this.editor_el.removeChild(el);
            }
        }

        return result;
    }

    // [End Functions]
}