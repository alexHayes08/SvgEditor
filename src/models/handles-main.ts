const uniqid = require("uniqid");

import * as d3 from "d3";

import { ActivatableServiceSingleton } from "../services/activatable-service";
import { getNewPointAlongAngle, getPolygonPointsString } from "../helpers/svg-helpers";
import { HandlesColorsOverlay } from "./handles-colors";
import { HandlesRotationOverlay } from "./handles-rotation";
import { HandlesScaleOverlay } from "./handles-scale";
import { IContainer } from "./icontainer";
import { IDrawable } from './idrawable';
import { IHandleButton, IMode, HandleMode } from "./ihandle-button";
import { ISlice } from "./islice";
import { Names } from "./names";
import { toRadians, toDegrees } from "../helpers/math-helpers";
import { 
    DefaultTransformMatrix, 
    ICoords2D, 
    ITransformMatrix, 
    SvgTransformServiceSingleton,
    SvgTransformService,
    TransformType,
    ITransformable,
    SvgTransformString,
    IRotationMatrix
} from "../services/svg-transform-service";
import { InternalError } from "./errors";
import { SvgEditor } from "./svg-editor-model";

interface IMainOverlayData {
    angle: number;
    arcDataName: string;
    arcTransformData: ITransformable;
    buttonDataName: string;
    buttonPathArcDataName?: string;
    buttonTransformData: ITransformable;
    modes: IMode[],

    handleMode?: HandleMode
    middleAngle?: number;
};

const buttonArcPathStartAngle = toRadians(270);
const buttonTransformOrder: TransformType[] = [
    TransformType.ROTATE,
    TransformType.TRANSLATE,
    TransformType.ROTATE
];
const buttonsTransformService = new SvgTransformService({
    order: [
        TransformType.ROTATE,
        TransformType.TRANSLATE,
        TransformType.ROTATE
    ]
});
const arcTransformService: TransformType[] = [
    TransformType.ROTATE
];

export class HandlesMain implements IContainer, IDrawable {
    //#region Fields

    private readonly elementDataMap: WeakMap<Element, ITransformable>;
    private defaultWidth: number;
    private highlightData: ITransformable;
    private minRadius: number;
    private startAngleOffset: number;

    private _collapseButtons: boolean;
    private _mode: HandleMode;
    private _radius: number;

    private colorsOverlay: HandlesColorsOverlay;
    private rotationOverlay: HandlesRotationOverlay;
    private scaleOverlay: HandlesScaleOverlay;
    
    private highlightEl: d3.Selection<SVGCircleElement, ITransformable, null, undefined>;
    private arcsContainer: d3.Selection<SVGGElement, {}, null, undefined>;
    private buttonsContainer: d3.Selection<SVGGElement, {}, null, undefined>;
    private colorsContainer: d3.Selection<SVGGElement, {}, null, undefined>;
    private rotationOverlayContainer: d3.Selection<SVGGElement, {}, null, undefined>;
    private scaleOverlayContainer: d3.Selection<SVGGElement, {}, null, undefined>;

    public container: d3.Selection<SVGGElement, {}, null, undefined>;
    public containerNode: SVGGElement;
    public center: ICoords2D;
    public animationDuration: number;
    public readonly onDeleteClickedHandlers: Function[];
    public readonly onRotationEventHandlers: Array<(angle: IRotationMatrix) => void>;

    private readonly data: IMainOverlayData[] = [
        {
            angle: 45,
            arcDataName: Names.Handles.SubElements.ArcsContainer.SubElements.ColorsArc.DATA_NAME,
            arcTransformData: new SvgTransformString(arcTransformService),
            buttonDataName: Names.Handles.SubElements.ButtonsContainer.SubElements.ColorsBtn.DATA_NAME,
            modes: [{ label: "Colors", selected: true }],
            buttonPathArcDataName: Names.Handles.SubElements.ButtonArcPathsContainer.SubElements.ColorsBtnArcPath.DATA_NAME,
            buttonTransformData: new SvgTransformString(buttonTransformOrder),
            handleMode: HandleMode.COLORS
        },
        {
            angle: 45,
            arcDataName: Names.Handles.SubElements.ArcsContainer.SubElements.EditArc.DATA_NAME,
            arcTransformData: new SvgTransformString(arcTransformService),
            buttonDataName: Names.Handles.SubElements.ButtonsContainer.SubElements.EditBtn.DATA_NAME,
            modes: [{ label: "Edit", selected: true }],
            buttonPathArcDataName: Names.Handles.SubElements.ButtonArcPathsContainer.SubElements.EditBtnArcPath.DATA_NAME,
            buttonTransformData: new SvgTransformString(buttonTransformOrder),
            handleMode: HandleMode.COLORS
        },
        {
            angle: 90,
            arcDataName: Names.Handles.SubElements.ArcsContainer.SubElements.FillArc.DATA_NAME,
            arcTransformData: new SvgTransformString(arcTransformService),
            buttonDataName: "",
            modes: [],
            buttonTransformData: new SvgTransformString(buttonTransformOrder),
            handleMode: HandleMode.COLORS
        },
        {
            angle: 22.5,
            arcDataName: Names.Handles.SubElements.ArcsContainer.SubElements.DeleteArc.DATA_NAME,
            arcTransformData: new SvgTransformString(arcTransformService),
            buttonDataName: Names.Handles.SubElements.ButtonsContainer.SubElements.DeleteBtn.DATA_NAME,
            modes: [{ label: "Delete", selected: true }],
            buttonPathArcDataName: Names.Handles.SubElements.ButtonArcPathsContainer.SubElements.DeleteBtnArcPath.DATA_NAME,
            buttonTransformData: new SvgTransformString(buttonTransformOrder),
            handleMode: HandleMode.DELETE
        },
        {
            angle: 22.5,
            arcDataName: Names.Handles.SubElements.ArcsContainer.SubElements.PanArc.DATA_NAME,
            arcTransformData: new SvgTransformString(arcTransformService),
            buttonDataName: Names.Handles.SubElements.ButtonsContainer.SubElements.PanBtn.DATA_NAME,
            modes: [{ label: "Pan", selected: true }],
            buttonPathArcDataName: Names.Handles.SubElements.ButtonArcPathsContainer.SubElements.PanBtnArcPath.DATA_NAME,
            buttonTransformData: new SvgTransformString(buttonTransformOrder),
            handleMode: HandleMode.PAN
        },
        {
            angle: 22.5,
            arcDataName: Names.Handles.SubElements.ArcsContainer.SubElements.RotateArc.DATA_NAME,
            arcTransformData: new SvgTransformString(arcTransformService),
            buttonDataName: Names.Handles.SubElements.ButtonsContainer.SubElements.RotateBtn.DATA_NAME,
            modes: [
                { label: "Rotate Collectivley", selected: true }, 
                { label: "Rotate Individually", selected: false },
                { label: "Test", selected: false }
            ],
            buttonPathArcDataName: Names.Handles.SubElements.ButtonArcPathsContainer.SubElements.RotateBtnArcPath.DATA_NAME,
            buttonTransformData: new SvgTransformString(buttonTransformOrder),
            handleMode: HandleMode.ROTATE
        },
        {
            angle: 22.5,
            arcDataName: Names.Handles.SubElements.ArcsContainer.SubElements.ScaleArc.DATA_NAME,
            arcTransformData: new SvgTransformString(arcTransformService),
            buttonDataName: Names.Handles.SubElements.ButtonsContainer.SubElements.ScaleBtn.DATA_NAME,
            modes: [{ label: "Scale", selected: true }],
            buttonPathArcDataName: Names.Handles.SubElements.ButtonArcPathsContainer.SubElements.ScaleBtnArcPath.DATA_NAME,
            buttonTransformData: new SvgTransformString(buttonTransformOrder),
            handleMode: HandleMode.SCALE
        },
        {
            angle: 90,
            arcDataName: Names.Handles.SubElements.ArcsContainer.SubElements.FillArc.DATA_NAME,
            arcTransformData: new SvgTransformString(arcTransformService),
            buttonDataName: Names.Handles.SubElements.ButtonsContainer.SubElements.ToggleControlsBtn.DATA_NAME,
            modes: [{ label: "Toggle", selected: true }],
            buttonTransformData: new SvgTransformString(buttonTransformOrder),
            handleMode: HandleMode.SCALE
        }
    ];

    private readonly buttonsData: IMainOverlayData[];

    //#endregion

    //#region Ctor

    public constructor(container: d3.Selection<SVGGElement, {}, null, undefined>, editor: SvgEditor) {
        this.animationDuration = 200;
        this.center = { x: 0, y: 0};
        this.container = container;
        this.defaultWidth = 4;
        this.elementDataMap = new WeakMap();
        this.highlightData = SvgTransformString.CreateDefaultTransform();
        this.minRadius = 100;
        this.onDeleteClickedHandlers = [];
        this.onRotationEventHandlers = [];
        this.startAngleOffset = 45 + 180;
        
        this._collapseButtons = false;
        this._mode = HandleMode.PAN;
        this._radius = 100;

        let containerNode = this.container.node();
        if (containerNode == undefined) {
            throw new Error("The container didn't exist.");
        }
        this.containerNode = containerNode;

        let self = this;

        this.highlightEl = this.container
            .append<SVGCircleElement>("circle")
            .data([self.highlightData])
            .attr("id", uniqid())
            .attr("data-name",
                Names.Handles.SubElements.HightlightSection.DATA_NAME)
            .attr("r", self.radius)
            .attr("cx", 0)
            .attr("cy", 0)
            .attr("transform", function(d) {
                return d.toTransformString();
            });

        this.arcsContainer = this.container
            .append<SVGGElement>("g")
            .attr("id", uniqid())
            .attr("data-name", 
                Names.Handles.SubElements.ArcsContainer.DATA_NAME)
            .each(function() {
                SvgTransformServiceSingleton.standardizeTransforms(this);
            });

        this.buttonsContainer = this.container
            .append<SVGGElement>("g")
            .attr("id", uniqid())
            .attr("data-name",
                Names.Handles.SubElements.ButtonsContainer.DATA_NAME)
            .each(function() {
                SvgTransformServiceSingleton.standardizeTransforms(this);
            });

        // Setup other overlays

        this.colorsContainer = this.container
            .append<SVGGElement>("g")
            .attr("id", uniqid())
            .attr("data-name",
                Names.Handles.SubElements.ColorsHelperContainer.DATA_NAME)
            .each(function() {
                SvgTransformServiceSingleton.standardizeTransforms(this);
                ActivatableServiceSingleton.register(this, false);
            });

        this.rotationOverlayContainer = this.container
            .append<SVGGElement>("g")
            .attr("id", uniqid())
            .attr("data-name", 
                Names.Handles.SubElements.RotationHelpersContainer.DATA_NAME)
            .each(function() {
                SvgTransformServiceSingleton.standardizeTransforms(this);
                ActivatableServiceSingleton.register(this, false);
            });
        
        this.scaleOverlayContainer = this.container
            .append<SVGGElement>("g")
            .attr("id", uniqid())
            .attr("data-name",
                Names.Handles.SubElements.ScaleHelpersContainer.DATA_NAME)
            .each(function() {
                SvgTransformServiceSingleton.standardizeTransforms(this);
                ActivatableServiceSingleton.register(this, false);
            });

        this.colorsOverlay = new HandlesColorsOverlay(this.scaleOverlayContainer, editor);
        this.rotationOverlay = new HandlesRotationOverlay(this.rotationOverlayContainer);
        this.scaleOverlay = new HandlesScaleOverlay(this.scaleOverlayContainer);

        this.buttonsData = this.data
            .filter(d => d.modes.length > 0);
    }

    //#endregion

    //#region Properties

    get collapseButtons() {
        return this._collapseButtons;
    }

    set collapseButtons(value: boolean) {
        if (value != this.collapseButtons) {
            this.container.classed("collapsed", value);
            this._collapseButtons = value;
            this.updateButtonsAndArcs();
        }
    }

    get mode() {
        return this._mode;
    }

    set mode(value: HandleMode) {
        let oldMode = this.mode;
        this._mode = value;
        this.modeChanged(oldMode, value);
    }

    get radius() {
        return this._radius
    }

    set radius(value: number) {
        if (value < this.minRadius) {
            this._radius = this.minRadius;
        } else {
            this._radius = value;
        }
    }

    //#endregion

    //#region Functions

    private updateButtonsAndArcs() {
        let self = this;

        this.arcsContainer
            .selectAll<SVGPathElement, IMainOverlayData>("path")
            .data(this.data)
            .call(arcOpacity)
            .call(arcTransforms);

        this.buttonsContainer
            .selectAll<SVGGElement, IMainOverlayData>("g")
            .data(this.buttonsData)
            .each(function(d) {
                d3.select(this)
                    .selectAll<SVGPolygonElement, {}>("polygon")
                    .data(d.modes)
                    .attr("transform", function(_d, i) {
                        let btnTransformData = self.elementDataMap.get(this);

                        if (btnTransformData == undefined) {
                            return "";
                        }

                        if (self.collapseButtons) {
                            btnTransformData.setTranslate({ x: 0, y: 0 });
                        } else {
                            if (d.modes.length > 1) {
                                btnTransformData.setTranslate({ x: i * 35, y: Math.pow(-1, i + 1) * 10 });
                            } else {
                                btnTransformData.setTranslate({ x: i * 40, y: 0});
                            }
                        }

                        return btnTransformData.toTransformString();
                    })
                    .classed("selected", (d, i) => { return d.selected; });
            })
            .call(bttnOpacity)
            .call(bttnTransform);

        function arcTransforms(selection: d3.Selection<SVGPathElement, IMainOverlayData, SVGGElement, {}>) {
            selection.transition("arc-transform-transition")
                .duration(self.animationDuration)
                .attrTween("transform", function(d) {
                    let middleAngle = (d.middleAngle || 0);
                    let handleMode = d.handleMode;

                    // This is to get the button to rotate from the right if it's
                    // also on the right.
                    middleAngle = middleAngle > 180 ? -1 * (360 - middleAngle) : middleAngle;

                    // How much to move the button.
                    let angleIncrement = 1 / middleAngle;

                    // Update the radius
                    d.arcTransformData.setRotation({ a: 0 });

                    // Return a function where the argument (t) is a value in the
                    // range [0-1].
                    if (self.collapseButtons) {
                        return function(t) {
                            d.arcTransformData.setRotation({ a: -1 * t * middleAngle }, 0);
                            return d.arcTransformData.toTransformString();
                        }
                    } else {
                        return function(t) {
                            let offset = -1 * (middleAngle - (t * middleAngle));
                            d.arcTransformData.setRotation({ a: offset }, 0);
                            return d.arcTransformData.toTransformString();
                        }
                    }
                });
        }

        function arcOpacity(selection: d3.Selection<SVGPathElement, IMainOverlayData, SVGGElement, {}>) {
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
                    let middleAngle = (d.middleAngle || 0);
                    let handleMode = d.handleMode;

                    // This is to get the button to rotate from the right if it's
                    // also on the right.
                    middleAngle = middleAngle > 180 ? -1 * (360 - middleAngle) : middleAngle;

                    // How much to move the button.
                    let angleIncrement = 1 / middleAngle;

                    // Update the radius
                    d.buttonTransformData.setTranslate({ x: 0, y: self.radius });

                    // Return a function where the argument (t) is a value in the
                    // range [0-1].
                    if (self.collapseButtons) {
                        return function(t) {
                            let offset = middleAngle - (t * middleAngle);
                            d.buttonTransformData.setRotation({ a: offset }, 0);
                            d.buttonTransformData.setRotation({ a: -1 * offset }, 1);
                            return d.buttonTransformData.toTransformString();
                        }
                    } else {
                        return function(t) {
                            d.buttonTransformData.setRotation({ a: t * middleAngle }, 0);
                            d.buttonTransformData.setRotation({ a: t * -1 * middleAngle }, 1);
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

    private modeChanged(oldMode: HandleMode, newMode: HandleMode): void {
        console.log(`Mode changed to ${this.mode}`);
        let oldName: string = "";
        let newName: string = "";

        switch(oldMode) {
            case HandleMode.SELECT_MODE:
                oldName = Names.Handles.SubElements.ButtonsContainer.SubElements.ToggleControlsBtn.DATA_NAME;
                break;
            case HandleMode.COLORS:
                ActivatableServiceSingleton.deactivate(this.colorsOverlay.containerNode);
                oldName = Names.Handles.SubElements.ButtonsContainer.SubElements.ColorsBtn.DATA_NAME;
                break;
            case HandleMode.DELETE:
                oldName = Names.Handles.SubElements.ButtonsContainer.SubElements.DeleteBtn.DATA_NAME;
                break;
            case HandleMode.EDIT:
                // ActivatableServiceSingleton.deactivate(this.edit)
                oldName = Names.Handles.SubElements.ButtonsContainer.SubElements.EditBtn.DATA_NAME;
                break;
            case HandleMode.ROTATE:
                ActivatableServiceSingleton.deactivate(this.rotationOverlay.containerNode);
                oldName = Names.Handles.SubElements.ButtonsContainer.SubElements.RotateBtn.DATA_NAME;
                break;
            case HandleMode.SCALE:
                ActivatableServiceSingleton.deactivate(this.scaleOverlay.containerNode);
                oldName = Names.Handles.SubElements.ButtonsContainer.SubElements.ScaleBtn.DATA_NAME;
                break;
            case HandleMode.PAN:
            default:
                oldName = Names.Handles.SubElements.ButtonsContainer.SubElements.PanBtn.DATA_NAME;
                break;
        }

        switch(newMode) {
            case HandleMode.SELECT_MODE:
                oldName = Names.Handles.SubElements.ButtonsContainer.SubElements.ToggleControlsBtn.DATA_NAME;
                break;
            case HandleMode.COLORS:
                ActivatableServiceSingleton.activate(this.colorsOverlay.containerNode);
                newName = Names.Handles.SubElements.ButtonsContainer.SubElements.ColorsBtn.DATA_NAME;
                break;
            case HandleMode.EDIT:
                newName = Names.Handles.SubElements.ButtonsContainer.SubElements.EditBtn.DATA_NAME;
                break;
            case HandleMode.ROTATE:
                this.rotationOverlay.radius = this.radius;
                this.rotationOverlay.update();
                ActivatableServiceSingleton.activate(this.rotationOverlay.containerNode);
                newName = Names.Handles.SubElements.ButtonsContainer.SubElements.RotateBtn.DATA_NAME;
                break;
            case HandleMode.SCALE:
                ActivatableServiceSingleton.activate(this.scaleOverlay.containerNode);
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
        
        this.buttonsContainer.select(`*[data-name='${oldName}']`).classed("active", false);
        this.buttonsContainer.select(`*[data-name='${newName}']`).classed("active", true);

        this.collapseButtons = newMode != HandleMode.SELECT_MODE;
    }

    public draw(): void {
        let self = this;
        let rotateData = self.buttonsData.find(d => d.arcDataName == Names.Handles.SubElements.ArcsContainer.SubElements.RotateArc.DATA_NAME);
        const defaultTransformStr = SvgTransformServiceSingleton.defaultTransformString;

        // Update the highlight element
        this.highlightEl
            .attr("r", self.radius - (self.defaultWidth/2));
        
        // Draw arcs
        let pieData = d3.pie<IMainOverlayData>()
            .startAngle(toRadians(self.startAngleOffset))
            .endAngle(toRadians(self.startAngleOffset - 360))
            .value(function(d) { return d.angle; })
            .sortValues(function(a: number, b: number) {
                return a;
            })(this.data);

        this.arcsContainer
            .selectAll("path")
            .data(pieData)
            .enter()
            .append("path")
            .attr("id", () => uniqid())
            .attr("data-name", d => d.data.arcDataName)
            .attr("transform", d => d.data.arcTransformData.toTransformString());

        this.buttonsContainer
            .selectAll<SVGGElement, IMainOverlayData>("g")
            .data(this.buttonsData)
            .enter()
            .append<SVGGElement>("g")
            .attr("id", () => uniqid())
            .attr("data-name", function(d) { return d.buttonDataName })
            .attr("transform", function(d) {
                d.buttonTransformData.setTranslate({x: 0, y: self.radius + 20}, 0);

                if (self.collapseButtons) {
                    d.buttonTransformData.setRotation({a: 0}, 0);
                    d.buttonTransformData.setRotation({a: 0}, 1);
                } else {
                    d.buttonTransformData.setRotation({a: (d.middleAngle || 0)}, 0);
                    d.buttonTransformData.setRotation({a: -1 * (d.middleAngle || 0)}, 1);
                }

                return d.buttonTransformData.toTransformString();
            })
            .classed(Names.Handles.BTN_HANDLE_CLASS, true)
            .each(function(d) {

                // Draw buttons
                d3.select(this)
                    .selectAll<SVGPolygonElement, {}>("polygon")
                    .data(d.modes)
                    .enter()
                    .append<SVGPolygonElement>("polygon")
                    .attr("id", () => uniqid())
                    .attr("points", getPolygonPointsString(6, 20))
                    .attr("data-mode", function(d) { return d.label })
                    .classed("selected", (d, i) => { return d.selected; })
                    .each(function(_d, i) {
                        let buttonCircleTransform = new SvgTransformString([TransformType.TRANSLATE]);

                        // Save transform in map
                        self.elementDataMap.set(this, buttonCircleTransform);

                        this.setAttribute("transform", buttonCircleTransform.toTransformString());
                    });

                    let pieSlice = pieData.find(p => p.data.buttonDataName == d.buttonDataName);

                    // Check that the slice exists and is NOT the toggle button
                    if (pieSlice == undefined)
                        // || pieSlice.data.arcDataName == Names.Handles.SubElements
                        //     .ArcsContainer.SubElements.FillArc.DATA_NAME)
                    {
                        return "";
                    }

                    // Find the angle halfway between the start and end angles
                    d.middleAngle = 180 + toDegrees(pieSlice.startAngle 
                        + ((pieSlice.endAngle - pieSlice.startAngle) / 2));
    
                    buttonsTransformService.setRotation(this, { a: d.middleAngle });
                    buttonsTransformService.setRotation(this, { a: -1 * d.middleAngle }, 2)
                    buttonsTransformService.setTranslation(this, { x: 0, y: self.radius + 20 })
            });

        // Add event listeners to the buttons
        this.buttonsContainer.select(`[data-name='${Names.Handles.SubElements.ButtonsContainer.SubElements.DeleteBtn.DATA_NAME}']`)
            .on("click", function() {
                self.mode = HandleMode.DELETE;
                self.onDeleteClickedHandlers.map(f => f())
            });

        this.buttonsContainer.select<Element>(`[data-name='${Names.Handles.SubElements.ButtonsContainer.SubElements.ToggleControlsBtn.DATA_NAME}']`)
            .on("click", function() {
                self.collapseButtons = !self.collapseButtons;
                console.log(`Toggled collapse buttons: ${self.collapseButtons}`);
                d3.event.stopPropagation();
            });

        this.buttonsContainer.select(`[data-name='${Names.Handles.SubElements.ButtonsContainer.SubElements.ColorsBtn.DATA_NAME}']`)
            .on("click", function() {
                self.mode = HandleMode.COLORS;
                d3.event.stopPropagation();
            });

        this.buttonsContainer.select(`[data-name='${Names.Handles.SubElements.ButtonsContainer.SubElements.EditBtn.DATA_NAME}']`)
            .on("click", function() {
                self.mode = HandleMode.EDIT;
                d3.event.stopPropagation();
            });

        this.buttonsContainer.select(`[data-name='${Names.Handles.SubElements.ButtonsContainer.SubElements.PanBtn.DATA_NAME}']`)
            .on("click", function() {
                self.mode = HandleMode.PAN;
                d3.event.stopPropagation();
            });

        this.buttonsContainer.selectAll<Element, {}>(`[data-name='${Names.Handles.SubElements.ButtonsContainer.SubElements.RotateBtn.DATA_NAME}'] > *:not(rect)`)
            .on("click", function() {

                if (rotateData == undefined) {
                    throw InternalError;
                }

                let thisDataMode = this.getAttribute("data-mode");
                rotateData.modes = rotateData.modes.map(mode => {
                    mode.selected = mode.label == this.getAttribute("data-mode");
                    return mode;
                });

                self.mode = HandleMode.ROTATE;
                d3.event.stopPropagation();
            });

        this.buttonsContainer.select(`[data-name='${Names.Handles.SubElements.ButtonsContainer.SubElements.ScaleBtn.DATA_NAME}']`)
            .on("click", function() {
                self.mode = HandleMode.SCALE;
                d3.event.stopPropagation();
            });

        this.colorsOverlay.draw();
        this.rotationOverlay.draw();
        this.scaleOverlay.draw();
        this.rotationOverlay.onRotation = this.onRotationEventHandlers;
        this.modeChanged(HandleMode.DELETE, HandleMode.PAN);
    }

    public update(): void {
        const self = this;
        const defaultTransformStr = SvgTransformServiceSingleton.defaultTransformString;

        switch(this.mode) {
            case HandleMode.COLORS:
                this.colorsOverlay.update();
                break;

            case HandleMode.ROTATE:
                this.rotationOverlay.radius = this.radius;
                this.rotationOverlay.update();
                break;

            case HandleMode.SCALE:
                this.scaleOverlay.update();
                break;
        }

        // Update the highlight element
        this.highlightEl
            .attr("r", self.radius - (self.defaultWidth/2));
        
        // Draw arcs
        let pieData = d3.pie<IMainOverlayData>()
            .startAngle(toRadians(self.startAngleOffset))
            .endAngle(toRadians(self.startAngleOffset - 360))
            .value(function(d) { return d.angle; })
            .sortValues(function(a: number, b: number) {
                return a;
            })(this.data);

        this.arcsContainer
            .selectAll("path")
            .data(pieData)
            .attr("d", function(d) {
                let w = self.defaultWidth;

                return d3.arc()({
                    innerRadius: self._radius,
                    outerRadius: self._radius - w,
                    startAngle: d.startAngle,
                    endAngle: d.endAngle
                });
            })
            .transition()
            .attrTween("transform", function(d) {
                let middleAngle = (d.data.middleAngle || 0);
                let angleIncrement = 1 / middleAngle;

                if (self.collapseButtons) {
                    return function(t) {
                        return "";
                    }
                } else {
                    return function(t) {
                        return "";
                    }
                }
            });

        let buttons = this.buttonsContainer
            .selectAll<SVGGElement, IMainOverlayData>("g")
            .data(this.buttonsData)
            .attr("transform", function(d) {
                d.buttonTransformData.setTranslate({ x: 0, y: self.radius + 20 })
                return d.buttonTransformData.toTransformString();
            });
    }

    public erase(): void {
        this.colorsOverlay.erase();
        this.rotationOverlay.erase();
        this.scaleOverlay.erase();
    }

    //#endregion
}