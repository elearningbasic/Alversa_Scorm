;
(function ($, window, document, undefined) {
    var pluginName = "elpsTooltip",
        defaults = {
            animation: "fade",
            arrow: true,
            arrowColor: "",
            content: "",
            delay: 200,
            fixedWidth: 0,
            maxWidth: 0,
            functionBefore: function (origin, continueTooltip) {
                continueTooltip();
            },
            functionReady: function (origin, tooltip) {},
            functionAfter: function (origin) {},
            icon: "(?)",
            iconDesktop: false,
            iconTouch: false,
            iconTheme: ".elpsTooltip-icon",
            interactive: false,
            interactiveTolerance: 750,
            offsetX: 0,
            offsetY: 0,
            onlyOne: true,
            position: "top",
            speed: 350,
            timer: 0,
            theme: ".elpsTooltip-default",
            touchDevices: false,
            trigger: "hover",
            updateAnimation: true
        };

    function Plugin(element, options) {
        this.element = element;
        this.options = $.extend({}, defaults, options);
        this._defaults = defaults;
        this._name = pluginName;
        this.init();
    }

    function is_touch_device() {
        return !!("ontouchstart" in window);
    }

    function supportsTransitions() {
        var b = document.body || document.documentElement;
        var s = b.style;
        var p = "transition";
        if (typeof s[p] == "string") {
            return true;
        }
        v = ["Moz", "Webkit", "Khtml", "O", "ms"],
        p = p.charAt(0).toUpperCase() + p.substr(1);
        for (var i = 0; i < v.length; i++) {
            if (typeof s[v[i] + p] == "string") {
                return true;
            }
        }
        return false;
    }
    var transitionSupport = true;
    if (!supportsTransitions()) {
        transitionSupport = false;
    }
    Plugin.prototype = {
        init: function () {
            var $this = $(this.element);
            var object = this;
            var run = true;
            // if this is a touch device and touch devices are disabled, disable the plugin
            if ((object.options.touchDevices == false) && (is_touch_device())) {
                run = false;
            }
            // if IE7 or lower, disable the plugin
            if (document.all && !document.querySelector) {
                run = false;
            }
            if (run == true) {
                if ((this.options.iconDesktop == true) && (!is_touch_device()) || ((this.options.iconTouch == true) && (is_touch_device()))) {
                    var transferContent = $this.attr("title");
                    $this.removeAttr("title");
                    var theme = object.options.iconTheme;
                    var icon = $("<span class='" + theme.replace(".", "") + "' title='" + transferContent + "'>" + this.options.icon + "</span>");
                    icon.insertAfter($this);
                    $this.data("elpsTooltipIcon", icon);
                    $this = icon;
                }
                var elpsTooltipContent = $.trim(object.options.content).length > 0 ? object.options.content : $this.attr("title");
                $this.data("elpsTooltipContent", elpsTooltipContent);
                $this.removeAttr("title");
                if ((this.options.touchDevices == true) && (is_touch_device())) {
                    $this.bind("touchstart", function (element, options) {
                        object.showTooltip();
                    });
                }
                else {
                    if (this.options.trigger == "hover") {
                        $this.on("mouseenter.elpsTooltip", function () {
                            object.showTooltip();
                        });
                        if (this.options.interactive == true) {
                            $this.on("mouseleave.elpsTooltip", function () {
                                var elpsTooltip = $this.data("elpsTooltip");
                                var keepAlive = false;
                                if ((elpsTooltip !== undefined) && (elpsTooltip !== "")) {
                                    elpsTooltip.mouseenter(function () {
                                        keepAlive = true;
                                    });
                                    elpsTooltip.mouseleave(function () {
                                        keepAlive = false;
                                    });
                                    var tolerance = setTimeout(function () {
                                        if (keepAlive == true) {
                                            elpsTooltip.mouseleave(function () {
                                                object.hideTooltip();
                                            });
                                        } else {
                                            object.hideTooltip();
                                        }
                                    }, object.options.interactiveTolerance);
                                } else {
                                    object.hideTooltip();
                                }
                            });
                        }
                        else {
							$this.on("click.elpsTooltip", function () {
                                object.hideTooltip();
                            });
                        }
                    }
                    if (this.options.trigger == "click") {
                        $this.on("click.elpsTooltip", function () {
                            if (($this.data("elpsTooltip") == "") || ($this.data("elpsTooltip") == undefined)) {
                                object.showTooltip();
                            } else {
                                object.hideTooltip();
                            }
                        });
                    }
                }
            }
        },
        showTooltip: function (options) {
            var $this = $(this.element);
            var object = this;
            if ($this.data("elpsTooltipIcon") !== undefined) {
                $this = $this.data("elpsTooltipIcon");
            }
            if (!$this.hasClass("elpsTooltip-disable")) {
                if (($(".elpsTooltip-base").not(".elpsTooltip-dying").length > 0) && (object.options.onlyOne == true)) {
                    $(".elpsTooltip-base").not(".elpsTooltip-dying").not($this.data("elpsTooltip")).each(function () {
                        $(this).addClass("elpsTooltip-kill");
                        var origin = $(this).data("origin");
                        origin.data("plugin_elpsTooltip").hideTooltip();
                    });
                }
                $this.clearQueue().delay(object.options.delay).queue(function () {
                    object.options.functionBefore($this, function () {
                        if (($this.data("elpsTooltip") !== undefined) && ($this.data("elpsTooltip") !== "")) {
                            var elpsTooltip = $this.data("elpsTooltip");
                            if (!elpsTooltip.hasClass("elpsTooltip-kill")) {
                                var animation = "elpsTooltip-" + object.options.animation;
                                elpsTooltip.removeClass("elpsTooltip-dying");
                                if (transitionSupport == true) {
                                    elpsTooltip.clearQueue().addClass(animation + "-show");
                                }
                                if (object.options.timer > 0) {
                                    var timer = elpsTooltip.data("elpsTooltipTimer");
                                    clearTimeout(timer);
                                    timer = setTimeout(function () {
                                        elpsTooltip.data("elpsTooltipTimer", undefined);
                                        object.hideTooltip();
                                    }, object.options.timer);
                                    elpsTooltip.data("elpsTooltipTimer", timer);
                                }
                                if ((object.options.touchDevices == true) && (is_touch_device())) {
                                    $("body").bind("touchstart", function (event) {
                                        if (object.options.interactive == true) {
                                            var touchTarget = $(event.target);
                                            var closeTooltip = true;
                                            touchTarget.parents().each(function () {
                                                if ($(this).hasClass("elpsTooltip-base")) {
                                                    closeTooltip = false;
                                                }
                                            });
                                            if (closeTooltip == true) {
                                                object.hideTooltip();
                                                $("body").unbind("touchstart");
                                            }
                                        } else {
                                            object.hideTooltip();
                                            $("body").unbind("touchstart");
                                        }
                                    });
                                }
                            }
                        }
                        else {
                            $("body").css("overflow-x", "hidden");
                            var content = $this.data("elpsTooltipContent");
                            var theme = object.options.theme;
                            var themeClass = theme.replace(".", "");
                            var animation = "elpsTooltip-" + object.options.animation;
                            var animationSpeed = "-webkit-transition-duration: " + object.options.speed + "ms; -webkit-animation-duration: " + object.options.speed + "ms; -moz-transition-duration: " + object.options.speed + "ms; -moz-animation-duration: " + object.options.speed + "ms; -o-transition-duration: " + object.options.speed + "ms; -o-animation-duration: " + object.options.speed + "ms; -ms-transition-duration: " + object.options.speed + "ms; -ms-animation-duration: " + object.options.speed + "ms; transition-duration: " + object.options.speed + "ms; animation-duration: " + object.options.speed + "ms;";
                            var fixedWidth = object.options.fixedWidth > 0 ? "width:" + object.options.fixedWidth + "px;" : "";
                            var maxWidth = object.options.maxWidth > 0 ? "max-width:" + object.options.maxWidth + "px;" : "";
                            var pointerEvents = object.options.interactive == true ? "pointer-events: auto;" : "";
                            var elpsTooltip = $("<div class='elpsTooltip-base " + themeClass + " " + animation + "' style='" + fixedWidth + " " + maxWidth + " " + pointerEvents + " " + animationSpeed + "'><div class='elpsTooltip-content'>" + content + "</div></div>");
                            elpsTooltip.appendTo("body");
                            $this.data("elpsTooltip", elpsTooltip);
                            elpsTooltip.data("origin", $this);
                            object.positionTooltip();
                            object.options.functionReady($this, elpsTooltip);
                            if (transitionSupport == true) {
                                elpsTooltip.addClass(animation + "-show");
                            } else {
                                elpsTooltip.css("display", "none").removeClass(animation).fadeIn(object.options.speed);
                            }
                            var currentTooltipContent = content;
                            var contentUpdateChecker = setInterval(function () {
                                var newTooltipContent = $this.data("elpsTooltipContent");
                                if ($("body").find($this).length == 0) {
                                    elpsTooltip.addClass("elpsTooltip-dying");
                                    object.hideTooltip();
                                }
                                else if ((currentTooltipContent !== newTooltipContent) && (newTooltipContent !== "")) {
                                    currentTooltipContent = newTooltipContent;
                                    elpsTooltip.find(".elpsTooltip-content").html(newTooltipContent);
                                    if (object.options.updateAnimation == true) {
                                        if (supportsTransitions()) {
                                            elpsTooltip.css({
                                                "width": "",
                                                "-webkit-transition": "all " + object.options.speed + "ms, width 0ms, height 0ms, left 0ms, top 0ms",
                                                "-moz-transition": "all " + object.options.speed + "ms, width 0ms, height 0ms, left 0ms, top 0ms",
                                                "-o-transition": "all " + object.options.speed + "ms, width 0ms, height 0ms, left 0ms, top 0ms",
                                                "-ms-transition": "all " + object.options.speed + "ms, width 0ms, height 0ms, left 0ms, top 0ms",
                                                "transition": "all " + object.options.speed + "ms, width 0ms, height 0ms, left 0ms, top 0ms"
                                            }).addClass("elpsTooltip-content-changing");
                                            setTimeout(function () {
                                                elpsTooltip.removeClass("elpsTooltip-content-changing");
                                                setTimeout(function () {
                                                    elpsTooltip.css({
                                                        "-webkit-transition": object.options.speed + "ms",
                                                        "-moz-transition": object.options.speed + "ms",
                                                        "-o-transition": object.options.speed + "ms",
                                                        "-ms-transition": object.options.speed + "ms",
                                                        "transition": object.options.speed + "ms"
                                                    });
                                                }, object.options.speed);
                                            }, object.options.speed);
                                        } else {
                                            elpsTooltip.fadeTo(object.options.speed, 0.5, function () {
                                                elpsTooltip.fadeTo(object.options.speed, 1);
                                            });
                                        }
                                    }
                                    object.positionTooltip();
                                }
                                if (($("body").find(elpsTooltip).length == 0) || ($("body").find($this).length == 0)) {
                                    clearInterval(contentUpdateChecker);
                                }
                            }, 200);
                            if (object.options.timer > 0) {
                                var timer = setTimeout(function () {
                                    elpsTooltip.data("elpsTooltipTimer", undefined);
                                    object.hideTooltip();
                                }, object.options.timer + object.options.speed);
                                elpsTooltip.data("elpsTooltipTimer", timer);
                            }
                            if ((object.options.touchDevices == true) && (is_touch_device())) {
                                $("body").bind("touchstart", function (event) {
                                    if (object.options.interactive == true) {
                                        var touchTarget = $(event.target);
                                        var closeTooltip = true;
                                        touchTarget.parents().each(function () {
                                            if ($(this).hasClass("elpsTooltip-base")) {
                                                closeTooltip = false;
                                            }
                                        });
                                        if (closeTooltip == true) {
                                            object.hideTooltip();
                                            $("body").unbind("touchstart");
                                        }
                                    } else {
                                        object.hideTooltip();
                                        $("body").unbind("touchstart");
                                    }
                                });
                            }
                            elpsTooltip.mouseleave(function () {
                                if (object.options.trigger == "hover") {
									object.hideTooltip();
								}
                            });
                        }
                    });
                    $this.dequeue();
                });
            }
        },
        hideTooltip: function (options) {
            var $this = $(this.element);
            var object = this;
            if ($this.data("elpsTooltipIcon") !== undefined) {
                $this = $this.data("elpsTooltipIcon");
            }
            var elpsTooltip = $this.data("elpsTooltip");
            if (elpsTooltip == undefined) {
                elpsTooltip = $(".elpsTooltip-dying");
            }
            $this.clearQueue();
            if ((elpsTooltip !== undefined) && (elpsTooltip !== "")) {
                var timer = elpsTooltip.data("elpsTooltipTimer");
                if (timer !== undefined) {
                    clearTimeout(timer);
                }
                var animation = "elpsTooltip-" + object.options.animation;
                if (transitionSupport == true) {
                    elpsTooltip.clearQueue().removeClass(animation + "-show").addClass("elpsTooltip-dying").delay(object.options.speed).queue(function () {
                        elpsTooltip.remove();
                        $this.data("elpsTooltip", "");
                        $("body").css("verflow-x", "");
                        object.options.functionAfter($this);
                    });
                } else {
                    elpsTooltip.clearQueue().addClass("elpsTooltip-dying").fadeOut(object.options.speed, function () {
                        elpsTooltip.remove();
                        $this.data("elpsTooltip", "");
                        $("body").css("verflow-x", "");
                        object.options.functionAfter($this);
                    });
                }
            }
        },
        positionTooltip: function (options) {
            var $this = $(this.element);
            var object = this;
            if ($this.data("elpsTooltipIcon") !== undefined) {
                $this = $this.data("elpsTooltipIcon");
            }
            if (($this.data("elpsTooltip") !== undefined) && ($this.data("elpsTooltip") !== "")) {
                var elpsTooltip = $this.data("elpsTooltip");
                elpsTooltip.css("width", "");
                var windowWidth = $(window).width();
                var containerWidth = $this.outerWidth(false);
                var containerHeight = $this.outerHeight(false);
                var tooltipWidth = elpsTooltip.outerWidth(false);
                var tooltipInnerWidth = elpsTooltip.innerWidth() + 1; // this +1 stops FireFox from sometimes forcing an additional text line
                var tooltipHeight = elpsTooltip.outerHeight(false);
                var offset = $this.offset();
                var offsetTop = offset.top;
                var offsetLeft = offset.left;
                var resetPosition = undefined;
                if ($this.is("area")) {
                    var areaShape = $this.attr("shape");
                    var mapName = $this.parent().attr("name");
                    var map = $("img[usemap='#" + mapName + "']");
                    var mapOffsetLeft = map.offset().left;
                    var mapOffsetTop = map.offset().top;
                    var areaMeasurements = $this.attr("coords") !== undefined ? $this.attr("coords").split(",") : undefined;
                    if (areaShape == "circle") {
                        var areaLeft = parseInt(areaMeasurements[0]);
                        var areaTop = parseInt(areaMeasurements[1]);
                        var areaWidth = parseInt(areaMeasurements[2]);
                        containerHeight = areaWidth * 2;
                        containerWidth = areaWidth * 2;
                        offsetTop = mapOffsetTop + areaTop - areaWidth;
                        offsetLeft = mapOffsetLeft + areaLeft - areaWidth;
                    } else if (areaShape == "rect") {
                        var areaLeft = parseInt(areaMeasurements[0]);
                        var areaTop = parseInt(areaMeasurements[1]);
                        var areaRight = parseInt(areaMeasurements[2]);
                        var areaBottom = parseInt(areaMeasurements[3]);
                        containerHeight = areaBottom - areaTop;
                        containerWidth = areaRight - areaLeft;
                        offsetTop = mapOffsetTop + areaTop;
                        offsetLeft = mapOffsetLeft + areaLeft;
                    } else if (areaShape == "poly" || areaShape == "polygon") {
                        var areaXs = [];
                        var areaYs = [];
                        var areaSmallestX = 0,
                            areaSmallestY = 0,
                            areaGreatestX = 0,
                            areaGreatestY = 0;
                        var arrayAlternate = "even";
                        for (i = 0; i < areaMeasurements.length; i++) {
                            var areaNumber = parseInt(areaMeasurements[i]);
                            if (arrayAlternate == "even") {
                                if (areaNumber > areaGreatestX) {
                                    areaGreatestX = areaNumber;
                                    if (i == 0) {
                                        areaSmallestX = areaGreatestX;
                                    }
                                }
                                if (areaNumber < areaSmallestX) {
                                    areaSmallestX = areaNumber;
                                }
                                arrayAlternate = "odd";
                            } else {
                                if (areaNumber > areaGreatestY) {
                                    areaGreatestY = areaNumber;
                                    if (i == 1) {
                                        areaSmallestY = areaGreatestY;
                                    }
                                }
                                if (areaNumber < areaSmallestY) {
                                    areaSmallestY = areaNumber;
                                }
                                arrayAlternate = "even";
                            }
                        }
                        containerHeight = areaGreatestY - areaSmallestY;
                        containerWidth = areaGreatestX - areaSmallestX;
                        offsetTop = mapOffsetTop + areaSmallestY;
                        offsetLeft = mapOffsetLeft + areaSmallestX;
                    } else {
                        containerHeight = map.outerHeight(false);
                        containerWidth = map.outerWidth(false);
                        offsetTop = mapOffsetTop;
                        offsetLeft = mapOffsetLeft;
                    }
                }
                if (object.options.fixedWidth == 0) {
                    elpsTooltip.css({
                        "width": tooltipInnerWidth + "px",
                        "padding-left": "0px",
                        "padding-right": "0px"
                    });
                }
                var myLeft = 0,
                    myTop = 0;
                var offsetY = parseInt(object.options.offsetY);
                var offsetX = parseInt(object.options.offsetX);
                var arrowConstruct = "";
                function dontGoOffScreenX() {
                    var windowLeft = $(window).scrollLeft();
                    if ((myLeft - windowLeft) < 0) {
                        var arrowReposition = myLeft - windowLeft;
                        myLeft = windowLeft;
                        elpsTooltip.data("arrow-reposition", arrowReposition);
                    }
                    if (((myLeft + tooltipWidth) - windowLeft) > windowWidth) {
                        var arrowReposition = myLeft - ((windowWidth + windowLeft) - tooltipWidth);
                        myLeft = (windowWidth + windowLeft) - tooltipWidth;
                        elpsTooltip.data("arrow-reposition", arrowReposition);
                    }
                }
                function dontGoOffScreenY(switchTo, resetTo) {
                    if (((offsetTop - $(window).scrollTop() - tooltipHeight - offsetY - 12) < 0) && (resetTo.indexOf("top") > -1)) {
                        object.options.position = switchTo;
                        resetPosition = resetTo;
                    }
                    if (((offsetTop + containerHeight + tooltipHeight + 12 + offsetY) > ($(window).scrollTop() + $(window).height())) && (resetTo.indexOf("bottom") > -1)) {
                        object.options.position = switchTo;
                        resetPosition = resetTo;
                        myTop = (offsetTop - tooltipHeight) - offsetY - 12;
                    }
                }
                if (object.options.position == "top") {
                    var leftDifference = (offsetLeft + tooltipWidth) - (offsetLeft + containerWidth);
                    myLeft = (offsetLeft + offsetX) - (leftDifference / 2);
                    myTop = (offsetTop - tooltipHeight) - offsetY - 12;
                    dontGoOffScreenX();
                    dontGoOffScreenY("bottom", "top");
                }
                if (object.options.position == "top-left") {
                    myLeft = offsetLeft + offsetX;
                    myTop = (offsetTop - tooltipHeight) - offsetY - 12;
                    dontGoOffScreenX();
                    dontGoOffScreenY("bottom-left", "top-left");
                }
                if (object.options.position == "top-right") {
                    myLeft = (offsetLeft + containerWidth + offsetX) - tooltipWidth;
                    myTop = (offsetTop - tooltipHeight) - offsetY - 12;
                    dontGoOffScreenX();
                    dontGoOffScreenY("bottom-right", "top-right");
                }
                if (object.options.position == "bottom") {
                    var leftDifference = (offsetLeft + tooltipWidth) - (offsetLeft + containerWidth);
                    myLeft = offsetLeft - (leftDifference / 2) + offsetX;
                    myTop = (offsetTop + containerHeight) + offsetY + 12;
                    dontGoOffScreenX();
                    dontGoOffScreenY("top", "bottom");
                }
                if (object.options.position == "bottom-left") {
                    myLeft = offsetLeft + offsetX;
                    myTop = (offsetTop + containerHeight) + offsetY + 12;
                    dontGoOffScreenX();
                    dontGoOffScreenY("top-left", "bottom-left");
                }
                if (object.options.position == "bottom-right") {
                    myLeft = (offsetLeft + containerWidth + offsetX) - tooltipWidth;
                    myTop = (offsetTop + containerHeight) + offsetY + 12;
                    dontGoOffScreenX();
                    dontGoOffScreenY("top-right", "bottom-right");
                }
                if (object.options.position == "left") {
                    myLeft = offsetLeft - offsetX - tooltipWidth - 12;
                    myLeftMirror = offsetLeft + offsetX + containerWidth + 12;
                    var topDifference = (offsetTop + tooltipHeight) - (offsetTop + $this.outerHeight(false));
                    myTop = offsetTop - (topDifference / 2) - offsetY;
                    if ((myLeft < 0) && ((myLeftMirror + tooltipWidth) > windowWidth)) {
                        var borderWidth = parseFloat(elpsTooltip.css("border-width")) * 2;
                        var newWidth = (tooltipWidth + myLeft) - borderWidth;
                        elpsTooltip.css("width", newWidth + "px");
                        tooltipHeight = elpsTooltip.outerHeight(false);
                        myLeft = offsetLeft - offsetX - newWidth - 12 - borderWidth;
                        topDifference = (offsetTop + tooltipHeight) - (offsetTop + $this.outerHeight(false));
                        myTop = offsetTop - (topDifference / 2) - offsetY;
                    }
                    else if (myLeft < 0) {
                        myLeft = offsetLeft + offsetX + containerWidth + 12;
                        elpsTooltip.data("arrow-reposition", "left");
                    }
                }
                if (object.options.position == "right") {
                    myLeft = offsetLeft + offsetX + containerWidth + 12;
                    myLeftMirror = offsetLeft - offsetX - tooltipWidth - 12;
                    var topDifference = (offsetTop + tooltipHeight) - (offsetTop + $this.outerHeight(false));
                    myTop = offsetTop - (topDifference / 2) - offsetY;
                    if (((myLeft + tooltipWidth) > windowWidth) && (myLeftMirror < 0)) {
                        var borderWidth = parseFloat(elpsTooltip.css("border-width")) * 2;
                        var newWidth = (windowWidth - myLeft) - borderWidth;
                        elpsTooltip.css("width", newWidth + "px");
                        tooltipHeight = elpsTooltip.outerHeight(false);
                        topDifference = (offsetTop + tooltipHeight) - (offsetTop + $this.outerHeight(false));
                        myTop = offsetTop - (topDifference / 2) - offsetY;
                    }
                    else if ((myLeft + tooltipWidth) > windowWidth) {
                        myLeft = offsetLeft - offsetX - tooltipWidth - 12;
                        elpsTooltip.data("arrow-reposition", "right");
                    }
                }
                if (object.options.arrow == true) {
                    var arrowClass = "elpsTooltip-arrow-" + object.options.position;
                    if (object.options.arrowColor.length < 1) {
                        var arrowColor = elpsTooltip.css("background-color");
                    } else {
                        var arrowColor = object.options.arrowColor;
                    }
                    var arrowReposition = elpsTooltip.data("arrow-reposition");
                    if (!arrowReposition) {
                        arrowReposition = "";
                    } else if (arrowReposition == "left") {
                        arrowClass = "elpsTooltip-arrow-right";
                        arrowReposition = "";
                    } else if (arrowReposition == "right") {
                        arrowClass = "elpsTooltip-arrow-left";
                        arrowReposition = "";
                    } else {
                        arrowReposition = "left:" + arrowReposition + "px;";
                    }

                    if ((object.options.position == "top") || (object.options.position == "top-left") || (object.options.position == "top-right")) {
                        var tooltipBorderWidth = parseFloat(elpsTooltip.css("border-bottom-width"));
                        var tooltipBorderColor = elpsTooltip.css("border-bottom-color");
                    } else if ((object.options.position == "bottom") || (object.options.position == "bottom-left") || (object.options.position == "bottom-right")) {
                        var tooltipBorderWidth = parseFloat(elpsTooltip.css("border-top-width"));
                        var tooltipBorderColor = elpsTooltip.css("border-top-color");
                    } else if (object.options.position == "left") {
                        var tooltipBorderWidth = parseFloat(elpsTooltip.css("border-right-width"));
                        var tooltipBorderColor = elpsTooltip.css("border-right-color");
                    } else if (object.options.position == "right") {
                        var tooltipBorderWidth = parseFloat(elpsTooltip.css("border-left-width"));
                        var tooltipBorderColor = elpsTooltip.css("border-left-color");
                    } else {
                        var tooltipBorderWidth = parseFloat(elpsTooltip.css("border-bottom-width"));
                        var tooltipBorderColor = elpsTooltip.css("border-bottom-color");
                    }
                    if (tooltipBorderWidth > 1) {
                        tooltipBorderWidth++;
                    }
                    var arrowBorder = "";
                    if (tooltipBorderWidth !== 0) {
                        var arrowBorderSize = "";
                        var arrowBorderColor = "border-color: " + tooltipBorderColor + ";";
                        if (arrowClass.indexOf("bottom") !== -1) {
                            arrowBorderSize = "margin-top: -" + tooltipBorderWidth + "px;";
                        } else if (arrowClass.indexOf("top") !== -1) {
                            arrowBorderSize = "margin-bottom: -" + tooltipBorderWidth + "px;";
                        } else if (arrowClass.indexOf("left") !== -1) {
                            arrowBorderSize = "margin-right: -" + tooltipBorderWidth + "px;";
                        } else if (arrowClass.indexOf("right") !== -1) {
                            arrowBorderSize = "margin-left: -" + tooltipBorderWidth + "px;";
                        }
                        arrowBorder = "<span class='elpsTooltip-arrow-border' style='" + arrowBorderSize + " " + arrowBorderColor + ";'></span>";
                    }
                    elpsTooltip.find(".elpsTooltip-arrow").remove();
                    arrowConstruct = "<div class='" + arrowClass + " elpsTooltip-arrow' style='" + arrowReposition + "'>" + arrowBorder + "<span style='border-color:" + arrowColor + ";'></span></div>";
                    elpsTooltip.append(arrowConstruct);
                }
                elpsTooltip.css({
                    "top": myTop + "px",
                    "left": myLeft + "px"
                });
                if (resetPosition !== undefined) {
                    object.options.position = resetPosition;
                }
            }
        }
    };
    $.fn[pluginName] = function (options) {
        if (typeof options === "string") {
            var $t = this;
            var newContent = arguments[1];
            if ($t.data("plugin_elpsTooltip") == undefined) {
                var query = $t.find("*");
                $t = $();
                query.each(function () {
                    if ($(this).data("plugin_elpsTooltip") !== undefined) {
                        $t.push($(this));
                    }
                });
            }
            $t.each(function () {
                switch (options.toLowerCase()) {
                    case "show":
                        $(this).data("plugin_elpsTooltip").showTooltip();
                        break;
                    case "hide":
                        $(this).data("plugin_elpsTooltip").hideTooltip();
                        break;
                    case "disable":
                        $(this).addClass("elpsTooltip-disable");
                        break;
                    case "enable":
                        $(this).removeClass("elpsTooltip-disable");
                        break;
                    case "destroy":
                        $(this).data("plugin_elpsTooltip").hideTooltip();
                        $(this).data("plugin_elpsTooltip", "").attr("title", $t.data("elpsTooltipContent")).data("elpsTooltipContent", "").data("plugin_elpsTooltip", "").off("mouseenter.elpsTooltip mouseleave.elpsTooltip click.elpsTooltip");
                        break;
                    case "update":
                        $(this).data("elpsTooltipContent", newContent);
                        break;
                    case "reposition":
                        $(this).data("plugin_elpsTooltip").positionTooltip();
                        break;
                }
            });
            return this;
        }
        return this.each(function () {
            if (!$.data(this, 'plugin_' + pluginName)) {
                $.data(this, 'plugin_' + pluginName, new Plugin(this, options));
            }
            var thisOptions = $(this).data("plugin_elpsTooltip").options;
            if ((thisOptions.iconDesktop == true) && (!is_touch_device()) || ((thisOptions.iconTouch == true) && (is_touch_device()))) {
                var transferObject = $(this).data("plugin_elpsTooltip");
                $(this).next().data("plugin_elpsTooltip", transferObject);
            }
        });
    };
    if (is_touch_device()) {
        window.addEventListener('orientationchange', function () {
            if ($(".elpsTooltip-base").length > 0) {
                $(".elpsTooltip-base").each(function () {
                    var origin = $(this).data("origin");
                    origin.data("plugin_elpsTooltip").hideTooltip();
                });
            }
        }, false);
    }
    $(window).on("resize.elpsTooltip", function () {
        var origin = $(".elpsTooltip-base").data("origin");
        if ((origin !== null) && (origin !== undefined)) {
            origin.elpsTooltip("reposition");
        }
    });
})(jQuery, window, document);

/*
Tooltipster 2.1 | 2/12/13
Developed by: Caleb Jacob - calebjacob.com
Copyright (C) 2013 Caleb Jacob
THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/