import * as d3 from 'd3';

import { NS } from '../../helpers/namespaces-helper';
import { getAngle, getFurthestSvgOwner } from '../../helpers/svg-helpers';
import { ITransformable } from '../../models/itransformable';
import { ActivatableServiceSingleton } from '../../services/activatable-service';
import { ICoords2D, IRotationMatrix, SvgGeometryServiceSingleton, TransformType } from '../../services/svg-geometry-service';
import { SvgTransformString } from '../svg-transform-string';
import { IDOMDrawable } from './../idom-drawable';
import { Names } from './../names';

const uniqid = require("uniqid");

/**
 * This class moves the setup of the rotation related elements away from the
 * handles model into here. Otherwords this class exists soley for
 * organizational purposes.
 */
export class HandlesRotationOverlay implements IDOMDrawable<SVGGElement> {
    //#region Fields

    private container: SVGGElement;
    private dialLineEl: SVGLineElement;
    private dialPivotEl: SVGCircleElement;
    private element: SVGGElement;
    private pivotPointEl: SVGCircleElement;
    private pivotPointTransform: ITransformable;
    private dialPivotToPivotPointLine: SVGLineElement;
    private dashedOuterCircle: SVGCircleElement;
    private grabberCircle: SVGCircleElement;

    private _angle: number;

    public rotateIndividually: boolean;
    public rotateAroundPivot: boolean;
    public dialTransform: ITransformable;
    public grabberTransform: ITransformable;
    public onRotation: Array<(angle: IRotationMatrix) => void>;
    public radius: number;

    //#endregion

    //#region Ctor

    public constructor(container: SVGGElement) {
        let self = this;
        this.container = container;
        this.rotateAroundPivot = false;
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
        this.pivotPointTransform = new SvgTransformString([
            TransformType.TRANSLATE
        ]);

        this.grabberTransform.setTranslate({x: this.radius, y: 0}, 0);
        this.dialTransform.setRotation({a: 0}, 0);

        // Create elements.
        this.element = <SVGGElement>document
            .createElementNS(NS.SVG, "g");
        d3.select(this.element)
            .attr("id", uniqid())
            .attr("data-name", Names.Handles.SubElements.RotationHelpersContainer.DATA_NAME);
        
        this.dialLineEl = <SVGLineElement>document
            .createElementNS(NS.SVG, "line");
        d3.select(this.dialLineEl)
            .attr("id", uniqid())
            .attr("data-name", 
                Names.Handles.SubElements.RotationHelpersContainer
                .SubElements.DialLine.DATA_NAME)
            .attr("x1", 0)
            .attr("y1", 0)
            .attr("x2", 100)
            .attr("y2", 0)
            .attr("stroke", "black")
            .attr("transform", function(d) { 
                return self.dialTransform.toTransformString();
            });

        this.dialPivotEl = <SVGCircleElement>document
            .createElementNS(NS.SVG, "circle");
        d3.select(this.dialPivotEl)
            .attr("id", uniqid())
            .attr("data-name", Names.Handles.SubElements
                .RotationHelpersContainer.SubElements.DialPivot.DATA_NAME)
            .attr("r", 5);

        this.pivotPointEl = <SVGCircleElement>document
            .createElementNS(NS.SVG, "circle");
        d3.select(this.pivotPointEl)
            .attr("id", uniqid())
            .attr("data-name", Names.Handles.SubElements.RotationHelpersContainer
                .SubElements.PivotPoint.DATA_NAME)
            .attr("r", 5);

        this.dialPivotToPivotPointLine = <SVGLineElement>document
            .createElementNS(NS.SVG, "line");
        d3.select(this.dialPivotToPivotPointLine)
            .attr("id", () => uniqid())
            .attr("data-name", Names.Handles.SubElements
                .RotationHelpersContainer.SubElements.DialPivotToPivotPointLine
                .DATA_NAME)
            .attr("x1", 0)
            .attr("y1", 0)
            .attr("x2", 0)
            .attr("y2", 0)
            .attr("stroke", "rgba(0,0,0,.25)");

        this.dashedOuterCircle = <SVGCircleElement>document
            .createElementNS(NS.SVG, "circle");
        d3.select(this.dashedOuterCircle)
            .attr("id", uniqid())
            .attr("data-name", Names.Handles.SubElements
                .RotationHelpersContainer.SubElements.DashedOuterCircle
                .DATA_NAME)
            .attr("r", 100)
            .attr("fill", "none")
            .attr("stroke", "rgba(0,1,0,.25")
            .attr("stroke-dasharray", "5,5")
            .attr("stroke-width", "2")

        this.grabberCircle = <SVGCircleElement>document
            .createElementNS(NS.SVG, "circle");
        d3.select(this.grabberCircle)
            .attr("id", () => uniqid())
            .attr("data-name", Names.Handles.SubElements
                .RotationHelpersContainer.SubElements.Grabber.DATA_NAME)
            .attr("cx", 0)
            .attr("cy", 0)
            .attr("r", 5)
            .attr("transform", function(d) { 
                return self.grabberTransform.toTransformString();
            });

        // Compose elements.
        this.element.appendChild(this.dashedOuterCircle);
        this.element.appendChild(this.dialPivotEl);
        this.element.appendChild(this.dialLineEl);
        this.element.appendChild(this.dialPivotToPivotPointLine);
        this.element.appendChild(this.pivotPointEl);
        this.element.appendChild(this.grabberCircle);
    }

    //#endregion

    //#region Properties

    public get pivotPoint(): ICoords2D {
        return this.pivotPointTransform.getTranslate();
    }
    
    public set pivotPoint(value: ICoords2D) {
        this.pivotPointTransform.setTranslate(value);
    }

    public get angle() {
        return this._angle;
    }

    public set angle(value: number) {
        this._angle = value;
        this.dialTransform.setRotation({a: this.angle}, 0);
        this.grabberTransform.setRotation({a: this.angle}, 0);
    }

    //#endregion

    //#region Functions

    public draw(): void {
        this.getContainer().appendChild(this.getElement());

        /** Add event listeners */
        let self = this;
        let furthestSvg = getFurthestSvgOwner(this.element);

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

        // Update the dial line
        d3.select(this.dialLineEl)
            .data([self.angle])
            .attr("x2", this.radius)
            .attr("transform", function(d) {
                return self.dialTransform.toTransformString();
            });

        // Update the dashed outer circle
        if (this.dashedOuterCircle) {
            d3.select(this.dashedOuterCircle)
                .attr("r", this.radius)
        }

        // Update the pivot point
        if (this.pivotPoint && this.pivotPointEl) {
            ActivatableServiceSingleton.activate(<any>this.pivotPointEl);
            ActivatableServiceSingleton.activate(<any>this.dialPivotToPivotPointLine);
            d3.select(<any>this.dialPivotToPivotPointLine)
                .attr("x2", this.pivotPoint.x)
                .attr("y2", this.pivotPoint.y);
            d3.select(<any>this.pivotPointEl)
                .attr("transform", this.pivotPointTransform.toTransformString());
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
        this.getElement().remove();
    }

    public getContainer(): Element {
        return this.container;
    }

    public getElement(): SVGGElement {
        return this.element;
    }

    //#endregion
}
