import * as d3 from 'd3';

import { NS } from '../helpers/namespaces-helper';
import { ActivatableServiceSingleton } from '../services/activatable-service';
import {
    IRotationMatrix,
    ITransformable,
    ITranslationMatrix,
    SvgGeometryService,
    SvgGeometryServiceSingleton,
    SvgTransformString,
    TransformType,
} from '../services/svg-geometry-service';
import { TranslateAction } from './actions/translate-action';
import { HandlesMain } from './drawables/handles-main';
import { IOperationCallbacks } from './ioperation-callback';
import { ISvgHandles } from './isvg-handles';
import { Names } from './names';
import { SvgCanvas } from './svg-canvas-model';
import { SvgItem } from './svg-item-model';

const uniqid = require("uniqid");

export enum SvgHandlesModes {
    INACTIVE = 0,
    ACTIVE = 1,
    DELETE = 2,
    PAN = 3,
    SCALE = 4,
    ROTATE = 5
};

export function getDragBehavior(canvas: SvgCanvas) {
    return d3.drag()
        .container(<any>canvas.canvasEl);
}

export function appyDragBehavior(canvas: SvgCanvas,
    items: SvgItem[],
    callbacks?: IOperationCallbacks<ITranslationMatrix>) 
{
    if (!canvas.handles) {
        return;
    }

    let { handles } = canvas;

    items.map(item => {
        let element = item.getElement();
        d3.select<Element, {}>(element)
            .call(getDragBehavior(canvas)
                .on("start", function() {
                    console.log("Drag start. Recording intial positions.");

                    if (!d3.event.sourceEvent.ctrlKey) {
                        
                        // Check if the target is already selected, if not then
                        // deselect all objects.
                        if (!handles.getSelectedObjects().find(so => so == item)) {
                            handles.deselectObjects();
                        }
                    }

                    // Only select the item it's not already selected.
                    if (!handles.getSelectedObjects().find(so => so == item)) {
                        handles.selectObjects(item);
                    }

                    handles.getSelectedObjects().map(item => {
                        // Create a new ITransformable
                        let newTransform = new SvgTransformString([
                            TransformType.TRANSLATE,
                            TransformType.MATRIX
                        ]);

                        // Condense the previous transforms
                        newTransform.setMatrix(item.transforms
                            .consolidate()
                            .getMatrix());
                        
                        // Replace data.transforms with tne newly create transform.
                        item.transforms = newTransform;
                        item.update();
                    });

                    if (callbacks && callbacks.onBefore) {
                        callbacks.onBefore({x: 0, y: 0});
                    }
                }).on("drag", function() {
                    let increment = {
                        x: d3.event.dx,
                        y: d3.event.dy
                    };
        
                    // Update all selected items.
                    handles.getSelectedObjects().map(item => {
                        item.transforms.incrementTranslate(increment);
                        item.update();
                    });
        
                    if (callbacks && callbacks.onDuring) {
                        callbacks.onDuring(increment);
                    }
                }).on("end", function() {
                    console.log("Drag ended. Now applying action.");
                    let firstItem = handles.getSelectedObjects()[0];
                    let translate = firstItem.transforms.getTranslate();

                    // Zero translates
                    handles.getSelectedObjects().map(so => so.transforms.setTranslate({ x:0,y:0 }));

                    let action = new TranslateAction(translate, [...handles.getSelectedObjects()]);
                    canvas.editor.applyAction(action);

                    if (callbacks && callbacks.onAfter) {
                        callbacks.onAfter(translate);
                    }
                }));
    });
}

/**
 * This should be moved out of here into the UI.
 */
export class SvgHandles implements ISvgHandles {
    //#region Fields

    private canvas: SvgCanvas;
    private parentNode: SVGGraphicsElement;
    private selectedObjects: SvgItem[];
    private transformService: SvgGeometryService;
    private _lastSelectedSection: number;
    private cachedElementsWithEvts: Element[];
    private minHandlesRadius: number;
    private transformData: ITransformable;

    private htmlHandlesContainer: HTMLElement;
    private handlesContainer: SVGGElement;
    private mainHandlesOverlay: HandlesMain;
    // private colorHandlesOverlay: HandlesColorsOverlay;
    // private rotationOverlay: HandlesRotationOverlay;
    // private scaleOverlay: HandlesScaleOverlay;
    private highlightPathEl: SVGPathElement;

    //#endregion

    //#region Ctor

    constructor(editor: SvgCanvas) {
        this.canvas = editor;
        this.parentNode = editor.canvasEl;
        this.selectedObjects = [];
        this.transformService = SvgGeometryServiceSingleton;
        this._lastSelectedSection = 0;
        this.cachedElementsWithEvts = [];
        this.minHandlesRadius = 75;
        this.transformData = SvgTransformString.CreateDefaultTransform();

        // Create the html handles section
        this.htmlHandlesContainer = <HTMLElement>document
            .createElement("div");
        this.htmlHandlesContainer
            .setAttribute("data-name", "handles-html-container");
        this.canvas.canvasEl.insertAdjacentElement("afterend",
            this.htmlHandlesContainer);
        ActivatableServiceSingleton.register(this.htmlHandlesContainer, true); // FIXME: Change this back to false

        // Create the highlight rect
        let highlightRectEl = d3.select(this.parentNode)
            .append<SVGPathElement>("path")
            .attr("id", uniqid())
            .attr("data-name", Names.Handles.SubElements.HightlightRect.DATA_NAME)
            .node();

        if (highlightRectEl == null) {
            throw new Error("Failed to create the highlight rectangle.");
        }

        this.highlightPathEl = highlightRectEl;
        this.transformService.standardizeTransforms(this.highlightPathEl);
        ActivatableServiceSingleton.register(this.highlightPathEl);

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
        this.mainHandlesOverlay = new HandlesMain(handleContainer, 
            this.canvas, 
            this.htmlHandlesContainer);
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

        let callbacks: IOperationCallbacks<ITranslationMatrix> = {
            onDuring: (context: ITranslationMatrix) => {
                self.transformData.incrementTranslate(context);
                d3.select(self.handlesContainer)
                    .attr("transform", self.transformData.toTransformString());
            }
        };

        appyDragBehavior(self.canvas, [...self.getSelectedObjects()], callbacks);
    }

    public onBeforeItemsRemoved(items: SvgItem[]): void {

        // Remove all event listeners.
        // d3.selectAll<SVGGraphicsElement, {}>(items.map(item => item.getElement()))
        //     .on("mousedown.drag", null);
        items.map(item => {
            d3.select(item.getElement())
                .on("mousedown.drag", null);
        });
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
    }

    public highlightObjects(...elements: SVGGraphicsElement[]): void {
        let self = this;

        if (elements.length == 0) {

            // If no elements were provided, hide the highlight
            ActivatableServiceSingleton.deactivate(this.highlightPathEl);
            return;
        } else {

            // Get outline
            let pathEl = self.canvas.editor.getOutlineAroundElements(elements, 10);
            this.highlightPathEl.setAttribute("d", 
                pathEl.getAttribute("d") || "");

            ActivatableServiceSingleton.activate(this.highlightPathEl);
        }
    }

    /**
     * Will display/hide the handles if there are any selected objects.
     * 
     * This function only exists for verbosity, calling selectObjects with no
     * arguments achieves the same thing.
     */
    public updateHandles(): void {
        this.selectObjects();
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

    /**
     * Returns a copy of the selected objects
     */
    public getSelectedObjects(): ReadonlyArray<SvgItem> {

        // Return a copy of the array
        return [ ...this.selectedObjects ];
    }

    //#endregion
}