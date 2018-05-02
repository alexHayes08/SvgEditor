import * as d3 from "d3";
import { toRadians } from "../helpers/math-helpers";

export interface ICircleArc {
    slices: ISlice[];
    startAngleOffset: number;
    defaultColor: string;
    radius: number;
    defaultWidth: number;
    draw(parentElement: SVGElement): void;
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

    // [End Fields]

    // [Ctor]

    constructor(data: ICircleArcConfig) {
        this.slices = data.slices;
        this.defaultColor = data.defaultColor || "black";
        this.radius = data.radius || 100;
        this.startAngleOffset = data.startAngleOffset || 0;
        this.defaultWidth = data.defaultWidth || 4;
    }

    // [Functions]

    /**
     * Creates or updates path elements of the parent element to draw the
     * arcs.
     * @param parentElement - The element the paths elements will be created
     * or updated in.
     */
    public draw(parentElement: SVGElement): void {

        // Capture vars
        let { radius, defaultWidth, defaultColor } = this;

        // Create the data used for creating the arcs
        let pieData = d3.pie<ISlice>()
            .startAngle(toRadians(this.startAngleOffset))
            .endAngle(toRadians(this.startAngleOffset - 360))
            .value(function(d) { return d.angle; })
            (this.slices);

        let handles = d3.select(parentElement)
            .selectAll("path")
            .data(pieData)
            .enter()
            .append("path")
            .attr("d", function(d) {
                let w = d.data.width || defaultWidth;

                return d3.arc()({
                    outerRadius: radius,
                    innerRadius: radius - w,
                    startAngle: d.startAngle,
                    endAngle: d.endAngle
                });
            })
            .attr("fill", function(d) { return d.data.color || defaultColor })
            .attr("stroke", function(d) { return d.data.color || defaultColor })
            .attr("data-name", function(d) { return d.data.name || "" });
    }

    // [Functions]
}