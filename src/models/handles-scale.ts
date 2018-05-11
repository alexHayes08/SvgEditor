const uniqid = require("uniqid");

import * as d3 from "d3";

import { ActivatableServiceSingleton } from "../services/activatable-service";
import { HandlesRotationOverlay } from "./handles-rotation";
import { IContainer } from "./icontainer";
import { IDrawable } from './idrawable';
import { Names } from "./names";
import { SvgTransformServiceSingleton, ICoords2D } from "../services/svg-transform-service";

export class HandlesScaleOverlay implements IContainer, IDrawable {
    //#region Fields

    public container: d3.Selection<SVGGElement, {}, null, undefined>;
    public containerNode: SVGGElement;

    //#endregion

    //#region Ctor

    public constructor(container: d3.Selection<SVGGElement, {}, null, undefined>) {
        this.container = container;

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

    }

    public update(): void {

    }

    public erase(): void {

    }

    //#endregion
}