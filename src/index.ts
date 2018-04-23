import * as $ from 'jquery';

import ApertureSvgEditor from './models/aperture-svg-editor';

declare namespace ApertureSvgEditor.SvgEditors {
};

let Editors: ApertureSvgEditor[] = [];
let editorEls = $('aperture-svg-editor').each(function() {
    Editors.push(new ApertureSvgEditor(this));
});

export default Editors;
