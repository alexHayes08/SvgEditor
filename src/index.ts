import * as $ from "jquery";

// import { ApertureSvgEditor } from "./models/aperture-svg-editor";
import { SvgCanvas } from "./models/svg-canvas-model";
import { SvgHandles } from "./models/svg-handles";

// this is only temporary, should be moved elsewhere...
import "./ui/scss/ui.styles.scss";

export const SvgEditors: SvgCanvas[] = [];
const $parentEl : JQuery<HTMLElement> = $("#editorCavasContainer");
$("aperture-svg-editor").each(function() {
    const editor : SvgCanvas = new SvgCanvas(500, 
        500,
        {
            minX: 0,
            minY: 0, 
            width: 500,
            height: 500
        },
        $parentEl[0]);
    const handles : SvgHandles = new SvgHandles(editor);
    handles.draw();
    editor.handles = handles;
    SvgEditors.push(editor);
});
