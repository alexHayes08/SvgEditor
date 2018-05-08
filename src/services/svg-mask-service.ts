import { AutoWired, Singleton } from "typescript-ioc";

import * as $ from "jquery";

import { NS } from "../helpers/namespaces-helper";

/**
 * Each 'Editor' can optionally have a mask applied to prevent the user from
 * from moving svg elements into the masked areas. This service is responsible
 * for adding/removing/creating/switching which mask is active for a 'Editor'.
 */
@Singleton
export class SvgMaskService {

    // [Fields]

    private _masksClass: string;
    private _activeMaskClass: string;

    private readonly defsElement: SVGDefsElement;
    private readonly editableAreaDefElement: SVGClipPathElement;
    private readonly defaultClipPathElement: SVGUseElement;
    private readonly maskElement: SVGUseElement;
    private readonly editorElement: SVGGElement;
    private readonly handles: SVGGElement;

    // [End Fields]

    // [Ctor]

    constructor(private parentSvgElement: SVGGraphicsElement) {

        // Assign a css class that will be assigned to the mask when it's active
        this._activeMaskClass = "active";

        // Assign a css class that will be assigned to all masks
        this._masksClass = "editableArea";

        // Create defs
        this.defsElement = <SVGDefsElement>document.createElementNS(NS.SVG, "defs");

        // Create the editableAreaDef
        this.editableAreaDefElement = <SVGClipPathElement>document.createElementNS(NS.SVG, "clipPath");
        this.editableAreaDefElement.setAttribute("id", "editableArea"); // Move id to const

        // Create default clipPath
        this.defaultClipPathElement = <SVGUseElement>document.createElementNS(NS.SVG, "use");
        this.defaultClipPathElement.setAttribute("href", "#editableAreaRect");

        // Create mask
        this.maskElement = <SVGUseElement>document.createElementNS(NS.SVG, "use");

        // Create the editor
        this.editorElement = <SVGGElement>document.createElementNS(NS.SVG, "g");

        // Create the handles
        this.handles = <SVGGElement>document.createElementNS(NS.SVG, "g");
    }

    // [End Ctor]

    // [Properties]

    /**
     * Retrieves the class name used to identify the masks in the element.
     */
    get masksClassSelector(): string {
        return this._masksClass;
    }

    /**
     * Replaces the old class name with the new one for all masks.
     */
    set masksClassSelector(value: string) {
        if (value.length == 0) {
            throw new Error("Argument cannot be empty.");
        }

        $(this.parentSvgElement)
            .find(`defs .${this.masksClassSelector}`)
            .each((index, element) => {
                element.classList.remove(this.masksClassSelector);
                element.classList.add(value);
            });

        this._masksClass = value;
    }

    get activeMaskClass() {
        return this._activeMaskClass;
    }

    set activeMaskClass(value: string) {
        let activeMask = this.activeMask;
        if (activeMask != null) {
            activeMask.classList.remove(this.activeMaskClass);
            activeMask.classList.add(value);
        }

        this._activeMaskClass = value;
    }

    get activeMask(): SVGGraphicsElement|null {
        return this.defsElement.querySelector(this.activeMaskClass);
    }

    /**
     * Retrieves all mask elements that use the defsClassSelector.
     */
    get masks(): SVGGraphicsElement[] {
        let maskEls: SVGGraphicsElement[] = [];
        let els = this.parentSvgElement.querySelectorAll(`defs .${this.masksClassSelector}`);
        for (let i = 0; i < els.length; i++) {
            maskEls.push(els.item(i) as SVGGraphicsElement);
        }

        return maskEls;
    }

    // [End Properties]

    // [Functions]

    public createMask(mask: SVGGraphicsElement): void {

    }

    public removeMask(id: string): void {

    }

    public enableMask(id: string) {
        this.disableMask();

        let mask = this.defsElement.querySelector(`#${id}`);
        if (mask == null) {
            throw new Error(`Failed to find the mask with id '${id}'.`);
        }

        mask.classList.add(this.activeMaskClass);
    }

    public disableMask(): void {
        let activeMask = this.activeMask;
        if (activeMask != null) {
            activeMask.classList.remove(this.activeMaskClass);
        }
    }

    public getCenterOfMask(): void {

    }

    public checkIfAreaIsOutOfBounds(): boolean {
        return true;
    }

    // [End Functions]
}