/**
 * This should contain ALL class names, data-* attribute names and values for
 * all models in SvgEditor project.
 */
export const Names = {
    SvgCanvas: {
        DATA_NAME: "svg-canvas-editor",
        CLASS: "svg-canvas-editor",
        Events: {
            ON_VIEWBOX_CHANGE_EVT_NAME: "canvas-viewbox-change",
            ON_WIDTH_CHANGE_EVT_NAME: "canvas-width-change",
            ON_HEIGHT_CHANGE_EVT_NAME: "canvas-height-change"
        }
    },
    SvgDefs: {
        DATA_NAME: "defs-container",
        CLASS: "defs-container",
        Events: {
            ON_DEFS_CHANGED_EVT_NAME: "defs-changed"
        },
        SubElements: {
            SymbolContainer: {
                DATA_NAME: "symbols-container"
            },
            CachedElementsContainer: {
                DATA_NAME: "elements-cache"
            },
            EditorOnlyDefsContainer: {
                DATA_NAME: "editor-only-defs"
            }
        }
    },
    SvgEditor: {
        Mask: {
            DATA_NAME: "editor-mask"
        },
        Editor: {
            DATA_NAME: "editor-container"
        },
        OverEditor: {
            DATA_NAME: "over-editor-container"
        },
        UnderEditor: {
            DATA_NAME: "under-editor-container"
        }
    },
    Handles: {
        DATA_NAME: "handles-area",
        BTN_HANDLE_CLASS: "btn-handle",
        SubElements: {
            HightlightSection: {
                DATA_NAME: "hightlight-section"
            },
            ArcsContainer: {
                DATA_NAME: "arcs-container",
                SubElements: {
                    FillArc: {
                        DATA_NAME: "handles-fill-arc"
                    },
                    ColorsArc: {
                        DATA_NAME: "handles-colors-arc"
                    },
                    EditArc: {
                        DATA_NAME: "handles-edit-arc"
                    },
                    DeleteArc: {
                        DATA_NAME: "handles-delete-arc"
                    },
                    PanArc: {
                        DATA_NAME: "handles-pan-arc"
                    },
                    RotateArc: {
                        DATA_NAME: "handles-rotate-arc"
                    },
                    ScaleArc: {
                        DATA_NAME: "handles-scale-arc"
                    }
                }
            },
            ButtonsContainer: {
                DATA_NAME: "handles-button-container",
                SubElements: {
                    ColorsBtn: {
                        DATA_NAME: "handles-colors-btn"
                    },
                    EditBtn: {
                        DATA_NAME: "handles-edit-btn"
                    },
                    DeleteBtn: {
                        DATA_NAME: "handles-delete-btn"
                    },
                    PanBtn: {
                        DATA_NAME: "handles-pan-btn"
                    },
                    RotateBtn: {
                        DATA_NAME: "handles-rotate-btn"
                    },
                    ScaleBtn: {
                        DATA_NAME: "handles-scale-btn"
                    },
                    ToggleControlsBtn: {
                        DATA_NAME: "handles-toggle-controls-btn"
                    }
                },
            },
            ButtonArcPathsContainer: {
                DATA_NAME: "handles-btn-path-container",
                SubElements: {
                    ColorsBtnArcPath: {
                        DATA_NAME: "handles-colors-btn"
                    },
                    EditBtnArcPath: {
                        DATA_NAME: "handles-edit-btn"
                    },
                    DeleteBtnArcPath: {
                        DATA_NAME: "handles-delete-btn"
                    },
                    PanBtnArcPath: {
                        DATA_NAME: "handles-pan-btn"
                    },
                    RotateBtnArcPath: {
                        DATA_NAME: "handles-rotate-btn"
                    },
                    ScaleBtnArcPath: {
                        DATA_NAME: "handles-scale-btn"
                    }
                }
            },
            HightlightRect: {
                DATA_NAME: "highlight-area"
            },
            ColorsHelperContainer: {
                DATA_NAME: "colors-helpers-container"
            },
            RotationHelpersContainer: {
                DATA_NAME: "rotation-helpers-container",
                SubElements: {
                    DialLine: {
                        DATA_NAME: "dial-line"
                    },
                    DashedOuterCircle: {
                        DATA_NAME: "dashed-outer-circle"
                    },
                    PivotPoint: {
                        DATA_NAME: "pivot-point"
                    },
                    DialPivot: {
                        DATA_NAME: "dial-pivot-point"
                    },
                    DialPivotToPivotPointLine: {
                        DATA_NAME: "dial-pivot-to-pivot-point-line"
                    },
                    Grabber: {
                        DATA_NAME: "rotation-grabber"
                    }
                }
            },
            ScaleHelpersContainer: {
                DATA_NAME: "scale-helpers-container"
            }
        }
    }
};