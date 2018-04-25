(function(Aperture) {
    var EVT_NAMES = Object.freeze({
        LOADED_PROP: "loaded_prop"
    });

    Aperture.resolve = function (name, timeoutMS) {
        return new Promise(function(resolve, reject) {
            if (Aperture[name] != null) {
                resolve();
            }
            
            var checkForObj = function (e) {
                if (Aperture[name] != null) {
                    resolve();
                    document.removeEventListener(checkForObj);
                    return;
                }
            }

            // Default wait is one minute for object to load.
            timeoutMS = timeoutMS || 60 * 1000;
            var timeout = setTimeout(function() {
                reject("The module wasn't loaded.");
                document.removeEventListener(EVT_NAMES.LOADED_PROP, checkForObj);
            }, timeoutMS)
            
            document.addEventListener(EVT_NAMES.LOADED_PROP, checkForObj);
        });
    }

    // Create proxy that returns Promises as new objects are added
    var intercepter = {
        set: function(target, property, value, receiver) {
            target[property] = value;
            $(document).trigger(EVT_NAMES.LOADED_PROP);
            return true;
        }
    }
    Aperture = new Proxy(Aperture, intercepter);

    // Retrieve all control elements on the page
    Aperture.SvgEditorControls = {
        addRectEl: $("#addSquare"),
        changeEditorEl: $("#changeEditor"),
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
        }
    };

    var MODES = Object.freeze({
        SELECT: 1,
        ZOOM: 2,
        DRAW: 3
    });

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

    // Init controls
    Aperture.SvgEditorControls.addRectEl.on("click", function(e) {
        Aperture.main.map(editor => {
            editor.addRectangle(50,50,50,50);
        });
    });

    Aperture.SvgEditorControls.modeSelectEl.on("change", )

    Aperture.resolve("main").then(resolved => {
        Aperture.main[0].svgCanvasService.magnifyCanvas(canvases[0], {
                minX: 100, 
                minY: 100,
                width: 100,
                height: 100
            }, 5000);
    }).catch(e => console.error(e));
    // var canvases = $("#demoA,#demoB");
    // setTimeout(function() {
    //     Aperture.main[0].svgCanvasService.magnifyCanvas(canvases[0], {
    //             minX: 100, 
    //             minY: 100,
    //             width: 100,
    //             height: 100
    //         }, 5000);
    // }, 5000);

    Aperture.SvgEditorControls.changeEditorEl.on("change", function(e) {
        var val = e.target.value;
        for (var editor of Aperture.main) {
        }
    });

    Aperture.SvgEditorControls.maskSelectorEl.on("change", function(e) {        
        var val = Number(e.target.value) == -1 ? null : e.target.value;
        for (var editor of Aperture.main) {
            editor.switchMaskTo(val);
        }
    });
    
    var editableAreaMasks = $(".editableAreaRect");
    for (var areaMask of editableAreaMasks) {
        var optionEl = document.createElement("option");
        optionEl.textContent = areaMask.id;
        Aperture.SvgEditorControls.maskSelectorEl.append(optionEl);
    }

    // Add evt listener for when 
})(window.Aperture = (window.Aperture || {}));