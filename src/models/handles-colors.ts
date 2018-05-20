const uniqid = require("uniqid");

import * as d3 from "d3";

import { ActivatableServiceSingleton } from "../services/activatable-service";
import { HandlesRotationOverlay } from "./handles-rotation";
import { IContainer } from "./icontainer";
import { IDrawable } from './idrawable';
import { Names } from "./names";
import { SvgEditor } from "./svg-editor-model";
import { 
    SvgTransformServiceSingleton, 
    ICoords2D, 
    ITransformable, 
    SvgTransformString,
    TransformType
} from "../services/svg-transform-service";
import { getPolygonPointsString } from "../helpers/svg-helpers";
import { Angle } from "./angle";

interface IColorsOverlayData {
    startOffsetAngle: number;
    color: d3.ColorSpaceObject;
    transforms: ITransformable;
}

export class HandlesColorsOverlay implements IContainer, IDrawable {
    //#region Fields

    private readonly editor: SvgEditor;
    private colorBtnTransform: ITransformable;

    private data: IColorsOverlayData[];

    public container: d3.Selection<SVGGElement, {}, null, undefined>;
    public containerNode: SVGGElement;
    public radius: number;

    //#endregion

    //#region Ctor

    public constructor(container: d3.Selection<SVGGElement, {}, null, undefined>,
        editor: SvgEditor)
    {
        this.colorBtnTransform = new SvgTransformString([
            TransformType.ROTATE,
            TransformType.TRANSLATE,
            TransformType.ROTATE
        ]);
        this.container = container;
        this.data = [];
        this.editor = editor;
        this.radius = 100;
        
        let containerNode = this.container.node();
        if (containerNode == undefined) {
            throw new Error("The container was undefined.");
        }
        this.containerNode = containerNode;
    }

    //#endregion

    //#region Functions

    public draw(): void {
        let self = this;
        
        this.container
            .selectAll("polygon");
    }

    public update(): void {
        let self = this;
        if (this.editor.handles == undefined) {
            return;
        }

        let colorGroups = this.editor.handles
            .getSelectedObjects()
            .map(so => so.colors);

        console.log(colorGroups);

        let colorBtns = this.container
            .selectAll("polygon")
            .data(colorGroups)
            .attr("fill", function(d) {
                let color = d.find(c => c ? c.fill != undefined : false);
                if (color == undefined) {
                    return "";
                } else {
                    return color.fill ? color.fill.toString() : "";
                }
            })
            .attr("transform", function(d, i) {
                let angle = (i * 20) + 20;
                self.colorBtnTransform
                    .setRotation({ a: angle })
                    .setTranslate({ x: 0, y: self.radius })
                    .setRotation({ a: -1 * angle }, 2);
                return self.colorBtnTransform.toTransformString();
            });

        colorBtns.enter()
            .append("polygon")
            .attr("points", 
                getPolygonPointsString(6, 20, Angle.fromDegrees(90)))
            .attr("fill", function(d) {
                return "red";
            }).attr("transform", function(d, i) {
                let angle = (i * 20) + 20;
                self.colorBtnTransform
                    .setRotation({ a: angle })
                    .setTranslate({ x: 0, y: self.radius })
                    .setRotation({ a: -1 * angle }, 2);
                return self.colorBtnTransform.toTransformString();
            });

        colorBtns.exit()
            .remove();
    }

    public erase(): void {

    }

    //#endregion
}