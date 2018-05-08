const uniqid = require("uniqid");

import * as d3 from "d3";

import { ActivatableServiceSingleton } from "../services/activatable-service";
import { Names } from "./names";

/**
 * This class moves the setup of the rotation related elements away from the
 * handles model into here. Otherwords this class exists soley for
 * organizational purposes.
 */
export class HandlesRotation {
    // [Fields]

    private isDisplayed: boolean;
    private rotationModeContainerEl: SVGGElement;
    private dialLineEl: SVGLineElement;
    private pivotPointEl: SVGCircleElement;
    private dashedOuterCircle: SVGCircleElement;

    // [End Fields]

    // [Ctor]

    public constructor(handlesContainer: SVGGElement) {
        this.isDisplayed = false;

        // Create the rotation mode container
        let rotationModeContainerEl = d3.select(handlesContainer)
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
            .node();

        if (pivotEl == null) {
            throw new Error("Failed to create the pivot point element.");
        }

        this.pivotPointEl = pivotEl;

        // Create the dial line
        let dialLineEl = d3.select(rotationModeContainerEl)
            .append<SVGLineElement>("line")
            .attr("id", uniqid())
            .attr("data-name", 
                Names.Handles.SubElements.RotationHelpersContainer
                .SubElements.DialLine.DATA_NAME)
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
            .node();

        if (dashedOuterCircle == null) {
            throw new Error("Failed to create the dashed outer circle.");
        }

        this.dashedOuterCircle = dashedOuterCircle;
    }

    // [End Ctor]

    // [Properties]

    // [End Properties]

    // [Functions]

    // [End Functions]
}
