$.extend(interactions, {

	reviewMode: false,
	poolMode: -1,
	ratingIsCompleted: false,
	isBlocked: false,
	progressInitialized: false,
	mobileAtomFullsizeHandlerBound: false,
	
	initDistributed: function(){

		defaultSettings.timeUntilBrowsed=500;
		this.setExitConfirmationMessage();
		$("#menuItemSessionInformation").hide();
		
		if(typeof wbt.metadata.resourceTypeParameters!="undefined"){
			$.each(wbt.metadata.resourceTypeParameters.split(","), function(x,elm){
				var param=elm.split(":");
				if(param.length>1){
					switch(param[0]){
						case "pool":
							if($.isNumeric(param[1])){
								interactions.poolMode=param[1]
							};
							break;
					}
				}
			})
		}
		
		switch(this.lessonMode){
			case "profiling":
				if(scorm.lessonStatus=="completed"){
					this.isBlocked=true;
				};
				break;
			case "distributedAssessment":
				if(scorm.lessonStatus=="completed"){
					this.isBlocked=false;
				};
				break;
			case "distributedSelftest":
				$("#menuItemSessionReset").hide();
				if(scorm.lessonStatus=="completed"){
					if(interactions.poolMode>-1){
						this.isBlocked=true;
					}else{
						this.isBlocked=false;
					};
				};
				break;
		};
		
		if(this.isBlocked){
			this.createBlockedPage();
		}else{

			//pooling: randomize tasks and limit number of items to interactions.poolMode
			if(interactions.poolMode>-1){
				
				//reset previous sessions
				$.each(wbt.structure, function(i,block){
					$.each(block.items, function(j, page){
						$.each(page.steps, function(k, step){
							if(typeof step.interaction=="object"){
								var interaction=step.interaction[0];
									page.score=0;
									interaction.status="not attempted";
									interaction.blocked=false;
									interaction.score=0;
							};
						});
					});
				});		
				
				var shuffle=function(array) {
					var tmp, current, top = array.length;
					if(top) while(--top) {
						current = Math.floor(Math.random() * (top + 1));
						tmp = array[current];
						array[current] = array[top];
						array[top] = tmp;
					};
					return array;
				};
				
				for(var i=0;i<wbt.structure.length;i++){
					
					var numInteractions=0;
					
					for(var j=0;j<wbt.structure[i].items.length;j++){
						var page=wbt.structure[i].items[j];
						if(typeof page.steps=="object"){
							if(page.steps.length>0){
								for(var k=0;k<page.steps.length;k++){
									if(typeof page.steps[k].interaction=="object"){
										numInteractions++;
									}
								}
							}
						}
					};
					
					if(numInteractions>interactions.poolMode){
						for(var a=[],j=0;j<numInteractions;++j){
							a[j]=j;
						};
						
						a=shuffle(a);
						a.splice(0,interactions.poolMode);
						a=a.sort(function(a, b){return b-a});
						
						for(var j=0;j<a.length;j++){
							wbt.structure[i].items.splice(a[j], 1);
						};
					};
				};
			};
		
			if(wbt.structure[0].items[0].steps.length>0){
				if(typeof wbt.structure[0].items[0].steps[0].interaction=="object"){
					this.createIntroPage();
				}
			};
	
			if(wbt.structure.length==1){
				
				//add profile page
				wbt.structure[0].items.push(this.createRatingPage());
			
			}else{
				
				//add block with profile page
				wbt.structure.push({
					title: wbt.metadata.language == "_de" ? encodeBase64("Auswertung") : encodeBase64("Evaluation"),
					items: [
						this.createRatingPage()
					]
				});				
				
				//add intro for each block
				for(var i=0;i<wbt.structure.length;i++){
					if(typeof wbt.structure[i].items[0].steps=="object"){
						if(wbt.structure[i].items[0].steps.length>0){
							if(typeof wbt.structure[i].items[0].steps[0].interaction=="object"){
								wbt.structure[i].items.unshift(
									this.createBlockIntroPage(wbt.structure[i], i)
								);
							}
						}
					}
				}
			};
			
			if(isMobile){
				$("<div/>", {
					id: "progressIndicator",
					html: "<canvas width='200' height='100'></canvas>",
					css: {
						position: "absolute",
						top: "400px",
						left: "auto",
						right: "50px",
						width: "200px",
						height: "100px",
						"z-index": 111
					}
				}).appendTo($("body"));
			}else{
				$("<div/>", {
					id: "progressIndicator",
					html: "<canvas id='piCanvas' width='" + $("#westPane").width() + "' height='100'></canvas>",
					css: {
						position: "absolute",
						bottom: "20px",
						left: "0px",
						width: $("#westPane").width() + "px",
						height: "100px"
					}
				}).appendTo($("#divcontainer"));
				
				this.initProgress();
				
			};
		}
	},
	
	initProgress: function(){
		if(this.progressInitialized)return;
		
		if(isMobile){
			$("#progressIndicator").css({
				top: parseInt($("#footer").position().top-100)+"px"
			})
		};
		
		if(typeof window.G_vmlCanvasManager!="undefined") { //msie8: init canvas manager, see ie8.canvas.js
			var c=document.getElementById("piCanvas");
			c=window.G_vmlCanvasManager.initElement(c);
		};
		
		this.progressChart = new Chart($("#progressIndicator canvas")
			.get(0).getContext("2d"))
			.Pie(
				[
					{
						value: 0,
						color:"#0079C2",
						highlight: "#0076BD",
						label: "completed"
					},{
						value: 100,
						color:"#F0F0F0",
						highlight: "#F0F0F0",
						label: "incomplete"
					}
				],{
					segmentStrokeColor : "#0079C2",
					tooltipFillColor: "rgba(255,255,255,0.9)",
					tooltipFontFamily: "Arial, sans-serif",
					tooltipFontSize: 13,
					tooltipFontStyle: "normal",
					tooltipFontColor: "#666",
					tooltipTitleFontFamily: "Arial, sans-serif",
					tooltipTitleFontSize: 13,
					tooltipTitleFontStyle: "bold",
					tooltipTitleFontColor: "#666",
					tooltipCornerRadius: 4,
					tooltipTemplate: function(o){
						
						var data=interactions.getSessionData(),
							retVal="";
						
						switch(wbt.metadata.language){
							case "_de":
								if(o.label=="completed"){
									var num=data.passed + data.failed;
									retVal=num>1 ? (num + " Aufgaben bearbeitet") : "Eine Aufgabe bearbeitet";									
								}else{
									retVal=data.incomplete>1 ? ("Noch " + data.incomplete + " Aufgaben zu bearbeiten") : "Noch eine Aufgabe zu bearbeiten";
								};								
								break;
							case "_en":
								if(o.label=="completed"){
									var num=data.passed + data.failed;
									retVal=num>1 ? (num + " tasks completed") : "One task completed";									
								}else{
									retVal=data.incomplete>1 ? (data.incomplete + " tasks remaining") : "One task remaining";
								};								
								break;
						}
						return retVal;
					}
				}
			);
		this.progressInitialized=true;
	},
	
	updateProgress: function(){
		var data=this.getSessionData();
		var progressPercent = parseInt(round((data.passed + data.failed) / data.total) * 100);
		
		if(typeof this.progressChart!="undefined" && $("#progressIndicator canvas").length>0){
			this.progressChart.segments[0].value = progressPercent;
			this.progressChart.segments[1].value = 100-progressPercent;
			this.progressChart.update();
		}
	},
	
	setExitConfirmationMessage: function() {
		switch(wbt.metadata.language){
			case "_de":
				if(scorm.lessonStatus=="completed"){
					exitConfirmationMessage_de="";
				}else{
					exitConfirmationMessage_de="" +
						"Klicken Sie auf 'OK', um die Bearbeitung des Fragenkatalogs jetzt abzubrechen. " +
						"Hinweis: Bereits beantwortete Fragen werden nicht gespeichert.";
				};				
				break;
			case "_en": //todo: translate
				if(scorm.lessonStatus=="completed"){
					exitConfirmationMessage_en="";
				}else{
					exitConfirmationMessage_en="" +
						"Click 'OK' to abort your work on the questionnaire now. " +
						"Note: Already answered questions will not be saved.";
				};
				break;
		}
	},
	
	createIntroPage: function(){

		var topics=[];
		if(wbt.structure.length==1){
			if(wbt.metadata.keywords.length>0){
		
				for(var i=0;i<wbt.metadata.keywords.length;i++){
					topics.push(decodeBase64(wbt.metadata.keywords[i].keyword))
				}
				
				topics.sort(function(a,b){
					return a.localeCompare(b);
				});
				
			}
		}else{
			for(var i=0;i<wbt.structure.length;i++){
				topics.push(decodeBase64(wbt.structure[i].title));
			}
		}
		
		var poolInfo="";
		if (wbt.metadata.language=="_de" && interactions.poolMode>-1){
			poolInfo = "" +
				"<div style='padding: 10px; border-radius: 4px; margin-bottom: 5px; background-color: rgb(255, 255, 255); color: rgb(102, 102, 102);'>" +
					"Die Fragen werden nach dem Zufallsprinzip ausgewählt. " +
					"Zwischenergebnisse werden beim Verlassen des Lernmoduls nicht gespeichert, d.h. " +
					"beim Wiederaufruf müssen <b>alle Fragen</b> erneut bearbeitet werden!" +
				"</div>"
		}
		
		var title=decodeBase64(wbt.metadata.title);
		var html=this.templateIntroPage()
		   .replace(/{INTRO}/, decodeBase64(wbt.metadata.intro))
		   .replace(/{TOPICS}/, "<ul><li>" + topics.join("</li><li>") + "</li></ul>")
		   .replace(/{IMGPATH}/, this.getRandomImage())
		   .replace(/{TESTINFO}/, this.templateTestInfo() + poolInfo)
		   .replace(/{STARTMSG}/, this.templateStartMsg());
		
		var mod={}, autoMod=false;
		
		if(typeof wbt.metadata.moderation!="undefined"){
			autoMod = wbt.metadata.moderation=="auto" ? true : false;
		};
		
		if(wbt.metadata.language!="_de"){
			autoMod = false;
		};
		
		if(autoMod){
			switch(this.lessonMode){
				
				case "profiling":
					mod = {
						id: "automod_profiling_intro",
						friendlyId: "automod_profiling_intro",
						trigger: "intro",
						stopOnFinish: true,
						html: encodeBase64("Willkommen zu unserem Einstufungstest. Nachfolgend präsentieren wir " +
							"Ihnen zu jedem der Lernmodule eine Reihe von Aufgaben, durch deren Bearbeitung Sie " +
							"Ihre persönlichen Vorkenntnisse zu dem jeweiligen Thema einschätzen können. " +
							"Nach Abschluss des Tests können Sie sich auf diejenigen Lernmodule konzentrieren, " +
							"bei denen Sie noch Nachholbedarf haben. Bitte beantworten Sie die Fragen nacheinander " +
							"und klicken Sie jeweils auf die Schaltfläche ''Fertig'', um die Antwort zu speichern. " +
							"Beachten Sie, dass Sie jede Aufgabe nur einmal beantworten können. Viel Erfolg bei der Bearbeitung!")
					};
					break;
				
				case "distributedSelfTest":
					mod = {
						id: "automod_distributedselftest_intro",
						friendlyId: "automod_distributedselftest_intro",
						trigger: "intro",
						stopOnFinish: true,
						html: encodeBase64("Willkommen zu unserem Selbsttest. Anhand einer Reihe von Kontrollfragen können " +
							"Sie realistisch abschätzen, ob Sie die Lerninhalte bereits verinnerlicht haben, bzw. " +
							"in welchen Themenbereichen vielleicht noch Nachholbedarf besteht. Bitte beantworten Sie die " +
							"Fragen nacheinander und klicken Sie jeweils auf die Schaltfläche ''Fertig'', um die Antwort zu speichern. " +
							"Sobald Sie alle Fragen bearbeitet haben, " +
							"erhalten Sie eine Auswertung. Viel Erfolg bei der Bearbeitung!")
					};
					break;
				
				case "distributedAssessment":
					mod = {
						id: "automod_distributedassessment_intro",
						friendlyId: "automod_distributedassessment_intro",
						trigger: "intro",
						stopOnFinish: true,
						html: encodeBase64("Willkommen zu unserem Abschlusstest. Bitte beantworten Sie die Fragen nacheinander " +
							"und klicken Sie jeweils auf die Schaltfläche ''Fertig'', um die Antwort zu speichern. " +
							"Sobald Sie alle Fragen bearbeitet haben, erhalten Sie eine Auswertung. Viel Erfolg bei der Bearbeitung!")
					};
					break;
			}
		};
		
		var page={
			id: "intro_p",
			title: encodeBase64(title),
			leaf: true,
			template: "multipage",
			icon: "i",
			atoms: [],
			steps: [{
				id: "intro_step",
				html: encodeBase64(html),
				hotspots: [],
                overlays: [],
				specials: [],
				moderations: [
					mod
				]
			}],
			hasFiles: false,
			hasGlossary: false,
			status: "not attempted",
			score: 0,
			maxScore: 1,
			bookmark: 0,
			isCurrent: false
		};
		
		if(wbt.structure.length==1){
			wbt.structure[0].items.unshift(page);
		}else{
			wbt.structure.unshift({
				title: encodeBase64(title),
				items: [
					page
				]
			});	
			
		}
	},
	
	createBlockedPage: function(){

		var title=decodeBase64(wbt.metadata.title);
		var html=this.templateBlockedPage()
		   .replace(/{IMGPATH}/, this.getRandomImage());
		
		wbt.structure = [{
			title: wbt.metadata.title,
			items: [{
				id: "intro_p",
				title: encodeBase64(title),
				leaf: true,
				template: "multipage",
				icon: "i",
				atoms: [],
				steps: [{
					id: "intro_step",
					hotspots: [],
					overlays: [],
					specials: [],
					html: encodeBase64(html),
					moderations: []
				}],
				hasFiles: false,
				hasGlossary: false,
				status: "not attempted",
				score: 0,
				maxScore: 1,
				bookmark: 0,
				isCurrent: false
			}]
		}];

	},
	
	createBlockIntroPage: function(block, i){
		
		var topics=[];
		for(var j=0;j<block.items.length;j++){
			topics.push(decodeBase64(block.items[j].title));
		};
		
		var html=this.templateBlockIntroPage(i)
		   .replace(/{TITLE}/, decodeBase64(block.title))
		   .replace(/{TOPICS}/, "<ul><li>" + topics.join("</li><li>") + "</li></ul>")
		   .replace(/{IMGPATH}/, this.getRandomImage());
		   
		return {
			id: "block"+i+"intro_p",
			title: block.title,
			leaf: true,
			template: "multipage",
			icon: "i",
			atoms: [],
			steps: [
				{
					id: "block"+i+"intro_step",
					html: encodeBase64(html),
					hotspots: [],
					overlays: [],
					specials: [],
					moderations: []
				}
			],
			hasFiles: false,
			hasGlossary: false,
			status: "not attempted",
			score: 0,
			maxScore: 1,
			bookmark: 0,
			isCurrent: false
		}
	},
	
	createRatingPage: function(){
		return {
			id: "Rating_p",
			title: wbt.metadata.language == "_de" ? encodeBase64("Auswertung") : encodeBase64("Evaluation"),
			leaf: true,
			template: "multipage",
			icon: "i",
			atoms: [],
			steps: [{
				id: "Rating_s",
				html: encodeBase64("{profile}"),
				hotspots: [],
                overlays: [],
				specials: [],
				moderations: []
			}],
			hasFiles: false,
			hasGlossary: false,
			status: "not attempted",
			score: 0,
			maxScore: 1,
			bookmark: 0,
			isCurrent: false
		};		
	},	
	
	getRandomImage: function(){
		var max=13,min=1;
		var rndNum=Math.floor(Math.random() * (max - min + 1)) + min;
		return custom+"shared/images/reflection/reflection"+rndNum+".jpg";
	},
	
	getGo: function(){
		var go=true;
		switch(this.lessonMode){
			case "profiling":
				this.activeInteraction.maxAttempts=1;
				switch(this.activeInteraction.status){
					case "passed":
					case "failed":					

						$(interactions.containerId).html(
							"<div class='interactionInfoBox ui-corner-all' style='background-color:#EFC847;'></div>"
						);
						
						if(this.ratingIsCompleted){
							$(interactions.containerId+" .interactionInfoBox")
								.html(this.templateQuestionBlocked("completed"))
								.animate(
									{
										backgroundColor:"#fff",
										color: "#666"
									},{
										duration: 3000,
										complete: function(){}
									}
								);
							go=false;
						}else{
							$(interactions.containerId+" .interactionInfoBox")
								.html(this.templateQuestionBlocked("inprogress"))
								.animate(
									{
										backgroundColor:"#fff",
										color: "#666"
									},{
										duration: 3000,
										complete: function(){}
									}
								);
							go=false;
						};
						break;
				};
				break;
			
			case "distributedAssessment":
				this.activeInteraction.maxAttempts=1;
				switch(this.activeInteraction.status){
					case "passed":
					case "failed":
						
						$(interactions.containerId).html(
								"<div class='interactionInfoBox ui-corner-all' style='background-color:#EFC847;'></div>"
							);
						
						if(this.ratingIsCompleted){
							$(interactions.containerId+" .interactionInfoBox")
								.html(this.templateQuestionBlocked("completed"))
								.animate(
									{
										backgroundColor:"#fff",
										color: "#666"
									},{
										duration: 3000,
										complete: function(){}
									}
								);
							go=false;
						}else{
							
							$(interactions.containerId+" .interactionInfoBox")
								.html(eval("msgQuizProfilingQuestionAlreadyCompleted"+wbt.metadata.language))
								.animate(
									{
										backgroundColor:"#fff",
										color: "#666"
									},{
										duration: 3000,
										complete: function(){}
									}
								);
							go=false;
						};
						break;
				}		
				break;
			
			case "distributedSelfTest":
				switch(this.activeInteraction.status){
					case "passed":
					case "failed":					
						
						if(this.ratingIsCompleted){
							this.reviewMode=true;
						}else{
							$(interactions.containerId).html(
								"<div class='interactionInfoBox ui-corner-all' style='background-color:#EFC847;'></div>"
							);
							
							$(interactions.containerId+" .interactionInfoBox")
								.html(this.templateQuestionBlocked("inprogress"))
								.animate(
									{
										backgroundColor:"#fff",
										color: "#666"
									},{
										duration: 3000,
										complete: function(){}
									}
								);
							go=false;
						};
						break;
				};
				break;				
	
			default:
				break;
		}
		return go;
	},
	
	stepShown: function(){

		$("#testInfo").animate(
			{
				backgroundColor:"#fff",
				color: "#666"
			},{
				duration: 3000,
				complete: function(){}
			}
		);
	},
	
	jumpToNextTestPage: function(){
		this.getNextTestPage();
		if(this.nextTestPage!=""){
			content.jump(this.nextTestPage);
		}else{
			this.jumpToResultPage();
		}
	},
	
	jumpToResultPage: function(){
		content.jump("Rating_p");
	},

	getNextTestPage: function(initialId, isRecursive){
	
		this.nextTestPage="";
		initialId = initialId || content.activePage.id;
		isRecursive = isRecursive || false;
		
		var targetId="",
			initialPageFound=false;
			
		for(var i=0;i<wbt.structure.length;i++){
			for(var j=0;j<wbt.structure[i].items.length;j++){
		
				if(initialPageFound){
					if(wbt.structure[i].items[j].status=="notAttempted" || wbt.structure[i].items[j].status=="not attempted" || wbt.structure[i].items[j].status=="incomplete"){
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
	},
	
	getSessionData: function(){

		var retVal={
			total: 0,
			passed: 0,
			failed: 0,
			incomplete: 0,
			mastery: 0,
			score: 0,
			status: "incomplete"
		};
		
		for(var i=0;i<wbt.structure.length;i++){
			for(var j=0;j<wbt.structure[i].items.length;j++){
				var page=wbt.structure[i].items[j];
				if(typeof page.steps=="object"){
					if(page.steps.length>0){
						for(var k=0;k<page.steps.length;k++){
							if(typeof page.steps[k].interaction=="object"){
								if(page.steps[k].interaction.length>0){
									for(var l=0;l<page.steps[k].interaction.length;l++){
										var interaction=page.steps[k].interaction[l];
										retVal.total++;
										switch(interaction.status){
											case "not attempted":
											case "notAttempted":
											case "incomplete":
												retVal.incomplete++;
												break;
											case "passed":
												retVal.passed++;
												break;
											case "failed":
												retVal.failed++;
												break;
										}
									}
								}
							}	
						}
					}
				}
			}
		}
		
		if(retVal.total>0){
			retVal.mastery=Math.round(retVal.total * (scorm.masteryScore/100));
			if(retVal.passed>0 || retVal.failed>0){
				retVal.score=parseInt(round(retVal.passed / retVal.total) * 100);
				if(retVal.passed >= retVal.mastery){
					retVal.status="passed";
				}else{
					if(retVal.incomplete==0){
						retVal.status="failed";
					}
				}
			}
		}
		
		return retVal;
	},
	
	showRating: function(){
		//Down: score <= x.25 the star will be rounded down;
		//Half: score >= x.26 and <= x.75 the star will be a half star;
		//Up: score >= x.76 the star will be rounded up.
		
		if(this.lessonMode!="distributedAssessment"){
			$("#divstepRating_s .rating").raty({
				path: custom+"shared/images",
				starOn : "star.png",
				starOff : "star-empty.png",
				starHalf : "star-half.png",
				readOnly: true,
				half: true,
				hints:
					["","",""],
				noRatedMsg: "",
				number: 3,
				round : {
					down: .26,
					full: .6,
					up: .76
				},
				width: 120,
				score: function(){
					//random, test-purposes only
					//var max=100, min=1;
					//var rndNum=Math.floor(Math.random() * (max - min + 1)) + min;				
					//return (rndNum* 3)/100;
	
					var percent=parseInt($(this).data("result"));
					var stars=0;
					switch(true){
						case (percent<30):
							stars = 0;
							break;
						case (percent>=30 && percent<40):
							stars = 0.5;
							break;
						case (percent>=40 && percent<50):
							stars = 1;
							break;
						case (percent>=50 && percent<60):
							stars = 1.5;
							break;
						case (percent>=60 && percent<70):
							stars = 2;
							break;
						case (percent>=70 && percent<80):
							stars = 2.5;
							break;
						case (percent>=80):
							stars = 3;
							break;
						default:
							stars = 0;
					}
					return stars;
				}
			});
		};
		
		if(isMobile){
			
			if($("#divstepRating_s .rating").length==1){
				$(".blockResultRating")
					.next()
					.slideToggle();			
			}else{
				if(this.lessonMode!="profiling"){
					$(".blockResultRating")
						.click(function(){
							content.dynaPopup(
								"caption:"+$(this).find(".blockResultTitle").html(),
								"type:base64",
								"content:"+encodeBase64($(this).next().html()),
								"width:"+wbt.metadata.stageWidth
							)
						});
				}else{
					$(".blockResultTitle").css({
						cursor: "default",
						textDecoration: "none"
					})
				};
			};
			
		}else{
			
			$("#resultsContainer").css({
				maxWidth: wbt.metadata.stageWidth + "px"
			});
			
			$("#resultsContainer .questionHeader").css({
				width: "100%",
				maxWidth: wbt.metadata.stageWidth - 20 + "px"
			});
			
			$("#resultsContainer .questionBody").css({
				width: "100%",
				maxWidth: wbt.metadata.stageWidth - 20 + "px",
				height: (wbt.metadata.stageHeight - 50 - $(".questionHeader").outerHeight() - $(".questionFooter").outerHeight()) + "px",
				maxHeight: (wbt.metadata.stageHeight - 50 - $(".questionHeader").outerHeight() - $(".questionFooter").outerHeight()) + "px",
				"overflow": "auto"
			});
	
			$("#resultsContainer .questionFooter").css({
				width: "100%",
				maxWidth: wbt.metadata.stageWidth - 20 + "px"
			});
		
			if($("#divstepRating_s .rating").length==1){
				$(".blockResultRating")
					.next()
					.slideToggle();
			}else{
				if(this.lessonMode!="profiling"){
					$(".blockResultRating")
						.click(function(){
							$(".blockResultTitle")
								.removeClass("blockResultTitle_active")
								.addClass("blockResultTitle_inactive");
		
							$(this)
								.next()
								.slideToggle("slow",function(){});
								
							$(this)
								.find(".blockResultTitle")
								.removeClass("blockResultTitle_inactive")
								.addClass("blockResultTitle_active")
							
							$(".blockResultDetails")
								.not(
									$(this).next()
								)
								.slideUp();
						})
						.find(".blockResultTitle")
						.addClass("blockResultTitle_inactive")
				}else{
					$(".blockResultTitle").css({
						cursor: "default",
						textDecoration: "none"
					})
				};
			};
		};
	},
	
	getRating: function(){
		
		var html="",
			resultsHtml="",
			blockResults=[],
			numBlocks=0;
			
		this.ratingIsCompleted=true;
		for(var i=0;i<wbt.structure.length;i++){
			var blockPoints=0,
				blockMaxPoints=0,
				itemsPassed=[],
				itemsFailed=[];
						
			for(var j=0;j<wbt.structure[i].items.length;j++){
				var page=wbt.structure[i].items[j];
				if(typeof page.steps=="object"){
					if(page.steps.length>0){
						for(var k=0;k<page.steps.length;k++){
							if(typeof page.steps[k].interaction=="object"){
								if(page.steps[k].interaction.length>0){
									for(var l=0;l<page.steps[k].interaction.length;l++){
										var interaction=page.steps[k].interaction[l];
										if(interaction.status=="not attempted" || interaction.status=="notAttempted" || interaction.status=="incomplete"){
											this.ratingIsCompleted=false;
										}else{
											blockMaxPoints+=interaction.maxScore;
											blockPoints+=interaction.score;
											switch(interaction.status){
												case "passed":
													itemsPassed.push(decodeBase64(page.title));
													break;
												case "failed":
													itemsFailed.push(decodeBase64(page.title));
													break;
											}
										}
									}
								}
							}	
						}
					}
				};				
			};
			
			if(blockMaxPoints!=0){
				numBlocks++;
				var blockScorePercent=Math.round((blockPoints/blockMaxPoints)*100);
				var blockScoreFloat=(blockPoints/blockMaxPoints)*100;
				
				resultsHtml+=this.templateBlockRating()
					.replace(/{BLOCKTITLE}/g, decodeBase64(wbt.structure[i].title))
					.replace(/{BLOCKSCOREFLOAT}/g, blockScoreFloat)
					.replace(/{BLOCKRESULTCOMPACT}/g, this.templateBlockResultCompact(blockScorePercent));
				
				blockResults.push({
					title: decodeBase64(wbt.structure[i].title),
					score: blockScoreFloat
				});
				
				switch(this.lessonMode){
					case "profiling":
						break;
					default:
						switch(true){
							case (itemsPassed.length>0 && itemsFailed.length==0):
								var tdWidths = ["100%", "0%"];
								break;
							case (itemsPassed.length==0 && itemsFailed.length>0):
								var tdWidths = ["0%", "100%"];
								break;
							default:
								var tdWidths = ["50%", "50%"];
								break;
						}
	
						resultsHtml+=this.templateBlockDetails(blockPoints, blockMaxPoints)
							.replace(/{DETAILS}/, this.templateBlockPages(itemsPassed, itemsFailed, tdWidths))
							.replace(/{BLOCKSCOREPERCENT}/, blockScorePercent);
						break;
				}
				
				wbt.structure[i].blockRating = { 
					points: blockPoints,
					maxPoints: blockMaxPoints,
					itemsPassed: itemsPassed,
					itemsFailed: itemsFailed,
					scorePercent: blockScorePercent
				};
				
			}
		};

		if(this.ratingIsCompleted){
			
			html=this.templateRatingCompleted()
				.replace(/{HEADER}/, this.templateRatingCompletedHeader())
				.replace(/{RESULTSRATING}/, resultsHtml)
				.replace(/{ICONSCHARTS}/, (numBlocks>1 && this.lessonMode!="profiling") ? this.templateIconsCharts() : "")
				.replace(/{TIPP}/, (isMobile && numBlocks>1) ? this.templateTippMultipleBlocks() : "");
			
			switch(this.lessonMode){
				case "profiling":

					html=html
						.replace(/{INTRO}/, this.templateRatingIntro())
						.replace(/{RESETACTIVE}/, "none")
						.replace(/{BTNRATINGINFO}/, this.templateBtnRatingInfo());					
					
					if(scorm.scoVersion=="scormCon"){
						scorm.doScormCommand("lmsHandleDistributedResults", JSON.stringify({items: blockResults}));
					}else{
						scorm.score=100;
						scorm.updateLessonStatus(true);
						this.setExitConfirmationMessage();
					};
					
					window.setTimeout(
						function(){
							interactions.initCertifier();
						}, 1500);
						
					break;
				
				case "distributedAssessment":

					html=html
						.replace(/{INTRO}/, this.templateRatingIntro())
						.replace(/{RESETACTIVE}/, "none")
						.replace(/{BTNRATINGINFO}/, "");
						
					var data=this.getSessionData();
					scorm.score=data.score;
					scorm.updateLessonStatus(true);
					this.setExitConfirmationMessage();
					
					this.reviewMode=false;
					
					break;
				
				case "distributedSelfTest":

					html=html
						.replace(/{INTRO}/, this.templateRatingIntro())
						.replace(/{RESETACTIVE}/, "inline-block")
						.replace(/{BTNRATINGINFO}/, this.templateBtnRatingInfo());
					
					var data=this.getSessionData();
					scorm.score=data.score;
					scorm.updateLessonStatus(true);
					this.setExitConfirmationMessage();
						
					this.reviewMode=true;
					break;
			}
			
			window.setTimeout(
				function(){
					$("#progressIndicator").fadeOut("slow", function(){
						$("#progressIndicator canvas").remove();
						try{
							delete(interactions.progressChart);
						}catch(e){
							interactions.progressChart=null;
						}
					})
				}, 3500);			
			
		}else{
			html=this.templateRatingIncomplete();
		};
			
		return html;
	},
	
	showHints: function(){
		
		var html=this.templateTestHints();
		
		if(isMobile){
			content.dynaPopup(
				"type:base64",
				"content:"+encodeBase64("<div>" + html + "</div>"));
		}else{
			$.elpsOverlay("show", {
				content: html,
				closeKey: true,
				icon: "information",
				bound: $("#divcontainer"),
				width: "600px"
			});
		}
	},
	
	showRatingInfo: function(){
		
		var html=this.templateRatingInfo(this.lessonMode);
		
		switch(this.lessonMode) {
			case "profiling":
			case "distributedAssessment":
				break;			
			case "distributedSelfTest":
				html += this.templateRecessInfo();
				break;
		}
		
		if(isMobile){
			content.dynaPopup(
				"type:base64",
				"content:"+encodeBase64("<div>" + html + "</div>"));
		}else{
			$.elpsOverlay("show", {
				content: html,
				closeKey: true,
				icon: "information",
				bound: $("#divcontainer"),
				width: "750px"
			});
		}
	},
	
	//Certifier
	certifierOptions: {
		urls: {
				testApi: "http://certifier.learningsystem.de/test.php",
				pdfApi: "http://certifier.learningsystem.de/createpdf.php",
				pdfFolder: "http://certifier.learningsystem.de/pdf/",
				tinyurlApi: "" //http://certifier.learningsystem.de/tinyurl.php"
		},		
		lng: {
			pagination: {
				_de: "Seite",
				_en: "Page"
			},
			head: {
				_de: "Individuelle Lernempfehlung",
				_en: "Learning recommendation"
			}
		}
	},
	
	certifierData: {
		initialized: false,
		filename: "",
		shortUrl: "",
		html: ""
	},
	
	initCertifier: function(){
		
		if(this.certifierData.initialized)return;
		
		if(typeof defaultSettings.certifierOptions=="object"){
			$.extend(true, this.certifierOptions, defaultSettings.certifierOptions)
		};
		
		if(this.certifierOptions.urls.pdfApi==""){
			return;
		};
		
		if(interactions.certifierOptions.urls.testApi!=""){
			//host available?
			var xhr = $.ajax({
				type: "POST",
				url: interactions.certifierOptions.urls.testApi,
				data: "dummy=1",
				success: function(res){
					$.log(interactions.certifierOptions.urls.testApi + " ok!");
					interactions.buildCertifier();
				},
				error: function(res){
					$.log(interactions.certifierOptions.urls.testApi + ": Error!");
				}
			});
		}else{
			interactions.buildCertifier();
		}
	},
	
	buildCertifier: function(){
		
		$("#pdfButton").show();
		
		$("#print").remove();
		$("#legend").remove();
		
		//format results
		$("<div/>", {
			id: "print",
			css: {
				display: "none"
			}
		}).appendTo($("body"));

		$(".questionHeader").first().clone().appendTo("#print");
		$(".questionBody").first().clone().appendTo("#print");

		$("#print .questionText").unwrap();
		$("#print div").removeClass("resultsIntro");
		$("#print input").remove();
		$("#print").find("*").removeAttr("title alt style");
		
		//format legend
		$("<div/>", {
			id: "legend",
			html: this.templateRatingInfo("profiling"),
			css: {
				display: "none"
			}
		}).appendTo($("body"));
		
		//create page html
		var html=this.templatePrintResults("profiling")
			.replace(/{PAGE}/g, this.certifierOptions.lng.pagination[wbt.metadata.language])
			.replace(/{HEAD}/g, this.certifierOptions.lng.head[wbt.metadata.language])
			.replace(/{PROJECTTITLE}/g, decodeBase64(wbt.metadata.projectTitle))
			.replace(/{TITLE}/g, decodeBase64(wbt.metadata.title));
	
		//transform relative paths to absolute paths
		var regex = new RegExp(wbt.metadata.id + "/", "g"),
			loc = window.location;
		var pathName = loc.pathname.substring(0, loc.pathname.lastIndexOf("/") + 1);
			pathName = loc.href.substring(0, loc.href.length - ((loc.pathname + loc.search + loc.hash).length - pathName.length));
			pathName = pathName.replace(regex,custom.split("../")[1]);

			regex = new RegExp(custom, "g");		
			html = html.replace(regex, pathName);
		
		//create random filename
		var createRandomFilename=function(string_length, extension){
			var chars = "0123456789abcdefghiklmnopqrstuvwxyz";
				var rndString = "";
				for (var i=0; i<string_length; i++) {
					var rnum = Math.floor(Math.random() * chars.length);
					rndString += chars.substring(rnum,rnum+1);
				}
				return rndString + "." + extension;
		};	
		
		var filename = createRandomFilename(16, "pdf");
		
		var getShortLink = function(longurl){
			$("<div/>", {
				id: "shorturl",
				css: {
					display: "none"
				}
			}).appendTo($("body"));
			
			var xhr = $.ajax({
				type: "POST",
				url: interactions.certifierOptions.urls.tinyurlApi,
				data: "url="+longurl,
				success: function(res){
					$.log(res);
					if(res == "Error") {
						interactions.certifierData.shortUrl="";
					} else {
						interactions.certifierData.shortUrl=res;
					}
				},
				error: function(res){
					$.log(res);
					interactions.certifierData.shortUrl="";
				}
			});
		}
		
		//clean up
		$("#print").remove();
		$("#legend").remove();
		
		this.certifierData.filename = filename;
		this.certifierData.html = html;
		this.certifierData.initialized = true;
		
		if(interactions.certifierOptions.urls.tinyurlApi!=""){
			//dummy:
			//interactions.certifierOptions.url.pdfFolder="http://www.learningsystem.de/"
			getShortLink(this.certifierOptions.urls.pdfFolder + filename);
		}
	},
		
	launchCertifier: function(){
	
		var html=this.certifierData.html;
			
		if(interactions.certifierData.shortUrl!=""){
			var shortlinkHtml=this.templateShortlinkInfo().replace(/{SHORTLINK}/g,this.certifierData.shortUrl);
		}else{
			var shortlinkHtml=this.templateShortlinkInfo().replace(/{SHORTLINK}/g,this.certifierOptions.urls.pdfFolder + this.certifierData.filename);
		};
		
		html=html.replace(/{SHORTLINKINFO}/,shortlinkHtml);
	
		//create a temporary submit form
		var fields = {
			html: html,
			filename: this.certifierData.filename
		};
		
		var form = $("<form>").attr({
			method: "POST",
			action: this.certifierOptions.urls.pdfApi
		}).css({
			display: "none"
		});
	
		var addFormData = function(name, data) {
			if ($.isArray(data)) {
				for (var i = 0; i < data.length; i++) {
					var value = data[i];
					addFormData(name + "[]", value);
				}
			} else if (typeof data === "object") {
				for (var key in data) {
					if (data.hasOwnProperty(key)) {
						addFormData(name + "[" + key + "]", data[key]);
					}
				}
			} else if (data != null) {
				form.append($("<input>").attr({
					type: "hidden",
					name: String(name),
					value: String(data)
				}));
			}
		};
	
		for (var key in fields) {
			if (fields.hasOwnProperty(key)) {
				addFormData(key, fields[key]);
			}
		};
		
		//submit
		form.appendTo("body").submit();
		
	},
	
	/***** templates ****/
	templateIntroPage: function(){
		return "" +
			"<div class='question' style='width: " + (wbt.metadata.stageWidth-40) + "px'>" +
				"<div class='questionHeader'>" +
					"<div class='questionText'>{INTRO}</div>" +
				"</div>" +
				"<div>" +
					"<table width='100%' border='0' cellspacing='4' cellpadding='4'>" +
						"<tr>" +
							"<td valign='top'>" +
								"<div class='description'>" +
									"<div>{TESTINFO}</div>" +
								"</div>" +
							"</td>" +
							"<td rowspan='2' valign='top'>" +
								"<div style='background: url({IMGPATH}) top left no-repeat;' class='questionImage dropShadow'></div>" +
							"</td>" +
						"</tr>" +
						"<tr>" +
							"<td valign='bottom'>" +
								"<div class='description'>" +
									"<div>{STARTMSG}</div>" +
								"</div>" +
							"</td>" +
						"</tr>" +
					"</table>" +
				"</div>" +
				"<div class='questionFooter'>" +
					"<button class='ui-button-primary' data-role='button' data-inline='true' data-theme='a' onclick='interactions.jumpToNextTestPage();'>" +
						(wbt.metadata.language=="_de" ? "Starten" : "Start") +
					"</button> " +
					"<button class='ui-button' data-role='button' data-inline='true' data-theme='b' onclick='interactions.showHints();'>" +
						(wbt.metadata.language=="_de" ? "Hinweise zur Bedienung" : "Instructions") +
					"</button>" +
				"</div>" +				
		   "</div>";
	},
	
	templateTestInfo: function(){
		var html="",
			data=this.getSessionData(),
			style="padding: 10px; border-radius:4px; margin-bottom:5px; background-color:#EFC847;";
		
		switch(this.lessonMode){
			case "profiling":
				if(wbt.structure.length>1){
					switch(wbt.metadata.language){
						case "_de":
							html="" +
								"<div style='"+style+"' id='testInfo'>" +
									"Der Fragenkatalog umfasst insgesamt <nobr><strong>" + data.total + " Aufgaben</strong></nobr> " +
									"aus <nobr><strong>" + wbt.structure.length + " Themengebieten</strong>.</nobr>" +
								"</div>";
								break;
						case "_en":
							html="" +
								"<div style='"+style+"' id='testInfo'>" +
									"The questionnaire comprises <nobr><strong>" + data.total + " tasks</strong></nobr> " +
									"from <nobr><strong>" + wbt.structure.length + " topics.</strong>.</nobr>" +
								"</div>";
								break;
					}
				}else{
					switch(wbt.metadata.language){
						case "_de":
							html="" +
								"<div style='"+style+"' id='testInfo'>" +
									"Der Fragenkatalog umfasst " + data.total + " Aufgaben." +
								"</div>";
							break;
						case "_en":
							html="" +
								"<div style='"+style+"' id='testInfo'>" +
									"The questionnaire comprises " + data.total + " tasks." +
								"</div>";
							break;
					};
				}
				break;
			case "distributedAssessment":
			case "distributedSelfTest":
				if(wbt.structure.length>1){
					if(data.total==data.mastery){
						switch(wbt.metadata.language){
							case "_de":
								html="" +
									"<div style='"+style+"' id='testInfo'>" +
										"Der Fragenkatalog umfasst insgesamt <nobr><strong>" + data.total + " Aufgaben</strong></nobr> " +
										"aus <nobr><strong>" + wbt.structure.length + " Themengebieten</strong>.</nobr> " +
										"Um ihn erfolgreich zu absolvieren, müssen Sie <nobr><strong>alle Fragen</strong></nobr> richtig beantworten." +
									"</div>";
									break;
							case "_en":
								html="" +
									"<div style='"+style+"' id='testInfo'>" +
										"The questionnaire comprises <nobr><strong>" + data.total + " tasks</strong></nobr> " +
										"from <nobr><strong>" + wbt.structure.length + " subject areas</strong>.</nobr> " +
										"To pass the test, you must answer <nobr><strong>all questions</strong></nobr> correctly." +
									"</div>";
									break;
						};
					}else{
						switch(wbt.metadata.language){
							case "_de":
								html="" +
									"<div style='"+style+"' id='testInfo'>" +
										"Der Fragenkatalog umfasst insgesamt <nobr><strong>" + data.total + " Aufgaben</strong></nobr> " +
										"aus <nobr><strong>" + wbt.structure.length + " Themengebieten</strong>.</nobr> " +
										"Um ihn erfolgreich zu absolvieren, müssen Sie mindestens <nobr><strong>" + data.mastery + " Fragen</strong></nobr> " +
										"richtig beantworten." +
									"</div>";
								break;
							case "_en":
								html="" +
									"<div style='"+style+"' id='testInfo'>" +
										"The questionnaire comprises <nobr><strong>" + data.total + " tasks</strong></nobr> " +
										"from <nobr><strong>" + wbt.structure.length + " subject areas</strong>.</nobr> " +
										"To pass the test, you must answer at least <nobr><strong>" + data.mastery + " questions</strong></nobr> " +
										"correctly." +
									"</div>";
								break;
						};
					}
				}else{
					switch(wbt.metadata.language){
						case "_de":
							html="" +
								"<div style='"+style+"' id='testInfo'>" +
									"Um den Test erfolgreich zu absolvieren, müssen Sie mindestens " +
									data.mastery + " der " + data.total + " Fragen richtig beantworten." +
								"</div>";
								break;
						case "_en":
							html="" +
								"<div style='"+style+"' id='testInfo'>" +
									"To pass the test, you must answer at least " +
									data.mastery + " out of " + data.total + " questions correctly." +
								"</div>";
								break;
					}
				}
				break;
		};

		if(wbt.metadata.typicalLearningTime!=""){
				var lt=decodeBase64(wbt.metadata.typicalLearningTime).split(":");
				if(lt.length>2)lt.pop();
				if(lt[0]=="00")lt.shift();
				
				style="background:#fff url("+custom+"shared/images/learningtime.png) no-repeat;padding: 10px 10px 10px 40px;margin-top:10px;";
				
				switch(wbt.metadata.language){
					case "_de":
						html+="" +
							"<div style='"+style+"'>" +
								"Für die Bearbeitung des Fragenkatalogs sollten Sie rund " +
								"<nobr>" +
									(lt.length > 1 ? (lt.join(":") + " Std.") : (lt[0] + " Minuten")) +
								"</nobr> einplanen." +
							"</div>";
						break;
					case "_en":
						html+="" +
							"<div style='"+style+"'>" +
								"Working through the questionnaire usually takes about " +
								"<nobr>" +
									(lt.length > 1 ? (lt.join(":") + " hrs.") : (lt[0] + " min.")) +
								"</nobr>" +
							"</div>";
						break;
				};
		};

		return html;
	},
	
	templateStartMsg: function(){
		var html="";
		switch(wbt.metadata.language){
			case "_de":
				html = "" +
					"<div style='margin-top:10px;padding:10px;font-size:small;'>" +
						"Klicken Sie auf ''Starten'', um mit der Bearbeitung des Fragenkatalogs zu beginnen." +
					"</div>";
				break;
			case "_en":
				html = "" +
					"<div style='margin-top:10px;padding:10px;font-size:small;'>" +
						"Click ''Start'', to begin working through the questionnaire." +
					"</div>";
				break;
		};
		return html;
	},
	
	templateTestHints: function(){
		var html="";
		switch(wbt.metadata.language){
			case "_de":
				html = "" +
					"<div>" +
						"<p>" +
							"Sie können die Aufgaben der Reihe nach oder in der Reihenfolge Ihrer Wahl " +
							"bearbeiten. Wichtig ist, dass Sie den gesamten Fragenkatalog in einer Sitzung durcharbeiten, " +
							"denn Zwischenstände werden nicht dauerhaft gespeichert." +
						"</p>" +
						"<p>" +
							"Sie können jede Aufgabe nur einmal lösen! Lesen Sie daher die Aufgabenstellung aufmerksam durch, " +
							"bevor Sie sich für eine Antwort entscheiden. Falls Sie sich hinsichtlich der Bedienung unsicher sind, klicken Sie " +
							"auf die Schaltfläche ''Hilfe'', die Ihnen bei jeder Aufgabe zur Verfügung steht." +
						"</p>" +
						"<p>" +
							"Anhand des Fortschrittanzeigers erkennen Sie, wie weit Sie mit der Bearbeitung des " +
							"Fragenkatalogs vorangekommen sind. Bereits beantwortete Aufgaben werden außerdem " +
							"im Inhaltsverzeichnis gekennzeichnet." +
						"</p>" +
						"<p>" +
							"Eine Auswertung Ihrer Antworten erhalten Sie, sobald Sie " +
							"<b>alle</b> Fragen beantwortet haben." +
						"</p>" +
					"</div>";
				break;
			case "_en":
				html = "" +
					"<div>" +
						"<p>" +
							"You can solve the tasks in sequence or in the order of your choice. " +
							"It is important that you work through the whole questionnaire in a single session, " +
							"because intermediate results are not stored permanently." +
						"</p>" +
						"<p>" +
							"Note that each question can be solved only once! Therefore read each task carefully before you make your choice. " +
							"If you are unsure about what to do, you should click the ''Help'' button that is available on every page within the test." +
						"</p>" +
						"<p>" +
							"A progress indicator shows the overall progress during the test. " +
							"Completed tasks are also highlighted in the Table of Contents." +
						"</p>" +
						"<p>" +
							"You will receive an evaluation of your answers as soon as you have solved <strong>all</strong> tasks." +
						"</p>" +
					"</div>";
				break;
		};
		return html;
	},
	
	templateBlockedPage: function(){
		var html="";
		switch(wbt.metadata.language){
			case "_de":
				html = "" +
					"<div class='question' style='width: " + (wbt.metadata.stageWidth-40) + "px'>" +
						"<table width='100%' border='0' cellspacing='4' cellpadding='4'>" +
							"<tr>" +
								"<td valign='top'>" +
									"<div class='description'>" +
										"<p>" +
											"Sie haben diesen Fragenkatalog bereits vollständig bearbeitet. " +
											"Eine Wiederholung ist nicht vorgesehen." +
										"</p>" +
										"<p>" +
											"Bitte klicken Sie auf 'Beenden'." +
										"</p>" +
									"</div>" +
								"</td>" +
								"<td rowspan='2' valign='top'>" +
									"<div style='background: url({IMGPATH}) top left no-repeat;' class='questionImage dropShadow'></div>" +
								"</td>" +
							"</tr>" +
						"</table>" +
						"<div class='questionFooter'>" +
							"<button class='ui-button-primary' data-role='button' data-inline='true' data-theme='a' onclick='scorm.exitSession();'>" +
								"Beenden" +
							"</button>" +
						"</div>" +				
				   "</div>";
				break;
			case "_en":
				html = "" +
					"<div class='question' style='width: " + (wbt.metadata.stageWidth-40) + "px'>" +
						"<table width='100%' border='0' cellspacing='4' cellpadding='4'>" +
							"<tr>" +
								"<td valign='top'>" +
									"<div class='description'>" +
										"<p>" +
											"You already have completed this questionnaire. " +
											"Further attempts are not provided." +
										"</p>" +
										"<p>" +
											"Click 'Finish'." +
										"</p>" +
									"</div>" +
								"</td>" +
								"<td rowspan='2' valign='top'>" +
									"<div style='background: url({IMGPATH}) top left no-repeat;' class='questionImage dropShadow'></div>" +
								"</td>" +
							"</tr>" +
						"</table>" +
						"<div class='questionFooter'>" +
							"<button class='ui-button-primary' data-role='button' data-inline='true' data-theme='a' onclick='scorm.exitSession();'>" +
								"Finish" +
							"</button>" +
						"</div>" +				
				   "</div>";
				break;
		};
		return html;
	},
	
	templateBlockIntroPage: function(activeBlockNum){
		var txt="", html="";
		switch(wbt.metadata.language){
			case "_de":
				switch(activeBlockNum){
					case 1:
						txt="" +
							"Bearbeiten Sie als erstes bitte einige Aufgaben zum Themengebiet ''{TITLE}''. " +
							"Zu Ihrer Orientierung sehen Sie hier eine Übersicht der Themen, die in den " +
							"Aufgaben behandelt werden:"
						break;
					case 2:
						txt="" +
							"Das zweite Themengebiet ist ''{TITLE}''. Im einzelnen werden Sie Fragen zu " +
							"folgenden Themen beantworten:"
						break;
					case 3:
						txt="" +
							"Beantworten Sie nun bitte die Aufgaben zum dritten Themengebiet: ''{TITLE}''."
						break;
					case 4:
						txt="" +
							"Wir kommen nun zum vierten Themengebiet: ''{TITLE}''."
						break;
					case 5:
						txt="" +
							"Das fünfte Themengebiet trägt den Titel ''{TITLE}''. Beantworten Sie bitte " +
							"die Aufgaben, die Sie hier in der Übersicht sehen:"
						break;
					default:
						txt="" +
							"Bearbeiten Sie nun einige Aufgaben zum Themengebiet ''{TITLE}''." +
							"Zu Ihrer Orientierung sehen Sie hier eine Übersicht der Fragen:";
						break;
				};
				
				html = "" +
					"<div class='question' style='width: " + (wbt.metadata.stageWidth-40) + "px'>" +
						"<div class='questionHeader'>" +
							"<div class='questionText'>" +
								txt +
							"</div>" +
						"</div>" +
						"<div style='padding:10px;'>" +
							"<table width='100%' border='0' cellspacing='4' cellpadding='4'>" +
								"<tr>" +
									"<td valign='top'>" +
										"<div class='description'>" +
											"{TOPICS}" +
										"</div>" +
									"</td>" +
									"<td rowspan='2' valign='top'>" +
										"<div style='background: url({IMGPATH}) top left no-repeat;' class='questionImage dropShadow'></div>" +
									"</td>" +
								"</tr>" +
								"<tr>" +
									"<td valign='bottom'>" +
										"<div style='font-size:small;'>" +
											"Bitte klicken Sie auf ''Weiter'', um mit der Bearbeitung der Aufgaben " +
											"zu diesem Themengebiet zu beginnen." +
										"</div>" +
									"<td>" +
								"</tr>" +
							"</table>" +
						"</div>" +
						"<div style='clear:both;'></div>" +
						"<div class='questionFooter'>" +
							"<button class='ui-button-primary' data-role='button' data-inline='true' data-theme='a' onclick='interactions.jumpToNextTestPage();'>" +
								"Weiter" +
							"</button>" +
						"</div>" +				
					"</div>";
				break;
			
			case "_en":
				switch(activeBlockNum){
					case 1:
						txt="" +
							"At the beginning of the questionnaire, please answer some questions on the subject area ''{TITLE}''. " +
							"For your orientation we provide you with an overview of the topics that are covered in the tasks:"
						break;
					case 2:
						txt="" +
							"The second subject area is ''{TITLE}''. Specifically, you will answer questions on the following topics:"
						break;
					case 3:
						txt="" +
							"Please solve the following tasks on the subject area ''{TITLE}''."
						break;
					case 4:
						txt="" +
							"We now come to the fourth subject area: ''{TITLE}''."
						break;
					case 5:
						txt="" +
							"The 5th subject area is ''{TITLE}''. Please solve the following tasks:"
						break;
					default:
						txt="" +
							"Please work on the tasks regarding the subject area ''{TITLE}''." +
							"For your orientation you see an overview of the questions:";
						break;
				};
				
				html = "" +
					"<div class='question' style='width: " + (wbt.metadata.stageWidth-40) + "px'>" +
						"<div class='questionHeader'>" +
							"<div class='questionText'>" +
								txt +
							"</div>" +
						"</div>" +
						"<div style='padding:10px;'>" +
							"<table width='100%' border='0' cellspacing='4' cellpadding='4'>" +
								"<tr>" +
									"<td valign='top'>" +
										"<div class='description'>" +
											"{TOPICS}" +
										"</div>" +
									"</td>" +
									"<td rowspan='2' valign='top'>" +
										"<div style='background: url({IMGPATH}) top left no-repeat;' class='questionImage dropShadow'></div>" +
									"</td>" +
								"</tr>" +
								"<tr>" +
									"<td valign='bottom'>" +
										"<div style='font-size:small;'>" +
											"Click ''Continue'' to start working through the questions." +
										"</div>" +
									"<td>" +
								"</tr>" +
							"</table>" +
						"</div>" +
						"<div style='clear:both;'></div>" +
						"<div class='questionFooter'>" +
							"<button class='ui-button-primary' data-role='button' data-inline='true' data-theme='a' onclick='interactions.jumpToNextTestPage();'>" +
								"Continue" +
							"</button>" +
						"</div>" +				
					"</div>";
				break;
		};
		return html;
	},
	
	templateRatingCompleted: function(){
		
		var html="";
		switch(wbt.metadata.language){
			case "_de":
		
				if(isMobile){
					return "" +
						"<div>" +
							"<div id='resultsContainer' class='question'>" +
								"{HEADER}" +
								"<div class='questionBody' style='position:relative;padding:10px;'>" +
									"{ICONSCHARTS}" +
									"<div id='resultRating' >"+
										"{RESULTSRATING}" +
									"</div>" +				
								"</div>" +
								"<div style='clear:both;'>{TIPP}</div>" +
								"<div class='questionFooter'>" +
									"{BTNRATINGINFO}" +							
									"<span style='display:inline-block;width:5px;'></span>" +
									(window.location.protocol.indexOf("http")!=-1
										?	"<button id='pdfButton' style='display:none;' data-role='button' data-theme='b' data-inline='true' onclick='interactions.launchCertifier();'>" +
												"Als PDF speichern" +
											"</button>"
										: 	""
									) +							
									
								"</div>" +
							"</div>" +
						"</div>";			
				}else{
					return "" +
						"<div id='resultsContainer' style='width:" + (wbt.metadata.stageWidth-40) + "px;'>" +
							"{HEADER}" +
							"<div class='questionBody' style='position:relative;'>" +
								"{ICONSCHARTS}" +
								"<div id='resultRating' >"+
									"{RESULTSRATING}" +
								"</div>" +				
							"</div>" +
							"<div style='clear:both;'></div>" +
							"<div class='questionFooter'>" +
								"{BTNRATINGINFO}" +
								"<span style='display:inline-block;width:5px;'></span>" +
								"<button class='ui-button' style='display:{RESETACTIVE}' onclick='doMenuItem(\"reset\");'>" +
									"Test wiederholen" +
								"</button>" +
								"<span style='display:inline-block;width:5px;'></span>" +
								"<button class='ui-button-primary' onclick='doMenuItem(\"exit\");'>" +
									"Beenden" +
								"</button>" +
								(window.location.protocol.indexOf("http")!=-1
									?	"<span style='display:inline-block;width:5px;'></span>" +
										"<button id='pdfButton' style='display:none;' class='ui-button' onclick='interactions.launchCertifier();'>" +
											"Als PDF speichern" +
										"</button>"
									: 	""
								) +
							"</div>" +
						"</div>";
				}
				break;
			case "_en":
				
				if(isMobile){
					return "" +
						"<div>" +
							"<div id='resultsContainer' class='question'>" +
								"{HEADER}" +
								"<div class='questionBody' style='position:relative;padding:10px;'>" +
									"{ICONSCHARTS}" +
									"<div id='resultRating' >"+
										"{RESULTSRATING}" +
									"</div>" +				
								"</div>" +
								"<div style='clear:both;'>{TIPP}</div>" +
								"<div class='questionFooter'>" +
									"{BTNRATINGINFO}" +							
									"<span style='display:inline-block;width:5px;'></span>" +
									(window.location.protocol.indexOf("http")!=-1
										?	"<button id='pdfButton' style='display:none;' data-role='button' data-theme='b' data-inline='true' onclick='interactions.launchCertifier();'>" +
												"Save as PDF" +
											"</button>"
										: 	""
									) +							
									
								"</div>" +
							"</div>" +
						"</div>";			
				}else{
					return "" +
						"<div id='resultsContainer' style='width:" + (wbt.metadata.stageWidth-40) + "px;'>" +
							"{HEADER}" +
							"<div class='questionBody' style='position:relative;'>" +
								"{ICONSCHARTS}" +
								"<div id='resultRating' >"+
									"{RESULTSRATING}" +
								"</div>" +				
							"</div>" +
							"<div style='clear:both;'></div>" +
							"<div class='questionFooter'>" +
								"{BTNRATINGINFO}" +
								"<span style='display:inline-block;width:5px;'></span>" +
								"<button class='ui-button' style='display:{RESETACTIVE}' onclick='doMenuItem(\"reset\");'>" +
									"Repeat the test" +
								"</button>" +
								"<span style='display:inline-block;width:5px;'></span>" +
								"<button class='ui-button-primary' onclick='doMenuItem(\"exit\");'>" +
									"Finish" +
								"</button>" +
								(window.location.protocol.indexOf("http")!=-1
									?	"<span style='display:inline-block;width:5px;'></span>" +
										"<button id='pdfButton' style='display:none;' class='ui-button' onclick='interactions.launchCertifier();'>" +
											"Save as PDF" +
										"</button>"
									: 	""
								) +
							"</div>" +
						"</div>";
				}
				break;
		};
		return html;
	},
	
	templateBtnRatingInfo: function(){
		
		var msg="";
		switch(wbt.metadata.language){
			case "_de":
				msg = "Hinweise zur Auswertung";
				break;
			case "_en":
				msg = "Information on the evaluation";
				break;
		}
		
		if(isMobile){
			return "" +
				"<button data-role='button' data-theme='b' data-inline='true' onclick='interactions.showRatingInfo();'>" +
					msg +
				"</button>";
		}else{
			return "" +
				"<button class='ui-button' onclick='interactions.showRatingInfo();'>" +
					msg +
				"</button> ";
		}
	},
	
	templateIconsCharts: function(){
		var html="";
		if(isMobile){
			html = "" +
				"<div id='icon_charts' style='position:absolute;top:0;right:0;z-index:10;background:#fff;opacity:.5;padding:10px;'>" +
					"<img id='icon_chart_bar' src='"+custom+"shared/images/chart_bar.png' style='cursor:pointer;padding:2px 5px;opacity:.4;' onclick='interactions.visualizeResults(\"bar\");' />" +
					"<img id='icon_chart_line' src='"+custom+"shared/images/chart_line.png' style='cursor:pointer;padding:2px 5px;opacity:.4;' onclick='interactions.visualizeResults(\"line\");' />" +
					"<img id='icon_chart_radar' src='"+custom+"shared/images/chart_radar.png' style='cursor:pointer;padding:2px 5px;opacity:.4;' onclick='interactions.visualizeResults(\"radar\");' />" +
				"</div>";
		}else{
			switch(wbt.metadata.language){
				case "_de":
					html = "" +
						"<div id='icon_charts' style='position:absolute;top:0;right:0;z-index:10;background:#fff;opacity:.5;padding:10px;'>" +
							"<img id='icon_chart_bar' src='"+custom+"shared/images/chart_bar.png' style='cursor:pointer;padding:2px 5px;opacity:.4;' " +
								"title='Visualisierung als Balkendiagramm' class='tooltip' onclick='interactions.visualizeResults(\"bar\");' />" +
							"<img id='icon_chart_line' src='"+custom+"shared/images/chart_line.png' style='cursor:pointer;padding:2px 5px;opacity:.4;' " +
								"title='Visualisierung als Kurvendiagramm' class='tooltip' onclick='interactions.visualizeResults(\"line\");' />" +
							"<img id='icon_chart_radar' src='"+custom+"shared/images/chart_radar.png' style='cursor:pointer;padding:2px 5px;opacity:.4;' " +
								"title='Visualisierung als Netzdiagramm' class='tooltip' onclick='interactions.visualizeResults(\"radar\");' />" +
						"</div>";
					break;
				case "_en":
					html = "" +
						"<div id='icon_charts' style='position:absolute;top:0;right:0;z-index:10;background:#fff;opacity:.5;padding:10px;'>" +
							"<img id='icon_chart_bar' src='"+custom+"shared/images/chart_bar.png' style='cursor:pointer;padding:2px 5px;opacity:.4;' " +
								"title='Visualization as a bar chart' class='tooltip' onclick='interactions.visualizeResults(\"bar\");' />" +
							"<img id='icon_chart_line' src='"+custom+"shared/images/chart_line.png' style='cursor:pointer;padding:2px 5px;opacity:.4;' " +
								"title='Visualization as a curve chart' class='tooltip' onclick='interactions.visualizeResults(\"line\");' />" +
							"<img id='icon_chart_radar' src='"+custom+"shared/images/chart_radar.png' style='cursor:pointer;padding:2px 5px;opacity:.4;' " +
								"title='Visualization as a spider chart' class='tooltip' onclick='interactions.visualizeResults(\"radar\");' />" +
						"</div>";
					break;
			}
		}
		
		return html;
	},
	
	templateRatingCompletedHeader: function(){
		
		var html="";
		switch(this.lessonMode){
			case "profiling":
				html= "" +
					"<div class='questionHeader'>" +
						"<div class='questionText resultsIntro'>{INTRO}</div>" +
					"</div>";
				break;
			
			case "distributedSelfTest":
				var data=this.getSessionData();
				switch(data.status){
					case "passed":						
						switch(wbt.metadata.language){
							case "_de":						
								html+="" +
									"<div class='questionHeader' id='testInfo' style='background-color:#D6E877;'>" +
										"<div class='questionText' style='background-image:url("+custom+"shared/images/passed.png);'>" +
											"Herzlichen Glückwunsch! Sie haben " +
												"<span class='tooltip' style='cursor:pointer;border-bottom:thin dotted;' title='...das entspricht " + data.score + "%'>" +
													data.passed + " von " + data.total + " Aufgaben " +
												"</span> " +
											"richtig beantwortet und den Selbsttest erfolgreich abgeschlossen. " +
											"{INTRO}" +
										"</div>" +
									"</div>";
								break;
							case "_en":						
								html+="" +
									"<div class='questionHeader' id='testInfo' style='background-color:#D6E877;'>" +
										"<div class='questionText' style='background-image:url("+custom+"shared/images/passed.png);'>" +
											"Congratulations! You have solved " +
												"<span class='tooltip' style='cursor:pointer;border-bottom:thin dotted;' title='...corresponding " + data.score + "%'>" +
													data.passed + " out of " + data.total + " tasks " +
												"</span> " +
											"correctly. Thus you have passed the test successfully." +
											"{INTRO}" +
										"</div>" +
									"</div>";
								break;
						};
						break;
					case "failed":
						switch(wbt.metadata.language){
							case "_de":	
								html+="" +
									"<div class='questionHeader' id='testInfo' style='background-color:#E84E34;'>" +
										"<div class='questionText' style='background-image:url("+custom+"shared/images/failed.png);'>" +
											"Sie haben " +
												"<span class='tooltip' style='cursor:pointer;border-bottom:thin dotted;' title='...das entspricht " + data.score + "%'>" +
													data.passed + " von " + data.total + " Aufgaben " +
												"</span> " +
											"richtig gelöst. Da Sie weniger als " + data.mastery + " Aufgaben richtig gelöst haben, ist " +
											"eine Vertiefung der Lerninhalte empfehlenswert. Zu Ihrer Orientierung können Sie hier die Ergebnisse im Detail ansehen:" +
										"</div>" +
									"</div>";
								break;
							case "_en":	
								html+="" +
									"<div class='questionHeader' id='testInfo' style='background-color:#E84E34;'>" +
										"<div class='questionText' style='background-image:url("+custom+"shared/images/failed.png);'>" +
											"You have solved " +
												"<span class='tooltip' style='cursor:pointer;border-bottom:thin dotted;' title='...corresponding " + data.score + "%'>" +
													data.passed + " out of " + data.total + " tasks " +
												"</span> " +
											"correctly. Since you have solved less than " + data.mastery + " tasks correctly, deepening the learning content is " +
											"recommended. For your orientation, you can view the results in detail:" +
										"</div>" +
									"</div>";
								break;
						};
						break;
					default:
						break;
				};		

				break;
			
			case "distributedAssessment":
				var data=this.getSessionData();
				switch(data.status){
					case "passed":
						switch(wbt.metadata.language){
							case "_de":	
								html+="" +
									"<div class='questionHeader' id='testInfo' style='background-color:#D6E877;'>" +
										"<div class='questionText' style='background-image:url("+custom+"shared/images/passed.png);'>" +
											"Herzlichen Glückwunsch! Sie haben " +
												"<span class='tooltip' style='cursor:pointer;border-bottom:thin dotted;' title='...das entspricht " + data.score + "%'>" +
													data.passed + " von " + data.total + " Aufgaben " +
												"</span> " +
											"richtig beantwortet und den Test erfolgreich abgeschlossen. " +
											"{INTRO}" +
										"</div>" +
									"</div>"
								break;
							case "_en":	
								html+="" +
									"<div class='questionHeader' id='testInfo' style='background-color:#D6E877;'>" +
										"<div class='questionText' style='background-image:url("+custom+"shared/images/passed.png);'>" +
											"Congratulations! You have solved " +
												"<span class='tooltip' style='cursor:pointer;border-bottom:thin dotted;' title='...corresponding " + data.score + "%'>" +
													data.passed + " out of " + data.total + " tasks " +
												"</span> " +
											"correctly. Thus you have passed the exam successfully." +
											"{INTRO}" +
										"</div>" +
									"</div>"
								break;
						};
						break;
					case "failed":
						switch(wbt.metadata.language){
							case "_de":
								html+="" +
									"<div class='questionHeader' id='testInfo' style='background-color:#E84E34;'>" +
										"<div class='questionText' style='background-image:url("+custom+"shared/images/failed.png);'>" +
											"Sie haben " +
												"<span class='tooltip' style='cursor:pointer;border-bottom:thin dotted;' title='...das entspricht " + data.score + "%'>" +
													data.passed + " von " + data.total + " Aufgaben " +
												"</span> " +
											"richtig gelöst. Für eine erfolgreiche Bearbeitung des Fragenkatalogs " +
											"wären jedoch " + data.mastery + " korrekt beantwortete Aufgaben " +
											"erforderlich gewesen." +
											" " +
											"{INTRO}" +
										"</div>" +
									"</div>";
								break;
							case "_en":
								html+="" +
									"<div class='questionHeader' id='testInfo' style='background-color:#E84E34;'>" +
										"<div class='questionText' style='background-image:url("+custom+"shared/images/failed.png);'>" +
											"You have solved " +
												"<span class='tooltip' style='cursor:pointer;border-bottom:thin dotted;' title='...corresponding " + data.score + "%'>" +
													data.passed + " out of " + data.total + " tasks " +
												"</span> " +
											"correctly. " + data.mastery + " correct answers would have been necessary in order to pass the exam successfully." +
											" " +
											"{INTRO}" +
										"</div>" +
									"</div>";
								break;
						};
						break;
					default:
						break;
				};							
				break;
		};
		return html;
	},
	
	templateRatingIncomplete: function(){
		var html="";
		switch(wbt.metadata.language){
			case "_de":
				html = "" +
					"<div id='resultsContainer' class='question' style='width: " + (wbt.metadata.stageWidth-40) + "px'>" +
						"<div class='questionHeader'>" +
							"<div id='testInfo' style='padding-top:10px;border-radius:4px; margin-bottom:5px; background-color:#EFC847;background-position: 4px 5px;' class='questionText'>" +
								"<b>Die Auswertung ist erst verfügbar, nachdem Sie alle Aufgaben bearbeitet haben.</b>" +
							"</div>" +
						"</div>" +
						"<div class='questionBody'>" +
							"<p>Prüfen Sie im Inhaltsverzeichnis, welche Aufgaben Sie noch nicht bearbeitet haben und holen Sie dies nach.</p>" +
							"<p>Tipp: Wenn Sie auf ''Weiter'' klicken, gelangen Sie automatisch zur ersten nicht bearbeiteten Aufgabe.</p>" +
						"</div>" +			
						"<div style='clear:both;'></div>" +
						"<div class='questionFooter'>" +
							"<button class='ui-button-primary' data-role='button' data-inline='true' data-theme='a' onclick='interactions.jumpToNextTestPage();'>" +
								"Weiter" +
							"</button>" +
						"</div>" +
					"</div>";
				break;
			case "_en":
				html = "" +
					"<div id='resultsContainer' class='question' style='width: " + (wbt.metadata.stageWidth-40) + "px'>" +
						"<div class='questionHeader'>" +
							"<div id='testInfo' style='padding-top:10px;border-radius:4px; margin-bottom:5px; background-color:#EFC847;background-position: 4px 5px;' class='questionText'>" +
								"<b>An evaluation will be available as soon as you have answered all questions.</b>" +
							"</div>" +
						"</div>" +
						"<div class='questionBody'>" +
							"<p>Click 'Continue' or check the Table of Contents to identify all tasks that still have to be processed.</p>" +
						"</div>" +			
						"<div style='clear:both;'></div>" +
						"<div class='questionFooter'>" +
							"<button class='ui-button-primary' data-role='button' data-inline='true' data-theme='a' onclick='interactions.jumpToNextTestPage();'>" +
								"Continue" +
							"</button>" +
						"</div>" +
					"</div>";
				break;
		};
		return html;
	},
	
	templateRatingIntro: function(){
		var msg="";
		switch(this.lessonMode){
			case "profiling":
				switch(wbt.metadata.language){
					case "_de":
						if(wbt.structure.length == 1){
							msg="Aus Ihren Antworten hat sich folgendes Profil ergeben:";
						}else{
							msg="Aus Ihren Antworten zu den einzelnen Themengebieten hat sich folgendes Profil ergeben:";
						};
						break;
					case "_en":
						if(wbt.structure.length == 1){
							msg="Based on your answers, the following profile has emerged:";
						}else{
							msg="Based on your answers to the different subject areas, the following profile has emerged:";
						};
						break;
				};
				break;
			
			case "distributedSelfTest":
			case "distributedAssessment":
				switch(wbt.metadata.language){
					case "_de":
						msg="Hier können Sie Ihre Ergebnisse im Detail ansehen:";
						break;
					case "_en":
						msg="Here you can view your results in detail:";
						break;
				};
				break;
		};
		return msg;
	},
	
	templateBlockRating: function(){
		return "" +
			"<div class='blockResultRating'>" +
				"<table>" +
					"<tr>" +
						"<td nowrap='nowrap' valign='top'>" +
							"<span title='{BLOCKSCOREFLOAT} %' class='rating' data-result='{BLOCKSCOREFLOAT}' data-label='{BLOCKTITLE}'></span>" +
						"</td>" +
						"<td>" +
							"<span class='blockResultTitle'>" +
								"{BLOCKTITLE}" +
							"</span>" +
							"{BLOCKRESULTCOMPACT}" +
						"</td>" +
					"</tr>" +
				"</table>" +
			"</div>";
	},
	
	templateBlockResultCompact: function(blockScorePercent){
		var html=" ";
		if(this.lessonMode=="distributedAssessment"){
			switch(wbt.metadata.language){
				case "_de":
					switch (true){
						case blockScorePercent==0: 
							html+="(Keine Aufgabe richtig gelöst.)";
							break;
						case blockScorePercent==100:
							html+="(Alle Aufgaben richtig gelöst.)";
							break;
						default:
							html+="(" + blockScorePercent + "% der Aufgaben richtig gelöst.)";
							break;
					}
					break;
				case "_en":
					switch (true){
						case blockScorePercent==0: 
							html+="(No task was solved correctly.)";
							break;
						case blockScorePercent==100:
							html+="(All tasks were solved correctly.)";
							break;
						default:
							html+="(" + blockScorePercent + "% of the tasks were solved correctly.)";
							break;
					}
					break;
			};
		}else{
			html="";
		};
		return html;
	},
	
	templateBlockDetails: function(itemsPassed, itemsFailed){
		var html="";
		switch(wbt.metadata.language){
			case "_de":
				switch(true){
					case itemsPassed == itemsFailed:
						html= "" +
							"<div class='blockResultDetails' style='display:none;'>" +
								"<div class='blockResultDetailsHeader'>" +
									"Sie haben alle Aufgaben in diesem Themengebiet richtig gelöst." +
								"</div>" +
								"{DETAILS}" +
							"</div>";
						break;
					case itemsPassed==0:
						html= "" +
							"<div class='blockResultDetails' style='display:none;'>" +
								"<div class='blockResultDetailsHeader'>" +
									"Sie haben keine der Aufgaben in diesem Themengebiet richtig gelöst." +
								"</div>" +
								"{DETAILS}" +
							"</div>";
						break;
					default:
						html= "" +
							"<div class='blockResultDetails' style='display:none;'>" +
								"<div class='blockResultDetailsHeader'>" +
									"Sie haben <span class='tooltip' title='...das entspricht {BLOCKSCOREPERCENT}%' style='cursor:pointer;border-bottom:thin dotted;'>" +
									itemsPassed + " von " + itemsFailed + "</span> " +
									"der Aufgaben in diesem Themengebiet richtig gelöst." +
								"</div>" +
								"{DETAILS}" +
							"</div>";
						break;
				};
				break;
			
			case "_en":
				switch(true){
					case itemsPassed == itemsFailed:
						html= "" +
							"<div class='blockResultDetails' style='display:none;'>" +
								"<div class='blockResultDetailsHeader'>" +
									"You have solved all tasks in this subject area correctly." +
								"</div>" +
								"{DETAILS}" +
							"</div>";
						break;
					case itemsPassed==0:
						html= "" +
							"<div class='blockResultDetails' style='display:none;'>" +
								"<div class='blockResultDetailsHeader'>" +
									"You have not solved a single task in this subject area correctly." +
								"</div>" +
								"{DETAILS}" +
							"</div>";
						break;
					default:
						html= "" +
							"<div class='blockResultDetails' style='display:none;'>" +
								"<div class='blockResultDetailsHeader'>" +
									"You have solved <span class='tooltip' title='...corresponding {BLOCKSCOREPERCENT}%' style='cursor:pointer;border-bottom:thin dotted;'>" +
									itemsPassed + " out of " + itemsFailed + "</span> " +
									"in this subject area correctly." +
								"</div>" +
								"{DETAILS}" +
							"</div>";
						break;
				};
				break;
		};			
		return html;
	},
	
	templateBlockPages: function(itemsPassed, itemsFailed, tdWidths){
		
		var corr="", incorr="";
		
		switch(wbt.metadata.language){
			case "_de":
				corr="Richtig beantwortete Aufgaben:";
				incorr="Falsch beantwortete Aufgaben:";
				break;
			case "_en":
				corr="Correct answers:";
				incorr="Incorrect answers:";
				break;
		};
		
		return "" +
			"<table width='95%'>" +
				"<tr>" +
					(
						itemsPassed.length>0
							? 	"<td valign='top' width='" + tdWidths[0] + "'>" +
									"<div class='blockResultDetailsHeader_passed'>" +
										corr +
									"</div>" +
								"</td>"
							: ""
					) + (
						itemsFailed.length>0
							? 	"<td valign='top' width='" + tdWidths[1] + "'>" +
									"<div class='blockResultDetailsHeader_failed'>" +
										incorr +
									"</div>" +
								"</td>"
							: ""
					) +
				"</tr>" +
				"<tr>" +
					(
						itemsPassed.length>0
							? 	"<td valign='top'>" +
									"<ul>" +
										"<li>" + itemsPassed.join("</li><li>") + "</li>" +
									"</ul>" +
								"</td>"
							: ""
					) + (
						itemsFailed.length>0
							? 	"<td valign='top'>" +
									"<ul>" +
										"<li>" + itemsFailed.join("</li><li>") + "</li>" +
									"</ul>" +
								"</td>"
							: ""
					) +
				"</tr>" +
			"</table>";
	},
	
	templateRatingInfo: function(type){
		var msg="";
		switch(wbt.metadata.language){
			case "_de":
				switch (type){
					case "profiling":
						msg = "" +
							"<table cellpadding='4' cellspacing='4'>" +
								"<tr>" +
									"<td nowrap='nowrap' valign='top'>" +
										"<span class='legendStars'>" +
											"<img src='"+custom+"shared/images/"+"star.png' />" +
											"<img src='"+custom+"shared/images/"+"star.png' />" +
											"<img src='"+custom+"shared/images/"+"star.png' />" +
											"<br/>" +
											"<img src='"+custom+"shared/images/"+"star.png' />" +
											"<img src='"+custom+"shared/images/"+"star.png' />" +
											"<img src='"+custom+"shared/images/"+"star-half.png' />" +
										"</span>" +
									"</td>" +
									"<td>" +
										"Die Symbole bedeuten, dass mehr als 70 Prozent Ihrer Antworten in diesem " +
										"Themengebiet richtig waren. Das heißt: Sie verfügen schon " +
										"über ein ausgeprägtes Vorwissen, sodass eine Vertiefung nicht unbedingt " +
										"erforderlich ist. Natürlich können Sie das entsprechende Lernmodul " +
										"zur Übung und Wiederholung gerne trotzdem bearbeiten." +
									"</td>" +
								"</tr>" +
								"<tr>" +
									"<td nowrap='nowrap' valign='top'>" +
										"<span class='legendStars'>" +
											"<img src='"+custom+"shared/images/"+"star.png' />" +
											"<img src='"+custom+"shared/images/"+"star.png' />" +
											"<img src='"+custom+"shared/images/"+"star-empty.png' />" +
											"<br/>" +
											"<img src='"+custom+"shared/images/"+"star.png' />" +
											"<img src='"+custom+"shared/images/"+"star-half.png' />" +
											"<img src='"+custom+"shared/images/"+"star-empty.png' />" +
										"</span>" +
									"</td>" +
									"<td>" +
										"Die Symbole bedeuten, dass zwischen 50 und 70 Prozent Ihrer Antworten in diesem " +
										"Themengebiet richtig waren. Hier besteht Verbesserungspotenzial, das heißt: " +
										"Sie kommen in diesem Themengebiet schon ganz gut zurecht, sollten sich aber " +
										"noch weiter verbessern, indem Sie das entsprechende Lernmodul durcharbeiten." +
									"</td>" +
								"</tr>" +
								"<tr>" +
									"<td nowrap='nowrap' valign='top'>" +
										"<span class='legendStars'>" +
											"<img src='"+custom+"shared/images/"+"star.png' />" +
											"<img src='"+custom+"shared/images/"+"star-empty.png' />" +
											"<img src='"+custom+"shared/images/"+"star-empty.png' />" +
											"<br/>" +
											"<img src='"+custom+"shared/images/"+"star-half.png' />" +
											"<img src='"+custom+"shared/images/"+"star-empty.png' />" +
											"<img src='"+custom+"shared/images/"+"star-empty.png' />" +
											"<br/>" +
											"<img src='"+custom+"shared/images/"+"star-empty.png' />" +
											"<img src='"+custom+"shared/images/"+"star-empty.png' />" +
											"<img src='"+custom+"shared/images/"+"star-empty.png' />" +
										"</span>" +
									"</td>" +
									"<td>" +
										"Ein Stern (und weniger) bedeutet, dass weniger als die Hälfte Ihrer Antworten " +
										"in diesem Themengebiet richtig waren. Hier besteht konkreter Lernbedarf! " +
										"Bitte bearbeiten Sie unbedingt das entsprechende Lernmodul." +
									"</td>" +
								"</tr>" +
							"</table>";
							break;
						
					case "distributedSelfTest":
						msg = "" +
							"<table cellpadding='4' cellspacing='4'>" +
								"<tr>" +
									"<td nowrap='nowrap' valign='top'>" +
										"<img src='"+custom+"shared/images/"+"star.png' />" +
										"<img src='"+custom+"shared/images/"+"star.png' />" +
										"<img src='"+custom+"shared/images/"+"star.png' />" +
									"</td>" +
									"<td>" +
										"Die Symbole bedeuten, dass mehr als 70 Prozent Ihrer Antworten in diesem " +
										"Themengebiet richtig waren. Das heißt: Sie verfügen in diesem Bereich " +
										"über ein ausgeprägtes Wissen, sodass eine weitere Vertiefung nicht unbedingt " +
										"erforderlich ist. Natürlich können Sie das entsprechende Lernmodul " +
										"zur Übung und Wiederholung gerne noch einmal bearbeiten." +					
									"</td>" +
								"</tr>" +
								"<tr>" +
									"<td nowrap='nowrap' valign='top'>" +
										"<img src='"+custom+"shared/images/"+"star.png' />" +
										"<img src='"+custom+"shared/images/"+"star.png' />" +
										"<img src='"+custom+"shared/images/"+"star-empty.png' />" +
									"</td>" +
									"<td>" +
										"Die Symbole bedeuten, dass zwischen 50 und 70 Prozent Ihrer Antworten in diesem " +
										"Themengebiet richtig waren. Hier besteht Verbesserungspotenzial, das heißt: " +
										"Sie kommen in diesem Themengebiet schon ganz gut zurecht, sollten sich aber " +
										"noch weiter verbessern, indem Sie das entsprechende Lernmodul noch einmal durcharbeiten." +
									"</td>" +
								"</tr>" +
								"<tr>" +
									"<td nowrap='nowrap' valign='top'>" +
										"<img src='"+custom+"shared/images/"+"star.png' />" +
										"<img src='"+custom+"shared/images/"+"star-empty.png' />" +
										"<img src='"+custom+"shared/images/"+"star-empty.png' />" +
										"<br/>" +
										"<img src='"+custom+"shared/images/"+"star-empty.png' />" +
										"<img src='"+custom+"shared/images/"+"star-empty.png' />" +
										"<img src='"+custom+"shared/images/"+"star-empty.png' />" +
									"</td>" +
									"<td>" +
										"Ein Stern (und weniger) bedeutet, dass weniger als die Hälfte Ihrer Antworten " +
										"in diesem Themengebiet richtig waren. Hier besteht konkreter Lernbedarf! " +
										"Bitte bearbeiten Sie unbedingt das entsprechende Lernmodul noch einmal." +
									"</td>" +
								"</tr>" +
							"</table>";
							break;
							
					case "distributedAssessment":
							break;				
					default:
						break;
				};
				break;
			
			case "_en":
				switch (type){
					case "profiling":
						msg = "" +
							"<table cellpadding='4' cellspacing='4'>" +
								"<tr>" +
									"<td nowrap='nowrap' valign='top'>" +
										"<span class='legendStars'>" +
											"<img src='"+custom+"shared/images/"+"star.png' />" +
											"<img src='"+custom+"shared/images/"+"star.png' />" +
											"<img src='"+custom+"shared/images/"+"star.png' />" +
											"<br/>" +
											"<img src='"+custom+"shared/images/"+"star.png' />" +
											"<img src='"+custom+"shared/images/"+"star.png' />" +
											"<img src='"+custom+"shared/images/"+"star-half.png' />" +
										"</span>" +
									"</td>" +
									"<td>" +
										"These symbols indicate that more than 70 percent of your answers in this subject area were correct. " +
										"This means that you already have a good prior knowledge, so that deepening the learning content is not necessarily required. " +
										"Of course, you are welcome to work through the corresponding learning module for practice and repetition anyway." +
									"</td>" +
								"</tr>" +
								"<tr>" +
									"<td nowrap='nowrap' valign='top'>" +
										"<span class='legendStars'>" +
											"<img src='"+custom+"shared/images/"+"star.png' />" +
											"<img src='"+custom+"shared/images/"+"star.png' />" +
											"<img src='"+custom+"shared/images/"+"star-empty.png' />" +
											"<br/>" +
											"<img src='"+custom+"shared/images/"+"star.png' />" +
											"<img src='"+custom+"shared/images/"+"star-half.png' />" +
											"<img src='"+custom+"shared/images/"+"star-empty.png' />" +
										"</span>" +
									"</td>" +
									"<td>" +
										"These symbols indicate that between 50 and 70 percent of your answers in this subject area were correct. " +
										"There is room for improvement, that is: Although you master this topic quite well, " +
										"you should improve your skills by working through the appropriate learning module." +
									"</td>" +
								"</tr>" +
								"<tr>" +
									"<td nowrap='nowrap' valign='top'>" +
										"<span class='legendStars'>" +
											"<img src='"+custom+"shared/images/"+"star.png' />" +
											"<img src='"+custom+"shared/images/"+"star-empty.png' />" +
											"<img src='"+custom+"shared/images/"+"star-empty.png' />" +
											"<br/>" +
											"<img src='"+custom+"shared/images/"+"star-half.png' />" +
											"<img src='"+custom+"shared/images/"+"star-empty.png' />" +
											"<img src='"+custom+"shared/images/"+"star-empty.png' />" +
											"<br/>" +
											"<img src='"+custom+"shared/images/"+"star-empty.png' />" +
											"<img src='"+custom+"shared/images/"+"star-empty.png' />" +
											"<img src='"+custom+"shared/images/"+"star-empty.png' />" +
										"</span>" +
									"</td>" +
									"<td>" +
										"One star (or less) means that less than half of your replies to this subject area were correct. " +
										"There is a lot of catching-up to do! " +
										"Please work through the corresponding learning module by all means." +
									"</td>" +
								"</tr>" +
							"</table>";
							break;
						
					case "distributedSelfTest":
						msg = "" +
							"<table cellpadding='4' cellspacing='4'>" +
								"<tr>" +
									"<td nowrap='nowrap' valign='top'>" +
										"<img src='"+custom+"shared/images/"+"star.png' />" +
										"<img src='"+custom+"shared/images/"+"star.png' />" +
										"<img src='"+custom+"shared/images/"+"star.png' />" +
									"</td>" +
									"<td>" +
										"The symbols indicate that more than 70 percent of your answers in this subject area were correct. " +
										"This means that you have a good knowledge on this topic, so that deepening the learning content is not necessarily required. " +
										"Of course, you are welcome to work through the corresponding learning module for practice and repetition anyway." +
									"</td>" +
								"</tr>" +
								"<tr>" +
									"<td nowrap='nowrap' valign='top'>" +
										"<img src='"+custom+"shared/images/"+"star.png' />" +
										"<img src='"+custom+"shared/images/"+"star.png' />" +
										"<img src='"+custom+"shared/images/"+"star-empty.png' />" +
									"</td>" +
									"<td>" +
										"The symbols indicate that between 50 and 70 percent of your answers in this subject area were correct. " +
										"There is room for improvement, that is: Although you master this subject area quite well, " +
										"you should improve your skills by repeating the appropriate parts of the learning module." +
									"</td>" +
								"</tr>" +
								"<tr>" +
									"<td nowrap='nowrap' valign='top'>" +
										"<img src='"+custom+"shared/images/"+"star.png' />" +
										"<img src='"+custom+"shared/images/"+"star-empty.png' />" +
										"<img src='"+custom+"shared/images/"+"star-empty.png' />" +
										"<br/>" +
										"<img src='"+custom+"shared/images/"+"star-empty.png' />" +
										"<img src='"+custom+"shared/images/"+"star-empty.png' />" +
										"<img src='"+custom+"shared/images/"+"star-empty.png' />" +
									"</td>" +
									"<td>" +
										"One star (or less) means that less than half of your replies to this subject area were correct. " +
										"There is a lot of catching-up to do! " +
										"Please repeat the corresponding learning module by all means." +
									"</td>" +
								"</tr>" +
							"</table>";
							break;
							
					case "distributedAssessment":
							break;				
					default:
						break;
				}
			break;
		};
		return msg;
	},
		
	templateRecessInfo: function(){
		var html="";
		switch(wbt.metadata.language){
			case "_de":
				html = "" +
					"<div style='background:#fff;padding: 10px;margin-top:5px;'>" +
						"Tipp: Über das Inhaltsverzeichnis können Sie zu den einzelnen Fragen springen " +
						"und Ihre Antworten mit der Musterlösung vergleichen." +
					"</div>";
				break;
			case "_en":
				html = "" +
					"<div style='background:#fff;padding: 10px;margin-top:5px;'>" +
						"Tip: Use the table of contents to jump to the individual questions " +
						"and compare your answers with the sample solution." +
					"</div>";
				break;
		};
		return html;
	},
	
	templateTippMultipleBlocks: function(){
		var html="";
		switch(wbt.metadata.language){
			case "_de":
				html = "" +
					"<div>" +
						"Klicken Sie auf die einzelnen Themenbereiche, um Details zu sehen." +
					"</div>";
				break;
			case "_de":
				html = "" +
					"<div>" +
						"Click on the different topics to see details." +
					"</div>";
				break;
		};
		return html;
	},
	
	templateQuestionBlocked: function(reason){
		
		var msg="";
		switch(wbt.metadata.language){
			case "_de":
				msg = "Zur Auswertung";
				break;
			case "_en":
				msg = "Go to the evaluation page";
				break;
		};
		
		switch (reason){
			case "completed":
				if(isMobile){
					return "" +
						"<p>" + eval("msgQuizProfilingCompleted"+wbt.metadata.language) + "</p>" +
						"<a href='javascript:void(0);' data-role='button' data-theme='b' data-inline='true' onclick='interactions.jumpToResultPage();'>" +
							msg +
						"</a>";
				}else{
					return "" +
						"<div style='padding:10px;'>" +	
							"<p>" + eval("msgQuizProfilingCompleted"+wbt.metadata.language) + "</p>"  +
							"<button class='ui-button-primary' onclick='interactions.jumpToResultPage();'>" +
								msg +
							"</button>" +
						"</div>";
				}
				
			case "inprogress":
				return "" +
					"<p>" + eval("msgQuizProfilingQuestionAlreadyCompleted"+wbt.metadata.language) + "</p>";

			default:
					return "";
		}
	},
	
	templatePrintResults: function(type){
		switch (type){
			case "profiling":
				return "" +
					"<!DOCTYPE HTML>" +
					"<html>" +
						"<head>" +
							"<meta http-equiv='content-type' content='text/html; charset=UTF-8' />" +
							"<title></title>" +
							"<style>" +
								"@page { margin: 2cm; } " +
								"body { font-family: sans-serif; margin: 0.5cm 0; text-align: justify; font-size: 1em; } " +
								"h1 { font-size: 1.2em; margin-top: 1cm; } " +
								"h2 { font-size: 1.1em; margin-bottom: 1cm;} " +
								"#header, #footer { position: fixed; left: 0; right: 0; color: #aaa; font-size: 0.9em; } " +
								"#header { top: 0; border-bottom: 0.1pt solid #aaa; margin-top: 0.5cm; } " +
								"#footer { bottom: 0; border-top: 0.1pt solid #aaa; margin-top: 1cm;} " +
								"#header table, #footer table { width: 100%; border-collapse: collapse; border: none; } " +
								"#header td, #footer td { padding: 0; width: 50%; } " +
								".page-number { text-align: center; } " +
								".page-number:before { content: '{PAGE} ' counter(page); } " +
								".questionBody { } " +
								".rating, .legendStars { width: 90px; } " +
								".blockResultRating { padding-top: 1cm; } " +
								".blockResultTitle { font-weight: bold; } " +
								".legend { margin-top: 0.5cm; margin-bottom: 0.5cm; padding:10px; border:2px solid #aaa; } " +
								".shortlinkInfo { margin-top: 1cm; } " +
							"</style>" +
						"</head>" +
						"<body>" +
							/*"<div id='header'>" +
								"<table>" +
									"<tr>" +
										"<td>" +
											"{HEAD}" +
										"</td>" +
										"<td style='text-align: right;'>" +
											"{PROJECTTITLE}" + 
										"</td>" +
									"</tr>" +
								"</table>" +
							"</div>" +*/
							
							"<div>{HEAD}</div>" +
		
							"<div id='footer'>" +
								"<div class='page-number'></div>" +
							"</div>" +
		
							"<h1>" +
								"{PROJECTTITLE}" + 
							"</h1>" +
							
							"<h2>" +
								"{TITLE}" + 
							"</h2>" +

							"<div class='legend'>" +
								$("#legend").html() +
							"</div>" +
					
							$("#print").html() +
							
							"{SHORTLINKINFO}" +
							
						"</body>" +
					"</html>";
					
			default:
				return "";
		}		
	},
	
	templateShortlinkInfo: function(type){
		var html="";
		switch(wbt.metadata.language){
			case "_de":
				html = "" +
					"<div class='shortlinkInfo'>" +
						"<small>" +
							"Speichern Sie dieses Dokument auf Ihrem Computer oder drucken Sie es jetzt aus. Falls Ihnen dies " +
							"derzeit nicht möglich sein sollte, notieren Sie den folgenden Link, um dieses Dokument zu einem " +
							"späteren Zeitpunkt herunterzuladen:" +
						"</small>" +
						"<ul>" +
							"<li>" +
								"<a href='{SHORTLINK}'>{SHORTLINK}</a>" +
							"</li>" +
						"</ul>" +
						"<small>" +
							"Hinweis: Der Link ist eine Woche lang gültig, danach wird das Dokument automatisch vom Server gelöscht." +
						"</small>" +
					"<div>";
				break;
			case "_en":
				html = "" +
					"<div class='shortlinkInfo'>" +
						"<small>" +
							"Save this document on your computer or print it out now. " +
							"If this is not possible at present, note the following link to download this document at a later date:" +
						"</small>" +
						"<ul>" +
							"<li>" +
								"<a href='{SHORTLINK}'>{SHORTLINK}</a>" +
							"</li>" +
						"</ul>" +
						"<small>" +
							"Note: The link is valid for one week, then the document will be automatically deleted from the server." +
						"</small>" +
					"<div>";
				break;
		}
		return html;
	},
	
	visualizeResults: function(chartType){
		$("#icon_charts img")
			.unbind("mouseover  mouseout")
			.bind({
				mouseover: function(){
					$(this).css({
						opacity: 1
					})
				},
				mouseout: function(){
					$(this).css({
						opacity: .4
					})
				}
			});
			
		this.resultChartType=chartType;

		if(isMobile){
			var html="" +
					"<div id='resultChartLegend'></div>" +
					"<div id='resultChart'></div>";
			
				$("#atomFullsizeHeader").html("Grafische Auswertung");
				$("#atomFullsizeContent").html(html);
				content.doMenuCommand("atomFullsize");
				
				if(!this.mobileAtomFullsizeHandlerBound){
					$(document).bind("pagechange", function(e, data) {
						if(data.toPage["0"].id == "atomFullsize"){
							if($("#resultChart").length>0){
								var chartWidth=$("#atomFullsize").width()+"px",
									chartHeight=$("#atomFullsize").height()+"px"
								interactions.createResultChart(chartWidth, chartHeight);
							}
						};
					});
				}
				
				this.mobileAtomFullsizeHandlerBound=true;
				
		}else{
			var chartWidth=$("#divcontainer").outerWidth()+"px",
				chartHeight=$("#divcontainer").outerHeight()+"px",
				html="" +
					"<div id='resultChartLegend'></div>" +
					"<div id='resultChart'></div>";
			
			$.elpsOverlay("show", {
				content : html,
				position:"top",
				icon:"atom",
				closeOverlay: true,
				bound:$("#divcontainer"),
				width: chartWidth,
				height: chartHeight,
				afterShow: function(){
					interactions.createResultChart(chartWidth, chartHeight);
				},
				buttons: {
					close : {
						text: "OK",
						onclick: function(){
							$("#resultChart").fadeOut("slow", function(){
								$.elpsOverlay("hide");
							})
						}
					}
				}
			});
		};
	},
	
	createResultChart: function(w,h){
		
		var scores=[],
			labels=[],
			blockTitles=[],
			masteryScores=[],
			j=1;

		for(var i=0;i<wbt.structure.length;i++){
			
			if(typeof wbt.structure[i].blockRating!="undefined"){
				//wbt.structure[i].blockRating = { 
				//	points: blockPoints,
				//	maxPoints: blockMaxPoints,
				//	itemsPassed: itemsPassed,
				//	itemsFailed: itemsFailed,
				//	scorePercent: blockScorePercent
				//};
				
				var blockRating=wbt.structure[i].blockRating;
				
				scores.push(blockRating.points);
				masteryScores.push(blockRating.maxPoints);
				
				switch(wbt.metadata.language){
					case "_de":
						labels.push("Themengebiet "+j);
						break;
					case "_en":
						labels.push("Topic area "+j);
						break;
				};
				
				var bt=decodeBase64(wbt.structure[i].title);
				
				blockTitles.push(bt.length < 50 ? bt : bt.substring(0,50) + "...");
				j++;
			}
		}
		
		if(scores.length==0
		   || labels.length==0
		   || masteryScores.length==0
		   || blockTitles.length==0){
			return;
			//comment return to use dummy-data-->
			scores=[2,6,5,3,2,1,5];
			masteryScores=[4,8,7,3,3,2,8];
			
			switch(wbt.metadata.language){
				case "_de":
					labels=["Themengebiet 1", "Themengebiet 2", "Themengebiet 3", "Themengebiet 4", "Themengebiet 5", "Themengebiet 6", "Themengebiet 7"];
					blockTitles=["Langtitel von Themengebiet 1", "Langtitel von Themengebiet 2", "Langtitel von Themengebiet 3", "Langtitel von Themengebiet 4", "Langtitel von Themengebiet 5", "Langtitel von Themengebiet 6", "Langtitel von Themengebiet 7"];
					break;
				case "_en":
					labels=["Topic area 1", "Topic area 2", "Topic area 3", "Topic area 4", "Topic area 5", "Topic area 6", "Topic area 7"];
					blockTitles=["Title of topic area 1", "Title of topic area 2", "Title of topic area 3", "Title of topic area 4", "Title of topic area 5", "Title of topic area 6", "Title of topic area 7"];
					break;
			};
		}		
		
		
		$("<canvas/>", {
			id: "chartCanvas"
		}).appendTo($("#resultChart"));

		$("#chartCanvas")
			.attr("width", parseInt(w)-175)
			.attr("height", parseInt(h)-175);

		var msgLabel1a="", msgLabel1b="", msgLabel2a="", msgLabel2b="";
		switch(wbt.metadata.language){
			case "_de":
				msgLabel1a ="Mindestanforderung";
				msgLabel1b ="Mindestanforderung (= Anzahl richtig zu lösender Aufgaben)";
				msgLabel2a = "Ihr Ergebnis";
				msgLabel2b = "Ihr Ergebnis (= Anzahl richtig gelöster Aufgaben)";
				break;
			case "_en":
				msgLabel1a ="Minimum requirement";
				msgLabel1b ="Minimum requirement (= Number of tasks to be solved correctly)";
				msgLabel2a = "Your results";
				msgLabel2b = "Your results (= Number of tasks solved correctly)";
				break;
		};
			
		var chartData = {
			labels: labels,
			datasets: [
				{
					//Soll
					label: interactions.resultChartType=="radar" ? msgLabel1a : msgLabel1b,
					fillColor: "rgba(220, 220, 220, 0.5)",
					strokeColor: "rgba(220, 220, 220, 0.8)",
					highlightFill: "rgba(220, 220, 220, 0.75)",
					highlightStroke: "rgba(220, 220, 220, 3)",
					data: masteryScores
				},{
					//Ist
					label: interactions.resultChartType=="radar" ? msgLabel2a : msgLabel2b,
					fillColor: "rgba(169, 210, 234, 0.5)",
					strokeColor: "rgba(169, 210, 234, 0.8)",
					highlightFill: "rgba(169, 210, 234, 0.75)",
					highlightStroke: "rgba(169, 210, 234, 3)",
					data: scores
				}
			]
		};
		
		if(typeof window.G_vmlCanvasManager!="undefined") { //msie8: init canvas manager, see ie8.canvas.js
			var c=document.getElementById("chartCanvas");
			c=window.G_vmlCanvasManager.initElement(c);
		};
		
		var msg="";
		switch(wbt.metadata.language){
			case "_de":
				msg = isMobile
					? "<p>Tippen Sie auf das Diagramm für weitere Informationen</p>"
					: "<p>Bewegen Sie die Maus über das Diagramm für weitere Informationen</p>";
				break;
			case "_en":
				msg = isMobile
					? "<p>Tap on the chart for more information</p>"
					: "<p>Move the mouse over the chart for more information</p>";
				break;
		};
		
		var context = $("#resultChart canvas").get(0).getContext("2d"),
			options = {
				legendTemplate: "" +
					"<div style=\"padding:20px 0px;\">" +
						"<% for (var j=0; j<datasets.length; j++){%>" +
							"<%if(datasets[j].label){%>" +
								"<span style='padding:5px 10px;background-color:<%=datasets[j].strokeColor%>;margin-top:15px;margin-right:10px;'>" +
									"<%=datasets[j].label%>" +
									//"<%if(j==0){%>" +
									//	" (" + scorm.masteryScore + "%)" +
									//"<%}%>" +
								"</span>" +
							"<%}%>" +
						"<%}%>" +
						msg +
					"</div>",
				tooltipFillColor: "rgba(255,255,255,0.7)",
				tooltipFontFamily: "Arial, sans-serif",
				tooltipFontSize: 13,
				tooltipFontStyle: "normal",
				tooltipFontColor: "#666",
				tooltipTitleFontFamily: "Arial, sans-serif",
				tooltipTitleFontSize: 13,
				tooltipTitleFontStyle: "bold",
				tooltipTitleFontColor: "#666",
				tooltipCornerRadius: 4,
				scaleBeginAtZero: true,
				multiTooltipTemplate: function(o){
					$.each(labels, function(i,label){
						if(label==o.label){ //use block title instead of label
							o.label=blockTitles[i];
						};
					});
					
					var retVal="";
					switch(wbt.metadata.language){
						case "_de":
							if(o.datasetLabel.indexOf("Mindestanforderung")!=-1){
								retVal = "Erforderlich: " + o.value + " richtig gelöste " + (o.value > 1 ? "Aufgaben" : "Aufgabe");
							}else{
								switch(true){
									case o.value==0:
										retVal = "Ihr Ergebnis: Keine richtig gelöste Aufgabe";
										break;
									case o.value==1:
										retVal = "Ihr Ergebnis: Eine richtig gelöste Aufgabe";
										break;
									default:
										retVal = "Ihr Ergebnis: " + o.value + " richtig gelöste Aufgaben";
										break;
								}									
							};
							break;
						case "_en":
							if(o.datasetLabel.indexOf("Minimum requirement")!=-1){
								retVal = "Required: " + o.value + " correctly solved " + (o.value > 1 ? "tasks" : "task");
							}else{
								switch(true){
									case o.value==0:
										retVal = "Your result: None of the tasks has been solved correctly";
										break;
									case o.value==1:
										retVal = "Your result: One task has been solved correctly";
										break;
									default:
										retVal = "Your results: " + o.value + " tasks have been solved correctly";
										break;
								}									
							};
							break;
					};
					return retVal;
				}
			};
			
		switch(this.resultChartType){
			case "line":
				interactions.chart = new Chart(context).Line(chartData, options);
				break;
			case "bar":
				interactions.chart = new Chart(context).Bar(chartData, options);
				break;
			case "radar":
				interactions.chart = new Chart(context).Radar(chartData, options);
				break;
		};
		
		$("#resultChartLegend").html(
			interactions.chart.generateLegend()
		);
	}
});