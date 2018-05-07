const uniqid = require("uniqid");

import * as $ from "jquery";

import * as d3 from "d3";

import { ActivatableServiceSingleton } from "../services/activatable-service";
import { Names } from "./names";
import { NS } from "../helpers/namespaces-helper";
import { ISvgHandles } from "./isvg-handles-model";
import { SvgDefs } from "./svg-defs-model";
import { drawCubicBezierArc, IDrawArcConfig, ISliceV2, isSvgElement, getNewPointAlongAngle, convertToSvgElement, convertToSvgGraphicsElement, getFurthestSvgOwner, isSvgGraphicsElement } from "../helpers/svg-helpers";
import { ISlice, isISlice, DefaultCircleArc, ICircleArc } from "../models/islice";
import { SvgItem } from "./svg-item-model";
import { SvgTransformService, SvgTransformServiceSingleton, IBBox } from "../services/svg-transform-service";
import { toRadians } from "../helpers/math-helpers";

export enum SvgHandlesModes {
    INACTIVE = 0,
    ACTIVE = 1,
    DELETE = 2,
    MOVE = 3,
    SCALE = 4,
    ROTATE = 5
};

/**
 * This should be moved out of here into the UI.
 */
export class SvgHandles implements ISvgHandles {
    // [Fields]

    private defs: SvgDefs;
    private parentNode: SVGElement;
    private selectedObjects: SvgItem[];
    private transformService: SvgTransformService;
    private _lastSelectedSection: number;
    private handlesData: ICircleArc;
    // private dragBehavior: d3.DragBehavior<Element, {}, {} | d3.SubjectPosition>;
    private cachedElementsWithEvts: Element[];

    private arcsContainer: SVGGElement;
    private deleteEl: SVGGraphicsElement;
    private moveEl: SVGGraphicsElement;
    private scaleEl: SVGGraphicsElement;
    private rotateEl: SVGGraphicsElement;
    private optionEls: SVGPathElement[];

    // [End Fields]

    // [Ctor]

    constructor(parent: SVGElement, defs: SvgDefs, data: ICircleArc) {
        this.defs = defs;
        this.parentNode = parent;
        this.selectedObjects = [];
        this.optionEls = [];
        this.transformService = SvgTransformServiceSingleton;
        this._lastSelectedSection = 0;
        this.handlesData = data;
        this.cachedElementsWithEvts = [];

        // Make handles use the 'activatable' class. This will be used when
        // showing/hiding the handles.
        ActivatableServiceSingleton.register(this.parentNode);

        // Assign drag behavior
        // this.dragBehavior = d3.drag()
        //     .container(getFurthestSvgOwner(this.handlesContainer))
        //     .on("start", dragStart)
        //     .on("drag", dragged)
        //     .on("end", dragEnd);

        // Create handle elements
        let handleContainer = d3.select(parent)
            .append("g")
            .attr("id", uniqid())
            .attr("data-name", Names.Handles.DATA_NAME);

        // Group which will contain the arcs, which should surround the
        // selected items.
        let defaultTransformStr = this.transformService.defaultTransformString;

        d3.select(this.parentNode)
            .append("g")
            .attr("id", uniqid())
            .attr("data-name", "handles-arc-container")
            .attr("transform", defaultTransformStr);

        this.arcsContainer = convertToSvgGraphicsElement(
            $(this.parentNode)
                .find("*[data-name='handles-arc-container']")[0]);

        // TODO: Rewrite how handles are loaded using d3.
        let handleBtnsData = [
            { "data-name": "handle-delete" },
            { "data-name": "handle-move" },
            { "data-name": "handle-scale" },
            { "data-name": "handle-rotate" }
        ].map(btnData => {
            return {
                ...btnData,
                id: uniqid(),
                r: 20,
                cx: 10,
                cy: 10
            };
        });

        d3.select(this.parentNode)
            .selectAll("circle")
            .data(handleBtnsData)
            .enter()
            .append("circle")
            .attr("id", function(d) { return uniqid() })
            .attr("class", Names.Handles.BTN_HANDLE_CLASS)
            .attr("data-name", function(d) { return d["data-name"] })
            .attr("r", 20)
            .attr("cx", 0)
            .attr("cy", 0)
            .attr("transform", defaultTransformStr);

        let $handlesContainer = $(this.parentNode);
        this.deleteEl = convertToSvgGraphicsElement($handlesContainer.find("[data-name='handle-delete']")[0]);
        this.scaleEl = convertToSvgGraphicsElement($handlesContainer.find("[data-name='handle-scale']")[0]);
        this.moveEl = convertToSvgGraphicsElement($handlesContainer.find("[data-name='handle-move']")[0]);
        this.rotateEl = convertToSvgGraphicsElement($handlesContainer.find("[data-name='handle-rotate']")[0]);

        // Add event handlers
        // $(this.deleteEl).on("click", e => this.onDeleteClicked(e));
        $(this.deleteEl).on("click", this.onDeleteClicked);

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
            ActivatableServiceSingleton.deactivate(this.parentNode);
            this.removeEvtListeners();
        } else {
            ActivatableServiceSingleton.activate(this.parentNode);
            this.drawHandles();
            this.updateHandlesPosition();
            this.addEvtListeners();
        }
    }

    private updateHandlesPosition(): void {
        let items = this.getSelectedObjects();
        
        // Check if anything is selected.
        if (items.length == 0) {
            return;
        }

        // Get bbox of all items
        let centerOfSelectedItems = 
            this.transformService.getCenter(...this.selectedObjects.map(so => so.element));

        // Update the handles to surround the bbox
        this.transformService.setTranslation(this.arcsContainer, { 
            x: centerOfSelectedItems.x, 
            y: centerOfSelectedItems.y
        });
    }

    private drawHandles(): void {
        let bbox = this.transformService.getBBox(...this.selectedObjects.map(so => so.element));

        if (bbox == null) {
            return;
        }

        let hyp = Math.sqrt((bbox.width * bbox.width) + (bbox.height * bbox.height));
        this.handlesData.radius = hyp;
        this.handlesData.draw(this.arcsContainer);

        // Get the updated circles bbox
        let deleteArc = $(this.arcsContainer).find("*[data-name='close-arc']")[0];
        let moveArc = $(this.arcsContainer).find("*[data-name='pan-arc']")[0];
        let scaleArc = $(this.arcsContainer).find("*[data-name='scale-arc']")[0];
        let rotateArc = $(this.arcsContainer).find("*[data-name='rotate-arc']")[0];

        if (!isSvgElement(deleteArc) 
            || !isSvgElement(moveArc)
            || !isSvgElement(scaleArc)
            || !isSvgElement(rotateArc))
        {
            throw new Error("Failed to find the delete arc.");
        }

        let deleteArcCenter = this.transformService.getCenter(deleteArc);
        let moveArcCenter = this.transformService.getCenter(moveArc);
        let scaleArcCenter = this.transformService.getCenter(scaleArc);
        let rotateArcCenter = this.transformService.getCenter(rotateArc);
        let centerOfArcs = this.transformService.getCenter(this.arcsContainer);

        // TODO: Make these variables, not sure where to pass these in...
        const PADDING_BETWEEN_ARC_AND_BTN = 10;
        const BUTTON_RADIUS = 10;

        // The distance between the arc and btn center.
        let hyp_3 = PADDING_BETWEEN_ARC_AND_BTN + BUTTON_RADIUS + 20;
        let deleteBtn_newCoords = getNewPointAlongAngle(centerOfArcs, deleteArcCenter, hyp_3);
        let moveBtn_newCoords = getNewPointAlongAngle(centerOfArcs, moveArcCenter, hyp_3);
        let scaleBtn_newCoords = getNewPointAlongAngle(centerOfArcs, scaleArcCenter, hyp_3);
        let rotateBtn_newCoords = getNewPointAlongAngle(centerOfArcs, rotateArcCenter, hyp_3);

        // Update delete btn position
        this.transformService.setTranslation(this.deleteEl, deleteBtn_newCoords);

        // Update move btn position
        this.transformService.setTranslation(this.moveEl, moveBtn_newCoords);

        // Update scale position
        this.transformService.setTranslation(this.scaleEl, scaleBtn_newCoords);

        // Update rotate position
        this.transformService.setTranslation(this.rotateEl, rotateBtn_newCoords);
    }

    private addEvtListeners(): void {
        
        // Retreive all elements without listeners
        let elementsWithOutListeners = this.selectedObjects
            .filter(so => this.cachedElementsWithEvts.indexOf(so.element) == -1)
            .map(so => so.element);

        let handlesModel = this;

        d3.selectAll<Element, {}>(elementsWithOutListeners)
            .call(d3.drag().container(getFurthestSvgOwner(this.parentNode))
                .on("start", function() {
                    console.log("drag start")
                }).on("drag", function() {
                    handlesModel.selectedObjects.map(el => {
                        if (isSvgGraphicsElement(this)) {
                            let tr = handlesModel.transformService.getTranslation(this);
                            tr.x += d3.event.dx;
                            tr.y += d3.event.dy;
                            handlesModel.transformService.setTranslation(this, tr);
                        }
                    });
                    
                    // Update the handles after translating all the selected items.
                    handlesModel.updateHandlesPosition();
                }).on("end", function() {
                    console.log("drag end")
                }));

        this.cachedElementsWithEvts = this.cachedElementsWithEvts
            .concat(elementsWithOutListeners);
    }

    private removeEvtListeners(): void {

        // Retreive all elements with listeners
        let elementsWithListeners = this.cachedElementsWithEvts;

        d3.selectAll<Element, {}>("*")
            .call(d3.drag()
                .on("start", null)
                .on("drag", null)
                .on("end", null));

        this.cachedElementsWithEvts = [];
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