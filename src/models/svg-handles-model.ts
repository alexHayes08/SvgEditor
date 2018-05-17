const uniqid = require("uniqid");

import * as $ from "jquery";

import * as d3 from "d3";

import { ActivatableServiceSingleton } from "../services/activatable-service";
import { HandlesRotationOverlay } from "./handles-rotation";
import { Names } from "./names";
import { NS } from "../helpers/namespaces-helper";
import { ISvgHandles } from "./isvg-handles-model";
import { ISlice, isISlice, DefaultCircleArc, ICircleArc } from "../models/islice";
import { SvgCanvas } from "./svg-canvas-model";
import { SvgDefs } from "./svg-defs-model";
import { SvgEditor } from "./svg-editor-model";
import { SvgItem } from "./svg-item-model";
import { SvgTransformService, SvgTransformServiceSingleton, IBBox, IRotationMatrix, ITransformable, SvgTransformString } from "../services/svg-transform-service";
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
import { HandlesMain } from "./handles-main";

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
    //#region Fields

    private canvas: SvgCanvas;
    private parentNode: SVGGraphicsElement;
    private selectedObjects: SvgItem[];
    private transformService: SvgTransformService;
    private _lastSelectedSection: number;
    private cachedElementsWithEvts: Element[];
    private minHandlesRadius: number;
    private transformData: ITransformable;

    private handlesContainer: SVGGElement;
    private mainHandlesOverlay: HandlesMain;
    private highlightRectEl: SVGRectElement;

    //#endregion

    //#region Ctor

    constructor(editor: SvgCanvas) {
        this.canvas = editor;
        this.parentNode = editor.canvasEl;
        this.selectedObjects = [];
        // this.optionEls = [];
        this.transformService = SvgTransformServiceSingleton;
        this._lastSelectedSection = 0;
        this.cachedElementsWithEvts = [];
        // this._mode = SvgHandlesModes.PAN;
        this.minHandlesRadius = 75;
        this.transformData = SvgTransformString.CreateDefaultTransform();

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
        ActivatableServiceSingleton.register(this.handlesContainer, false);

        // Create main handles overlay
        this.mainHandlesOverlay = new HandlesMain(d3.select(handleContainer), this.canvas.editor);
        this.mainHandlesOverlay.onDeleteClickedHandlers
            .push(this.onDeleteClicked.bind(this));
        this.mainHandlesOverlay.onRotationEventHandlers
            .push(this.onRotation.bind(this));
        this.mainHandlesOverlay.draw();

        // Add a shadows definition
        this.canvas.defs.createSection("shadows");

        // Can't use d3 to create an feDropShadow element
        let filter = document.createElementNS(NS.SVG, "filter");
        filter.setAttribute("id", "shadow-1");
        let feDropShadow = document.createElementNS(NS.SVG, "feDropShadow");
        feDropShadow.setAttribute("dx", "0");
        feDropShadow.setAttribute("dy", "1");
        feDropShadow.setAttribute("stdDeviation", "2");        
        filter.appendChild(feDropShadow);
        this.canvas.defs.pushToSection(filter, "shadows");
        this.handlesContainer.style.filter = this.canvas.defs
            .getUrlOfSectionItem("shadow-1", "shadows");
    }

    //#endregion

    //#region Properties

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

    //#endregion

    //#region Functions

    //#region Event Handlers

    private onDeleteClicked() {
        console.log("Delete clicked!");
        this.selectedObjects.map(item => {
            this.canvas.editor.remove(item);
        });

        this.selectedObjects = [];
    }

    private onRotation(angle: IRotationMatrix): void {
        this.selectedObjects.map(so => {
            
            so.angle = angle.a;
            so.update();
            // Check that the element was registered
            // if (soData != undefined) {
            //     soData.angle
            // }
        });
        // let centerOfItems = this.transformService.getCenter(...this.selectedObjects.map(so => this.canvas.editor.getData(so)));
        // for (let item of this.selectedObjects) {
        //     // this.transformService.setRotation(item.element, {
        //     //     a: angle.a
        //     // });

        //     // let bbox = this.transformService.getBBox(item.element)
        //     // this.transformService.setTranslation(item.element, {
        //     //     x: (angle.cx || 0),// - (bbox.width/2),
        //     //     y: (angle.cy || 0)// - (bbox.height/2)
        //     // });
        // }
    }

    public onBeforeItemsAdded(items: SvgItem[]): void {
        console.log("Before item added");
        this.deselectObjects();
    }

    public onAfterItemsAdded(items: SvgItem[]): void {
        console.log("After item added");
        this.selectObjects(...items);
        let self = this;

        // Add event listener to the item
        d3.selectAll<Element, {}>(items.map(item => SvgItem.GetElementOfSvgItem(item)))
            .call(d3.drag()
                .container(<any>self.canvas.canvasEl)
                .on("start", function() {
                    console.log("Drag start.");

                    let data = self.canvas.editor.getData(<any>this);

                    if (data == undefined) {
                        return;
                    }

                    if (!d3.event.sourceEvent.ctrlKey) {
                        
                        // Check if the target is already selected, if not then
                        // deselect all objects
                        if (!self.selectedObjects.find(so => so == data)) {
                            self.deselectObjects();
                        }
                    }
    
                    // Only select the item it's not already selected
                    if (!self.selectedObjects.find(so => so == data)) {
                        self.selectObjects(data);
                    }
                }).on("drag", function() {
                    let increment = {
                        x: d3.event.dx,
                        y: d3.event.dy
                    };
                    self.selectedObjects.map(item => {
                        item.transforms.incrementTranslate(increment);
                        item.update();
                    });

                    self.transformData.incrementTranslate(increment);
                    d3.select(self.handlesContainer)
                        .attr("transform", self.transformData.toTransformString());
                }).on("end", function() {
                    console.log("Drag end.");
                }));
    }

    public onBeforeItemsRemoved(item: SvgItem[]): void {
        console.log("Before item removed");
    }

    public onAfterItemsRemoved(item: SvgItem[]): void {
        console.log("After item removed");
    }

    public onAddedToEditor(): void {
        console.log("Added to the editor.")
        let self = this;

        // Add event listener to the canvas
        d3.select(this.parentNode)
            .on("click", function({}, i: number) {
                
                // Check if any items intersect the point
                let { x, y } = d3.event;
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

    //#endregion

    /**
     * Will hide/show the handles.
     * @param show 
     */
    private displayHandles(): void {
        if (this.selectedObjects.length == 0) {
            ActivatableServiceSingleton.deactivate(this.handlesContainer);
            // this.removeEvtListeners();
        } else {
            ActivatableServiceSingleton.activate(this.handlesContainer);
            this.drawHandles();
            this.updateHandlesPosition();
            // this.addEvtListeners();
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
            this.transformService.getCenter(...this.selectedObjects.map(so => SvgItem.GetElementOfSvgItem(so)));

        // Update the handles to surround the bbox
        this.transformData.setTranslate(centerOfSelectedItems);
        d3.select(this.handlesContainer)
            .attr("transform", this.transformData.toTransformString());
        // this.transformService
        //     .setTranslation(this.handlesContainer, centerOfSelectedItems);
    }

    private drawHandles(): void {

        let bbox = this.transformService.getBBox(...this.selectedObjects.map(so => SvgItem.GetElementOfSvgItem(so)));

        if (bbox == null) {
            return;
        }

        let hyp = (Math.sqrt((bbox.width * bbox.width) + (bbox.height * bbox.height)) / 2) + 10;

        // Min-width for hyp
        if (hyp < this.minHandlesRadius) {
            hyp = this.minHandlesRadius;
        }

        this.mainHandlesOverlay.radius = hyp;
        this.mainHandlesOverlay.center = {
            x: bbox.x + (bbox.width / 2),
            y: bbox.y + (bbox.height / 2)
        }
        this.mainHandlesOverlay.update();

        // // Reset the position of the handles at (0,0)
        // this.transformService.setTranslation(this.handlesContainer, { x: 0, y: 0 });

        // let bbox = this.transformService.getBBox(...this.selectedObjects.map(so => so.element));

        // if (bbox == null) {
        //     return;
        // }

        // let hyp = (Math.sqrt((bbox.width * bbox.width) + (bbox.height * bbox.height)) / 2) + 10;

        // // Min-width for hyp
        // if (hyp < 50) {
        //     hyp = 50;
        // }

        // handlesData.radius = hyp;
        // handlesData.draw(this.arcsContainer);
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

    //#endregion
}