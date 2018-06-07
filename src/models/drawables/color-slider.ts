import * as d3 from 'd3';

import { ICoords2D, TransformType } from '../../services/svg-geometry-service';
import { HTMLTransformString } from '../html-transform-string';
import { IDOMDrawable } from '../idom-drawable';
import { calcOffset } from '../../helpers/geometry-helpers';
import { useBlackAsContrast } from '../../helpers/color-helper';

export class ColorSlider implements IDOMDrawable<HTMLElement> {
    //#region Fields

    private readonly container: HTMLElement;
    private readonly gradientBgEl: HTMLElement;
    private readonly element: HTMLElement;
    private readonly sliderEl: HTMLElement;
    // private readonly sliderTop: HTMLElement;
    // private readonly sliderMid: HTMLElement;
    // private readonly sliderBot: HTMLElement;
    private readonly sliderTransform: HTMLTransformString;

    private elementBcr: ClientRect|DOMRect;
    private sliderBcr: ClientRect|DOMRect;
    private sliderWidth: number;
    private _value: number;

    public startColor: d3.Color;
    public endColor: d3.Color;
    public onBeforeChange: Array<() => void>;
    public onChange: Array<() => void>;
    public onAfterChange: Array<() => void>;

    //#endregion

    //#region Ctor

    public constructor(container: HTMLElement) {
        this.container = container;
        this.startColor = d3.color("rgb(0,0,0)");
        this.endColor = d3.color("rgb(0,0,0)");
        this.onChange = [];
        this.onAfterChange = [];
        this.onBeforeChange = [];
        
        this.sliderTransform = new HTMLTransformString([
            TransformType.TRANSLATE,
            TransformType.TRANSLATE
        ]);

        this.sliderWidth = 0;
        this._value = 0;

        // Create the element
        this.element = document.createElement("div");
        this.element.classList.add("color-slider");

        // Create checkerboard el
        this.gradientBgEl = document.createElement("div");
        d3.select(this.gradientBgEl)
            .classed("gradientBG", true)
            .style("background", ColorSlider.CreateCssLinearGradientString([
                this.startColor,
                this.endColor
            ]));

        // Create slider element
        this.sliderEl = document.createElement("div");
        this.sliderEl.classList.add("slider");

        // this.sliderTop = document.createElement("div");
        // this.sliderTop.classList.add("slider-top");
        // this.sliderMid = document.createElement("div");
        // this.sliderMid.classList.add("slider-mid");
        // this.sliderBot = document.createElement("div");
        // this.sliderBot.classList.add("slider-bot");
        // this.sliderEl.appendChild(this.sliderTop);
        // this.sliderEl.appendChild(this.sliderMid);
        // this.sliderEl.appendChild(this.sliderBot);

        // Compose elements
        this.element.appendChild(this.gradientBgEl);
        this.element.appendChild(this.sliderEl);

        this.elementBcr = this.getElement().getBoundingClientRect();
        this.sliderBcr = this.sliderEl.getBoundingClientRect();
    }

    //#endregion

    //#region Properties

    public get value(): number {
        return this._value;
    }

    public set value(value: number) {
        if (value < 0 || value > 1) {
            throw new Error("Must be greater than or equal to zero and less than or equal to one.");
        }
        this._value = value;
    }

    public get color(): d3.Color {
        let startRgb = d3.color(this.startColor.toString()).rgb();
        let endRgb = d3.color(this.endColor.toString()).rgb();

        // Normalize rgb values
        startRgb.r = Number.isNaN(startRgb.r) ? 0 : startRgb.r;
        startRgb.g = Number.isNaN(startRgb.g) ? 0 : startRgb.g;
        startRgb.b = Number.isNaN(startRgb.b) ? 0 : startRgb.b;
        startRgb.opacity = Number.isNaN(startRgb.opacity) 
            ? 0 
            : startRgb.opacity;

        endRgb.r = Number.isNaN(endRgb.r) ? 0 : endRgb.r;
        endRgb.g = Number.isNaN(endRgb.g) ? 0 : endRgb.g;
        endRgb.b = Number.isNaN(endRgb.b) ? 0 : endRgb.b;
        endRgb.opacity = Number.isNaN(endRgb.opacity) ? 0 : endRgb.opacity;

        let resultR = startRgb.r + this.value * (endRgb.r - startRgb.r);
        let resultG = startRgb.g + this.value * (endRgb.g - startRgb.g);
        let resultB = startRgb.b + this.value * (endRgb.b - startRgb.b);
        let resultA = startRgb.opacity + this.value
            * (endRgb.opacity - startRgb.opacity);
        
        let result = d3.rgb(resultR, resultG, resultB, resultA);
        return result;
    }

    //#endregion

    //#region Functions

    private static CreateCssLinearGradientString(colors: d3.Color[]): string {
        let colorStr = "";
        colors.map(c => colorStr += `, ${c.toString()}`);
        return `linear-gradient(to right${colorStr})`;
    }

    private updateCachedProps(): void {
        this.elementBcr = this.getElement().getBoundingClientRect();
        this.sliderBcr = this.sliderEl.getBoundingClientRect();
        this.sliderWidth = this.sliderBcr.right 
            - this.sliderBcr.left;

        this.sliderTransform.setTranslate({
            x: this.sliderWidth / -2,
            y: 0
        }, 1);
    }

    /**
     * Updates the 
     * @param coords - Mouse coords relative to the element returned from
     * getElement().
     */
    private updateValueFromD3Event(coords: ICoords2D): void {
        // console.log(coords);
        let dx = (coords.x)
            / (this.elementBcr.right - this.elementBcr.left);

        // Verify dx is never greater than one or less than zero.
        dx = dx > 1 ? 1 : dx;
        dx = dx < 0 ? 0 : dx;

        this.value = dx;
    }

    private executeDragStartActions(): void {
        for (let action of this.onBeforeChange) {
            try {
                action();
            } catch (e) {
                console.error(e);
            }
        }
    }

    private executeDragActions(): void {
        for (let action of this.onChange) {
            try {
                action();
            } catch(e) {
                console.error(e);
            }
        }
    }

    private executeDragEndActions(): void {
        for (let action of this.onAfterChange) {
            try {
                action();
            } catch(e) {
                console.error(e);
            }
        }
    }

    public draw(): void {
        let self = this;
        self.getContainer().appendChild(self.getElement());

        d3.select(self.gradientBgEl)
            .on("click", function() {
                self.executeDragStartActions();
                self.updateCachedProps();
                self.updateValueFromD3Event(calcOffset({
                    x: self.elementBcr.right - self.elementBcr.right,
                    y: 0
                }, d3.event));
                self.update();
                self.executeDragActions();
                self.executeDragEndActions();
            });
        
        // Add drag behavior to the slider.
        d3.select<HTMLElement, {}>(self.sliderEl)
            .call(d3.drag<HTMLElement, {}>()
                .on("start", function() {
                    console.log("ColorSlider drag started.");
                    self.updateCachedProps();
                    self.executeDragStartActions();
                })
                .on("drag", function() {
                    let { x, y } = d3.event;
                    self.updateValueFromD3Event({x,y});
                    self.update();
                    self.executeDragActions();
                })
                .on("end", function() {
                    console.log("ColorSlider drag ended.");
                    self.executeDragEndActions();
                }));
    }

    public update(): void {
        let self = this;
        d3.select(self.gradientBgEl)
            .style("background", function() {
                return ColorSlider.CreateCssLinearGradientString([
                    self.startColor, 
                    self.endColor
                ]);
            });

        d3.select(self.sliderEl)
            .style("transform", function() {
                return self.sliderTransform.setTranslate({
                    x: self.getElement().clientWidth * self.value,
                    y: 0
                }).toTransformString();
            }).classed("dark", function() {
                return useBlackAsContrast(self.color);
            });

        // d3.select(self.sliderTop)
        //     .style("background", self.color.toString());
    }

    public erase(): void {
        this.getElement().remove();
    }

    public getElement(): HTMLElement {
        return this.element;
    }

    public getContainer(): Element {
        return this.container;
    }

    //#endregion
}