var jPlayerAndroidFix, myAndroidFix, isChrome=false;
var isMobile=true, msie=false, msie8=false;
$().ready(function(){

	$("title").html(decodeBase64(wbt.metadata.title));
	
	$("<link/>", {
        id: "favicon",
        rel: "shortcut icon",
		type: "image/png",
        href: custom+"shared/images/favicon.ico"
    }).appendTo($("head"));
	
	if(device.ios()){
		$("<meta/>", {
			name: "apple-touch-fullscreen",
			rel: "shortcut icon",
			content: "yes"
		}).appendTo($("head"));
		
		$("<meta/>", {
			name: "apple-mobile-web-app-status-bar-style",
			rel: "shortcut icon",
			content: "black"
		}).appendTo($("head"));
	}
	
	/*$("#viewport")
		.attr("content",
			  "width=" + $(window).width() + ", " +
			  "height=" + $(window).height() + ", " +
			  "initial-scale=1.0, " +
			  "maximum-scale=1.0, " +
			  "minimum-scale=1.0, " +
			  "user-scalable=no"
		);*/
	
	$("body").disableSelection();

    $.randomize = function(arr) {
        for(var j, x, i = arr.length; i; j = parseInt(Math.random() * i), x = arr[--i], arr[i] = arr[j], arr[j] = x);
        return arr;
    };

    //android fix for jplayer: missing ended event-->
    jPlayerAndroidFix = (function($) {
        var fix = function(id, media, options) {
            this.playFix = false;
            this.init(id, media, options);
        };
        fix.prototype = {
            init: function(id, media, options) {
                var self = this;
                this.id = id;
                this.media = media;
                this.options = options;
                this.player = $(this.id);
    
                this.player.bind($.jPlayer.event.ready, function(event) {
                    self.setMedia(self.media);
                });
    
                if(device.android()) {
                    this.player.bind($.jPlayer.event.progress, function(event) {
                        if(self.playFixRequired) {
                            self.playFixRequired = false;
                            if(self.playFix) {
                                self.playFix = false;
                                $(this).jPlayer("play");
                            }
                        }
                    });
                    this.player.bind($.jPlayer.event.ended, function(event) {
                        if(self.endedFix) {
                            self.endedFix = false;
                            setTimeout(function() {
                                self.setMedia(self.media);
                            },0);
                        }
                    });
                    this.player.bind($.jPlayer.event.pause, function(event) {
                        if(self.endedFix) {
                            var remaining = event.jPlayer.status.duration - event.jPlayer.status.currentTime;
                            if(event.jPlayer.status.currentTime === 0 || remaining < 1) {
                                setTimeout(function() {
                                    self.jPlayer._trigger($.jPlayer.event.ended);
                                },0);
                            }
                        }
                    });
                }
                this.player.jPlayer(this.options);
                this.jPlayer = this.player.data("jPlayer");
                this.cssSelectorAncestor = this.player.jPlayer("option", "cssSelectorAncestor");
                this.resetAndroid();
                return this;
            },
            setMedia: function(media) {
                this.media = media;
                this.resetAndroid();
                this.player.jPlayer("setMedia", this.media);
                return this;
            },
            play: function() {
                if(device.android() && this.playFixRequired) {
                    this.playFix = true;
                } else {
                    this.player.jPlayer("play");
                }
            },
            resetAndroid: function() {
                if(device.android()) {
                    this.playFix = false;
                    this.playFixRequired = true;
                    this.endedFix = true;
                }
            }
        };
        return fix;
    })(jQuery); //end android fix
});

function onloadActions(){
	
	if(typeof userSettings=="object"){
		$.extend(true, defaultSettings, userSettings);
	};	

	scorm.init();
	content.init();
}

if(typeof content=="undefined"){
	content={};
}
content.pageIds=[];
content.pageNum=0;
content.activeBlock=-1;
content.activePage=new Object();
content.activeModeration="";
content.previousPageId=0;
content.nextPageId=0;
content.activeStep=0;
content.innerNavActive_back=false;
content.innerNavActive_fwd=false;
content.container=new Object();
content.tocPanelPref="closed";
content.bounceOrigin="";
content.init=function(){

	var html=templates.splashPage();
	
	html=html.replace(/{SPLASHTITLE}/g, templates.splashTitle().replace(/{TITLE}/g, decodeBase64(wbt.metadata.title)));
	
	if(wbt.metadata.intro!=""){
		html=html.replace(/{SPLASHINTRO}/g, templates.splashIntro().replace(/{INTRO}/g, decodeBase64(wbt.metadata.intro)));	
	}else{
		html=html.replace(/{SPLASHINTRO}/g,"");
	}	
	
	if(wbt.metadata.typicalLearningTime!=""){
		var lt=decodeBase64(wbt.metadata.typicalLearningTime);
		html=html.replace(/{SPLASHLEARNINGTIME}/g, templates.splashLearningTime().replace(/{LEARNINGTIME}/g, lt));		
	}else{
		html=html.replace(/{SPLASHLEARNINGTIME}/g, "");
	}

    //splash
    $("<div/>", {
        id: "splashPage",
        "data-role": "page",
		"data-theme": "c",
        html: html
    }).appendTo($("body"));
    
    $.mobile.changePage("#splashPage", {
        transition: "fade"
    });
	
	interactions.lessonMode=interactions.getLessonMode();
	
	var arrScriptsToLoad = [];
	
	switch(interactions.lessonMode){
		case "profiling":
		case "distributedAssessment":
		case "distributedSelfTest":
			arrScriptsToLoad.push(common+"shared/elps.interactions.distributed.js");
			arrScriptsToLoad.push(common+"lib/jquery.plugin.ondemand.raty.js");
			arrScriptsToLoad.push(common + "lib/jquery.plugin.ondemand.chart.js");
			break;
		default:
			break;
	};
	
	$.each(wbt.structure, function(i,block){
		if(typeof block.blockType!="undefined"){
			if(block.blockType=="assessment" || block.blockType=="selftest"){
				arrScriptsToLoad.push(common + "shared/elps.interactions.block.js");
				arrScriptsToLoad.push(common + "lib/jquery.plugin.ondemand.chart.js");
			}
		}
	});	
	
	if(typeof wbt.metadata.navigation!="undefined"){ 
		if(wbt.metadata.navigation=="block"){ //block level navigation
			arrScriptsToLoad.push(common + "shared/elps.blocknavigation.js");
		};
	};
	
	if($.isArray(wbt.facts)) {
		arrScriptsToLoad.push(common + "shared/elps.randomfacts.js");
	};
	
	if(arrScriptsToLoad.length>0){
		yepnope(
			[{
				load: arrScriptsToLoad,
				complete: function(){
					content.initData();
				}
			}]
		);
	}else{
		content.initData();
	};

}
	
content.initData=function(){
	
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
	
	//collect pageids
    for(var i in wbt.structure){
        for(var j in wbt.structure[i].items) {
            if(typeof wbt.structure[i].items[j] == "object"){
                content.pageIds.push(wbt.structure[i].items[j].id)
            }
        }
    };
    
    content.createContentPages();
};

content.onPagesCreated=function(){
    
	content.tocPanelPref=scorm.getPreference("tocPanelPref");
	
    $("<div/>", {
        id: "audioPlayerControls",
        html: templates.audioPlayerControlsTemplate
    }).appendTo($("#playbar"));
	
    $("#jp-text").bind("click", function(){
        content.showModerationPanel();
    });
    
    $("#jp-notext").bind("click", function(){
        content.closeModerationPanel();
    });
    
    $("#jp-notext").hide();	
	
    var browser="";
    if(typeof $.jPlayer.platform.tablet=="undefined" && typeof $.jPlayer.platform.mobile=="undefined") {
        browser=navigator.userAgent.toLowerCase();
        if(browser.indexOf("firefox") > -1) browser="firefox";
    }
    $("#jplayer_audio").jPlayer({
        ready: function() {
            content.audioPlayerOK = true;
            //console.log("audioplayer ready");
        },
        ended: function(){
            if($.mobile.activePage.attr("id")=="splashPage"){
                //console.log("audio released")
                $.mobile.loading("hide");
                $.mobile.changePage("#contents", {
                    transition: "fade"
                });
				
				if(content.tocPanelPref=="sticky"){
					content.openTocPanel();
				}
            }else{
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
                        //doExitWarning();
                    },2000)
                }else{
                	content.notifyNavNext();
                }             
            }
        },
        cssSelectorAncestor: "#jp_container_audio",
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
		play: function(){
			$("#jplayer_audio").jPlayer("unmute");
			scorm.setPreference("audioEnabled", true);
		},
        solution: "html", //browser=="firefox"?"flash,html":"html",
        muted: scorm.getPreference("audioEnabled") ? false : true,
        volume: scorm.getPreference("audioVolume"),
		autoplay: false,
        
        supplied: "mp3"
    });

	if(scorm.scoVersion=="scormCon"){
		scorm.scoAPI.jQuery.unblockUI();
	};
};

content.setTocPanelPref=function(s){
	if(s=="opened")s="closed";
	content.tocPanelPref=s;
	scorm.setPreference("tocPanelPref",s);
};

content.createContentPages=function(){
    
    //toc
    var blocks=wbt.structure,tocAllBlocksHtml="";
    
    for(var i in blocks){
        if(typeof blocks[i]=="object"){
            tocAllBlocksHtml+=templates.tocBlockCollapsible();
            tocAllBlocksHtml=tocAllBlocksHtml.replace(/{BLOCKID}/g,"block"+i);
            tocAllBlocksHtml=tocAllBlocksHtml.replace(/{BLOCKTITLE}/g,decodeBase64(blocks[i].title));
            tocAllBlocksHtml=tocAllBlocksHtml.replace(/{TRUEFALSE}/g,i==0 ? "false" : "true");
            
            var tocSingleBlockHtml="",
                pages=getJsonObjects(blocks[i], "template", "multipage", true),
				numPagesPerBlock=0;
            for(var j in pages) {
                var page=new Object();
                if(typeof pages[j]=="object"){
					numPagesPerBlock++;
                    tocSingleBlockHtml+=templates.tocPageListItem();
                    tocSingleBlockHtml=tocSingleBlockHtml.replace(/{PAGEID}/g,pages[j].id);
                    tocSingleBlockHtml=tocSingleBlockHtml.replace(/{PAGETITLE}/g,decodeBase64(pages[j].title));
                    
					switch(pages[j].status){
						case "completed":
						case "passed":
							tocSingleBlockHtml=tocSingleBlockHtml.replace(/{ICON}/g,"passed");
							break;
						case "failed":
							tocSingleBlockHtml=tocSingleBlockHtml.replace(/{ICON}/g,"failed");
							break;
						default:
							tocSingleBlockHtml=tocSingleBlockHtml.replace(/{ICON}/g,pages[j].icon);
					}
					
					if(pages[j].hasFiles){
						tocSingleBlockHtml=tocSingleBlockHtml.replace(/{PAGEHASFILES}/g,templates.tocPageHasFiles());
					}else{
						tocSingleBlockHtml=tocSingleBlockHtml.replace(/{PAGEHASFILES}/g,"");
					}
					
                }
            };
			tocAllBlocksHtml=tocAllBlocksHtml.replace(/{PAGES}/g, tocSingleBlockHtml);
            tocAllBlocksHtml=tocAllBlocksHtml.replace(/{NUMPAGES}/g, numPagesPerBlock);			
        }
    };
    
    var contentPageHtml=templates.contentPage();
    contentPageHtml=contentPageHtml.replace(/{BLOCKCOLLAPSIBLES}/g, tocAllBlocksHtml);
    
	contentPageHtml=contentPageHtml.replace(/{POPUPMENU}/g, templates.menuPopup());

    var menuItemsHtml="";
	
	menuItemsHtml+=templates.menuItemToc();
    
	if(typeof templates.quickNavPopup=="function"){
        contentPageHtml=contentPageHtml.replace(/{QUICKNAVMENU}/g, templates.quickNavPopup());
    }else{
        contentPageHtml=contentPageHtml.replace(/{QUICKNAVMENU}/g, "");
    }
    
    if(typeof templates.menuItemQuickNav=="function"){
        menuItemsHtml+=templates.menuItemQuickNav();
    }

    if(wbt.glossary.length>0)menuItemsHtml+=templates.menuItemGlossary();
    if(wbt.files.length>0)menuItemsHtml+=templates.menuItemFiles();
    menuItemsHtml+=templates.menuItemTools();
    
    contentPageHtml=contentPageHtml.replace(/{MENUITEMS}/g, menuItemsHtml);
    
    //content
    $("<div/>", {
        id: "contents",
        "data-role": "page",
		"data-theme": "a",
        "class": "ui-responsive-panel",
        html: contentPageHtml
    }).appendTo($("body"));
    content.container=document.getElementById("divcontent");
	
	$("#divcontent").css({
		minHeight:wbt.metadata.stageHeight,
		width: wbt.metadata.stageWidth,
		overflow: "hidden"
	});
	
	$("#sticky").bind("change", function(){
        switch($(this).val()){
			case "y":
				content.setTocPanelPref("sticky");
				content.closeTocPanel();
				content.openTocPanel();
				break;
			case "n":
				content.setTocPanelPref("closed");
				break;
		}
    });
    
    $("#tocPanelButton").bind("click", function(){
        if(content.tocPanelPref!="sticky"){
			content.stopModeration()
		}
		content.openTocPanel();
        content.setTocPanelPref("opened");
    });
    
    $("#tocPanel").bind("panelbeforeclose", function(e,ui){
        $("#tocPanelButton").
            buttonMarkup({
                icon: "arrow-r"
            }).
            unbind("click").
            on("click", function(){
                content.openTocPanel();
                content.setTocPanelPref("opened");
            });
    });
    
    $("#tocPanel").bind("panelbeforeopen", function(e,ui){
        $("#tocPanelButton").
            buttonMarkup({
                icon: "arrow-l"
            }).
            unbind("click").
            on("click", function(){
                content.closeTocPanel();
                content.setTocPanelPref("closed");
            });
    });
	
	$("#tocPanel").bind("panelopen", function(e,ui){
		if(content.tocPanelPref=="sticky"){
			content.alignModerationPanel();
		}
	});
    
	$("#tocPanel").bind("panelclose", function(e,ui){
		content.alignModerationPanel();
	});
	
    $("#tocPanel li").bind("click", function(){
        $("#tocPanel li").
            attr("data-theme", "c")
            .removeClass("ui-btn-up-a")
            .removeClass("ui-btn-hover-a")
            .addClass("ui-btn-up-c")
            .addClass("ui-btn-hover-c");
            
        $(this).
            attr("data-theme", "a")
            .removeClass("ui-btn-up-c")
            .removeClass("ui-btn-hover-c")
            .addClass("ui-btn-up-a")
            .addClass("ui-btn-hover-a");
			
		content.bounceOrigin="";
		content.jump($(this).attr("id").split("li")[1]);
    });
	
    var html="";
    
    //glossary
	if(wbt.glossary.length>0){
		for(var i=0;i<wbt.glossary.length;i++){
			html+=templates.glossaryItem();
			html=html.replace(/{ITEMID}/g,wbt.glossary[i].id);
			html=html.replace(/{ITEMTITLE}/g,decodeBase64(wbt.glossary[i].item));
		}
		
		html=templates.glossaryPage().replace(/{GLOSSARYITEMS}/g,html);
		
		$("<div/>", {
			id: "glossary",
			"data-role": "page",
			"data-theme": "b",
			html: html
		}).appendTo($("body"));
	}
	
		
    //files
    if(wbt.files.length>0){
		html="";
		for(var i=0;i<wbt.files.length;i++){
			html+=templates.filesItem();
			html=html.replace(/{ITEMID}/g,wbt.files[i].id);
			html=html.replace(/{PAGEID}/g,wbt.files[i].page);
			html=html.replace(/{ICON}/g,wbt.files[i].icon);
			html=html.replace(/{ITEMTITLE}/g,decodeBase64(wbt.files[i].caption));
		}
		
		html=templates.filesPage().replace(/{FILES}/g,html)
		
		$("<div/>", {
			id: "files",
			"data-role": "page",
			"data-theme": "b",
			html: html
		}).appendTo($("body"));
	}
	
    //about program
    html = "<table cellspacing='4' cellpadding='4' border='0'>" +
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
					"<span id='cKeywords'>Stichworte</span>" +
					"<ul>";
						for(var i=0;i<arr.length;i++){
							html+="<li>" + arr[i] + "</li>";
						}
		html+="" +
					"</ul>" +
				"</td>" +
			"</tr>";		
	}
    switch(wbt.metadata.language){
        case "_de":
			html += "<tr><td width='30%'><span id='cDate'>Stand</span>:</td><td width='70%'>" + decodeBase64(wbt.metadata.releaseDate) + "</td></tr>" +
				"<tr><td><span id='cID'>Produktcode</span>:</td><td>" + wbt.metadata.id + "</td></tr>" +
				"<tr><td><span id='cTypicalLearningTime'>vorgeschlagene Lernzeit</span>:</td><td>" + decodeBase64(wbt.metadata.typicalLearningTime) + "</td></tr>";
			break;
		case "_en":
			html += "<tr><td width='30%'><span id='cDate'>Release date</span>:</td><td width='70%'>" + decodeBase64(wbt.metadata.releaseDate) + "</td></tr>" +
				"<tr><td><span id='cID'>Product code</span>:</td><td>" + wbt.metadata.id + "</td></tr>" +
				"<tr><td><span id='cTypicalLearningTime'>Typical learning time</span>:</td><td>" + decodeBase64(wbt.metadata.typicalLearningTime) + "</td></tr>";
			break;
	}
    
    if(typeof gender!="undefined"){
        html+="<tr><td colspan='2'>"+ gender.title + "</td></tr>" +
            "<tr><td colspan='2'>"+ gender.content + "</td></tr>";
    }
    
    html+="</table>";
    
    html=templates.aboutPage().replace(/{CONTENT}/g,html)
    
    $("<div/>", {
        id: "about",
        "data-role": "page",
		"data-theme": "b",
        html: html
    }).appendTo($("body"));
   
    //imprint
	var html="";
	if(defaultSettings.imprint.overrideMetadata){
		var lng=wbt.metadata.language;
		lng=lng.replace(/_/g, "");
		
		html+="<table>";
		for(var i=0; i<defaultSettings.imprint.items.length; i++){
			var item=defaultSettings.imprint.items[i];
			if(typeof item.title=="object"){
				html+="<tr>" +
					"<td style='padding:10px;' valign='top'>" +
						item.title[lng] + 
					"</td>" +
					"<td style='padding:10px;' valign='top'>" +
						item.html[lng] + 
					"</td>" +
				"</tr>";
			}
		}
		html+="</table>";
	}else{
		html=decodeBase64(wbt.metadata.imprint)
	};
	
	html=html.replace(/{YEAR}/g, new Date().getFullYear());   
    html = templates.imprintPage().replace(/{CONTENT}/g, html);
    
    $("<div/>", {
        id: "imprint",
        "data-role": "page",
		"data-theme": "b",
        html: html
    }).appendTo($("body"));

    $("<div/>", {
        id: "atomFullsize",
        "data-role": "page",
		"data-theme": "b",
        html: templates.atomFullsize()
    }).appendTo($("body"));
	
	if ($.isArray(wbt.facts) && typeof randomFacts=="object") {
		randomFacts.init();
	}

    //page creation done...
	
	if(typeof mobileCustomPageCreated=="function"){
		mobileCustomPageCreated();
	}
	
    content.onPagesCreated();
};

content.closeTocPanel = function () {
    $("#tocPanel").panel("close");
};

content.openTocPanel = function () {
	if(content.tocPanelPref=="sticky"){
		var widthAvailable=$(window).width()-$("#divcontent").width();
		
		if($("#moderationPanel").is(":visible") && $("#moderationPanel").offset().top>wbt.metadata.stageHeight){
			if(widthAvailable<(320+250)){
				content.closeModerationPanel();
			}else{
				widthAvailable-=250;
			}
		};
		
		if(widthAvailable<320){
			content.setTocPanelPref("closed");
			content.openTocPanel();
			return;
		};	
		
		$("#tocPanel.ui-panel").css({
			maxWidth: "320px",
			width: widthAvailable + "px"
		});

		$("#tocPanel").panel({
			display: "reveal",
			dismissible: false
		});		
		
	}else{
		$("#tocPanel").panel({
			display: "overlay",
			dismissible: true
		});
		
		//$("#tocPanel.ui-panel").css({
		//	width: parseInt($(window).width()*0.66)+"px",
		//	maxWidth: "550px"
		//});
	}

	if(wbt.metadata.orientation=="landscape"){
		//$("#stickySwitch").show();
		$("#stickySwitch").hide();
	}else{
		$("#stickySwitch").hide();
	}
	
	content.updateTocBookmarks();

    $("#tocPanel").panel("open");
};

content.autoShowHidePanels=function(){
	if(typeof content.activePage.id=="undefined")return;
	
	var minWidth=wbt.metadata.stageWidth+$("#tocPanel").width();
	switch(wbt.metadata.orientation){
		case "landscape":
			if ($(window).width() > minWidth && (content.tocPanelPref=="opened" || content.tocPanelPref=="sticky")) {
				content.openTocPanel();
			}
			if ($(window).width() < minWidth || content.tocPanelPref=="closed") {
				content.closeTocPanel();
			}
		
			if($(window).width()>=minWidth){
				$("#stepnav").show("fast");
			}else{
				$("#stepnav").hide("fast");
			}
			
			break;
		case "portrait":

			//if(matchMedia('only screen and (min-width: 480px)').matches){}
			content.setTocPanelPref("closed");
			content.closeTocPanel();
			$("#stepnav").hide("fast");
			break;
	};
	content.alignModerationPanel();
	
}

content.showModerationPanel = function () {

	$("#jp-text").hide();
	$("#jp-notext").show();	
	
    content.alignModerationPanel();
	$("#moderationPanel").fadeIn();
}

content.alignModerationPanel = function(){
	var pos="bottom";
	
	if($(window).width()>=(wbt.metadata.stageWidth+300)){
		pos="right";
	}
	
	if(content.tocPanelPref=="sticky"){
		if(($(window).width() - ($("#divcontent").offset().left + $("#divcontent").width())) >250){
			pos="right";
		}else{
			pos="bottom";
		}
	}
	
	switch(pos){
		case "right":
			$("#moderationPanel").css({
				overflow: "hidden",
				width: "auto",
				maxWidth: "500px",
				minHeight: $("#blockNav").length>0 ? (wbt.metadata.stageHeight-20)+"px" : wbt.metadata.stageHeight+"px",
				top: $("#blockNav").length>0 ? "20px" : "auto"
			}).removeClass("horizontal")
			.addClass("vertical");
			break;
		case "bottom":
			$("#moderationPanel").css({
				overflow: "auto",
				maxWidth: "none",
				width: "100%",
				minHeight: "6em"
			}).removeClass("vertical")
			.addClass("horizontal");
			break;
	}
}

content.closeModerationPanel = function () {
	$("#moderationPanel").fadeOut("slow");
	
	$("#jp-text").show();
	$("#jp-notext").hide();
}

content.getPageById=function(pageId){
    var o=null;
	for(var i in wbt.structure){
        for (var j in wbt.structure[i].items) {
            if(typeof wbt.structure[i].items[j] == "object"){
                if(wbt.structure[i].items[j].id == pageId){
					o = wbt.structure[i].items[j];
                }
            }
        }
    }
    return o;
};

content.setActivePageById=function(pageId){
    for(var i in wbt.structure){
        for (var j in wbt.structure[i].items) {
            if(typeof wbt.structure[i].items[j] == "object"){
                if(wbt.structure[i].items[j].id == pageId){
					content.activePage = wbt.structure[i].items[j];
                }
            }
        }
    }
    return content.activePage;
};

content.getActiveBlockIndex=function(pageId){
    for(var i in wbt.structure){
        for (var j in wbt.structure[i].items) {
            if(typeof wbt.structure[i].items[j] == "object"){
                if(wbt.structure[i].items[j].id == pageId){
                    return i;
                }
            }
        }
    }
    return 0;
}

content.getActiveBlockTitle=function(pageId){
    for(var i in wbt.structure){
        for (var j in wbt.structure[i].items) {
            if(typeof wbt.structure[i].items[j] == "object"){
                if(wbt.structure[i].items[j].id == pageId){
                    return decodeBase64(wbt.structure[i].title);
                }
            }
        }
    }
    return 0;
}

content.getPreviousPageId=function(pageId){
    for(var i=0;i<content.pageIds.length;i++){
        if(content.pageIds[i]==pageId){
            if(i>0){
                return content.pageIds[i-1]
            }else{
                return 0;
            }
        }
    }
    return 0;
};

content.getNextPageId=function(pageId){
    for(var i=0;i<content.pageIds.length;i++){
        if(content.pageIds[i]==pageId){
            if(typeof content.pageIds[i+1]=="string"){
                return content.pageIds[i+1];
            }else{
                return 0;
            }
        }
    }
    return 0;
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
    
	if(content.tocPanelPref=="opened"){
		content.closeTocPanel();
	}

	if(typeof getPermissionToJump=="function"){
		if(!getPermissionToJump())return;
	}
	
	content.killIntervals();
	
    content.stopModeration();
    
    switch(true){
        case(content.innerNavActive_back&&direction==1):
            this.cycleBack();
            return;
        case(content.innerNavActive_fwd&&direction==2):
            this.cycleForth();
            return;
        case(typeof direction=="undefined"):
            break;
        case(direction==0):
            break;
        case(direction==99):
            break;
    }
    
    if((direction==2 && this.nextPageId==0) || url=="end"){
        content.dynaPopup("type:base64","content:"+encodeBase64("<p>" + eval("mpEndMsg"+wbt.metadata.language) + "</p>"));
        return;
    }
    
    if((direction==1 && this.previousPageId==0) || url=="start"){
        content.dynaPopup("type:base64","content:"+encodeBase64("<p>" + eval("mpStartMsg"+wbt.metadata.language) + "</p>"));
        return;
    }
    
    var steps=this.activePage.steps;
    
    //Empty page, no steps
    if(steps.length==0){
        content.setStatus("browsed");
        $("divcontent").html("<h1>This page is empty.</h1>");
        switch(url){
            case "next":content.setActivePage(content.nextPageId);break;
            case "prev":content.setActivePage(content.previousPageId);break;
            default:content.setActivePage(url);
        }
        return;
    }
    
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
            $("#divstep"+steps[this.activeStep].id).fadeOut(500,
                function(){
                    content.setActivePage(url);
                }
            );
    }
}

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
}

content.updateNav=function(){
    var steps=this.activePage.steps,
		htmlDots="",
		visibleSteps=0,
		lastVisibleStep=0;
    
	for(var i=0;i<steps.length;i++){
		
		if(typeof steps[i].display!="undefined"){
			if(steps[i].display=="visible"){
				visibleSteps++;
				lastVisibleStep=i;
			}
		}else{
			visibleSteps++;
			lastVisibleStep=i;
		};		
		
		switch(true){
			case(i==this.activeStep):
				htmlDots+=templates.paginationDotsActive();
				break;
			case(i<this.activeStep):
				htmlDots+=templates.paginationDotsCompleted();
				break;
			case(i>this.activeStep):
				htmlDots+=templates.paginationDotsIncomplete();
				break;
		}
	};

	if(steps.length==1){
		htmlDots="";
	};
	
	$("#stepnav").html(htmlDots);
	
	$.each($("#stepnav img"), function(i,o){
		$(this)
			.unbind("click")
			.bind("click",function(){
				content.setStep(i);
			})
			.css({
				cursor: "pointer"
			});
	});
    
    content.innerNavActive_back=true;
    content.innerNavActive_fwd=true;
    
    if(this.activeStep==0){
        content.innerNavActive_back=false;
    }
	
	if(visibleSteps<2){
		content.innerNavActive_back=false;
		content.innerNavActive_fwd=false;
		$("#stepnav").hide();
		content.setStatus("browsed");
	}else{
		$("#stepnav").show("fast");
	}
    
    if(this.activeStep==(steps.length-1) || this.activeStep>=lastVisibleStep){
        content.innerNavActive_fwd=false;
        content.setStatus("browsed");
    }
}

content.setStatus = function(s){
    var status="", score=0;
    switch(s){
		case "reset":
			status="not attempted";
			$("#li"+content.activePage.id+ " img.statusImg").attr("src",custom+"shared/images/icon_ueb.png");
			score=0;
			break;
		case "browsed":
			status="completed";
			score=content.activePage.maxScore;
			$("#li"+content.activePage.id+ " img.statusImg").attr("src",custom+"shared/images/icon_"+s+".png");
			break;			
		case "passed":
			status=s;
			score=content.activePage.maxScore;
			$("#li"+content.activePage.id+ " img.statusImg").attr("src",custom+"shared/images/icon_"+s+".png");
			break;
		case "failed":
            if(interactions.getLessonMode()=="profiling"){
				content.setStatus("browsed");
			}else{
				status=s;
				$("#li"+content.activePage.id+ " img.statusImg").attr("src",custom+"shared/images/icon_"+s+".png");
			}
			break;
        default:
            status="incomplete";
			break;
    }

	this.activePage.status=status;
	this.activePage.score=score;
	scorm.updateSessionData(this.activePage.id, {
		"status": status,
		"score": score
	});
	content.updateTocBubbles();
	
	if(typeof content.blockNavigation!="undefined"){
		content.blockNavigation.update();
	}	
	
}

content.setActivePage=function(id){
    if(id=="start"){
		id=wbt.structure[0].items[0].id;
		if(scorm.resumePageId!=""){
			this.setActivePageById(scorm.resumePageId);
			if(this.activePage){
				id=scorm.resumePageId;
				if(this.tocPanelPref=="sticky"){
					content.openTocPanel();
				}
			}else{
				this.setActivePageById(id);
			}
		}else{
			this.setActivePageById(id);
		}
    }else{
		this.setActivePageById(id);
	};	
	
    this.previousPageId=this.getPreviousPageId(id);
    this.nextPageId=this.getNextPageId(id);
    this.activeBlock=this.getActiveBlockIndex(id);
    
    if(this.activePage){
        this.resetPage();
        this.initPage();
    }
    
    $("#tocPanel li")
        .attr("data-theme", "c")
        .removeClass("ui-btn-up-a")
        .removeClass("ui-btn-hover-a")
        .addClass("ui-btn-up-c")
        .addClass("ui-btn-hover-c");
            
    $("#li"+id).
        attr("data-theme", "a")
        .removeClass("ui-btn-up-c")
        .removeClass("ui-btn-hover-c")
        .addClass("ui-btn-up-a")
        .addClass("ui-btn-hover-a");
    
    $("#block"+this.activeBlock).trigger("expand");
};

content.resetPage=function(){
    content.innerNavActive_back=false;
    content.innerNavActive_fwd=false;
    content.activeStep=0;
    $("#aNavNext").pulse("destroy");
    $(".divstep").each(function(index) {
        $(this).remove();
    });
}

content.initPage = function () {

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

	var blockTitle=content.getActiveBlockTitle(this.activePage.id);

	if(this.activePage.title == blockTitle){
		$("#pageTitle").html(decodeBase64(this.activePage.title));
	}else{
		$("#pageTitle").html(blockTitle+": "+decodeBase64(this.activePage.title));
	}
	
	if(typeof content.blockNavigation!="undefined"){
		this.blockNavigation.init();
	};	

    //delBookmarkById(content.getPageNumberById(this.activePage.id)+"-q");

    var steps = this.activePage.steps;
    if (steps.length == 0) return;

    if (this.activePage.template == "questionnaire" || this.activePage.template == "assessment") {
        if (steps[steps.length - 1].id != "result") steps.push({
            id: "result"
        });
    };

    $("#aNavNext").unbind("click");
    $("#aNavPrev").unbind("click");
    $("#aNavNext").pulse("destroy");

    if (content.nextPageId != 0) {
        $("#aNavNext").on("click", function () {
            content.jump("next", 2);
        });
    } else {
        $("#aNavNext").on("click", function () {
            content.jump("end", 2);
        });
    };

    if (content.previousPageId != 0 || steps.length > 1) {
        $("#aNavPrev").click(function () {
            content.jump("prev", 1);
        });
    } else {
        $("#aNavPrev").click(function () {
            content.jump("start", 1);
        });
    }

    if (steps.length == 1) {
        setTimeout(function(){
			content.setStatus("browsed");
		},defaultSettings.timeUntilBrowsed);
    }

	$("#stepnav").html("");
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
    $.each(steps, function (i, step) {
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
		
        html = checkCompatibility(html);

        $("<div/>", {
            id: "divstep" + step.id,
            "class": "divstep",
            "css": {
                width: "100%"
            },
            html: html
        }).appendTo("#" + content.container.id);
		
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

		$("#contents").page("destroy").page();

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
	
	$("#divcontent input").button();

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
		}).prependTo($("#divcontent"));
		
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

content.updateTocBubbles=function(){
    var pId=content.activePage.id;
    var block=wbt.structure[content.activeBlock];
	if(typeof block=="object"){
		var pages=getJsonObjects(block, "template", "multipage", true),
			numPagesRemaining=0;
		for(var j in pages) {
			if(typeof pages[j]=="object"){
				switch(pages[j].status){
					case "failed":
					case "incomplete":
					case "not attempted":
						numPagesRemaining++;
						break;
					default:
				};
			}
		};
		$("#bubbleblock"+content.activeBlock).html(""+numPagesRemaining);
    };
}

content.setBookmark=function(pageId){
	for(var i in wbt.structure){
        for(var j in wbt.structure[i].items) {
            if(typeof wbt.structure[i].items[j] == "object"){
				var page=wbt.structure[i].items[j];
				if(pageId==page.id){
					if(page.bookmark==0){
						page.bookmark=1;
					}else{
						page.bookmark=0;
					};
					scorm.updateSessionData(page.id, {
						bookmark: page.bookmark
					});
					content.updateTocBookmarks();
					return;
				}				
            }
        }
    };
}

content.updateTocBookmarks=function(){
	for(var i in wbt.structure){
        for(var j in wbt.structure[i].items) {
            if(typeof wbt.structure[i].items[j] == "object"){
				var page=wbt.structure[i].items[j];
				if(page.bookmark==0){
					$("#bm"+page.id+" .ui-btn-inner").html(templates.bookmarkUnset());
				}else{
					$("#bm"+page.id+" .ui-btn-inner").html(templates.bookmarkSet());
				}
            }
        }
    };
}

content.killIntervals=function(){
	try{
		clearTimeout(content.timeout);
		if($(".jsMovieFrame").length>0){
			$(".jsMovieFrame").parent().jsMovie("destroy");
		}

	}catch(e){};
}

content.quit=function(){
	scorm.exitSession();
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
	};
	
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
    }else{
		$("#stepnav").html("");
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
				
				var map=$("<map/>", {
					id: "bounceMap",
					name: "bounceMap",
					"data-successor": wbt.structure[0].items[0].id
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
										$("#atomFullsizeHeader").html("");
										$("#atomFullsizeContent").html(
											"<div id='elpsAnimation'></div>" +
											"<div style='padding: 10px;'>" +
												"<a id='animationPlay' data-role='button' data-theme='b' data-inline='true' href='javascript:void(0);'>Start</a> " +
												"<a id='animationStop' data-role='button' data-theme='b' data-inline='true' href='javascript:void(0);'>Stop</a> " +
												"<a id='animationPause' data-role='button' data-theme='b' data-inline='true' href='javascript:void(0);'>Pause</a> " +
											"</div>"
										);
												
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
											$("#elpsAnimation").html("<b>Keine Bilder für Animation gefunden.</b>");
										}
										
										content.doMenuCommand("atomFullsize");
										
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
							
							area.bind("click", function(){
								$.each(step.overlays, function(x,overlay){
									if(typeof overlay.trigger!="undefined"){
										if(overlay.trigger==hotspot.props.trigger){
											content.dynaPopup(
												"type:base64",
												"content:"+overlay.html
											);
										}
									}
								});								
							});							
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
										
										$("#atomFullsizeHeader").html("");
										$("#atomFullsizeContent").html(
											"<div " +
												"id='elpsTimeline' " +
												"style='max-width:" + ($(window).width()-30) + "px; max-height:" + ($(window).height()-75) +  "px;'" +
											"></div>"
										);
										
										content.doMenuCommand("atomFullsize");
										
										setTimeout(function(){
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
												$("#elpsTimeline").html("<b>Keine Daten für Timeline gefunden.</b>");
											}
										}, 2000);
										
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
								title: (wbt.metadata.language == "_de" ? "Hier klicken, um den Video-Player zu öffnen" : "Tap here to open the video player"),
								coords: coords
							}).appendTo(map);
							
							area.bind("click", function(){
								createDynaPopup(
									"type:video",
									"file:" + hotspot.file,
									"supplied:" + (hotspot.supplied != "" ? hotspot.supplied : "m4v,ogv"),
									"solution:" + (hotspot.solution != "" ? hotspot.solution : "flash,html"),
									"width:" + hotspot.width,
									"height:" + hotspot.height,
									"cssClass:" + (hotspot.cssClass != "" ? hotspot.cssClass : "270p")
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
	};	
    
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
			
    }
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
    var moderationTrigger=1;
	var stepId=this.activePage.steps[content.activeStep].id;
	$("#divstep"+stepId).css({clear:"right"});

	//Animator
	if($("#divstep"+stepId+" .flipbook").find("#movie").length>0){
		var elm=$("#divstep"+stepId+" .flipbook").find("#movie");
		
		var s=elm.data("filespec");
		var from=elm.data("from");
		var to=elm.data("to");
		
		elm.jsMovie({
			images : [],
			sequence : s+"#.jpg",
			from: from,
			to: to,
			folder : relpath+"images/",
			height : 381, width: 675,
			grid: { 
				width:675, 
				height:381, 
				columns:1,
				rows:1
			},
			fps:6,
			playOnLoad : true
		});
		
		$("#play").click(function(){
			elm.jsMovie("play");
		});
	
		$("#stop").click(function(){
			elm.jsMovie("stop");
		});
	
		$("#pause").click(function(){
			elm.jsMovie("pause");
		});
	}
	
	//Bounce Map
	if($(".bounceImage").length>0){
		var topicsRemaining=0;
		$(".bounceImage").maphilight();
		$("#divstep"+stepId+" .bounce").each(function() {
			switch(content.getPageById($(this).attr("data-target")).status){
				case "failed":
				case "incomplete":
                case "not attempted":
					topicsRemaining++;
					break;
				case "passed":
				case "completed":
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
	
	//Tooltips
	$("#divstep"+stepId+" .tooltip").each(function() {
		var html=$(this).attr("title");
		
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
		
		$(this).on("click", function(){
			content.dynaPopup("type:base64","content:"+encodeBase64(html));
		});
	});
	
	//profile
	if($("#divstep"+stepId+ " .rating").length>0){
		if(typeof interactions.showRating=="function"){
			interactions.showRating();
		}
	};
	
	if(typeof interactions.blockTest != "undefined"){
		interactions.stepShown(stepId);		
	};	
	
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

content.reflections=new Array();
content.initReflection=function(){
	var stepId=content.activePage.steps[content.activeStep].id;
	
	//reset, wenn mehrere refl. auf einer seite und zurückgesprungen wird
	$("#divstep"+ stepId).find("script").remove();
	$("#reflection"+stepId).remove();
	
	$("<script/>", {
		html: $("#reflection_json"+stepId).html()
	}).appendTo($("#divstep"+ stepId));
	
	var js=content.reflections[stepId];
	var template="" +
		"<div class='questionText'>{INTRO}</div>" +
		"<div style='padding:10px;'>" +
			"{IMAGE}" +
			"<div>" +
				"<div class='description'>" +
					"<div>{DESCRIPTION}</div>" +
				"</div>" +
				"<div class='todo'>{TODO}</div>" +
			"</div>" +
		"</div>" +
		"<div style='clear:both;'></div>" +
		"<hr class='questionSeparator' />" +
		"<div class='questionFooter' data-role='controlgroup' data-type='horizontal'></div>";
	
	var imgTemplate="" +
		"<img src='{SRC}' style='float:right;padding:10px;' />";
	
	var imgHtml="";
	if(js.image.src!=""){
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
		$("<a/>", {
			href: "javascript:void(0);",
			"data-theme": "b",
			"data-role": "button",
			html: item.button,
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
	$("#contents").page("destroy").page();
	return;
}

content.solveReflection=function(args){
	content.stopModeration();
	var stepId=content.activePage.steps[content.activeStep].id;
	
	if(typeof args[1]!="undefined"){
		if(args[1]=="replace"){
			$("#divstep"+ stepId + " .description").html("");
		}
	}
	
	$("<div/>", {
		html: decodeBase64(args[0])
	}).hide()
		.appendTo("#divstep"+ stepId + " .description")
		.fadeIn(1000);
	
	$("#divstep"+ stepId + " .questionSeparator").hide();
	$("#divstep"+ stepId + " .todo").hide();
	$("#divstep"+ stepId + " .questionFooter").hide();
}


content.moderate=function(trigger){
    var moderations=this.activePage.steps[this.activeStep].moderations;
    if(typeof moderations=="undefined"){
        return;
    }

    if(moderations.length==0 || trigger==0){
        $("#audioPlayerControls").hide();
        $("#moderationContainer").fadeOut(function(){
			$(this).html("");
		});
        return;
    }else{
        $("#audioPlayerControls").show("fast", function(){
            var gotcha=false,
				play=true;
            $.each(moderations, function(i, moderation) {
                if(moderation.trigger=="intro"){
					trigger="intro";
				};
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
	
							if(device.android() && !isChrome){
								myAndroidFix.setMedia(media);
								if(scorm.getPreference("audioEnabled")){
									myAndroidFix.play();
								}
							}else{
								$("#jplayer_audio")
									.jPlayer("setMedia", media)
									.jPlayer(scorm.getPreference("audioEnabled") ? "play" : null);
							}
							content.activeModeration=moderation.id;
							
							$("#moderationContainer").fadeOut(function() {
								$(this).html(decodeBase64(moderation.html))
							}).fadeIn();
							
						},500);
					}
                }
            });
            
            if(gotcha){
				if(content.moderationPanelPref=="opened")content.showModerationPanel();
			}else{
				$("#audioPlayerControls").hide();
				$("#moderationContainer").fadeOut(function(){
					$(this).html("");
				});
			};         
        });
    };
};

content.stopModeration=function(){
    $("#jplayer_audio").jPlayer("pause");
};

content.moderationStop=function(){
    $("#jplayer_audio").jPlayer("pause");
};

content.releaseAudio=function(){
	isChrome = navigator.userAgent.indexOf("Chrome") > -1;
	if(device.android() && !isChrome){ 
	    var media = {
            mp3:custom+"shared/sounds/jingle.mp3"
        };    
        var options = {};
        myAndroidFix = new jPlayerAndroidFix("#jplayer_audio", media, options);
        myAndroidFix.setMedia(media).play();
    }else{
        $("#jplayer_audio")
            .jPlayer("setMedia", {
                mp3: custom+"shared/sounds/jingle.mp3"
            }).jPlayer("play");
    }
    $.mobile.loading("show");
    $("#splashContainer").fadeTo("slow", 0.5);
	
	content.getHelpItems();
};

content.openPDF=function(file){
	if((window.parent)&&(window.parent!=window)){
		parent.open(getAbsolutePath(file));
	}else{
		window.open(file);
	}
};

content.getHelpItems=function(){
	$.ajax({
		url:"files/photocredits.pdf",
		type:"HEAD",
		error:
			function(){
				$("#menuItemWbtPhotoCredits").remove();
			},
		success:
			function(){
				$("#menuItemWbtPhotoCredits a").bind("click", function(){
					content.stopModeration();
					content.openPDF("files/photocredits.pdf");
					$("#popupMenu").popup("close");
				})
			}
	});
	
	$.ajax({
		url:"files/help-mobile.pdf",
		type:"HEAD",
		error:
			function(){
				if(typeof defaultSettings.helpURL == "undefined"){
					$("#menuItemHelp").remove();
				}else{
					$.ajax({
						url:defaultSettings.helpURL.mobile,
						type:"HEAD",
						error:
							function(){
								$("#menuItemHelp").remove();
							},
						success:
							function(){
								$("#menuItemHelp a").bind("click", function(){
									content.stopModeration();
									content.openPDF(defaultSettings.helpURL.mobile);
									$("#popupMenu").popup("close");
								})
							}
					});
				};
			},
		success:
			function(){
				$("#menuItemHelp a").bind("click", function(){
					content.stopModeration();
					content.openPDF(defaultSettings.helpURL.mobile);
					$("#popupMenu").popup("close");
				})
			}
	});
};

content.doMenuCommand=function(cmd){
    switch(cmd){
        case "atomFullsize":
            content.stopModeration()
            content.showPage(cmd);
            break;
        case "files":
            content.stopModeration()
            
            $("#filesList li")
				.attr("data-theme", "c")
				.removeClass("ui-btn-up-a")
				.removeClass("ui-btn-hover-a")
				.addClass("ui-btn-up-c")
				.addClass("ui-btn-hover-c");

            $("#filesList .fi"+content.activePage.id)
				.attr("data-theme", "a")
				.removeClass("ui-btn-up-c")
				.removeClass("ui-btn-hover-c")
				.addClass("ui-btn-up-a")
				.addClass("ui-btn-hover-a");
            
            content.showPage(cmd);
            break;
        
		case "glossary":
			content.stopModeration();
            content.showPage(cmd);
            $(".ui-input-search")
				.removeClass("ui-body-c")
				.addClass("ui-body-b");
            break;			
			
		default:
            $("#popupMenu").popup("close");
            content.stopModeration();
            content.showPage(cmd);
            break;
    }
};

//DynaPopup
content.dynaPopup = function(a,b){
    var ptype="",pcontent="",pcaption="",pwidth=0,pheight=0,fullsize=false,tooltip=false,origin="",onclose="";
    var args=content.dynaPopup.arguments;
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
			case "tooltip":   
                tooltip=arg[1]=="true"?true:false;
                break;
			case "origin":   
                origin=arg[1];
                break;
			case "onclose":
				onclose=arg[1];
                break;
        }
    }    
    
    switch(ptype){
        case "video":
			content.writeVideoOverlay.apply(this, arguments);
			return;
        case "atom":
            var atomData = typeof(content.activePage.steps[content.activeStep].atoms) == "undefined" ? content.activePage.atoms : content.activePage.steps[content.activeStep].atoms;
            
            for(var i=0;i<atomData.length;i++){
                if(atomData[i].id==pcontent){

                    var html=unescape(decodeBase64(atomData[i].content));
                    
					if(atomData[i].caption!=""){
						html="<h3>"+decodeBase64(atomData[i].caption)+"</h3>" + html;
					};
					
                    pwidth=(atomData[i].width>0) ? atomData[i].width : "auto";
                    pheight=(atomData[i].height>0) ? atomData[i].height : "auto";
    
                    if(html.substring(0,11)=="<div style="){
                        var endPos=html.indexOf(";\">");
                        var style=html.substring(12, endPos).split(";");
                        for(var i=0;i<style.length;i++){
                            var val=style[i].split(":")[1];
                            switch(style[i].split(":")[0]){
                                case "width":
                                    if(val=="100%"){
                                        fullsize=true;
                                    }else{
                                        pwidth=val;
                                    }
                                    break;
                                case "height":
                                    pheight=val;
                                    break;
                            }
                        }
                    }
                    break;
                }
            }
            break;
        case "base64":
            var html="<h3>"+pcaption+"</h3><div>"+decodeBase64(pcontent)+"</div>";
            break;
    }
    
    html=html.replace(/{RELPATH}/g, wbt.metadata.relpath);
    
	if(tooltip && origin!=""){
		
		html = templates.dynaPopup().replace(/{CONTENT}/g,html);
        $.mobile.activePage.append(html).trigger("create");
		
		var popup = setInterval(function(){
			$.mobile.activePage.find(".dynaPopup").popup({
				beforeposition: function( event, ui ) {
					$(".dynaPopup div")
						.css({
							"max-width": "500px"
						});
				},
				afteropen: function () {
					return false;
				},
				afterclose: function () {
						var fn=new Function(onclose);
						fn.call(this);
						
						$(this)
							.unbind("afterclose")
							.unbind("beforeposition")
							.remove();
					}
				}).popup("open", {
					transition: "pop",
					positionTo: origin
				});
		    clearInterval(popup);
		},1);
		
	}else if(fullsize){
		
        $("#atomFullsizeHeader").html(pcaption);
        $("#atomFullsizeContent").html(html);
        content.doMenuCommand("atomFullsize");
		
    }else{
        html = templates.dynaPopup().replace(/{CONTENT}/g,html);
        $.mobile.activePage.append(html).trigger("create");

		var popup = setInterval(function(){
			$.mobile.activePage.find(".dynaPopup").popup({
				beforeposition: function( event, ui ) {
					$(".dynaPopup div").first().css({
						width: pwidth,
						"min-width": "500px"
					});
					var wrapMaxY=$(window).height() - 120 + "px";
					if(pheight>=wrapMaxY)html="<div style='overflow-y:scroll;height:"+wrapMaxY+"px'>"+html+"</div>";
					pheight=parseInt(pheight)>0?pheight+"px":"auto";
					$(".dynaPopup div").first().css({
						height: pheight, 
						"min-height": "250px"
					});
				},
				afteropen: function () {
					return false;
				},
				afterclose: function () {
						$(this)
							.unbind("afterclose")
							.unbind("beforeposition")
							.remove();
					}
				}).popup("open", {
					transition: "pop",
					positionTo: "window"
				});
		    clearInterval(popup);
		},1);
		
    }
}

content.writeVideoOverlay=function(a){
	var args=content.writeVideoOverlay.arguments;
	if(a.constructor==Array)args=a;
    
    content.stopModeration();
	
	var file,supplied="flv",solution="flv",width=480,height=320,cssClass="270p",caption="",poster=custom+"shared/images/videopreview.jpg";
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
				poster=poster.replace(/{RELPATH}/g, wbt.metadata.relpath)
				break;
		}
	};
	
    var html=templates.dynaPopup().replace(/{CONTENT}/g,"<p>"+caption+"</p><div id='videoOverlay'></div>");
    $.mobile.activePage.append(html).trigger("create");
    $.mobile.activePage.find(".dynaPopup").popup({
        beforeposition: function( event, ui ) {
            $(".dynaPopup div").css({
                width: width+20+"px",
                minWidth: "400px",
                height: height+50+"px",
                minHeight: "400px"
            });
        },
        afteropen: function(){
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
        afterclose: function () {
                $("#jplayer_video").jPlayer("destroy");
                $(this)
                    .unbind("afterclose")
                    .unbind("beforeposition")
                    .remove();
            }
        }).popup("open", {
            "transition": "fade"
        });
}

content.showPage=function(id){
	//jqm 1.4 $(":mobile-pagecontainer").pagecontainer("change", "#page", { options });
    $.mobile.changePage("#"+id, {
        transition: "slide"
    });
}

content.hidePage=function(){
	
	$("#atomFullsizeHeader").html("");
	$("#atomFullsizeContent").html("");
	
    $.mobile.changePage("#contents", {
        transition: "slide",
        reverse: true
    });
}

glossary.showItem=function(id){
    for(var i=0;i<wbt.glossary.length;i++){
        if(wbt.glossary[i].id==id){
            $("#glossaryItemContainer").html(decodeBase64(wbt.glossary[i].text));
            $("#glossaryItemContainer").trigger("updatelayout");
            $("#itemPanelGlossary").panel("open");
        }
    }
}

files.showItem=function(id){
    for(var i=0;i<wbt.files.length;i++){
        if(wbt.files[i].id==id){
            var href=wbt.files[i].href;
            href=href.replace(/{RELPATH}/g, wbt.metadata.relpath);
            
			switch(wbt.files[i].target){
				case "internal":
					content.dynaPopup("type:base64","content:"+wbt.files[i].href,"caption:"+wbt.files[i].caption,"fullsize:true");
					break;
				default:
					if(parent){
						parent.open(getAbsolutePath(href));
					}else{
						window.open(href);
					}
					break;
			}
            return;
        }
    }
}

var callFilefromDocubox=function(id){
	files.showItem(id);
}

/* Interactions */
/* ------------ */
interactions.activeInteraction=new Object();
interactions.activeInteractionType="";
interactions.containerId="";
interactions.init=function(step){
	this.activeInteraction=step.interaction[0];
	this.activeInteractionType=this.activeInteraction.type.replace("-", "");
	this.containerId="#divstep"+content.activePage.steps[content.activeStep].id;

	switch(this.lessonMode){
		case "profiling":
		case "distributedAssessment":
		case "distributedSelfTest":
			if(!interactions.getGo()){
				$("#contents").page("destroy").page();
				return;
			}
			break;
		default:
			break;
	};
	
	if(typeof interactions.blockTest != "undefined"){
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
	
	$(interactions.containerId+" .interactionBtnHelp").bind("click", function(){
		content.dynaPopup(
			"type:base64",
			"content:"+encodeBase64(interactions[interactions.activeInteractionType].getHelp())
		)
	});
	
	$(interactions.containerId+" .interactionBtnEvaluationHelp")
		.bind("click", function(){
			content.dynaPopup(
				"type:base64",
				"content:"+encodeBase64(interactions[interactions.activeInteractionType].getEvaluationHelp())
			)
		});
	
	$(interactions.containerId+" .interactionBtnAssistance")
		.bind("click", function(){
			content.dynaPopup(
				"type:base64",
				"content:"+encodeBase64(interactions[interactions.activeInteractionType].getAssistanceInfo()),
				"tooltip:true",
				"origin:.interactionInfoBox",
				"onclose:interactions.hideAssistance()"
			);
			interactions.showAssistance();
		})
		.hide();
	
	$(interactions.containerId+" .interactionBtnHint")
		.bind("click", function(){
			content.dynaPopup(
				"type:base64",
				"content:"+interactions.activeInteraction.hint
			);
		});

	$(interactions.containerId+" .interactionBtnEvaluate")
		.bind("click", function(){
			if(interactions[interactions.activeInteractionType].getGoForEvaluation()){
				interactions.evaluate();
			}else{
				content.dynaPopup(
					"type:base64",
					"content:"+encodeBase64(wbt.metadata.language=="_de" ? "Bitte erst die Aufgabe vollständig bearbeiten." : "Please complete the task first.")
				);
			}		
		});
	
	$(interactions.containerId+" .interactionBtnFeedback")
		.bind("click", function(){
			content.dynaPopup(
				"type:base64",
				"content:"+interactions.activeInteraction.feedback
			);
		});
	
	$(interactions.containerId+" .interactionBtnReset")
		.bind("click", function(){
			interactions.reset();
		})
		.hide();
		
	switch(interactions.lessonMode){
		case "profiling":
		case "distributedAssessment":
		case "distributedSelfTest":
			$(interactions.containerId+" .interactionBtnResults")
					.bind("click", function(){
						interactions.jumpToResultPage();
					})
					.hide();
			break;
		default:
			if(typeof interactions.blockTest != "undefined"){
				$(interactions.containerId+" .interactionBtnResults")
					.bind("click", function(){
						interactions.jumpToResultPage();
					})
					.hide();
			};
			break;
	};		
	
	//update with session data
	interactions.applyQuestionStatus();
	
	//refresh display
	$("#contents").page("destroy").page();
}

interactions.applyQuestionStatus=function(){
	var q=interactions.activeInteraction, info="",bgcolor="transparent",color="#666";
	
	//resetting...
	$(interactions.containerId+" .questionHeader").removeClass("passed failed");
	$(interactions.containerId+" .interactionBtnReset").hide();

	if(typeof q.hint!="undefined" && q.hint!=""){
		$(interactions.containerId+" .interactionBtnHint").show();
	}else{
		$(interactions.containerId+" .interactionBtnHint").hide();
	}	
	
	if(typeof q.feedback!="undefined" && q.feedback!=""){
		$(interactions.containerId+" .interactionBtnFeedback").show()
	}else{
		$(interactions.containerId+" .interactionBtnFeedback").hide()
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
	
	this.trackProgress(q.status);
	
	if(decodeBase64(q.question).indexOf("Fallbeschreibung")>-1){
		$(interactions.containerId+" .interactionBtnHint")
			//.find(".ui-btn-text")
			.html("Fallbeschreibung");
	}
	
	if(this.reviewMode){
		$(".interactionBtnReset").hide();
		if(interactions[interactions.activeInteractionType].getEvaluationHelp()==""){
			$(interactions.containerId+" .interactionBtnEvaluationHelp").hide();
		}
	}	
	
}

interactions.evaluate=function(){
	var q=this.activeInteraction,
		result=interactions[interactions.activeInteractionType].evaluate(),
		isBlockTestItem=false;
	
	q.attempts++;
	
	if(typeof interactions.blockTest != "undefined"){
		if(content.activeBlock==interactions.blockNum){
			isBlockTestItem=true;
		}else{
			interactions.isBlockTestItem=false;
		}
	};
	
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
				case isBlockTestItem:
					break;
				default:
					content.moderate("passed");
					this.applyQuestionStatus();
					this.showSolution("userSolution");
					break;
			};	
			break;
		case "failed":
			if(q.attempts<q.maxAttempts){
				q.status="incomplete";
				var info="";
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
								$(interactions.containerId+" .interactionBtnAssistance").show();
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
								duration: 1000,
								complete: function(){
									if(typeof interactions[interactions.activeInteractionType].showAssistance == "function"){
										$(interactions.containerId+" .interactionBtnAssistance").show();
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
					case isBlockTestItem:
						break;
					default:
						this.applyQuestionStatus();
						this.showSolution("userSolution");
						content.moderate("failed");
				}
				
			}
			break;
	};

	switch(true){
		case this.lessonMode=="profiling":
		case this.lessonMode=="distributedAssessment":
		case this.lessonMode=="distributedSelfTest":
		case isBlockTestItem:
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
	
				this.trackProgress(q.status);
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
		$(interactions.containerId+" .interactionBtnAssistance").hide();
	}catch(e){}
};

interactions.reset=function(jsonOnly){
	var q=interactions.activeInteraction;
	q.score=0;
	q.blocked=false;
	q.attempts=0;
	q.status="not attempted";
	interactions[interactions.activeInteractionType].reset();
	if(!jsonOnly)this.applyQuestionStatus();
}

interactions.jumpToNextTestPage=function(){
	interactions.getNextTestPage();
	if(interactions.nextTestPage!=""){
		content.jump(interactions.nextTestPage);
	}
};

interactions.getNextTestPage=function(initialId, isRecursive){

	this.nextTestPage="";
	initialId = initialId || content.activePage.id;
	isRecursive = isRecursive || false;
	
	var targetId="",
		initialPageFound=false;
		
	for(var i=0;i<wbt.structure.length;i++){
		for(var j=0;j<wbt.structure[i].items.length;j++){
			
			if(initialPageFound){
				if(wbt.structure[i].items[j].status=="not attempted" || wbt.structure[i].items[j].status=="incomplete"){
					this.nextTestPage = wbt.structure[i].items[j].id;
					return;
				}
			}else{
				if(isRecursive){ //start with first page
					initialPageFound=true;
				}else{
					if(wbt.structure[i].items[j].id == initialId){
						initialPageFound=true;
					}
				}
			}
		}
	}
	
	if(targetId=="" && !isRecursive){
		this.getNextTestPage("xxx",true)
	}
};

interactions.trackProgress=function(status){
	var numQuestions=0,score=0,maxScore=0,numRequired=0,numAnswered=0,hasReferences=false;
	
	for(var i=0;i<content.activePage.steps.length;i++){
		var step=content.activePage.steps[i];
		if(typeof step.interaction=="object"){
			numQuestions++;
			score+=step.interaction[0].score;
			maxScore+=step.interaction[0].maxScore;
		
			$("#tabstep"+step.id).removeClass("stepPassed stepFailed");
			switch(step.interaction[0].status){
				case "passed":
					$("#tabstep"+step.id).addClass("stepPassed");
					numAnswered++;
					break;
				case "failed":
					$("#tabstep"+step.id).addClass("stepFailed");
					numAnswered++;
					break;
			}
			
			if(step.interaction[0].reference!=""){
				hasReferences=true;
			}
		}
	}
	
	if(numQuestions==1){
		content.setStatus(status);
	}
	
	if(numQuestions<2){
		return;
	}

	$("#interactionsProgressbar").progressbar({
		value: parseInt(round(score/maxScore)*100)
	});
	
	numRequired=Math.ceil(maxScore*(defaultSettings.masteryScores.quiz/100));
	$("#interactionsProgressbarIcon")
		.data("questions", numQuestions)
		.data("score", score)
		.data("answered", numAnswered)
		.data("required", numRequired)
		.data("hasReferences", hasReferences);
	
	if(score>=numRequired){
		$("#interactionsProgressbarIcon").removeClass("interactionsProgressbarIconInfo");
		$("#interactionsProgressbarIcon").addClass("interactionsProgressbarIconPassed");
		content.setStatus("passed");
		content.moderate("passed");
	}
}

interactions.setBookmark=function(status,reference){
	if(reference=="")return;
	var num=content.getPageNumberById(reference);
	if(num==0)return;
	switch(status){
		case "passed":
			delBookmarkById(num+"-q");
			break;
		case "failed":
			setBookmark(num+"-q");
			break;
	}
}

interactions.getLessonMode = function(){
	var lessonMode="learn";
	
	if(scorm.scoVersion=="scormCon"){
		var s = scorm.doScormCommand("lmsGetValue", "lessonMode");
	};	
	
	if(typeof wbt.metadata.resourceType!="undefined"){
		switch(wbt.metadata.resourceType){
			case "profiling":
				lessonMode=wbt.metadata.resourceType;
				break;
			case "assessment":
				lessonMode="distributed" + wbt.metadata.resourceType;
				break;
			case "questionnaire":
				lessonMode="distributedSelfTest";
				break;
			default:
				lessonMode=wbt.metadata.resourceType;
		}
		return lessonMode;
	}
	
	//compat
	for(var i=0;i<wbt.structure.length;i++){
		for(var j=0;j<wbt.structure[i].items.length;j++){
			if(typeof wbt.structure[i].items[j].steps=="object"){
				if(wbt.structure[i].items[j].steps.length>0){
					if(typeof wbt.structure[i].items[j].steps[0].html!="undefined"){
						switch(true){
							case (decodeBase64(wbt.structure[i].items[j].steps[0].html).indexOf("{profilingResults}")!=-1):
								lessonMode="profiling";
								break;
							case (decodeBase64(wbt.structure[i].items[j].steps[0].html).indexOf("{testResults}")!=-1):
								lessonMode="distributedAssessment";
								break;
							case(decodeBase64(wbt.structure[i].items[j].steps[0].html).indexOf("{selftestResults}")!=-1):
								lessonMode="distributedSelfTest";
								break;
						}						
					}
				}
			}
		}
	}
	//
	
	return lessonMode;
}



//compatibility
overlib = function(){
    var ar=arguments, html="", caption="";
    for(i=0; i<ar.length; i++){
        if(i==0)html=ar[i];
        if(ar[i]=="CAPTION"){
            caption=ar[i+1];
            continue;
        }
    }
    content.dynaPopup("type:base64","content:"+encodeBase64(html),"caption:"+caption);
}

nd = function(){}

createDynaPopup=function(a,b) { //compat
    content.dynaPopup.apply(this, arguments);
}

doVg = function (e){
    content.moderate(e);
}

vgStop = function(){
    $("#jplayer_audio").jPlayer("stop");
}

var CAPTION="CAPTION",RIGHT="RIGHT",LEFT="LEFT",WIDTH="WIDTH",HEIGHT="HEIGHT",OFFSETY="OFFSETY",OFFSETX="OFFSETX";

function checkCompatibility(str){
    if(str.indexOf("FPMap")!=-1){
        var id=content.activePage.steps[content.activeStep].id;
        str=str.replace(/FPMap/g, "map"+id);
    }
    if(str.indexOf("onmouseover")!=-1){
        str=str.replace(/onmouseover/g, "onclick")
    };
    return str;
}

$.fn.extend({
    disableSelection: function() {
        this.each(function() {
            this.onselectstart = function() {
                return false;
            };
            this.unselectable = "on";
            $(this).css('-moz-user-select', 'none');
            $(this).css('-webkit-user-select', 'none');
        });
    }
});