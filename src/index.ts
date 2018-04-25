const { Aperture } = require("./aperture.main");

import * as $ from 'jquery';

import { ApertureSvgEditor } from './models/aperture-svg-editor';

export const SvgEditors: ApertureSvgEditor[] = [];
let editorEls = $('aperture-svg-editor').each(function() {
    SvgEditors.push(new ApertureSvgEditor(this));
});
