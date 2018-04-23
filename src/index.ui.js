(function(Aperture) {
    // Retrieve all control elements on the page
    Aperture.SvgEditorControls = {
        addRect: $("#addSquare"),
        changeEditorEl: $("#changeEditor"),
        maskSelectorEl: $("#changeCurrentEditorMask"),
    };

    // Init controls
    Aperture.SvgEditorControls.addRect.on("click", function(e) {
        Aperture.main.map(editor => {
            editor.addRectangle(50,50,50,50);
        });
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
})(window.Aperture = (window.Aperture || {}));