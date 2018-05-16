const uniqid = require("uniqid");

import * as d3 from "d3";

import { ActivatableServiceSingleton } from "../services/activatable-service";
import { getNewPointAlongAngle } from "../helpers/svg-helpers";
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

interface IMainOverlayData {
    arcDataName: string;
    arcTransformData: ITransformable;
    buttonDataName: string;
    buttonTransformData: ITransformable;
    angle: number;
    modes: IMode[],
    buttonPathArcDataName?: string;
    middleAngle?: number;
};

const buttonArcPathStartAngle = toRadians(270);
const buttonTransformOrder: TransformType[] = [
    TransformType.ROTATE,
    TransformType.TRANSLATE,
    TransformType.ROTATE
]
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
const hexagaonPoints:ICoords2D[] = [
    {
        x: -1 / 2,
        y: Math.sqrt(3) / 2
    },
    {
        x: 1 / 2,
        y: Math.sqrt(3) / 2
    },
    {
        x: 1,
        y: 0
    },
    {
        x: 1 / 2,
        y: -1 * Math.sqrt(3) / 2
    },
    {
        x: -1 / 2,
        y: -1 * Math.sqrt(3) / 2
    },
    {
        x: -1,
        y: 0
    }
];
let polygonHexPointsStr = "";
hexagaonPoints.map(point => polygonHexPointsStr += ` ${point.x},${point.y}`);
polygonHexPointsStr.trimLeft();

export class HandlesMain implements IContainer, IDrawable {
    //#region Fields

    private readonly elementDataMap: WeakMap<Element, ITransformable>;
    private _mode: HandleMode;
    private defaultWidth: number;
    private startAngleOffset: number;
    private _radius: number;
    private _collapseButtons: boolean;
    private highlightData: ITransformable;

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
    public readonly onDeleteClickedHandlers: Function[];
    public readonly onRotationEventHandlers: Array<(angle: IRotationMatrix) => void>;

    private readonly data: IMainOverlayData[] = [
        {
            angle: 45,
            arcDataName: Names.Handles.SubElements.ArcsContainer.SubElements.ColorsArc.DATA_NAME,
            arcTransformData: new SvgTransformString(arcTransformService),
            buttonDataName: Names.Handles.SubElements.ButtonsContainer.SubElements.ColorsBtn.DATA_NAME,
            modes: [{ label: "Colors", selected: true, handleMode: HandleMode.COLORS }],
            buttonPathArcDataName: Names.Handles.SubElements.ButtonArcPathsContainer.SubElements.ColorsBtnArcPath.DATA_NAME,
            buttonTransformData: new SvgTransformString(buttonTransformOrder)
        },
        {
            angle: 45,
            arcDataName: Names.Handles.SubElements.ArcsContainer.SubElements.EditArc.DATA_NAME,
            arcTransformData: new SvgTransformString(arcTransformService),
            buttonDataName: Names.Handles.SubElements.ButtonsContainer.SubElements.EditBtn.DATA_NAME,
            modes: [{ label: "Edit", selected: true, handleMode: HandleMode.EDIT }],
            buttonPathArcDataName: Names.Handles.SubElements.ButtonArcPathsContainer.SubElements.EditBtnArcPath.DATA_NAME,
            buttonTransformData: new SvgTransformString(buttonTransformOrder)
        },
        {
            angle: 90,
            arcDataName: Names.Handles.SubElements.ArcsContainer.SubElements.FillArc.DATA_NAME,
            arcTransformData: new SvgTransformString(arcTransformService),
            buttonDataName: "",
            modes: [],
            buttonTransformData: new SvgTransformString(buttonTransformOrder)
        },
        {
            angle: 22.5,
            arcDataName: Names.Handles.SubElements.ArcsContainer.SubElements.DeleteArc.DATA_NAME,
            arcTransformData: new SvgTransformString(arcTransformService),
            buttonDataName: Names.Handles.SubElements.ButtonsContainer.SubElements.DeleteBtn.DATA_NAME,
            modes: [{ label: "Delete", selected: true, handleMode: HandleMode.DELETE }],
            buttonPathArcDataName: Names.Handles.SubElements.ButtonArcPathsContainer.SubElements.DeleteBtnArcPath.DATA_NAME,
            buttonTransformData: new SvgTransformString(buttonTransformOrder)
        },
        {
            angle: 22.5,
            arcDataName: Names.Handles.SubElements.ArcsContainer.SubElements.PanArc.DATA_NAME,
            arcTransformData: new SvgTransformString(arcTransformService),
            buttonDataName: Names.Handles.SubElements.ButtonsContainer.SubElements.PanBtn.DATA_NAME,
            modes: [{ label: "Pan", selected: true, handleMode: HandleMode.PAN }],
            buttonPathArcDataName: Names.Handles.SubElements.ButtonArcPathsContainer.SubElements.PanBtnArcPath.DATA_NAME,
            buttonTransformData: new SvgTransformString(buttonTransformOrder)
        },
        {
            angle: 22.5,
            arcDataName: Names.Handles.SubElements.ArcsContainer.SubElements.RotateArc.DATA_NAME,
            arcTransformData: new SvgTransformString(arcTransformService),
            buttonDataName: Names.Handles.SubElements.ButtonsContainer.SubElements.RotateBtn.DATA_NAME,
            modes: [
                { label: "Rotate Collectivley", selected: true, handleMode: HandleMode.ROTATE }, 
                { label: "Rotate Individually", selected: false, handleMode: HandleMode.ROTATE }
            ],
            buttonPathArcDataName: Names.Handles.SubElements.ButtonArcPathsContainer.SubElements.RotateBtnArcPath.DATA_NAME,
            buttonTransformData: new SvgTransformString(buttonTransformOrder)
        },
        {
            angle: 22.5,
            arcDataName: Names.Handles.SubElements.ArcsContainer.SubElements.ScaleArc.DATA_NAME,
            arcTransformData: new SvgTransformString(arcTransformService),
            buttonDataName: Names.Handles.SubElements.ButtonsContainer.SubElements.ScaleBtn.DATA_NAME,
            modes: [{ label: "Scale", selected: true, handleMode: HandleMode.SCALE }],
            buttonPathArcDataName: Names.Handles.SubElements.ButtonArcPathsContainer.SubElements.ScaleBtnArcPath.DATA_NAME,
            buttonTransformData: new SvgTransformString(buttonTransformOrder)
        },
        {
            angle: 90,
            arcDataName: Names.Handles.SubElements.ArcsContainer.SubElements.FillArc.DATA_NAME,
            arcTransformData: new SvgTransformString(arcTransformService),
            buttonDataName: Names.Handles.SubElements.ButtonsContainer.SubElements.ToggleControlsBtn.DATA_NAME,
            modes: [{ label: "Toggle", selected: true, handleMode: HandleMode.SCALE }],
            buttonTransformData: new SvgTransformString(buttonTransformOrder)
        }
    ];

    private readonly buttonsData: IMainOverlayData[];

    //#endregion

    //#region Ctor

    public constructor(container: d3.Selection<SVGGElement, {}, null, undefined>) {
        this.center = { x: 0, y: 0};
        this.container = container;
        this.defaultWidth = 4;
        this.elementDataMap = new WeakMap();
        this.highlightData = SvgTransformString.CreateDefaultTransform();
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

        this.colorsOverlay = new HandlesColorsOverlay(this.scaleOverlayContainer);
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
        this.modeChanged(this.mode, value);
        this._mode = value;
    }

    get radius() {
        return this._radius
    }

    set radius(value: number) {
        if (value < 50) {
            this._radius = 50;
        } else {
            this._radius = value;
        }
    }

    //#endregion

    //#region Functions

    private updateButtonsAndArcs() {
        let self = this;
        let buttons = this.buttonsContainer
            .selectAll<SVGGElement, IMainOverlayData>("g")
            .data(this.buttonsData)
            .each(function(d) {
                d3.select(this)
                    .selectAll<SVGCircleElement, {}>("circle")
                    .data(d.modes)
                    .attr("transform", function(d, i) {
                        let btnTransformData = self.elementDataMap.get(this);

                        if (btnTransformData == undefined) {
                            return "";
                        }

                        if (self.collapseButtons) {
                            btnTransformData.setTranslate({ x: 0, y: 0 });
                        } else {
                            btnTransformData.setTranslate({ x: i * 40, y: 0});
                        }

                        return btnTransformData.toTransformString();
                    })
                    .classed("selected", (d, i) => { return d.selected; });
            })
        
        
        buttons
            .call(bttnOpacity)
            .call(bttnTransform);
        
        function bttnTransform(selection: d3.Selection<SVGGElement, IMainOverlayData, SVGGElement, {}>) {
            selection.transition("button-transform-transition")
                // .duration(2000)
                .attrTween("transform", function(d) {
                    let middleAngle = (d.middleAngle || 0);

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
                // .duration(2000)
                .style("opacity", function(d) {
                    let currentMode = d.modes.find(m => m.selected && (m.handleMode == self.mode));
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
                    let currentMode = d.modes.find(m => m.selected && (m.handleMode == self.mode));
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

                // Create background rect
                if (d.modes.length > 1) {
                    d3.select(this)
                        .selectAll("rect")
                        .data([{}])
                        .enter()
                        .append("rect")
                        .attr("id", uniqid())
                        .attr("x", -21)
                        .attr("y", -21)
                        .attr("rx", 21)
                        .attr("ry", 21)
                        .attr("width", 42 * d.modes.length)
                        .attr("height", 42);
                }

                // Draw buttons
                d3.select(this)
                    .data(d.modes)
                    .enter()
                    .append<SVGCircleElement>("circle")
                    .attr("id", () => uniqid())
                    .attr("r", 20)
                    .attr("data-mode", function(d) { return d.label })
                    .classed("selected", (d, i) => { return d.selected; })
                    .each(function(d, i) {
                        let buttonCircleTransform = new SvgTransformString([TransformType.TRANSLATE]);
                        buttonCircleTransform.setTranslate({ x: i * 40, y: 0 });
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

        this.buttonsContainer.selectAll<Element, {}>(`[data-name='${Names.Handles.SubElements.ButtonsContainer.SubElements.RotateBtn.DATA_NAME}'] > circle`)
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
                d.buttonTransformData.setTranslate({ x: 0, y: self.radius })
                return d.buttonTransformData.toTransformString();
            })
            .each(function(d) {
                d3.select(this)
                    .selectAll<SVGCircleElement, {}>("circle")
                    .data(d.modes)
                    .attr("transform", function(d, i) {
                        let btnTransformData = self.elementDataMap.get(this);

                        if (btnTransformData == undefined) {
                            return "";
                        }

                        if (self.collapseButtons) {
                            btnTransformData.setTranslate({ x: 0, y: 0 });
                        } else {
                            btnTransformData.setTranslate({ x: i * 40, y: 0});
                        }

                        return btnTransformData.toTransformString();
                    })
                    .classed("selected", (d, i) => { return d.selected; });
            })
    }

    public erase(): void {
        this.colorsOverlay.erase();
        this.rotationOverlay.erase();
        this.scaleOverlay.erase();
    }

    //#endregion
}