import * as $ from 'jquery';

import ApertureSvgEditor from './models/aperture-svg-editor';

// $(function() {
    
// });

let Editors: ApertureSvgEditor[] = [];
$('aperture-svg-editor').each(function() {
    Editors.push(new ApertureSvgEditor(this));
});

export default Editors;