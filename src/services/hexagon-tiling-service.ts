import * as d3 from 'd3';

import { calcApothem, calcSideLength, getPolygonPointsString } from '../helpers/geometry-helpers';
import { NS } from '../helpers/namespaces-helper';
import { InternalError } from '../models/errors';
import { IDrawable } from '../models/idrawable';
import { ISvgHandles } from '../models/isvg-handles';
import { Polygon } from '../models/shapes/polygon';
import { ISvgDefs } from '../models/svg-defs-model';
import { ICoords2D } from './svg-geometry-service';

const uniqid = require("uniqid");

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
    private readonly hexagons: Polygon[];
    private readonly hexagonTemplate: SVGPolygonElement;

    private circleRef: SVGCircleElement;
    private hexagonsV2: SVGUseElement[];

    public numberOfLayers: number;
    public mainApothem: number;
    public mainCircumRadius: number;
    public tileCircumRadius: number;
    public canPlaceTile: (polygon: Polygon) => boolean;

    //#endregion

    //#region Ctor

    public constructor(container: SVGGElement, handles: ISvgHandles, defs: ISvgDefs) {
        let self = this;
        
        this.container = container;
        this.defs = defs;
        this.handles = handles;
        this.hexagons = [];
        this.hexagonsV2 = [];
        this.mainApothem = 130;
        this.mainCircumRadius = Number.POSITIVE_INFINITY;
        this.numberOfLayers = 5;
        this.tileCircumRadius = 20;
        this.canPlaceTile = () => {
            return true;
        }

        // Center container
        container.setAttribute("transform", "translate(250,250)");

        // Create symbol el
        this.hexagonTemplate = <SVGPolygonElement>document
            .createElementNS(NS.SVG, "polygon");

        d3.select(this.hexagonTemplate)
            .attr("id", uniqid())
            .attr("points", getPolygonPointsString(6, this.tileCircumRadius));

        for (let i = 0; i < 24; i++) {
            let useEl = <SVGUseElement>document.createElementNS(NS.SVG, "use");
            d3.select(useEl)
                .attr("id", uniqid())
                .attr("fill", "rgba(255,0,255,0.25")
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
        let sideLength = calcSideLength(6, this.tileCircumRadius);
        let apothem = calcApothem(6, sideLength);
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
        let sideLength = calcSideLength(6, circumradius);
        let apothem = calcApothem(6, sideLength);

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

        let sideLength: number = calcSideLength(6, circumradius);
        let apothem: number = calcApothem(6, sideLength);
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
        let self = this;
        this.defs.createSection("hexagon-defs");
        let hexTemplateId = this.defs.pushToSection(this.hexagonTemplate, "hexagon-defs");

        // for (let hex of this.hexagonsV2) {
        //     hex.setAttribute("href", `#${hexTemplateId.id}`);
        //     this.container.appendChild(hex);
        // }

        for (let layer = 1; layer <= this.numberOfLayers; layer++) {

            let numberOfHexesInLayer = layer == 1 ? 1 : 6 * layer;
            for (let hexNo = 0; hexNo < numberOfHexesInLayer; hexNo++) {
                let polygon = new Polygon({
                    numberOfSides: 6,
                    center: { x: 0, y: 0 },
                    x0: { x: 20, y: 0 }
                });
    
                this.hexagons.push(new Tile({
                    isDisplayed: self.canPlaceTile(polygon),
                    polygon: polygon,
                    layer: layer
                }));
            }
        }

        console.log(this.hexagons);

        this.container.appendChild(this.circleRef);
    }

    public update(): void {
        this.circleRef.setAttribute("r", `${this.mainApothem}`);

        let sideLength = calcSideLength(6, this.tileCircumRadius);
        let apothem = calcApothem(6, sideLength);
        let layer = 1;

        // Need to round up, don't want half a hexagon.
        // Also the +1 is to avoid the hexagon intersecting the circle with
        // radius equal to the mainApothem.
        let d = Math.ceil(this.mainApothem / (2 * this.tileCircumRadius - (this.tileCircumRadius / 2))) + 1;
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
            return (d * this.tileCircumRadius) + (d * (sideLength / 2));
        })();

        // Determine the starting position
        let lastUsedCoord: ICoords2D = {
            x: start_x,
            y: d_is_odd ? 1 * apothem : 0
        }

        console.log(lastUsedCoord);

        // -2 is a special case where the starting hexagon has a y
        // translation of zero.
        let subIteration = d_is_odd ? 0 : -2;

        // Draw from both sides (favor right), distribute evenly between top
        // and bottom (favor top when uneven).
        let hexagons = d3.select(this.container)
            .selectAll<SVGUseElement, Tile>("use")
            .data(this.hexagons)
            .attr("transform", function(d) {
                return `translate(${d.center.x},${d.center.y})`;
            });

        // Enter
        hexagons.enter()
            .append<SVGUseElement>("use")
            .attr("href", `#${this.hexagonTemplate.id}`);

        // Exit

        this.hexagonsV2.map((hex, i) => {
            let sidePrecedence = lastUsedCoord.y == 0
                    ? [ HexagonSide.TOP_LEFT,
                        HexagonSide.BOTTOM_LEFT,
                        HexagonSide.TOP_CENTER ]
                    : [ HexagonSide.BOTTOM_LEFT,
                        HexagonSide.TOP_LEFT,
                        HexagonSide.TOP_CENTER ];

            // Set the transform
            // if ((lastUsedCoord.x == 0 && lastUsedCoord.y > 0)
                // || (lastUsedCoord.y == 0 && lastUsedCoord.x >= 0)
                // || (lastUsedCoord.y != 0 && lastUsedCoord.x != 0))
            // {
            hex.setAttribute("transform", `translate(${lastUsedCoord.x},${lastUsedCoord.y})`);
            // }

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
        this.hexagons.splice(0, this.hexagons.length - 1);
    }

    //#endregion
}

export interface TileData {
    isDisplayed: boolean;
    layer: number;
    polygon: Polygon;
}

export class Tile extends Polygon {
    public layer: number;
    public isDisplayed: boolean;

    public constructor(data: TileData) {
        super(data.polygon);

        this.layer = data.layer;
        this.isDisplayed = data.isDisplayed;
    }
}