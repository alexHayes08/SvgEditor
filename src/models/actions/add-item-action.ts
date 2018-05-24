const uniqid = require("uniqid");

import * as d3 from "d3";

import { ISvgAction } from "../isvg-action";
import { SvgCanvas } from "../svg-canvas-model";
import { SvgItem } from "../svg-item-model";
import { isSvgGraphicsElement, getFurthestSvgOwner } from "../../helpers/svg-helpers";
import { Names } from "../names";
import { NS } from "../../helpers/namespaces-helper";
import { SvgTransformServiceSingleton, ICoords2D } from "../../services/svg-transform-service";
import { EditorLocation } from "../svg-editor-model";

// import { Singleton } from 'typescript-ioc';

export class AddItemAction implements ISvgAction {
    //#region Fields

    private readonly elements: SVGGraphicsElement[];
    private readonly editor: SVGGElement;
    private readonly editorDataMap: WeakMap<Element,SvgItem>;
    private readonly elementDataMap?: WeakMap<Element,SvgItem>;
    private readonly onBeforeItemsAdded?: Function;
    private readonly onAfterItemsAdded?: Function;
    private readonly onBeforeItemsRemoved?: Function;
    private readonly onAfterItemsRemoved?: Function;

    //#endregion

    //#region Ctor

    public constructor(editor: SVGGElement, 
        items: DocumentFragment,
        dataMap: WeakMap<Element,SvgItem>,
        onBeforeItemsAdded?: (items: SvgItem[]) => void,
        onAfterItemsAdded?: (items: SvgItem[]) => void,
        onBeforeItemsRemoved?: (items: SvgItem[]) => void,
        onAfterItemsRemoved?: (items: SvgItem[]) => void,
        positionMap?: WeakMap<Element,SvgItem>)
    {
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

            // Assign a unique id to each element if it doesn't have one
            if (itemWrapper.id == "") {
                itemWrapper.id = uniqid();
            }
            d3.select(itemWrapper)
                .selectAll<Element, {}>("*")
                .attr("id", function() {
                    if (this.id == "") {
                        return uniqid();
                    } else {
                        return this.id;
                    }
                });

            if (!isSvgGraphicsElement(itemWrapper)) {
                throw new Error("Internal error occurred.");
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

        if (this.onBeforeItemsAdded) {
            this.onBeforeItemsAdded(svgItems);
        }

        for (let item of this.elements) {
            this.editor.appendChild(item);
        }

        // Get the canvas element
        let canvas = getFurthestSvgOwner(this.editor);

        // Try to scale the items to fit in the canvas. The scale ratio should
        // be the same for the x and y.
        let scaleRatio = 1;
        let canvasBBox = SvgTransformServiceSingleton.getBBox(canvas);
        let itemsBBox = SvgTransformServiceSingleton
            .getBBox(...this.elements);

        if (itemsBBox.height > (canvasBBox.height / 2)) {
            scaleRatio = (canvasBBox.height / 2) / itemsBBox.height;
        }

        if (itemsBBox.width > (canvasBBox.width / 2) * scaleRatio) {
            scaleRatio = (canvasBBox.width / 2) / itemsBBox.width;
        }

        svgItems.map(svgItem => {
            svgItem.transforms.setScale({ x: scaleRatio, y: scaleRatio });

            // This update is applied because scaling an object changes its
            // translation which is needed for determining its center for the
            // next step.
            svgItem.update();
        });

        // Center the items
        let canvasCenter = SvgTransformServiceSingleton.getCenter(canvas);
        let itemsCenter = SvgTransformServiceSingleton
            .getCenter(...svgItems.map(svgItem => svgItem.getElement()));
        let itemsOffset: ICoords2D = {
            x: Math.abs(canvasCenter.x - itemsCenter.x),
            y: Math.abs(canvasCenter.y - itemsCenter.y)
        };

        svgItems.map(svgItem => {

            // Apply offset to center element
            svgItem.transforms.incrementTranslate(itemsOffset);

            // Apply remaining transformations to the item.
            svgItem.update();
        });

        if (this.onAfterItemsAdded) {
            this.onAfterItemsAdded(svgItems);
        }
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

        if (this.onBeforeItemsRemoved) {
            this.onBeforeItemsRemoved(svgItems);
        }

        for (let item of this.elements) {
            this.editorDataMap.delete(item);
            this.editor.removeChild(item);
        }

        if (this.onAfterItemsRemoved) {
            this.onAfterItemsRemoved(svgItems);
        }
    }

    //#endregion
}
