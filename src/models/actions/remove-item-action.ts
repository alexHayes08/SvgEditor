const uniqid = require("uniqid");

import * as d3 from "d3";

import { ISvgAction } from "../isvg-action";
import { SvgCanvas } from "../svg-canvas-model";
import { SvgItem } from "../svg-item-model";
import { isSvgGraphicsElement, getFurthestSvgOwner } from "../../helpers/svg-helpers";
import { Names } from "../names";
import { NS } from "../../helpers/namespaces-helper";
import { SvgTransformServiceSingleton, ICoords2D } from "../../services/svg-transform-service";

// import { Singleton } from 'typescript-ioc';

export class RemoveItemAction implements ISvgAction {
    //#region Fields

    private readonly items: SvgItem[];
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
        items: SvgItem[],
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
        this.items = items;
        this.onBeforeItemsAdded = onBeforeItemsAdded;
        this.onAfterItemsAdded = onAfterItemsAdded;
        this.onBeforeItemsRemoved = onBeforeItemsAdded;
        this.onAfterItemsRemoved = onAfterItemsRemoved;
    }

    //#endregion

    //#region Functions

    public undoOperation(): void {
        if (this.onBeforeItemsAdded) {
            this.onBeforeItemsAdded(this.items);
        }

        for (let item of this.items) {
            this.editor.appendChild(item.getElement());
        }

        // Get the canvas element
        let canvas = getFurthestSvgOwner(this.editor);

        if (this.onAfterItemsAdded) {
            this.onAfterItemsAdded(this.items);
        }
    }

    public applyOperation(): void {
        if (this.onBeforeItemsRemoved) {
            this.onBeforeItemsRemoved(this.items);
        }

        d3.selectAll(this.items.map(i => i.getElement()))
            .remove()

        if (this.onAfterItemsRemoved) {
            this.onAfterItemsRemoved(this.items);
        }
    }

    //#endregion
}
