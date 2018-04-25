import { Aperture, EVT_NAMES } from "./aperture.main";
import { SvgEditors } from "./index";

// [Private]

function lookupModeByNumber(num) {
    var result = null;

    for (var mode in MODES) {
        var modeName = mode;
        if (MODES[mode] == num) {
            result = mode;
        }
    }

    return result;
}

// [End Private]

// Define svg editors module
Aperture.register("SvgEditors", SvgEditors);

// Define Aperture.SvgEditorControls module
Aperture.register("SvgEditorControls", {
    addRectEl: $("#addSquare"),
    changeCanvasEl: $("#changeEditor"),
    editorEl: $("#editor"),
    loading: function(value) {
        if (value != null) {
            if (value == true) {
                Aperture
                    .SvgEditorControls
                    .editorEl[0]
                    .classList
                    .add("loading");
            } else if (value == false) {
                Aperture
                    .SvgEditorControls
                    .editorEl[0]
                    .classList
                    .remove("loading");
            }

            return;
        } else {
            return Aperture
                .SvgEditorControls
                .editorEl[0]
                .classList
                .contains("loading");
        }
    },
    maskSelectorEl: $("#changeCurrentEditorMask"),
    modeSelectEl: $("#changeMode"),
    mode: function(value) {
        if (value) {
            // Check that value is in range
            if (lookupModeByNumber(value)) {
                Aperture.SvgEditorControls.modeSelectEl.val(value);
            } else {
                throw new Error(`Value '${value}' wasn't in range.`);
            }
        } else {
            return Aperture.SvgEditorControls.val();
        }
    },
    MODES: Object.freeze({
        SELECT: 1,
        ZOOM: 2,
        DRAW: 3
    })
});

// Wait for the SvgEditors to be resolved
Aperture.resolve(["SvgEditors"]).then(() => {
        
    // Init controls (add evt listeners, populate options, etc...)
    Aperture.SvgEditorControls.addRectEl.on("click", function(e) {
        Aperture.SvgEditors.map(editor => {
            editor.addRectangle(50,50,50,50);
        });
    });

    Aperture.SvgEditorControls.modeSelectEl.on("change", function() {
        console.log("TODO");
    });

    // var canvas = Aperture.SvgEditors[0].canvases[0];
    // Aperture.SvgEditors[0].svgCanvasService.magnifyCanvas(canvas, {
    //     minX: 10, 
    //     minY: 10,
    //     width: 480,
    //     height: 480
    // }, 500);

    // Setup what happens on mask select el change evt
    Aperture.SvgEditorControls.maskSelectorEl.on("change", function(e) {        
        var val = Number(e.target.value) == -1 ? null : e.target.value;
        for (var editor of Aperture.SvgEditors) {
            editor.switchMaskTo(val);
        }
    });
    
    // Populate mask select el
    var editableAreaMasks = $(".editableAreaRect");
    for (var areaMask of editableAreaMasks) {
        var optionEl = document.createElement("option");
        optionEl.textContent = areaMask.id;
        Aperture.SvgEditorControls.maskSelectorEl.append(optionEl);
    }

    // Setup what happens on canvas select el change evt
    Aperture.SvgEditorControls.changeCanvasEl.on("change", function(e) {
        var val = e.target.value;
        for (var editor of Aperture.SvgEditors) {
            $(editor.canvases).each(function(index, element) {
                if (element.id == val) {
                    element.classList.add("active");
                } else {
                    element.classList.remove("active");
                }
            });
        }
    });

    // Populate canvas select el
    for (var canvas of Aperture.SvgEditors[0].canvases) {
        var optionEl = document.createElement("option");
        optionEl.textContent = canvas.id;
        Aperture.SvgEditorControls.changeCanvasEl.append(optionEl);
    }

    // Finished loading
    Aperture.SvgEditorControls.loading(false);
}).catch(e => {
    console.error(e);
    Aperture.SvgEditorControls.loading(false);
});
