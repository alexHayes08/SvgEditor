import IOption, { BooleanOption, IFromNode, NumberOption, StringOption } from "./ioption";
import NodeHelper from '../helpers/node-helper';
import SvgActionService from "../services/svg-action-service";
import SvgTypeService from "../services/svg-type-service";
import SvgUndoManagerService from "../services/svg-undo-manager-service";

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

    private svgElement: SVGElement;

    private services: object;

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
        
        // Init all services
        this.services = {
            SvgActionService,
            SvgTypeService,
            SvgUndoManagerService
        };

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
                this.svgElement = <SVGElement>element;
           }
        } else {
            let svgCanvas = document.createElement("svg");
            this.element.appendChild(svgCanvas);
            this.svgElement = element.getElementsByTagName('svg')[0];
        }

        // TODO:  Finish implement settings
    }

    // [End Ctor]

    // [Properties]

    // [End Properties]

    // [Functions]

    // [End Functions]
}
