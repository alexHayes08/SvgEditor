const uniqid = require("uniqid");

import * as d3 from "d3";

import { ActivatableServiceSingleton } from "../services/activatable-service";
import { getNewPointAlongAngle } from "../helpers/svg-helpers";
import { HandlesColorsOverlay } from "./handles-colors";
import { HandlesRotationOverlay } from "./handles-rotation";
import { HandlesScaleOverlay } from "./handles-scale";
import { IContainer } from "./icontainer";
import { IDrawable } from './idrawable';
import { IHandleButton, IMode } from "./ihandle-button";
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

export enum HandleModes {
    PAN = 0,
    SCALE = 1,
    ROTATE = 2,
    COLORS = 3,
    EDIT = 4,
    DELETE = 5
};

interface IMainOverlayData {
    arcDataName: string;
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

export class HandlesMain implements IContainer, IDrawable {
    //#region Fields

    private _mode: HandleModes;
    private defaultWidth: number;
    private startAngleOffset: number;
    private _radius: number;
    private _collapseButtons: boolean;

    private colorsOverlay: HandlesColorsOverlay;
    private rotationOverlay: HandlesRotationOverlay;
    private scaleOverlay: HandlesScaleOverlay;
    
    private arcsContainer: d3.Selection<SVGGElement, {}, null, undefined>;
    private buttonsContainer: d3.Selection<SVGGElement, {}, null, undefined>;
    private buttonArcsPathContainer: d3.Selection<SVGGElement, {}, null, undefined>;
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
            buttonDataName: Names.Handles.SubElements.ButtonsContainer.SubElements.ColorsBtn.DATA_NAME,
            modes: [{ label: "Colors", selected: true }],
            buttonPathArcDataName: Names.Handles.SubElements.ButtonArcPathsContainer.SubElements.ColorsBtnArcPath.DATA_NAME,
            buttonTransformData: new SvgTransformString(buttonTransformOrder)
        },
        {
            angle: 45,
            arcDataName: Names.Handles.SubElements.ArcsContainer.SubElements.EditArc.DATA_NAME,
            buttonDataName: Names.Handles.SubElements.ButtonsContainer.SubElements.EditBtn.DATA_NAME,
            modes: [{ label: "Edit", selected: true }],
            buttonPathArcDataName: Names.Handles.SubElements.ButtonArcPathsContainer.SubElements.EditBtnArcPath.DATA_NAME,
            buttonTransformData: new SvgTransformString(buttonTransformOrder)
        },
        {
            angle: 90,
            arcDataName: Names.Handles.SubElements.ArcsContainer.SubElements.FillArc.DATA_NAME,
            buttonDataName: "",
            modes: [],
            buttonTransformData: new SvgTransformString(buttonTransformOrder)
        },
        {
            angle: 22.5,
            arcDataName: Names.Handles.SubElements.ArcsContainer.SubElements.DeleteArc.DATA_NAME,
            buttonDataName: Names.Handles.SubElements.ButtonsContainer.SubElements.DeleteBtn.DATA_NAME,
            modes: [{ label: "Delete", selected: true }],
            buttonPathArcDataName: Names.Handles.SubElements.ButtonArcPathsContainer.SubElements.DeleteBtnArcPath.DATA_NAME,
            buttonTransformData: new SvgTransformString(buttonTransformOrder)
        },
        {
            angle: 22.5,
            arcDataName: Names.Handles.SubElements.ArcsContainer.SubElements.PanArc.DATA_NAME,
            buttonDataName: Names.Handles.SubElements.ButtonsContainer.SubElements.PanBtn.DATA_NAME,
            modes: [{ label: "Pan", selected: true }],
            buttonPathArcDataName: Names.Handles.SubElements.ButtonArcPathsContainer.SubElements.PanBtnArcPath.DATA_NAME,
            buttonTransformData: new SvgTransformString(buttonTransformOrder)
        },
        {
            angle: 22.5,
            arcDataName: Names.Handles.SubElements.ArcsContainer.SubElements.RotateArc.DATA_NAME,
            buttonDataName: Names.Handles.SubElements.ButtonsContainer.SubElements.RotateBtn.DATA_NAME,
            modes: [
                { label: "Rotate Collectivley", selected: true }, 
                { label: "Rotate Individually", selected: false }
            ],
            buttonPathArcDataName: Names.Handles.SubElements.ButtonArcPathsContainer.SubElements.RotateBtnArcPath.DATA_NAME,
            buttonTransformData: new SvgTransformString(buttonTransformOrder)
        },
        {
            angle: 22.5,
            arcDataName: Names.Handles.SubElements.ArcsContainer.SubElements.ScaleArc.DATA_NAME,
            buttonDataName: Names.Handles.SubElements.ButtonsContainer.SubElements.ScaleBtn.DATA_NAME,
            modes: [{ label: "Scale", selected: true }],
            buttonPathArcDataName: Names.Handles.SubElements.ButtonArcPathsContainer.SubElements.ScaleBtnArcPath.DATA_NAME,
            buttonTransformData: new SvgTransformString(buttonTransformOrder)
        },
        {
            angle: 90,
            arcDataName: Names.Handles.SubElements.ArcsContainer.SubElements.FillArc.DATA_NAME,
            buttonDataName: Names.Handles.SubElements.ButtonsContainer.SubElements.ToggleControlsBtn.DATA_NAME,
            modes: [{ label: "Toggle", selected: true }],
            buttonTransformData: new SvgTransformString(buttonTransformOrder)
        }
    ];

    private readonly buttonsData: IMainOverlayData[];

    //#endregion

    //#region Ctor

    public constructor(container: d3.Selection<SVGGElement, {}, null, undefined>) {
        this.container = container;
        this._mode = HandleModes.PAN;
        this.defaultWidth = 4;
        this._radius = 100;
        this.onDeleteClickedHandlers = [];
        this.onRotationEventHandlers = [];
        this.center = { x: 0, y: 0};
        this.startAngleOffset = 45 + 180;
        this._collapseButtons = false;

        let containerNode = this.container.node();
        if (containerNode == undefined) {
            throw new Error("The container didn't exist.");
        }
        this.containerNode = containerNode;

        let self = this;

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

        this.buttonArcsPathContainer = this.container
            .append<SVGGElement>("g")
            .attr("id", uniqid())
            .attr("data-name", Names.Handles.SubElements.ButtonArcPathsContainer.DATA_NAME);

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
            this._collapseButtons = value;
            this.drawAndUpdate();
        }
    }

    get mode() {
        return this._mode;
    }

    set mode(value: HandleModes) {
        if (this.mode != value) {
            this.modeChanged(this.mode, value);
            this._mode = value;
        }
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

    private modeChanged(oldMode: HandleModes, newMode: HandleModes): void {
        console.log(`Mode changed to ${this.mode}`);
        // this.buttonsContainer.selectAll(".active")
        //     .classed("active", false);
        let oldName: string = "";
        let newName: string = "";

        switch(oldMode) {
            case HandleModes.COLORS:
                ActivatableServiceSingleton.deactivate(this.colorsOverlay.containerNode);
                oldName = Names.Handles.SubElements.ButtonsContainer.SubElements.ColorsBtn.DATA_NAME;
                break;
            case HandleModes.DELETE:
                oldName = Names.Handles.SubElements.ButtonsContainer.SubElements.DeleteBtn.DATA_NAME;
                break;
            case HandleModes.EDIT:
                // ActivatableServiceSingleton.deactivate(this.edit)
                oldName = Names.Handles.SubElements.ButtonsContainer.SubElements.EditBtn.DATA_NAME;
                break;
            case HandleModes.ROTATE:
                ActivatableServiceSingleton.deactivate(this.rotationOverlay.containerNode);
                oldName = Names.Handles.SubElements.ButtonsContainer.SubElements.RotateBtn.DATA_NAME;
                break;
            case HandleModes.SCALE:
                ActivatableServiceSingleton.deactivate(this.scaleOverlay.containerNode);
                oldName = Names.Handles.SubElements.ButtonsContainer.SubElements.ScaleBtn.DATA_NAME;
                break;
            case HandleModes.PAN:
            default:
                oldName = Names.Handles.SubElements.ButtonsContainer.SubElements.PanBtn.DATA_NAME;
                break;
        }

        switch(newMode) {
            case HandleModes.COLORS:
                ActivatableServiceSingleton.activate(this.colorsOverlay.containerNode);
                newName = Names.Handles.SubElements.ButtonsContainer.SubElements.ColorsBtn.DATA_NAME;
                break;
            case HandleModes.DELETE:
                newName = Names.Handles.SubElements.ButtonsContainer.SubElements.DeleteBtn.DATA_NAME;
                break;
            case HandleModes.EDIT:
                newName = Names.Handles.SubElements.ButtonsContainer.SubElements.EditBtn.DATA_NAME;
                break;
            case HandleModes.ROTATE:
                ActivatableServiceSingleton.activate(this.rotationOverlay.containerNode);
                newName = Names.Handles.SubElements.ButtonsContainer.SubElements.RotateBtn.DATA_NAME;
                break;
            case HandleModes.SCALE:
                ActivatableServiceSingleton.activate(this.scaleOverlay.containerNode);
                newName = Names.Handles.SubElements.ButtonsContainer.SubElements.ScaleBtn.DATA_NAME;
                break;
            case HandleModes.PAN:
            default:
                newName = Names.Handles.SubElements.ButtonsContainer.SubElements.PanBtn.DATA_NAME;
                break;
        }
        
        this.buttonsContainer.select(`*[data-name='${oldName}']`).classed("active", false);
        this.buttonsContainer.select(`*[data-name='${newName}']`).classed("active", true);
    }

    private drawAndUpdate(): void {
        let self = this;

        let defaultTransformStr = SvgTransformServiceSingleton.defaultTransformString;
        
        // Draw arcs
        let pieData = d3.pie<IMainOverlayData>()
            .startAngle(toRadians(self.startAngleOffset))
            .endAngle(toRadians(self.startAngleOffset - 360))
            .value(function(d) { return d.angle; })
            .sortValues(function(a: number, b: number) {
                return a;
            })(this.data);

        let setPathFunc = function(d: d3.PieArcDatum<ISlice>) {
            let w = d.data.width || self.defaultWidth;

            return d3.arc()({
                    innerRadius: self._radius,
                    outerRadius: self._radius - w,
                    startAngle: d.startAngle,
                    endAngle: d.endAngle
                });
        }

        this.arcsContainer
            .selectAll("path")
            .data(pieData)
            .attr("d", setPathFunc)
            .enter()
            .append("path")
            .attr("id", () => uniqid())
            .attr("data-name", d => d.data.arcDataName);

        this.buttonsContainer
            .selectAll<SVGGElement, IMainOverlayData>("g")
            .data(this.buttonsData)
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
            .enter()
            .append<SVGGElement>("g")
            .attr("id", () => uniqid())
            .attr("data-name", function(d) { return d.buttonDataName })
            .classed(Names.Handles.BTN_HANDLE_CLASS, true)
            .each(function(d) {
                buttonsTransformService.standardizeTransforms(this);

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
                    .selectAll<SVGCircleElement, IMainOverlayData>("circle")
                    .data(d.modes)
                    .enter()
                    .append<SVGCircleElement>("circle")
                    .attr("id", () => uniqid())
                    .attr("r", 20)
                    .attr("data-mode", function(d) { return d.label })
                    .classed("selected", (d, i) => { return i == 0; })
                    .each(function(d, i) {
                        SvgTransformServiceSingleton.standardizeTransforms(this);
                        SvgTransformServiceSingleton.setTranslation(this, { x: i * 40, y: 0 });
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
            })
            .transition("toggle-buttons-display")
            .duration(2000);
    }

    public draw(): void {
        let self = this;
        this.drawAndUpdate();

        // Add event listeners to the buttons
        this.buttonsContainer.select(`[data-name='${Names.Handles.SubElements.ButtonsContainer.SubElements.DeleteBtn.DATA_NAME}']`)
            .on("click", function() {
                self.mode = HandleModes.DELETE;
                self.onDeleteClickedHandlers.map(f => f())
            });

        this.buttonsContainer.select(`[data-name='${Names.Handles.SubElements.ButtonsContainer.SubElements.ToggleControlsBtn.DATA_NAME}']`)
            .on("click", function() {
                self.collapseButtons = !self.collapseButtons;
                console.log(`Toggled collapse buttons: ${self.collapseButtons}`);
                d3.event.stopPropagation();
            });

        this.buttonsContainer.select(`[data-name='${Names.Handles.SubElements.ButtonsContainer.SubElements.ColorsBtn.DATA_NAME}']`)
            .on("click", function() {
                self.mode = HandleModes.COLORS;
                d3.event.stopPropagation();
            });

        this.buttonsContainer.select(`[data-name='${Names.Handles.SubElements.ButtonsContainer.SubElements.EditBtn.DATA_NAME}']`)
            .on("click", function() {
                self.mode = HandleModes.EDIT;
                d3.event.stopPropagation();
            });

        this.buttonsContainer.select(`[data-name='${Names.Handles.SubElements.ButtonsContainer.SubElements.PanBtn.DATA_NAME}']`)
            .on("click", function() {
                self.mode = HandleModes.PAN;
                d3.event.stopPropagation();
            });

        this.buttonsContainer.select(`[data-name='${Names.Handles.SubElements.ButtonsContainer.SubElements.RotateBtn.DATA_NAME}']`)
            .on("click", function() {
                self.mode = HandleModes.ROTATE;
                d3.event.stopPropagation();
            });

        this.buttonsContainer.select(`[data-name='${Names.Handles.SubElements.ButtonsContainer.SubElements.ScaleBtn.DATA_NAME}']`)
            .on("click", function() {
                self.mode = HandleModes.SCALE;
                d3.event.stopPropagation();
            });

        this.colorsOverlay.draw();
        this.rotationOverlay.draw();
        this.scaleOverlay.draw();
        this.rotationOverlay.onRotation = this.onRotationEventHandlers;
        this.modeChanged(HandleModes.DELETE, HandleModes.PAN);
    }

    public update(): void {
        switch(this.mode) {
            case HandleModes.COLORS:
                this.colorsOverlay.update();
                break;

            case HandleModes.ROTATE:
                this.rotationOverlay.radius = this.radius;
                this.rotationOverlay.update();
                break;

            case HandleModes.SCALE:
                this.scaleOverlay.update();
                break;
        }
        this.drawAndUpdate();
    }

    public erase(): void {
        this.colorsOverlay.erase();
        this.rotationOverlay.erase();
        this.scaleOverlay.erase();
    }

    //#endregion
}