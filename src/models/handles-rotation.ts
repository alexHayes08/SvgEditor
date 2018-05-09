const uniqid = require("uniqid");

import * as d3 from "d3";

import { ActivatableServiceSingleton } from "../services/activatable-service";
import { IContainer } from "./icontainer";
import { IDrawable } from './idrawable';
import { Names } from "./names";
import { SvgTransformServiceSingleton, ICoords2D } from "../services/svg-transform-service";

/**
 * This class moves the setup of the rotation related elements away from the
 * handles model into here. Otherwords this class exists soley for
 * organizational purposes.
 */
export class HandlesRotationOverlay implements IContainer, IDrawable {
    // [Fields]

    private rotationModeContainerEl?: SVGGElement;
    private dialLineEl?: SVGLineElement;
    private dialPivotEl?: SVGCircleElement;
    private pivotPointEl?: SVGCircleElement;
    private dialPivotToPivotPointLine?: SVGLineElement;
    private dashedOuterCircle?: SVGCircleElement;

    public container: d3.Selection<SVGGElement, {}, null, undefined>;
    public containerNode: SVGGElement;
    public angle: number;
    public radius: number;
    public pivotPoint?: ICoords2D;

    // [End Fields]

    // [Ctor]

    public constructor(container: d3.Selection<SVGGElement, {}, null, undefined>) {
        this.container = container;
        this.radius = 100;
        this.angle = 0;

        let containerNode = this.container.node();
        if (!containerNode) {
            throw new Error("The container didn't exist.");
        }

        this.containerNode = containerNode;
    }

    // [End Ctor]

    // [Properties]

    // [End Properties]

    // [Functions]

    public draw(): void {

        // Create the rotation mode container
        let rotationModeContainerEl = this.container
            .append<SVGGElement>("g")
            .attr("id", uniqid())
            .attr("data-name",
                Names.Handles.SubElements.RotationHelpersContainer.DATA_NAME)
            .node();

        if (rotationModeContainerEl == null) {
            throw new Error("Failed to create the rotation mode container element.");
        }

        this.rotationModeContainerEl = rotationModeContainerEl;
        ActivatableServiceSingleton.register(this.containerNode, false);

        // Create the rotation pivot element
        let pivotEl = d3.select(rotationModeContainerEl)
            .append<SVGCircleElement>("circle")
            .attr("id", uniqid())
            .attr("data-name",
                Names.Handles.SubElements.RotationHelpersContainer
                .SubElements.PivotPoint.DATA_NAME)
            .attr("r", 5)
            .node();

        if (pivotEl == null) {
            throw new Error("Failed to create the pivot point element.");
        }

        this.pivotPointEl = pivotEl;
        ActivatableServiceSingleton.register(this.pivotPointEl, false);

        // Create the dial pivot point el
        let dialPivotEl = d3.select(rotationModeContainerEl)
            .append<SVGCircleElement>("circle")
            .attr("id", uniqid())
            .attr("data-name", Names.Handles.SubElements
                .RotationHelpersContainer.SubElements.DialPivot.DATA_NAME)
            .attr("r", 5)
            .node();

        if (dialPivotEl == null) {
            throw new Error("Failed to create the dial pivot element.");
        }

        this.dialPivotEl = dialPivotEl;

        // Create the dial line
        let dialLineEl = d3.select(rotationModeContainerEl)
            .append<SVGLineElement>("line")
            .attr("id", uniqid())
            .attr("data-name", 
                Names.Handles.SubElements.RotationHelpersContainer
                .SubElements.DialLine.DATA_NAME)
            .attr("x1", 0)
            .attr("y1", 0)
            .attr("x2", 100)
            .attr("y2", 0)
            .attr("stroke", "black")
            .node();

        if (dialLineEl == null) {
            throw new Error("Failed to create the dial line element.");
        }

        this.dialLineEl = dialLineEl;

        // Create the dashed outline circle
        let dashedOuterCircle = d3.select(rotationModeContainerEl)
            .append<SVGCircleElement>("circle")
            .attr("id", uniqid())
            .attr("data-name", Names.Handles.SubElements
                .RotationHelpersContainer.SubElements.DashedOuterCircle.DATA_NAME)
            .attr("r", 100)
            .attr("fill", "none")
            .attr("stroke", "rgba(0,1,0,.25")
            .attr("stroke-dasharray", "5,5")
            .attr("stroke-width", "2")
            .node();

        if (dashedOuterCircle == null) {
            throw new Error("Failed to create the dashed outer circle.");
        }

        this.dashedOuterCircle = dashedOuterCircle;

        // Create the dial pivot to pivot point line
        let dialPivotToPivotPointLine = d3.select(rotationModeContainerEl)
            .append<SVGLineElement>("line")
            .attr("id", uniqid())
            .attr("data-name", Names.Handles.SubElements
                .RotationHelpersContainer.SubElements.DialPivotToPivotPointLine
                .DATA_NAME)
            .attr("x1", 0)
            .attr("y1", 0)
            .attr("x2", 0)
            .attr("y2", 0)
            .attr("stroke", )
    }

    public update(): void {

        // Check that none of the elements are null
        if (this.assertElementsExist()) {
            throw new Error("Some of the elements were undefined.");
        }

        // Update the dial line
        d3.select(<any>this.dialLineEl)
            .attr("x2", this.radius);

        SvgTransformServiceSingleton.setRotation(<any>this.dialLineEl, 
            { a: this.angle });

        // Update the dashed outer circle
        d3.select(<any>this.dashedOuterCircle)
            .attr("r", this.radius);

        // Update the pivot point
        if (this.pivotPoint) {
            ActivatableServiceSingleton.activate(<any>this.pivotPointEl);
            ActivatableServiceSingleton.activate(<any>this.dialPivotToPivotPointLine);
            SvgTransformServiceSingleton.setTranslation(<any>this.pivotPointEl,
                this.pivotPoint);
            d3.select(<any>this.dialPivotToPivotPointLine)
                .attr("x2", this.pivotPoint.x)
                .attr("y2", this.pivotPoint.y);
        } else {
            ActivatableServiceSingleton.deactivate(<any>this.pivotPointEl);
            ActivatableServiceSingleton.deactivate(<any>this.dialPivotToPivotPointLine);
        }
    }

    public erase(): void {
        // Check that none of the elements are null
        if (!this.assertElementsExist()) {
            throw new Error("Some of the elements were undefined.");
        }
    }

    private assertElementsExist(): boolean {

        // Check that none of the elements are null
        if (this.dashedOuterCircle == undefined
            || this.dialLineEl == undefined
            || this.dialPivotEl == undefined
            || this.pivotPointEl == undefined)
        {
            return false;
        } else {
            return true;
        }
    }

    // [End Functions]
}
