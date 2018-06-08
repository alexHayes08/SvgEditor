import * as d3 from 'd3';

import { InternalError } from './../errors';
import { IDOMDrawable } from './../idom-drawable';
import { ISvgDefs } from './../svg-defs-model';
import { ITab, Tabs } from './../tabs';

const uniqid = require("uniqid");

export enum ColorPickerMode {
    RGB,
    HSL,
    CMYK,
    WHEEL,
    CMS,
    UNSET
};

enum ColorRefType {
    
    // Element defines its own color
    SOLID,

    // References a linear gradient in the defs.
    LINEAR_GRADIENT,

    // References a radial gradient element in the defs.
    RADIAL_GRADIENT,

    // Reference a element in the defs.
    URL,

    // No color is defined or referenced.
    NONE
}

interface ColorMode {
    name: string;
    colorFormat: ColorPickerMode;
    colorType: ColorRefType;
}

interface ColorRef {
    type: ColorRefType;
}

const COLOR_MODES: ColorMode[] = [
    {
        name: "RGB",
        colorFormat: ColorPickerMode.RGB,
        colorType: ColorRefType.NONE
    },
    {
        name: "HSL",
        colorFormat: ColorPickerMode.HSL,
        colorType: ColorRefType.NONE
    },
    {
        name: "CYMK",
        colorFormat: ColorPickerMode.CMYK,
        colorType: ColorRefType.NONE
    },
    {
        name: "Wheel",
        colorFormat: ColorPickerMode.WHEEL,
        colorType: ColorRefType.NONE
    },
    {
        name: "CMS",
        colorFormat: ColorPickerMode.CMS,
        colorType: ColorRefType.NONE
    },
    {
        name: "Unset",
        colorFormat: ColorPickerMode.UNSET,
        colorType: ColorRefType.NONE
    }
];

export class SvgColorPicker implements IDOMDrawable<HTMLElement> {
    //#region Fields

    private static DATA_NAME: string = "color-picker";
    private static RecentlyUsedColors: d3.Color[];
    
    private readonly defs: ISvgDefs;
    
    private color: d3.Color;
    private container: Element;
    private element: HTMLElement;
    private oldColor: d3.Color;
    private tabs: Tabs;

    private newColorPreviewEl: HTMLElement;
    private oldColorPreviewEl: HTMLElement;
    private tabsContainerEl: HTMLElement;
    private tabsHeaderContainerEl: HTMLElement;
    
    private rgbContainer?: HTMLElement;

    //#endregion

    //#region Ctor

    public constructor(container: Element, defs: ISvgDefs)
    {
        // Assign static usedColors a property if not set
        if (SvgColorPicker.RecentlyUsedColors == undefined) {
            SvgColorPicker.RecentlyUsedColors = [];
        }

        let self = this;

        this.color = d3.color("rgb(0,0,0)");
        this.oldColor = d3.color("rgb(0,0,0)");
        this.container = container;
        this.defs = defs;

        // Create element
        this.element = document.createElement("div");
        this.element.setAttribute("data-name", SvgColorPicker.DATA_NAME);

        // Create color previews
        this.newColorPreviewEl = document.createElement("div");
        this.newColorPreviewEl.classList.add("color-preview", "new-preview");
        this.oldColorPreviewEl = document.createElement("div");
        this.oldColorPreviewEl.classList.add("color-preview", "old-preview");
        let colorPreviewContainer = document.createElement("div");
        colorPreviewContainer.classList.add("color-preview-container");
        colorPreviewContainer.appendChild(this.newColorPreviewEl);
        colorPreviewContainer.appendChild(this.oldColorPreviewEl);

        // Create tab elements
        this.tabsContainerEl = document.createElement("div");
        this.tabsContainerEl.classList.add("tabs");
        this.tabsHeaderContainerEl = document.createElement("div");
        this.tabsHeaderContainerEl.classList.add("tab-headers");
        let tabInfo: ITab[] = [];

        // Update
        let tabs = d3.select(this.tabsContainerEl)
            .selectAll<HTMLElement, {}>("div")
            .data(COLOR_MODES);

        // Enter
        tabs.enter()
            .append<HTMLElement>("div")
            .attr("data-name", function(d) { return d.name; })
            .each(function(d) {
                let tab: ITab = {
                    disabled: false,
                    tabBodyElement: this,
                    tabName: d.name,
                    selected: false,
                    // iconUrl: undefined
                };
                tabInfo.push(tab);
                switch (d.colorFormat) {
                    case ColorPickerMode.CMS:
                        self.drawCMS(d3.select(this));
                        break;
                    case ColorPickerMode.CMYK:
                        self.drawCYMK(d3.select(this));
                        break;
                    case ColorPickerMode.HSL:
                        self.drawHSL(d3.select(this));
                        break;
                    case ColorPickerMode.RGB:
                        self.drawRgb(d3.select(this));
                        break;
                    case ColorPickerMode.WHEEL:
                        self.drawWheel(d3.select(this));
                        break;
                }
            });

        // Exit
        tabs.exit()
            .remove();

        // Compose elements
        this.element.appendChild(colorPreviewContainer);
        this.element.appendChild(this.tabsHeaderContainerEl);
        this.element.appendChild(this.tabsContainerEl);

        // Create tabs
        this.tabs = new Tabs(this.tabsHeaderContainerEl, tabInfo);
    }

    //#endregion

    //#region Properties

    //#endregion

    //#region Functions

    private changeColor(color: d3.Color, replaceOldColor: boolean): void {
        console.log(`The color changed from ${this.oldColor.toString()} to ${color.toString()}`);
        this.color = color;

        if (replaceOldColor) {
            this.oldColor = color;
        }

        this.update();
    }

    //#region Draw color tabs

    private drawRgb(tab: d3.Selection<HTMLElement, ColorMode, null, undefined>): void
    {
        let self = this;
        let controls = tab.append<HTMLElement>("div")
            .classed("controls", true)
            .classed("rgb-controls", true);

        let node = controls.node();
        if (node == undefined) {
            throw new InternalError();
        }

        this.rgbContainer = node;

        // Append R slider
        let r_control = controls.append("label")
        r_control.append("span")
            .text("R");
        r_control.append("input")
            .attr("type", "range")
            .attr("min", 0)
            .attr("max", 255)
            .attr("value", 0)
            .attr("data-name", "r");
        r_control.append("input")
            .attr("type", "number")
            .attr("min", 0)
            .attr("max", 255)
            .attr("value", 0)
            .attr("data-name", "r");
        r_control.selectAll<HTMLInputElement, {}>("input")
            .on("keyup mousedown drag", function() {
                let color = d3.color(self.color.toString()).rgb();
                color.r = Number(this.value);
                self.changeColor(color, false);
            });

        // Append G slider
        let g_control = controls.append("label");
        g_control.append("span")
            .text("G");
        g_control.append("input")
            .attr("type", "range")
            .attr("min", 0)
            .attr("max", 255)
            .attr("value", 0)
            .attr("data-name", "g");
        g_control.append("input")
            .attr("type", "number")
            .attr("min", 0)
            .attr("max", 255)
            .attr("value", 0)
            .attr("data-name", "g");
        g_control.selectAll<HTMLInputElement, {}>("input")
            .on("keyup mousedown", function() {
                let color = d3.color(self.color.toString()).rgb();
                color.g = Number(this.value);
                self.changeColor(color, false);
            });

        // Append B slider
        let b_control = controls.append("label");
        b_control.append("span")
            .text("B");
        b_control
            .append("input")
            .attr("type", "range")
            .attr("min", 0)
            .attr("max", 255)
            .attr("value", 0)
            .attr("data-name", "b");
        b_control.append("input")
            .attr("type", "number")
            .attr("min", 0)
            .attr("max", 255)
            .attr("value", 0)
            .attr("data-name", "b");
        b_control.selectAll<HTMLInputElement, {}>("input")
            .on("keyup mousedown", function() {
                let color = d3.color(self.color.toString()).rgb();
                color.b = Number(this.value);
                self.changeColor(color, false);
            });

        // Append A slider
        let a_control = controls.append("label");
        a_control.append("span")
            .text("A");
        a_control.append("input")
            .attr("type", "range")
            .attr("min", 0)
            .attr("max", 1)
            .attr("step", .1)
            .attr("value", 1)
            .attr("data-name", "a");
        a_control.append("input")
            .attr("type", "number")
            .attr("min", 0)
            .attr("max", 1)
            .attr("value", 1)
            .attr("data-name", "a");
        a_control.selectAll<HTMLInputElement, {}>("input")
            .on("keyup mousedown", function() {
                let color = d3.color(self.color.toString()).rgb();
                color.opacity = Number(this.value);
                self.changeColor(color, false);
            });

        
        console.log("Drawing RGB tab.");
    }

    private drawHSL(tab: d3.Selection<HTMLElement, ColorMode, null, undefined>): void
    {
        console.log("Drawing HSL tab.");
    }

    private drawCYMK(tab: d3.Selection<HTMLElement, ColorMode, null, undefined>): void
    {
        console.log("Drawing CYMK tab.");
    }

    private drawCMS(tab: d3.Selection<HTMLElement, ColorMode, null, undefined>): void
    {
        console.log("Drawing CMS tab.");
    }

    private drawWheel(tab: d3.Selection<HTMLElement, ColorMode, null, undefined>): void
    {
        console.log("Drawing Wheel tab.");
    }

    //#endregion

    public draw(): void {
        this.oldColorPreviewEl.style.background = this.oldColor.toString();
        this.newColorPreviewEl.style.background = this.color.toString();
        this.container.appendChild(this.element);
        this.tabs.draw();
    }

    public update(): void {

        // Verify the element isn't undefined.
        if (this.element == undefined) {
            return;
        }

        // Update color previews.
        this.oldColorPreviewEl.style.background = this.oldColor.toString();
        this.newColorPreviewEl.style.background = this.color.toString();
    }

    public erase(): void {
        
        // Verify the element isn't undefined.
        if (this.element == undefined) {
            return;
        }

        this.element.remove();
    }

    public getElement(): HTMLElement {
        return this.element;
    }

    public getContainer(): Element {
        return this.container;
    }

    //#endregion
}