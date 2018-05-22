const uniqid = require("uniqid");

import * as d3 from "d3";

import { ActivatableServiceSingleton } from "../services/activatable-service";
import { Angle } from "./angle";
import { HandlesRotationOverlay } from "./handles-rotation";
import { IContainer } from "./icontainer";
import { IDrawable } from './idrawable';
import { Names } from "./names";
import { SvgEditor } from "./svg-editor-model";
import { SvgCanvas } from "./svg-canvas-model";
import { 
    SvgTransformServiceSingleton, 
    ICoords2D, 
    ITransformable, 
    SvgTransformString,
    TransformType
} from "../services/svg-transform-service";
import { getPolygonPointsString } from "../helpers/svg-helpers";
import { SvgColors, SvgItem } from "./svg-item-model";
import { toDegrees } from "../helpers/math-helpers";
import { LinearGradient } from "./element-wrappers/linear-gradient";
import { StopData } from "./element-wrappers/stop-data";
import { SvgNumber } from "./svg-number";
import { NS } from "../helpers/namespaces-helper";

interface IColorsOverlayData {
    startOffsetAngle: number;
    color: d3.ColorSpaceObject;
    transforms: ITransformable;
}

interface SvgItemToColor {
    item: SvgItem,
    color: SvgColors
}

const LinearGradientsContainerName = "linear-gradients-container";

export class HandlesColorsOverlay implements IContainer, IDrawable {
    //#region Fields

    private readonly canvas: SvgCanvas;
    private readonly colorBtnTransform: ITransformable;
    private readonly colorPickerTransform: ITransformable;
    private readonly colorRingTransform: ITransformable;
    private readonly svgItemToLinearGradientMap: Map<SvgColors,LinearGradient>;
    private data: IColorsOverlayData[];
    
    private colorRingContainer?: d3.Selection<SVGGElement, {}, null, undefined>;
    private elementColorContainer?: d3.Selection<SVGGElement, {}, null, undefined>;
    private colorPickerContainer?: d3.Selection<SVGGElement, {}, null, undefined>;

    public container: d3.Selection<SVGGElement, {}, null, undefined>;
    public containerNode: SVGGElement;
    public radius: number;

    //#endregion

    //#region Ctor

    public constructor(container: d3.Selection<SVGGElement, {}, null, undefined>,
        canvas: SvgCanvas)
    {
        this.colorBtnTransform = new SvgTransformString([
            TransformType.ROTATE,
            TransformType.TRANSLATE,
            TransformType.ROTATE
        ]).setTranslate({ x: -40, y: 0 });
        this.colorPickerTransform = new SvgTransformString([
            TransformType.ROTATE,
            TransformType.TRANSLATE,
            TransformType.ROTATE
        ]);
        this.colorRingTransform = new SvgTransformString([
            TransformType.ROTATE,
            TransformType.TRANSLATE,
            TransformType.ROTATE
        ]);
        this.container = container;
        this.data = [];
        this.canvas = canvas;
        this.radius = 100;
        this.svgItemToLinearGradientMap = new Map();
        
        let containerNode = this.container.node();
        if (containerNode == undefined) {
            throw new Error("The container was undefined.");
        }
        this.containerNode = containerNode;

        this.canvas.defs.createSection(LinearGradientsContainerName);
    }

    //#endregion

    //#region Functions

    private calcAngle(): number {
        let distanceBetweenBtnCenters = 50;
        let angle = Math.asin(distanceBetweenBtnCenters / this.radius);
        return toDegrees(angle);
    }

    public draw(): void {
        let self = this;
        
        this.colorRingContainer = this.container
            .append<SVGGElement>("g")
            .attr("data-name", Names.Handles.SubElements.ColorsHelperContainer
                .SubElements.ColorRingContainer.DATA_NAME);
        this.elementColorContainer = this.container
            .append<SVGGElement>("g")
            .attr("data-name", Names.Handles.SubElements.ColorsHelperContainer
                .SubElements.ElementColorContainer.DATA_NAME);
        this.colorPickerContainer = this.container
            .append<SVGGElement>("g")
            .attr("data-name", Names.Handles.SubElements.ColorsHelperContainer
                .SubElements.ColorPickerContainer.DATA_NAME);
    }

    public update(): void {
        let self = this;
        if (this.canvas.handles == undefined
            || this.colorRingContainer == undefined
            || this.elementColorContainer == undefined
            || this.colorPickerContainer == undefined) 
        {
            return;
        }

        let colorGroups: SvgItemToColor[] = [];
        this.canvas.handles
            .getSelectedObjects()
            .map(so => {
                so.colors.map(c => {
                    if (c != undefined) {
                        colorGroups.push({ item: so, color: c });
                    }
                });
            });

        console.log(colorGroups);

        // Update
        let update = d3.select(this.canvas.defs.getSectionElement(LinearGradientsContainerName))
            .selectAll<SVGLinearGradientElement, {}>("linearGradient")
            .data(colorGroups)
            .each(function(d) {
                
            });

        // Draw
        update.enter().append<SVGLinearGradientElement>(function(d) {
            return <SVGLinearGradientElement>document
                .createElementNS(NS.SVG, "linearGradient");
        });

        // Erase extras
        update.exit().remove();

        // // Clear out color map?
        // this.svgItemToLinearGradientMap.clear();

        // colorGroups.map(cg => {
        //     let id = uniqid();
        //     let linearGradient = new LinearGradient();
            
        //     let fill: d3.ColorSpaceObject;
        //     if (cg.fill && typeof cg.fill != "number") {
        //         fill = cg.fill;
        //     } else {
        //         fill = d3.color("transparent");
        //     }
        //     linearGradient.setStop(0, new StopData(fill, new SvgNumber("0%")));
        //     linearGradient.setStop(1, new StopData(fill, new SvgNumber("50%")));

        //     let stroke: d3.ColorSpaceObject;
        //     if (cg.stroke && typeof cg.stroke != "number") {
        //         stroke = cg.stroke;
        //     } else {
        //         stroke = d3.color("transparent");
        //     }
        //     linearGradient.setStop(2, new StopData(fill, new SvgNumber("51%")));
        //     linearGradient.setStop(3, new StopData(fill, new SvgNumber("100%")));
        //     linearGradient.draw();

        //     let linearGradientEl = linearGradient.getElement();
        //     linearGradientEl.id = id;
        //     this.svgItemToLinearGradientMap.set(cg, linearGradient);

        //     this.canvas.defs.pushToSection(linearGradientEl,
        //         LinearGradientsContainerName);
        // });

        let colorBtns = this.colorRingContainer
            .selectAll<SVGPolygonElement, {}>("polygon")
            .data(colorGroups)
            .attr("fill", function(d) {
                if (d == undefined) {
                    return "";
                } else {
                    return d.color.fill ? d.color.fill.toString() : "";
                }
            })
            .attr("transform", function(d, i) {
                let angle = self.calcAngle() * (i + 1);
                self.colorRingTransform
                    .setRotation({ a: angle })
                    .setTranslate({ x: 0, y: self.radius })
                    .setRotation({ a: -1 * angle }, 1);
                return self.colorRingTransform.toTransformString();
            });

        colorBtns.enter()
            .append("polygon")
            .attr("points", getPolygonPointsString(6, 20))
            .attr("fill", function(d) {
                if (d == undefined) {
                    return "";
                } else {
                    return d.color.fill ? d.color.fill.toString() : "";
                }
            })
            .attr("transform", function(d, i) {
                let angle = self.calcAngle() * (i + 1);
                self.colorRingTransform
                    .setRotation({ a: angle })
                    .setTranslate({ x: 0, y: self.radius })
                    .setRotation({ a: -1 * angle }, 1);
                return self.colorRingTransform.toTransformString();
            }).on("click", function (d, i) {
                console.log(d);
                d3.event.stopPropagation();

                if (self.elementColorContainer == undefined) {
                    return;
                }

                // Not sure why this isn't casting correctly
                let center =
                    SvgTransformServiceSingleton.getCenter(<any>this);

                // Draw three hexagons
                // 1) Fill
                // 2) Stroke
                // 3) Stroke-width
                let elementColors = self.elementColorContainer
                    .selectAll<SVGPolygonElement, {}>("polygon")
                    .data([d])
                    .attr("transform", function(d) {
                        return self.colorRingTransform.toTransformString();
                    });

                elementColors.enter()
                    .append<SVGPolygonElement>("polygon")
                    .attr("points", getPolygonPointsString(6, 20))
                    .attr("transform", function(d) {
                        return self.colorRingTransform.toTransformString();
                    });
                
                elementColors.exit().remove();
            });

        colorBtns.exit()
            .remove();
    }

    public erase(): void {

    }

    //#endregion
}