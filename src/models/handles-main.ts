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
import { SvgTransformServiceSingleton, ICoords2D } from "../services/svg-transform-service";
import { toRadians } from "../helpers/math-helpers";

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
    angle: number;
    modes: IMode[]
};

export class HandlesMain implements IContainer, IDrawable {
    // [Fields]

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
    private colorsContainer: d3.Selection<SVGGElement, {}, null, undefined>;
    private rotationOverlayContainer: d3.Selection<SVGGElement, {}, null, undefined>;
    private scaleOverlayContainer: d3.Selection<SVGGElement, {}, null, undefined>;

    public container: d3.Selection<SVGGElement, {}, null, undefined>;
    public containerNode: SVGGElement;
    public center: ICoords2D;
    public readonly onDeleteClickedHandlers: Function[];

    private readonly data: IMainOverlayData[] = [
        {
            angle: 90,
            arcDataName: Names.Handles.SubElements.ButtonsContainer.SubElements.ToggleControlsBtn.DATA_NAME,
            buttonDataName: "Toggle",
            modes: [{ label: "Toggle", selected: true }]
        },
        {
            angle: 45,
            arcDataName: Names.Handles.SubElements.ArcsContainer.SubElements.ColorsArc.DATA_NAME,
            buttonDataName: Names.Handles.SubElements.ButtonsContainer.SubElements.ColorsBtn.DATA_NAME,
            modes: [{ label: "Colors", selected: true }]
        },
        {
            angle: 45,
            arcDataName: Names.Handles.SubElements.ArcsContainer.SubElements.EditArc.DATA_NAME,
            buttonDataName: Names.Handles.SubElements.ButtonsContainer.SubElements.EditBtn.DATA_NAME,
            modes: [{ label: "Edit", selected: true }]
        },
        {
            angle: 90,
            arcDataName: Names.Handles.SubElements.ArcsContainer.SubElements.FillArc.DATA_NAME,
            buttonDataName: "",
            modes: []
        },
        {
            angle: 22.5,
            arcDataName: Names.Handles.SubElements.ArcsContainer.SubElements.DeleteArc.DATA_NAME,
            buttonDataName: Names.Handles.SubElements.ButtonsContainer.SubElements.DeleteBtn.DATA_NAME,
            modes: [{ label: "Delete", selected: true }]
        },
        {
            angle: 22.5,
            arcDataName: Names.Handles.SubElements.ArcsContainer.SubElements.PanArc.DATA_NAME,
            buttonDataName: Names.Handles.SubElements.ButtonsContainer.SubElements.PanBtn.DATA_NAME,
            modes: [{ label: "Pan", selected: true }]
        },
        {
            angle: 22.5,
            arcDataName: Names.Handles.SubElements.ArcsContainer.SubElements.RotateArc.DATA_NAME,
            buttonDataName: Names.Handles.SubElements.ButtonsContainer.SubElements.RotateBtn.DATA_NAME,
            modes: [
                { label: "Rotate Collectivley", selected: true }, 
                { label: "Rotate Individually", selected: false }
            ]
        },
        {
            angle: 22.5,
            arcDataName: Names.Handles.SubElements.ArcsContainer.SubElements.ScaleArc.DATA_NAME,
            buttonDataName: Names.Handles.SubElements.ButtonsContainer.SubElements.ScaleBtn.DATA_NAME,
            modes: [{ label: "Scale", selected: true }]
        }
    ];

    private readonly buttonsData: IMainOverlayData[];

    // [End Fields]

    // [Ctor]

    public constructor(container: d3.Selection<SVGGElement, {}, null, undefined>) {
        this.container = container;
        this._mode = HandleModes.PAN;
        this.defaultWidth = 4;
        this._radius = 100;
        this.onDeleteClickedHandlers = [];
        this.center = { x: 0, y: 0};
        this.startAngleOffset = 135;
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

        // Setup other overlays

        this.colorsContainer = this.container
            .append<SVGGElement>("g")
            .attr("id", uniqid())
            .attr("data-name",
                Names.Handles.SubElements.ColorsHelperContainer.DATA_NAME)
            .each(function() {
                SvgTransformServiceSingleton.standardizeTransforms(this);
            });;

        this.rotationOverlayContainer = this.container
            .append<SVGGElement>("g")
            .attr("id", uniqid())
            .attr("data-name", 
                Names.Handles.SubElements.RotationHelpersContainer.DATA_NAME)
            .each(function() {
                SvgTransformServiceSingleton.standardizeTransforms(this);
            });
        
        this.scaleOverlayContainer = this.container
            .append<SVGGElement>("g")
            .attr("id", uniqid())
            .attr("data-name",
                Names.Handles.SubElements.ScaleHelpersContainer.DATA_NAME)
            .each(function() {
                SvgTransformServiceSingleton.standardizeTransforms(this);
            });

        this.colorsOverlay = new HandlesColorsOverlay(this.container);
        this.rotationOverlay = new HandlesRotationOverlay(this.container);
        this.scaleOverlay = new HandlesScaleOverlay(this.container);

        this.buttonsData = this.data.filter(d => d.modes.length > 0);
    }

    // [End Ctor]

    // [Properties]

    get collapseButtons() {
        return this._collapseButtons;
    }

    set collapseButtons(value: boolean) {
        if (value != this.collapseButtons) {
            this._collapseButtons = value;
        }
    }

    get mode() {
        return this._mode;
    }

    set mode(value: HandleModes) {
        if (this.mode != value) {
            this._mode = value;
            this.modeChanged();
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

    // [End Properties]

    // [Functions]

    private modeChanged(): void {
        console.log(`Mode changed to ${this.mode}`);
        this.buttonsContainer.selectAll(".active")
            .classed("active", false);
        let name: string = "";

        switch(this.mode) {
            case HandleModes.COLORS:
                name = Names.Handles.SubElements.ButtonsContainer.SubElements.ColorsBtn.DATA_NAME;
                break;
            case HandleModes.DELETE:
                name = Names.Handles.SubElements.ButtonsContainer.SubElements.DeleteBtn.DATA_NAME;
                break;
            case HandleModes.EDIT:
                name = Names.Handles.SubElements.ButtonsContainer.SubElements.EditBtn.DATA_NAME;
                break;
            case HandleModes.ROTATE:
                name = Names.Handles.SubElements.ButtonsContainer.SubElements.RotateBtn.DATA_NAME;
                break;
            case HandleModes.SCALE:
                name = Names.Handles.SubElements.ButtonsContainer.SubElements.ScaleBtn.DATA_NAME;
                break;
            case HandleModes.PAN:
            default:
                name = Names.Handles.SubElements.ButtonsContainer.SubElements.PanBtn.DATA_NAME;
                break;
        }
        
        this.buttonsContainer.select(`*[data-name='${name}']`).classed("active", true);
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
            .attr("data-name", function(d) { return d.data.arcDataName; });

        // Draw buttons
        this.buttonsContainer
            .selectAll<SVGGElement, IMainOverlayData>("g")
            .data(this.buttonsData)
            .each(function(d, i, nodes) {
                let arcEl = self.arcsContainer
                    .select<SVGPathElement>(`*[data-name='${d.arcDataName}']`)
                    .node();

                let arcsContainerEl = self.arcsContainer.node();

                if (arcEl == undefined || arcsContainerEl == undefined) {
                    return;
                }

                let relativeTo = self.center;
                let arcCenter = SvgTransformServiceSingleton
                    .getCenterRelativeToPoint(relativeTo, arcEl);
                let circleCenter = SvgTransformServiceSingleton
                    .getCenterRelativeToPoint(relativeTo, arcsContainerEl);
                let newBtnCoords = getNewPointAlongAngle(circleCenter, arcCenter, self._radius + 30);

                d3.select(this)
                    .append<SVGRectElement>("rect")
                    .attr("id", uniqid())
                    .attr("x", -21)
                    .attr("y", -21)
                    .attr("rx", 21)
                    .attr("ry", 21)
                    .attr("width", 42 * d.modes.length)
                    .attr("height", 42);

                d3.select(this)
                    .selectAll<SVGCircleElement, {}>("circle")
                    .data(d.modes)
                    .enter()
                    .append<SVGCircleElement>("circle")
                    .attr("id", uniqid())
                    .attr("r", 20)
                    .attr("data-mode", function(d) { return d.label })
                    .attr("transform", defaultTransformStr)
                    .classed("selected", function(d, i) { return i == 0; })
                    .each(function(d, i) {
                        SvgTransformServiceSingleton.setTranslation(this, {
                            x: i * 42,
                            y: 0
                        });
                    });

                SvgTransformServiceSingleton.setTranslation(<any>this, newBtnCoords);
            })
            .enter()
            .append("g")
            .attr("id", function(d) { return uniqid(); })
            .attr("data-name", function(d) { return d.buttonDataName })
            .attr("transform", defaultTransformStr)
            .classed(Names.Handles.BTN_HANDLE_CLASS, true);
    }

    public draw(): void {
        let self = this;

        // This should remain in the svg-handles-model.ts file
        // // Create the highlight rect
        // let hightlightRect = this.container
        //     .append<SVGRectElement>("rect")
        //     .attr("id", uniqid())
        //     .attr("data-name",
        //         Names.Handles.SubElements.HightlightRect.DATA_NAME)
        //     .attr("x", 0)
        //     .attr("y", 0)
        //     .attr("width", 0)
        //     .attr("height", 0);

        this.drawAndUpdate();

        // Add event listeners to the buttons
        this.buttonsContainer.select(`[data-name='${Names.Handles.SubElements.ButtonsContainer.SubElements.DeleteBtn.DATA_NAME}']`)
            .on("click", function() {
                self.onDeleteClickedHandlers.map(f => f())
            });

        this.modeChanged()
    }

    public update(): void {
        this.drawAndUpdate();
    }

    public erase(): void {

    }

    // [End Functions]
}