/* Random Facts */

var randomFacts={
	searchedFactsCounter: 0,
	initialized: false,
	activeFact: {},
	infoFact: {},
	iconHilite: "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",
	//green --> randomFacts.iconNormal="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";
	iconNormal: "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"
};
	
randomFacts.init=function(){
	if(wbt.facts.length>0){
		wbt.facts=randomFacts.shuffle(wbt.facts);
		
		var infoIx=-1;	//get the INFO fact, if present
		$.each(wbt.facts, function(i,fact){
			if(decodeBase64(fact.caption).toLowerCase()=="info"){
				randomFacts.infoFact=fact;
				randomFacts.infoFact.caption="";
				infoIx=i;
			};
		});
		
		if (infoIx>-1){ //remove the info fact from the rest
			wbt.facts.splice(infoIx,1);
		};
	}else{
		return; //no facts
	}

	$("<div/>", {
		id: "factsButton",
		html: "",
		css: {
			right: "10px",
			width: "32px",
			height: "32px",
			marginLeft: isMobile ? "10px" : "20px",
			cursor: "pointer",
			display: "inline-block",
			backgroundImage: "url('data:image/png;base64,"+randomFacts.iconNormal+"')"
		},
		title: "Random Facts", 
		click: function(){
			//$(this).elpsTooltip("hide");
		}
	}).appendTo(isMobile ? $("#navbar") : $("#divnavigation"));
	
	if(isMobile){
		$("#factsButton").bind("click", function(){
			
			randomFacts.getRandomFact();
			if(randomFacts.activeFact==null){
				return;
			}
			
			var html="";
			
			if(randomFacts.activeFact.caption!=""){
				html="" +
					"<div style='font-weight:bold;padding-bottom: 5px;'>" +
						decodeBase64(randomFacts.activeFact.caption) +
					"</div>";
			}
			
			if(randomFacts.activeFact.short!=""){		
				html+=decodeBase64(randomFacts.activeFact.short);
			}
			
			var elm=$("<div/>",{
				html: html
			});
			
			if($(elm).find("img").length>0){
				$(elm).find("img").each(function(ix) {
					$(this)
						.css({
							position: "relative",
							"float": "left",
							paddingRight: "5px"
						})
						.detach()
						.prependTo($(elm))
						.load(function() {
							pwidth=this.width+100;
							pheight=this.height;
							$(elm).css({
								minWidth: pwidth+"px",
								minHeight: pheight+"px"
							})
							html=html.replace(/{RELPATH}/g, wbt.metadata.relpath);
							content.dynaPopup("type:base64","content:"+encodeBase64($(elm).prop("outerHTML")));
						})
				});
			}else{
				html=html.replace(/{RELPATH}/g, wbt.metadata.relpath);
				content.dynaPopup("type:base64","content:"+encodeBase64($(elm).prop("outerHTML")));
			};
		});
	}else{
		$("#factsButton").elpsTooltip({
			animation: "fade", //fade, grow, swing, slide, fall
			arrow: true,
			arrowColor: "#F0F0F0",
			delay: 200,
			fixedWidth: 0,
			maxWidth: 500,
			interactive: true,
			interactiveTolerance: 750,
			offsetX: 0,
			offsetY: 0,
			onlyOne: true,
			position: "top-right",
			speed: 350,
			timer: 0,
			theme: ".elpsTooltip-shadow",
			touchDevices: false,
			trigger: "click", //hover, click, custom
			updateAnimation: false,
			functionAfter: function(){
				$("#factsButton").css("background-image", "url('data:image/png;base64,"+randomFacts.iconNormal+"')");
			},
			functionBefore: function(origin, continueTooltip) {
				$("#factsButton").css("background-image", "url('data:image/png;base64,"+randomFacts.iconHilite+"')");
				randomFacts.getRandomFact();
				if(randomFacts.activeFact==null){
					$("#logger").log("Random Fact error: randomFacts.activeFact==null");
					return;
				}
				
				var html="";
				
				if(randomFacts.activeFact.caption!=""){
					html="" +
						"<div style='font-weight:bold;padding-bottom: 5px;'>" +
							decodeBase64(randomFacts.activeFact.caption) +
						"</div>";
				}
				
				if(randomFacts.activeFact.short!=""){
					var linktext="more";
					switch(randomFacts.activeFact.longtype){
						case "html":
							linktext="More...";
							break;
						case "img":
							linktext="View";
							break;
						case "swf":
							linktext="View";
							break;
						case "video":
							linktext="Video";
							break;
					}
					
					html+=decodeBase64(randomFacts.activeFact.short) +
						(randomFacts.activeFact.long!=""
							? " <div style='position:relative;white-space:nowrap;float:right;'>" +
									"<a href='javascript:void(0);' class='elpsOverlay-button' onclick='randomFacts.showInPopup();'>" +
										linktext +
									"</a>" +
								"</div>"
							: "");
				}
				
				var elm=$("<div/>",{
					html: html
				});
				
				if($(elm).find("img").length>0){
					$(elm).find("img").each(function(ix) {
						$(this)
							.css({
								position: "relative",
								"float": "left",
								paddingRight: "5px"
							})
							.detach()
							.prependTo($(elm))
							.load(function() {
								pwidth=this.width+100;
								pheight=this.height;
								$(elm).css({
									minWidth: pwidth+"px",
									minHeight: pheight+"px"
								})
								html=html.replace(/{RELPATH}/g, wbt.metadata.relpath);
								origin.elpsTooltip("update", $(elm).prop("outerHTML"));
								origin.elpsTooltip("reposition");
								continueTooltip();
							})
					});
				}else{
					html=html.replace(/{RELPATH}/g, wbt.metadata.relpath);
					origin.elpsTooltip("update", $(elm).prop("outerHTML"));
					origin.elpsTooltip("reposition");
					continueTooltip();
				};
			}
		});
	};
};

randomFacts.shuffle=function(array){
	var m = array.length, t, i;
	while (m) {
		i = Math.floor(Math.random() * m--);
		t = array[m];
		array[m] = array[i];
		array[i] = t;
	}
	return array;
};

randomFacts.getRandomFact=function(){
	if(!randomFacts.initialized){
		randomFacts.initialized = true;
		randomFacts.activeFact = randomFacts.infoFact;
		return;
	};
	
	var rndNum=Math.floor(Math.random()*wbt.facts.length);
	var item=wbt.facts[rndNum];
	if(wbt.facts[rndNum].used){
		if(randomFacts.searchedFactsCounter<wbt.facts.length){
			randomFacts.searchedFactsCounter++;
			randomFacts.getRandomFact();
			return;
		}else{
			for(var i=0;i<wbt.facts.length;i++){
				wbt.facts[i].used=false;
			}
		}
	};
	
	wbt.facts[rndNum].used=true;
	randomFacts.searchedFactsCounter=0;
	randomFacts.activeFact=item;
};

randomFacts.showInPopup=function(){
	$("#factsButton").elpsTooltip("hide");
	if(randomFacts.activeFact==null)return;
	
	content.stopModeration();
	
	switch (randomFacts.activeFact.longtype){
		case "video":
			content.writeVideoOverlay(
				"type:video",
				"relfile:"+randomFacts.activeFact.long,
				"supplied:"+randomFacts.activeFact.supplied,
				"solution:"+randomFacts.activeFact.solution,
				"width:"+randomFacts.activeFact.width,
				"height:"+randomFacts.activeFact.height,
				"cssClass:"+randomFacts.activeFact.cssClass,
				"caption:"+randomFacts.activeFact.caption
			);
			break;
		case "url":
			createDynaPopup(
				"type:url",
				"content:"+randomFacts.activeFact.long,
				"width:"+randomFacts.activeFact.width,
				"height:"+randomFacts.activeFact.height
			);
			break;
		case "img":
			createDynaPopup(
				"type:img",
				"caption:"+encodeBase64(randomFacts.activeFact.caption),
				"content:"+randomFacts.activeFact.long
			);
			break;
		default:
			var html="<p>"+randomFacts.activeFact.caption+"</p><div>"+randomFacts.activeFact.long+"</div>";
			createDynaPopup(
				"type:html",
				"content:"+encodeBase64(html)
			);
	}
};

randomFacts.alignNavbar=function(){ //see elps.mobile.init.js
	$("#navbar .ui-btn").css({
		marginBottom: "1em",
		marginTop: "0"
	});
}