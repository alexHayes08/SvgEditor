import { NS } from "../models/namespaces";

class SvgMaskService {
    readonly defsElement: SVGDefsElement;
    readonly editableAreaDefElement: SVGClipPathElement;
    readonly defaultClipPathElement: SVGUseElement;
    readonly maskElement: SVGUseElement;
    readonly editorElement: SVGGElement;
    readonly handles: SVGGElement;

    constructor(private parentSvgElement: SVGElement) {
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

    get masks(): SVGElement[] {
        let maskEls: SVGElement[] = [];
        let els = document.querySelectorAll("defs .editableAreaRect");
        for (let i = 0; i < els.length; i++) {
            maskEls.push(els.item(i) as SVGElement);
        }

        return maskEls;
    }
}