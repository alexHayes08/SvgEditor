import * as d3 from 'd3';

import { NS } from '../helpers/namespaces-helper';
import { createSvgEl } from '../helpers/svg-helpers';
import { ITransformable } from '../models/itransformable';
import { ActivatableServiceSingleton } from '../services/activatable-service';
import {
    IRotationMatrix,
    ITranslationMatrix,
    SvgGeometryService,
    SvgGeometryServiceSingleton,
    TransformType,
    ICoords2D,
} from '../services/svg-geometry-service';
import { TranslateAction } from './actions/translate-action';
import { IAngle, Angle } from './angle';
import { HandlesColorsOverlay, HandlesColorMode } from './drawables/handles-colors';
import { HandlesMain } from './drawables/handles-main';
import { HandlesRotationOverlay } from './drawables/handles-rotation';
import { HandlesScaleOverlay } from './drawables/handles-scale';
import { IDrawable } from './idrawable';
import { HandleMode, IMode } from './ihandle-button';
import { IOperationCallbacks } from './ioperation-callback';
import { ISvgHandles } from './isvg-handles';
import { Names } from './names';
import { SvgCanvas } from './svg-canvas-model';
import { SvgItem } from './svg-item-model';
import { SvgTransformString } from './svg-transform-string';
import { toRadians, toDegrees } from '../helpers/math-helpers';
import { calcConcentricPolygons } from '../helpers/geometry-helpers';
import { InternalError } from './errors';

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

interface IMainOverlayData {
    angle: IAngle;
    arcDataName: string;
    arcTransformData: ITransformable;
    buttonDataName: string;
    buttonPathArcDataName?: string;
    buttonTransformData: ITransformable;
    mainButtonIconUrl: string;
    modes: IMode[];

    handleMode?: HandleMode;
    middleAngle?: IAngle;
};

const buttonArcPathStartAngle = toRadians(270);
const buttonTransformOrder: TransformType[] = [
    TransformType.ROTATE,
    TransformType.TRANSLATE,
    TransformType.ROTATE
];
const buttonsTransform = new SvgTransformString([
        TransformType.ROTATE,
        TransformType.TRANSLATE,
        TransformType.ROTATE
    ]);
const arcTransformService: TransformType[] = [
    TransformType.ROTATE
];

/**
 * This should be moved out of here into the UI.
 */
export class SvgHandles implements ISvgHandles, IDrawable {
    //#region Fields

    private animationDuration: number;
    private canvas: SvgCanvas;
    private center: ICoords2D
    private defaultStrokeWidth: number;
    private hightlightTransforms: ITransformable;
    private lastUsedMode: HandleMode;
    private minHandlesRadius: number;
    private selectedElTransform: ITransformable;
    private selectedObjects: SvgItem[];
    private startAngleOffset: number;
    private transformData: ITransformable;
    private transformService: SvgGeometryService;

    private _collapseButtons: boolean;
    private _expandedMode?: IMainOverlayData;
    private _lastSelectedSection: number;
    private _mode: HandleMode;
    private _radius: number;

    private container: SVGGraphicsElement;
    private element: SVGGElement;
    private handlesContainerTransforms: ITransformable;
    private highlightPathEl: SVGPathElement;
    
    private htmlHandlesContainer: HTMLElement;
    private arcsContainer: SVGElement;
    private modeContainer: SVGGElement;
    private subModeContainer: SVGGElement;
    private selectionEl: SVGCircleElement;

    private colorHandlesOverlay: HandlesColorsOverlay;
    private rotationOverlay: HandlesRotationOverlay;
    private scaleOverlay: HandlesScaleOverlay;

    private readonly data: IMainOverlayData[] = [
        {
            angle: Angle.fromDegrees(45),
            arcDataName: Names.Handles.SubElements.ArcsContainer.SubElements.ColorsArc.DATA_NAME,
            arcTransformData: new SvgTransformString(arcTransformService),
            buttonDataName: Names.Handles.SubElements.ButtonsContainer.SubElements.ColorsBtn.DATA_NAME,
            mainButtonIconUrl: "assets/color-bttn.svg",
            modes: [
                { 
                    label: "Colors (all)", 
                    selected: true, 
                    iconUrl: "assets/color-submode-all-bttn.svg"
                },
                { 
                    label: "Colors (non-empty)", 
                    selected: false, 
                    iconUrl: "assets/color-submode-non-empty-bttn.svg"
                },
                { 
                    label: "Colors (unique)", 
                    selected: false, 
                    iconUrl: "assets/color-submode-unique-bttn.svg"
                }
            ],
            buttonPathArcDataName: Names.Handles.SubElements.ButtonArcPathsContainer.SubElements.ColorsBtnArcPath.DATA_NAME,
            buttonTransformData: new SvgTransformString(buttonTransformOrder),
            handleMode: HandleMode.COLORS
        },
        {
            angle: Angle.fromDegrees(45),
            arcDataName: Names.Handles.SubElements.ArcsContainer.SubElements.EditArc.DATA_NAME,
            arcTransformData: new SvgTransformString(arcTransformService),
            buttonDataName: Names.Handles.SubElements.ButtonsContainer.SubElements.EditBtn.DATA_NAME,
            mainButtonIconUrl: "assets/edit-bttn.svg",
            modes: [{ label: "Edit", selected: true, iconUrl: "" }],
            buttonPathArcDataName: Names.Handles.SubElements.ButtonArcPathsContainer.SubElements.EditBtnArcPath.DATA_NAME,
            buttonTransformData: new SvgTransformString(buttonTransformOrder),
            handleMode: HandleMode.EDIT
        },
        {
            angle: Angle.fromDegrees(90),
            arcDataName: Names.Handles.SubElements.ArcsContainer.SubElements.FillArc.DATA_NAME,
            arcTransformData: new SvgTransformString(arcTransformService),
            buttonDataName: "",
            mainButtonIconUrl: "",
            modes: [],
            buttonTransformData: new SvgTransformString(buttonTransformOrder),
            handleMode: HandleMode.SELECT_MODE
        },
        {
            angle: Angle.fromDegrees(22.5),
            arcDataName: Names.Handles.SubElements.ArcsContainer.SubElements.DeleteArc.DATA_NAME,
            arcTransformData: new SvgTransformString(arcTransformService),
            buttonDataName: Names.Handles.SubElements.ButtonsContainer.SubElements.DeleteBtn.DATA_NAME,
            mainButtonIconUrl: "assets/delete-bttn.svg",
            modes: [{ label: "Delete", selected: true, iconUrl: "" }],
            buttonPathArcDataName: Names.Handles.SubElements.ButtonArcPathsContainer.SubElements.DeleteBtnArcPath.DATA_NAME,
            buttonTransformData: new SvgTransformString(buttonTransformOrder),
            handleMode: HandleMode.DELETE
        },
        {
            angle: Angle.fromDegrees(22.5),
            arcDataName: Names.Handles.SubElements.ArcsContainer.SubElements.PanArc.DATA_NAME,
            arcTransformData: new SvgTransformString(arcTransformService),
            buttonDataName: Names.Handles.SubElements.ButtonsContainer.SubElements.PanBtn.DATA_NAME,
            mainButtonIconUrl: "assets/pan-bttn.svg",
            modes: [{ label: "Pan", selected: true, iconUrl: "" }],
            buttonPathArcDataName: Names.Handles.SubElements.ButtonArcPathsContainer.SubElements.PanBtnArcPath.DATA_NAME,
            buttonTransformData: new SvgTransformString(buttonTransformOrder),
            handleMode: HandleMode.PAN
        },
        {
            angle: Angle.fromDegrees(22.5),
            arcDataName: Names.Handles.SubElements.ArcsContainer.SubElements.RotateArc.DATA_NAME,
            arcTransformData: new SvgTransformString(arcTransformService),
            buttonDataName: Names.Handles.SubElements.ButtonsContainer.SubElements.RotateBtn.DATA_NAME,
            mainButtonIconUrl: "assets/rotate-bttn.svg",
            modes: [
                { label: "Rotate Collectivley", selected: true, iconUrl: "" }, 
                { label: "Rotate Individually", selected: false, iconUrl: "" },
                { label: "Test", selected: false, iconUrl: "" }
            ],
            buttonPathArcDataName: Names.Handles.SubElements.ButtonArcPathsContainer.SubElements.RotateBtnArcPath.DATA_NAME,
            buttonTransformData: new SvgTransformString(buttonTransformOrder),
            handleMode: HandleMode.ROTATE
        },
        {
            angle: Angle.fromDegrees(22.5),
            arcDataName: Names.Handles.SubElements.ArcsContainer.SubElements.ScaleArc.DATA_NAME,
            arcTransformData: new SvgTransformString(arcTransformService),
            buttonDataName: Names.Handles.SubElements.ButtonsContainer.SubElements.ScaleBtn.DATA_NAME,
            mainButtonIconUrl: "assets/scale-bttn.svg",
            modes: [{ label: "Scale", selected: true, iconUrl: "" }],
            buttonPathArcDataName: Names.Handles.SubElements.ButtonArcPathsContainer.SubElements.ScaleBtnArcPath.DATA_NAME,
            buttonTransformData: new SvgTransformString(buttonTransformOrder),
            handleMode: HandleMode.SCALE
        },
        {
            angle: Angle.fromDegrees(90),
            arcDataName: Names.Handles.SubElements.ArcsContainer.SubElements.FillArc.DATA_NAME,
            arcTransformData: new SvgTransformString(arcTransformService),
            buttonDataName: Names.Handles.SubElements.ButtonsContainer.SubElements.ToggleControlsBtn.DATA_NAME,
            mainButtonIconUrl: "",
            modes: [{ label: "Toggle", selected: true, iconUrl: "" }],
            buttonTransformData: new SvgTransformString(buttonTransformOrder),
            handleMode: HandleMode.SCALE
        }
    ];

    private readonly buttonsData: IMainOverlayData[];

    //#endregion

    //#region Ctor

    constructor(editor: SvgCanvas) {
        this.animationDuration = 200;
        this.buttonsData = this.data
            .filter(d => d.modes.length > 0);
        this.canvas = editor;
        this.center = { x: 0, y: 0};
        this.container = editor.canvasEl;
        this.defaultStrokeWidth = 4;
        this.lastUsedMode = HandleMode.PAN;
        this.selectedObjects = [];
        this.transformService = SvgGeometryServiceSingleton;
        this.minHandlesRadius = 120;
        this.selectedElTransform = SvgTransformString.CreateDefaultTransform();
        this.startAngleOffset = 45 + 180;
        this.transformData = SvgTransformString.CreateDefaultTransform();

        this._collapseButtons = true;
        this._lastSelectedSection = 0;
        this._mode = HandleMode.PAN;
        this._radius = 100;

        // Create the html handles section
        this.htmlHandlesContainer = <HTMLElement>document
            .createElement("div");
        this.htmlHandlesContainer
            .setAttribute("data-name", "handles-html-container");
        this.canvas.canvasEl.insertAdjacentElement("afterend",
            this.htmlHandlesContainer);
        
        // FIXME: Change this back to false
        ActivatableServiceSingleton.register(this.htmlHandlesContainer, false);

        // Create the highlight rect
        this.hightlightTransforms = new SvgTransformString([
            TransformType.TRANSLATE
        ]);
        this.highlightPathEl = 
            createSvgEl<SVGPathElement>("path", this.container);
        d3.select(this.highlightPathEl)
            .attr("id", uniqid())
            .attr("data-name", 
                Names.Handles.SubElements.HightlightRect.DATA_NAME)
        d3.select(this.highlightPathEl)
            .attr("transform", this.hightlightTransforms.toTransformString());
        ActivatableServiceSingleton.register(this.highlightPathEl);

        // Create handles container
        this.handlesContainerTransforms = new SvgTransformString([
            TransformType.TRANSLATE
        ]);
        this.element = 
            createSvgEl<SVGGElement>("g", this.container);
        d3.select(this.element)
            .attr("id", uniqid())
            .attr("data-name", Names.Handles.DATA_NAME)
            .attr("transform", this.handlesContainerTransforms
                .toTransformString())
            .classed("collapsed", true);
        ActivatableServiceSingleton.register(this.element, false);

        // Create main handles overlay
        let mainHandleContainer =
            createSvgEl<SVGGElement>("g", this.element);
        d3.select(mainHandleContainer)
            .attr("id", uniqid())
            .attr("data-name", "handles-main-section");

        this.selectionEl =
            createSvgEl<SVGCircleElement>("circle", mainHandleContainer);
        d3.select(this.selectionEl)
            .data([this.selectedElTransform])
            .attr("id", uniqid())
            .attr("data-name",
                Names.Handles.SubElements.HightlightSection.DATA_NAME)
            .attr("r", this.radius)
            .attr("cx", 0)
            .attr("cy", 0)
            .attr("transform", function(d) {
                return d.toTransformString();
            });
        
        this.arcsContainer =
            createSvgEl<SVGGElement>("g", mainHandleContainer);
        d3.select(this.arcsContainer)
            .attr("id", uniqid())
            .attr("data-name",
                Names.Handles.SubElements.ArcsContainer.DATA_NAME)
        
        this.modeContainer =
            createSvgEl<SVGGElement>("g", mainHandleContainer);
        d3.select(this.modeContainer)
            .attr("id", uniqid())
            .attr("data-name",
                Names.Handles.SubElements.ButtonArcPathsContainer.DATA_NAME);
        
        this.subModeContainer =
            createSvgEl<SVGGElement>("g", mainHandleContainer);
        d3.select(this.subModeContainer)
            .attr("id", uniqid())
            .attr("data-name", "sub-mode-container");
        // this.mainHandlesOverlay = new HandlesMain(mainHandleContainer,
        //     this.canvas);
        // this.mainHandlesOverlay.onDeleteClickedHandlers
        //     .push(this.onDeleteClicked.bind(this));
        // this.mainHandlesOverlay.onRotationEventHandlers
        //     .push(this.onRotation.bind(this));
        // this.mainHandlesOverlay.draw();
        // this.mainHandlesOverlay.update();

        // Create colors handles overlay
        let colorsHandleContainer =
            createSvgEl<SVGGElement>("g", this.element);
        this.colorHandlesOverlay = new HandlesColorsOverlay(
            colorsHandleContainer,
            this.canvas,
            this.htmlHandlesContainer);
        this.colorHandlesOverlay.draw();
        this.colorHandlesOverlay.update();
        ActivatableServiceSingleton.register(
            this.colorHandlesOverlay.getElement(), false);

        // Create rotation handles overlay
        let rotationOverlayContainer =
            createSvgEl<SVGGElement>("g", this.element);
        this.rotationOverlay = new HandlesRotationOverlay(
            rotationOverlayContainer);
        this.rotationOverlay.draw();
        this.rotationOverlay.update();
        ActivatableServiceSingleton.register(
            this.rotationOverlay.getElement(), false);

        // Create scale handles overlay
        let scaleOverlayContainer =
            createSvgEl<SVGGElement>("g", this.element);
        this.scaleOverlay = new HandlesScaleOverlay(scaleOverlayContainer);
        this.scaleOverlay.draw();
        this.scaleOverlay.update();
        ActivatableServiceSingleton.register(
            this.scaleOverlay.getElement(), false);

        this.colorHandlesOverlay.draw();
        this.rotationOverlay.draw();
        this.scaleOverlay.draw();

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
        this.element.style.filter = this.canvas.defs
            .getUrlOfSectionItem("shadow-1", "shadows");
    }

    //#endregion

    //#region Properties

    public get collapseButtons() {
        return this._collapseButtons;
    }

    public set collapseButtons(value: boolean) {
        if (value != this.collapseButtons) {

            // Make sure the expanded mode is collapsed.
            this.expandedMode = undefined;

            // Update the class on the container.
            if (value) {
                this.element.classList.add("collapsed");
            } else {
                this.element.classList.remove("collapsed");
            }
            this._collapseButtons = value;
            this.updateButtonsAndArcs();
        }
    }

    private get expandedMode() {
        return this._expandedMode;
    }

    private set expandedMode(value: IMainOverlayData|undefined) {

        // Contract the old mode.
        if (this._expandedMode != undefined) {
            this.contractMode(this._expandedMode)
        }
        
        // Expand the new mode IF it's not the same as the old node.
        if (value != undefined && value != this._expandedMode) {
            this.expandMode(value);
        }

        // If the value and old value are equal, set the expanded mode to undefined.
        if (value == this._expandedMode) {
            this._expandedMode = undefined;
        } else {

            // Assign new value
            this._expandedMode = value;
        }
    }

    public get mode(): HandleMode {
        return this._mode;
    }

    public set mode(value: HandleMode) {
        let oldMode = this.mode;
        
        // The lastUsedMode cannot be the select mode.
        if (oldMode != HandleMode.SELECT_MODE) {
            this.lastUsedMode = oldMode;
        }

        if (oldMode == HandleMode.SELECT_MODE
            && value == HandleMode.SELECT_MODE)
        {
            this._mode = this.lastUsedMode;
        } else {
            this._mode = value;
        }
        
        this.modeChanged(this.lastUsedMode, this.mode);
        this.collapseButtons = !this.collapseButtons;
    }

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

    public get radius() {
        return this._radius
    }

    public set radius(value: number) {
        if (value < this.minHandlesRadius) {
            this._radius = this.minHandlesRadius;
        } else {
            this._radius = value;
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
                d3.select(self.element)
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
        d3.select(this.container)
            .on("click", function({}, i: number) {
                
                // Check if any items intersect the point
                let { x, y } = d3.event;
                let transformedCoords = self.transformService
                    .convertScreenCoordsToSvgCoords({x,y}, <any>self.container);
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
        d3.select(this.container)
            .on("click", null);
    }

    //#endregion

    private expandMode(mode: IMainOverlayData): void {
        d3.select(this.modeContainer)
            .selectAll(`g[data-name]:not([data-name='${mode.buttonDataName}']) > g[data-name='main-button-container']`)
            .classed("opacity-half", true);
        d3.select(`[data-name="sub-mode-container"] > [data-for='${mode.buttonDataName}']`)
            .classed("expanded", true);
    }

    private contractMode(mode: IMainOverlayData): void {
        d3.select(this.modeContainer)
            .selectAll(`g[data-name]:not([data-name='${mode.buttonDataName}']) > g[data-name='main-button-container']`)
            .classed("opacity-half", false);
        d3.select(`[data-name="sub-mode-container"] > [data-for='${mode.buttonDataName}']`)
            .classed("expanded", false);
    }

    private updateMainHandles(): void {
        let self = this;

        // Update the highlight element
        d3.select(this.selectionEl)
            .attr("r", self.radius - (self.defaultStrokeWidth/2));
        
        // Draw arcs
        let pieData = d3.pie<IMainOverlayData>()
            .startAngle(toRadians(self.startAngleOffset))
            .endAngle(toRadians(self.startAngleOffset - 360))
            .value(function(d) { return d.angle.asDegrees(); })
            .sortValues(function(a: number, b: number) {
                return a;
            })(this.data);

        d3.select(this.arcsContainer)
            .selectAll("path")
            .data(pieData)
            .attr("d", function(d) {
                let w = self.defaultStrokeWidth;

                return d3.arc()({
                    innerRadius: self._radius,
                    outerRadius: self._radius - w,
                    startAngle: d.startAngle,
                    endAngle: d.endAngle
                });
            });

        // Update buttons
        d3.select(this.modeContainer)
            .selectAll<SVGGElement, IMainOverlayData>("g[data-name='handles-btn-path-container'] > g")
            .data(this.buttonsData)
            .attr("transform", function(d) {
                d.buttonTransformData.setTranslate({ x: 0, y: self.radius })
                return d.buttonTransformData.toTransformString();
            });
    }

    private modeChanged(oldMode: HandleMode, newMode: HandleMode): void {
        console.log(`Mode changed to ${this.mode}`);
        let oldName: string = "";
        let newName: string = "";

        switch(oldMode) {
            case HandleMode.SELECT_MODE:
                oldName = Names.Handles.SubElements.ButtonsContainer.SubElements.ToggleControlsBtn.DATA_NAME;
                break;
            case HandleMode.COLORS:
                ActivatableServiceSingleton.deactivate(this.colorHandlesOverlay.getElement());
                oldName = Names.Handles.SubElements.ButtonsContainer.SubElements.ColorsBtn.DATA_NAME;
                break;
            case HandleMode.DELETE:
                oldName = Names.Handles.SubElements.ButtonsContainer.SubElements.DeleteBtn.DATA_NAME;
                break;
            case HandleMode.EDIT:
                // ActivatableServiceSingleton.deactivate(this.handlesEdi)
                oldName = Names.Handles.SubElements.ButtonsContainer.SubElements.EditBtn.DATA_NAME;
                break;
            case HandleMode.ROTATE:
                ActivatableServiceSingleton.deactivate(this.rotationOverlay.getElement());
                oldName = Names.Handles.SubElements.ButtonsContainer.SubElements.RotateBtn.DATA_NAME;
                break;
            case HandleMode.SCALE:
                ActivatableServiceSingleton.deactivate(this.scaleOverlay.getElement());
                oldName = Names.Handles.SubElements.ButtonsContainer.SubElements.ScaleBtn.DATA_NAME;
                break;
            case HandleMode.PAN:
            default:
                oldName = Names.Handles.SubElements.ButtonsContainer.SubElements.PanBtn.DATA_NAME;
                break;
        }

        switch(newMode) {
            case HandleMode.SELECT_MODE:
                newName = Names.Handles.SubElements.ButtonsContainer.SubElements.ToggleControlsBtn.DATA_NAME;
                break;
            case HandleMode.COLORS:
                ActivatableServiceSingleton.activate(this.colorHandlesOverlay.getElement());
                newName = Names.Handles.SubElements.ButtonsContainer.SubElements.ColorsBtn.DATA_NAME;
                this.colorHandlesOverlay.radius = this.radius;
                this.data.find(d => {
                    if (d.buttonDataName == Names.Handles.SubElements.ButtonsContainer.SubElements.ColorsBtn.DATA_NAME) {
                        let selectedMode = d.modes.find(_d => _d.selected);
                        console.log(selectedMode);
                        if (selectedMode != undefined) {
                            switch (selectedMode.label) {
                                case "Colors (all)":
                                    this.colorHandlesOverlay.mode = HandlesColorMode.ALL;
                                    break;
                                case "Colors (non-empty)":
                                    this.colorHandlesOverlay.mode = HandlesColorMode.MUST_HAVE_FILL_OR_STROKE;
                                    break;
                                case "Colors (unique)":
                                    this.colorHandlesOverlay.mode = HandlesColorMode.UNIQUE_COLORS_ONLY;
                                    break;
                                default:
                                    break;
                            }
                        }
                        return true;
                    } else {
                        return false;
                    }
                });
                this.colorHandlesOverlay.update();
                break;
            case HandleMode.EDIT:
                newName = Names.Handles.SubElements.ButtonsContainer.SubElements.EditBtn.DATA_NAME;
                break;
            case HandleMode.ROTATE:
                this.rotationOverlay.radius = this.radius;
                this.rotationOverlay.update();
                ActivatableServiceSingleton.activate(this.rotationOverlay.getElement());
                newName = Names.Handles.SubElements.ButtonsContainer.SubElements.RotateBtn.DATA_NAME;
                break;
            case HandleMode.SCALE:
                ActivatableServiceSingleton.activate(this.scaleOverlay.getElement());
                newName = Names.Handles.SubElements.ButtonsContainer.SubElements.ScaleBtn.DATA_NAME;
                break;
            // Delete should switch to Pan mode, it doesn't make much sense to
            // add object and have them be in the delete mode.
            case HandleMode.DELETE: 
            case HandleMode.PAN:
            default:
                newName = Names.Handles.SubElements.ButtonsContainer.SubElements.PanBtn.DATA_NAME;
                break;
        }
        
        // Only remove the old modes active class if the new mode isn't the
        // select mode.
        if (newMode != HandleMode.SELECT_MODE) {
            d3.select(this.modeContainer)
                .selectAll(`*.active:not([data-name='${newName}'])`)
                .classed("active", false);
        }

        d3.select(this.modeContainer)
            .select(`*[data-name='${newName}']`)
            .classed("active", true);
    }

    private updateButtonsAndArcs() {
        let self = this;

        // Update arcs.
        d3.select(this.arcsContainer)
            .selectAll<SVGPathElement, IMainOverlayData>("path")
            .data(this.data)
            .call(arcOpacity)
            .call(arcTransforms);

        /**
         * Mode heirarchy
         * - Mode container (per mode)
         *  - Main button group
         *      - Main circle
         *  - Concentric polygon group
         *  - Sub-modes group
         */

        // Draw main buttons.
        d3.select(this.modeContainer)
            .selectAll<SVGGElement, IMainOverlayData>("g[data-name='handles-btn-path-container'] > g[data-name]")
            .data(this.buttonsData)
            .call(bttnOpacity)
            .call(bttnTransform);

        d3.select(this.subModeContainer)
            .selectAll<SVGGElement, IMainOverlayData>("g[data-for]")
            .data(this.buttonsData)
            .call(bttnTransform);

        function arcTransforms(selection: d3.Selection<SVGPathElement, IMainOverlayData, SVGElement, {}>) {
            selection.transition("arc-transform-transition")
                .duration(self.animationDuration)
                .attrTween("transform", function(d) {
                    let middleAngle:IAngle = (d.middleAngle || Angle.fromDegrees(0));
                    let handleMode = d.handleMode;

                    // This is to get the button to rotate from the right if it's
                    // also on the right.
                    middleAngle = middleAngle.asDegrees() > 180 
                        ? Angle.fromDegrees(-1 * (360 - middleAngle.asDegrees())) 
                        : middleAngle;

                    // How much to move the button.
                    let angleIncrement = 1 / middleAngle.asDegrees();

                    // Update the radius
                    d.arcTransformData.setRotation({ a: 0 });

                    // Return a function where the argument (t) is a value in the
                    // range [0-1].
                    if (self.collapseButtons) {
                        return function(t) {
                            d.arcTransformData.setRotation({
                                a: -1 * t * middleAngle.asDegrees() 
                            }, 0);
                            return d.arcTransformData.toTransformString();
                        }
                    } else {
                        return function(t) {
                            let offset = -1 * (middleAngle.asDegrees() 
                                - (t * middleAngle.asDegrees()));
                            d.arcTransformData.setRotation({ a: offset }, 0);
                            return d.arcTransformData.toTransformString();
                        }
                    }
                });
        }

        function arcOpacity(selection: d3.Selection<SVGPathElement, IMainOverlayData, SVGElement, {}>) {
            selection.transition("arc-opacity-transition")
                .duration(self.animationDuration)
                .style("opacity", function(d) {
                    return self.collapseButtons ? 0 : 1;
                })
                .on("start", function(d) {
                    this.style.display = "unset";
                })
                .transition()
                .style("display", function(d) {
                    return self.collapseButtons ? "none" : "unset";
                });
        }
        
        function bttnTransform(selection: d3.Selection<SVGGElement, IMainOverlayData, SVGGElement, {}>) {
            selection.transition("button-transform-transition")
                .duration(self.animationDuration)
                .attrTween("transform", function(d) {
                    let middleAngle = (d.middleAngle || Angle.fromDegrees(0));
                    let handleMode = d.handleMode;

                    // This is to get the button to rotate from the right if it's
                    // also on the right.
                    middleAngle = middleAngle.asDegrees() > 180 
                        ? Angle.fromDegrees(-1 * (360 - middleAngle.asDegrees())) 
                        : middleAngle;

                    // How much to move the button.
                    let angleIncrement = 1 / middleAngle.asDegrees();

                    // Update the radius
                    d.buttonTransformData.setTranslate({ x: 0, y: self.radius });

                    // Return a function where the argument (t) is a value in the
                    // range [0-1].
                    if (self.collapseButtons) {
                        return function(t) {
                            let offset = middleAngle.asDegrees() 
                                - (t * middleAngle.asDegrees());
                            d.buttonTransformData.setRotation({ a: offset }, 0);
                            d.buttonTransformData.setRotation({ a: -1 * offset }, 1);
                            return d.buttonTransformData.toTransformString();
                        }
                    } else {
                        return function(t) {
                            d.buttonTransformData.setRotation({ 
                                a: t * middleAngle.asDegrees() 
                            }, 0);
                            d.buttonTransformData.setRotation({ 
                                a: t * -1 * middleAngle.asDegrees() 
                            }, 1);
                            return d.buttonTransformData.toTransformString();
                        }
                    }
                });
        }

        function bttnOpacity(selection: d3.Selection<SVGGElement, IMainOverlayData, SVGGElement, {}>) {            
            selection.transition("button-opacity-transition")
                .duration(self.animationDuration)
                .style("opacity", function(d) {
                    let currentMode = d.modes.find(m => {
                        return m.selected && (d.handleMode == self.mode)
                    });

                    if (d.buttonDataName == Names.Handles.SubElements.ButtonsContainer.SubElements.ToggleControlsBtn.DATA_NAME) {
                        return 1;
                    } else if (currentMode) {
                        return 1;
                    } else {
                        return self.collapseButtons ? 0 : 1;
                    }
                })
                .on("start", function(d) {
                    this.style.display = "unset";
                })
                .transition()
                .style("display", function(d) {
                    let currentMode = d.modes.find(m => {
                        return m.selected && (d.handleMode == self.mode)
                    });

                    if (d.buttonDataName == Names.Handles.SubElements.ButtonsContainer.SubElements.ToggleControlsBtn.DATA_NAME) {
                        return "unset";
                    } else if (currentMode) {
                        return "unset";
                    } else {
                        return self.collapseButtons ? "none" : "unset";
                    }
                });
        }
    }

    /**
     * Will hide/show the handles.
     * @param show 
     */
    private displayHandles(): void {
        if (this.selectedObjects.length == 0) {
            ActivatableServiceSingleton.deactivate(this.element);
        } else {
            ActivatableServiceSingleton.activate(this.element);
            this.drawHandles();
            this.updateHandlesPosition();
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
        d3.select(this.element)
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

        this.radius = hyp;
        this.center = {
            x: bbox.x + (bbox.width / 2),
            y: bbox.y + (bbox.height / 2)
        }
        this.updateMainHandles();
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

    public draw(): void {
        let self = this;
        this.container.appendChild(this.element);
        self.collapseButtons = true;

        let rotateData = self.buttonsData
            .find(d => d.arcDataName == Names.Handles.SubElements.ArcsContainer
                .SubElements.RotateArc.DATA_NAME);
        let colorData = self.buttonsData.find(d => d.arcDataName == Names
            .Handles.SubElements.ArcsContainer.SubElements.ColorsArc.DATA_NAME);

        // Update the highlight element
        d3.select(this.selectionEl)
            .attr("r", self.radius - (self.defaultStrokeWidth/2));
        
        // Draw arcs
        let pieData = d3.pie<IMainOverlayData>()
            .startAngle(toRadians(self.startAngleOffset))
            .endAngle(toRadians(self.startAngleOffset - 360))
            .value(function(d) { return d.angle.asDegrees(); })
            .sortValues(function(a: number, b: number) {
                return a;
            })(this.data);

        d3.select(this.arcsContainer)
            .selectAll("path")
            .data(pieData)
            .enter()
            .append("path")
            .attr("id", () => uniqid())
            .attr("data-name", d => d.data.arcDataName)
            .attr("transform", d => d.data.arcTransformData.toTransformString());

        d3.select(this.modeContainer)
            .selectAll<SVGGElement, IMainOverlayData>("g")
            .data(this.buttonsData)
            .enter()
            .append<SVGGElement>("g")
            .attr("id", () => uniqid())
            .attr("data-name", function(d) { return d.buttonDataName })
            .attr("transform", function(d) {
                d.buttonTransformData.setTranslate({x: 0, y: self.radius}, 0);

                if (self.collapseButtons) {
                    d.buttonTransformData.setRotation({a: 0}, 0);
                    d.buttonTransformData.setRotation({a: 0}, 1);
                } else {
                    d.buttonTransformData.setRotation({
                        a: (d.middleAngle 
                            ? d.middleAngle.asDegrees() 
                            : 0)
                        }, 0);
                    d.buttonTransformData.setRotation({
                        a: -1 * (d.middleAngle 
                            ? d.middleAngle.asDegrees()
                            : 0)
                        }, 1);
                }

                return d.buttonTransformData.toTransformString();
            })
            .classed(Names.Handles.BTN_HANDLE_CLASS, true)
            .each(function(d) {

                // Draw the arcs
                let pieSlice = pieData.find(p => p.data.buttonDataName == d.buttonDataName);

                // Check that the slice exists and is NOT the toggle button
                if (pieSlice == undefined)
                {
                    return "";
                }

                // Find the angle halfway between the start and end angles
                d.middleAngle = Angle.fromDegrees(180 + toDegrees(pieSlice.startAngle 
                    + ((pieSlice.endAngle - pieSlice.startAngle) / 2)));

                d.buttonTransformData.setRotation({ 
                    a: d.middleAngle.asDegrees()
                });
                d.buttonTransformData.setRotation({ 
                    a: -1 * d.middleAngle.asDegrees() 
                }, 2)
                d.buttonTransformData.setTranslate({ x: 0, y: self.radius })
                d3.select(this)
                    .attr("transform", d.buttonTransformData
                        .toTransformString());
                self.update();

                // Draw the modes
                let modeContainer = d3.select(this);

                // First create each container
                // 1) Main button container
                // 2) Concentric container
                // 3) Submodes container
                let mainButtonContainer = modeContainer
                    .append<SVGGElement>("g")
                    .data([d.handleMode])
                    .attr("data-name", "main-button-container");
                let buttonOverlayContainer = d3.select(self.subModeContainer)
                    .append<SVGGElement>("g")
                    .attr("data-for", d.buttonDataName)
                let concentricContainer = buttonOverlayContainer
                    .append<SVGGElement>("g")
                    .attr("data-name", "concentric-container");
                let submodesContainer = buttonOverlayContainer
                    .append<SVGGElement>("g")
                    .attr("data-name", "submodes-button-container");

                // Append main button background
                mainButtonContainer
                    .append<SVGCircleElement>("circle")
                    .attr("r", 20)
                    .attr("cx", 0)
                    .attr("cy", 0)
                    .classed("mode-button-bg", true);

                // Append main button
                mainButtonContainer
                    .append<SVGCircleElement>("circle")
                    .attr("r", 16)
                    .attr("cx", 0)
                    .attr("cy", 0)
                    .attr("data-name", d.buttonDataName)
                    .classed("mode-button", true);

                // Append image
                mainButtonContainer
                    .append<SVGImageElement>("image")
                    .attr("x", "-16px")
                    .attr("y", "-16px")
                    .attr("width", "32px")
                    .attr("height", "32px")
                    // .attr("preserveAspectRatio", true)
                    .attr("href", d.mainButtonIconUrl);

                // Draw concentric polygons/circles IF there are sub modes.
                if (d.modes.length > 1) {

                    // Multiple sub-modes
                    // Calculate how many polygons are needed for each mode.
                    // let concentricPolygons = self.cache
                    //     .get<Polygon[]>(d.buttonDataName,
                    //         () => {
                    //             return calculateConcentricPolygons(
                    //                 d.modes.length, 20, 60, d.middleAngle);
                    //         });
                    let concentricPolygons = calcConcentricPolygons({
                        numberOfVerticies: d.modes.length, 
                        sideLength: 20, 
                        minCircumRadius: 50,
                        keepVerticiesEquidistant: true
                        // startAngle: d.middleAngle
                    });
                    let verticies: ICoords2D[] = [];
                    concentricPolygons.map(p => {
                        verticies = verticies.concat(p.verticies);
                    });

                    // Throw error if polygons is undefined.
                    if (concentricPolygons == undefined) {
                        throw new InternalError();
                    }

                    // Draw concentrics
                    concentricContainer
                        .selectAll<SVGCircleElement, {}>("circle")
                        .data(concentricPolygons)
                        .enter()
                        .append<SVGCircleElement>("circle")
                        .attr("r", function(d) { return d.circumRadius })
                        .classed("concentric-submode-ring", true);

                    // let concentricPolygonsElsV2 = concentricContainer
                    //     .selectAll<SVGPolygonElement, {}>("polygon")
                    //     .data(concentricPolygons)
                    //     .enter()
                    //     .append<SVGPolygonElement>("polygon")
                    //     .attr("points", function(d) {
                    //         return coordsToPointsStr(d.verticies);
                    //     })
                    //     .classed("concentric-submode-ring", true);

                    // Draw each sub-mode button if available
                    submodesContainer
                        .selectAll<SVGGElement, {}>("g")
                        .data(d.modes)
                        .enter()
                        .append<SVGGElement>("g")
                        .attr("data-mode", function(_d) { return _d.label })
                        .attr("transform", function(_d, _i) {

                            // Check that there is a placement for this
                            // submode button.
                            if (_i >= verticies.length) {
                                return "";
                            } else {
                                let vertex = verticies[_i];
                                return `translate(${vertex.x},${vertex.y})`;
                            }
                        })
                        .classed("selected", function(d) { return d.selected })
                        .each(function(d) {
                            let subModeButtonContainer = d3.select(this);

                            // Append circle background
                            subModeButtonContainer
                                .append<SVGCircleElement>("circle")
                                .attr("r", 16)
                                .attr("cx", 0)
                                .attr("cy", 0)
                                .classed("mode-button", true);

                            // Append image
                            subModeButtonContainer
                                .append<SVGImageElement>("image")
                                .attr("href", function() { return d.iconUrl; })
                                .attr("x", -15)
                                .attr("y", -15)
                                .attr("width", 30)
                                .attr("height", 30);
                        });

                    // Add event listener to the main button to display the
                    // sub-modes.
                    mainButtonContainer.on("click", function(_d, _i) {
                        console.log(`Toggled display of sub-modes of mode ${d.buttonDataName}`);
                        self.expandedMode = d;
                        d3.event.stopPropagation();
                    });
                }
            });

        // Add event listeners to the buttons
        d3.select(this.modeContainer)
            .select(`[data-name='${Names.Handles.SubElements.ButtonsContainer.SubElements.DeleteBtn.DATA_NAME}']`)
            .on("click", function() {
                self.mode = HandleMode.DELETE;
                self.onDeleteClicked();
            });

        d3.select(this.modeContainer)
            .select<Element>(`[data-name='${Names.Handles.SubElements.ButtonsContainer.SubElements.ToggleControlsBtn.DATA_NAME}']`)
            .on("click", function() {
                self.mode = HandleMode.SELECT_MODE;
                console.log(`Toggled collapse buttons: ${self.collapseButtons}`);
                d3.event.stopPropagation();
            });

        d3.select(this.subModeContainer)
            .selectAll<SVGGElement, {}>(`[data-for='${Names.Handles.SubElements.ButtonsContainer.SubElements.ColorsBtn.DATA_NAME}'] *[data-mode]`)
            .on("click", function() {

                if (colorData == undefined) {
                    throw new InternalError();
                }

                let thisDataMode = this.getAttribute("data-mode");
                colorData.modes.map(mode => {
                    mode.selected = mode.label == thisDataMode;
                    d3.select(`[data-mode='${mode.label}']`)
                        .classed("selected", mode.selected);
                });

                self.mode = HandleMode.COLORS;
                d3.event.stopPropagation();
            });

        d3.select(this.modeContainer)
            .select(`[data-name='${Names.Handles.SubElements.ButtonsContainer.SubElements.EditBtn.DATA_NAME}']`)
            .on("click", function() {
                self.mode = HandleMode.EDIT;
                d3.event.stopPropagation();
            });

        d3.select(this.modeContainer)
            .select(`[data-name='${Names.Handles.SubElements.ButtonsContainer.SubElements.PanBtn.DATA_NAME}']`)
            .on("click", function() {
                self.mode = HandleMode.PAN;
                d3.event.stopPropagation();
            });

        d3.select(this.modeContainer)
            .selectAll<Element, {}>(`[data-name='${Names.Handles.SubElements.ButtonsContainer.SubElements.RotateBtn.DATA_NAME}'] > *[data-mode]`)
            .on("click", function() {

                if (rotateData == undefined) {
                    throw new InternalError();
                }

                let thisDataMode = this.getAttribute("data-mode");
                rotateData.modes.map(mode => {
                    mode.selected = mode.label == thisDataMode;
                });

                self.mode = HandleMode.ROTATE;
                d3.event.stopPropagation();
            });

        d3.select(this.modeContainer)
            .select(`[data-name='${Names.Handles.SubElements.ButtonsContainer.SubElements.ScaleBtn.DATA_NAME}']`)
            .on("click", function() {
                self.mode = HandleMode.SCALE;
                d3.event.stopPropagation();
            });

        // this.colorsOverlay.draw();
        // this.rotationOverlay.draw();
        // this.scaleOverlay.draw();
        // this.rotationOverlay.onRotation = this.onRotationEventHandlers;
        this.modeChanged(HandleMode.DELETE, HandleMode.PAN);
        this.updateButtonsAndArcs();
    }

    public update(): void {
        this.updateMainHandles();

        switch (this.mode) {
            case HandleMode.COLORS:
                this.colorHandlesOverlay.radius = this._radius;
                this.colorHandlesOverlay.update();
                break;

            case HandleMode.ROTATE:
                this.rotationOverlay.radius = this._radius;
                this.rotationOverlay.update();
                break;

            case HandleMode.SCALE:
                this.scaleOverlay.update();
                break;
        }
    }

    public erase(): void {
        this.element.remove();
    }

    //#endregion
}