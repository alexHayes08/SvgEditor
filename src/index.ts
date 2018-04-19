import * as $ from 'jquery';

import ApertureSvgEditor from './models/aperture-svg-editor';

declare var SvgEditors: ApertureSvgEditor[];

$(function() {
    SvgEditors = [];
    $('aperture-svg-editor').each(function() {
        SvgEditors.push(new ApertureSvgEditor(this));
    });
});