import { IDOMDrawable } from './../idom-drawable';
import * as d3 from 'd3';

import { CardinalDirections, toDegrees } from '../../helpers/math-helpers';
import { NS } from '../../helpers/namespaces-helper';
import { ITransformable } from '../../models/itransformable';
import { SvgGeometryServiceSingleton, TransformType, ICoords2D } from '../../services/svg-geometry-service';
import { SvgTransformString } from '../svg-transform-string';
import { ColorControlRgb } from './../drawables/color-control-rgb';
import { LinearGradient } from './../element-wrappers/linear-gradient';
import { InternalError, InvalidCastError } from './../errors';
import { IDrawable } from './../idrawable';
import { Names } from './../names';
import { SvgCanvas } from './../svg-canvas-model';
import { ColorMap, isColorMap, SvgColors, SvgItem } from './../svg-item-model';
import { createSvgEl, convertSvgCoordsToScreenCoords, convertCoordsRelativeTo } from '../../helpers/svg-helpers';
import { ColorPicker } from './color-picker';
import { ActivatableServiceSingleton } from '../../services/activatable-service';
import { HTMLTransformString } from '../html-transform-string';
import { getBBox } from '../../helpers/html-helpers';
import { ModalFrame } from './modal-frame';

const uniqid = require("uniqid");

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

/**
 * This class violates the single parent node principle of IDOMDrawable as it
 * modifies nodes in two different DOM trees.
 */
export class HandlesColorsOverlay implements IDOMDrawable<SVGGElement> {
    //#region Fields

    private readonly canvas: SvgCanvas;
    private readonly colorPicker: ColorPicker;
    private readonly colorBtnTransform: ITransformable;
    private readonly colorPickerTransform: ITransformable;
    private readonly colorRingTransform: ITransformable;
    private readonly element: SVGGElement;
    private readonly emitter: d3.Dispatch<EventTarget>;
    private readonly htmlContainer: HTMLElement;

    private data: IColorsOverlayData[];
    private selectedColor?: SvgItemToColor;
    
    private attrColorPickerFrame: ModalFrame;
    private colorRingContainer: SVGGElement;
    private elementColorContainer: SVGGElement;
    // private elementColorPicker: SvgColorPicker;
    // private attributeColorPicker: SvgColorPicker;
    // private rgbControlContainer: HTMLElement;

    public container: SVGGElement;
    public mode: HandlesColorMode;
    public radius: number;

    //#endregion

    //#region Ctor

    public constructor(container: SVGGElement,
        canvas: SvgCanvas,
        htmlContainer: HTMLElement)
    {
        this.colorBtnTransform = new SvgTransformString([
            TransformType.ROTATE,
            TransformType.TRANSLATE,
            TransformType.ROTATE
        ]).setTranslate({ x: -40, y: 0 });
        this.colorPickerTransform = new HTMLTransformString([
            TransformType.TRANSLATE
        ]);
        this.colorRingTransform = new SvgTransformString([
            TransformType.ROTATE,
            TransformType.TRANSLATE,
            TransformType.ROTATE
        ]);
        this.container = container;
        this.data = [];
        this.emitter = d3.dispatch("change");
        this.htmlContainer = htmlContainer;
        this.canvas = canvas;
        this.radius = 100;
        this.mode = HandlesColorMode.ALL;
        this.canvas.defs.createSection(LinearGradientsContainerName);

        let attrColorPickerContainer = document.createElement("div");
        this.attrColorPickerFrame = new ModalFrame(attrColorPickerContainer);
        d3.select(attrColorPickerContainer)
            .attr("data-name", Names.Handles.SubElements.ColorsHelperContainer
                .SubElements.ColorPickerContainer.DATA_NAME)
            .style("transform", this.colorPickerTransform.toTransformString());
        this.colorPicker = new ColorPicker(attrColorPickerContainer);
        ActivatableServiceSingleton.register(attrColorPickerContainer);

        // Create element
        this.element = createSvgEl<SVGGElement>("g");

        // Create color ring container
        this.colorRingContainer = 
            createSvgEl<SVGGElement>("g", this.element);
        this.colorRingContainer.setAttribute("data-name", Names.Handles.SubElements.ColorsHelperContainer
            .SubElements.ColorRingContainer.DATA_NAME);
        
        // Create element color container
        this.elementColorContainer =
            createSvgEl<SVGGElement>("g", this.element);
        this.elementColorContainer.setAttribute("data-name", Names.Handles.SubElements.ColorsHelperContainer
                .SubElements.ElementColorContainer.DATA_NAME);

        // Two color pickers:
        // 1) One for fill/stroke/width of an element
        // 2) One for just color associated with an elements attribute
        // this.attributeColorPicker = new SvgColorPicker(colorPickerContainer, 
        //     canvas.defs);
        // ActivatableServiceSingleton.register(
        //     this.attributeColorPicker.getElement(), true); // FIXME: Change this back to false

        // this.elementColorPicker = new SvgColorPicker(colorPickerContainer, 
        //     canvas.defs);
        // ActivatableServiceSingleton.register(
        //     this.elementColorPicker.getElement(), false);
    }

    //#endregion

    //#region Functions

    private displayAttributeColorPicker(button: Element,
        coords: ICoords2D,
        left: boolean,
        top: boolean,
        color: d3.Color): void 
    {
        let self = this;
        let attrColorPickerContainer = this.attrColorPickerFrame.getContainer();
        let attrColorPickerElement = this.attrColorPickerFrame.getElement();
        
        // Update the color picker.
        this.colorPicker.color = color;
        this.colorPicker.update();

        // Update the color picker container position.
        let bbox = getBBox(attrColorPickerElement);
        let newPos = {
            x: coords.x + (left ? bbox.width / -2 : bbox.width / 2),
            y: coords.y + (top ? bbox.height / -2 : bbox.width / 2)
        };
        this.colorPickerTransform.setTranslate(newPos);
        d3.select(attrColorPickerContainer)
            .style("transform", function() {
                console.log(self.colorPickerTransform.toTransformString());
                return self.colorPickerTransform.toTransformString();
            });
        
        // Activate element
        ActivatableServiceSingleton.activate(this.htmlContainer);
        ActivatableServiceSingleton.activate(attrColorPickerContainer);

        let body = d3.select("body");
        let attrColPickCon = d3.select(attrColorPickerContainer);
        let targetedEls = this.getElementsWithColor(color);
        let colorAsStr = color.toString();
        
        // Handles when the color picker loses focus.
        let blurEvtHandler = function() {
            ActivatableServiceSingleton.deactivate(attrColorPickerContainer);
            
            // Remove all evt listeners.
            attrColPickCon.on("mousedown keydown", null);
            body.on("mousedown keydown", null);
        }

        // Prevents events from propagating upwards from the color picker.
        let focusedEvtHandler = function() {
            d3.event.stopPropagation();
        }

        // Add evt listners
        attrColPickCon.on("mousedown keydown", focusedEvtHandler);
        d3.select("body").on("mousedown keydown", blurEvtHandler);
        this.colorPicker.getEventEmitter().on("change", function() {
            let newColor = d3.rgb(self.colorPicker.color.toString());
            
            // Assign new colors
            button.setAttribute("fill", newColor.toString());
            targetedEls.strokeRefs.map(ref => {
                ref.colors.stroke = newColor;
            });
            targetedEls.fillRefs.map(ref => {
                ref.colors.fill = newColor;
            });
        });
    }

    private displayElementColorPicker(coords: ICoords2D): void {
        if (this.mode == HandlesColorMode.UNIQUE_COLORS_ONLY) {

            // Activate element
            // ActivatableServiceSingleton.activate(this.attributeColorPickerContainer);
            // ActivatableServiceSingleton.activate(this.htmlContainer);
            // this.attributeColorPicker
            //     .each(function(d) {
            //         ActivatableServiceSingleton.activate(this);
            //     });
        } else {

            // Activate element
            // this.elementColorPicker
            //     .each(function(d) {
            //         ActivatableServiceSingleton.activate(this);
            //     });
        }

        console.log("Displaying color-picker TODO.");
    }

    private getElementsWithColor(color: d3.Color) {
        
        // Verify the handles are defined
        if (this.canvas.handles == undefined) {
            throw new InternalError();
        }
        
        let colorAsStr = color.toString();
        let handles = this.canvas.handles;

        let strokeColorMaps: ColorMap[] = [];
        let fillColorMaps: ColorMap[] = [];
        handles.getSelectedObjects().map(svgItem => {
            svgItem.colors.map(color => {
                if ((color.colors.fill || "") == colorAsStr) {
                    fillColorMaps.push(color);
                } else if ((color.colors.fill || "") == colorAsStr) {
                    strokeColorMaps.push(color);
                }
            });
        })

        return {
            strokeRefs: strokeColorMaps,
            fillRefs: fillColorMaps
        };
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
        
        // let self = this;
        this.getContainer().appendChild(this.getElement());
        this.htmlContainer.appendChild(this.attrColorPickerFrame.getContainer());
        this.colorPicker.draw();

        // Attribute color picker.
        // this.attributeColorPicker.draw();
        // this.elementColorPicker.draw();
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
        if (this.canvas.handles == undefined) {
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

        let colorBtns = d3.select(this.colorRingContainer)
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
                // if (self.elementColorContainer == undefined) {
                //     return;
                // }

                if (self.mode == HandlesColorMode.UNIQUE_COLORS_ONLY) {
                    
                    // Verify the html container isn't undefined.
                    if (self.htmlContainer.parentElement == undefined) {
                        return;
                    }
                    
                    let center =
                        SvgGeometryServiceSingleton.getCenter(this);

                    center = convertCoordsRelativeTo(center, 
                        self.canvas.canvasEl,
                        self.htmlContainer.parentElement);
                    
                    // Display color picker
                    self.displayAttributeColorPicker(this, 
                        center, false, false, d3.color(_d.toString()));
                } else {
                    let center =
                        SvgGeometryServiceSingleton.getCenter(this);

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
                    let elementColors = d3.select(self.elementColorContainer)
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

    public getElement(): SVGGElement {
        return this.element;
    }

    public getContainer(): Element {
        return this.container;
    }
    
    public getEventEmitter(): d3.Dispatch<EventTarget> {
        return this.emitter;
    }

    //#endregion
}