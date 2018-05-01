const uniqid = require("uniqid");

import * as $ from "jquery";

import * as d3 from "d3";

import { NS } from "../helpers/namespaces-helper";
import { ISvgHandles } from "./isvg-handles-model";
import { SvgDefs } from "./svg-defs-model";
import { drawCubicBezierArc, IDrawArcConfig, ISliceV2 } from "../helpers/svg-helpers";
import { SvgItem } from "./svg-item-model";
import { SvgTransformService, IBBox } from "../services/svg-transform-service";
import { toRadians } from "../helpers/math-helpers";

export class SvgHandles implements ISvgHandles {
    // [Fields]

    private defs: SvgDefs;
    private handlesContainer: SVGElement;
    private selectedObjects: SvgItem[];
    private transformService: SvgTransformService;
    private _lastSelectedSection: number;

    private circleEl: SVGGElement;
    private deleteEl: SVGCircleElement;
    private optionEls: SVGPathElement[];

    // [End Fields]

    // [Ctor]

    constructor(handlesContainer: SVGElement, defs: SvgDefs, data: ISliceV2[]) {
        this.defs = defs;
        this.handlesContainer = handlesContainer;
        this.selectedObjects = [];
        this.optionEls = [];
        this.transformService = new SvgTransformService();
        this._lastSelectedSection = 0;

        // Create handle elements

        // Circle which will contain the selected items
        this.circleEl = <SVGGElement>document.createElementNS(NS.SVG, "g");
        $(this.circleEl).attr({ id: uniqid() });
        this.transformService.standardizeTransforms(this.circleEl);

        this.deleteEl = <SVGCircleElement>document.createElementNS(NS.SVG, "circle");
        $(this.deleteEl).attr({
            id: uniqid(),
            "data-name": "handle-delete-btn",
            fill: "red",
            stroke: "rgb(100,100,100)",
            "stroke-width": 2,
            r: 20,
            cx: 10,
            cy: 10
        });
        this.transformService.standardizeTransforms(this.deleteEl);

        let circlePathsData: IDrawArcConfig = {
            radius: 50,
            slices: [
                {
                    degrees: 240,
                    color: "gray"
                },
                {
                    degrees: 60,
                    color: "green"
                },
                {
                    degrees: 60,
                    color: "blue"
                }    
            ],
            width: 4,
            startAngle: 60
        };
        let circlePaths = drawCubicBezierArc(circlePathsData);

        // Store init data in handles element
        $(this.handlesContainer).data(circlePathsData);

        // Compose elements
        this.handlesContainer.appendChild(this.circleEl);
        this.handlesContainer.appendChild(this.deleteEl);

        for (let circlePath of circlePaths) {
            this.circleEl.appendChild(circlePath);
        }

        // Create circle arcs
        let arcData = [
            toRadians(120/4),
            toRadians(120/4),
            toRadians(120/4),
            toRadians(120/4),
            toRadians(240)
        ];
        let arcPaths = d3.pie()(arcData);
        arcPaths.map(path => {
            d3.select(this.handlesContainer)
                .selectAll("path")
                .data(arcData)
                .enter()
                .append
        });

        // Add event handlers
        $(this.deleteEl).on("click", e => this.onDeleteClicked(e));

        // Hide handles
        this.displayHandles();
    }

    // [End Ctor]

    // [Properties]

    /**
     * Returns the last selected section.
     */
    get lastSelectedSection() {
        return this._lastSelectedSection;
    }

    /**
     * Value must be greater than or equal to zero and less than 100.
     */
    set lastSelectedSection(value: number) {
        if (value >= 0 && value < 100) {
            this._lastSelectedSection = value;
        }
    }

    // [End Properties]

    // [Functions]

    // [Event Handlers]

    private onDeleteClicked(event: JQuery.Event<HTMLElement, null>) {
        console.log("Delete clicked!");
    }

    // [End Event Handlers]

    /**
     * Will hide/show the handles.
     * @param show 
     */
    private displayHandles(): void {
        if (this.selectedObjects.length == 0) {
            $(this.handlesContainer).hide();
        } else {
            $(this.handlesContainer).show();
            this.updateHandlesTransforms();
        }
    }

    private updateHandlesTransforms(): void {
        let items = this.getSelectedObjects();
        
        // Check if anything is selected.
        if (items.length == 0) {
            return;
        }

        // Get bbox of all items
        let bbox:IBBox|null = null

        for (let item of this.getSelectedObjects()) {
            let itemBBox = this.transformService.getBBox(item.element);

            if (bbox == null) {
                bbox = itemBBox;
                continue;
            }

            // Check left
            if (itemBBox.x < bbox.x) {
                bbox.x = itemBBox.x;
            }

            // Check right
            if ((itemBBox.x + itemBBox.width) > (bbox.x + bbox.width)) {
                bbox.width = itemBBox.width;
            }

            // Check top
            if (itemBBox.y < bbox.y) {
                bbox.y = itemBBox.y;
            }

            // Check bottom
            if ((itemBBox.y + itemBBox.height) > (bbox.y + bbox.height)) {
                bbox.height = itemBBox.height;
            }
        }

        bbox = <IBBox>bbox;

        // Update the handles to surround the bbox
        this.transformService.setTranslation(this.circleEl, { 
            x: bbox.x + (bbox.width / 2), 
            y: bbox.y + (bbox.height / 2)
        });
        let hyp = Math.sqrt((bbox.width * bbox.width) + (bbox.height * bbox.height));
        this.circleEl.setAttribute("r", hyp.toFixed(3));

        // Get the updated circles bbox
        let circleBBox = this.transformService.getBBox(this.circleEl);

        // Update delete btn position
        this.transformService.setTranslation(this.deleteEl, {
            x: circleBBox.x + circleBBox.width,
            y: circleBBox.y
        });
    }

    private updateHandlesV2(data: any): void {
        d3.select(this.handlesContainer)
            .selectAll("path")
            .data(data)
            .enter()
    }

    public selectObjects(...elements: SvgItem[]): void {
        this.selectedObjects = this.selectedObjects.concat(elements);

        this.displayHandles();
    }

    public deselectObjects(...elements: SvgItem[]): void {
        
        // If no elements are passed in deselect everything
        if (elements.length == 0) {
            this.selectedObjects = [];
        } else {
            this.selectedObjects = this.selectedObjects
                .filter(obj => elements.indexOf(obj) == -1);
        }

        this.displayHandles();
    }

    public getSelectedObjects(): SvgItem[] {
        return [ ...this.selectedObjects ];
    }

    // [End Functions]
}