var userSettings = {
    masteryScores: {
        lesson: 99,
        questionnaire: 59
    },
	helpURL: {
		desktop: custom+"desktop/help.pdf",
		mobile: custom+"mobile/help.pdf"
	},
	imprint: {
        overrideMetadata: true,
        items: [
            {
                title: {
                    de: "Herausgeber",
                    en: "Publisher"
                },
                html: {
                    de: "TÜV Rheinland Akademie GmbH<br/>Alboinstraße 56<br/>12103 Berlin",
                    en: "TÜV Rheinland Akademie GmbH<br/>Alboinstraße 56<br/>12103 Berlin"
                }
            },{
                title: {
                    de: "Copyright",
                    en: "Copyright"
                },
                html: {
                    de: "Copyright {YEAR}, TÜV Rheinland Akademie GmbH",
                    en: "Copyright {YEAR}, TÜV Rheinland Akademie GmbH"
                }
            },{
                title: {
                    de: "Rechte"
                },
                html: {
                    de: "" +
                        "Alle Rechte vorbehalten. Kein Teil des Werkes darf in irgendeiner Form " +
                        "(durch Fotokopie, Mikrofilm oder ein anderes Verfahren) ohne schriftliche Genehmigung " +
                        "des Herausgebers reproduziert oder unter Verwendung elektronischer Systeme verarbeitet, " +
                        "vervielfältigt oder verbreitet werden. Auch die Rechte der Wiedergabe durch Vortrag, " +
                        "Funk und Fernsehen sind vorbehalten. Im Fall der Zuwiderhandlung wird Strafantrag gestellt."
                }
            },{
                title: {
                    de: "Inhaltliche Verantwortung"
                },
                html: {
                    de: "" +
                        "Text, Abbildungen und Programme wurden mit größter Sorgfalt erarbeitet. " +
                        "Herausgeber, Programmierer und Autoren können jedoch für eventuell verbliebene " +
                        "fehlerhafte Angaben und deren Folgen weder eine juristische Verantwortung noch irgendeine " +
                        "Haftung übernehmen."
                }
            },{
                title: {
                    de: "Haftung für Hyperlinks"
                },
                html: {
                    de: "" +
                        "Die Produkte enthalten Verweise (so genannte Hyperlinks) auf Seiten im World Wide Web. " +
                        "Wir möchten darauf hinweisen, dass wir keinen Einfluss auf die Gestaltung sowie die " +
                        "Inhalte der gelinkten Seiten haben. Deshalb distanzieren wir uns hiermit ausdrücklich " +
                        "von allen Inhalten der Seiten, auf die aus unseren Produkten (insbesondere Lerninhalten) " +
                        "verwiesen wird. Diese Erklärung gilt für alle in den Produkten (Lerninhalten) " +
                        "ausgebrachten Links und für alle Inhalte der Seiten, zu denen Links oder Banner führen."
                }
            }
        ]
    }
};


/* Produktspezifische Anpassungen */

function customStepShown(){
    $("#divfooter").css("left", "0px");
    
    $("#floatingVideo").remove();
    
    try{
        if (content.activePage.steps[content.activeStep].friendlyId=="varianty-ispolneniya-sistem_274") {
            $("<div/>", {
                id: "floatingVideo",
                html: "" +
                    "<video width='496' autoplay loop>" +
                        "<source src='images/systemvarianten_274.mp4' type='video/mp4'>" +
                    "</video>",
                css: {
                    "position": "absolute",
                    "top": "20px",
                    "left": "20px",
                    "width": "496px",
                    "height": "450px"
                }
            }).appendTo($("#divstep"+content.activePage.steps[content.activeStep].id));
        }
    }catch(e){}    
}


function customOnloadActions(){
    
    /*Roto*/
    $("#divpagetitle").detach().appendTo("#divheader");
    $("#divcontainer").css({
        "height": wbt.metadata.stageHeight + 172 + "px"
    });
    
    $("#divnavigation img").remove();
    $("#dynaModControl").remove();
    $("#divmenubar").hide();
    
    doExitWarning=function(){return};

    
    //Flyout toc
    $("<div/>", {
        id: "flyoutMenu",
        css: {
            "height": $("#divcontent").height() + 9 + "px"
        },
        html: function(){
            var blocks = [], pages = [], html="<ul>";
            blocks = wbt.structure;
            for (var i in blocks){
                if(typeof blocks[i] == "object"){
                    html+="" +
                        "<li class='level1'>" + //block
                            "<a href='javascript: void(0);'>"+
                                decodeBase64(blocks[i].title)+
                            "</a>" +
                            //"<i class='fa fa-caret-right'></i>" +
                            "<ul>"; //pages
                    pages = getJsonObjects(blocks[i], "template", "multipage", true);
                    for (var j in pages) {
                        var page = new Object();
                        if(typeof pages[j] == "object"){
                            html+="" +
                                "<li class='level2'>" +
                                    "<a href='javascript: void(0);' class='flyoutLink' data-pageid='"+pages[j].id+"'>" +
                                        decodeBase64(pages[j].title)+
                                    "</a>" +
                                "</li>";
                        }
                    }
                    html+="</ul>" +  //pages
                        "</li>"; //block
                }
            };
            html+="</ul>";
            return html;
        }
    }).prependTo($("#divcontent")).hide();
    
    $(".flyoutLink").each(function() {
        var elm=$(this);
        $(this).on("click", function(){
            $("#flyoutMenu")
                .toggle(
                    "slide", {
                        direction: "left"
                    },
                    1000,
                    function(){
                        $(".divstep").css("opacity", "1.0");
                        content.jump(elm.attr("data-pageid"));
                    }
                )  
        });
    });
    
    //Hamburger
    $("<i/>", {
        id: "toggleFlyout",
        "class": "fa fa-bars",
        css: {
            "color": "#DEDEE0",
            "font-size": "20px",
            "padding": "20px 0 0 30px",
            "cursor": "pointer"
        },
        mouseenter: function(){
			$(this).css({
                "color": "#FD0008"
            });
		},
		mouseleave: function(){
			$(this).css({
                "color": "#DEDEE0"
            });
		},
        click: function(){
            $("#flyoutMenu")
                .toggle(
                    "slide", {
                        direction: "left"
                    },
                    1000,
                    function(){
                        if ($(".divstep").css("opacity") =="0.3") {
                            $(".divstep").css("opacity", "1.0")
                        }else{
                            $(".divstep").css("opacity", "0.3")
                        }
                    }
                )
        }
    }).prependTo($("#divfooter"));
    
    //Flyout moderation box
    $("<div/>", {
        id: "flyoutMod",
        css: {
            "height": $("#divcontent").height() + 9 + "px",
            "width": $("#divcontainer").width() - $("#divcontent").width() - 20 + "px"
        }
    }).prependTo($("#divcontent")).hide();    
    
    //Toogle moderation
    $("<i/>", {
        id: "dynaModControl",
        "class": "fa fa-commenting-o",
        css: {
            "color": "#DEDEE0",
            "font-size": "20px",
            "padding": "10px 50px 10px 10px",
            "cursor": "pointer"
        },
        mouseenter: function(){
			$(this).css({
                "color": "#FD0008"
            });
		},
		mouseleave: function(){
			$(this).css({
                "color": "#DEDEE0"
            });
		},
        click: function(){
            $("#flyoutMod")
                .toggle(
                    "slide", {
                        direction: "left"
                    },
                    1000,
                    function(){

                    }
                )
        }
    }).appendTo($("#divnavigation"));
     $("#modTextContainer").detach().appendTo("#flyoutMod").show();
    
    //Audio on/off
    $("<i/>", {
        id: "muteAudio",
        "class": "fa fa-volume-up",
        css: {
            "color": "#DEDEE0",
            "font-size": "20px",
            "padding": "10px 50px 10px 10px",
            "cursor": "pointer",
            "min-width": "19px"
        },
        mouseenter: function(){
			$(this).css({
                "color": "#FD0008"
            });
		},
		mouseleave: function(){
			$(this).css({
                "color": "#DEDEE0"
            });
		},
        click: function(){
            if(scorm.getPreference("audioEnabled")){
                $("#jplayer_audio").jPlayer("stop");
                scorm.setPreference("audioEnabled", false);
                $(this).removeClass("fa-volume-up").addClass("fa-volume-down");
            }else{
                $("#jplayer_audio").jPlayer("play");
                scorm.setPreference("audioEnabled", true);
                $(this).removeClass("fa-volume-down").addClass("fa-volume-up");
            };
        }
    }).appendTo($("#divnavigation"));
    
    //Print
    $("<i/>", {
        id: "aPrint",
        "class": "fa fa-print",
        css: {
            "color": "#DEDEE0",
            "font-size": "20px",
            "padding": "10px 50px 10px 10px",
            "cursor": "pointer"
        },
        mouseenter: function(){
			$(this).css({
                "color": "#FD0008"
            });
		},
		mouseleave: function(){
			$(this).css({
                "color": "#DEDEE0"
            });
		},
        click: function(){
            window.open("files/"+content.activePage.friendlyId+".pdf",target="_blank");
        }
    }).appendTo($("#divnavigation"));
    
    $("<i/>", {
        id: "aNavPrev",
        "class": "fa fa-chevron-left",
        css: {
            "color": "#DEDEE0",
            "font-size": "20px",
            "padding": "10px 50px 10px 10px",
            "cursor": "pointer"
        },
        mouseenter: function(){
			$(this).css({
                "color": "#FD0008"
            });
		},
		mouseleave: function(){
			$(this).css({
                "color": "#DEDEE0"
            });
		}
    }).appendTo($("#divnavigation"));
    
    $("<i/>", {
        id: "aNavNext",
        "class": "fa fa-chevron-right",
        css: {
            "color": "#DEDEE0",
            "font-size": "20px",
            "padding": "10px 10px 10px 10px",
            "cursor": "pointer"
        },
        mouseenter: function(){
			$(this).css({
                "color": "#FD0008"
            });
		},
		mouseleave: function(){
			$(this).css({
                "color": "#DEDEE0"
            });
		}
    }).appendTo($("#divnavigation"));
       
/*OLD*/
	addIE8Rules();
	$("<span/>").appendTo($("#divmenubar"));
	
	$("<div/>", {
        id: "toolsoverlay",
        html: "" +
			"<div class='toolshead-tl'>" +
			  "<div class='toolshead-tr'>" +
				"<div class='toolshead-t'>" +
				  "<p>" + (wbt.metadata.language == "_de" ? "Hilfsmittel" : "Tools") + "</p>" +
				"</div>" +
			  "</div>" +
			"</div>",
		css: {
			display: "none"
		},
		click: function(){
			doMenuItem("submenu");
		}
    }).appendTo($("body"));
	
    
    $("#menuItemSessionReset").hide();
}

var buildDynaDiv = function(){
	$("#dynaWrapper").remove();
	$("<div/>", {
	  id: "dynaWrapper",
	  html: "" +
		  "<div class='dynal'>" +
			"<div class='dynar'>" +
			  "<div id='dynaContainer'></div>" +
			"</div>" +
		  "</div>" +
		  "<div class='dynabl'>" +
			"<div class='dynabr'>" +
			  "<div class='dynab'></div>" +
			"</div>" +
		  "</div>"	
	})
	.appendTo($("#westPane"));
	
	$("#dynaWrapper").css({
		"height": $("#divcontainer").outerHeight() -  $("#dynaWrapper").offset().top + $("#divcontainer").offset().top - 20 +"px"
	});
}

/* IE8 compatibility */
/* ----------------- */
var addIE8Rules=function(){
	
	if(!msie)return;
	
	try{
		if(document.documentMode>8)return;
		
		startIt = function(){

			if(document.getElementById("chkResume")){
				if(!document.getElementById("chkResume").checked){
					props.setProperty("cp","");
				}
			}
			
			wbtSettings.openContentInPopup=true;
			props.setProperty("ip","true");
			
			window.open(startUrl,"","width=1024,height=730,left=0,top=0,resizable=false");
			var msg="Schlie&#223;en Sie dieses Fenster bitte erst bei Beendigung der Lerneinheit."
			document.getElementById("divmessages").innerHTML="<span id='aiccResume'>"+msg+"</span>";
			killMeById("tilt");
			killMeById("divstartbtn");
			killMeById("divresume");	
			
		}
		
		document.styleSheets[1].addRule("#divcontainer", "border:1px solid #999999;", -1);
		document.styleSheets[1].addRule("#elpsOverlay-overlay", "filter:alpha(opacity=20)", -1);
		
		content.notifyNavNext=function(){
			return;
		}		
		
	}catch(e){}
}