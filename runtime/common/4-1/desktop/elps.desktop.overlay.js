/*Lightbox and messages plugin*/
(function ($) {
    var defaults = {
        buttons: {
            button1: {
                text: "OK",
                danger: false,
                onclick: function () {
                    $.elpsOverlay("hide")
                }
            }
        },
        icon: "default",
        content: "...",
        position: "top",
        closeKey: true,
        closeOverlay: false,
        useOverlay: true,
        autoclose: false,
        easingDuration: 0, //900
        easingIn: "swing",
        easingOut: "swing",
        height: "auto",
        width: "360px",
        zIndex: 2000,
        bound: window,
        afterHide: function () {},
        afterShow: function () {}
    }, opts, timeoutId, $w = $(window),
        methods = {
            hide: function (options, callback, self) {
                if (methods.isActive()) {
                    $("#elpsOverlay-wrapper").stop(true, true);
                    var $f = $("#elpsOverlay-wrapper"),
                        pos = $f.css("position"),
                        isFixed = (pos === "fixed"),
                        yminpos = 0;
                    switch (opts.position) {
                        case "bottom":
                        case "center":
                            yminpos = (isFixed ? $w.height() : $f.offset().top + $f.outerHeight()) + 10;
                            break;
                        default:
                            yminpos = (isFixed ? (-1) * ($f.outerHeight()) : $f.offset().top - $f.outerHeight()) - 10
                    }
                    $f.animate({
                        "top": (yminpos),
                        "opacity": isFixed ? 1 : 0
                    }, (opts.easingDuration || opts.duration), opts.easingOut, function () {
                        if (msie && document.documentMode<9) {
                            $("#elpsOverlay-overlay").css("display", "none")
                        } else {
                            $("#elpsOverlay-overlay").fadeOut("fast")
                        }
                        $f.remove();
                        clearTimeout(timeoutId);
                        callback = typeof callback === 'function' ? callback : opts.afterHide;
                        callback.call(self)
                    });
                    $(document).unbind("keydown", helpers.enterKeyHandler).unbind("keydown", helpers.closeKeyHandler).unbind("keydown", helpers.tabKeyHandler)
                }
            },
            resize: function (options, callback, self) {
                var $f = $("#elpsOverlay-wrapper"),
                    newWidth = parseInt(options.width, 10),
                    newHeight = parseInt(options.height, 10),
                    diffWidth = Math.abs($f.outerWidth() - newWidth),
                    diffHeight = Math.abs($f.outerHeight() - newHeight);
                if (methods.isActive() && (diffWidth > 5 || diffHeight > 5)) {
                    $f.animate({
                        "width": newWidth
                    }, function () {
                        $(this).animate({
                            "height": newHeight
                        }, function () {
                            helpers.fixPos()
                        })
                    });
                    $("#elpsOverlay").animate({
                        "width": newWidth - 94
                    }, function () {
                        $(this).animate({
                            "height": newHeight - 116
                        }, function () {
                            if (typeof callback === 'function') {
                                callback.call(self)
                            }
                        })
                    })
                }
            },
            show: function (options, callback, self) {
                if (methods.isActive()) {
                    $("body", "html").animate({
                        scrollTop: $("#elpsOverlay").offset().top
                    }, function () {
                        $.elpsOverlay("shake")
                    });
                    //$.error("Can\"t create new message with content: '" + options.content + "', past message with content '" + opts.content + "' is still active")
                } else {
                    opts = $.extend({}, defaults, options);
                    $("<div id='elpsOverlay-wrapper'></div>").appendTo("body");
                    opts.bound = $(opts.bound).length > 0 ? opts.bound : window;
                    var $f = $("#elpsOverlay-wrapper"),
                        $o = $("#elpsOverlay-overlay"),
                        isWin = (opts.bound === window);
                    $f.css({
                        "width": opts.width,
                        "height": opts.height,
                        "position": "absolute",
                        "top": "-9999px",
                        "left": "-9999px"
                    }).html("<div id='elpsOverlay-icon'></div>" + "<div id='elpsOverlay'></div>" + "<div id='elpsOverlay-buttons'></div>").find("#elpsOverlay-icon").addClass("icon-" + opts.icon).end().find("#elpsOverlay").html(opts.content).css({
                        "height": (opts.height == "auto") ? "auto" : $f.height() - 116,
                        "width": $f.width() - 94
                    }).end().find("#elpsOverlay-buttons").html((function () {
                        var buttons = "";
                        var i;
                        for (i in opts.buttons) {
                            if (opts.buttons.hasOwnProperty(i)) {
                                buttons = buttons + "<a href='#' class='elpsOverlay-button " + (opts.buttons[i].danger ? "elpsOverlay-button-danger" : "") + "' id='elpsOverlay-button-" + i + "'>" + opts.buttons[i].text + "</a>"
                            }
                        }
                        return buttons
                    }())).find(".elpsOverlay-button").bind("click", function () {
                        var buttonId = $(this).prop("id").substring(19);
                        if (typeof opts.buttons[buttonId].onclick === "function" && opts.buttons[buttonId].onclick != false) {
                            var scope = $("#elpsOverlay");
                            opts.buttons[buttonId].onclick.apply(scope)
                        } else {
                            methods.hide()
                        }
                        return false
                    });
                    var showElpsOverlay = function () {
                        $f.show();
                        var xpos = isWin ? (($w.width() - $f.outerWidth()) / 2 + $w.scrollLeft()) : (($(opts.bound).width() - $f.outerWidth()) / 2 + $(opts.bound).offset().left),
                            yminpos, ymaxpos, pos = ($w.height() > $f.height() && $w.width() > $f.width() && isWin) ? "fixed" : "absolute",
                            isFixed = (pos === "fixed");
                        switch (opts.position) {
                            case "bottom":
                                yminpos = isWin ? (isFixed ? $w.height() : $w.scrollTop() + $w.height()) : ($(opts.bound).offset().top + $(opts.bound).outerHeight());
                                ymaxpos = yminpos - $f.outerHeight();
                                break;
                            case "center":
                                yminpos = isWin ? (isFixed ? (-1) * $f.outerHeight() : $o.offset().top - $f.outerHeight()) : ($(opts.bound).offset().top + ($(opts.bound).height() / 2) - $f.outerHeight());
                                ymaxpos = yminpos + $f.outerHeight() + (((isWin ? $w.height() : $f.outerHeight() / 2) - $f.outerHeight()) / 2);
                                break;
                            default:
                                ymaxpos = isWin ? (isFixed ? 0 : $w.scrollTop()) : $(opts.bound).offset().top;
                                yminpos = ymaxpos - $f.outerHeight()
                        }
                        $f.css({
                            "left": xpos,
                            "position": pos,
                            "top": yminpos,
                            "z-index": opts.zIndex + 1
                        }).animate({
                            "top": ymaxpos
                        }, opts.easingDuration, opts.easingIn, function () {
                            callback = typeof callback === 'function' ? callback : opts.afterShow;
                            callback.call(self);
                            if (opts.autoclose) {
                                timeoutId = setTimeout(methods.hide, opts.autoclose)
                            }
                        })
                    };
                    if (opts.useOverlay) {
                        if (msie && document.documentMode<9) {
                            $o.css({
                                "display": "block",
                                "z-index": opts.zIndex
                            });
                            showElpsOverlay()
                        } else {
                            $o.css({
                                "z-index": opts.zIndex
                            }).fadeIn(showElpsOverlay)
                        }
                    } else {
                        showElpsOverlay()
                    }
                    $(document).bind("keydown", helpers.enterKeyHandler).bind("keydown", helpers.closeKeyHandler).bind("keydown", helpers.tabKeyHandler);
                    $("#elpsOverlay-buttons").children().eq(-1).bind("focus", function () {
                        $(this).bind("keydown", helpers.tabKeyHandler)
                    });
                    $f.find(":input").bind("keydown", function (e) {
                        helpers.unbindKeyHandler();
                        if (e.keyCode === 13) {
                            $(".elpsOverlay-button").eq(0).trigger("click")
                        }
                    })
                }
            },
            set: function (options, callback, self) {
                for (var i in options) {
                    if (defaults.hasOwnProperty(i)) {
                        defaults[i] = options[i];
                        if (opts && opts[i]) {
                            opts[i] = options[i]
                        }
                    }
                }
                if (typeof callback === 'function') {
                    callback.call(self)
                }
            },
            isActive: function () {
                return !!($("#elpsOverlay-wrapper").length > 0)
            },
            blink: function () {
                $("#elpsOverlay-wrapper").fadeOut(100, function () {
                    $(this).fadeIn(100)
                })
            },
            shake: function () {
                $("#elpsOverlay-wrapper").stop(true, true).animate({
                    "left": "+=20px"
                }, 50, function () {
                    $(this).animate({
                        "left": "-=40px"
                    }, 50, function () {
                        $(this).animate({
                            "left": "+=30px"
                        }, 50, function () {
                            $(this).animate({
                                "left": "-=20px"
                            }, 50, function () {
                                $(this).animate({
                                    "left": "+=10px"
                                }, 50)
                            })
                        })
                    })
                })
            }
        }, helpers = {
            fixPos: function () {
                var $f = $("#elpsOverlay-wrapper"),
                    pos = $f.css("position");
                if ($w.width() > $f.outerWidth() && $w.height() > $f.outerHeight()) {
                    var newLeft = ($w.width() - $f.outerWidth()) / 2,
                        newTop = $w.height() - $f.outerHeight();
                    switch (opts.position) {
                        case "center":
                            newTop = newTop / 2;
                            break;
                        case "bottom":
                            break;
                        default:
                            newTop = 0
                    }
                    if (pos == "fixed") {
                        $f.animate({
                            "left": newLeft
                        }, function () {
                            $(this).animate({
                                "top": newTop
                            })
                        })
                    } else {
                        $f.css({
                            "position": "fixed",
                            "left": newLeft,
                            "top": newTop
                        })
                    }
                } else {
                    var newLeft = ($w.width() - $f.outerWidth()) / 2 + $w.scrollLeft();
                    var newTop = $w.scrollTop();
                    if (pos != "fixed") {
                        $f.animate({
                            "left": newLeft
                        }, function () {
                            $(this).animate({
                                "top": newTop
                            })
                        })
                    } else {
                        $f.css({
                            "position": "absolute",
                            "top": newTop,
                            "left": (newLeft > 0 ? newLeft : 0)
                        })
                    }
                }
            },
            enterKeyHandler: function (e) {
                if (e.keyCode === 13) {
                    $("#elpsOverlay-buttons").children().eq(0).focus();
                    helpers.unbindKeyHandler()
                }
            },
            tabKeyHandler: function (e) {
                if (e.keyCode === 9) {
                    $("#elpsOverlay-wrapper").find(":input, .elpsOverlay-button").eq(0).focus();
                    helpers.unbindKeyHandler();
                    e.preventDefault()
                }
            },
            closeKeyHandler: function (e) {
                if (e.keyCode === 27 && opts.closeKey) {
                    methods.hide()
                }
            },
            unbindKeyHandler: function () {
                $(document).unbind("keydown", helpers.enterKeyHandler).unbind("keydown", helpers.tabKeyHandler)
            }
        };
    $(document).ready(function () {
        $("body").append("<div id='elpsOverlay-overlay'></div>");
        $("#elpsOverlay-overlay").bind("click", function () {
            if (opts.closeOverlay) {
                methods.hide()
            } else {
                methods.blink()
            }
        })
    });
    $(window).resize(function () {
        if (methods.isActive() && opts.bound === window) {
            helpers.fixPos()
        }
    });
    $.elpsOverlay = function (method, options, callback) {
        var self = window;
        if (typeof method === "object") {
            options = method;
            method = "show"
        }
        if (methods[method]) {
            if (typeof options === "function") {
                callback = options;
                options = null
            }
            methods[method](options, callback, self)
        } else {
            $.error("Method '" + method + "' does not exist in $.elpsOverlay")
        }
    }
}(jQuery));