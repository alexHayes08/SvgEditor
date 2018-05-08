const uniqid = require("uniqid");

import * as $ from "jquery";

import * as d3 from "d3";

import { ActivatableServiceSingleton } from "../services/activatable-service";
import { Names } from "./names";
import { NS } from "../helpers/namespaces-helper";
import { ISvgHandles } from "./isvg-handles-model";
import { ISlice, isISlice, DefaultCircleArc, ICircleArc } from "../models/islice";
import { SvgCanvas } from "./svg-canvas-model";
import { SvgDefs } from "./svg-defs-model";
import { SvgEditor } from "./svg-editor-model";
import { SvgItem } from "./svg-item-model";
import { SvgTransformService, SvgTransformServiceSingleton, IBBox } from "../services/svg-transform-service";
import { toRadians } from "../helpers/math-helpers";
import { 
    drawCubicBezierArc, 
    IDrawArcConfig, 
    ISliceV2, 
    isSvgElement, 
    getNewPointAlongAngle, 
    convertToSvgElement, 
    convertToSvgGraphicsElement, 
    getFurthestSvgOwner, 
    isSvgGraphicsElement 
} from "../helpers/svg-helpers";

export enum SvgHandlesModes {
    INACTIVE = 0,
    ACTIVE = 1,
    DELETE = 2,
    PAN = 3,
    SCALE = 4,
    ROTATE = 5
};

// Handles data
const handlesData = new DefaultCircleArc({
    startAngleOffset: 45 + 90,
    defaultColor: "rgba(0,0,0,0.25)",
    radius: 100,
    defaultWidth: 8,
    slices: [
        {
            name: "fill",
            angle: 90
        },
        {
            name: "color-arc",
            angle: 45,
            button: {
                dataName: "handle-colors"
            }
        },
        {
            name: "edit-arc",
            angle: 45,
            button: {
                dataName: "handle-edit"
            }
        },
        {
            name: "fill",
            angle: 90
        },
        {
            name: "close-arc",
            angle: 22.5,
            button: {
                dataName: "handle-delete"
            }
        },
        {
            name: "pan-arc",
            angle: 22.5,
            button: {
                dataName: "handle-move"
            }
        },
        {
            name: "rotate-arc",
            angle: 22.5,
            button: {
                dataName: "handle-rotate"
            }
        },
        {
            name: "scale-arc",
            angle: 22.5,
            button: {
                dataName: "handle-scale"
            }
        }
    ]
});

/**
 * This should be moved out of here into the UI.
 */
export class SvgHandles implements ISvgHandles {
    // [Fields]

    private canvas: SvgCanvas;
    private parentNode: SVGGraphicsElement;
    private selectedObjects: SvgItem[];
    private transformService: SvgTransformService;
    private _lastSelectedSection: number;
    private cachedElementsWithEvts: Element[];

    private handlesContainer: SVGGElement;
    private arcsContainer: SVGGElement;
    private deleteEl: SVGGraphicsElement;
    private moveEl: SVGGraphicsElement;
    private scaleEl: SVGGraphicsElement;
    private rotateEl: SVGGraphicsElement;
    private colorsEl: SVGGraphicsElement;
    private editEl: SVGGraphicsElement;
    private optionEls: SVGPathElement[];

    private highlightRectEl: SVGRectElement;

    // Setup the rotate elements
    private rotateHelpersContainer: SVGGElement;

    // [End Fields]

    // [Ctor]

    constructor(editor: SvgCanvas) {
        this.canvas = editor;
        this.parentNode = editor.canvasEl;
        this.selectedObjects = [];
        this.optionEls = [];
        this.transformService = SvgTransformServiceSingleton;
        this._lastSelectedSection = 0;
        this.cachedElementsWithEvts = [];

        // Create the highlight rect
        let highlightRectEl = d3.select(this.parentNode)
            .append<SVGRectElement>("rect")
            .attr("id", uniqid())
            .attr("data-name", Names.Handles.SubElements.HightlightRect.DATA_NAME)
            .node();

        if (highlightRectEl == null) {
            throw new Error("Failed to create the highlight rectangle.");
        }

        this.highlightRectEl = highlightRectEl;
        this.transformService.standardizeTransforms(this.highlightRectEl);

        // Create handle elements
        let handleContainer = d3.select(this.parentNode)
            .append<SVGGElement>("g")
            .attr("id", uniqid())
            .attr("data-name", Names.Handles.DATA_NAME)
            .node();

        if (handleContainer == undefined) {
            throw new Error("Failed to create the handles container element.");
        }

        this.handlesContainer = handleContainer;
        this.transformService.standardizeTransforms(this.handlesContainer);

        // Create the rotation helpers container
        let rotateHelpersContainer = d3.select(this.parentNode)
            .append<SVGGElement>("g")
            .attr("id", uniqid())
            .attr("data-name", Names.Handles.SubElements.RotationHelpersContainer.DATA_NAME)
            .node();

        if (rotateHelpersContainer == null) {
            throw new Error("Failed to create the rotation helpers container element.");
        }

        this.rotateHelpersContainer = rotateHelpersContainer;

        // Make handles use the 'activatable' class. This will be used when
        // showing/hiding the handles.
        ActivatableServiceSingleton.register(this.handlesContainer);

        // Group which will contain the arcs, which should surround the
        // selected items.
        let defaultTransformStr = this.transformService.defaultTransformString;

        d3.select(this.handlesContainer)
            .append("g")
            .attr("id", uniqid())
            .attr("data-name", "handles-arc-container")
            .attr("transform", defaultTransformStr);

        this.arcsContainer = convertToSvgGraphicsElement(
            $(this.parentNode)
                .find("*[data-name='handles-arc-container']")[0]);

        // Draw handles
        handlesData.draw(this.arcsContainer);

        // Now set the rest of the elements
        let $handlesContainer = $(this.parentNode);
        this.deleteEl = convertToSvgGraphicsElement($handlesContainer.find("[data-name='handle-delete']")[0]);
        this.scaleEl = convertToSvgGraphicsElement($handlesContainer.find("[data-name='handle-scale']")[0]);
        this.moveEl = convertToSvgGraphicsElement($handlesContainer.find("[data-name='handle-move']")[0]);
        this.rotateEl = convertToSvgGraphicsElement($handlesContainer.find("[data-name='handle-rotate']")[0]);
        this.colorsEl = convertToSvgGraphicsElement($handlesContainer.find("[data-name='handle-colors']")[0]);
        this.editEl = convertToSvgGraphicsElement($handlesContainer.find("[data-name='handle-edit']")[0]);

        // Add event handlers
        let self = this;
        d3.select(this.deleteEl).on("click", function({}, i: number) {
            self.onDeleteClicked();
        });

        d3.select<Element, {}>(this.rotateEl).call(d3.drag()
            .on("start", function({}, i: number) {
                console.log("Drag start on rotate handle btn");
            }).on("drag", function({}, i: number) {
                
            }).on("end", function({}, i: number) {
                console.log("Drag end on rotate handle btn")
            }));

        // Hide the handles
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

    private onDeleteClicked() {
        console.log("Delete clicked!");
        this.selectedObjects.map(item => {
            this.canvas.editor.remove(item.element.id);
        });

        this.selectedObjects = [];
    }

    // [End Event Handlers]

    /**
     * Will hide/show the handles.
     * @param show 
     */
    private displayHandles(): void {
        if (this.selectedObjects.length == 0) {
            ActivatableServiceSingleton.deactivate(this.handlesContainer);
            this.removeEvtListeners();
        } else {
            ActivatableServiceSingleton.activate(this.handlesContainer);
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
        this.transformService
            .setTranslation(this.handlesContainer, centerOfSelectedItems);
    }

    private drawHandles(): void {

        // Reset the position of the handles at (0,0)
        this.transformService.setTranslation(this.handlesContainer, { x: 0, y: 0 });

        let bbox = this.transformService.getBBox(...this.selectedObjects.map(so => so.element));

        if (bbox == null) {
            return;
        }

        let hyp = (Math.sqrt((bbox.width * bbox.width) + (bbox.height * bbox.height)) / 2) + 10;

        // Min-width for hyp
        if (hyp < 50) {
            hyp = 50;
        }

        handlesData.radius = hyp;
        handlesData.draw(this.arcsContainer);
    }

    private addEvtListeners(): void {
        
        // Retreive all elements without listeners
        // let elementsWithOutListeners = this.selectedObjects
        //     .filter(so => this.cachedElementsWithEvts.indexOf(so.element) == -1)
        //     .map(so => so.element);

        // let handlesModel = this;

        // d3.selectAll<Element, {}>(elementsWithOutListeners)
        //     .call(d3.drag().container(getFurthestSvgOwner(this.parentNode))
        //         .on("start", function() {
        //             console.log("drag start")
        //         }).on("drag", function() {
        //             handlesModel.selectedObjects.map(el => {
        //                 if (isSvgGraphicsElement(this)) {
        //                     let tr = handlesModel.transformService.getTranslation(this);
        //                     tr.x += d3.event.dx;
        //                     tr.y += d3.event.dy;
        //                     handlesModel.transformService.setTranslation(el.element, tr);
        //                 }
        //             });
                    
        //             // Update the handles after translating all the selected items.
        //             handlesModel.updateHandlesPosition();
        //         }).on("end", function() {
        //             console.log("drag end")
        //         }));

        // this.cachedElementsWithEvts = this.cachedElementsWithEvts
        //     .concat(elementsWithOutListeners);
    }

    private removeEvtListeners(): void {

        // // Retreive all elements with listeners
        // let elementsWithListeners = this.cachedElementsWithEvts;

        // d3.selectAll<Element, {}>("*")
        //     .call(d3.drag()
        //         .on("start", null)
        //         .on("drag", null)
        //         .on("end", null));

        // this.cachedElementsWithEvts = [];
    }

    public selectObjects(...elements: SvgItem[]): void {
        for (let el of elements) {
            if (this.selectedObjects.indexOf(el) == -1) {
                this.selectedObjects.push(el);
            }
        }

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

    public onBeforeItemAdded(item: SvgItem): void {
        console.log("Before item added");
        this.deselectObjects();
    }

    public onAfterItemAdded(item: SvgItem): void {
        console.log("After item added");
        this.selectObjects(item);
        let self = this;

        // Add event listener to the item
        d3.select<Element, {}>(item.element)
            .call(d3.drag()
                .container(<any>self.canvas.canvasEl)
                .on("start", function() {
                    console.log("Drag start.")

                    if (!d3.event.sourceEvent.ctrlKey) {
                        
                        // Check if the target is already selected, if not then
                        // deselect all objects
                        if (!self.selectedObjects.find(so => so.element.id == this.id)) {
                            self.deselectObjects();
                        }
                    }
    
                    // Only select the item it's not already selected
                    if (!self.selectedObjects.find(so => so.element.id == item.element.id)) {
                        self.selectObjects(item);
                    }
                }).on("drag", function() {
                    let increment = {
                        x: d3.event.dx,
                        y: d3.event.dy
                    };
                    self.selectedObjects.map(item => {
                        self.transformService.incrementTranslation(item.element, increment);
                    });
                    self.transformService.incrementTranslation(self.handlesContainer, increment);
                }).on("end", function() {
                    console.log("Drag end.")
                }));
    }

    public onBeforeItemRemoved(item: SvgItem): void {
        console.log("Before item removed");

        d3.select(item.element)
            .on("mousedown", null);
    }

    public onAfterItemRemoved(item: SvgItem): void {
        console.log("After item removed");
    }

    public onAddedToEditor(): void {
        console.log("Added to the editor.")
        let self = this;

        // Add event listener to the canvas
        d3.select(this.parentNode)
            .on("click", function({}, i: number) {
                
                // Check if any items intersect the point
                let { pageX:x, pageY: y } = d3.event;
                let transformedCoords = self.transformService
                    .convertScreenCoordsToSvgCoords({x,y}, <any>self.parentNode);
                let intersectingItems = self.canvas.editor
                    .getItemsIntersectionPoint(transformedCoords);
                
                if (intersectingItems.nodes().length == 0) {
                    self.deselectObjects();
                }
            });
    }

    public onRemovedFromEditor(): void {
        console.log("Removed from the editor.")

        // Remove event listener from the canvas
        d3.select(this.parentNode)
            .on("click", null);
    }

    // [End Functions]
}