const uniqid = require("uniqid");

import * as d3 from "d3";

import { ActivatableServiceSingleton } from "../services/activatable-service";
import { Angle } from "./angle";
import { convertToEnum } from "../helpers/enum-helper";
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
    TransformType,
    TransformStringService
} from "../services/svg-transform-service";
import { getPolygonPointsString } from "../helpers/geometry-helpers";
import { SvgColors, SvgItem, ColorMap, isColorMap } from "./svg-item-model";
import { toDegrees, CardinalDirections } from "../helpers/math-helpers";
import { LinearGradient } from "./element-wrappers/linear-gradient";
import { StopData } from "./element-wrappers/stop-data";
import { SvgNumber } from "./svg-number";
import { NS } from "../helpers/namespaces-helper";
import { ColorValue } from "./color-value";
import { getElementUrlPointsTo } from "../helpers/svg-helpers";
import { InternalError, InvalidCastError } from "./errors";
import { SvgColorPicker } from "./svg-color-picker";

interface IColorsOverlayData {
    startOffsetAngle: number;
    color: d3.ColorSpaceObject;
    transforms: ITransformable;
}

interface SvgItemToColor {
    item: SvgItem,
    color: SvgColors
}

interface ColorElementUIControl {
    name: string;
    value: any;
}

// TODO: Move this to names.ts.
const LinearGradientsContainerName = "linear-gradients-container";

export enum HandlesColorMode {
    ALL,
    MUST_HAVE_FILL_OR_STROKE,
    UNIQUE_COLORS_ONLY
}

export class HandlesColorsOverlay implements IContainer, IDrawable {
    //#region Fields

    private readonly canvas: SvgCanvas;
    private readonly colorBtnTransform: ITransformable;
    private readonly colorPickerTransform: ITransformable;
    private readonly colorRingTransform: ITransformable;
    private readonly htmlContainer: d3.Selection<HTMLElement, {}, null, undefined>;
    private readonly svgItemToLinearGradientMap: Map<SvgColors,LinearGradient>;
    private data: IColorsOverlayData[];
    private selectedColor?: SvgItemToColor;
    
    private colorRingContainer?: d3.Selection<SVGGElement, {}, null, undefined>;
    private elementColorContainer?: d3.Selection<SVGGElement, {}, null, undefined>;
    private elementColorPicker: SvgColorPicker;
    private attributeColorPicker: SvgColorPicker;

    public container: d3.Selection<SVGGElement, {}, null, undefined>;
    public containerNode: SVGGElement;
    public mode: HandlesColorMode;
    public radius: number;

    //#endregion

    //#region Ctor

    public constructor(container: d3.Selection<SVGGElement, {}, null, undefined>,
        canvas: SvgCanvas,
        htmlContainer: HTMLElement)
    {
        this.colorBtnTransform = new SvgTransformString([
            TransformType.ROTATE,
            TransformType.TRANSLATE,
            TransformType.ROTATE
        ]).setTranslate({ x: -40, y: 0 });
        this.colorPickerTransform = new SvgTransformString([
            TransformType.TRANSLATE
        ]);
        this.colorRingTransform = new SvgTransformString([
            TransformType.ROTATE,
            TransformType.TRANSLATE,
            TransformType.ROTATE
        ]);
        this.container = container;
        this.data = [];
        this.htmlContainer = d3.select(htmlContainer);
        this.canvas = canvas;
        this.radius = 100;
        this.svgItemToLinearGradientMap = new Map();
        
        let containerNode = this.container.node();
        if (containerNode == undefined) {
            throw new Error("The container was undefined.");
        }
        this.containerNode = containerNode;
        this.mode = HandlesColorMode.ALL;

        this.canvas.defs.createSection(LinearGradientsContainerName);

        let colorPickerContainer = this.htmlContainer
            .append<HTMLElement>("div")
            .attr("data-name", Names.Handles.SubElements.ColorsHelperContainer
                .SubElements.ColorPickerContainer.DATA_NAME)
                .node();

        if (colorPickerContainer == undefined) {
            throw new Error();
        }

        // Two color pickers:
        // 1) One for fill/stroke/width of an element
        // 2) One for just color associated with an elements attribute
        this.attributeColorPicker = new SvgColorPicker(colorPickerContainer, 
            canvas.defs);
        ActivatableServiceSingleton.register(
            this.attributeColorPicker.getElement(), true); // FIXME: Change this back to false

        this.elementColorPicker = new SvgColorPicker(colorPickerContainer, 
            canvas.defs);
        ActivatableServiceSingleton.register(
            this.elementColorPicker.getElement(), false);
    }

    //#endregion

    //#region Functions

    private displayColorPicker(coords: ICoords2D): void {

        // Verify the color picker el isn't null
        if (this.elementColorPicker == undefined
            || this.attributeColorPicker == undefined) 
        {
            return;
        }

        // if (this.mode == HandlesColorMode.UNIQUE_COLORS_ONLY) {
            
        //     // Activate element
        //     this.attributeColorPicker
        //         .each(function(d) {
        //             ActivatableServiceSingleton.activate(this);
        //         });
        // } else {

        //     // Activate element
        //     this.elementColorPicker
        //         .each(function(d) {
        //             ActivatableServiceSingleton.activate(this);
        //         });
        // }

        console.log("Displaying color-picker TODO.");
    }

    private hideColorPicker(): void {

        // Verify the color picker el isn't null
        if (this.elementColorPicker == undefined
            || this.attributeColorPicker == undefined) 
        {
            return;
        }

        // Deactivate element
        // this.attributeColorPicker
        //     .each(function(d) {
        //         ActivatableServiceSingleton.deactivate(this);
        //     });

        // this.elementColorPicker
        //     .each(function(d) {
        //         ActivatableServiceSingleton.deactivate(this);
        //     });

        console.log("Hiding color-picker TODO.");
    }

    private calcAngle(): number {
        let distanceBetweenBtnCenters = 50;
        let angle = Math.asin(distanceBetweenBtnCenters / this.radius);
        return toDegrees(angle);
    }

    public draw(): void {
        
        // Verify the color picker container isn't null.
        if (this.htmlContainer == undefined) {
            throw new InternalError();
        }
        
        let self = this;
        
        this.colorRingContainer = this.container
            .append<SVGGElement>("g")
            .attr("data-name", Names.Handles.SubElements.ColorsHelperContainer
                .SubElements.ColorRingContainer.DATA_NAME);
        this.elementColorContainer = this.container
            .append<SVGGElement>("g")
            .attr("data-name", Names.Handles.SubElements.ColorsHelperContainer
                .SubElements.ElementColorContainer.DATA_NAME);

        // Attribute color picker.
        this.attributeColorPicker.draw();
        this.elementColorPicker.draw();
        // this.attributeColorPicker = colorPickerContainer
        //     .append<HTMLDivElement>("div")
        //     .attr("data-name", "attribute-color-picker")
        //     .classed("attributeColorPicker", true)
        //     .each(function() {
        //         ActivatableServiceSingleton.register(this, false);
        //     });

        // Element color picker.
        // this.elementColorPicker = colorPickerContainer
        //     .append<HTMLDivElement>("div")
        //     .attr("data-name", "element-color-picker")
        //     .classed("elementColorPicker", true)
        //     .each(function() {
        //         ActivatableServiceSingleton.register(this, false);
        //     });

        // Three tabs
        // let tabs = this.elementColorPicker
        //     .append("div")
        //     .classed("tabs", true);

        // // First tab is fill
        // tabs.append("div")
        //     .classed("fill", true)
        //     .classed("tab", true);

        // tabs.append("div")
        //     .classed("stroke", true)
        //     .classed("tab", true);

        // tabs.append("div")
        //     .classed("stroke-style", true)
        //     .classed("tab", true);
    }

    public update(): void {
        let self = this;

        // Verify the handles aren't null (normally this should never happen).
        if (this.canvas.handles == undefined
            || this.colorRingContainer == undefined
            || this.elementColorContainer == undefined) 
        {
            return;
        }

        // Color groups are used if the mode is NOT unique colors only, else
        // only unique colors are relevant.
        let colorGroups: ColorMap[] = [];
        let uniqueColors: string[] = [];
        this.canvas.handles
            .getSelectedObjects()
            .map(so => {
                colorGroups = colorGroups.concat(so.colors);
            });

        // Filter the colorGroups if the mode isn't ALL.
        if (this.mode == HandlesColorMode.MUST_HAVE_FILL_OR_STROKE) {

            // Filter out all elements lacking a fill AND stroke.
            colorGroups = colorGroups
                .filter(cg => cg.colors.fill || cg.colors.stroke);
        } else if (this.mode == HandlesColorMode.UNIQUE_COLORS_ONLY) {
            
            // Filter out any color groups with both fill and stroke being
            // non-unique.
            colorGroups.map(cg => {
                let { stroke, fill } = cg.colors;
                let hasUniqueFill = false;
                let hasUniqueStroke = false;

                // Ignore elements without a stroke/fill.
                if (stroke == undefined && fill == undefined) {
                    return false;
                
                // Ignore elements with numbers as their color value.
                } else if (stroke && typeof stroke == "number"
                    && fill && typeof fill == "number")
                {
                    return false;
                } else if (stroke && fill) {
                    hasUniqueFill = uniqueColors.indexOf(fill.toString()) == -1;

                    if (hasUniqueFill) {
                        uniqueColors.push(fill.toString());
                    }

                    hasUniqueStroke = uniqueColors.indexOf(stroke.toString()) == -1;
                    if (hasUniqueStroke) {
                        uniqueColors.push(stroke.toString());
                    }
                }
            });

            // Empty color groups
            colorGroups = [];
        }

        let data: ColorMap[]|string[] = [];
        if (self.mode == HandlesColorMode.UNIQUE_COLORS_ONLY) {
            data = uniqueColors;
        } else {
            data = colorGroups;
        }

        //#region Linear Gradients

        // Update
        let update = d3.select(this.canvas.defs.getSectionElement(LinearGradientsContainerName))
            .selectAll<SVGLinearGradientElement, {}>("linearGradient")
            .data(colorGroups)
            .attr("data-for", function(d) { return d.element.id })
            .each(function(d) {
                //#region Stops

                let fill: d3.ColorSpaceObject;
                if (d.colors.fill != undefined && typeof d.colors.fill != "number") {
                    fill = d.colors.fill;
                } else {
                    fill = d3.color("rgba(0,0,0,0)");
                }

                let stroke: d3.ColorSpaceObject;
                if (d.colors.stroke != undefined && typeof d.colors.stroke != "number") {
                    stroke = d.colors.stroke;
                } else {
                    stroke = d3.color("rgba(0,0,0,0)");
                }
                
                let data = [fill, fill, stroke, stroke];

                // Update
                let update = d3.select(this)
                    .selectAll("stop")
                    .data(data)
                    .attr("offset", function(d,i) {
                        switch (i) {
                            case 0:
                                return "0%";
                            case 1:
                                return "50%";
                            case 2:
                                return "51%";
                            case 3:
                                return "100%";
                            default:
                                return "";
                        }
                    })
                    .attr("stop-color", function(d) { return d.toString() })

                // Draw
                update.enter()
                    .attr("x1", "0%")
                    .attr("y1", "0%")
                    .attr("x2", "100%")
                    .attr("y2", "100%")
                    .attr("offset", function(d,i) {
                        switch (i) {
                            case 0:
                                return "0%";
                            case 1:
                                return "50%";
                            case 2:
                                return "51%";
                            case 3:
                                return "100%";
                            default:
                                return "";
                        }
                    })
                    .attr("stop-color", function(d) { return d.toString() });

                // Erase
                update.exit().remove();

                //#endregion
            });

        // Draw
        update.enter().append<SVGLinearGradientElement>(function(d) {
                return <SVGLinearGradientElement>document
                    .createElementNS(NS.SVG, "linearGradient");
            })
            .attr("id", () => uniqid())
            .attr("x1", "0%")
            .attr("y1", "0%")
            .attr("x2", "100%")
            .attr("y2", "100%")
            .attr("data-for", function(d) { return d.element.id })
            .each(function(d) {
                //#region Stops

                let fill: d3.ColorSpaceObject;
                if (d.colors.fill != undefined && typeof d.colors.fill != "number") {
                    fill = d.colors.fill;
                } else {
                    fill = d3.color("rgba(0,0,0,0)");
                }
                let stroke = d.colors.stroke || d3.color("rgba(0,0,0,0)");
                let data = [fill, fill, stroke, stroke];

                // Update
                let update = d3.select(this)
                    .selectAll("stop")
                    .data(data)
                    .attr("offset", function(d,i) {
                        switch (i) {
                            case 0:
                                return "0%";
                            case 1:
                                return "50%";
                            case 2:
                                return "51%";
                            case 3:
                                return "100%";
                            default:
                                return "";
                        }
                    })
                    .attr("stop-color", function(d) { return d.toString() });

                // Draw
                update.enter()
                    .append("stop")
                    .attr("offset", function(d,i) {
                        switch (i) {
                            case 0:
                                return "0%";
                            case 1:
                                return "50%";
                            case 2:
                                return "51%";
                            case 3:
                                return "100%";
                            default:
                                return "";
                        }
                    })
                    .attr("stop-color", function(d) { return d.toString() });

                // Erase
                update.exit().remove();

                //#endregion
            });

        // Erase extras
        update.exit().remove();

        //#endregion

        let colorBtns = this.colorRingContainer
            .selectAll<SVGCircleElement, {}>("circle")
            .data<ColorMap|string>(data)
            .attr("stroke", "black")
            .attr("stroke-width", "2")
            .attr("fill", function(d) {

                if (self.mode == HandlesColorMode.UNIQUE_COLORS_ONLY) {

                    return <string>d;
                } else {

                    // Verify this is only reached when using a ColorMap
                    if (!isColorMap(d)) {
                        throw new InternalError();
                    }

                    // Locate the linearGradient with the matching data-for attr.
                    let el = d3.select<Element, {}>(`*[data-for='${d.element.id}']`).node();

                    if (el != undefined) {
                        return `url(#${el.id})`;
                    } else {
                        return "";
                    }
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
            .append<SVGCircleElement>("circle")
            .attr("stroke", "black")
            .attr("stroke-width", "2")
            .attr("cx", 0)
            .attr("cy", 0)
            .attr("r", 20)
            // .attr("points", getPolygonPointsString(6, 20))
            .attr("id", () => uniqid())
            .attr("fill", function(d) {
                if (self.mode == HandlesColorMode.UNIQUE_COLORS_ONLY) {
                    return <string>d;
                } else {

                    // Verify this is only reached when using a ColorMap
                    if (!isColorMap(d)) {
                        throw new InternalError();
                    }

                    // Locate the linearGradient with the matching data-for attr.
                    let el = d3.select<Element, {}>(`*[data-for='${d.element.id}']`).node();

                    if (el != undefined) {
                        return `url(#${el.id})`;
                    } else {
                        return "";
                    }
                }
            })
            .attr("transform", function(_d, _i) {
                let angle = self.calcAngle() * (_i + 1);
                self.colorRingTransform
                    .setRotation({ a: angle })
                    .setTranslate({ x: 0, y: self.radius })
                    .setRotation({ a: -1 * angle }, 1);
                return self.colorRingTransform.toTransformString();
            })
            .on("click", function (_d, _i) {
                console.log(`Clicked:`);
                console.log(_d);
                d3.event.stopPropagation();

                // Verify the element color container isn't null.
                if (self.elementColorContainer == undefined) {
                    return;
                }

                if (self.mode == HandlesColorMode.UNIQUE_COLORS_ONLY) {
                    let center =
                        SvgTransformServiceSingleton.getCenter(this);
                    
                    // Display color picker
                    self.displayColorPicker(center);
                } else {
                    let center =
                        SvgTransformServiceSingleton.getCenter(this);

                    // Retrieve the first rotation
                    let rotation = self.colorRingTransform.getRotation(0);
                    let direction = rotation.a > 180 
                        ? CardinalDirections.EAST
                        : CardinalDirections.WEST;

                    // Draw three circles
                    // 1) Fill
                    // 2) Stroke
                    // 3) Stroke-width

                    let data: ColorElementUIControl[] = [
                        { name: "fill", value: _d },
                        { name: "stroke", value: _d },
                        { name: "stroke-width", value: _d }
                    ];

                    // Update
                    let elementColors = self.elementColorContainer
                        .selectAll<SVGCircleElement, {}>("circle")
                        .data([_d])
                        .attr("transform", function(d) {
                            return self.colorRingTransform.toTransformString();
                        });

                    // Enter
                    elementColors.enter()
                        .append<SVGCircleElement>("circle")
                        // .attr("points", getPolygonPointsString(6, 20))
                        .attr("cx", 0)
                        .attr("cy", 0)
                        .attr("r", 20)
                        .attr("transform", function(d) {
                            return self.colorRingTransform.toTransformString();
                        });

                    // Exit
                    elementColors.exit().remove();
                }
            }).on("mouseover", function(d) {
                
                // Throw an error if handles are undefined, which SHOULD
                // never happen since this file is only called from handles.
                let { handles } = self.canvas;
                if (handles == undefined) {
                    throw new InternalError();
                }

                // let fillColor = d3.color(fillColorAttrVal);
                // let strokeColor = d3.color(strokeColorAttrVal);

                if (self.mode == HandlesColorMode.UNIQUE_COLORS_ONLY) {
                    let hightlightEls: SVGGraphicsElement[] = [];
                    let allElements: SVGGraphicsElement[] = [];

                    if (typeof d != "string") {
                        throw new InvalidCastError();
                    }

                    // Get all selected elements
                    handles.getSelectedObjects()
                        .map(so => {

                            // Add each root element
                            let el = so.getElement();
                            allElements.push(el);

                            // Add each child-element
                            d3.select(el)
                                .selectAll<SVGGraphicsElement, {}>("*")
                                .nodes()
                                .map(child => {
                                    allElements.push(child);
                                });
                        })

                    // Highlight ALL selected elements containing the color.
                    for (let i = 0; i < allElements.length; i++) {
                        let el = allElements[i];

                        let fill = el.getAttribute("fill");
                        let stroke = el.getAttribute("stroke");
                        
                        // Ingore if no fill and stroke
                        if (fill == undefined && stroke == undefined) {
                            continue;
                        }

                        // Check if the fill OR stroke match datas fill/stroke.
                        let sameFill = d == fill;
                        let sameStroke = d == stroke;

                        if (sameFill || sameStroke) {
                            hightlightEls.push(el);
                        }
                    }

                    if (self.canvas.handles) {
                        console.log(hightlightEls);
                        self.canvas.handles.highlightObjects(...hightlightEls);
                    }
                } else {

                    // Verify the datum is a ColorMap
                    if (!isColorMap(d)) {
                        throw new InvalidCastError();
                    }

                    if (self.canvas.handles) {
                        console.log(d.element);
                        self.canvas.handles.highlightObjects(d.element);
                    }
                }
            }).on("mouseout", function(d) {
                let { handles } = self.canvas;

                if (handles == undefined) {
                    throw new InternalError();
                }

                handles.highlightObjects();
            });

        colorBtns.exit()
            .remove();
    }

    public erase(): void {

    }

    //#endregion
}