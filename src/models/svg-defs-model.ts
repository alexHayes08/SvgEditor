const uniqid = require("uniqid");

import * as $ from "jquery";

import { isSvgElement } from "../helpers/svg-helpers";

export const EVT_NAMES = {
    DEFS_CHANGED: "defs-changed"
};

export class SvgDefs {
    // [Fields]

    private readonly defsEl: SVGDefsElement;

    // [End Fields]

    // [Ctor]

    public constructor(element: SVGDefsElement) {
        this.defsEl = element;
    }

    // [End Ctor]

    // [Properties]

    // [End Properties]

    // [Functions]

    /**
     * Adds the element to the defs element. If the element doesn't have an id
     * one will be provided.
     * @param element 
     * @returns {string} Returns the id of the appended element
     */
    public addDefinition(element: SVGElement): string {
        
        // Check that the id isn't null
        if (element.id == "") {
            element.id = uniqid();
        }

        // Check that no other elements are registered with that id in the defs
        // element
        let alreadyContainsDef = $(this.defsEl).find(`#${element.id}`).length > 0;
        if (alreadyContainsDef) {
            throw new Error(`Attempted to add an element to <defs> where another element also had the same id of '${element.id}'.`);
        }

        // Append element to the defs
        this.defsEl.appendChild(element);
        $(this.defsEl).trigger(EVT_NAMES.DEFS_CHANGED);

        return element.id;
    }

    public getDefinition(id: string): SVGElement|null {
        let result: SVGElement|null = null;
        
        let el = $(this.defsEl).find(`#${id}`);
        if (el.length > 0) {
            let item = el[0];

            if (isSvgElement(item)) {
                result = <SVGElement>item;
            }
        }

        return result;
    }

    public removeDefinition(id: string): void {
        $(this.defsEl).find(`#${id}`).remove();
        $(this.defsEl).trigger(EVT_NAMES.DEFS_CHANGED);
    }

    // [End Functions]
}