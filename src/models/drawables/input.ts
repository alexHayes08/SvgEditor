import * as d3 from 'd3';

import { createEl } from '../../helpers/html-helpers';
import { ActivatableServiceSingleton } from '../../services/activatable-service';
import { IDOMDrawable } from '../idom-drawable';

export type Validator = (value: string) => string|undefined;

export class Input implements IDOMDrawable<HTMLDivElement> {
    //#region Fields

    private readonly container: Element;
    private readonly element: HTMLDivElement;
    private readonly emitter: d3.Dispatch<EventTarget>;
    private readonly errorMsgEl: HTMLElement;
    private readonly inputEl: HTMLInputElement;

    private value: string;
    private _isValid: boolean;
    private _validator?: Validator;

    public discardInvalidValues: boolean;

    //#endregion

    //#region Constructor

    public constructor(container: Element) {
        let self = this;
        this.container = container;
        this.discardInvalidValues = false;
        this.value = "";
        this._isValid = true;

        // Create element.
        this.element = document.createElement("div");
        this.element.classList.add("input");

        // Create input element.
        this.inputEl = createEl<HTMLInputElement>("input", this.element);
        this.inputEl.classList.add("width-100-per");
        
        // Create error message element.
        this.errorMsgEl = createEl<HTMLElement>("div", this.element);
        this.errorMsgEl.classList.add("error-message");
        ActivatableServiceSingleton.register(this.errorMsgEl, false);

        // Create event emitter.
        this.emitter = d3.dispatch("change");
    }

    //#endregion

    //#region Properties

    public get isValid(): boolean {
        return this._isValid;
    }

    public set validator(value: Validator|undefined) {
        this._validator = value;
        this.validate(this.getValue());
    }

    //#endregion

    //#region Functions

    public setValue(value: string, emitEvent: boolean = true): void {
        if (this.validate(value) || !this.discardInvalidValues) {
            this.value = value;
            if (emitEvent) {
                this.getEventEmitter().call("change", this.getElement());
            }
        }
    }

    public getValue(): string {
        return this.value;
    }

    public validate(value: string): boolean {
        
        // Verify the validator is defined.
        if (this.validator == null) {
            this._isValid = true;
            return this.isValid;
        }

        let errorMessage: string|undefined = undefined;
        
        try {
            errorMessage = this.validator(value);
        } catch (e) {
            errorMessage = e.toString();
        }

        if (errorMessage == undefined) {

            // Input is valid.
            this.errorMsgEl.textContent = "";
            this._isValid = true;
            ActivatableServiceSingleton.deactivate(this.errorMsgEl);
        } else {

            // Error occurred, display error message.
            this.errorMsgEl.textContent = errorMessage;
            this._isValid = false;
            ActivatableServiceSingleton.activate(this.errorMsgEl);
        }

        return this.isValid;
    }

    public getInputElement(): HTMLInputElement {
        return this.inputEl;
    }

    public draw(): void {
        let self = this;
        this.getContainer().appendChild(this.getElement());

        // Add event listener for the change event.
        d3.select<HTMLInputElement, {}>(this.inputEl)
            .on("change", function() {
                if (self.getValue() != this.value) {
                    self.setValue(this.value, true);
                }
            });

        this.update();
    }

    public update(): void {
        this.inputEl.value = this.value;
    }

    public erase(): void {
        this.getElement().remove();
    }

    public getContainer(): Element {
        return this.container;
    }

    public getElement(): HTMLDivElement {
        return this.element;
    }

    public getEventEmitter(): d3.Dispatch<EventTarget> {
        return this.emitter;
    }

    //#endregion
}