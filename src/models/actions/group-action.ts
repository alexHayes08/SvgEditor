const uniqid = require("uniqid");

import * as d3 from "d3";

import { ISvgAction } from "../isvg-action";
import { SvgCanvas } from "../svg-canvas-model";
import { SvgItem } from "../svg-item-model";
import { isSvgGraphicsElement, getFurthestSvgOwner } from "../../helpers/svg-helpers";
import { Names } from "../names";
import { NS } from "../../helpers/namespaces-helper";
import { SvgTransformServiceSingleton, ICoords2D } from "../../services/svg-transform-service";
import { appyDragBehavior } from "../svg-handles-model";

interface ITempData {
    parent: Element;
    order: number;
}

export class GroupAction implements ISvgAction {
    //#region Fields

    private readonly canvas: SvgCanvas;
    private readonly groupedParent: Element;
    private readonly ordering: WeakMap<SvgItem, ITempData>;
    private readonly items: SvgItem[];
    
    private group?: SvgItem;

    //#endregion

    //#region Ctor

    public constructor(canvas: SvgCanvas, items: SvgItem[], groupedParent: Element) {
        this.canvas = canvas;
        this.groupedParent = groupedParent;
        this.items = items;
        this.ordering = new WeakMap();

        // Store ordering of the items.
        this.items.map(item => {
            let element = item.getElement();
            let parent = element.parentElement;

            if (parent == undefined) {
                throw new Error("All elements being grouped MUST have a parent.");
            }

            let order: number = -1;
            for (let i = 0; i < parent.childElementCount; i++) {
                if (parent.children[i] == element) {
                    order = i;
                    break;
                }
            }

            if (order == -1) {
                throw new Error("Failed to find the child element from the parent element.");
            }

            this.ordering.set(item, { order, parent });
        });
    }

    //#endregion

    //#region Functions

    public applyOperation(): void {
        let self = this;
        let { handles } = this.canvas;

        if (handles == undefined) {
            return;
        }

        // Remove drag behavior
        // handles.onBeforeItemsRemoved(this.items);
        
        // Create group element
        let group = <SVGGElement>document.createElementNS(NS.SVG, "g");
        group.id = uniqid();

        // Append to parent
        this.groupedParent.appendChild(group);

        // Remove old drag behavior
        handles.onBeforeItemsRemoved(this.items);

        // Remove and append all elements to the group.
        this.items.map(item => {
            let el = item.getElement();

            // Remove element and append it to the group element.
            el.remove();
            group.appendChild(el);
        });

        this.group = new SvgItem(group);
        handles.onBeforeItemsAdded([this.group]);
        handles.onAfterItemsAdded([this.group]);
    }

    public undoOperation(): void {
        let self = this;
        let { handles } = this.canvas;

        if (handles == undefined) {
            return;
        }

        // Assert that the group element isn't undefined.
        if (this.group == undefined) {
            throw new Error("Cannot undo if the group element is undefined.");
        }

        let groupEl = this.group.getElement();
        handles.onBeforeItemsRemoved([this.group])
        handles.onBeforeItemsAdded(this.items);

        this.items.map(item => {
            let el = item.getElement();
            let data = self.ordering.get(item);

            if (el && data) {
                // Remove element from group
                el.remove();

                // Insert el into it's original parent
                if (data.order == 0 && data.parent.childElementCount == 0) {
                    data.parent.appendChild(el);
                } else {
                    data.parent.insertBefore(el,
                        data.parent.children[data.order - 1]);
                }
            }
        });

        // Add drag behavior
        handles.onAfterItemsAdded(this.items);

        // At the end of this make the group element undefined as to prevent
        // undo-ing the operation twice.
        groupEl.remove();
        this.group = undefined;
    }

    //#endregion
}