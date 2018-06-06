const uniqid = require("uniqid");

import * as d3 from "d3";

import { ActivatableServiceSingleton } from "../../services/activatable-service";
import { IContainer } from "./../icontainer";
import { IDrawable } from './../idrawable';
import { Names } from "./../names";
import { 
    SvgGeometryServiceSingleton, 
    ICoords2D, 
    SvgTransformString, 
    TransformType, 
    ITransformable, 
    IRotationMatrix 
} from "../../services/svg-geometry-service";
import { getFurthestSvgOwner, getAngle } from "../../helpers/svg-helpers";

/**
 * This class moves the setup of the rotation related elements away from the
 * handles model into here. Otherwords this class exists soley for
 * organizational purposes.
 */
export class HandlesRotationOverlay implements IContainer, IDrawable {
    //#region Fields

    private rotationModeContainerEl?: SVGGElement;
    private dialLineEl?: SVGLineElement;
    private dialPivotEl?: SVGCircleElement;
    private pivotPointEl?: SVGCircleElement;
    private dialPivotToPivotPointLine?: SVGLineElement;
    private dashedOuterCircle?: SVGCircleElement;
    private grabberCircle?: SVGCircleElement;

    private _angle: number;

    public rotateIndividually: boolean;
    public container: d3.Selection<SVGGElement, {}, null, undefined>;
    public containerNode: SVGGElement;
    public dialTransform: ITransformable;
    public grabberTransform: ITransformable;
    public onRotation: Array<(angle: IRotationMatrix) => void>;
    public pivotPointTransform?: ITransformable;
    public pivotPoint?: ICoords2D;
    public radius: number;

    //#endregion

    //#region Ctor

    public constructor(container: d3.Selection<SVGGElement, {}, null, undefined>) {
        this.container = container;
        this.rotateIndividually = true;
        this.radius = 100;
        this._angle = 0;
        this.onRotation = [];
        this.grabberTransform = new SvgTransformString([
            TransformType.ROTATE,
            TransformType.TRANSLATE
        ]);
        this.dialTransform = new SvgTransformString([
            TransformType.ROTATE
        ]);

        this.grabberTransform.setTranslate({x: this.radius, y: 0}, 0);
        this.dialTransform.setRotation({a: 0}, 0);

        let containerNode = this.container.node();
        if (!containerNode) {
            throw new Error("The container didn't exist.");
        }

        this.containerNode = containerNode;
    }

    //#endregion

    //#region Properties

    get angle() {
        return this._angle;
    }

    set angle(value: number) {
        this._angle = value;
        this.dialTransform.setRotation({a: this.angle}, 0);
        this.grabberTransform.setRotation({a: this.angle}, 0);
    }

    //#endregion

    //#region Functions

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
            .data([this.dialTransform])
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
            .attr("transform", function(d) { return d.toTransformString(); })
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
            .attr("id", () => uniqid())
            .attr("data-name", Names.Handles.SubElements
                .RotationHelpersContainer.SubElements.DialPivotToPivotPointLine
                .DATA_NAME)
            .attr("x1", 0)
            .attr("y1", 0)
            .attr("x2", 0)
            .attr("y2", 0)
            .attr("stroke", "rgba(0,0,0,.25)");
        
        let grabberCircle = d3.select(rotationModeContainerEl)
            .append<SVGCircleElement>("circle")
            .data([this.grabberTransform])
            .attr("id", () => uniqid())
            .attr("data-name", Names.Handles.SubElements
                .RotationHelpersContainer.SubElements.Grabber.DATA_NAME)
            .attr("cx", 0)
            .attr("cy", 0)
            .attr("r", 5)
            .attr("transform", function(d) { return d.toTransformString(); })
            .node();

        if (grabberCircle == undefined) {
            throw new Error("Failed to create the rotation grabber element.");
        }

        this.grabberCircle = grabberCircle;

        /** Add event listeners */
        let self = this;
        let furthestSvg = getFurthestSvgOwner(this.containerNode);

        d3.select<Element, {}>(this.grabberCircle)
            .call(d3.drag()
                .container(furthestSvg)
                .on("start", function() {
                    console.log("Drag started (Rotation grabber).");
                }).on("drag", function() {
                    if (self.dialPivotEl
                        && self.grabberCircle) 
                    {
                        let relativeMouseCoords = SvgGeometryServiceSingleton
                            .convertScreenCoordsToSvgCoords(
                                d3.event.sourceEvent, furthestSvg);

                        let pivotCenter = SvgGeometryServiceSingleton
                            .getCenter(self.dialPivotEl);

                        self.angle = getAngle(pivotCenter, relativeMouseCoords);
                        // console.log(self.angle);
                        self.update();

                        for (let func of self.onRotation) {
                            func({
                                a: self.angle,
                                cx: pivotCenter.x,
                                cy: pivotCenter.y
                            });
                        }
                    }
                }).on("end", function() {
                    console.log("Drag ended (Rotation grabber)");
                }));

        /** End Add event listeners */
    }

    public update(): void {
        let self = this;

        // Check that none of the elements are null
        if (!this.assertElementsExist()) {
            throw new Error("Some of the elements were undefined.");
        }

        // Update the dial line
        d3.select(<any>this.dialLineEl)
            .data([self.angle])
            .attr("x2", this.radius);

        SvgGeometryServiceSingleton.setRotation(<any>this.dialLineEl, 
            { a: this.angle });

        // Update the dashed outer circle
        if (this.dashedOuterCircle) {
            d3.select(this.dashedOuterCircle)
                .attr("r", this.radius)
        }

        // Update the pivot point
        if (this.pivotPoint) {
            ActivatableServiceSingleton.activate(<any>this.pivotPointEl);
            ActivatableServiceSingleton.activate(<any>this.dialPivotToPivotPointLine);
            SvgGeometryServiceSingleton.setTranslation(<any>this.pivotPointEl,
                this.pivotPoint);
            d3.select(<any>this.dialPivotToPivotPointLine)
                .attr("x2", this.pivotPoint.x)
                .attr("y2", this.pivotPoint.y);
        } else {
            ActivatableServiceSingleton.deactivate(<any>this.pivotPointEl);
            ActivatableServiceSingleton.deactivate(<any>this.dialPivotToPivotPointLine);
        }

        // Update grabber position
        if (this.grabberCircle) {
            d3.select(this.grabberCircle)
                .data([this.grabberTransform])
                .attr("transform", function(d) {
                    d.setTranslate({ x: self.radius, y: 0 }, 0);
                    return d.toTransformString()
                });
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
            || this.pivotPointEl == undefined
            || this.grabberCircle == undefined)
        {
            return false;
        } else {
            return true;
        }
    }

    //#endregion
}
