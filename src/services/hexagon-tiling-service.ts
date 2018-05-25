const uniqid = require("uniqid");

import * as d3 from "d3";

import { IDrawable } from "../models/idrawable";
import { SvgTransformServiceSingleton, SvgTransformString, TransformType, ITransformable, ICoords2D } from "./svg-transform-service";
import { NS } from "../helpers/namespaces-helper";
import { getPolygonPointsString, calculateApothem, calculateSideLength } from "../helpers/polygon-helpers";
import { ISvgDefs } from "../models/svg-defs-model";
import { ISvgHandles } from "../models/isvg-handles-model";
import { InternalError } from "../models/errors";

/**
 * Represents each side of a hexagon.
 */
export enum HexagonSide {
    TOP_RIGHT = 1,
    TOP_CENTER = 2,
    TOP_LEFT = 3,
    BOTTOM_LEFT = 4,
    BOTTOM_CENTER = 5,
    BOTTOM_RIGHT = 6
};

export interface IHexagonJoin {
    element: SVGPolygonElement;
    side: HexagonSide;
}

export class HexagonTilingService implements IDrawable {
    //#region Fields

    private readonly container: SVGGElement;
    private readonly defs: ISvgDefs;
    private readonly handles: ISvgHandles;
    private readonly hexagons: HexagonTile[];
    private readonly hexagonTemplate: SVGPolygonElement;

    private circleRef: SVGCircleElement;
    private hexagonsV2: SVGUseElement[];

    public mainApothem: number;
    public mainCircumRadius: number;
    public tileCircumRadius: number;

    //#endregion

    //#region Ctor

    public constructor(container: SVGGElement, handles: ISvgHandles, defs: ISvgDefs) {
        this.container = container;
        this.defs = defs;
        this.handles = handles;
        this.hexagons = [];
        this.hexagonsV2 = [];
        this.mainApothem = 90;
        this.mainCircumRadius = Number.POSITIVE_INFINITY;
        this.tileCircumRadius = 20;

        // Center container
        container.setAttribute("transform", "translate(250,250)");

        // Create symbol el
        this.hexagonTemplate = <SVGPolygonElement>document
            .createElementNS(NS.SVG, "polygon");

        d3.select(this.hexagonTemplate)
            .attr("id", uniqid())
            // .attr("fill", "rgba(0,0,0,0")
            // .attr("stroke", "rgba(25, 25, 25, 1)")
            // .attr("stroke-width", 2)
            .attr("points", getPolygonPointsString(6, this.tileCircumRadius));

        for (let i = 0; i < 20; i++) {
            let useEl = <SVGUseElement>document.createElementNS(NS.SVG, "use");
            d3.select(useEl)
                .attr("id", uniqid())
                .attr("fill", "none")
                .attr("stroke", "red")
                .attr("stroke-width", 2);
            this.hexagonsV2.push(useEl);
        }

        this.circleRef = <SVGCircleElement>document
            .createElementNS(NS.SVG, "circle");
        
        d3.select(this.circleRef)
            .attr("id", uniqid())
            .attr("fill", "none")
            .attr("stroke", "orange")
            .attr("stroke-width", 2);
    }

    //#endregion

    //#region Properties

    public get multipleH0(): boolean {
        let sideLength = calculateSideLength(6, this.tileCircumRadius);
        let apothem = calculateApothem(6, sideLength);
        let d = this.mainCircumRadius / (2 * apothem);

        // If d is odd then there are multiple h0 else there will only be one
        // per side
        return d % 2 == 0;
    }

    //#endregion

    //#region Functions

    private doesSideIntersectCircle(sides: HexagonSide[],
        hexCenter: ICoords2D,
        circumradius: number,
        circleRadius: number): HexagonSide|undefined 
    {
        let sideLength = calculateSideLength(6, circumradius);
        let apothem = calculateApothem(6, sideLength);

        return sides.find(s => {
            let newHexCoords = {
                x: hexCenter.x,
                y: hexCenter.y
            }

            switch (s) {
                case HexagonSide.BOTTOM_CENTER: {
                    newHexCoords.y += apothem;
                    break;
                }
                case HexagonSide.BOTTOM_LEFT: {
                    newHexCoords.x -= (circumradius + sideLength);
                    newHexCoords.y += apothem;
                    break;
                }
                case HexagonSide.BOTTOM_RIGHT: {
                    newHexCoords.x += (circumradius + sideLength);
                    newHexCoords.y += apothem;
                    break;
                }
                case HexagonSide.TOP_CENTER: {
                    newHexCoords.y -= apothem;
                    break;
                }
                case HexagonSide.TOP_LEFT: {
                    newHexCoords.x -= (circumradius + sideLength);
                    newHexCoords.y -= apothem;
                    break;
                }
                case HexagonSide.TOP_RIGHT: {
                    newHexCoords.x += (circumradius + sideLength);
                    newHexCoords.y -= apothem;
                    break;
                }
                default: {
                    throw new Error("Not yet supported.");
                }
            }

            let d = Math.hypot(newHexCoords.x, newHexCoords.y) - circumradius;
            return d > circleRadius;
        });
    }

    /**
     * Circle center is assumed to be (0,0).
     * @param hexCenter 
     * @param circumradius 
     * @param circleRadius 
     */
    private getClosestAdajcentHexNotIntersectingCircle(hexCenter: ICoords2D,
        circumradius: number,
        circleRadius: number): HexagonSide
    {

        // Verify the hexCenter isn't centered.
        if (hexCenter.x == 0 && hexCenter.y == 0) {
            throw new Error("The hexCenter cannot be at {x:0,y:0}.");
        }

        // Verify that there are spots adjacent to the hexagon that don't
        // intersect the circle.
        let maxHexPoint = (Math.hypot(hexCenter.x, hexCenter.y) + circumradius);
        if (maxHexPoint < circleRadius) {
            throw new Error("There are no possible sides to place an adjacent "
                + "hexagon that is not intersection the circle.");
        }

        let sideLength: number = calculateSideLength(6, circumradius);
        let apothem: number = calculateApothem(6, sideLength);
        let side: HexagonSide;
        let yOffset: number;
        let xOffset: number;

        if (hexCenter.x == 0) {
            xOffset = 0;
        } else if (hexCenter.x > 0) {
            xOffset = 1;
        } else {
            xOffset = -1;
        }

        if (hexCenter.y == 0) {
            yOffset = 0;
        } else if (hexCenter.y > 0) {
            yOffset = 1;
        } else {
            yOffset = -1;
        }

        // Hexagon is in lower right quad
        if (yOffset >= 0 && xOffset > 0) {
            
            // Possibilities are bottom right and bottom center.
            let bottomRightCoords = {
                x: hexCenter.x + sideLength + circumradius,
                y: hexCenter.y + apothem
            };

            let _d = Math.hypot(bottomRightCoords.x, bottomRightCoords.y)
                + apothem;

            if (_d > circleRadius) {
                side = HexagonSide.BOTTOM_RIGHT;
            } else {
                side = HexagonSide.BOTTOM_CENTER;
            }

        // Hexagon is in lower quad
        } else if (yOffset >= 0 && xOffset == 0) {

            // Possibilities are only bottom center
            side = HexagonSide.BOTTOM_CENTER;

        // Hexagon is in lower left quad
        } else if (yOffset >= 0 && xOffset < 0) {
            
            // Possibilities are bottom left and bottom center
            let bottomLeftCoords = {
                x: hexCenter.x - sideLength - circumradius,
                y: hexCenter.y + apothem
            };

            let _d = Math.hypot(bottomLeftCoords.x, bottomLeftCoords.y)
                + apothem;

            if (_d > circleRadius) {
                side = HexagonSide.BOTTOM_LEFT;
            } else {
                side = HexagonSide.BOTTOM_CENTER;
            }

        // Hexagon is in the upper left quad
        } else if (yOffset < 0 && xOffset < 0) {
            
            // Possibilities are top left and top center
            let topLeftCoords = {
                x: hexCenter.x - sideLength - circumradius,
                y: hexCenter.y - apothem
            };

            let _d = Math.hypot(topLeftCoords.x, topLeftCoords.y)
                + apothem;

            if (_d > circleRadius) {
                side = HexagonSide.TOP_LEFT;
            } else {
                side = HexagonSide.TOP_CENTER;
            }

        // Hexagon is in the upper quad
        } else if (yOffset < 0 && xOffset == 0) {
            
            // Possibilities are only top center.
            side = HexagonSide.TOP_CENTER;

        // Hexagon is in the upper right quad
        } else if (yOffset < 0 && xOffset > 0) {
            
            // Possibilities are bot left and bot center
            let topRightCoords = {
                x: hexCenter.x - sideLength - circumradius,
                y: hexCenter.y - apothem
            };

            let _d = Math.hypot(topRightCoords.x, topRightCoords.y)
                + apothem;

            if (_d > circleRadius) {
                side = HexagonSide.TOP_RIGHT;
            } else {
                side = HexagonSide.TOP_CENTER;
            }
        } else {
            throw new InternalError();
        }

        return side;
    }
    
    public draw(): void {
        this.defs.createSection("hexagon-defs");
        let hexTemplateId = this.defs.pushToSection(this.hexagonTemplate, "hexagon-defs");

        for (let hex of this.hexagonsV2) {
            hex.setAttribute("href", `#${hexTemplateId.id}`);
            this.container.appendChild(hex);
        }

        this.container.appendChild(this.circleRef);
        this.update();
    }

    public update(): void {
        this.circleRef.setAttribute("r", `${this.mainApothem}`);

        let sideLength = calculateSideLength(6, this.tileCircumRadius);
        let apothem = calculateApothem(6, sideLength);

        // Need to round up, don't want half a hexagon.
        // Also the +2 is to avoid the hexagon intersecting the circle with
        // radius equal to the mainApothem.
        let d = Math.ceil(this.mainApothem / (2 * apothem)) + 1;
        let d_is_odd = d % 2 == 0 ? false : true;

        //#region Test

        console.log(d);
        console.log(`is odd: ${d_is_odd}`);
        let self = this;
        let data: number[] = new Array(d).fill(0, 0, d);
        let test = d3.select(this.container.parentElement)
            .append<SVGGElement>("g")
            .attr("transform", "translate(250,250)")
            .selectAll<SVGUseElement, {}>("use")
            .data(data);

        test.enter()
            .append<SVGUseElement>("use")
            .attr("fill", "rgba(0,0,255,.5)")
            .attr("href", `#${this.hexagonTemplate.id}`)
            .each(function(d, i) {
                let x = i * ((sideLength / 2) + self.tileCircumRadius);
                let y = i % 2 == 0 ? 0 : apothem;
                this.setAttribute("transform", `translate(${x},${y})`);
            });
            

        //#endregion

        // The offsets relative to the center of each adjacent hexagon.
        let tileHorizontalOffset = (sideLength / 2) + this.tileCircumRadius;
        let tileVerticalOffset = apothem;

        // This is an arrow function just to avoid cluttering the context.
        let start_x = (() => {
            // let by = Math.floor(d / 2);
            return ((d_is_odd ? d : d + 1) * apothem) + (d * sideLength);
        })();

        // Determine the starting position
        let lastUsedCoord: ICoords2D = {
            x: start_x,
            y: d_is_odd ? 0 : -1 * apothem
        }

        // -2 is a special case where the starting hexagon has a y
        // translation of zero.
        let subIteration = d_is_odd ? 0 : -2;

        // Draw from both sides (favor right), distribute evenly between top
        // and bottom (favor top when uneven).
        this.hexagonsV2.map((hex, i) => {
            let sidePrecedence = lastUsedCoord.y == 0
                    ? [ HexagonSide.TOP_LEFT,
                        HexagonSide.BOTTOM_LEFT,
                        HexagonSide.TOP_CENTER ]
                    : [ HexagonSide.BOTTOM_LEFT,
                        HexagonSide.TOP_LEFT,
                        HexagonSide.TOP_CENTER ];

            // Set the transform
            hex.setAttribute("transform", `translate(${lastUsedCoord.x},${lastUsedCoord.y})`);

            switch(subIteration) {
                case -2: {
                    
                    // Mirror the y-axis
                    lastUsedCoord.x *= -1;
                    break;
                }
                case -1: {

                    // Remove mirror across the y-axis
                    lastUsedCoord.x *= -1;

                    // Determine placement of next hex.
                    let side = this.doesSideIntersectCircle(sidePrecedence,
                        lastUsedCoord,
                        this.tileCircumRadius,
                        this.mainApothem);

                    if (side == HexagonSide.TOP_LEFT) {
                        lastUsedCoord.x -= tileHorizontalOffset;
                        lastUsedCoord.y -= tileVerticalOffset;
                    } else if (side == HexagonSide.BOTTOM_LEFT) {
                        lastUsedCoord.x -= tileHorizontalOffset;
                        lastUsedCoord.y += tileVerticalOffset;
                    } else {
                        lastUsedCoord.y += (2 * tileVerticalOffset);
                    }

                    break;
                }
                case 0: {

                    // Mirror the lastUsedCoords across the y-axis
                    lastUsedCoord.x *= -1;
                    break;
                }
                case 1: {

                    // Mirror the lastUsedCoords accross the x-axis
                    lastUsedCoord.y *= -1;
                    break;
                }
                case 2: {

                    // Remove mirror across the y-axis
                    lastUsedCoord.x *= -1;
                    break;
                }
                case 3: {

                    // Remove mirror across the x-axis
                    lastUsedCoord.y *= -1;

                    // Determine next placement of hex
                    let side = this.doesSideIntersectCircle(sidePrecedence,
                        lastUsedCoord,
                        this.tileCircumRadius,
                        this.mainApothem);

                    if (side == HexagonSide.TOP_LEFT) {
                        lastUsedCoord.x -= tileHorizontalOffset;
                        lastUsedCoord.y -= tileVerticalOffset;
                    } else if (side == HexagonSide.BOTTOM_LEFT) {
                        lastUsedCoord.x -= tileHorizontalOffset;
                        lastUsedCoord.y += tileVerticalOffset;
                    } else {
                        lastUsedCoord.y += (2 * tileVerticalOffset);
                    }
                    break;
                }
            }

            subIteration++;

            if (subIteration >= 4) {
                subIteration = 0;
            }
        });
    }

    public erase(): void {

    }

    //#endregion
}

export class HexagonTile implements IDrawable {
    //#region Fields
    private readonly _element: SVGPolygonElement;
    private _top_right?: HexagonTile;
    private _top_middle?: HexagonTile;
    private _top_left?: HexagonTile;
    private _bottom_left?: HexagonTile;
    private _bottom_middle?: HexagonTile;
    private _bottom_right?: HexagonTile;
    private _circumradius: number;

    public transforms: ITransformable;
    //#endregion

    //#region Ctor

    public constructor() {
        this._circumradius = 10;
        this.transforms = new SvgTransformString([
            TransformType.ROTATE,
            TransformType.TRANSLATE,
            TransformType.ROTATE
        ]);
        
        // Create element
        this._element = <SVGPolygonElement>document
            .createElementNS(NS.SVG, "polygon");

        // Assign points to it
        this._element.setAttribute("points", 
            getPolygonPointsString(6, this._circumradius));

        // Apply transforms
        this._element.setAttribute("transform", 
            this.transforms.toTransformString());
    }

    //#endregion
    
    //#region Properties
    public get circumradius(): number {
        return this._circumradius;
    }
    public set circumradius(value: number) {
        if (value <= 0) {
            throw new Error("Value cannot be less than or equal to zero.");
        }
        this._circumradius = value;
    }

    public get topRight(): HexagonTile|undefined {
        return this._top_right;
    }

    public get topMiddle(): HexagonTile|undefined {
        return this._top_middle;
    }

    public get topLeft(): HexagonTile|undefined {
        return this._top_left;
    }

    public get bottomLeft(): HexagonTile|undefined {
        return this._bottom_left;
    }

    public get bottomMiddle(): HexagonTile|undefined {
        return this._bottom_middle;
    }

    public get bottomRight(): HexagonTile|undefined {
        return this._bottom_right;
    }

    public get hasAvailbleSide(): boolean {
        return this.topLeft == undefined
            && this.topMiddle == undefined
            && this.topRight == undefined
            && this.bottomLeft == undefined
            && this.bottomMiddle == undefined
            && this.bottomRight == undefined;
    }
    //#endregion
    
    //#region Functions
    public getElement(): SVGPolygonElement {
        return this._element;
    }

    public draw(): void {
        d3.select(this.getElement())
            .attr("transform", this.transforms.toTransformString());
    }

    public update(): void {
        d3.select(this.getElement())
            .attr("transform", this.transforms.toTransformString());
    }
    
    public erase(): void {

    }
    //#endregion
}