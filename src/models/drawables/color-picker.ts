import * as d3 from 'd3';

import { ITab, Tabs } from '../drawables/tabs';
import { IDOMDrawable } from './../idom-drawable';
import { ISvgDefs } from './../svg-defs-model';
import { ColorControlRgb } from './color-control-rgb';
import { interpolateRgbBasisClosed } from 'd3';
import { createEl } from '../../helpers/html-helper';

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

export class ColorPicker implements IDOMDrawable<HTMLElement> {
    //#region Fields

    private static DATA_NAME: string = "color-picker";
    private static RecentlyUsedColors: d3.Color[];
    
    private readonly container: Element;
    private readonly element: HTMLElement;
    private readonly emitter: d3.Dispatch<EventTarget>;
    private readonly newColorPreviewEl: HTMLElement;
    private readonly oldColorPreviewEl: HTMLElement;
    private readonly tabsContainerEl: HTMLElement;
    private readonly tabsHeaderContainerEl: HTMLElement;
    private rgbControl: ColorControlRgb;
    
    private _color: d3.Color;
    private oldColor: d3.Color;
    private tabs: Tabs;

    //#endregion

    //#region Ctor

    public constructor(container: Element) {
        
        // Assign static usedColors a property if not set
        if (ColorPicker.RecentlyUsedColors == undefined) {
            ColorPicker.RecentlyUsedColors = [];
        }

        let self = this;

        this._color = d3.rgb("rgb(127,127,127)");
        this.oldColor = d3.rgb("rgb(127,127,127)");
        this.container = container;
        this.emitter = d3.dispatch("change");

        // Create element
        this.element = document.createElement("div");
        this.element.setAttribute("data-name", ColorPicker.DATA_NAME);

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

        // Create the CMS control.
        let cmsContainer = createEl("div", this.tabsContainerEl);

        // Create CYMK control.
        let cymkContainer = createEl("div", this.tabsContainerEl);

        // Create HSL control.
        let hslContainer = createEl("div", this.tabsContainerEl);

        // Create the RGB control.
        let rgbContainer = 
            createEl<HTMLDivElement>("div", this.tabsContainerEl);
        this.rgbControl = new ColorControlRgb(rgbContainer);
        this.rgbControl.color = this.color;
        this.rgbControl.draw();
        this.rgbControl.getEventEmitter().on("change", function() {
            self.changeColor(self.rgbControl.color, false);
        });

        // Create WHEEL control.
        let wheelContainer = createEl("div", this.tabsContainerEl);

        // Create unset control
        let unsetContainer = createEl("div", this.tabsContainerEl);

        // Compose elements
        this.element.appendChild(colorPreviewContainer);
        this.element.appendChild(this.tabsHeaderContainerEl);
        this.element.appendChild(this.tabsContainerEl);

        // Create tabs
        let tabInfo: ITab[] = [
            {
                disabled: false,
                tabBodyElement: rgbContainer,
                tabName: "RGB",
                selected: true
            },
            {
                disabled: false,
                tabBodyElement: cmsContainer,
                tabName: "CMS",
                selected: false
            },
            {
                disabled: false,
                tabBodyElement: cymkContainer,
                tabName: "CYMK",
                selected: false
            },
            {
                disabled: false,
                tabBodyElement: hslContainer,
                tabName: "HSL",
                selected: false
            },
            {
                disabled: false,
                tabBodyElement: wheelContainer,
                tabName: "Wheel",
                selected: false
            },
            {
                disabled: false,
                tabBodyElement: unsetContainer,
                tabName: "Unset",
                selected: false
            }
        ];

        this.tabs = new Tabs(this.tabsHeaderContainerEl, tabInfo);
        this.tabs.draw();
    }

    //#endregion

    //#region Properties

    public get color(): d3.Color {
        return this._color;
    }

    //#endregion

    //#region Functions

    private changeColor(color: d3.Color, replaceOldColor: boolean): void {
        // console.log(`The color changed from ${this.oldColor.toString()} to ${color.toString()}`);
        this._color = color;

        if (replaceOldColor) {
            this.oldColor = color;
        }

        this.update();
    }

    public draw(): void {
        this.getContainer().appendChild(this.getElement());
        this.oldColorPreviewEl.style.background = this.oldColor.toString();
        this.newColorPreviewEl.style.background = this.color.toString();
        this.rgbControl.update();
    }

    public update(): void {

        // Update color previews.
        this.oldColorPreviewEl.style.background = this.oldColor.toString();
        this.newColorPreviewEl.style.background = this.color.toString();
        this.tabs.update();
        this.rgbControl.color = this.color;
        this.rgbControl.update();
    }

    public erase(): void {
        this.element.remove();
    }

    public getElement(): HTMLElement {
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