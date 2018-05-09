const uniqid = require("uniqid");

import * as d3 from "d3";

import { ActivatableServiceSingleton } from "../services/activatable-service";
import { IDrawable } from './idrawable';
import { Names } from "./names";

/**
 * This class moves the setup of the rotation related elements away from the
 * handles model into here. Otherwords this class exists soley for
 * organizational purposes.
 */
export class HandlesRotation implements IDrawable {
    // [Fields]

    private container: SVGGElement;

    private isDisplayed: boolean;
    private rotationModeContainerEl?: SVGGElement;
    private dialLineEl?: SVGLineElement;
    private dialPivotEl?: SVGCircleElement;
    private pivotPointEl?: SVGCircleElement;
    private dashedOuterCircle?: SVGCircleElement;

    // [End Fields]

    // [Ctor]

    public constructor(handlesContainer: SVGGElement) {
        this.container = handlesContainer;
        this.isDisplayed = false;

        this.draw();
    }

    // [End Ctor]

    // [Properties]

    // [End Properties]

    // [Functions]

    public draw(): void {
        // Create the rotation mode container
        let rotationModeContainerEl = d3.select(this.container)
            .append<SVGGElement>("g")
            .attr("id", uniqid())
            .attr("data-name",
                Names.Handles.SubElements.RotationHelpersContainer.DATA_NAME)
            .node();

        if (rotationModeContainerEl == null) {
            throw new Error("Failed to create the rotation mode container element.");
        }

        this.rotationModeContainerEl = rotationModeContainerEl;

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

        // Apply activatable to the container
        ActivatableServiceSingleton.register(this.container, false);
    }

    public update(): void {

    }

    public erase(): void {

    }

    // [End Functions]
}
