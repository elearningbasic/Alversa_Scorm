$.extend(interactions, {
    
    memory: {

        /**** texts ***********/
        
        getHelp: function(){
			var html="";
			switch(wbt.metadata.language){
				case "_de":
					html = "" +
						"Ihre Aufgabe besteht darin, zusammenpassende Begriffspaare zu finden. " +
						"Klicken Sie ein Feld an, um zu sehen, welcher Begriff sich dahinter verbirgt; " +
						"finden Sie dann durch Anklicken eines weiteren Felds die dazu passende Karte. " +
						"Versuchen Sie alle Begriffspaare mit möglichst wenigen Klicks zu finden."
					break;
				case "_en":
					html = "" +
						"Your task is to find matching pairs of terms. " +
						"Click on a field to see which term is behind it; " +
						"then find the matching card by clicking on another field. " +
						"Try to find all pairs of terms with as few clicks as possible."
					break;
			}
            return html; 
        },
        
        getEvaluationInfo: function(status){
            return "";
        },
		
		getAssistanceInfo: function(){
			return "";
		},
		
        getEvaluationHelp: function(){
			return "";
		},
		
		getItemResult: function(result, finished){
			var retVal="";
			switch(result){
				case "wrong":
					switch(wbt.metadata.language){
						case "_de":
							retVal = "Das war leider noch nicht richtig. Bitte versuchen Sie es noch einmal.";
							break;
						case "_en":
							retVal = "Unfortunately, that was not right. Please try again.";
							break;
					}
					break;
				case "correct":
					switch(wbt.metadata.language){
						case "_de":
							if(finished){
								retVal += "Richtig! Damit haben Sie alle Kartenpaare gefunden!";
							}else{
								retVal += "Das war richtig! Suchen Sie nun das nächste Kartenpaar.";
							}
							break;
						case "_en":
							if(finished){
								retVal += "Congratulations! You have found all pairs of terms!";
							}else{
								retVal += "Correct! Search for the next pair of cards.";
							}
							break;
					}
					break;
			};
			return retVal;
		},
    
        /**** layout templates ****/
        /**************************/
        
        interactionContainerTemplate: function(){
            return templates.interactionContainerTemplate();
        },
        
        interactionHeaderTemplate: function(){
            return templates.interactionHeaderTemplate();
        },

        interactionBodyTemplate: function(){
            return "" +
                "<div class='questionBody dropShadow'>" +
                    "<div id='memoryContainer' class='elpsMemoryGame' style='position:relative; width:100%; margin: 10px 0 0 10px;'>" +
						"<ul>" +
							"{CARDS}" +
						"</ul>" +
					"</div>" +
                "</div>";
        },
        
        interactionCardTemplate: function(){
            return "" +
				"<li class='{CARDID}'>" +
					"<span style='padding:0 5px'>{CAPTION}</span>" +
                "</li>";
        },
                
        interactionFooterTemplate: function(){
            return "" +
				"<div class='questionFooter'>" +
					"<button class='interactionBtnHelp ui-button'>" +
						(wbt.metadata.language=="_de" ? "Hilfe" : "Instructions") +
					"</button> " +
					"<span id='memory-results' style='display:none;'></span>" +
				"</div>";				
        },
        
        interactionInfoTemplate: function(){
            return templates.interactionInfoTemplate();
        },
		
		interactionResultsTemplate: function(){
			var html="";
			switch(wbt.metadata.language){
				case "_de":
					html = "" +
						"Sie haben das Memory-Spiel mit {CLICKS} Klicks in {SECS} Sekunden gelöst.";
					break;
				case "_en":
					html = "" +
						"You have solved the memory game with {CLICKS} clicks in {SECS} seconds.";
					break;
			};
			return html;
		},
        
        /**** public functions ****/
        /**************************/

        assemble: function(){
            
            var html="",
				cardsHtml="",
				q=interactions.activeInteraction;
            
            //header
            html=this.interactionHeaderTemplate()
                .replace(/{TITLE}/g, decodeBase64(q.title))
                .replace(/{QUESTION}/g, decodeBase64(q.question));

            aRan = new Array();
            for(var i=0; i<q.cards.length; i++) {
                aRan[i] = i+1;
            };
            
            if(q.randomize){
                for(var i=0; i<q.cards.length; i++) {
                    rand = Math.floor(Math.random()*q.cards.length);
                    temp = aRan[i];
                    aRan[i] = aRan[rand];
                    aRan[rand] = temp;
                }
            };
                
            //body			
			html+=interactions[interactions.activeInteractionType].interactionBodyTemplate();
			
			//cards
            for(var i=0;i<aRan.length;i++){
                cardsHtml+=interactions[interactions.activeInteractionType].interactionCardTemplate()
					.replace(/{CAPTION}/g, decodeBase64(q.cards[aRan[i]-1].caption))
					.replace(/{CARDID}/g, q.cards[aRan[i]-1].id.slice(0,-1));
            };			
			html=html.replace(/{CARDS}/, cardsHtml);
            
            //footer
            html+=this.interactionFooterTemplate();
            
            //container
            html=this.interactionContainerTemplate()
                .replace(/{CONTENTS}/g, html);
            
            //infobox
            html+=this.interactionInfoTemplate();            
            
            html=html.replace(/{RELPATH}/g,wbt.metadata.relpath);
            
            return html;
        },
        
        applyQuestionStatus: function(status){
            
			var q=interactions.activeInteraction;
            
			$("#memoryContainer").elpsMemoryGame({
				itemWidth: 120,
				itemHeight: 120,
				itemsMargin: 15,
				colCount: 5,
				animType: "flip",
				flipAnim: "tb",
				animSpeed: 250,
				openDelay: 2500,
				onFinishCall: function(param){
					//{param} --> param.clicks, param.time
					$(".interactionBtnHelp")
						.delay(3000)
						.hide("slow", function(){
							$("#memory-results").fadeIn("slow", function(){
								content.setStatus("passed");
							});
						});
				}
			});
        },
		
		updateResults: function(secs, clicks){
			$("#memory-results").html(
				interactions[interactions.activeInteractionType].interactionResultsTemplate()
					.replace(/{CLICKS}/, clicks)
					.replace(/{SECS}/, secs)
			)
		},
        
        getGoForEvaluation: function(){
            
        },
        
        evaluate: function(){
            
        },
        
        showSampleSolution: function(){
            
        },
        
        showUserSolution: function(){
            
        },
        
        reset: function(jsonOnly){
            
        }
    }
});

/*******************************************************************************************************************/
if (!Array.indexOf) { //ie8 array hack
    Array.prototype.indexOf = function(obj) {
        for (var i = 0; i < this.length; i++) {
            if (this[i] == obj) {
                return i;
            }
        }
        return -1;
    }
}

// Memory game plugin for jQuery, based on https://github.com/frenski/elpsMemoryGame
// Author: Yane Frenski
// (c) 2012-2013 http://yane.fr/
// MIT licensed
//
// modified for tr-elps by RL

(function($) {
    var initData = "";
    var initOpts = {}
    var methods = {
        init: function(options) {
            initData = $(this).html();
            initOpts = options;
            var opts = $.extend({}, $.fn.elpsMemoryGame.defaults, options);
            var itemsNum = $(this).children("ul").children("li").length;
            var correctItems = new Array();
            var matches = new Array();
            var inHtml = new Array();
            var itemsClass = "elps-mg-item";
            var selItemClass = "";
            var selItemId = -1;
            var numClicks = 0;
            var numTotalClicks = 0;
            var numMatches = 0;
            var numSeconds = 0;
            var gameTimer;
            var delayShow = opts.openDelay;
            var w = opts.itemWidth;
            var h = opts.itemHeight;
            var m = opts.itemsMargin;
            var rowNum = Math.ceil(itemsNum / opts.colCount);

            var handleClick = function() {
				
				if (numTotalClicks == 0) gameTimer = setInterval(incTime, 1000);
				numTotalClicks++;
				var tId = $(this).attr("id");
				var tdIdNum = parseInt(tId.substring(itemsClass.length, tId.length));
				var tClass = matches[tdIdNum];
				unbindClick($(this));
				showItem($(this), tdIdNum);
				if (numClicks == 0) {
					numClicks++;
					selItemClass = tClass;
					selItemId = tId;
				} else if (numClicks == 1) {
					numClicks = 0;
					if (tClass == selItemClass) {
						numMatches++;
						var finished = (numMatches == itemsNum / 2) ? true : false;
						showItemResult("correct", finished);
						unbindClick($("." + tClass));
						correctItems.push(tId);
						correctItems.push(selItemId);
						
						if (finished) {
							clearInterval(gameTimer);
							
							interactions[interactions.activeInteractionType].updateResults(numSeconds, numTotalClicks);
							
							if (opts.onFinishCall != "") {
								opts.onFinishCall({
									clicks: numTotalClicks,
									time: numSeconds
								});
							}
						}
					} else {
						showItemResult("wrong", false);
						unbindClick($("div." + itemsClass));
						hideItem($("div#" + selItemId));
						hideItem($(this));
						setTimeout(function() {
							$("." + itemsClass).each(function() {
								var myId = $(this).attr("id");
								if (correctItems.indexOf(myId) == -1) {
									bindClick($(this));
								}
							});
						}, delayShow + opts.animSpeed + 250);
					}
				}
			};
            
			var unbindClick = function(el) {
				el.unbind("click");
				el.css("cursor", "default");
			};
			
            var bindClick = function(el) {
				el.bind("click", handleClick);
				el.css("cursor", "pointer");
			};
			
            var showItem = function(el, id) {
				
				var topId = el.children("div.elps-mg-item-top").attr("id");
				switch (opts.animType) {
					default:
						case "fade":
						addInFullHTML(el, id);
					$("#" + topId).fadeOut(opts.animSpeed);
					break;
					case "flip":
							el.flip({
							direction: opts.flipAnim,
							speed: opts.animSpeed,
							content: el.children("div.elps-mg-item-bottom"),
							color: "#777",
							onEnd: function() {
								addInHTML(el, id);
							}
						});
						break;
					case "scroll":
							addInFullHTML(el, id);
						$("#" + topId).animate({
							height: "toggle",
							opacity: 0.3
						}, opts.animSpeed);
						break;
				}
			};
			
            var hideItem = function(el) {
				var topId = el.children("div.elps-mg-item-top").attr("id");
				switch (opts.animType) {
					default:
						case "fade":
						$("#" + topId).delay(delayShow).fadeIn(opts.animSpeed, function() {
						removeInHTML(el);
					});
					break;
					case "flip":
						
						setTimeout(function() {
								el.revertFlip();
						}, delayShow);
						
						setTimeout(function() {
								removeInHTML(el);
						}, delayShow + opts.animSpeed * 4);
						break;
					case "scroll":
						$("#" + topId).delay(delayShow)
						.animate(
							{
								height: "toggle",
								opacity: 1
							}, opts.animSpeed, function() {
								removeInHTML(el);
							}
						);
						break;
				}
			};

            var showItemResult = function(result, finished) {
				setTimeout(function(){
					$(interactions.containerId+" .interactionInfoBox")
						.html(interactions[interactions.activeInteractionType].getItemResult(result, finished))
						.css({
							backgroundColor: "#fff"
						})
						.show()
						.animate(
							{
								backgroundColor: result=="wrong" ? "#EFC847" : "#D6E877"
							},{
								duration: 1000,
								complete: function(){
									$(interactions.containerId+" .interactionInfoBox")
										.delay(2000)
										.hide("fade");
								}
							}
						);
				},1000);
			};
			
            var incTime = function() {
				numSeconds++;
			};
			
            var addInFullHTML = function(el, id) {
				el
					.children(".elps-mg-item-bottom")
					.children(".mgcard-show")
					.html(inHtml[id]);
			};
			
            var addInHTML = function(el, id) {
                el
					.children(".mgcard-show")
                    .html(inHtml[id]);
            };
			
            var removeInHTML = function(el) {
				el
					.children(".elps-mg-item-bottom")
					.children(".mgcard-show")
					.html("");
			};

            $(this).children("ul").hide();
            $(this).css({
                height: rowNum * (h + m) + "px"
            });
			           
			var j = 0, i = 0;
            while (i < itemsNum) {
                
                j = i;
                
                var inEl = $(this).children("ul").children("li").eq(j);
                var xRatio = (i + opts.colCount) % opts.colCount;
                var yRatio = Math.floor(i / opts.colCount);
                var l = xRatio * (w + m);
                var t = yRatio * (h + m);
                inHtml[j] = inEl.html();
                $(this).append(
					"<div id='" + itemsClass + j + "' class='" + itemsClass +
						"' style='width:" + w + "px; height:" + h + "px; left:" + l + "px; top:" + t + "px'>" +
						"<div class='elps-mg-item-bottom'>" +
							"<div class='mgcard-show'></div>" +
						"</div>" +
						"<div id='elps-mg-item-top" + j +
							"' class='elps-mg-item-top' style='width:" +
							w + "px; height:" + h + "px;'>" +
						"</div>" +
					"</div>"
				);
                i++;
                matches[j] = inEl.attr("class");
            };
			
            $(this).children("ul").remove();
            
            $(".elps-mg-item").click(handleClick);
        },
		
        destroy: function() {
            $(this).empty();
        }
    };
	
    $.fn.elpsMemoryGame = function(optionsMethods) {
		if (methods[optionsMethods]) {
			return methods[optionsMethods].apply(this, arguments);
		} else if (typeof optionsMethods === "object" || !optionsMethods) {
			return methods.init.apply(this, arguments);
		} else {
			$.error("Method " + optionsMethods + " does not exist on jQuery.tooltip");
		}
	};

    $.fn.elpsMemoryGame.defaults = {
        itemWidth: 120,
        itemHeight: 120,
        itemsMargin: 10,
        colCount: 5,
        animType: "scroll",
        animSpeed: 250,
        openDelay: 2500,
        flipAnim: "rl",
        onFinishCall: ""
    };
	
})(jQuery);

/* flip plugin ****************************************************************/
eval(function(p,a,c,k,e,r){e=function(c){return(c<a?'':e(parseInt(c/a)))+((c=c%a)>35?String.fromCharCode(c+29):c.toString(36))};if(!''.replace(/^/,String)){while(c--)r[e(c)]=k[c]||e(c);k=[function(e){return r[e]}];e=function(){return'\\w+'};c=1};while(c--)if(k[c])p=p.replace(new RegExp('\\b'+e(c)+'\\b','g'),k[c]);return p}('(5($){5 L(a){a.3x.1F[a.3r]=3o(a.3n,10)+a.3l}6 j=5(a){3k({3i:"1E.1d.3d 3c 3b",38:a})};6 k=5(){7(/*@2S!@*/19&&(2Q 2N.1w.1F.2K==="2F"))};6 l={2C:[0,4,4],2B:[1u,4,4],2y:[1s,1s,2v],2u:[0,0,0],2t:[0,0,4],2s:[1q,1p,1p],2o:[0,4,4],2n:[0,0,B],2m:[0,B,B],2l:[1b,1b,1b],2j:[0,1c,0],2i:[2h,2g,1o],2e:[B,0,B],2d:[2c,1o,2b],2a:[4,1n,0],27:[24,21,20],1Z:[B,0,0],1Y:[1R,1P,1O],1N:[3s,0,Y],2f:[4,0,4],1Q:[4,2z,0],2E:[0,t,0],22:[26,0,28],29:[1u,1z,1n],2p:[2r,2w,1z],2x:[1h,4,4],2A:[1i,2G,1i],2L:[Y,Y,Y],2M:[4,2O,2W],33:[4,4,1h],34:[0,4,0],35:[4,0,4],36:[t,0,0],39:[0,0,t],3e:[t,t,0],3j:[4,1q,0],3m:[4,W,3t],1H:[t,0,t],1I:[t,0,t],1J:[4,0,0],1K:[W,W,W],1L:[4,4,4],1M:[4,4,0],9:[4,4,4]};6 m=5(a){U(a&&a.1j("#")==-1&&a.1j("(")==-1){7"1S("+l[a].1T()+")"}1U{7 a}};$.1V($.1W.1X,{w:L,x:L,u:L,v:L});$.1k.23=5(){7 V.1l(5(){6 a=$(V);a.1d(a.F(\'1m\'))})};$.1k.1d=5(i){7 V.1l(5(){6 c=$(V),3,$8,C,11,1f,1e=k();U(c.F(\'S\')){7 19}6 e={R:(5(a){2k(a){X"T":7"Z";X"Z":7"T";X"15":7"14";X"14":7"15";2q:7"Z"}})(i.R),y:m(i.A)||"#H",A:m(i.y)||c.z("12-A"),1r:c.N(),D:i.D||1t,Q:i.Q||5(){},K:i.K||5(){},P:i.P||5(){}};c.F(\'1m\',e).F(\'S\',1).F(\'2D\',e);3={s:c.s(),p:c.p(),y:m(i.y)||c.z("12-A"),1v:c.z("2H-2I")||"2J",R:i.R||"T",E:m(i.A)||"#H",D:i.D||1t,o:c.1x().o,n:c.1x().n,1y:i.1r||2P,9:"9",18:i.18||19,Q:i.Q||5(){},K:i.K||5(){},P:i.P||5(){}};1e&&(3.9="#2R");$8=c.z("16","2T").8(2U).F(\'S\',1).2V("1w").N("").z({16:"1g",2X:"2Y",n:3.n,o:3.o,2Z:0,30:31,"-32-1A-1B":"G G G #1C","-37-1A-1B":"G G G #1C"});6 f=5(){7{1D:3.9,1v:0,3a:0,w:0,u:0,v:0,x:0,M:3.9,O:3.9,I:3.9,J:3.9,12:"3f",3g:\'3h\',p:0,s:0}};6 g=5(){6 a=(3.p/1c)*25;6 b=f();b.s=3.s;7{"q":b,"1a":{w:0,u:a,v:a,x:0,M:\'#H\',O:\'#H\',o:(3.o+(3.p/2)),n:(3.n-a)},"r":{x:0,w:0,u:0,v:0,M:3.9,O:3.9,o:3.o,n:3.n}}};6 h=5(){6 a=(3.p/1c)*25;6 b=f();b.p=3.p;7{"q":b,"1a":{w:a,u:0,v:0,x:a,I:\'#H\',J:\'#H\',o:3.o-a,n:3.n+(3.s/2)},"r":{w:0,u:0,v:0,x:0,I:3.9,J:3.9,o:3.o,n:3.n}}};11={"T":5(){6 d=g();d.q.w=3.p;d.q.M=3.y;d.r.x=3.p;d.r.O=3.E;7 d},"Z":5(){6 d=g();d.q.x=3.p;d.q.O=3.y;d.r.w=3.p;d.r.M=3.E;7 d},"15":5(){6 d=h();d.q.u=3.s;d.q.I=3.y;d.r.v=3.s;d.r.J=3.E;7 d},"14":5(){6 d=h();d.q.v=3.s;d.q.J=3.y;d.r.u=3.s;d.r.I=3.E;7 d}};C=11[3.R]();1e&&(C.q.3p="3q(A="+3.9+")");1f=5(){6 a=3.1y;7 a&&a.1E?a.N():a};$8.17(5(){3.Q($8,c);$8.N(\'\').z(C.q);$8.13()});$8.1G(C.1a,3.D);$8.17(5(){3.P($8,c);$8.13()});$8.1G(C.r,3.D);$8.17(5(){U(!3.18){c.z({1D:3.E})}c.z({16:"1g"});6 a=1f();U(a){c.N(a)}$8.3u();3.K($8,c);c.3v(\'S\');$8.13()})})}})(3w);',62,220,'|||flipObj|255|function|var|return|clone|transparent||||||||||||||left|top|height|start|second|width|128|borderLeftWidth|borderRightWidth|borderTopWidth|borderBottomWidth|bgColor|css|color|139|dirOption|speed|toColor|data|0px|999|borderLeftColor|borderRightColor|onEnd|int_prop|borderTopColor|html|borderBottomColor|onAnimation|onBefore|direction|flipLock|tb|if|this|192|case|211|bt||dirOptions|background|dequeue|rl|lr|visibility|queue|dontChangeColor|false|first|169|100|flip|ie6|newContent|visible|224|144|indexOf|fn|each|flipRevertedSettings|140|107|42|165|content|245|500|240|fontSize|body|offset|target|230|box|shadow|000|backgroundColor|jquery|style|animate|purple|violet|red|silver|white|yellow|darkviolet|122|150|gold|233|rgb|toString|else|extend|fx|step|darksalmon|darkred|204|50|indigo|revertFlip|153||75|darkorchid|130|khaki|darkorange|47|85|darkolivegreen|darkmagenta|fuchsia|183|189|darkkhaki|darkgreen|switch|darkgrey|darkcyan|darkblue|cyan|lightblue|default|173|brown|blue|black|220|216|lightcyan|beige|215|lightgreen|azure|aqua|flipSettings|green|undefined|238|font|size|12px|maxHeight|lightgrey|lightpink|document|182|null|typeof|123456|cc_on|hidden|true|appendTo|193|position|absolute|margin|zIndex|9999|webkit|lightyellow|lime|magenta|maroon|moz|message|navy|lineHeight|error|plugin|js|olive|none|borderStyle|solid|name|orange|throw|unit|pink|now|parseInt|filter|chroma|prop|148|203|remove|removeData|jQuery|elem'.split('|'),0,{}))
