const uniqid = require("uniqid");

import * as d3 from "d3";

import { ActivatableServiceSingleton } from "../services/activatable-service";
import { HandlesRotationOverlay } from "./handles-rotation";
import { IContainer } from "./icontainer";
import { IDrawable } from './idrawable';
import { Names } from "./names";
import { SvgTransformServiceSingleton, ICoords2D } from "../services/svg-transform-service";

export class HandlesColorsOverlay implements IContainer, IDrawable {
    // [Fields]

    public container: d3.Selection<SVGGElement, {}, null, undefined>;
    public containerNode: SVGGElement;

    // [End Fields]

    // [Ctor]

    public constructor(container: d3.Selection<SVGGElement, {}, null, undefined>) {
        this.container = container;
        
        let containerNode = this.container.node();
        if (containerNode == undefined) {
            throw new Error("The container was undefined.");
        }
        this.containerNode = containerNode;
    }

    // [End Ctor]

    // [Properties]

    // [End Properties]

    // [Functions]

    public draw(): void {

    }

    public update(): void {

    }

    public erase(): void {

    }

    // [End Functions]
}