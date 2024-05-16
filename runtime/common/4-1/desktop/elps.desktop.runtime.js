//4.1.0

document.oncontextmenu=function(){return false};
document.onselectstart=function(){return false};

var msie8=false;
var ua=navigator.userAgent.toLowerCase();
var safari=/webkit/.test(ua);
var opera = /opera/.test(ua);
var msie = /msie/.test(ua) && !/opera/.test(ua);
var mozilla = /mozilla/.test(ua) && !/(compatible|webkit)/.test(ua);

if(navigator.appName=="Netscape"){//ie11 meldet sich als netscape
    msie=/trident/.test(ua); 
}

if(msie){
	var ie=0;
	if(document.documentMode) {  
		ie=document.documentMode; // IE >=8
	}else{
		// IE 5-7
		ie=5;
		if(document.compatMode) {
			if(document.compatMode=="CSS1Compat")ie=7; // IE7
		}
	};
	switch(ie){
		case 6:
		case 7:
			break;
		case 8:
			msie8=true;
			break;
	};
};

var jqueryReady=false;
$().ready(function(){
	var go=false;
	if(msie8){
		go=false;
	};
	
	if(go){
		$("title").html(decodeBase64(wbt.metadata.title));
		$("<link/>", {
			id: "favicon",
			rel: "shortcut icon",
			type: "image/png",
			href: custom+"shared/images/favicon.ico"
		}).appendTo($("head"));
	};
	
	jqueryReady=true;
});

function createExitWarningHotspot(){
	if(!scorm.scoAPI)return;
	if(scorm.scoVersion=="scormCon")return;
	$("<div/>", {
		css: {
			position: "absolute",
			width: "250px",
			height: "50px",
			top: "0",
			right: "0",
			zIndex: "4999",
			backgroundColor: "transparent",
			display: "inline-block"
		},
		mouseover: function(){
			doExitWarning();
		}
    }).appendTo($("body"));	
}

function doExitWarning() {
    if (!scorm.scoAPI) return;
    if (scorm.scoVersion == "scormCon") return;
    if ($("#notificationElement").length == 0) {
        topNotifier.warning(
			eval("exitWarningMessage" + wbt.metadata.language),
			eval("exitWarningCaption" + wbt.metadata.language)
		);
    }
}

function onloadActions() {
    if (!jqueryReady) {
        setTimeout("onloadActions()", 1000);
        return;
    };

    $("#landingPage").remove();

    window.focus();
	
	var arrScriptsToLoad = [];

	if(msie8){
		arrScriptsToLoad.push(common+"lib/ie8.html5.js")
	};
	
    if ($("#divcontainer").length > 0) {
		location.href = "index.htm?" + Math.round(Math.random() * 100);
        return;
    };
	
	if(typeof userSettings=="object"){
		$.extend(true, defaultSettings, userSettings);
	};
	
	scorm.init();

	if(scorm.scoVersion!="scormCon"){
		$.blockUI.defaults.overlayCSS.backgroundColor = "#fff";
		$.blockUI.defaults.overlayCSS.opacity = 0.5;
		$.blockUI({
			message: "<p><img align='absmiddle' src='" + custom + "desktop/images/loading.gif' /> " +
				(wbt.metadata.language == "_de" ? "Einen Moment bitte..." : "пожалуйста, подождите минуту...") + "</p>",
			css: {
				padding: "10px",
				border: "2px solid #2A78C2",
				backgroundColor: "#fff",
				opacity: 0.8,
				color: "#666666",
				width: "200px",
				"box-shadow": "0 0 5px rgba(0, 0, 0, 0.15)"
			},
			onOverlayClick: $.unblockUI
		});
	}

    $("<div/>", {
        id: "logger",
        css: {
            display: "none"
        }
    }).appendTo("body");
	
	interactions.lessonMode=interactions.getLessonMode();
	switch(interactions.lessonMode){
		case "profiling":
		case "distributedAssessment":
		case "distributedSelfTest":
			arrScriptsToLoad.push(common + "shared/elps.interactions.distributed.js");
			arrScriptsToLoad.push(common + "lib/jquery.plugin.ondemand.raty.js");
			arrScriptsToLoad.push(common + "lib/jquery.plugin.ondemand.chart.js");
			mainGridSettings.initWidth=scorm.getPreference("splitterPos");
			if(msie8){
				arrScriptsToLoad.push(common + "lib/ie8.canvas.js");
			}			
			break;
		default:
			mainGridSettings.initWidth=0;
			mainGridSettings.minLeft=0;
			mainGridSettings.minRight=wbt.metadata.stageWidth;
			break;
	};

    buildMainGrid();
    buildPageTitles();
    buildDynaDiv();
    buildLogo();
    modPanel.init();
    initShortcuts();
	createExitWarningHotspot();
	localizeGUI();
	
	if (typeof customOnloadActions == "function") {
		customOnloadActions();
	}
	
	$.each(wbt.structure, function(i,block){
		if(typeof block.blockType!="undefined"){
			if(block.blockType=="assessment" || block.blockType=="selftest"){
				if(msie8){
					arrScriptsToLoad.push(common + "lib/ie8.canvas.js");
				}
				arrScriptsToLoad.push(common + "shared/elps.interactions.block.js");
				arrScriptsToLoad.push(common + "lib/jquery.plugin.ondemand.chart.js");
			}
		}
	});
	
	if(typeof wbt.metadata.navigation!="undefined"){
		if(wbt.metadata.navigation=="block"){
			arrScriptsToLoad.push(common + "shared/elps.blocknavigation.js");
		}
	};
	
	if($.isArray(wbt.facts)) {
		arrScriptsToLoad.push(common + "shared/elps.randomfacts.js");
	};

	if(arrScriptsToLoad.length>0){
		yepnope(
			[{
				load: arrScriptsToLoad,
				complete: function(){
					initData();
				}
			}]
		);
	}else{
		initData();
	};

};

function initData(){	
    
	switch(interactions.lessonMode){
		case "profiling":
		case "distributedAssessment":
		case "distributedSelfTest":
			interactions.initDistributed();
			break;
		default:
			break;
	};
	
	if(typeof interactions.blockTest != "undefined"){
		interactions.initBlockTest();
	};
	
	initTree();
	
	if ($.isArray(wbt.facts) && typeof randomFacts=="object") {
		randomFacts.init();
	}

	for (var item in scorm.sessionData) {
		if (typeof (scorm.sessionData[item]) == "object") {
			for (var prop in scorm.sessionData[item]) {
				var pageNum=content.getPageNumberById(item);
				if (prop == "status") {
					switch(scorm.sessionData[item][prop]){
						case "completed":
						case "passed":
							puzzleVisiState(pageNum,1);
							break;
						case "failed":
							puzzleVisiState(pageNum,9);
							break;
						default:
							puzzleVisiState(pageNum,0);
					}					
				}
			}
		}
	};

	switch (scorm.windowMode) {
		case "self":
		case "popup":
			setTimeout(function () {
				content.init();
			}, 2000);
			break;
		default:
			break;
	};
};

function initShortcuts(){
	//$(expression).bind(types, keys, handler);
    //$(expression).unbind(types, handler);
    
	$(document).bind("keydown", "end", function (evt){
		content.jump(wbt.structure[wbt.structure.length-1].items[wbt.structure[wbt.structure.length-1].items.length-1].id);
		return false;
	});
	
	$(document).bind("keydown", "home", function (evt){
		content.jump(wbt.structure[0].items[0].id);
		return false;
	});
	
	$(document).bind("keydown", "pause", function (evt){
		if ($("#jplayer_audio").data().jPlayer.status.paused) {
			$("#jplayer_audio").jPlayer("play");
		} else {
			$("#jplayer_audio").jPlayer("pause");
		}
		return false;
	});
	
	//$(document).bind("keydown", "return", function (evt){
	//	return false;
	//});
	
	$(document).bind("keydown", "pageup", function (evt){
		$("#dynaModControl").click();
		return false;
	});
	
	$(document).bind("keydown", "pagedown", function (evt){
		$("#dynaModControl").click();
		return false;
	});
	
	$(document).bind("keydown", "left", function (evt){
		$("#aNavPrev").click();
		return false;
	});
	
	$(document).bind("keydown", "up", function (evt){
		content.jump("prev");
		return false;
	});
	
	$(document).bind("keydown", "right", function (evt){
		$("#aNavNext").click();
		return false;
	});
	
	$(document).bind("keydown", "down", function (evt){
		content.jump("next");
		return false;
	});
	
	$(document).bind("keydown", "Shift+" + (wbt.metadata.language=="_de"?"i":"t"), function (evt){
		doMenuItem("toc");
		return false;
	});
	
	if(wbt.glossary.length>0){
		$(document).bind("keydown", "Shift+g", function (evt){
			doMenuItem("glossary");
			return false;
		});
	}
	
	if(wbt.files.length>0){
		$(document).bind("keydown", "Shift+d", function (evt){
			doMenuItem("files");
			return false;
		});
	}
	
	$(document).bind("keydown", "Shift+" + (wbt.metadata.language=="_de"?"t":"h"), function (evt){
		doMenuItem("submenu");
		return false;
	});

	$(document).bind("keydown", "Shift+e", function (evt){
		doMenuItem("exit");
		return false;
	});
	
	$(document).bind("keydown", "Shift+9", function (evt){
		$.elpsOverlay("show", {
			content: "<p>Log Console</p>" + $("#logger").html(),
			height: $("#divcontainer").outerHeight(),
			width: $("#divcontainer").outerWidth(),
			bound: $("#divcontainer")
		});
		return false;
	});
	
	$(document).bind("keydown", "esc", function (evt){
		$("body").elpsTooltip("hide");
		return false;
   });
};

function localizeGUI() {
	try{
		if(typeof dbText=="undefined")initText();
		for(var i=1;i<dbText.length;i++){
			if($("#"+dbText[i].id).length>0){
				switch(dbText[i].hook){
					case "caption":
						if(dbText[i].id=="windowTitle"){
							document.title=dbText[i].html;
						}else{
							$("#"+dbText[i].id).html(dbText[i].html);
						}
						break;
					case "title":
						$("#"+dbText[i].id).prop("title",dbText[i].html);
						break;
					case "value":
						$("#"+dbText[i].id).prop("value",dbText[i].html);
						break;
					default:
						break;
				}
			}
		}
	}catch(e){}
}

mainGridSettings.marginBottom=99;
mainGridSettings.minLeft=220;
mainGridSettings.minRight=688;
mainGridSettings.objectsToMove=new Array();

function buildMainGrid(){
	
	$("<div/>", {
        id: "divcontainer"
    }).appendTo("body");
	
	var w=$(window).width()-wbt.metadata.stageWidth-300;
	if(w > 0){
		w=wbt.metadata.stageWidth+300;
	}else{
		w=$(window).width()-10;
	};
	
	$("#divcontainer").css({
		width: w + "px",
		maxWidth: wbt.metadata.stageWidth + 300 + "px",
		minWidth: wbt.metadata.stageWidth + 200 + "px",
		height: wbt.metadata.stageHeight + 225 + "px"
	});
	
	if((wbt.metadata.stageWidth + 300) > screen.width || (wbt.metadata.stageHeight + 225) > screen.height){
		$.elpsOverlay("show", {
			content: eval("lowResolutionWarning"+wbt.metadata.language),
			icon: "warning",
			bound: $("#divcontainer")
		})
	}
		
	$("#divcontainer").center();
	$(window).bind("resize", function() {
		$("#divcontainer").center();
	});	
	
	$("<div/>", {
        id: "divheader"
    }).appendTo($("#divcontainer"));
	
	buildMenus();
	
	$("<div/>", {
        id: "mainGrid",
		"style": "margin-bottom: " + mainGridSettings.marginBottom + "px"
    }).appendTo($("#divcontainer"));
	
	$("<div/>", {
        id: "westPane"
    }).appendTo($("#mainGrid"));

	$("<div/>", {
        id: "eastPane"
    }).appendTo($("#mainGrid"));
	
	$("<div/>", {
        id: "divcontent"
    }).appendTo($("#eastPane"));
	
	$("#divcontent").css("width",wbt.metadata.stageWidth+"px");
	$("#divcontent").css("height",wbt.metadata.stageHeight+"px");
	
	buildFooter();
	
	mainGridSettings.objectsToMove.push(
		{id:"divfooter",selector:"left",offsetPixel:6},
		{id:"divmenubar",selector:"width",ieOnly:false}
	);	
	
	$("#mainGrid").splitter({
		type: "v",
		outline: true,
		minLeft: mainGridSettings.minLeft,
		minRight: mainGridSettings.minRight
	});
	
}

if(typeof content=="undefined"){
	content={};
}
content.activeBlock=-1;
content.activePage=new Object();
content.previousPageId=0;
content.nextPageId=0;
content.activeStep=0;
content.activeModeration="";
content.pageNum=1;
content.container=new Object();
content.audioPlayer=new Object();
content.innerNavActive_back=false;
content.innerNavActive_fwd=false;
content.bounceOrigin="";
content.dynaPopup=function(args){createDynaPopup(args);};

content.init=function(){
    this.container=document.getElementById("divcontent");

    var gotcha=false;
	var blocks=wbt.structure;
	for (var i in blocks){
		if(typeof blocks[i] == "object"){
			var pages = blocks[i].items;
			for (var j in pages) {
				if(typeof pages[j] == "object"){
					if(typeof pages[j].steps == "object"){
						var steps=pages[j].steps;
						for(var k in steps){
							if(typeof steps[k].moderations == "object"){
								if(steps[k].moderations.length>0 && steps[k].id.indexOf("intro_")==-1){
									gotcha=true;
								}
							}
						}
					}
				}
			}
		}
	};	
	
    $("<div/>", {
        id: "audioPlayerControls",
        html: this.audioPlayerControlsTemplate,
		css: {
			visibility: gotcha ? "visible" : "hidden"
		}
    }).appendTo($("#divfooter"));
    
	var browser=navigator.userAgent.toLowerCase();
	if(browser.indexOf("firefox") > -1) browser="firefox";
	
    $("#jplayer_audio").jPlayer({
        ready: function() {
            if(gotcha){
				content.setActivePage("start");
			}
        },
        ended: function(){
			if(typeof content.activeModeration)
			
			
            if(content.activePage.steps.length>1 && content.activeStep!=(content.activePage.steps.length-1)){
                var mods=content.activePage.steps[content.activeStep].moderations;
				for(var i=0;i<mods.length;i++){
					if(mods[i].id==content.activeModeration){
						if(typeof mods[i].stopOnFinish!="undefined"){
							if(mods[i].stopOnFinish){
								content.activeModeration="";
								return;
							}
						}
						
					}
				}
				setTimeout(function(){
					content.activeModeration="";
					content.cycleForth();
				},1000);
            }else if(content.nextPageId==0){
				content.activeModeration="";
				setTimeout(function(){
					doExitWarning();
				},2000)
			}else{
				content.notifyNavNext();
			}
        },
		play: function(){
			$("#jplayer_audio").jPlayer("unmute");
			scorm.setPreference("audioEnabled", true);
		},
		volumechange: function(){
			if($("#jplayer_audio").jPlayer("option","muted")){
				$("#jplayer_audio").jPlayer("stop");
				scorm.setPreference("audioEnabled", false);
			}else{
				$("#jplayer_audio").jPlayer("play");
				scorm.setPreference("audioEnabled", true);
			};
			scorm.setPreference("audioVolume", Math.round($("#jplayer_audio").jPlayer("option","volume")*100)/100 ); //0...1
		},
		cssSelectorAncestor: "#jp_container_audio", 
         solution: "html",
		muted: (scorm.getPreference("audioEnabled") ? false : true),
		volume: scorm.getPreference("audioVolume"),
        
        supplied: "mp3"
    });
	
	if(!gotcha){
		content.setActivePage("start");
	}

	if(scorm.scoVersion=="scormCon"){
		scorm.scoAPI.jQuery.unblockUI();
	}else{
		$.unblockUI();
	}
};

content.setStatus = function(s){
    var status="", score=0;
    switch(s){
		case "reset":
			puzzleVisiState(content.pageNum,99)
			status="not attempted";
			score=99;
			break;
		case "skip":
			return;
		case "browsed":
			status="completed";
			score=this.activePage.maxScore;
			puzzleVisiState(content.pageNum,score);
			break;			
		case "passed":
			status=s;
			score=this.activePage.maxScore;
			puzzleVisiState(content.pageNum,score);
			break;
		case "failed":
			if(interactions.getLessonMode()=="profiling"){
				content.setStatus("browsed");
			}else{
				if(this.activePage.status!="passed"){
					status=s;
					score=0;
					puzzleVisiState(content.pageNum,9);
				}else{
					status="passed";
					score=this.activePage.maxScore;
				}	
			};
			break;
        default:
            status="incomplete";
			break;
    };

	if(scorm.getPreference("dyna")=="toc" && !scorm.getPreference("showModeration")){
		writeTree();
	};
	this.activePage.status=status;
	this.activePage.score=score;
	scorm.updateSessionData(this.activePage.id, {
		"status": status,
		"score": score
	});
	
	if(typeof content.blockNavigation!="undefined"){
		content.blockNavigation.update();
	}
}

content.setActivePage=function(id){
    if(id=="start"){
		if(scorm.resumePageId!=""){
			id=scorm.resumePageId;
		}else{
			id=wbt.structure[0].items[0].id;
		}
	}

    this.getPageById(id);
    if(this.activePage){
        this.resetPage();
		
        this.initPage();
    }else{
		$.elpsOverlay("show", {
			content: "<p>" + eval("mpPageNotFound"+wbt.metadata.language) + id + "</p>",
			icon: "warning",
			bound: $("#divcontainer"),
			autoclose: 3000
		});
    }
}

content.resetPage=function(){
    content.innerNavActive_back=false;
    content.innerNavActive_fwd=false;
    content.activeStep=0;
    content.stopModeration();
    $("#stepnav").remove();
    $("#aNavNext").pulse("destroy");
    $(".divstep").each(function(index) {
        $(this).remove();
    });
};

content.initPage=function(){
	
	this.activeBlock=-1;
	$.each(wbt.structure, function(i, block){
		$.each(block.items, function(j, page){
			if(page.id==content.activePage.id){
				content.activeBlock=i;
			};
		});
	});
	
	interactions.activeInteraction={};

	if(scorm.resumePageId!=this.activePage.id){
		scorm.updateSessionData(this.activePage.id, {
			isCurrent: true,
			bookmark: (this.activePage.bookmark==2 ? 0 : this.activePage.bookmark)
		});
	};
	
	if($("#divslider").length>0){
		$("#divslider").cycle("destroy");
		$("#divslider").remove();
	};
	
	$("#divpagetitle").html(decodeBase64(this.activePage.title));

	if(typeof content.blockNavigation!="undefined"){
		this.blockNavigation.init();
	};

	$("#row"+this.activePage.id).addClass("tocActiveItem");
	
	switch(interactions.lessonMode){
		case "profiling":
		case "distributedAssessment":
		case "distributedSelfTest":
			doMenuItem("toc");
			break;
		default:
			break;
	};
	
    var steps=this.activePage.steps;
	if(steps.length==0)return;
	
	$("#aNavNext").unbind("click");
	$("#aNavNext").pulse("destroy");
	$("#aNavPrev").unbind("click");
	
	if(content.nextPageId!=0){
		$("#aNavNext").click(function(){
			content.jump("next",2);
		});
	}else{
		$("#aNavNext").click(function(){
			content.jump("end",2);
		});
	};
	
	if(content.previousPageId!=0 || steps.length>1){
		$("#aNavPrev").click(function(){
			content.jump("prev",1);
		});
	}else{
		$("#aNavPrev").click(function(){
			content.jump("start",1);
		});
	};
	
    $("<div/>", {
        id: "stepnav"
    }).appendTo("#divcontainer");
	
    if(steps.length==1){
		$("#stepnav").hide();
		if($.isEmptyObject(steps[0].interaction)){
			if(this.activePage.id.indexOf("_p")!=-1){
				content.setStatus("browsed");
			}else{
				setTimeout(function(){
					content.setStatus("browsed");
				}, defaultSettings.timeUntilBrowsed);
			}
		};		
    }
        
    var ul=$("<ul/>").appendTo("#stepnav");
	
	var getTabData=function(id){
		var cntSteps=0, cntAtoms=0, data={ix: 0, num: 0};
		$.each(steps, function(j, s){
			if(typeof s.display!= "undefined"){
				if(s.display=="visible"){
					cntSteps++;
					cntAtoms=0;
				}else{
					cntAtoms++;
				}
			}else{
				cntSteps++;
			}

			if(s.id==id){
				data.ix=cntSteps + (cntAtoms>0 ? "." + cntAtoms : "");
				data.num=cntSteps-1;
				cntSteps=0;
				cntAtoms=0;
			}
		});
		
		return data;
	}
	
	var arrScriptsToLoad=new Array();
    $.each(steps, function(i, step) {
        var html = (typeof step.html == "undefined") ? "" : decodeBase64(step.html);
			html = html
				.replace(/{RELPATH}/g, wbt.metadata.relpath)
				.replace(/{COMMON}/g, common)
				.replace(/{CUSTOM}/g, custom)
				.replace(/{STEPID}/g, step.id);
		
		if(html.indexOf("{profile}")!=-1){
			html=html.replace(/{profile}/g, interactions.getRating());
		};
		
		if(html.indexOf("{blockTestResults}")!=-1){
			html=html.replace(/{blockTestResults}/g, interactions.getResults());
		};

        $("<div/>", {
            id: "divstep"+step.id,
            "class": "divstep",
            css: {
				width: "100%"
			},
            html: html
        }).appendTo("#"+content.container.id);

		var display="visible";
		if(typeof step.display!="undefined"){
			display=step.display;
		}
		
		$("<li/>", {
			id: "tabstep_li"+step.id,
			css: {
				display: display=="visible" ? "inline-block" : "none"
			}
		}).appendTo(ul);
	
		var tabData=getTabData(step.id);
		$("<a/>", {
					id: "tabstep"+step.id,
					html: tabData.ix,
					href: "javascript:void(0);"
				}
			)
			.appendTo("#tabstep_li"+step.id)
			.attr("data-stepix", i)
			.attr("data-stepnum", tabData.num);

		//Transition FX
		if(!$.isEmptyObject(content.getStepSpecials("transition", i)) && steps.length>1){
			
			$("#divstep"+step.id).addClass("slide");
			var fx=content.getStepSpecials("transition", i);

			switch(fx.effect.toLowerCase()){
				case "none":
					$("#divstep"+step.id)
						.attr("data-cycle-fx", "none");	
					break;
                case "fade":
					$("#divstep"+step.id)
						.attr("data-cycle-fx", "fade");
                    break;
				case "fadeout":
					$("#divstep"+step.id)
						.attr("data-cycle-fx", "fadeout");	
					break;
				case "scroll_horz":
					$("#divstep"+step.id)
						.attr("data-cycle-fx", "scrollHorz");
					break;
				case "scroll_vert":
					$("#divstep"+step.id)
						.attr("data-cycle-fx", "scrollVert");
					break;
				case "flip_vert":
					$("#divstep"+step.id)
						.attr("data-cycle-fx", "flipVert");	
					break;
				case "flip_horz":
					$("#divstep"+step.id)
						.attr("data-cycle-fx", "flipHorz");
					break;
				case "shuffle":
					$("#divstep"+step.id)
						.attr("data-cycle-fx", "shuffle")
						.attr("data-cycle-shuffle-right", 0)
						.attr("data-cycle-shuffle-top", "-75")
						.attr("data-cycle-speed", 1500)
						.attr("data-cycle-timeout", 2000);
					break;
				case "tileslide_horz":
					$("#divstep"+step.id)
						.attr("data-cycle-fx", "tileSlide")
						.attr("data-cycle-tile-vertical", "false");
					break;
				case "tileslide_vert":
					$("#divstep"+step.id)
						.attr("data-cycle-fx", "tileSlide")
						.attr("data-cycle-tile-vertical", "true");
					break;
                case "tileblind_horz":
					$("#divstep"+step.id)
						.attr("data-cycle-fx", "tileBlind")
						.attr("data-cycle-tile-vertical", "false");
					break;
				case "tileblind_vert":
					$("#divstep"+step.id)
						.attr("data-cycle-fx", "tileBlind")
						.attr("data-cycle-tile-vertical", "true");					
					break;
				default:
					$("#divstep"+step.id)
						.attr("data-cycle-fx", "none")
			};
		};
    });
	
	if($("#divcontent .slide").length>0){
		
		$("#divcontent .divstep").each(function(j, s){
			if(!$(this).hasClass("slide")){
				
				//attach slide class to all steps, even if no transition is required
				$(this)
					.addClass("slide")
					.attr("data-cycle-fx", "none")
			};
		});
		
		$("<div/>", {
			id: "divslider"
		}).insertAfter($("#divpagetitle"));
		
		$(".slide").appendTo("#divslider");
		
		$("#divslider").cycle({
			slides: "> div.slide",
			paused: true,
			wait: true,
			log: false
		});
	};

	if(typeof extendInitPage=="function"){
		extendInitPage();
	}

	if(arrScriptsToLoad.length>0){
		var arrUniqueScripts = [];
		$.each(arrScriptsToLoad, function(i, el){
			if($.inArray(el, arrUniqueScripts) === -1) arrUniqueScripts.push(el);
		});

		yepnope([{
			load: arrUniqueScripts,
			complete: function(){
				content.showStep("fadeIn", false);
			}                
		}]); 	
	}else{
		this.showStep("fadeIn", false);
	}
}

content.killIntervals=function(){
	try{
		if($(".jsMovieFrame").length>0){
			$(".jsMovieFrame").parent().jsMovie("destroy");
		}
		
		clearTimeout(content.timeout);
		
	}catch(e){};
}

content.showStep=function(anim, preventTransition){ //preventTransition=true wenn manuell Schritt angeklickt

	var steps=this.activePage.steps;
	var step=steps[this.activeStep];

	//cleaning up
	content.killIntervals();
	interactions.cleanUp();
	
	if($("#divcontent .slide").length>0 && !preventTransition){ 
		anim="cycle";
	};

	if(typeof step.interaction=="object"){
		$("#divcontent").css({
			"max-width": "728px"
		});	
		interactions.init(step);
	}else{
		$("#divcontent").css({
			"max-width": wbt.metadata.stageWidth + "px"
		});
	}

    var steps=this.activePage.steps;
    if(steps.length==1){
        $("#tabstep"+steps[this.activeStep].id).show();
    }
	
	if($("#divstep"+steps[this.activeStep].id +" div").hasClass("reflection")){
		content.initReflection();
	};		
    
    if(steps.length>1){
        content.updateNav();
        if(anim!="cycle"){
			for(var i=0;i<steps.length;i++){
				$("#divstep"+steps[i].id).hide();
			}
		}
    };
	
	if(step.hotspots.length>0){
		
		if($("#divstep"+steps[this.activeStep].id).find("map").length==0){
		
			if($.isEmptyObject(content.getStepSpecials("bounce", content.activeStep))){
				
				var map=$("<map/>", {
					id: "map"+steps[this.activeStep].id,
					name: "map"+steps[this.activeStep].id
				}).prependTo($("#divstep"+steps[this.activeStep].id));
				
				$("#divstep"+steps[this.activeStep].id+" img")
					.first()
					.attr("usemap", "#map"+steps[this.activeStep].id)
					.attr("border", "0")
					.attr("hidefocus", "hidefocus");
					
			}else{ //bouncemap
				
				var bounceOptions=content.getStepSpecials("bounce", content.activeStep);
				
				var getSuccessor=function(friendlyId){ //get id of the first page in the target block
					var retval="";
					$.each(wbt.structure, function(bi,bo){
						if(typeof bo.friendlyId!="undefined"){
							if(bo.friendlyId==friendlyId){
								retval=bo.items[0].id;
							}
						}
					});
					return retval;
				};
				
				var map=$("<map/>", {
					id: "bounceMap",
					name: "bounceMap",
					"data-successor": getSuccessor(bounceOptions.successor)
				}).prependTo($("#divstep"+steps[this.activeStep].id));
				
				$("#divstep"+steps[this.activeStep].id+" img")
					.first()
					.addClass("bounceImage")
					.attr("usemap", "#bounceMap")
					.attr("border", "0")
					.attr("hidefocus", "hidefocus");
					
			}
			
			$.each(step.hotspots, function(i, hotspot){
				var coords="";
				if(typeof wbt.metadata.slideSize!="undefined"){
					var scaleX = wbt.metadata.stageWidth / parseInt(wbt.metadata.slideSize.cx),
						scaleY = wbt.metadata.stageHeight / parseInt(wbt.metadata.slideSize.cy);
				
					var X = parseInt(parseInt(hotspot.pos.x) * scaleX), 
						Y = parseInt(parseInt(hotspot.pos.y) * scaleY),
						W = parseInt(parseInt(hotspot.size.cx) * scaleX),
						H = parseInt(parseInt(hotspot.size.cy) * scaleY);
					
					coords = X + "," + Y + "," + (X + W) + "," + (Y + H);
				};

				if(coords!=""){
					switch(hotspot.type){
						case "animation":
							
							var preload=[
								common+"lib/jquery.plugin.ondemand.jsmovie.js"
							];							

							yepnope([{
								load: preload,
								complete: function(){
									var area=$("<area/>", {
										href: "javascript:void(0);",
										shape: "rect",
										coords: coords
									}).appendTo(map);
									
									area.bind("click", function(){
										$.elpsOverlay("show", {
											content : "" +
												"<div " +
													"id='elpsAnimation' " +
													"style='max-width:" + ($("#divcontainer").outerWidth()-150) + "px; max-height:" + ($("#divcontainer").outerHeight()-75) +  "px;'" +
												"></div>" +
												"<div style='padding: 10px;'>" +
													"<button id='animationPlay' data-role='button' data-inline='true' data-theme='a'>Start</button> " +
													"<button id='animationStop' data-role='button' data-inline='true' data-theme='a'>Stop</button> " +
													"<button id='animationPause' data-role='button' data-inline='true' data-theme='a'>Pause</button> " +
												"</div>",
											position: "top",
											width: $("#divcontainer").outerWidth()+"px",
											height: $("#divcontainer").outerHeight()+"px",
											icon: "atom",
											closeKey: true,
											useOverlay: true,
											bound: $("#divcontainer"),
											afterShow: function(){
												content.stopModeration();
												
												$("button").button();
												
												var images=[];
												$.each(wbt.animations, function(j, animation){
													if(animation.id==hotspot.props.block){
														$.each(animation.frames, function(k, frame){
															images.push(frame.asset.media);
														});
													};
												});											
												
												if(images.length>0){
													$("#elpsAnimation").jsMovie({
														images : images,
														folder: "",
														width : wbt.metadata.stageWidth,
														height: wbt.metadata.stageHeight,
														grid: { 
															width:wbt.metadata.stageWidth, 
															height:wbt.metadata.stageHeight, 
															columns:1,
															rows:1
														},
														fps:6,
														playOnLoad : true
													});
													
													$("#animationPlay").click(function(){
														$("#elpsAnimation").jsMovie("play");
													});
												
													$("#animationStop").click(function(){
														$("#elpsAnimation").jsMovie("stop");
													});
												
													$("#animationPause").click(function(){
														$("#elpsAnimation").jsMovie("pause");
													});
												}else{
													$("#elpsAnimation").html("<b>There are no pictures to be animated.</b>");
												}
											},
											afterHide: function(){
												$("#elpsAnimation").remove();
											},
											buttons: {
												close : {
													text: "OK"
												}
											}
										});								
									});
								}                
							}]); 
						case "atom":
							//<a href="javascript:void(0);" onclick="createDynaPopup('type:atom','content:xxx');">xxx</a>
							break;
						case "glossary":
							break;
						case "html":
							break;
						case "hyperlink":
							break;
						case "img":
							break;
						case "jumpLink":
							var area=$("<area/>", {
								href: "javascript:void(0);",
								shape: "rect",
								coords: coords
							}).appendTo(map);
							
							//if(typeof wbt.structure[content.activeBlock].bounce!="undefined"){
							if($.isEmptyObject(content.getStepSpecials("bounce", content.activeStep))){
								area.bind("click", function(){
									var jumpTarget=content.getJumpTarget(hotspot.props.targetId);
									if(jumpTarget.type=="step"){
										content.setStep(jumpTarget.stepNum, false);
									}else{
										if(jumpTarget.pageId!=content.activePage.id){
											content.jump(jumpTarget.pageId);
										}
									};
								});
							}else{
								var jumpTarget=content.getJumpTarget(hotspot.props.targetId);
								if(jumpTarget.type=="step"){
									area.bind("click", function(){
										content.setStep(jumpTarget.stepNum, false);
									});
								}else{
									if(jumpTarget.pageId!=content.activePage.id){
										area
											.addClass("bounce")
											.attr("data-target", jumpTarget.pageId);
									};
								};								
							};
							break;
						case "mod":
							var area=$("<area/>", {
								href: "javascript:void(0);",
								shape: "rect",
								coords: coords
							}).appendTo(map);
							
							area.bind("click", function(){
								content.moderate(hotspot.props.trigger);
							});
							
							break;
						case "overlay":
							var area=$("<area/>", {
								href: "javascript:void(0);",
								shape: "rect",
								coords: coords
							}).appendTo(map);
							
							if(hotspot.props.type=="customtooltip"){
								$.each(step.overlays, function(x,overlay){
                                    var hotspotClass="tooltip";
                                    if (typeof hotspot.props.event!="undefined") { 
                                       hotspotClass=hotspot.props.event;
                                    }
                                    
                                    if(typeof overlay.trigger!="undefined"){
                                        if(overlay.trigger==hotspot.props.trigger){
                                            area
                                            .addClass(hotspotClass)
                                            .attr("title", "b64:" + overlay.html);
                                        }
                                    }
								});	
							}else{
								area.bind("click", function(){
									$.each(step.overlays, function(x,overlay){
										if(typeof overlay.trigger!="undefined"){
											if(overlay.trigger==hotspot.props.trigger){
												$.elpsOverlay("show", {
													content : "" +
														"<div>" +
															decodeBase64(overlay.html) +
														"</div>",
													position: "top",
													icon: "atom",
													closeKey: true,
													useOverlay: true,
													bound: $("#divcontainer"),
													afterShow: function(){
														content.stopModeration();
													},
													afterHide: function(){},
													buttons: {
														close : {
															text: "OK"
														}
													}
												});
											}
										}
									});								
								});
							};
							
							break;
						case "popup":
							break;
						case "swf":
							//<a class="dynaLink" onclick="createDynaPopup('type:swf','content:{RELPATH}images/xxx.swf','width:600','height:416','caption:xxx');" href="javascript:void(0);">Animation starten</a>
							break;
						case "timeline":
							
							var preload=[
								common+"lib/jquery.plugin.ondemand.timeline.js",
								common+"lib/jquery.plugin.ondemand.timeline.css"
							];

							yepnope([{
								load: preload,
								complete: function(){
									var area=$("<area/>", {
										href: "javascript:void(0);",
										shape: "rect",
										coords: coords
									}).appendTo(map);
									
									area.bind("click", function(){
										$.elpsOverlay("show", {
											content : "" +
												"<div " +
													"id='elpsTimeline' " +
													"style='max-width:" + ($("#divcontainer").outerWidth()-150) + "px; max-height:" + ($("#divcontainer").outerHeight()-75) +  "px;'" +
												"></div>",
											position: "top",
											width: $("#divcontainer").outerWidth()+"px",
											height: $("#divcontainer").outerHeight()+"px",
											icon: "atom",
											closeKey: true,
											useOverlay: true,
											bound: $("#divcontainer"),
											afterShow: function(){
												content.stopModeration();
												var dates=[];
												$.each(wbt.timelines, function(j, timeline){
													if(timeline.id==hotspot.props.block){
														$.each(timeline.date, function(k, date){
															dates.push({
																startDate: date.startDate,
																headline: decodeBase64(date.headline),
																text: decodeBase64(date.text),
																asset: date.asset
															})
														});
													};
												});											
												
												if(dates.length>0){
													var story = new VMM.Timeline("elpsTimeline");
														story.init({
															type: "timeline",
															width: "100%",
															height: "100%",
															source: {
																timeline: {
																	type: "default",
																	date: dates
																}
															},
															embed_id: "elpsTimeline"
														});
												}else{
													$("#elpsTimeline").html("<b>No timeline data available.</b>");
												}
											},
											afterHide: function(){
												$("#elpsTimeline").remove();
											},
											buttons: {
												close : {
													text: "OK"
												}
											}
										});								
									});
								}                
							}]); 
						
						case "tooltip":
							var caption="", tooltip="", html="";
							if(hotspot.props.caption!="")caption=decodeBase64(hotspot.props.caption);
							if(hotspot.props.content!="")tooltip=decodeBase64(hotspot.props.content);
							
							if(caption!=""){
								html= "" +
									"<p>" +
										"<b>" +
											decodeBase64(hotspot.props.caption) +
										"</b>" +
									"</p>";
							}
								
							if(tooltip!=""){
								html+= "" +
									"<p>" +
										decodeBase64(hotspot.props.content) +
									"</p>";
							}
							
							if(html!=""){
								$("<area/>", {
									href: "javascript:void(0);",
									shape: "rect",
									"class": "tooltip",
									title: "b64:" + encodeBase64(html),
									coords: coords
								}).appendTo(map);
							}
							break;
						case "video":
							var area=$("<area/>", {
								href: "javascript:void(0);",
								shape: "rect",
								"class": "tooltip",
								title: (wbt.metadata.language=="_de" ? "Hier klicken, um den Video-Player zu öffnen" : "Click here to open the video player"),
								coords: coords
							}).appendTo(map);
							
							area.bind("click", function(){
								createDynaPopup(
									"type:video",
									"file:" + hotspot.props.file,
									"supplied:" + (hotspot.props.supplied != "" ? hotspot.props.supplied : "m4v,ogv"),
									"solution:" + (hotspot.props.solution != "" ? hotspot.props.solution : "html"),
									"width:" + hotspot.props.width,
									"height:" + hotspot.props.height,
									"cssClass:" + (hotspot.props.cssClass != "" ? hotspot.props.cssClass : "270p")
								);
							});
							break;
						case "url":
							$("<area/>", {
								href: hotspot.props.target,
								target: "_blank",
								shape: "rect",
								"class": "tooltip",
								title: hotspot.props.target,
								coords: coords
							}).appendTo(map);
					};
				};
			});
		};
	};
	
	if(preventTransition){
		$("#divstep"+steps[this.activeStep].id)
			.css({
				visibility: "visible",
				opacity: 1,
				transform: "none",
				"background-position": "0% 0%"
			});
	}
	
	switch(anim){
		case "cycle":
			var activeSlide=$("#divslider").data("cycle.opts").currSlide;
			if(activeSlide!=content.activeStep){			
				$("#divslider")
					.cycle("goto", content.activeStep)
					.on("cycle-after", function( e, opts ) {
						content.stepShown();
					});
			}else{				
				if(typeof $("#divslider").data("cycle.opts")!= "undefined"){
					$("#divslider").data("cycle.opts").currSlide=content.activeStep;
				};
				content.stepShown();
			}
			break;		
        case "fadeIn":
            $("#divstep"+steps[this.activeStep].id).fadeIn(500,
                function(){
					content.stepShown();
                }
            );
            break;
        default:
            $("#divstep"+steps[this.activeStep].id).show(0,
                function(){
					content.stepShown();
                }
            );
    };
	
};

content.getStepSpecials=function(find, stepIx){
	var step=this.activePage.steps[stepIx], found={};
	if(typeof step.specials!="undefined"){
		$.each(step.specials, function(i,special){
			if(special.type == find){
				found = special;
			}
		});
	};
	return found;
}

content.stepShown=function(){
	var moderationTrigger="intro";
	var stepId=this.activePage.steps[content.activeStep].id;
	
	$("#divstep"+stepId).css({clear:"right"});
	
	//Bounce Map
	if($("#divstep"+stepId+" .bounce").length>0){
		var topicsRemaining=0;
		if(msie8){
			//create a dummy area, since ie8 doesn't draw the last(!) area correctly
			$("<area/>", {
				"class": "bounce",
				href: "javascript:void(0);",
				shape: "rect",
				coords: "0, 0, 1, 1" //x1,y1,x2,y2
			}).appendTo($("#bounceMap"));				
		};		
		
		$(".bounceImage").maphilight();
		$("#divstep"+stepId+" .bounce").each(function() {
			var n=content.getPageNumberById($(this).attr("data-target"));
			switch(parseInt(visiState.substring(n,n-1))){
				case 0:
				case 9:
					if(typeof $(this).attr("title")=="undefined"){
						$(this).attr("title",eval("bounceMapLinkInfo"+wbt.metadata.language));
						$(this).addClass("tooltip");
					}
					topicsRemaining++;
					break;
				default:
					$(this).attr("title",eval("bounceMapTopicCompleted"+wbt.metadata.language));
					$(this).addClass("tooltip");
					var data = $(this).mouseout().data("maphilight") || {};
					data.alwaysOn = !data.alwaysOn;
					$(this).data("maphilight", data).trigger("alwaysOn.maphilight");
			};
			
			$(this).click(function(e) {
				content.bounceOrigin=content.activePage.id;
				content.jump($(this).attr("data-target"));
			});	
		});

		if(topicsRemaining < $("#divstep"+stepId+" .bounce").length){
			moderationTrigger=0;
		};
		
		if(topicsRemaining==0){
			
			$("#aNavNext").unbind("click");
			$("#aNavNext").click(function(){
				content.jump($("#bounceMap").attr("data-successor"));
			});
			moderationTrigger=10;
		};
	};
    
    //Hover
    $("#divstep"+stepId+" .hover").each(function() {
       if($(this).attr("title").indexOf("b64:")!=-1){
            html=decodeBase64($(this).attr("title").split("b64:")[1]);
            html=html.replace(/{RELPATH}/g, wbt.metadata.relpath);

            $(this).bind("mouseover", function(){
                $.elpsOverlay("show", {
                    content : "" +
                        "<table width='100%' height='100%' cellspacing='0' cellpadding='0' border='0'><tr><td valign='middle' align='center'>" +
                            html +
                        "</td></tr></table>",
                    width: $("#divcontainer").outerWidth()+"px",
                    height: $("#divcontainer").outerHeight()+"px",
                    position: "top",
                    icon: "atom",
                    closeKey: true,
                    useOverlay: true,
                    bound: $("#divcontainer"),
                    afterShow: function(){
                        content.stopModeration();
                    },
                    afterHide: function(){},
                    buttons: {
                        close : {
                            text: "OK"
                        }
                    }
                });								
            });
        }
    });
	
	//Tooltips
	$("#divstep"+stepId+" .tooltip").each(function() {
		var html="";
		if(typeof $(this).attr("title")!="undefined"){
			if($(this).attr("title").indexOf("atom:")!=-1){
				var atomData = typeof(content.activePage.atoms) != "undefined" ? content.activePage.atoms : "";
				for(var i=0;i<atomData.length;i++){
					if(atomData[i].id==$(this).attr("title").split("atom:")[1]){
						if(atomData[i].caption!="")html="<p>"+decodeBase64(atomData[i].caption)+"</p>";
						html+=unescape(decodeBase64(atomData[i].content));
						html=html.replace(/{RELPATH}/g, wbt.metadata.relpath);
					}
				}
			}
			
			if($(this).attr("title").indexOf("b64:")!=-1){
				html=decodeBase64($(this).attr("title").split("b64:")[1]);
				html=html.replace(/{RELPATH}/g, wbt.metadata.relpath);
			}
			
			if($(this).attr("title").indexOf("glossary:")!=-1){
				var item=$(this).attr("title").split("glossary:")[1];
				for(var i=0;i<wbt.glossary.length;i++){
					if(wbt.glossary[i].item==decodeBase64(item)){
						html="<p>"+wbt.glossary[i].item+"</p>" +
							"<p>"+decodeBase64(wbt.glossary[i].text)+"</p>";
						break;
					}
				}
				if(html=="")html="Error: missing glossary item";
			}
		
			$(this).elpsTooltip({
				animation: "fade", //fade, grow, swing, slide, fall
				arrow: true,
				arrowColor: "#F0F0F0",
				content: html,
				delay: 200,
				fixedWidth: 0,
				maxWidth: 400,
				interactive: true,
				interactiveTolerance: 350,
				offsetX: 0,
				offsetY: 0,
				onlyOne: true,
				position: "top",
				speed: 350,
				timer: 0,
				theme: ".elpsTooltip-shadow",
				touchDevices: false,
				trigger: "hover", //hover, click, custom
				updateAnimation: true			
			})
		}
	});
	
	//rating
	if($("#divstep"+stepId+ " .rating").length>0){
		if(typeof interactions.showRating=="function"){
			interactions.showRating();
		}
	};
	
	if(typeof interactions.blockTest != "undefined" || $("#testInfo").length>0){
		interactions.stepShown(stepId);		
	};
	
	if(typeof customStepShown=="function"){
		customStepShown();
	};
	
	$("button").button();
	
	content.updateImagemaps(true);
	
	//Timer
	if(!$.isEmptyObject(content.getStepSpecials("timer", content.activeStep))){
		content.timer=content.getStepSpecials("timer", content.activeStep);
		if($.isNumeric(content.timer.timeout)){
			content.timeout=setTimeout(function(){
				try{
					var fnName=content.timer.command.fn,
						fnArguments=[];
					executeFunctionByName(fnName, window, fnArguments); //target function must be bound with .bind(content), otherwise "this" won't work;
				}catch(e){
					console.log(e)
				}				
			}, content.timer.timeout);
		}		
	}else{
		content.timer={};
		clearTimeout(content.timeout);
	};
	
    content.moderate(moderationTrigger);
}

content.updateImagemaps=function(init){
	if(typeof this.activePage.steps=="undefined")return;
	var divId="divstep"+this.activePage.steps[this.activeStep].id;
	var elms=document.getElementById(divId).getElementsByTagName("map");
	for(var e=0;e<elms.length;e++){
		if(elms[e].id.indexOf("_scalable_")!=-1){
			elms[e].innerHTML=scaleImagemap(init,
				elms[e].innerHTML,
				$("img[usemap=\\" + "#" + elms[e].name + "]").outerWidth(),
				parseInt(elms[e].id.split("_scalable_")[1]))
		}
	}
}

content.reflections=new Array();
content.initReflection=function(){
	var stepId=content.activePage.steps[content.activeStep].id;
	
	var go=true;
	if(msie8){
		go=false;
	};
	
	if(go){
		//reset, wenn mehrere refl. auf einer seite und zurückgesprungen wird
		$("#divstep"+ stepId).find("script").remove();
		$("#reflection"+stepId).remove();
			
		$("<script/>", {
			text: $("#reflection_json"+stepId).html()
		}).appendTo($("#divstep"+stepId));

	}else{
		$("#script"+stepId).remove();
		$("#reflection"+stepId).remove();
		
		var scriptTag = document.createElement("script");
			scriptTag.text=$("#reflection_json"+stepId).text();
			scriptTag.setAttribute("id", "#script"+stepId);
			document.body.appendChild(scriptTag);	
	}
	
	var js=content.reflections[stepId];
	var template="" +
		 "<div class='question'>" +
			"<div class='questionHeader'>" +
				"<div class='questionText'>{INTRO}</div>" +
			"</div>" +
			"<div style='padding:10px;' class='dropShadow'>" +
				"{IMAGE}" +
				"<div>" +
					"<div class='description'>" +
						"<div>{DESCRIPTION}</div>" +
					"</div>" +
					"<div class='todo'>{TODO}</div>" +
				"</div>" +
			"</div>" +
			"<div style='clear:both;'></div>" +
			"<div class='questionFooter'></div>" +
		"</div>";
	
	var imgTemplate="" +
		"<img src='{SRC}' style='float:right;padding:10px;' />";
	
	var imgHtml="";
	if(typeof js.image!="undefined"){
			if(js.image.src!=""){
			//../runtime/custom/4-0/dihk/images/reflection/reflection{RND}.jpg
			js.image.src=js.image.src.replace("images/reflection","shared/images/reflection");
			js.image.src=js.image.src.replace("shared/shared/","shared/");
			if(js.image.randomize){
				var max=js.image.rangeTo, min=js.image.rangeFrom;
				var rndNum=Math.floor(Math.random() * (max - min + 1)) + min;
				imgHtml=imgTemplate
					.replace(/{SRC}/g,js.image.src)
					.replace(/{RND}/g,rndNum);
			}else{
				imgHtml=imgTemplate.replace(/{SRC}/g,js.image.src);
			}
		};
	};
	
	var html=template
		.replace(/{INTRO}/g, decodeBase64(js.intro))
		.replace(/{DESCRIPTION}/g, decodeBase64(js.description))
		.replace(/{TODO}/g, decodeBase64(js.todo))
		.replace(/{IMAGE}/g, imgHtml)
		.replace(/{CUSTOM}/g, custom)
		.replace(/{RELPATH}/g, wbt.metadata.relpath);
		
	
	$("<div/>", {
		id: "reflection"+stepId,
		html: html
	}).appendTo($("#divstep"+ stepId));
	
	$.each(js.buttons, function(i,item) {
		$("<input/>", {
			type: "button",
			value: item.button,
			css: {
				marginRight: "10px"
			},
			"class": item.button=="Musterlösung" ? "ui-button-primary" : "",
			click: function(){
				$.each(item.actions, function(j,action) {
					var fnArguments=new Array();

					if(typeof(action.arguments)=="object"){
						$.each(action.arguments, function(k,arg) {
							fnArguments.push(arg.argument);							
						});
					};
					executeFunctionByName(action.functionName, window, fnArguments);
				});
			}
		}).appendTo($("#reflection"+stepId+" .questionFooter"));
	});
	$("#reflection"+stepId+" input").button();
	return;
}

content.solveReflection=function(args){
	content.stopModeration();
	var stepId=content.activePage.steps[content.activeStep].id;
	
	if(typeof args[1]!="undefined"){
		if(args[1]=="replace"){
			$("#divstep"+ stepId + " .description").html("");
		}
	};
	
	$("<div/>", {
		html: decodeBase64(args[0])
	}).hide()
		.appendTo("#divstep"+ stepId + " .description")
		.fadeIn(1000);
	
	$("#divstep"+ stepId + " .todo").hide();
	$("#divstep"+ stepId + " .questionFooter").hide();
	content.setStatus("browsed");
};

content.setStep=function(num, preventTransition){
	this.activeStep=parseInt(num);
	this.showStep("", preventTransition);
};

content.getJumpTarget=function(stepId){
	var jumpTarget={
			type: "page",
			stepNum: 0,
			pageId: ""
		},
		blocks=wbt.structure;
    
	for (var i in blocks){
        if(typeof blocks[i] == "object"){
            var pages = getJsonObjects(blocks[i], "template", "multipage", true);
            for (var j in pages) {
                if(typeof pages[j] == "object"){
                    if(typeof pages[j].steps == "object"){
                        var steps=pages[j].steps;
                        for(var k in steps){
                            if(steps[k].id == stepId){
                                if(pages[j].id == content.activePage.id){
									//step within the current page
									jumpTarget={
										type: "step",
										pageId: pages[j].id,
										stepNum: k
									}
								}else{
									//step within another page
									jumpTarget={
										type: "page",
										pageId: pages[j].id,
										stepNum: 0
									}
								}								
                            }
                        }
                    }
                }
            }
        }
    };
	
	if(jumpTarget.type=="page" && jumpTarget.pageId==""){
		return {};
	}else{
		return jumpTarget;
	};
};

content.jump=function(url,direction){
	
	if(typeof getPermissionToJump=="function"){
		if(!getPermissionToJump())return;
	}
	
	content.killIntervals();
	
    switch(true){
		case(content.innerNavActive_back&&direction==1):
			this.cycleBack();
			return;
		case(content.innerNavActive_fwd&&direction==2):
			this.cycleForth();
			return;
		case(typeof direction=="undefined"):
			//props.setProperty("bp",props.getProperty("cp"));
			break;
		case(direction==0):
			//props.setProperty("bp","");
			break;
		case(direction==99):
			//props.setProperty("bp",props.getProperty("cp")+"*");
			break;
	}
    
    if((direction==2 && this.nextPageId==0) || url=="end"){
		$.elpsOverlay("show", {
			content: "<p>" + eval("mpEndMsg"+wbt.metadata.language) + "</p>",
			icon: "information",
			bound: $("#divcontainer"),
			autoclose: 3000
		});		
		return;
	}
	
	if((direction==1 && this.previousPageId==0) || url=="start"){
		$.elpsOverlay("show", {
			content: "<p>" + eval("mpStartMsg"+wbt.metadata.language) + "</p>",
			icon: "information",
			bound: $("#divcontainer"),
			autoclose: 3000
		});	
		return;
	};
    
    var steps=this.activePage.steps;

	//Empty page, no steps
	if(steps.length==0){
		content.setStatus("browsed");
		document.getElementById("divcontent").innerHTML="";
		switch(url){
			case "next":content.setActivePage(content.nextPageId);break;
			case "prev":content.setActivePage(content.previousPageId);break;
			default:content.setActivePage(url);
		}
		return;
	};

    switch(url){
        case "next":
            $("#divstep"+steps[this.activeStep].id).fadeOut(500,
                function(){
					if(content.bounceOrigin==""){
						content.setActivePage(content.nextPageId);
					}else{
						content.setActivePage(content.bounceOrigin);
						content.bounceOrigin="";
					}                    
                }
            );
            break;
        case "prev":
			$("#divstep"+steps[this.activeStep].id).fadeOut(500,
                function(){
                    if(content.bounceOrigin==""){
						content.setActivePage(content.previousPageId);
					}else{
						content.setActivePage(content.bounceOrigin);
						content.bounceOrigin="";
					}					
                }
            );
            break;
		case "fix":
			break;
		default:
            $("#divstep"+steps[this.activeStep].id).fadeOut({
				duration: 500,
				complete: function(){
					content.setActivePage(url);
				},
				queue:false
			});
    }
};

content.cycleForth=function(){
	this.cycleForward();
};	

content.cycleForward=function(){
	var getNextStep=function(){
		var steps=content.activePage.steps;
		for(var i=content.activeStep+1;i<steps.length;i++){
			if(typeof steps[i].display!="undefined"){
				if(steps[i].display=="visible"){
					return i;
				}
			}else{
				return i;
			}
		};
		return 0;
	};
	var nextStepNum=getNextStep();
	if(nextStepNum!=0){
		this.activeStep=nextStepNum;
        this.showStep("", false);
    }
}.bind(content);

content.cycleBack=function(){
	var getPreviousStep=function(){
		var steps=content.activePage.steps;
		for(var i=content.activeStep-1;i>=0;i--){
			if(typeof steps[i].display!="undefined"){
				if(steps[i].display=="visible"){
					return i;
				}
			}else{
				return i;
			}
		};
		return -1;
	};
	var prevStepNum=getPreviousStep();
	if(prevStepNum>-1){
		this.activeStep=prevStepNum;
        this.showStep("", true);
    }

};

content.notifyNavNext=function(){
	$("#aNavNext").pulse(
		{
			opacity : 0.2
		},{
			duration : 3000, 
			pulses : -1
		}
	);
};

content.updateNav=function(){
	
	var steps=this.activePage.steps;
	if(typeof steps[this.activeStep].display!="undefined"){
		if(steps[this.activeStep].display=="hidden"){
			return;
		}
	};

	var visibleSteps=0,
		lastVisibleStep=0
		hasInteraction=false;
    for(var i=0;i<steps.length;i++){
		
		if(!$.isEmptyObject(steps[i].interaction)){
			hasInteraction=true;
		};
		
		if(typeof steps[i].display!="undefined"){
			if(steps[i].display=="visible"){
				visibleSteps++;
				lastVisibleStep=i;
			}
		}else{
			visibleSteps++;
			lastVisibleStep=i;
		};
		
		$("#tabstep"+steps[i].id)
			.unbind("click")
			.bind("click", function(){
				content.setStep($(this).data("stepix"), true);
			});	
   
        switch(true){
            case(i==this.activeStep):
                $("#tabstep"+steps[i].id)
					.addClass("currentstep")
					.attr("title", eval("mpCurrent"+wbt.metadata.language)+(parseInt($("#tabstep"+steps[i].id).data("stepnum"))+1));
                break;

            case(i<this.activeStep):
				$("#tabstep"+steps[i].id)
					.removeClass("currentstep")
					.attr("title", eval("mpJumpBack"+wbt.metadata.language)+(parseInt($("#tabstep"+steps[i].id).data("stepnum"))+1));
                break;

            case(i>this.activeStep):
				$("#tabstep"+steps[i].id)
					.removeClass("currentstep")
					.attr("title", eval("mpJumpFwd"+wbt.metadata.language)+(parseInt($("#tabstep"+steps[i].id).data("stepnum"))+1));
                break;
        }
    }
    
    content.innerNavActive_back=true;
    content.innerNavActive_fwd=true;
    
    if(this.activeStep==0){
        content.innerNavActive_back=false;
    };
	
	if(visibleSteps<2){
		content.innerNavActive_back=false;
		content.innerNavActive_fwd=false;
		$("#stepnav").hide();
		if(!hasInteraction){
			content.setStatus("browsed");
		};
	};

    if(this.activeStep==(steps.length-1) || this.activeStep>=lastVisibleStep){
        content.innerNavActive_fwd=false;
		if(!hasInteraction){
			content.setStatus("browsed");
		};
    };
}

content.getPageById=function(pageId){
	for(var i in wbt.structure){
		for (var j in wbt.structure[i].items) {
			if(typeof wbt.structure[i].items[j] == "object"){
				if(wbt.structure[i].items[j].id == pageId){
					content.activePage = wbt.structure[i].items[j];
					
					for(var k=0;k<db.length;k++){
						if(db[k].id==pageId){
							content.pageNum=k;

							if(content.pageNum>1){
								content.previousPageId=db[k-1].id;
							}else{
								content.previousPageId=0;
							}
							
							if(content.pageNum<(db.length-1)){
								content.nextPageId=db[k+1].id;
							}else{
								content.nextPageId=0;
							}
							return;
						}
					}
				}
			}
		}
	}
};

content.getPageNumberById=function(pageId){
	for(var i in wbt.structure){
		for (var j in wbt.structure[i].items) {
			if(typeof wbt.structure[i].items[j] == "object"){
				if(wbt.structure[i].items[j].id == pageId){
					for(var k=0;k<db.length;k++){
						if(db[k].id==pageId){
							return k;
						}
					}
				}
			}
		}
	}
	return 0;
}

content.moderate=function(trigger){
    var moderations=this.activePage.steps[this.activeStep].moderations;
	if(typeof moderations=="undefined"){
		modPanel.setContent("");
		return;
	};
    
	if(moderations.length==0 || trigger==0){
		$("#audioPlayerControls").hide();
		$("#dynaModControl").hide();
		modPanel.setContent("");
		doMenuItem("toc","no-mod");
		return;
	}else{
		$("#audioPlayerControls").show("fast", function(){
			var gotcha=false,
				play=true;
			$.each(moderations, function(i, moderation) {
				if(moderation.trigger==trigger){				
					gotcha=true;
					if(typeof moderation.playOnce!="undefined" && typeof moderation.played!="undefined"){
						if(moderation.playOnce){
							if(moderation.played){
								play=false;
							}							
						}
					};		
					
					if(play){
						window.setTimeout(function(){
							var media={};
							if(moderation.id.indexOf("automod_")!=-1){
								media={
									mp3: custom+"shared/sounds/"+moderation.friendlyId+".mp3"
								};
							}else{
								media={
									mp3: wbt.metadata.relpath+"sounds/"+moderation.friendlyId+".mp3"
								};
							};
							
							$("#jplayer_audio")
								.jPlayer("setMedia", media)
								.jPlayer(scorm.getPreference("audioEnabled") ? "play" : null);
							content.activeModeration=moderation.id;
							modPanel.setContent(decodeBase64(moderation.html));
							moderation.played=true;
						},500);
					}
				};
			});
			if(gotcha && play){
				$("#dynaModControl").show();
			}else{
				$("#audioPlayerControls").hide();
				$("#dynaModControl").hide();
			}
		});
	}
}

content.stopModeration=function(){
	$("#jplayer_audio").jPlayer("pause");
}
content.moderationStop=function(){
	$("#jplayer_audio").jPlayer("pause");
}

content.writeVideoPage=function(target){
	$("<div/>", {
		html: content.videoPageTemplate()
	}).appendTo("#divstep"+target);
}

content.doVideoFromTemplate=function(){
	createDynaVideo(
		"file:"+content.activePage.steps[content.activeStep].video.split(".")[0],
		"supplied:m4v",
		"solution:html",
		"width:"+content.activePage.steps[content.activeStep].width,
		"height:"+content.activePage.steps[content.activeStep].height,
		"cssClass:270p"
	);
}

content.writeVideoOverlay=function(a){
	var args=content.writeVideoOverlay.arguments;
	if(a.constructor==Array)args=a;
	
		var file,
    supplied = "m4v",
    solution = "html",
    width = 480,
    height = 320,
    cssClass = "270p",
    caption = "",
    poster = custom + "shared/images/videopreview.jpg";
	for(var i=0;i<args.length;i++){
		var arg=args[i].split(":");
		switch(arg[0]){
			case "type":
				break;
			case "relfile":
				file=arg[1];
				file=getAbsolutePath(file); //absolute paths only -> required for flash fallback
				break;
			case "file":   
				file=wbt.metadata.relpath+"images/"+arg[1]; //in images folder; no extension!
				file=getAbsolutePath(file); //absolute paths only -> required for flash fallback
				break;
			case "supplied": 
				supplied="m4v"
				break;
			case "solution":   
				solution="html"
				break;
			case "width":     
				width=parseInt(arg[1]); //numeric
				break;
			case "height":    
				height=parseInt(arg[1]); //numeric
				break;
			case "cssClass":    
				cssClass=arg[1]; //270p || 360p || 720p 
				break;
			case "caption":    
				caption=arg[1]; 
				break;
			case "poster":    
				poster=arg[1];
				poster=poster.replace(/{RELPATH}/g, wbt.metadata.relpath);
				break;
		}
	};
	
	if(typeof customVideoPlayerSettings=="object"){
		solution=customVideoPlayerSettings.solution;
		supplied=customVideoPlayerSettings.supplied;
	}
	
	$.elpsOverlay("show", {
		content : "<p>"+caption+"</p><div id='videoOverlay'></div>",
		position: "top",
		width: width + 100 + "px",
		icon: "atom",
		closeKey: true,
		useOverlay: true,
		bound: $("#divcontainer"),
		afterShow: function(){
			content.stopModeration();
			$("<div/>", {
				id: "videoPlayerControls",
				html: content.videoPlayerControlsTemplate
			}).appendTo("#videoOverlay");
			
			$("#jplayer_video").jPlayer({
				ready: function () {
					switch(supplied){
						case "flv":
							$(this).jPlayer("setMedia", {
								flv: file+".flv",
								poster: poster
							}).jPlayer("play");
							break;
						case "m4v":
							$(this).jPlayer("setMedia", {
								m4v: file+".mp4",
								poster: poster
							}).jPlayer("play");
							break;
						case "ogv":
							$(this).jPlayer("setMedia", {
								ogv: file+".ogv",
								poster: poster
							}).jPlayer("play");
							break;
						case "m4v,ogv":
						case "ogv,m4v":
							$(this).jPlayer("setMedia", {
								m4v: file+".mp4",
								ogv: file+".ogv",
								poster: poster
							}).jPlayer("play");
							break;
						case "m4v,flv":
						case "flv,m4v":
							$(this).jPlayer("setMedia", {
								m4v: file+".mp4",
								flv: file+".flv",
								poster: poster
							}).jPlayer("play");
							break;
						case "m4v,flv,ogv":
						case "m4v,ogv,flv":
						case "flv,m4v,ogv":
						case "flv,ogv,m4v":
						case "ogv,flv,m4v":
						case "ogv,m4v,flv":
							$(this).jPlayer("setMedia", {
								m4v: file+".mp4",
								flv: file+".flv",
								ogv: file+".ogv",
								poster: poster
							}).jPlayer("play");
							break;
					}
				},
				
				solution: solution, 
				supplied: supplied, 
				cssSelectorAncestor: "#jp_container_video",
				size: {
					cssClass: "jp-video-"+cssClass,
					width: width + "px",
					height: height + "px"
				}
			});
		},
		afterHide: function(){},
		buttons: {
			close : {
				text: "OK",
				onclick: $("#jplayer_video").jPlayer("destroy")
			}
		}
	});
}

//compat
var doVg = function(e){
	content.moderate(e)
}

var doModerate = function(e){
	e=e.split(":")[1];
	content.moderate(e);
}

var vgStop = function(){
	content.stopModeration()
}

content.audioPlayerControlsTemplate=function(){
    
	var mute, unmute, maxVolume;
	switch(wbt.metadata.language){
		case "_de":
			mute="Stumm";
			unmute="Stummschaltung aufheben";
			maxVolume="Maximale Lautstärke";
			break;
		case "_en":
			mute="Mute";
			unmute="Unmute";
			maxVolume="Maximum volume";
			break;
	}
	
	return "<div id='jplayer_audio' class='jp-jplayer' ></div>" +
        "<div id='jp_container_audio' class='jp-audio'>" +
            "<div class='jp-type-single'>" +
                "<div class='jp-gui jp-interface'>" +
                    "<ul class='jp-controls'>" +
                        "<li><a href='javascript:void(0);' class='jp-play' style='display:block;' tabindex='1'>play</a></li>" +
                        "<li><a href='javascript:void(0);' class='jp-pause' style='display:block;' tabindex='1'>pause</a></li>" +
                        "<li><a href='javascript:void(0);' class='jp-stop' style='display:block;' tabindex='1'>stop</a></li>" +
                        "<li><a href='javascript:void(0);' class='jp-mute' style='display:block;' tabindex='1' title='"+ mute + "'>mute</a></li>" +
                        "<li><a href='javascript:void(0);' class='jp-unmute' style='display:block;' tabindex='1' title='"+ unmute + "''>unmute</a></li>" +
                        "<li><a href='javascript:void(0);' class='jp-volume-max' style='display:block;' tabindex='1' title='"+ maxVolume + "''>max volume</a></li>" +
                    "</ul>" +
                    "<div class='jp-progress'>" +
                        "<div class='jp-seek-bar'>" +
                            "<div class='jp-play-bar'></div>" +
                        "</div>" +
                    "</div>" +
                    "<div class='jp-volume-bar'>" +
                        "<div class='jp-volume-bar-value'></div>" +
                    "</div>" +
                    "<div class='jp-time-holder'>" +
                        "<div class='jp-current-time'></div>" +
                        "<div class='jp-duration'></div>" +
                        "<ul class='jp-toggles'>" +
                            "<li><a href='javascript:;' class='jp-repeat' tabindex='1' title='repeat'>repeat</a></li>" +
                            "<li><a href='javascript:;' class='jp-repeat-off' tabindex='1' title='repeat off'>repeat off</a></li>" +
                        "</ul>" +
                    "</div>" +
                "</div>" +
                "<div class='jp-title'></div>" +
                "<div class='jp-no-solution'></div>" +
            "</div>" +
        "</div>"
}

content.videoPlayerControlsTemplate=function(){
	
	var mute, unmute, maxVolume;
	switch(wbt.metadata.language){
		case "_de":
			mute="Stumm";
			unmute="Stummschaltung aufheben";
			maxVolume="Maximale Lautstärke";
			break;
		case "_en":
			mute="Mute";
			unmute="Unmute";
			maxVolume="Maximum volume";
			break;
	}
	
    return "<div id='jplayer_video' class='jp-jplayer' ></div>" +
        "<div id='jp_container_video' class='jp-video'>" +
            "<div class='jp-type-single'>" +
                "<div class='jp-gui jp-interface'>" +
                    "<ul class='jp-controls'>" +
                        "<li><a href='javascript:void(0);' class='jp-play' style='display:block;' tabindex='1'>play</a></li>" +
                        "<li><a href='javascript:void(0);' class='jp-pause' style='display:block;' tabindex='1'>pause</a></li>" +
                        "<li><a href='javascript:void(0);' class='jp-stop' style='display:block;' tabindex='1'>stop</a></li>" +
                        "<li><a href='javascript:void(0);' class='jp-mute' style='display:block;' tabindex='1' title='" + mute + "'>mute</a></li>" +
                        "<li><a href='javascript:void(0);' class='jp-unmute' style='display:block;' tabindex='1' title='" + unmute + "'>unmute</a></li>" +
                        "<li><a href='javascript:void(0);' class='jp-volume-max' style='display:block;' tabindex='1' title='" + maxVolume + "'>max volume</a></li>" +
                    "</ul>" +
                    "<div class='jp-progress'>" +
                        "<div class='jp-seek-bar'>" +
                            "<div class='jp-play-bar'></div>" +
                        "</div>" +
                    "</div>" +
                    "<div class='jp-volume-bar'>" +
                        "<div class='jp-volume-bar-value'></div>" +
                    "</div>" +
                    "<div class='jp-time-holder'>" +
                        "<div class='jp-current-time'></div>" +
                        "<div class='jp-duration'></div>" +
                        "<ul class='jp-toggles'>" +
                            "<li><a href='javascript:;' class='jp-repeat' tabindex='1' title='repeat'>repeat</a></li>" +
                            "<li><a href='javascript:;' class='jp-repeat-off' tabindex='1' title='repeat off'>repeat off</a></li>" +
                        "</ul>" +
                    "</div>" +
                "</div>" +
                "<div class='jp-title'></div>" +
                "<div class='jp-no-solution'></div>" +
            "</div>" +
        "</div>"
}

content.videoPageTemplate=function(){
	return "<table cellpadding='10' cellspaing='10' border='0'>" +
		"<tr><td align='center' valign='middle'>" +
			"<a href='javascript:void(0);' onclick='content.doVideoFromTemplate();'><img src='" + custom + "images/videopreview.png' /></a>" +
		"</td></tr>" +
		"</table>";
}

var menuItems=[];
function buildMenus(){
	
	if(typeof wbt.metadata.resourceType!="undefined"){
		if(wbt.metadata.resourceType=="learningModule"){
			menuItems.push("Sidebar");
		}
	};
	
	menuItems.push("Toc");
	
	if(wbt.glossary.length>0){
		menuItems.push("Glossary");
	}
	
	if(wbt.files.length>0){
		menuItems.push("Files");
	}
	
	if(typeof customMenuItems=="function"){
		customMenuItems();
	}
	
	menuItems.push("Submenu");
	menuItems.push("Exit");
	
	$("<div/>", {
		id: "divmenubar"
	}).append(
		$("<ul/>",{
			id: "divmenubarUl"
		})
	).appendTo($("#divcontainer"));
	
	for(var i=0;i<menuItems.length;i++){
		$("<li/>", {
			id: "menuItemtab"+i
		}).append(
			$("<a/>", {
				id: "menuItem"+menuItems[i],
				href: "javascript:void(0);",
				html: "...",
				mouseenter: function(){
					$(this).parent().addClass("lihover");
				},
				mouseleave: function(){
					$(this).parent().removeClass("lihover");
				},
				click: function(){
					doMenuItem(this.id.split("menuItem")[1].toLowerCase(), "click");
				}
			})
		).appendTo($("#divmenubarUl"));
	}

	//submenu
	$("<div/>", {
        id: "divtoolsmenu",
		html: "" +
			"<div class='boxl'>" +
			  "<div class='boxr' id='boxmain'></div>" +
			"</div>" +
			"<div class='boxbl'>" +
			  "<div class='boxbr'>" +
				"<div class='boxb'></div>" +
			  "</div>" +
			"</div>"
    }).appendTo($("body"));
	$("#divtoolsmenu").addClass("ulmenu").css("visibility","hidden");
	
	$("<ul/>", {
        id: "toolsmenu"
    }).appendTo($("#boxmain"));
	
		//Script
		if(wbt.metadata.scriptUrl!=""){
			$("<li/>").append(
				$("<a/>",{
					id: "menuItemScript",
					href: "javascript:void(0)",
					click: function(){
						doMenuItem("script");
					}
				})
			).appendTo($("#toolsmenu"));
		}
		
		//Bookmarks
		var li=$("<li/>").append(
			$("<a/>", {
				id: "menuItemBookmarks",
				href: "javascript:void(0)"
			}),
			$("<ul/>", {
				id: "menuItemBookmarksUl"
			}).append(
				$("<li/>").append(
					$("<a/>", {
						id: "menuItemBookmarksSet",
						href: "javascript:void(0);",
						html: "...",
						click: function(){
							doMenuItem("setbookmark");
						}
					})
				),
				$("<li/>").append(
					$("<a/>", {
						id: "menuItemBookmarksGet",
						href: "javascript:void(0)",
						html: "...",
						click: function(){
							doMenuItem("getbookmarks");
						}
					})
				)
			)
		).appendTo($("#toolsmenu"))
						
		//Session
		$("<li/>").append(
			$("<a/>", {
				id: "menuItemSession",
				href: "javascript:void(0)"
			}),
			$("<ul/>", {
				id: "menuItemSessionUl"
			}).append(
				$("<li/>").append(
					$("<a/>", {
						id: "menuItemSessionInformation",
						href: "javascript:void(0)",
						html: "...",
						click: function(){
							doMenuItem("isession");
						}
					})
				),
				$("<li/>").append(
					$("<a/>", {
						id: "menuItemSessionReset",
						href: "javascript:void(0)",
						html: "...",
						click: function(){
							doMenuItem("reset");
						}
					})
				),
				$("<li/>").append(
					$("<a/>", {
						id: "menuItemSessionExit",
						href: "javascript:void(0)",
						html: "...",
						click: function(){
							doMenuItem("exit");
						}
					})
				)
			)
		).appendTo($("#toolsmenu"))
			
		//WBT
		$("<li/>").append(
			$("<a/>", {
				id: "menuItemWbt",
				href: "javascript:void(0)"
			}),
			$("<ul/>", {
				id: "menuItemWbtUl"
			}).append(
				$("<li/>").append(
					$("<a/>", {
						id: "menuItemWbtInformation",
						href: "javascript:void(0)",
						html: "...",
						click: function(){
							doMenuItem("iwbt");
						}
					})
				),
				$("<li/>").append(
					$("<a/>", {
						id: "menuItemWbtImprint",
						href: "javascript:void(0)",
						html: "...",
						click: function(){
							doMenuItem("impressum");
						}
					})
				),
				$("<li/>").append(
					$("<a/>", {
						id: "menuItemWbtPhotoCredits",
						href: "javascript:void(0)",
						html: "...",
						click: function(){
							doMenuItem("photocredits");
						}
					})
				)
			)
		).appendTo($("#toolsmenu"))
	
		//Help
		$("<li/>").append(
			$("<a/>",{
				id: "menuItemHelp",
				href: "javascript:void(0)",
				click: function(){
					doMenuItem("help");
				}
			})
		).appendTo($("#toolsmenu"));
		
		
	$.ajax({
		url:"files/photocredits.pdf",
		type:"HEAD",
		error:
			function(){
				$("#menuItemWbtPhotoCredits").hide();
			},
		success:
			function(){
				$("#menuItemWbtPhotoCredits").show();
			}
	});
	
	$.ajax({
		url:"files/help-desktop.pdf",
		type:"HEAD",
		error:
			function(){
				if(typeof defaultSettings.helpURL == "undefined"){
					$("#menuItemHelp").remove();
				}else{
					$.ajax({
						url:defaultSettings.helpURL.desktop,
						type:"HEAD",
						error:
							function(){
								$("#menuItemHelp").remove();
							},
						success:
							function(){void(0);}
					});
				};
			},
		success:
			function(){
				if(typeof defaultSettings.helpURL == "undefined"){
					defaultSettings.helpURL = {
						desktop: "files/help-desktop.pdf"
					}
				}else{
					defaultSettings.helpURL.desktop = "files/help-desktop.pdf";
				}
			}
	});

	var menuids=["toolsmenu|divtoolsmenu|menuItemSubmenu"];
	for (var i = 0; i<menuids.length; i++) {
		var ultags = document.getElementById(menuids[i].split("|")[0]).getElementsByTagName("ul");
		for (var t = 0; t<ultags.length; t++) {
			ultags[t].parentNode.getElementsByTagName("a")[0].className = "subfolderstyle";
			if (ultags[t].parentNode.parentNode.id == menuids[i].split("|")[0]) {
				ultags[t].style.left = (ultags[t].parentNode.offsetWidth)+"px";
			} else {
				ultags[t].style.left = ultags[t-1].getElementsByTagName("a")[0].offsetWidth+"px";
			}
			ultags[t].parentNode.onmouseover = function() {
				this.getElementsByTagName("ul")[0].style.display = "block";
			};
			ultags[t].parentNode.onmouseout = function() {
				this.getElementsByTagName("ul")[0].style.display = "none";
			};
			ultags[t].parentNode.onclick = function() {
				this.getElementsByTagName("ul")[0].style.display = "none";
			};
		}
	
		for (var t = ultags.length-1; t>-1; t--) {
			ultags[t].style.visibility = "visible";
			ultags[t].style.display = "none";
		}
	}
 
	$("#toolsoverlay").css("left",$("#divtoolsmenu").offset().left+"px");
	
	if($("#menuItemSidebar").length>0){
		
		$("#divmenubarUl").css({
			"min-width": "500px"
		});
		
		$("#menuItemSidebar")
			.html("")
			.unbind("click");
		
		$("<img/>", {
			src: custom+"desktop/images/sidebar_contract.png",
			css: {
				display: "none"
			}
		}).appendTo($("#menuItemSidebar"));
					
		$("<img/>", {
			id: "icon_sidebar_expand",
			src: custom+"desktop/images/sidebar_expand.png",
			css: {
				display: "inline",
				position: "relative",
				top: "2px",
				cursor: "pointer"
			},

			click: function(){
				if($("#draggersContainer").length==0){
					$("#mainGrid").trigger("toggle");
				}else{
					if(typeof interactions[interactions.activeInteractionType].getMenuInactiveMessage=="function"){
						$.elpsOverlay("show", {
							content: "<div>" + interactions[interactions.activeInteractionType].getMenuInactiveMessage() + "</div>",
							icon: "information",
							bound: $("#divcontainer"),
							autoclose: 6000
						});
					};
				}
			}
		}).appendTo($("#menuItemSidebar"));
		
		$("#menuItemSidebar img").elpsTooltip({
			theme: ".elpsTooltip-shadow",
			animation: "fade",
			content: (wbt.metadata.language=="_de" ? "Seitenleiste ein-/ausblenden" : "Show/hide sidebar"),
			delay: 200,
			fixedWidth: 0,
			maxWidth: 400,
			onlyOne: true,
			position: "top",
			speed: 350,
			trigger: "hover",
			functionBefore: function(origin, continueTooltip) {
				origin.bind("mouseout", function(){
					origin.elpsTooltip("hide");
				});
				continueTooltip();
			}
		});
	};
}

function hideSubMenu(id){
	if(document.getElementById(id))document.getElementById(id).style.visibility="hidden";
}


function buildFooter(){
	
	$("<div/>", {
        id: "divfooter"
    }).appendTo($("#divcontainer"));

	$("<span/>", {
        id: "divnavigation"
    }).appendTo($("#divfooter"));

	$("<img/>", {
        id: "aNavPrev",
		"class": "navbtn",
		src: custom+"desktop/images/navprev.png",
		mouseenter: function(){
			$(this).prop("src",custom+"desktop/images/navprev_hover.png");
		},
		mouseleave: function(){
			$(this).prop("src",custom+"desktop/images/navprev.png");
		}
    }).appendTo($("#divnavigation"));
	
	$("<img/>", {
        id: "aNavNext",
		"class": "navbtn",
		src: custom+"desktop/images/navnext.png",
		mouseenter: function(){
			$(this).pulse("destroy");
			$(this).prop("src",custom+"desktop/images/navnext_hover.png");
		},
		mouseleave: function(){
			$(this).prop("src",custom+"desktop/images/navnext.png");
		}
    }).appendTo($("#divnavigation"));
	
	var newNavPrevImgHover=new Image();newNavPrevImgHover.src=custom+"desktop/images/navprev_hover.png";
	var newNavNextImgHover=new Image();newNavNextImgHover.src=custom+"desktop/images/navnext_hover.png";
			
}

function doMenuItem(item,args){

	var needsSidebar=false;
		
	if(typeof args=="undefined"){
		args="";			
	}

	if(item!="submenu")hideSubMenu("divtoolsmenu");	

	if($("#draggersContainer").length>0){
		if(args=="click"){ //glossray, toc, submenu, exit
			if(typeof interactions[interactions.activeInteractionType].getMenuInactiveMessage=="function"){
				$.elpsOverlay("show", {
					content: "<div>" + interactions[interactions.activeInteractionType].getMenuInactiveMessage() + "</div>",
					icon: "information",
					bound: $("#divcontainer"),
					autoclose: 6000
				});		
				return;
			}else{
				return;
			}
		}
		if(args=="no-mod"){
			$("#dynaWrapper").hide();
			return;
		}
	};
	
	switch(item){
		case "glossary":
			buildDynaDiv();
			writeGlossary();
			scorm.setPreference("dyna",item);
			needsSidebar=true;
			break;
		case "files":
			buildDynaDiv();
			if(args==""){
				writeFiles();
			}else{
				writeFiles(args);
			}
			scorm.setPreference("dyna",item);
			needsSidebar=true;
			break;
		case "toc":
			buildDynaDiv();
			writeTree();
			scorm.setPreference("dyna",item);
			needsSidebar=true;
			break;
		case "submenu":
			var elm=document.getElementById("divtoolsmenu");
			switch($("#divtoolsmenu").css("visibility")){
				case "hidden":
					$("#divtoolsmenu").css("visibility","visible");
					break;
				case "visible":
					$("#divtoolsmenu").css("visibility","hidden");
					break;
			}
			
			$("#divtoolsmenu").css("left",$("#menuItemSubmenu").parent().offset().left-15+"px");
			$("#toolsoverlay").css("left",$("#menuItemSubmenu").parent().offset().left-15+"px");
			$("#divtoolsmenu").css("top",$("#menuItemSubmenu").parent().offset().top+28+"px");
			$("#toolsoverlay").css("top",$("#menuItemSubmenu").parent().offset().top-28+"px");
			
			showHideFlashContent();
			break;
		case "iwbt":
			writeIwbt();
			showHideFlashContent();
			break;
		case "impressum":
			showHideFlashContent();
			writeImpressum();
			break;
		case "photocredits":
			showHideFlashContent();
			window.open("files/photocredits.pdf",target="_blank");
			break;
		case "isession":
			showHideFlashContent();
			writeIsession();
			break;
		case "setbookmark":
			showHideFlashContent();
			setBookmark(content.activePage.id, 1);
			$.elpsOverlay("show", {
				content : "<p>" + eval("bmBookmarked"+wbt.metadata.language) + "</p>",
				position: "top",
				autoclose: 2000,
				icon: "working",
				closeKey: true,
				useOverlay: false,
				bound: $("#divcontainer"),
				afterHide: function(){
					if(scorm.getPreference("dyna")=="toc")doMenuItem("toc", "no-open");
				}
			});
			break;
		case "getbookmarks":
			showHideFlashContent();
			processBookmarks();
			break;
		case "notes":
			showHideFlashContent();
			if(args==""){
				processNotes();
			}else{
				processNotes(args);
			}
			break;
		case "script":
			hideSubMenu("divtoolsmenu");
			setTimeout("doMenuItem(scorm.getPreference('dyna'))",500);
			window.open(wbt.metadata.relpath+wbt.metadata.scriptUrl,target="_blank");
			break;		
		case "help":
			hideSubMenu("divtoolsmenu");
			showHideFlashContent();
			setTimeout("doMenuItem(scorm.getPreference('dyna'))",500);
			window.open(defaultSettings.helpURL.desktop,target="_blank");
			break;
		case "reset":
			showHideFlashContent();
			var doReset = function(){
				location.href="index.htm?" + Math.round(Math.random() * 100);
			}
			$.elpsOverlay("show", {
				buttons: {
					yes: {
						text: (wbt.metadata.language=="_de"?"Ja":"Yes"),
						onclick: doReset
					},
					no: {
						text: (wbt.metadata.language=="_de"?"Nein":"No")
					}
				},
				bound: $("#divcontainer"),
				icon: "help",
				content: "<p>"+eval("resetMsg"+wbt.metadata.language)+"</p>"
			});
			break;
		case "exit":
			showHideFlashContent();
			var html=scorm.getExitConfirmation();
			if(html!=""){				
				$.elpsOverlay("show", {
					buttons: {
						yes: {
							text: (wbt.metadata.language=="_de"?"OK":"OK"),
							onclick: function(){
								scorm.exitSession();
								$.elpsOverlay("hide");
							}
						},
						no: {
							text: (wbt.metadata.language=="_de"?"Abbrechen":"Cancel")
						}
					},
					bound: $("#divcontainer"),
					icon: "help",
					content: "<p>" + html + "</p>"
				});
				
			}else{
				scorm.exitSession();
			}
			break;
		default:
			if(typeof customDoMenuItem=="function")customDoMenuItem(item);
	}

	if(item=="sidebar" || item=="toc" || item=="glossary" || item=="files"){
		$("#divmenubar a").each(function() {
			$(this).removeClass("current");
			if($(this).prop("id").toLowerCase()=="menuitem"+item){
				$(this).addClass("current");	
			}
		});
		$("#toolsoverlay").css("display","none");
	};
	
	if(needsSidebar && wbt.metadata.resourceType=="learningModule"){
		if((args!="no-open" && args!="no-mod") || scorm.resumePageId!=""){
			$("#mainGrid").trigger("open");
			scorm.resumePageId="";
		};
	};
	
}

function showHideFlashContent(){
	switch($("#divtoolsmenu").css("visibility")){
		case "visible":
			$("#toolsoverlay").css("display","block");
			if($("#divcontent").html().indexOf("application/x-shockwave-flash")!=-1){
				$("#divcontent").css("visibility","hidden");
			}
			break;
		case "hidden":
			$("#toolsoverlay").css("display","none");
			if($("#divcontent").html().indexOf("application/x-shockwave-flash")!=-1){
				$("#divcontent").css("visibility","visible");
			}
		break;
	}
}

function buildPageTitles(type){
	if($("#divprojecttitle").length==0){
		$("<div/>", {
			id: "divprojecttitle",
			html: decodeBase64(wbt.metadata.projectTitle)
		}).appendTo($("#divheader"));
	}
	
	if($("#divnavpathtitle").length==0){
		$("<div/>", {
			id: "divnavpathtitle",
			html: decodeBase64(wbt.metadata.title)
		}).appendTo($("#divheader"));
	}	
	
	document.title=decodeBase64(wbt.metadata.title);
	
	$("<div/>", {
		id: "divpagetitle",
		"class": "pagetitle-oneline"
	}).prependTo($("#divcontent"));
}

function buildLogo(){
	$("<div/>", {
        id: "divlogo"
    }).append(
		$("<img/>", {
			id: "imgLogo",
			src: custom+"shared/images/logo.png"
		})		
	).appendTo($("#divheader"));
	
	$("#imgLogo").error(function () {
		$(this).unbind("error").attr("src",custom+"shared/images/logo.png");
	});	
}

function buildDynaDiv(){
	
	if($("#dynaContainer").length>0){
		$("#dynaContainer").html("");
		return;
	};
	
	$("<div/>", {
        id: "dynaContainer"
    }).appendTo($("#westPane"));	
}

/* Localize */
/* -------- */
function initText(){
	totalText=1;
	dbText = new Array();
	fillText(wbt.metadata.language);
}

function dbTextAdd( id, html, hook ) {
	dbText[totalText] = new Object;
	dbText[totalText].id = id;
	dbText[totalText].html = html;
	dbText[totalText].hook = hook;
	totalText++;
}

function getJsText(languageCode,textCode) {
	var langstring="(...)"
	if(typeof dbText=="undefined")initText(languageCode);
	for(i=1;i<totalText;i++){
		if(dbText[i].id==textCode){
			langstring=dbText[i].html;
			break;
		}
	}
  	return langstring;
}

/* Interactions */
/* ------------ */
interactions.activeInteraction=new Object();
interactions.activeInteractionType="";
interactions.containerId="";
interactions.isBlockTestItem=false;
interactions.init=function(step){
	this.activeInteraction=step.interaction[0];
	this.activeInteractionType=this.activeInteraction.type.replace("-", "");
	this.containerId="#divstep"+content.activePage.steps[content.activeStep].id;
	
	switch(this.lessonMode){
		case "profiling":
		case "distributedAssessment":
		case "distributedSelfTest":
			if(!interactions.getGo()){
				return;
			}
			break;
		default:
			break;
	};
	
	if(typeof interactions.blockTest != "undefined"){
		if(content.activeBlock==interactions.blockNum){
			interactions.isBlockTestItem=true;
		}else{
			interactions.isBlockTestItem=false;
		}
	}
	
	if(interactions.isBlockTestItem){
		if(interactions.getGo()){
			interactions.initProgress();
		}else{
			return;
		};
	};
	
	if($(this.containerId+" .question").length==0){
		if(typeof interactions[this.activeInteractionType] == "undefined"){
			var scriptFile=common+"shared/elps.interactions."+this.activeInteractionType+".js";
			$.getScript(scriptFile)
				.done(function(data, state){
					interactions.assemble();
				})
				.fail(function(){
					yepnope([{
						load: scriptFile,
						complete: function(){
							interactions.assemble();
						}    
					}]);
				});
		}else{
			interactions.assemble();
		}
	}	
};

interactions.cleanUp=function(){
	try{
		if(typeof interactions[interactions.activeInteractionType]=="undefined")return;
		if(isEmpty(interactions.activeInteractionType))return;
		if(typeof interactions[interactions.activeInteractionType].cleanUp == "function"){
			interactions[interactions.activeInteractionType].cleanUp();
		}
	}catch(e){}
};

interactions.assemble=function(){
	//assemble question
	var html=interactions[interactions.activeInteractionType].assemble();
	html=html.replace(/{STEPID}/g,interactions.activeInteraction.id);
	
	$("<div/>", {
		html: html
    }).appendTo(interactions.containerId);
	
	//bindings
	$(interactions.containerId+" input[name='interactionRadioSolution"+interactions.activeInteraction.id+"']").bind("change", function(e,ui){
		interactions.showSolution($(interactions.containerId+" input[name='interactionRadioSolution"+interactions.activeInteraction.id+"']:checked").val());
	});
	
	$(interactions.containerId+" .interactionBtnHelp").elpsTooltip({
		theme: ".elpsTooltip-shadow",
		animation: "fade",
		content: interactions[interactions.activeInteractionType].getHelp(),
		delay: 200,
		fixedWidth: 0,
		maxWidth: 400,
		onlyOne: true,
		position: "top",
		speed: 350,
		trigger: "click",
		functionBefore: function(origin, continueTooltip) {
			origin.bind("mouseout", function(){
				origin.elpsTooltip("hide");
			});
			continueTooltip();
		}
	});
	
	$(interactions.containerId+" .interactionBtnEvaluationHelp").elpsTooltip({
		theme: ".elpsTooltip-shadow",
		animation: "fade",
		content: interactions.getEvaluationHelp(),
		delay: 200,
		fixedWidth: 0,
		maxWidth: 400,
		onlyOne: true,
		position: "top",
		speed: 350,
		trigger: "click",
		functionBefore: function(origin, continueTooltip) {
			origin.bind("mouseout", function(){
				origin.elpsTooltip("hide");
			});
			continueTooltip();
		}
	});
	
	$(interactions.containerId+" .interactionBtnAssistance")
		.elpsTooltip({
			theme: ".elpsTooltip-shadow",
			animation: "fade",
			content: interactions.getAssistanceInfo(),
			delay: 200,
			fixedWidth: 0,
			maxWidth: 400,
			onlyOne: true,
			position: "right",
			speed: 350,
			trigger: "click",
			functionBefore: function(origin, continueTooltip) {
				origin.bind("mouseout", function(){
					interactions.hideAssistance();
					origin.elpsTooltip("hide");
				});
				interactions.showAssistance();
				continueTooltip();
			}
		})
		.hide();
	
	if(interactions.activeInteraction.hint.length<500){
		$(interactions.containerId+" .interactionBtnHint").elpsTooltip({
			theme: ".elpsTooltip-shadow",
			animation: "fade",
			content: decodeBase64(interactions.activeInteraction.hint),
			delay: 200,
			fixedWidth: 0,
			maxWidth: 400,
			onlyOne: true,
			position: "top",
			speed: 350,
			trigger: "click",
			functionBefore: function(origin, continueTooltip) {
				origin.bind("mouseout", function(){
					origin.elpsTooltip("hide");
				});
				continueTooltip();
			}
		});
	}else{
		$(interactions.containerId+" .interactionBtnHint")
			.bind("click", function(){
				var html="<div>" + decodeBase64(interactions.activeInteraction.hint) + "</div>";
				$.elpsOverlay("show", {
					content: html,
					closeKey: true,
					icon: "information",
					bound: $("#divcontainer"),
					width: "600px"
				});
			});
	}
	
	$(interactions.containerId+" .interactionBtnEvaluate").elpsTooltip({
		theme: ".elpsTooltip-shadow",
		animation: "fade",
		content: (wbt.metadata.language=="_de" ? "Bitte erst die Aufgabe vollständig bearbeiten." : "Please complete the task first."),
		delay: 200,
		fixedWidth: 0,
		maxWidth: 400,
		onlyOne: true,
		position: "top",
		speed: 350,
		trigger: "click",
		functionBefore: function(origin, continueTooltip) {
			if(interactions[interactions.activeInteractionType].getGoForEvaluation()){
				origin.unbind("mouseout");
				interactions.evaluate();
			}else{
				origin.bind("mouseout", function(){
					origin.elpsTooltip("hide");
				});
				continueTooltip();
			}
		}
	});
	
	$(interactions.containerId+" .interactionBtnFeedback")
		.bind("click", function(){
			var html="<p>" + decodeBase64(interactions.activeInteraction.feedback) + "</p>";
			$.elpsOverlay("show", {
				content: html,
				closeKey: true,
				icon: "information",
				bound: $("#divcontainer"),
				width: html.length>500 ? "750px" : "450px"
			});
		});

	$(interactions.containerId+" .interactionBtnReset")
		.bind("click", function(){
			interactions.reset();
		})
		.hide();
	
	switch(true){
		case interactions.lessonMode=="profiling":
		case interactions.lessonMode=="distributedAssessment":
		case interactions.lessonMode=="distributedSelfTest":
			$(interactions.containerId+" .interactionBtnResults")
			.bind("click", function(){
				interactions.jumpToResultPage();
			})
			.hide();
			break;
		case interactions.isBlockTestItem:
			$(interactions.containerId+" .interactionBtnResults")
				.bind("click", function(){
					interactions.jumpToResultPage();
				})
				.hide();
			break;
		default:
	};
	
	$(".questionFooter").css({
		width: ($(".questionHeader").width()) + "px"
	});
	
	//update with session data
	interactions.applyQuestionStatus();
}

interactions.applyQuestionStatus=function(){
	var q=interactions.activeInteraction,
		info="",
		bgcolor="transparent",
		color="#666";
	
	//resetting...
	$(interactions.containerId+" .questionHeader").removeClass("passed failed");
	$(interactions.containerId+" .interactionBtnReset").hide();
	$(interactions.containerId+" .interactionBtnResults").hide();
	
	if(typeof q.hint!="undefined" && q.hint!=""){
		$(interactions.containerId+" .interactionBtnHint").show();
	}else{
		$(interactions.containerId+" .interactionBtnHint").hide();
	}
	
	if(typeof q.feedback!="undefined" && q.feedback!=""){
		$(interactions.containerId+" .interactionBtnFeedback").show();
	}else{
		$(interactions.containerId+" .interactionBtnFeedback").hide();
	}	

	switch(q.status){
		case "not attempted":
			$(interactions.containerId+" .interactionFooterInProcess").show();
			$(interactions.containerId+" .interactionFooterSolution").hide();
			break;
		case "incomplete":
			switch(wbt.metadata.language){
				case "_de":
					info="Das war leider noch nicht richtig. Bitte versuchen Sie es noch einmal.";
					break;
				case "_en":
					info="Unfortunately, your response was not right. Please try again.";
					break;
			};
			bgcolor="#EFC847";
			$(interactions.containerId+" .interactionFooterInProcess").show();
			$(interactions.containerId+" .interactionFooterSolution").hide();
			break;
		case "passed":
			switch(wbt.metadata.language){
				case "_de":
					info="Sie haben diese Aufgabe korrekt gelöst.";
					break;
				case "_en":
					info="You have solved this task correctly.";
					break;
			};

			bgcolor="#D6E877";
			$(interactions.containerId+" .interactionBtnReset").show();
			$(interactions.containerId+" .questionHeader").addClass(q.status);
			$(interactions.containerId+" .interactionFooterInProcess").hide();
			$(interactions.containerId+" .interactionFooterSolution").show();
			break;
		case "failed":
			switch(wbt.metadata.language){
				case "_de":
					info="Sie haben diese Aufgabe leider nicht korrekt gelöst.";
					break;
				case "_en":
					info="Unfortunately, you have not solved this task correctly.";
					break;
			};		
			
			bgcolor="#E84E34";
			color="#FFF";
			$(interactions.containerId+" .interactionBtnReset").show();
			$(interactions.containerId+" .questionHeader").addClass(q.status);
			$(interactions.containerId+" .interactionFooterInProcess").hide();
			$(interactions.containerId+" .interactionFooterSolution").show();
			break;
	};
	
	$(interactions.containerId+" .interactionInfoBox")
		.html(info)
		.animate(
			{
				backgroundColor:bgcolor,
				color: color
			},{
				duration: 1000,
				complete: function(){}
			}
		)
	
	//question type specific...
	interactions[interactions.activeInteractionType].applyQuestionStatus(q.status);
	
	$(interactions.containerId+" .questionFooter button").button();
	$(interactions.containerId+" .buttonset").buttonset();
	
	if(decodeBase64(q.question).indexOf("Fallbeschreibung")>-1){
		$(interactions.containerId+" .interactionBtnHint").find(".ui-button-text").html("Fallbeschreibung");
	}
	
	if(this.isBlockTestItem && this.reviewMode){
		$(".interactionBtnResults").show();
		$(".interactionBtnReset").hide();
		if(interactions[interactions.activeInteractionType].getEvaluationHelp()==""){
			$(interactions.containerId+" .interactionBtnEvaluationHelp").hide();
		}
	}
	
	if(this.lessonMode=="profiling" || this.lessonMode=="distributedAssessment" || this.lessonMode=="distributedSelfTest"){
		$(".interactionBtnReset").hide();
	}
	
}

interactions.evaluate=function(){

	var q=this.activeInteraction,
		result=interactions[interactions.activeInteractionType].evaluate();

	q.attempts++;
	
	switch(result){
		case "passed":
			q.status="passed";
			q.blocked=true;
			q.score=q.maxScore;
			this.setBookmark(q.status,q.reference);
			
			switch(true){
				case this.lessonMode=="profiling":
				case this.lessonMode=="distributedAssessment":
				case this.lessonMode=="distributedSelfTest":
				case this.isBlockTestItem:
					break;
				default:
					content.setStatus("passed");
					content.moderate("passed");
					this.applyQuestionStatus();
					this.showSolution("userSolution");
					break;
			};
			break;
		case "failed":
			if(q.attempts<q.maxAttempts){
				q.status="incomplete";
				info="";
				switch(wbt.metadata.language){
					case "_de":
						info="Das war leider noch nicht richtig. Bitte versuchen Sie es noch einmal.";
						break;
					case "_en":
						info="Unfortunately, your response was not right. Please try again.";
						break;
				};

				if($(interactions.containerId+" .interactionInfoBox").html()==info){
					$(interactions.containerId+" .interactionInfoBox").pulse(
						{
							opacity : 0.2
						},{
							duration : 1000, 
							pulses : 2
						}, function(){
							if(typeof interactions[interactions.activeInteractionType].showAssistance == "function"){
								if(q.assistance){
									$(interactions.containerId+" .interactionBtnAssistance").fadeIn();
								};
							}
						}
					);
				}else{				
					$(interactions.containerId+" .interactionInfoBox")
						.html(info)
						.animate(
							{
								backgroundColor:"#EFC847",
							},{
								duration: 2500,
								complete: function(){
									if(typeof interactions[interactions.activeInteractionType].showAssistance == "function"){
										if(q.assistance){
									$(interactions.containerId+" .interactionBtnAssistance").fadeIn();
								};
									}
								}
							}
						)
				}

			}else{
				q.status="failed";
				q.blocked=true;
				this.setBookmark(q.status,q.reference);
				
				switch(true){
					case this.lessonMode=="profiling":
					case this.lessonMode=="distributedAssessment":
					case this.lessonMode=="distributedSelfTest":
					case this.isBlockTestItem:
						break;
					default:
						content.setStatus("failed");
						this.applyQuestionStatus();
						this.showSolution("userSolution");
						content.moderate("failed");
						break;
				}
			}
			break;
	};
	
	switch(true){
		case this.lessonMode=="profiling":
		case this.lessonMode=="distributedAssessment":
		case this.lessonMode=="distributedSelfTest":
		case this.isBlockTestItem:
			if(q.blocked){
				content.setStatus(q.status);
				$(this.containerId+" .interactionInfoBox")
					.html(eval("msgQuizProfilingQuestionCompleted"+wbt.metadata.language))
					.animate(
						{
							backgroundColor:"#EFC847",
							color: "#666"
						},{
							duration: 1000,
							complete: function(){
								interactions.jumpToNextTestPage();
							}
						}
					)
			}
			break;
		default:
			if(q.blocked){
				if(typeof interactions[interactions.activeInteractionType].statusChange == "function"){
					interactions[interactions.activeInteractionType].statusChange(q.status);
				}
				
				if(q.status=="passed"){
					$(interactions.containerId+" .interactionBtnReset").hide();
				}
				
				if(interactions[interactions.activeInteractionType].getEvaluationHelp()==""){
					$(interactions.containerId+" .interactionBtnEvaluationHelp").hide();
				}
			};
	}

};
        
interactions.showSolution=function(type){
	
	switch(type){
		case "sampleSolution":
			interactions[interactions.activeInteractionType].showSampleSolution();
			break;
		case "userSolution":
			interactions[interactions.activeInteractionType].showUserSolution();			
			break;
	}	
};

interactions.getEvaluationHelp=function(){
	if(typeof interactions[interactions.activeInteractionType].getEvaluationHelp == "function"){
		return interactions[interactions.activeInteractionType].getEvaluationHelp();
	}else{
		return "";
	}
};

interactions.getAssistanceInfo=function(){
	if(typeof interactions[interactions.activeInteractionType].getAssistanceInfo == "function"){
		return interactions[interactions.activeInteractionType].getAssistanceInfo();
	}else{
		return "";
	}
};

interactions.showAssistance=function(){
	if(typeof interactions[interactions.activeInteractionType].showAssistance == "function"){
		interactions[interactions.activeInteractionType].showAssistance();
	}
};

interactions.hideAssistance=function(){
	if(typeof interactions[interactions.activeInteractionType].hideAssistance == "function"){
		interactions[interactions.activeInteractionType].hideAssistance();
	}
};

interactions.hideBtnAssistance=function(){
	try{
		$(interactions.containerId+" .interactionBtnAssistance").fadeOut();
	}catch(e){}
};

interactions.reset=function(jsonOnly){
	var q=interactions.activeInteraction;
	q.score=0;
	q.blocked=false;
	q.attempts=0;
	q.status="not attempted";
	interactions[interactions.activeInteractionType].reset(jsonOnly);
	if(!jsonOnly)this.applyQuestionStatus();
}

interactions.setBookmark=function(status,reference){
	if(reference=="")return;
	switch(status){
		case "passed":
			setBookmark(reference, 0);
			break;
		case "failed":
			setBookmark(reference, 2);
			break;
	}
	doMenuItem("toc", "no-open");
}

interactions.getLessonMode = function(){
	var lessonMode="learningModule";

	if(typeof wbt.metadata.resourceType!="undefined"){
		lessonMode=wbt.metadata.resourceType
	};
	
	if(scorm.scoVersion=="scormCon"){
		lessonMode=scorm.doScormCommand("lmsGetValue", "lessonMode");
	};
	
	return lessonMode;
}

/* Glossar */
/* ------- */
function writeGlossary(){
	var imgMinus=new Image();imgMinus.src=custom+"desktop/images/arrow_up.gif";
	var imgPlus=new Image();imgPlus.src=custom+"desktop/images/arrow_right.gif";
	
	for(var i=0;i<wbt.glossary.length;i++){

		var item=document.createElement("div");
		item.setAttribute("class","dynaItem");
		item.setAttribute("id",wbt.glossary[i].id);
		
			var itemHeadDiv=document.createElement("div");
			itemHeadDiv.setAttribute("class","dynaItemHeader");
			itemHeadDiv.setAttribute("id",wbt.glossary[i].id+"_header");
			itemHeadDiv.onclick=function(){toggleDynaItem(this.parentNode.id);};
				
				var itemHeadImg=document.createElement("img");
				itemHeadImg.setAttribute("id",wbt.glossary[i].id+"_img");
				itemHeadImg.setAttribute("src",custom+"desktop/images/arrow_right.gif");
				itemHeadImg.setAttribute("align","absmiddle");
				itemHeadDiv.appendChild(itemHeadImg);
				
				var itemHeadText=base64Matcher.test(wbt.glossary[i].item) ? decodeBase64(wbt.glossary[i].item) : wbt.glossary[i].item;
				itemHeadDiv.appendChild(document.createTextNode(itemHeadText));
			item.appendChild(itemHeadDiv);

			var itemBodyDiv=document.createElement("div");
			itemBodyDiv.setAttribute("id",wbt.glossary[i].id+"_body");
			itemBodyDiv.setAttribute("class","dynaItemBody");
	
				if(wbt.glossary[i].text!=""){
					var itemTextDiv=document.createElement("div");
					itemTextDiv.setAttribute("class","dynaItemText");
						var itemText=document.createElement("span");
						itemText.innerHTML=decodeBase64(wbt.glossary[i].text);
						itemTextDiv.appendChild(itemText);
					itemBodyDiv.appendChild(itemTextDiv);
				}
				
				var refIds=wbt.glossary[i].refids.split("|");
				for(var j=0;j<refIds.length;j++){
					var html=document.createElement("img");
					html.src=custom+"desktop/images/arrow_right.gif";
					itemBodyDiv.appendChild(html);
		
					html=document.createElement("a");
					html.href="javascript:content.jump('"+refIds[j]+"')";
					html.setAttribute("class","jumpLink");
					itemBodyDiv.appendChild(html);
					
					itemRefText=document.createTextNode(getTitleByPageId(refIds[j]));
					html.appendChild(itemRefText);
					
					html=document.createElement("br");
					itemBodyDiv.appendChild(html);						
				}
			
			item.appendChild(itemBodyDiv);
	
		document.getElementById("dynaContainer").appendChild(item);	
	}
}
var activeItem;
function toggleDynaItem(id){
	if(id==activeItem){
		doMenuItem("glossary");
		activeItem="";
		return;
	}

	var item;
	for(var i=0;i<wbt.glossary.length;i++){
		item=document.getElementById(wbt.glossary[i].id);
		item.className="dynaItem";
		item=document.getElementById(wbt.glossary[i].id+"_body");
		item.style.display="none";
		item=document.getElementById(wbt.glossary[i].id+"_header");
		item.setAttribute("class","dynaItemHeader");
		item=document.getElementById(wbt.glossary[i].id+"_img");
		item.setAttribute("align","absmiddle");
		item.src=custom+"desktop/images/arrow_right.gif";
	}
	item=document.getElementById(id);
	item.className="dynaItemActive";
	item=document.getElementById(id+"_body");
	item.style.display="block";
	item=document.getElementById(id+"_header");
	item.className="dynaItemHeaderActive";
	item=document.getElementById(id+"_img");
	item.setAttribute("align","absmiddle");
	item.src=custom+"desktop/images/arrow_up_inv.gif";
	activeItem=id;
}

function getTitleByPageId(refId){
	for(var i=1;i<db.length;i++){
		if(db[i].id==refId){
			return db[i].head2;
		}
	}
	return "";
}

/* Files */
/*-------*/
function writeFiles(args){
	var id=content.activePage.id;
	if(args!=undefined)id=args;
	
	for(var i=0;i<wbt.files.length;i++){
	
		var item=document.createElement("div");
		item.setAttribute("class","dynaItem");
		item.setAttribute(("id"),wbt.files[i].id);
		
			var itemHeadDiv=document.createElement("div");
			itemHeadDiv.setAttribute("id",wbt.files[i].id+"_header");
			if(wbt.files[i].page==id){
				itemHeadDiv.setAttribute("class","dynaItemHeaderActive");
			}else{
				itemHeadDiv.setAttribute("class","dynaItemHeader");
			}
			itemHeadDiv.onclick=function(){callFilefromDocubox(this.parentNode.id);};	
				
				var itemImg=document.createElement("img");
				itemImg.setAttribute("src",custom+"shared/images/"+wbt.files[i].icon+".png");
				itemImg.setAttribute("align","absmiddle");
				itemImg.setAttribute("class","filesIcon");
				itemHeadDiv.appendChild(itemImg);		

				var itemText=base64Matcher.test(wbt.files[i].caption) ? decodeBase64(wbt.files[i].caption) : wbt.files[i].caption;
				itemHeadDiv.appendChild(document.createTextNode(itemText));
			
			item.appendChild(itemHeadDiv);

		document.getElementById("dynaContainer").appendChild(item);
	}
}



function callFilefromDocubox(id){
	var getUrl,getTarget="_blank",getWidth="auto",getHeight="auto",getCaption="";
	for(var i=0;i<wbt.files.length;i++){
		if(wbt.files[i].id==id){
			getUrl=wbt.files[i].href.replace(/{RELPATH}/g, wbt.metadata.relpath);
			getTarget=wbt.files[i].target;
			getCaption=wbt.files[i].caption;
			break;
		}
	}
	
	if(getUrl){
		switch(getTarget){
			case "internal":
				createDynaPopup("type:html","content:"+getUrl,"caption:"+getCaption,"fullsize:true");
				break;
			case "_blank":
			case "popup":
			default:
				window.open(getUrl, target="_blank");
		}
	}else{
		alert("File not found, or file is damaged: files["+id+"]")
	}
}

/* IWBT */
/* ---- */

function writeIwbt(){
	var html = "<table cellspacing='4' cellpadding='4' border='0'>" +
		"<tr><td colspan='2'>" + decodeBase64(wbt.metadata.title) + "</td></tr>" +
		"<tr><td colspan='2'>" + decodeBase64(wbt.metadata.intro) + "</td></tr>";
	
	if(wbt.metadata.keywords.length>0){

		var arr=[];
		for(var i=0;i<wbt.metadata.keywords.length;i++){
			arr.push(decodeBase64(wbt.metadata.keywords[i].keyword))
		}
		
		arr.sort(function(a,b){
			return a.localeCompare(b);
		});
		
		html+="" +
			"<tr>" +
				"<td colspan='2'>" +
					"<span id='cKeywords'>{Stichworte}</span>" +
					"<ul>";
						for(var i=0;i<arr.length;i++){
							html+="<li>" + arr[i] + "</li>";
						}
		html+="" +
					"</ul>" +
				"</td>" +
			"</tr>";		
	}
	

	html += "<tr><td width='30%'><span id='cDate'>{Stand}</span>:</td><td width='70%'>" + decodeBase64(wbt.metadata.releaseDate) + "</td></tr>" +
		"<tr><td><span id='cID'>{Produktcode}</span>:</td><td>" + wbt.metadata.id + "</td></tr>" +
		"<tr><td><span id='cTypicalLearningTime'>{vorgeschlagene Lernzeit}</span>:</td><td>" + decodeBase64(wbt.metadata.typicalLearningTime) + "</td></tr>";

	if(typeof gender!="undefined"){
		html+="<tr><td colspan='2'>"+ gender.title + "</td></tr>" +
			"<tr><td colspan='2'>"+ gender.content + "</td></tr>";
	}
	
	html+="</table>";
	
	$.elpsOverlay("show", {
		content: html,
		closeKey: true,
		icon: "information",
		bound: $("#divcontainer"),
		width: "750px"
	});

	localizeGUI();
}

/* Impressum */
/* --------- */
function writeImpressum(){
	var html=decodeBase64(wbt.metadata.imprint);
	
	if(defaultSettings.imprint.overrideMetadata){
		var lng=wbt.metadata.language;
		lng=lng.replace(/_/g, "");
		
		html="<dl>";
		for(var i=0; i<defaultSettings.imprint.items.length; i++){
			var item=defaultSettings.imprint.items[i];
			
			if(typeof item.title=="object"){
				if(typeof item.title[lng] != "undefined"){
					html+="<dt>" + item.title[lng] + "</dt>";
				}else{
					html+="<dt></dt>";
				}
			}

			if(typeof item.html=="object"){
				if(typeof item.html[lng] == "string"){
					html+="<dd>" + item.html[lng] + "</dd>";
				}else{
					html+="<dd></dd>";
				}
			}
		}
		html+="</dl>";
	}
	
	html=html.replace(/{YEAR}/g, new Date().getFullYear());

	if(html.length<500){
	
		$.elpsOverlay("show", {
			content: html,
			closeKey: true,
			icon: "information",
			bound: $("#divcontainer"),
			width:"450px"
		});
		
	}else{
		$.elpsOverlay("show", {
			content : html,
			closeKey: true,
			position:"top",
			icon:"information",
			bound:$("#divcontainer"),
			width: $("#divcontainer").outerWidth()+"px",
			height: $("#divcontainer").outerHeight()+"px"
		});
	}
	localizeGUI();
} 


/* Isession */
/* -------- */

function writeIsession(){

	var html="";
	var onlineMode=getProtocol(location.href).indexOf("http")>=0?true:false;
	var ionlineMode=onlineMode?eval("ionlineModeTrue"+wbt.metadata.language):eval("ionlineModeFalse"+wbt.metadata.language);

	var lmsPresent=eval("iLmsPresentNo"+wbt.metadata.language);
	switch(scorm.scoVersion){
		case "scorm2004":
			lmsPresent=eval("iLmsPresentYes"+wbt.metadata.language)+", Scorm 2004";
			break;
		case "scorm12":
			lmsPresent=eval("iLmsPresentYes"+wbt.metadata.language)+", Scorm 1.2";
			break;
		case "scormCon":
			lmsPresent=eval("iLmsPresentYes"+wbt.metadata.language)+", Scorm Connector";
			break;
	}
	
	var lessonStatus=scorm.lessonStatus;
	var showLessonStatus=false;

	switch(true){
		case(lessonStatus.indexOf("failed")!=-1):
			lessonStatus=eval("ilessonStatusB"+wbt.metadata.language);
			showLessonStatus=true;
			break;
		case(lessonStatus.indexOf("passed")!=-1):
			lessonStatus=eval("ilessonStatusC"+wbt.metadata.language);
			showLessonStatus=true;
			break;
		default:
			lessonStatus=eval("ilessonStatusA"+wbt.metadata.language);
			break;
	}

	html="<table width='100%' border='0' cellspacing='4' cellpadding='4' style='table-layout: fixed;'>";
	html+="<tr><td>"+ionlineMode+"<br/>"+eval("iLmsPresent"+wbt.metadata.language)+lmsPresent+"</td></tr>";
	if(interactions.getLessonMode()!="profiling"){
		html+="<tr><td>"+eval("ipageCount"+wbt.metadata.language)+scorm.getPagesTotal()+"<br/>"+eval("ipagesVisited"+wbt.metadata.language)+scorm.getPagesVisited()+"</td></tr>";
		html+="<tr><td>"+eval("iIsScore"+wbt.metadata.language)+scorm.getScorePoints()+eval("iMaxScore"+wbt.metadata.language)+scorm.getMaxScore()+"<br/>"+eval("ipageScore"+wbt.metadata.language)+scorm.getScorePercent()+"%</td></tr>";
	}
		
	if(showLessonStatus)html+="<tr><td>"+eval("ilessonStatus"+wbt.metadata.language)+lessonStatus+"</td></tr>";
	html+="<tr><td>"+eval("ilogonTime"+wbt.metadata.language)+scorm.logonTime+"</td></tr>";
	html+="<tr><td>"+eval("isessionTime"+wbt.metadata.language)+scorm.getSessionTime()+"</td></tr>";

	html+="</table>";

	$.elpsOverlay("show", {
		content: html,
		closeKey: true,
		icon: "information",
		bound: $("#divcontainer"),
		width: "450px"
	});
}

/* Bookmarks */
/* --------- */
function setBookmark(pageId, val) {
	for(var i in wbt.structure){
        for(var j in wbt.structure[i].items) {
            if(typeof wbt.structure[i].items[j] == "object"){
				var page=wbt.structure[i].items[j];
				if(pageId==page.id){
					page.bookmark=val;
				}				
            }
        }
    };
	
	scorm.updateSessionData(content.activePage.id, {
		bookmark: val
	});
	
	doMenuItem("toc", "no-open");
};

function getBookmarks(){
	var currentBookmarks=new Array();
	for(var i in wbt.structure){
        for(var j in wbt.structure[i].items) {
            if(typeof wbt.structure[i].items[j] == "object"){
				var page=wbt.structure[i].items[j];
				if(page.bookmark>0){
					currentBookmarks.push({
						id: page.id,
						title: page.title,
						val: page.bookmark
					});
				}
            }
        }
    };
	return currentBookmarks;
}

function processBookmarks(){
	var currentBookmarks=getBookmarks();
	
	if(currentBookmarks.length==0){
		$.elpsOverlay("show", {
			content: "<p>"+eval("bmNotYetBookmarked"+wbt.metadata.language)+"</p>",
			bound: $("#divcontainer"),
			width: "450px",
			closeKey: true,
			icon: "working",
			autoclose: 3000,
			useOverlay: false
		});
	}else{
		var html="<form id='bmForm'>" +
			"<p>" + eval("bmBookmarks"+wbt.metadata.language) + "</p>" +
			"<table cellpadding='4' cellspacing='4' border='0'>";
		
		for(var i in currentBookmarks){
			if(typeof currentBookmarks[i]=="object"){
				var cb=currentBookmarks[i];
				html+="<tr>";
				switch(cb.val){
					case 1:
						html+="<td valign='top'><img src='"+custom+"desktop/images/tree/bullet_blue.png'></td>";
						break;
					case 2: 
						html+="<td valign='top'><img src='"+custom+"desktop/images/tree/bullet_red.png'></td>";
						break;
				}
				
				html+="" +
					"<td valign='top'>" +
						"<a class='jumpLink' href='javascript:void(0);' onclick='$.elpsOverlay(\"hide\");content.jump(\""+cb.id+"\");'>"+decodeBase64(cb.title)+"</a>" +
					"</td>" +
					"<td valign='top'>" +
						"<input type='button' onclick='setBookmark(\""+cb.id+"\",0);$(this).parent().parent().remove();' value='"+(wbt.metadata.language=="_de"?"Löschen":"Delete")+"' />" +
					"</td>" +
					"</tr>";
			}
		}
		html+="</table></form>";
		
		$.elpsOverlay("show", {
			content: html,
			bound: $("#divcontainer"),
			width: "550px",
			closeKey: true,
			icon: "bookmark",
			buttons: {
				ok: {
					text: "OK",
					onclick: function(){
						$.elpsOverlay("hide");
					}
				}
			}
		});
	}
}

/* Notes */
/* ----- */
function processNotes(args){
	var id=content.activePage.id;
	if(args!=undefined)id=args;

	var html="";
	for(var i=0;i<wbt.questions.length;i++){
		if(wbt.questions[i].page==args){
			html+="<p>"+decodeBase64(wbt.questions[i].question)+"</p>";
		}
	}
	
	$.elpsOverlay("show", {
		content: html,
		closeKey: true,
		icon: "help",
		bound: $("#divcontainer"),
		width: html.length>500 ? "750px" : "450px"
	});		
	
}

/* Popup windows */
/* ------------- */
function createDynaPopup(a,b){
	var html="",ptype="",pcontent="",pcaption="",pwidth=0,pheight=0,fullsize=false;	
	var args=createDynaPopup.arguments;
	if(a.constructor==Array)args=a;
	if(b=="preload:done")args=a;

	for(var i=0;i<args.length;i++){
		var arg=args[i].split(":");
		switch(arg[0]){
			case "type": 
				ptype=arg[1];
				break;
			case "content":   
				pcontent=(arg[1]=="http")?pcontent=arg[1]+":"+arg[2]:pcontent=arg[1];
				break;
			case "width":     
				pwidth=(arg[1]*1)>pwidth?(arg[1]*1):pwidth;
				break;
			case "height":    
				pheight=(arg[1]*1)>pheight?(arg[1]*1):pheight;
				break;
			case "fullsize":    
				fullsize=arg[1]=="true"?true:false;
				break;
			case "caption":   
				pcaption=arg[1];
				break;
		}
	}

	var html="";
	switch(ptype){
		case "video":
			content.writeVideoOverlay.apply(this, arguments);
			return;
		case "atom":
			var html=typeof pcaption=="undefined"?"":"<p>"+pcaption+"</p>";
			var atomData = typeof(content.activePage.steps[content.activeStep].atoms) == "undefined" ? content.activePage.atoms : content.activePage.steps[content.activeStep].atoms;
			for(var i=0;i<atomData.length;i++){
				if(atomData[i].id==pcontent){
					if(atomData[i].caption!="")html="<p>"+decodeBase64(atomData[i].caption)+"</p>";
					html+=unescape(decodeBase64(atomData[i].content));
					html=html.replace(/{RELPATH}/g, wbt.metadata.relpath);

					var wrapMaxY=$("#divcontainer").outerHeight()-50;
					pwidth=(atomData[i].width>0) ? atomData[i].width : 600;
					pheight=(atomData[i].height>0) ? atomData[i].height : 0;

					if(html.indexOf("width:")!=-1){
						var startPos=html.indexOf("style=");
						var endPos=html.indexOf(";\">");
						var rules=(html.substring(startPos+7, endPos)).split(";");
						var widthRule=0;
						for(var j=0;j<rules.length;j++){
							if(rules[j].indexOf("width")!=-1){
								widthRule=parseFloat(rules[j].split(":")[1]);
								if(widthRule>400)pwidth=widthRule;
							}
						}
					}
					
					if(html.indexOf("height:")!=-1){
						var startPos=html.indexOf("style=");
						var endPos=html.indexOf(";\">");
						var rules=(html.substring(startPos+7, endPos)).split(";");
						var widthRule=0;
						for(var j=0;j<rules.length;j++){
							if(rules[j].indexOf("width")!=-1){
								widthRule=parseFloat(rules[j].split(":")[1]);
								if(widthRule>400)pwidth=widthRule;
							}
						}
					}						

					if(pheight>=wrapMaxY)html="<div style='overflow-y:scroll;height:"+wrapMaxY+"px'>"+html+"</div>";
					break;
				}					
			}
			showDynaPopup(html,pwidth,pheight,fullsize);
			break;
		
		case "html":
			var html=typeof pcaption=="undefined"?"":"<p>"+pcaption+"</p>";
			html+=unescape(decodeBase64(pcontent));
			html=html.replace(/{RELPATH}/g, wbt.metadata.relpath);

			var wrapMaxY=$("#divcontainer").outerHeight()-50;
			pwidth=600;

			if(html.indexOf("width:")!=-1){
				var startPos=html.indexOf("style=");
				var endPos=html.indexOf(";\">");
				var rules=(html.substring(startPos+7, endPos)).split(";");
				var widthRule=0;
				for(var j=0;j<rules.length;j++){
					if(rules[j].indexOf("width")!=-1){
						widthRule=parseFloat(rules[j].split(":")[1]);
						if(widthRule>400)pwidth=widthRule;
					}
				}
			}
			
			if(html.indexOf("height:")!=-1){
				var startPos=html.indexOf("style=");
				var endPos=html.indexOf(";\">");
				var rules=(html.substring(startPos+7, endPos)).split(";");
				var widthRule=0;
				for(var j=0;j<rules.length;j++){
					if(rules[j].indexOf("width")!=-1){
						widthRule=parseFloat(rules[j].split(":")[1]);
						if(widthRule>400)pwidth=widthRule;
					}
				}
			}						

			if(pheight>=wrapMaxY || fullsize){
				wrapMaxY=$("#divcontainer").outerHeight()-90;
				html="<div style='overflow-y:scroll;height:"+wrapMaxY+"px'>"+html+"</div>";
			}
				
			showDynaPopup(html,pwidth,pheight,fullsize);
			break;
			
		case "url":
			pwidth=pwidth>0?pwidth*1:600;
			pheight=pheight>0?pheight*1:400;
			html="<iframe src='"+pcontent+"' " + 
				"width='"+pwidth+"' " + 
				"height='"+pheight+"' " +
				"frameborder='0' " +
				"scrolling='auto'>" + 
				"<a href='"+pcontent+"' target='_blank'>"+pcontent+"</a></iframe>";
			html=html.replace(/{RELPATH}/g, wbt.metadata.relpath);
			pheight=parseInt(pheight)+100;
			showDynaPopup(html,pwidth,pheight,fullsize);
			break;
			
		case "img":
			var html=typeof pcaption=="undefined"?"":"<p>"+decodeBase64(pcaption)+"</p>";
			if(b!="preload:done"){
				var img=$("<img />").prop("src",pcontent.replace(/{RELPATH}/g, wbt.metadata.relpath)+ "?" + new Date().getTime());
								//date-> forces load-event in msie, even if img is already cached
				img.load(function() {
					pwidth=this.width;
					pheight=this.height + 100;
					showDynaPopup(html+"<img src='"+$(this).prop("src")+"' />",pwidth,pheight,fullsize);
				 });
			}
			break;
	}	
}

function showDynaPopup(html,pwidth,pheight,fullsize){
	if(fullsize){
		pheight=$("#divcontainer").outerHeight()+"px";
		pwidth=$("#divcontainer").outerWidth()+"px";
	}else{
		pwidth=(parseInt(pwidth)+90)+"px";
		pheight=parseInt(pheight)>0?pheight+"px":"auto"
	}
	$.elpsOverlay("show", {
		content : html,
		position:"top",
		icon:"atom",
		closeOverlay: true,
		bound:$("#divcontainer"),
		width: pwidth,
		height: pheight
	});
}

// compat-->
function dynaPopup(timeout,appearFrom,appearTo,disappearTo,width,height,url){
	createDynaPopup("type:url","content:"+url,"width:"+width,"height:"+height);
}

function popupPic(url){
	createDynaPopup("type:img","content:"+url);
}

function popup(url,dimX,dimY,attrScroll,attrCenter,attrResize,param,attrTool){
	createDynaPopup("type:url","content:"+url)
}

function showImageWithSizeNoMargin(url){
	createDynaPopup("type:img","content:"+url);
}
// <--compat 


/* content tree */
/* ------------ */
var db=new Array(), visiState="", currentState="", cnctn=0, cnct=0;
function initTree(){
	
	var childNode, blocks = [], pages = [];
	blocks = wbt.structure;
	db[0]=new Object();
	
	for (var i in blocks){
		if(typeof blocks[i] == "object"){
			pages = getJsonObjects(blocks[i], "template", "multipage", true);
			for (var j in pages) {
				var page = new Object();
				if(typeof pages[j] == "object"){
					page = new Object();
					page.id = pages[j].id;
					page.mother =  j == 0 ? 1 : 0;
					page.indent = j == 0 ? 0 : 1;
					page.show = 1;
					page.icon = pages[j].icon;
					page.pscore = pages[j].maxScore;
					page.head1 = decodeBase64(blocks[i].title);
					page.head2 = decodeBase64(pages[j].title);
					page.url = parseInt(j) + ".htm";
					page.quids = "";
					page.qwids = "";
					page.thumb = "";
					page.template = pages[j].template;
					page.hasFiles = pages[j].hasFiles;
					page.hasGlossary = pages[j].hasGlossary;
					db.push(page);
				}
			}
		}
	}
	
	var current=currentState;
	try{
		if(current==""||current.length!=(db.length-1)){
			currentState="";
			visiState="";
			for(i=1;i<db.length;i++){ 
				currentState+="0";
				visiState+="0";
			}
		}
	}catch(e){
		cnct++;
		if(cnct<5){
			setTimeout("initTreeCookies()",1000);
		}else{
			return;
		}
	}
}

function puzzleVisiState(n,newScore) {
	try{
		var visited=visiState;
		var newString=visited.substring(0,n-1);
		var oldScore=parseInt(visited.substring(n,n-1));
		if(newScore){
			switch(true){
				case(newScore==99):                       newString+=0;break; //reset einer profiling-aufgabe
				case(oldScore==9 && newScore>0):          newString+=newScore;break; //zuvor erfolglos bearbeitet, jetzt ok -> neuen Wert setzen
				case(oldScore!=9 && newScore<=oldScore):  newString+=oldScore;break; //zuvor schon erfolgreich bearbeitet -> alten Wert behalten
				case(newScore!=9 && newScore>oldScore):   newString+=newScore;break; //erfolgreich bearbeitet -> neuen Wert setzen
				case(newScore==9 && oldScore>1):          newString+=oldScore;break; //aktuell nicht erfolgreich, aber zuvor schon erfolgreich bearbeitet -> alten Wert behalten
				case(newScore==9 && oldScore==0):         newString+=newScore;break; //erster Versuch -> neuen Wert setzen
				default:newString+=newScore;break;	
			}
		}else{
				newString+=oldScore;
		}
		newString+=visited.substring(n,visited.length);
		visiState=newString;
	}catch(e){
		cnctn++;
		if(cnctn<5){
			setTimeout("puzzleVisiState("+n+","+visited.length+")",1000);
		}else{
			return;
		}
	}
}

var topics, treeIconPath=custom+"desktop/images/tree/";
function writeTree(){
	topics=new Array();
	if(typeof customWriteTree=="function"){
		document.getElementById("dynaContainer").innerHTML=customWriteTree();
		return;
	}
	
	document.getElementById("dynaContainer").innerHTML="";
	var prevIndentDisplayed=0;
	var showMyDaughter=0;
	var current=currentState;
	var visited=visiState;
	var myCaption="";
	var outerTable="<table width='100%' cellspacing='0' cellpadding='0' border='0'><tbody>";
	
	var myMother=0;
	for (var i=content.pageNum;i>0;i--){
		if(db[i].mother){
			myMother=i;
			break;
		}
	}

	var currentBookmarks=getBookmarks();
	
	for(var i=1;i<db.length;i++){
		if(db[i].mother>0)topics.push(i);
	}
	
	for (var i=1;i<db.length;i++){

		var bold=false;
		var hilite=(i==content.pageNum)?true:false;
		
		var rowClass=(i%2==0?"even":"odd");
		if(hilite)rowClass="tocActiveItem";

		if(!db[i].show)continue;
		var currIndent=db[i].indent;
		var expanded=current.substring(i-1,i);

		if(db[i].mother){
			var newString=current.substring(0,i-1);
			newString+=0;
			newString+=current.substring(i,current.length);
			currentState=newString;
			current=newString;
			current=newString;
			expanded=current.substring(i-1,i);
		}

		if(i==myMother){
			newString=current.substring(0,i-1);
			newString+=1;
			newString+=current.substring(i,current.length);
			currentState=newString;
			current=newString;
			current=newString;
			expanded=current.substring(i-1,i);
		}
		
		if((currIndent==0||currIndent<=prevIndentDisplayed||(showMyDaughter==1&&(currIndent-prevIndentDisplayed==1)))){
			outerTable+="<tr><td>";
			var innerTable="<div  class='"+rowClass+"' id='row"+db[i].id+"'><table width='100%' cellspacing='0' cellpadding='0' border='0'><tbody><tr>";
			
			//Bookmarks
			var gotcha=0;
			for(var j in currentBookmarks){
				if(typeof currentBookmarks[j]=="object"){
					if(db[i].id == currentBookmarks[j].id){
						gotcha=currentBookmarks[j].val;
					}
				}
			}
			
			if(db[i].mother){
				innerTable+="<td valign='middle' nowrap='nowrap' align='left' width='45'>"+getProgressbarByTopic(i)+"</td>";
			}else{
				if(gotcha>0){
					innerTable+="<td width='45' nowrap='nowrap' align='left'>";
					innerTable+=getSymbol(parseInt(visited.substring(i-1,i)));
					innerTable+="<a title='"+eval("bmBookmarksSet"+wbt.metadata.language)+"'  href='javascript:void(0);' onclick='setBookmark(\""+db[i].id+"\", 0);'>";
					innerTable+="<img style='opacity:0.5;padding-left:5px;' src='"+treeIconPath+"icon_"+db[i].icon.split("_")[0]+".png' border='0' /></a></td>";
				}else{
					innerTable+="<td width='45' nowrap='nowrap' align='left'>";
					innerTable+=getSymbol(parseInt(visited.substring(i-1,i)));
					innerTable+="<a title='"+eval("bmBookmarksSet"+wbt.metadata.language)+"' href='javascript:void(0);' onclick='setBookmark(\""+db[i].id+"\", 1);'>";
					innerTable+="<img style='opacity:0.5;padding-left:5px;' src='"+treeIconPath+"icon_"+db[i].icon.split("_")[0]+".png' border='0' /></a></td>";
				}
			}
			
			//Page Title
			myCaption=currIndent==0?db[i].head1:db[i].head2;
			
			innerTable+="<td style='white-space:nowrap'>";
			innerTable+="<table style='width: 100%;border-collapse:collapse;'><tbody><tr><td style='border: 0pt none;white-space:nowrap'>";
			
			innerTable+="<div class='tocPageTitle'";
			if(db[i].indent==0){
				innerTable+=">";
			}else{
				var offset=16,padd=3;
				var filespec="line_end.png";
				if(gotcha==1)filespec="line_end_blue.png";
				if(gotcha==2)filespec="line_end_red.png";
				innerTable+=" style='background-repeat: no-repeat;background-image:url("+treeIconPath+filespec+");background-position:"+(offset*(db[i].indent-1)+padd)+"px 0px;padding-left:"+(offset*db[i].indent)+"px;'>";
			}		
			if(currIndent==0||i==content.pageNum)bold=true;

			innerTable+="<p>";
			if(i==content.pageNum){
				innerTable+="<span class='"+(currIndent==0?" mother":"")+ (db[i].indent>0?" truncate":"") + "' title='"+myCaption+"'>"+myCaption+"</span>";
			}else{
				innerTable+="<a id='toc"+db[i].id+"' class='jumpLink truncate "+(currIndent==0?" mother":"")+"' href='javascript:void(0);' onclick='content.jump(\""+db[i].id+"\")' title='"+myCaption+"'>"+myCaption+"</a>";
			}
			innerTable+="</p>"
			innerTable+="</div>"
			innerTable+="</td></tr></table>";	
			innerTable+="</td>";
			
			//Files
			gotcha=false;
			if(wbt.files.length>0){
				for(var j=0;j<wbt.files.length;j++){
					if(wbt.files[j].page==db[i].id){
						gotcha=true;
						break;
					}
				}
				if(gotcha){
					innerTable+="<td nowrap='nowrap' align='center' width='20'><a title='" +  eval("tocDocuActive"+wbt.metadata.language) + "' href='javascript:void(0);' onclick='doMenuItem(\"files\",\""+db[i].id+"\");'><img style='padding-top:3px;' src='"+treeIconPath+"files_active.png' /></a></td>";
				}else{
					innerTable+="<td></td>";
				}
			}
			
			//Notes
			var gotcha=false;
			if(typeof wbt.questions!="undefined"){
				if(wbt.questions.length>0){
					for(var j=0;j<wbt.questions.length;j++){
						if(wbt.questions[j].page==db[i].id){
							gotcha=true;
							break;
						}
					}
					if(gotcha){
						innerTable+="<td nowrap='nowrap' width='20' align='center'><a  title='"+eval("notesCaption"+wbt.metadata.language)+"' href='javascript:void(0);' onclick='doMenuItem(\"notes\",\""+db[i].id+"\");'><img style='padding-top:3px;' src='"+treeIconPath+"notes_active.png' /></a>&nbsp;</td>";
					}else{
						innerTable+="<td></td>";
					}
				}
			}
	
			innerTable+="</tr></table></div>";
			outerTable+=innerTable+"</td></tr>";

			prevIndentDisplayed=currIndent;
			showMyDaughter=expanded;
		
		}
	}
	outerTable+="</tbody></table>";
	
	document.getElementById("dynaContainer").innerHTML=outerTable;
}

function getProgressByTopic(num){
	
	try{
		var ll=parseInt(topics.search(num));
		var ul=typeof topics[ll+1]=="undefined"?parseInt(topics[ll]):parseInt(topics[ll+1])-1;
		if(topics.length==1){
			ul=db.length-1;
		}else{
			if(parseInt(topics.search(ul))+1==topics.length){
				ul=db.length-1;
			}
		};
		
		ll=topics[ll];
		var visited=0;
		for(var i=ll-1;i<ul;i++){
			if(parseInt(visiState.substring(i,i+1))>0)visited++;
		}
		console.log(ll, ul, visited, parseInt(round(visited/(ul-ll+1))*100))
		return parseInt(round(visited/(ul-ll+1))*100);
	}catch(err){
		return -1;
	}
}

function getProgressbarByTopic(curScore){
	var topicScore=getProgressByTopic(curScore);
	return "<div class='meter' title='"+topicScore+"%'><span style='width:"+topicScore+"%'></span></div>";
}

function getSymbol(curScore, isMother){
	if(isMother){
		var topicScore=getProgressByTopic(curScore);
		var stars=0;
		if(topicScore>-1){
			switch(true){
				case (topicScore<10):stars="0";break;
				case (topicScore>=10)&&(topicScore<30):stars="1";break;
				case (topicScore>=30)&&(topicScore<50):stars="2";break;
				case (topicScore>=50)&&(topicScore<70):stars="3";break;
				case (topicScore>=70)&&(topicScore<90):stars="4";break;
				case (topicScore>=90):stars="5";break;
			}
			return "<img src='"+treeIconPath+"progress"+stars+".png' />";
		}
		return ""; 
	}else{
		var outline="",
			iconMode="normal";
		
		switch(true){
			case interactions.lessonMode=="profiling":
				iconMode="neutral";
				break;
			case interactions.lessonMode=="distributedAssessment":
				iconMode="neutral";
				break;
			case interactions.lessonMode=="distributedSelfTest":
				iconMode="neutral";
				if(interactions.reviewMode){
					iconMode="normal";
				}
				break;
			case interactions.isBlockTestItem:
				if(content.activeBlock==interactions.blockNum){
					if(interactions.reviewMode || interactions.resultsVisible){
						iconMode="normal";
					}else{
						if(interactions.blockTest.attempts>1){
							iconMode="semineutral";
						}else{
							iconMode="neutral";
						};							
					};
				};
				break;
			default:
				
				break;
		};

		switch(iconMode){
			case "normal":
				switch(curScore){
					case 0:
						outline+="<img src='"+treeIconPath+"inactive.png' border='0' />";
						break;
					case 1:
						outline+="<img  src='"+treeIconPath+"go.png' border='0' />";
						break;
					case 9:
						outline+="<img  src='"+treeIconPath+"nogo.png' border='0' />";
						break;
					default:
						outline+="<img src='"+treeIconPath+"go.png' border='0' />";
						break;			
				};
				break;			
			
			case "neutral":
				switch(curScore){
					case 0:
						outline+="<img src='"+treeIconPath+"inactive.png' border='0' />";
						break;
					default:
						outline+="<img src='"+treeIconPath+"bullet_blue.png' border='0' />";
						break;
				};
				break;
			
			case "semineutral":
				switch(curScore){
					case 0:
						outline+="<img src='"+treeIconPath+"inactive.png' border='0' />";
						break;
					case 1:
						outline+="<img  src='"+treeIconPath+"go.png' border='0' />";
						break;
					default:
						outline+="<img src='"+treeIconPath+"bullet_blue.png' border='0' />";
						break;
				};
				break;
		}
		return outline;
	}
}