// import {AutoWired, Inject} from "typescript-ioc";

import IOption, { BooleanOption, IFromNode, NumberOption, StringOption } from "./ioption";
import NodeHelper from '../helpers/node-helper';
import SvgActionService from "../services/svg-action-service";
import SvgTypeService from "../services/svg-type-service";
import SvgUndoManagerService from "../services/svg-undo-manager-service";

export const NS = {
    HTML: 'http://www.w3.org/1999/xhtml',
    MATH: 'http://www.w3.org/1998/Math/MathML',
    SE: 'http://svg-edit.googlecode.com',
    SVG: 'http://www.w3.org/2000/svg',
    XLINK: 'http://www.w3.org/1999/xlink',
    XML: 'http://www.w3.org/XML/1998/namespace',
    XMLNS: 'http://www.w3.org/2000/xmlns/' // see http://www.w3.org/TR/REC-xml-names/#xmlReserved
};

class EditorCssOptions {
    
    /**
     * A css valid height string. Defines the height of the editor.
     */
    height: StringOption;

    /**
     * A css valid width string. Defines the width of the editor.
     */
    width: StringOption;

    constructor() {
        this.height = new StringOption('height');
        this.width = new StringOption('width');
    }
}

class SVGElementCSSOptions {
    /**
     * A css valid height string. Defines the height of the SVGElement.
     */
    height: StringOption;

    /**
     * A css valid width string. Defines the width of the SVGElement.
     */
    width: StringOption;

    /**
     * Identical to the css property left. Will be applied to the SVGElement.
     */
    xOffset: StringOption;

    /**
     * Identical to the css property top. Will be applied to the SVGElement.
     */
    yOffset: StringOption;

    constructor() {
        this.height = new StringOption('height');
        this.width = new StringOption('width');
        this.xOffset = new StringOption('x-offset');
        this.yOffset = new StringOption('y-offset');
    }
}

/**
 * The settings used to initialize ApertureSvgEditor.
 */
export class ApertureSvgEditorOptions implements IFromNode {

    /**
     * If present will use the svg found by this selector. If no SVGElement
     * is located an error will be thrown.
     */
    public svgElementSelector: StringOption;

    /**
     * Css properties for the editor element.
     */
    public editorCssOptions: IOption<EditorCssOptions>;

    /**
     * Css properties for the SVGElement.
     */
    public svgElementCssOptions: IOption<SVGElementCSSOptions>;

    /**
     * Whether to allow operators to apply to multiple svg child elements.
     */
    public allowMultiSelect: BooleanOption;

    public constructor() {
        this.allowMultiSelect = new BooleanOption('allow-multi-select');
        this.svgElementSelector = new StringOption('svg-element-selector');
        
        // Init editorCssOptions
        this.editorCssOptions = {
            name: 'editor-options',
            parseNode: function(node: Attr|Element): void {
                
                // Ignore if not element
                if (NodeHelper.isElement(node)) {
                    let subNodes = NodeHelper.getChildNodesArray(node);
                    let editorOptions = new EditorCssOptions();
    
                    for (let subNode of subNodes) {
                        let subNodeName = NodeHelper.getNameOfNode(subNode);
                        switch(subNodeName) {
                            case editorOptions.height.name:
                                editorOptions.height.parseNode(subNode);
                                break;
                            case editorOptions.width.name:
                                editorOptions.width.parseNode(subNode);
                                break;
                        }
                    }
                    this.value = editorOptions;
                }
            },
            value: undefined
        };

        // Init svgElementOptions
        this.svgElementCssOptions = {
            name: 'svg-element-options',
            parseNode: function(node: Attr|Element): void {
                
                // Ignore if not an element
                if (NodeHelper.isElement(node)) {
                    let element = <Element>node;
                    let subNodes = NodeHelper.getChildNodesArray(element);
                    let svgElementCssOptions = new SVGElementCSSOptions();

                    for (let subNode of subNodes) {
                        let subNodeName = NodeHelper.getNameOfNode(subNode);
                        switch(subNodeName) {
                            case svgElementCssOptions.height.name:
                                svgElementCssOptions.height.parseNode(subNode);
                                break;
                            case svgElementCssOptions.width.name:
                                svgElementCssOptions.width.parseNode(subNode);
                                break;
                            case svgElementCssOptions.xOffset.name:
                                svgElementCssOptions.xOffset.parseNode(subNode);
                                break;
                            case svgElementCssOptions.yOffset.name:
                                svgElementCssOptions.yOffset.parseNode(subNode);
                                break;
                        }
                    }

                    this.value = svgElementCssOptions;
                }
            },
            value: undefined
        }
    }

    public parseNode(node: Attr|Element): void {
        
        // Ignore if node isn't an element
        if (NodeHelper.isElement(node)) {
            let allNodes = NodeHelper.getChildNodesArray(node);
            let svgElementCSSOptions = new SVGElementCSSOptions();

            for (let subNode of allNodes) {
                let subNodeName = NodeHelper.getNameOfNode(subNode);
                switch(subNodeName) {
                    case this.allowMultiSelect.name:
                        this.allowMultiSelect.parseNode(subNode);
                        break;
                    case this.editorCssOptions.name:
                        this.editorCssOptions.parseNode(subNode);
                        break;
                    case this.svgElementCssOptions.name:
                        this.svgElementCssOptions.parseNode(subNode);
                        break;
                    case this.svgElementSelector.name:
                        this.svgElementSelector.parseNode(subNode);
                        break;
                }
            }
        }
    }
}

export default class ApertureSvgEditor {
    // [Fields]

    /**
     * An element with a tag name of 'aperture-svg-editor'.
     */
    private element: Element;

    private nodes: Array<Attr|Element>;

    private svgElements: SVGElement[];

    // @Inject
    public svgActionService: SvgActionService;

    /**
     * The settings of this class.
     */
    private settings: ApertureSvgEditorOptions;

    // [End Fields]

    // [Ctor]

    public constructor(element: Element) {
        this.element = element;
        this.nodes = [];
        this.settings = new ApertureSvgEditorOptions();
        this.svgActionService = new SvgActionService();
        this.svgElements = [];

        // Retrieve the options child element
        let optionEls = element.getElementsByTagName('options');
        if (optionEls.length > 0) {

            // Init settings from node
            this.settings.parseNode(optionEls[0]);
        }

        // Now that the settings have been retrieved, update the editor accordingly
        
        // Handle svgElementSelector
        if (this.settings.svgElementSelector.value != null) {
            let element = document.querySelector(this.settings.svgElementSelector.value || '');

            // Verify the element exists
           if (element == null) {
                throw new Error(`Failed to locate an SVGElement using the css query: ${this.settings.svgElementSelector.value}`);
           } else {
                this.registerSvgAsEditor(<SVGElement>element);
           }
        } else {

            // Move to mask service?

            // Create canvas
            let svgCanvas = document.createElementNS(NS.SVG, "svg");

            // Create defs
            let defsEl = document.createElementNS(NS.SVG, "defs");

            // Create the editableAreaDef
            let editableAreaDef = document.createElementNS(NS.SVG, "clipPath");
            editableAreaDef.setAttribute("id", "editableArea"); // Move id to const

            // Create default clipPath
            let defaultClipPath = document.createElementNS(NS.SVG, "use");
            defaultClipPath.setAttribute("href", "#editableAreaRect");

            // Create mask
            let maskEl = document.createElementNS(NS.SVG, "use");

            // Create the editor
            let editorEl = document.createElementNS(NS.SVG, "g");

            // Create the handles
            let handles = document.createElementNS(NS.SVG, "g");

            this.element.appendChild(svgCanvas);
            let elements = element.getElementsByTagName('svg');
            for (let i = 0; i < elements.length; i++) {
                this.registerSvgAsEditor(elements[i]);
            }
        }

        // TODO:  Finish implement settings
    }

    // [End Ctor]

    // [Properties]

    public get editors() {
        return this.svgElements;
    }

    // [End Properties]

    // [Functions]

    public registerSvgAsEditor(svgElement: SVGElement): void {
        this.svgElements.push(svgElement);
    }

    public switchMaskTo(maskId: string|null): void {
        this.editors.map(editor => {
            let $editor = $(editor);
            if (maskId == null) {
                $editor.find(".editAreaMask").removeAttr("href");
                $editor.find(".editor").removeAttr("clip-path");
            } else {
                $editor.find(".editAreaMask").attr("href", `#${maskId}`);
                $editor.find(".editor").attr("clip-path", "url(#editableArea)");
                $editor.find("defs clipPath#editableArea use").attr("href", `#${maskId}`);
            }
        });
    }

    /**
     * TODO: Implement function
     * @param numbers 
     */
    public createMask(...numbers: number[]) {
        console.log("TODO")
    }

    public addRectangle(x: number, y: number, width: number, height: number): void {
        let rectEl = document.createElementNS(NS.SVG, "rect");
        const colors = [
            "red",
            "orange",
            "yellow",
            "green",
            "blue",
            "indigo",
            "violet"
        ];
        let fill = colors[Math.floor(Math.random() * colors.length)];
        $(rectEl).attr({ x, y, width, height, fill });
        this.editors.map(editor => {
            let $editor = $(editor);
            $editor.find(".editor").append(rectEl);
        });
    }

    // [End Functions]
}
