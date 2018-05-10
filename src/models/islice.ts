const uniqid = require("uniqid");

import * as d3 from "d3";
import { toRadians } from "../helpers/math-helpers";
import { Names } from "./names";
import { SvgTransformService, SvgTransformServiceSingleton } from "../services/svg-transform-service";
import { isSvgElement, getNewPointAlongAngle, convertToSvgElement } from "../helpers/svg-helpers";

export interface ICircleArc {
    slices: ISlice[];
    startAngleOffset: number;
    defaultColor: string;
    radius: number;
    defaultWidth: number;
    draw(parentElement: SVGGraphicsElement): void;
}

export interface ICircleArcConfig {
    slices: ISlice[];
    startAngleOffset?: number;
    defaultColor?: string;
    radius: number;
    defaultWidth?: number;
}

export interface ISlice {
    angle: number;
    color?: string;
    name?: string;
    width?: number;
    button?: {
        id?: string;
        color?: string;
        radius?: number;
        dataName: string;
    }
}

export function isISlice(obj: any): obj is ISlice {    
    if (obj.color && obj.angle) {
        return true;
    } else {
        return false;
    }
}

export class DefaultCircleArc implements ICircleArc {
    // [Fields]

    public slices: ISlice[];
    public startAngleOffset: number;
    public defaultColor: string;
    public radius: number;
    public defaultWidth: number;
    public transformService: SvgTransformService;

    // [End Fields]

    // [Ctor]

    constructor(data: ICircleArcConfig) {
        this.slices = data.slices;
        this.defaultColor = data.defaultColor || "black";
        this.radius = data.radius || 100;
        this.startAngleOffset = data.startAngleOffset || 0;
        this.defaultWidth = data.defaultWidth || 4;
        this.transformService = SvgTransformServiceSingleton;
    }

    // [Functions]

    /**
     * Creates or updates path elements of the parent element to draw the
     * arcs.
     * @param parentElement - The element the paths elements will be created
     * or updated in.
     */
    public draw(parentElement: SVGGraphicsElement): void {

        // Capture vars
        let { radius, defaultWidth, defaultColor } = this;

        // Create the data used for creating the arcs
        let pieData = d3.pie<ISlice>()
            .startAngle(toRadians(this.startAngleOffset))
            .endAngle(toRadians(this.startAngleOffset - 360))
            .value(function(d) { return d.angle; })
            .sortValues(function(a: number, b: number) {
                return a;
            })
            (this.slices);

        let defaultTransformStr = this.transformService.defaultTransformString;
        this.transformService.setTranslation(parentElement, { x: 0, y: 0 });

        let setPathFunc = function(d: d3.PieArcDatum<ISlice>) {
            let w = d.data.width || defaultWidth;

            return d3.arc()({
                    innerRadius: radius,
                    outerRadius: radius - w,
                    startAngle: d.startAngle,
                    endAngle: d.endAngle
                });
        }

        let handles = d3.select(parentElement)
            .selectAll("path")
            .data(pieData)
            .attr("d", setPathFunc)
            .enter()
            .append("path")
            .attr("d", setPathFunc)
            .attr("fill", function(d) { return d.data.color || defaultColor })
            .attr("stroke", function(d) { return d.data.color || defaultColor })
            .attr("data-name", function(d) { return d.data.name || "" });

        let buttonData = pieData
            .filter(d => d.data.button != undefined);
        let buttons = d3.select(parentElement)
            .selectAll("circle")
            .data(buttonData)
            .enter()
            .append("circle")
            .attr("id", function(d) {
                if (d.data.button == undefined || d.data.button.id == undefined) {
                    return uniqid();
                } else {
                    return d.data.button.id;
                }
            })
            .attr("class", Names.Handles.BTN_HANDLE_CLASS)
            .attr("data-name", function(d) { 
                if (d.data.button == undefined) {
                    return "";
                } else {
                    return d.data.button.dataName;
                }
            })
            .attr("r", 20)
            .attr("cx", 0)
            .attr("cy", 0)
            .attr("transform", defaultTransformStr);

        // Get the updated circles bbox
        let $parentEl = $(parentElement);
        let deleteArc = $parentEl.find("*[data-name='close-arc']")[0];
        let moveArc = $parentEl.find("*[data-name='pan-arc']")[0];
        let scaleArc = $parentEl.find("*[data-name='scale-arc']")[0];
        let rotateArc = $parentEl.find("*[data-name='rotate-arc']")[0];
        let colorArc = $parentEl.find("*[data-name='color-arc']")[0];
        let editArc = $parentEl.find("*[data-name='edit-arc']")[0];

        let deleteEl = convertToSvgElement($parentEl.find("*[data-name='handle-delete']")[0]);
        let moveEl = convertToSvgElement($parentEl.find("*[data-name='handle-move']")[0]);
        let rotateEl = convertToSvgElement($parentEl.find("*[data-name='handle-rotate']")[0]);
        let scaleEl = convertToSvgElement($parentEl.find("*[data-name='handle-scale']")[0]);
        let colorEl = convertToSvgElement($parentEl.find("*[data-name='handle-colors']")[0]);
        let editEl = convertToSvgElement($parentEl.find("*[data-name='handle-edit']")[0]);

        if (!isSvgElement(deleteArc)
            || !isSvgElement(moveArc)
            || !isSvgElement(scaleArc)
            || !isSvgElement(rotateArc)
            || !isSvgElement(colorArc)
            || !isSvgElement(editArc))
        {
            throw new Error("Failed to find the delete arc.");
        }

        let relativeTo = { x: 0, y: 0 };
        let deleteArcCenter = SvgTransformServiceSingleton.getCenterRelativeToPoint(relativeTo, deleteArc);
        let moveArcCenter = SvgTransformServiceSingleton.getCenterRelativeToPoint(relativeTo, moveArc);
        let scaleArcCenter = SvgTransformServiceSingleton.getCenterRelativeToPoint(relativeTo, scaleArc);
        let rotateArcCenter = SvgTransformServiceSingleton.getCenterRelativeToPoint(relativeTo, rotateArc);
        let colorArcCenter = SvgTransformServiceSingleton.getCenterRelativeToPoint(relativeTo, colorArc);
        let editArcCenter = SvgTransformServiceSingleton.getCenterRelativeToPoint(relativeTo, editArc);

        // TODO: Make these variables, not sure where to pass these in...
        const PADDING_BETWEEN_ARC_AND_BTN = 10;
        const BUTTON_RADIUS = 10;

        // The distance between the arc and btn center.
        let hyp_3 = (PADDING_BETWEEN_ARC_AND_BTN + BUTTON_RADIUS + 20) + radius;
        let deleteBtn_newCoords = getNewPointAlongAngle(relativeTo, deleteArcCenter, hyp_3);
        let moveBtn_newCoords = getNewPointAlongAngle(relativeTo, moveArcCenter, hyp_3);
        let scaleBtn_newCoords = getNewPointAlongAngle(relativeTo, scaleArcCenter, hyp_3);
        let rotateBtn_newCoords = getNewPointAlongAngle(relativeTo, rotateArcCenter, hyp_3);
        let colorBtn_newCoords = getNewPointAlongAngle(relativeTo, colorArcCenter, hyp_3);
        let editBtn_newCoords = getNewPointAlongAngle(relativeTo, editArcCenter, hyp_3);

        // Update btn positions
        SvgTransformServiceSingleton.setTranslation(deleteEl, deleteBtn_newCoords);
        SvgTransformServiceSingleton.setTranslation(moveEl, moveBtn_newCoords);
        SvgTransformServiceSingleton.setTranslation(scaleEl, scaleBtn_newCoords);
        SvgTransformServiceSingleton.setTranslation(rotateEl, rotateBtn_newCoords);
        SvgTransformServiceSingleton.setTranslation(colorEl, colorBtn_newCoords);
        SvgTransformServiceSingleton.setTranslation(editEl, editBtn_newCoords);
    }

    // [Functions]
}