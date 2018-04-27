const uniqid = require("uniqid");

import { ColorSpaceObject } from "d3";

export interface ITotal {
    colors: ColorSpaceObject[];
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

    // [End Fields]

    // [Ctor]

    public constructor(underEditor: SVGGElement,
        editor: SVGGElement,
        overEditor: SVGGElement)
    {
        this.underEditor_el = underEditor;
        this.editor_el = editor;
        this.overEditor_el = editor;
    }

    // [End Ctor]

    // [Properties]

    get items() {
        let children = this.editor_el.childNodes;

        return children;
    }

    get totals(): ITotal {
        let colors: ColorSpaceObject[] = []
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
     * Adds a DocumentFragment to the editor. WARNING: The DocumentFragment
     * will be empty afterwards.
     * @param items 
     */
    public add(items: DocumentFragment): void {

        // This is also for IE9, would prefer to iterate over items.children but oh well
        for (let i = 0; i < items.childNodes.length; i++) {
            let el = <Element>items.childNodes[i];
            if (el.id == "") {
                el.id = uniqid();
            }
        }

        this.editor_el.appendChild(items);
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