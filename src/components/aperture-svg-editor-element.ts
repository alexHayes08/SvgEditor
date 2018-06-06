import { html, LitElement } from '@polymer/lit-element';
import { TemplateResult } from 'lit-html';

import { Handles } from '../models/handles';

// @CustomElement("aperture-svg-editor")
export class ApertureSvgEditorElement extends LitElement {
    //#region Polymer Related Fields/Properties

    public static get properties() {
        return {
            foo: String,
            whale: Number
        }
    }

    public static get template(): TemplateResult {
        return html`
            <style>
            </style>
            <h1>Testing</h1>
        `;
    }

    public static is = "aperture-svg-editor";

    //#endregion

    //#region Fields

    target: string;

    public handles?: Handles;

    //#endregion

    //#region Ctor

    public constructor() {
        super();

        this.target = "";
    }

    //#endregion

    //#region Properties

    //#endregion

    //#region Functions

    //#endregion
}

customElements.define(ApertureSvgEditorElement.is, ApertureSvgEditorElement);