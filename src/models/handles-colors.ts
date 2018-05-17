const uniqid = require("uniqid");

import * as d3 from "d3";

import { ActivatableServiceSingleton } from "../services/activatable-service";
import { HandlesRotationOverlay } from "./handles-rotation";
import { IContainer } from "./icontainer";
import { IDrawable } from './idrawable';
import { Names } from "./names";
import { SvgTransformServiceSingleton, ICoords2D, ITransformable } from "../services/svg-transform-service";
import { SvgEditor } from "./svg-editor-model";

interface IColorsOverlayData {
    startOffsetAngle: number;
    color: d3.ColorSpaceObject;
    transforms: ITransformable;
}

export class HandlesColorsOverlay implements IContainer, IDrawable {
    //#region Fields

    private readonly editor: SvgEditor;

    private data: IColorsOverlayData[];

    public container: d3.Selection<SVGGElement, {}, null, undefined>;
    public containerNode: SVGGElement;

    //#endregion

    //#region Ctor

    public constructor(container: d3.Selection<SVGGElement, {}, null, undefined>,
        editor: SvgEditor)
    {
        this.container = container;
        this.data = [];
        this.editor = editor;
        
        let containerNode = this.container.node();
        if (containerNode == undefined) {
            throw new Error("The container was undefined.");
        }
        this.containerNode = containerNode;
    }

    //#endregion

    //#region Properties

    //#endregion

    //#region Functions

    public draw(): void {
        let self = this;
        
        this.container
            .selectAll("polygon")
    }

    public update(): void {

    }

    public erase(): void {

    }

    //#endregion
}