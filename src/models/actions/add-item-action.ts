const uniqid = require("uniqid");

import { ISvgAction } from "../isvg-action";
import { SvgCanvas } from "../svg-canvas-model";
import { SvgItem } from "../svg-item-model";
import { isSvgGraphicsElement } from "../../helpers/svg-helpers";
import { Names } from "../names";
import { NS } from "../../helpers/namespaces-helper";

// import { Singleton } from 'typescript-ioc';

export class AddItemAction implements ISvgAction {
    //#region Fields

    private readonly canvas: SvgCanvas;
    private readonly elements: SVGGraphicsElement[];
    private readonly editor: SVGGElement;
    private readonly editorDataMap: WeakMap<Element,SvgItem>;
    private readonly elementDataMap?: WeakMap<Element,SvgItem>;
    private readonly onBeforeItemsAdded: Function;
    private readonly onAfterItemsAdded: Function;
    private readonly onBeforeItemsRemoved: Function;
    private readonly onAfterItemsRemoved: Function;

    //#endregion

    //#region Ctor

    public constructor(canvas: SvgCanvas, 
        editor: SVGGElement, 
        items: DocumentFragment,
        onBeforeItemsAdded: (items: SvgItem[]) => void,
        onAfterItemsAdded: (items: SvgItem[]) => void,
        onBeforeItemsRemoved: (items: SvgItem[]) => void,
        onAfterItemsRemoved: (items: SvgItem[]) => void,
        dataMap: WeakMap<Element,SvgItem>,
        positionMap?: WeakMap<Element,SvgItem>)
    {
        this.canvas = canvas;
        this.editor = editor;
        this.editorDataMap = dataMap;
        this.elementDataMap = positionMap;
        this.elements = [];
        this.onBeforeItemsAdded = onBeforeItemsAdded;
        this.onAfterItemsAdded = onAfterItemsAdded;
        this.onBeforeItemsRemoved = onBeforeItemsAdded;
        this.onAfterItemsRemoved = onAfterItemsRemoved;

        while (items.childNodes.length > 0) {
            let el = <Element>items.childNodes[0];

            // If it's not a graphics element skip it
            if (!isSvgGraphicsElement(el)) {
                items.removeChild(el);
                continue;
            }

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

            if (itemWrapper.id == "") {
                itemWrapper.id = uniqid();
            }

            this.elements.push(itemWrapper);
        }
    }

    //#endregion

    //#region Functions

    public applyOperation(): void {
        let svgItems: SvgItem[] = [];

        for (let item of this.elements) {
            let svgItem = new SvgItem(item);
            this.editorDataMap.set(item, svgItem);
            svgItems.push(svgItem);
        }

        this.onBeforeItemsAdded(svgItems);

        for (let item of this.elements) {
            this.editor.appendChild(item);
        }

        this.onAfterItemsAdded(svgItems);
    }

    public undoOperation(): void {
        let svgItems: SvgItem[] = [];

        for (let item of this.elements) {
            let svgItem = this.editorDataMap.get(item);

            if (svgItem == undefined) {
                continue;
            }

            svgItems.push(svgItem);
        }

        this.onBeforeItemsAdded(svgItems);

        for (let item of this.elements) {
            this.editorDataMap.delete(item);
            this.editor.appendChild(item);
        }

        this.onAfterItemsAdded(svgItems);
    }

    //#endregion
}
