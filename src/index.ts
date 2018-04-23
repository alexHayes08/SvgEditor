import * as $ from 'jquery';

import ApertureSvgEditor from './models/aperture-svg-editor';

// function getEditors(): ApertureSvgEditor[] {
//     let editors: ApertureSvgEditor[] = [];
//     // let editorEls = $('aperture-svg-editor').each(function() {
//     //     editors.push(new ApertureSvgEditor(this));
//     // });
//     let editorEls = document.getElementsByTagName('aperture-svg-editor');
//     for (let i = 0; i < editorEls.length; i++) {
//         editors.push(new ApertureSvgEditor(editorEls.item(i)));
//     }
//     return editors;
// }

var editors: ApertureSvgEditor[] = [];
var editorEls = $('aperture-svg-editor').each(function() {
    editors.push(new ApertureSvgEditor(this));
});

export default editors;
