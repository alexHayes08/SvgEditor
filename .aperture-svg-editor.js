import {html, PolymerElement} from '@polymer/polymer/polymer-element.js';

/**
 * `aperture-svg-editor`
 * 
 *
 * @customElement
 * @polymer
 * @demo demo/index.html
 */
class ApertureSvgEditor extends PolymerElement {
  static get template() {
    return html`
      <style>
        :host {
          display: block;
        }
      </style>
      <h2>Hello [[prop1]]!</h2>
    `;
  }
  static get properties() {
    return {
      prop1: {
        type: String,
        value: 'aperture-svg-editor',
      },
    };
  }
}

window.customElements.define('aperture-svg-editor', ApertureSvgEditor);
