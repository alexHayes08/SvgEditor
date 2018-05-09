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
    private radius: number;

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
    public readonly onDeleteClickedHandlers: Function[];

    private readonly data: IMainOverlayData[] = [
        {
            angle: 90,
            arcDataName: Names.Handles.SubElements.ArcsContainer.SubElements.FillArc.DATA_NAME,
            buttonDataName: "",
            modes: []
        },
        {
            angle: 45,
            arcDataName: Names.Handles.SubElements.ArcsContainer.SubElements.ColorsArc.DATA_NAME,
            buttonDataName: Names.Handles.SubElements.ButtonsContainer.SubElements.ColorsBtn.DATA_NAME,
            modes: [{ label: "Colors" }]
        },
        {
            angle: 45,
            arcDataName: Names.Handles.SubElements.ArcsContainer.SubElements.EditArc.DATA_NAME,
            buttonDataName: Names.Handles.SubElements.ButtonsContainer.SubElements.EditBtn.DATA_NAME,
            modes: [{ label: "Edit" }]
        },
        {
            angle: 90,
            arcDataName: Names.Handles.SubElements.ArcsContainer.SubElements.FillArc.DATA_NAME,
            buttonDataName: "",
            modes: [{ label: "Fill" }]
        },
        {
            angle: 22.5,
            arcDataName: Names.Handles.SubElements.ArcsContainer.SubElements.ScaleArc.DATA_NAME,
            buttonDataName: Names.Handles.SubElements.ButtonsContainer.SubElements.ScaleBtn.DATA_NAME,
            modes: [{ label: "Scale" }]
        },
        {
            angle: 22.5,
            arcDataName: Names.Handles.SubElements.ArcsContainer.SubElements.RotateArc.DATA_NAME,
            buttonDataName: Names.Handles.SubElements.ButtonsContainer.SubElements.RotateBtn.DATA_NAME,
            modes: [{ label: "Rotate" }]
        },
        {
            angle: 22.5,
            arcDataName: Names.Handles.SubElements.ArcsContainer.SubElements.PanArc.DATA_NAME,
            buttonDataName: Names.Handles.SubElements.ButtonsContainer.SubElements.PanBtn.DATA_NAME,
            modes: [{ label: "Pan" }]
        },
        {
            angle: 22.5,
            arcDataName: Names.Handles.SubElements.ArcsContainer.SubElements.DeleteArc.DATA_NAME,
            buttonDataName: Names.Handles.SubElements.ButtonsContainer.SubElements.DeleteBtn.DATA_NAME,
            modes: [{ label: "Delete" }]
        }
    ];

    private readonly buttonsData: IMainOverlayData[];

    // [End Fields]

    // [Ctor]

    public constructor(container: d3.Selection<SVGGElement, {}, null, undefined>) {
        this.container = container;
        this._mode = HandleModes.PAN;
        this.defaultWidth = 4;
        this.radius = 100;
        this.onDeleteClickedHandlers = [];

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

    get mode() {
        return this._mode;
    }

    set mode(value: HandleModes) {
        if (this.mode != value) {
            this.mode = value;
            this.modeChanged();
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

    private setPathFunc(d: d3.PieArcDatum<IMainOverlayData>)
    {
        return d3.arc()({
            innerRadius: this.radius,
            outerRadius: this.radius - this.defaultWidth,
            startAngle: d.startAngle,
            endAngle: d.endAngle
        });
    }

    private drawAndUpdate(): void {
        let self = this;
        
        // Draw arcs
        let pieData = d3.pie<IMainOverlayData>()
            .startAngle(toRadians(135))
            .endAngle(toRadians(360 - 135))
            .value(function(d) { return d.angle; })
            .sortValues(function(a: number, b: number) {
                return a;
            })(this.data);

        this.arcsContainer
            .selectAll("path")
            .data(pieData)
            .attr("d", this.setPathFunc)
            .enter()
            .append("path")
            .attr("d", this.setPathFunc)
            .attr("data-name", function(d) { return d.data.arcDataName; });

        // Draw buttons
        this.buttonsContainer
            .selectAll<SVGGElement, {}>("g")
            .data(this.buttonsData)
            .enter()
            .append("g")
                .attr("id", function(d) { return uniqid(); })
                .attr("data-name", function(d) { return d.buttonDataName })
            .each(function(d, i, nodes) {
                let arcEl = self.arcsContainer
                    .select<SVGPathElement>(`*[data-name='${d.arcDataName}']`)
                    .node();

                if (arcEl == undefined) {
                    return;
                }

                let relativeTo = { x: 0, y: 0 };
                let arcCenter = SvgTransformServiceSingleton
                    .getCenterRelativeToPoint(relativeTo, arcEl);
                let newBtnCoords = getNewPointAlongAngle(arcCenter, self.radius);

                let background = d3.select(this)
                    .append("rect")
                        .attr("id", uniqid())
                        .attr("x", 0)
                        .attr("y", 0)
                        .attr("rx", 10)
                        .attr("ry", 10)
                        .attr("width", 20 * d.modes.length)
                        .attr("height", 20)
                    .data(d.modes)
                    .enter()
                    .append("circle")
                        .attr("id", uniqid())
                        .attr("r", 20)
                        .attr("data-mode", function(d) { return d.label });

                SvgTransformServiceSingleton.setTranslation(<any>this, newBtnCoords);
            });
    }

    public draw(): void {
        let self = this;

        // Add event listeners to the buttons
        this.buttonsContainer.select(`[data-name='${Names.Handles.SubElements.ButtonsContainer.SubElements.DeleteBtn.DATA_NAME}']`)
            .on("click", function() {
                self.onDeleteClickedHandlers.map(f => f())
            });

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
    }

    public update(): void {
        this.drawAndUpdate();
    }

    public erase(): void {

    }

    // [End Functions]
}