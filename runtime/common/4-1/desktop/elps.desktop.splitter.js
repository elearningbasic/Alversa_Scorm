/*
 jQuery.splitter.js - two-pane splitter window plugin - version 1.51
 ------------------
 Dual licensed under the MIT and GPL licenses:  www.opensource.org/licenses/mit-license.php  www.gnu.org/licenses/gpl.html 
 author Dave Methvin (dave.methvin@gmail.com)   methvin.com/splitter/
 modified by rleitner
*/
(function ($) {
    $.fn.splitter = function (args) {
        args = args || {};
        return this.each(function () {
            var zombie;

            function startSplitMouse(evt) {
                if (opts.outline) zombie = zombie || bar.clone(false).insertAfter(A);
                panes.css("-webkit-user-select", "none");
                bar.addClass(opts.activeClass);
                A._posSplit = A[0][opts.pxSplit] - evt[opts.eventPos];
                $(document).bind("mousemove", doSplitMouse).bind("mouseup", endSplitMouse);
            }

            function doSplitMouse(evt) {
                var newPos = A._posSplit + evt[opts.eventPos];
                if (opts.outline) {
                    newPos = Math.max(0, Math.min(newPos, splitter._DA - bar._DA));
                    bar.css(opts.origin, newPos);
                } else resplit(newPos);
            }

            function endSplitMouse(evt) {
                bar.removeClass(opts.activeClass);
                var newPos = A._posSplit + evt[opts.eventPos];
                if (opts.outline) {
                    zombie.remove();
                    zombie = null;
                    resplit(newPos);
                }

                panes.css("-webkit-user-select", "text");
                $(document).unbind("mousemove", doSplitMouse).unbind("mouseup", endSplitMouse);
            }
			
			function browser_resize_auto_fired() {
				// Returns true when the browser natively fires the resize event attached to the panes elements
				return (msie && document.documentMode<9);
			  }

            function resplit(newPos) {
                newPos = Math.max(A._min, splitter._DA - B._max, Math.min(newPos, A._max, splitter._DA - bar._DA - B._min));
                scorm.setPreference("splitterPos", parseInt(newPos));

                bar._DA = bar[0][opts.pxSplit];
                bar.css(opts.origin, newPos).css(opts.fixed, splitter._DF);
				
				
				
                A.css(opts.origin, 0).css(opts.split, newPos).css(opts.fixed, splitter._DF);
                B.css(opts.origin, newPos + bar._DA).css(opts.split, splitter._DA - bar._DA - newPos).css(opts.fixed, splitter._DF);

                //also resize:
                for (var i = 0; i < mainGridSettings.objectsToMove.length; i++) {
                    var item = mainGridSettings.objectsToMove[i];
                    if (document.getElementById(item.id)) {
                        switch (item.selector) {
                            case "left":
                                if (typeof item.offsetPixel != "undefined") {
                                    $("#"+item.id).css({
										"left": newPos + item.offsetPixel + "px"
									});
                                }
                                break;
                            case "width":
                                if (msie && item.ieOnly) {
                                    $("#"+item.id).css({
										"width": document.body.offsetWidth - newPos + "px"
									});
                                }

                                if (item.id == "divmenubar") {
                                    var elm = document.getElementById("divmenubar");
                                    var n = elm.getElementsByTagName("li").length;
                                    var last = elm.getElementsByTagName("li")[n - 1];
                                    if (newPos > (last.offsetLeft + 75)) {
                                        document.getElementById("divmenubar").firstChild.style.width = newPos + 10 + "px";
                                    } else {
                                        document.getElementById("divmenubar").firstChild.style.width = last.offsetLeft + 75 + "px";
                                    }
                                }
                                break;
                        }
                    }
                }
				
                if (!browser_resize_auto_fired())panes.trigger("resize");
            }

            function dimSum(jq, dims) {
                var sum = 0;
                for (var i = 1; i < arguments.length; i++)
                sum += Math.max(parseInt(jq.css(arguments[i])) || 0, 0);
                return sum;
            }

            var vh = (args.splitHorizontal ? "h" : args.splitVertical ? "v" : args.type) || "v";
            var opts = $.extend({
                activeClass: "active",
                pxPerKey: 8,
                tabIndex: 0,
                accessKey: ""
            }, {
                v: { // Vertical splitters:
                    keyLeft: 39,
                    keyRight: 37,
                    cursor: "e-resize",
                    splitbarClass: "vsplitbar",
                    outlineClass: "voutline",
                    type: "v",
                    eventPos: "pageX",
                    origin: "left",
                    split: "width",
                    pxSplit: "offsetWidth",
                    side1: "Left",
                    side2: "Right",
                    fixed: "height",
                    pxFixed: "offsetHeight",
                    side3: "Top",
                    side4: "Bottom"
                },
                h: { // Horizontal splitters:
                    keyTop: 40,
                    keyBottom: 38,
                    cursor: "n-resize",
                    splitbarClass: "hsplitbar",
                    outlineClass: "houtline",
                    type: "h",
                    eventPos: "pageY",
                    origin: "top",
                    split: "height",
                    pxSplit: "offsetHeight",
                    side1: "Top",
                    side2: "Bottom",
                    fixed: "width",
                    pxFixed: "offsetWidth",
                    side3: "Left",
                    side4: "Right"
                }
            }[vh], args);

            var splitter = $(this).css({
                position: "relative"
            });
            var panes = $(">*", splitter[0]).css({
                position: "absolute",
                "z-index": "1",
                "-moz-outline-style": "none"
            });
            var A = $(panes[0]);
            var B = $(panes[1]);

            var focuser = $("<a href='javascript:void(0)'></a>").prop({
                accessKey: opts.accessKey,
                tabIndex: opts.tabIndex,
                title: opts.splitbarClass
            }).bind("click", function () {
                this.focus();
                bar.addClass(opts.activeClass)
            }).bind("keydown", function (e) {
                var key = e.which || e.keyCode;
                var dir = key == opts["key" + opts.side1] ? 1 : key == opts["key" + opts.side2] ? -1 : 0;
                if (dir) resplit(A[0][opts.pxSplit] + dir * opts.pxPerKey, false);
            }).bind("blur", function () {
                bar.removeClass(opts.activeClass)
            });

            var bar = $(panes[2] || "<div></div>").insertAfter(A).css("z-index", "100").append(focuser).prop({
                "class": opts.splitbarClass,
                unselectable: "on"
            }).css({
                position: "absolute",
                "user-select": "none",
                "-webkit-user-select": "none",
                "-khtml-user-select": "none",
                "-moz-user-select": "none"
            }).bind("mousedown", startSplitMouse);
            if (/^(auto|default|)$/.test(bar.css("cursor"))) bar.css("cursor", opts.cursor);

            bar._DA = bar[0][opts.pxSplit];
            splitter._PBF = $.boxModel ? dimSum(splitter, "border" + opts.side3 + "Width", "border" + opts.side4 + "Width") : 0;
            splitter._PBA = $.boxModel ? dimSum(splitter, "border" + opts.side1 + "Width", "border" + opts.side2 + "Width") : 0;
            A._pane = opts.side1;
            B._pane = opts.side2;
            $.each([A, B], function () {
                this._min = opts["min" + this._pane] || dimSum(this, "min-" + opts.split);
                this._max = opts["max" + this._pane] || dimSum(this, "max-" + opts.split) || 9999;
                this._init = opts["size" + this._pane] === true ? parseInt($.curCSS(this[0], opts.split)) : opts["size" + this._pane];
            });

            var initPos = A._init;
            if (!isNaN(B._init)) initPos = splitter[0][opts.pxSplit] - splitter._PBA - B._init - bar._DA;
            initPos = (typeof mainGridSettings.initWidth == "undefined" ? scorm.getPreference("splitterPos") : mainGridSettings.initWidth);

            for (var i = 0; i < mainGridSettings.objectsToMove.length; i++) {
                var item = mainGridSettings.objectsToMove[i];
                if (document.getElementById(item.id)) {
                    switch (item.selector) {
                        case "left":
                            if (typeof item.offsetPixel != "undefined") {
                                document.getElementById(item.id).style.left = initPos + item.offsetPixel + "px";
                            }
                            break;
                        case "width":
                            if (msie && item.ieOnly) {
                                document.getElementById(item.id).style.width = (document.body.offsetWidth - initPos) + "px";
                            }

                            if (item.id == "divmenubar") {
                                setTimeout("afterRender(" + initPos + ")", 0)
                            }
                            break;
                    }
                }
            }

            if (isNaN(initPos)) initPos = Math.round((splitter[0][opts.pxSplit] - splitter._PBA - bar._DA) / 2);
			splitter._hadjust = dimSum(splitter, "borderTopWidth", "borderBottomWidth", "marginBottom");
			splitter._hmin = Math.max(dimSum(splitter, "minHeight"), 20);
			splitter._hadjust += dimSum(splitter, "bottom");
			$(window).bind("resize", function () {
				var top = dimSum(splitter, "top");
				var wh = $(window).height();
				var h;
				try{
					h = $("#divcontainer").outerHeight() - $("#dynaWrapper").offset().top - $("#divcontainer").offset().top;
				}catch(e){
					h = Math.max(wh - top - splitter._hadjust, splitter._hmin);
				}
				splitter.css("height", h + "px");
			}).trigger("resize");
			
			splitter.bind("setWidth", function(e, size){
				var from = {property: scorm.getPreference("splitterPos")},
					to = {property: size};
				 
				$(from).animate(to, {
					easing: "easeInOutQuart", 
					duration: 500,
					step: function() {
						resplit(this.property);
					},
					complete: function(){
						$("#westPane").width(size); //avoid floating numbers
					}
				});
			});
			
			splitter.bind("toggle", function(e, direction){
return;
				
				if(typeof direction=="undefined"){
					direction = $("#westPane").width() == 0 ? "open" : "close"
				}
				
				switch(direction){
					case "open":
						$("#mainGrid").trigger("open");
						scorm.setPreference("sidebar","visible");
						break;
					case "close":
						$("#mainGrid").trigger("close");
						scorm.setPreference("sidebar","hidden");
						if(scorm.getPreference("showModeration")){
							modPanel.hidePanel();
						}
						break;
				}
				if(typeof interactions.blockTest!="undefined"){
					interactions.alignProgressBarToSidebar();
				}
			});
			
			splitter.bind("open", function(e){
return;
				if($("#westPane").width() == 0){
					$("#mainGrid").trigger("setWidth", 280);
					$("#menuItemSidebar img").attr("src", custom+"desktop/images/sidebar_contract.png");
				}
			});
			
			splitter.bind("close", function(e){
				if($("#westPane").width() != 0){
					$("#mainGrid").trigger("setWidth", 0);
					$("#menuItemSidebar img").attr("src", custom+"desktop/images/sidebar_expand.png");
				}
			});			
			
            splitter.bind("resize", function (e, size) {              
                if (e.target != this) return;
                splitter._DF = splitter[0][opts.pxFixed] - splitter._PBF;
                splitter._DA = splitter[0][opts.pxSplit] - splitter._PBA;
                if (splitter._DF <= 0 || splitter._DA <= 0) return;
				resplit(!isNaN(size) ? size : (!(opts.sizeRight || opts.sizeBottom) ? A[0][opts.pxSplit] : splitter._DA - B[0][opts.pxSplit] - bar._DA));
			}).trigger("resize", [initPos]);
        });
    };
})(jQuery);
 
function afterRender(initPos){
	var elm = document.getElementById("divmenubar");
    var n = elm.getElementsByTagName("li").length;
    var last = elm.getElementsByTagName("li")[n - 1];
	if (initPos > (last.offsetLeft + 75)){
		document.getElementById("divmenubar").firstChild.style.width = initPos + 10 + "px";
	}else{
		document.getElementById("divmenubar").firstChild.style.width = last.offsetLeft + 75 + "px";
	}
}