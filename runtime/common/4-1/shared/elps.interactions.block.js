$.extend(interactions, {

	blockTest: {
		masteryScore: 100,
        maxAttempts: -1,
		attempts: 1
	},
	
	reviewMode: false,
	resultsVisible: false,
	
	progressInitialized: false,
	
	initBlockTest: function(){
		$.each(wbt.structure, function(i, block){
			if(typeof block.blockType!="undefined"){
				if(block.blockType=="assessment" || block.blockType=="selftest"){
					interactions.testVariant=block.blockType;
					interactions.blockNum=i;
					interactions.createIntroPage();
					interactions.createResultPage();
					interactions.testIsCompleted=false;
					
					if(typeof block.masteryScore!="undefined"){
						interactions.blockTest.masteryScore=block.masteryScore;
					};
					
					if(typeof block.maxAttempts!="undefined"){
						interactions.blockTest.maxAttempts=block.maxAttempts;
					};
					
					interactions.redirectHotspots();
					interactions.reloadTestData();
				}
			}
		});
	},
	
	initProgress: function(){

		if(this.progressInitialized)return;
		
		$("<div/>", {
			id: "progressIndicator",
			html: "<canvas id='piCanvas' width='250' height='60'></canvas>",
			css: {
				position: "absolute",
				width: "250px",
				height: "60px",
				zIndex: 10
			}
		}).appendTo(isMobile ? $("#mainContainer") : $("#divcontainer"));

		this.alignProgressBarToSidebar();

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
	
	stepShown: function(id){ //step created and shown
		switch(id){
			case "intro_s":
				var data=this.getSessionData();
				switch(data.status){
					case "passed":
					case "failed":
						$("#intro_init").hide();
						$("#intro_resume").show();
						$("#resumeInfo").animate(
							{
								backgroundColor:"#fff",
								color: "#666"
							},{
								duration: 3000,
								complete: function(){}
							}
						);
						break;
					default:
						$("#intro_init").show();
						$("#intro_resume").hide();
						$("#testInfo").animate(
							{
								backgroundColor:"#fff",
								color: "#666"
							},{
								duration: 3000,
								complete: function(){}
							}
						);
				};				
				break;
			case "result_s":
				$("#testIncomplete, #testInfo").animate(
					{
						backgroundColor:"#fff",
						color: "#666"
					},{
						duration: 3000,
						complete: function(){}
					}
				);
				break;
			default:
				break;
		}
		
		$(".questionFooter").css({
			width: ($(".questionHeader").width() > 0 ? ($(".questionHeader").width() + "px") : "100%") 
		});
	},
	
	alignProgressBarToSidebar: function(){
		if(isMobile){
			$("#progressIndicator").css({
				top: parseInt($("#footer").position().top-75)+"px",
				left: "auto",
				right: 0
			});
		}else{
			$("#progressIndicator")
				.fadeOut("slow", function(){
						if(scorm.getPreference("sidebar")=="visible"){
							$("#progressIndicator").css({
								width: $("#westPane").width() + "px",
								top: "auto",
								bottom: "20px",
								left: 0
							});
						}else{
							$("#progressIndicator").css({
								width: "250px",
								top: "auto",
								bottom: parseInt($("#divfooter").height() + 20) + "px",
								left: "auto",
								right: 0
							});
						};
					})
				.fadeIn("slow");
		};
	},
	
	createIntroPage: function(){

		var topics=[],
			html=this.templateIntroPage() + this.templateResumePage() ,
			mod={};
			
		$.each(wbt.structure[this.blockNum].items, function(i,page){
			topics.push(decodeBase64(page.title));
		});
		
		html=html
			.replace(/{INTRO}/g, decodeBase64(wbt.structure[this.blockNum].blockIntro))
			.replace(/{TOPICS}/, "<ul><li>" + topics.join("</li><li>") + "</li></ul>")
			.replace(/{IMGPATH}/g, this.getRandomImage())
			.replace(/{TESTINFO}/, this.templateTestInfo())
			.replace(/{RESUMEINFO}/, this.templateResumeInfo())
			.replace(/{STARTMSG}/, this.templateStartMsg());
		
		if(typeof wbt.structure[this.blockNum].moderation!="undefined"){
			if(wbt.structure[this.blockNum].moderation=="auto"){
				switch(this.testVariant.toLowerCase()){
					case "selftest":
						var msg="";
						
						switch(wbt.metadata.language){
							case "_de":
								msg= "" +
									"Willkommen zu unserem Selbsttest. Anhand einer Reihe von Kontrollfragen können " +
									"Sie realistisch abschätzen, ob Sie die Lerninhalte bereits verinnerlicht haben, bzw. " +
									"in welchen Themenbereichen vielleicht noch Nachholbedarf besteht. Bitte beantworten Sie die " +
									"Fragen nacheinander und klicken Sie jeweils auf die Schaltfläche ''Fertig'', um die Antwort zu speichern. " +
									"Sobald Sie alle Fragen bearbeitet haben, erhalten Sie eine Auswertung. Viel Erfolg bei der Bearbeitung!";
								break;
							case "_en":
								msg= "" +
									"Welcome to the Self Test. Based on a series of tasks you can assess whether you have memorized " +
									"the learning content or whether there is a need for additional learning on specific topics. " +
									"Please answer the questions one after another and click ''Done'' in each case. " +
									"An evaluation takes place as soon as you have answered all questions. We wish you every success with this test!";
								break;
						}
						
						mod = {
							id: "automod_selftest_intro",
							friendlyId: "automod_selftest_intro",
							trigger: "intro",
							stopOnFinish: true,
							html: encodeBase64(msg)
						};
						break;
					case "assessment":
						var msg="";
						switch(wbt.metadata.language){
							case "_de":
								msg = "" +
									"Willkommen zu unserem Abschlusstest. Bitte beantworten Sie die Fragen nacheinander " +
									"und klicken Sie jeweils auf die Schaltfläche ''Fertig'', um die Antwort zu speichern. " +
									"Sobald Sie alle Fragen bearbeitet haben, erhalten Sie eine Auswertung. " +
									"Viel Erfolg bei der Bearbeitung!"
								break;
							case "_en":
								msg="" +
									"Welcome to our Final Exam. Please answer the questions one after another and click ''Done'' in each case. " +
									"We wish you every success with this test!"
								break;
						}
						mod = {
							id: "automod_assessment_intro",
							friendlyId: "automod_assessment_intro",
							trigger: "intro",
							stopOnFinish: true,
							html: encodeBase64(msg)
						};
						break;
				}
			}
		};
		
		var page={
			id: "intro_p",
			title: wbt.structure[this.blockNum].title,
			leaf: true,
			template: "multipage",
			icon: "i",
			atoms: [],
			steps: [{
				id: "intro_s",
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
		
		wbt.structure[this.blockNum].items.unshift(page);	
			
	},
	
	redirectHotspots: function(){
		//redirect links that point to first question to the created intro page
		var targetId=wbt.structure[this.blockNum].items[1].steps[0].id;
		$.each(wbt.structure, function(b, block){
			$.each(block.items, function(i, page){
				$.each(page.steps, function(s, step){
					if(typeof step.hotspots=="object"){
						$.each(step.hotspots, function(h, hotspot){
							if(hotspot.type=="jumpLink"){
								if(typeof hotspot.props!="undefined"){
									if(typeof hotspot.props.targetId!="undefined"){
										if(hotspot.props.targetId==targetId){
											hotspot.props.targetId="intro_s";
											return;
										}
									}
								}							
							}
						});
					}
				})
			});
		});
	},
	
	reloadTestData: function(){ //search scorm data for results from previous test sessions
		var testData=scorm.parseTestData();
		if(!$.isEmptyObject(testData)){
			$.extend(this.blockTest, testData);
			if(typeof this.blockTest.status!="undefined"){
				switch(this.blockTest.status){
					case "passed":
					case "failed":
						wbt.structure[this.blockNum].status=this.blockTest.status;
						break;
				};
				
				if(typeof content.blockNavigation!="undefined"){
					content.blockNavigation.update();
				};
				
				this.progressInitialized=true;
			};
		};
	},
	
	createResultPage: function(){
		var page={
			id: "result_p",
			title: wbt.metadata.language == "_de" ? encodeBase64("Auswertung") : encodeBase64("Evaluation"),
			leaf: true,
			template: "multipage",
			icon: "i",
			atoms: [],
			steps: [{
				id: "result_s",
				html: encodeBase64("{blockTestResults}"),
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
		
		var lastPage=wbt.structure[this.blockNum].items[wbt.structure[this.blockNum].items.length-1],
			gotcha=-1;
		$.each(lastPage.steps, function(i,step){
			if(typeof step.interaction=="undefined"){
				gotcha=i;
			}
		});
		
		if(gotcha>-1){ //prepend result page to existing last page
			wbt.structure[this.blockNum].items.splice(wbt.structure[this.blockNum].items.length-1, 0, page);
		}else{ //append result page as last page
			wbt.structure[this.blockNum].items.push(page);
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
		
		$.each(wbt.structure[this.blockNum].items, function(i, page){
			$.each(page.steps, function(j, step){
				if(typeof step.interaction=="object"){
					var interaction=step.interaction[0];
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
			});
		});
		
		if(retVal.total>0){
			retVal.mastery=Math.round(retVal.total * (wbt.structure[this.blockNum].masteryScore/100));
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
		};
		
		return retVal;
	},
	
	getNextTestPage: function(initialId, isRecursive){

		this.nextTestPage="";
		initialId = initialId || content.activePage.id;
		isRecursive = isRecursive || false;
		
		var targetId="",
			initialPageFound=false;
			
		$.each(wbt.structure[this.blockNum].items, function(i, page){
			if(initialPageFound){
				if(page.status=="notAttempted" || page.status=="not attempted" || page.status=="incomplete"){
					interactions.nextTestPage = page.id;
					return false; //"false" needed by jquery to exit the loop
				}
			}else{
				if(isRecursive){ //start with first page
					initialPageFound=true;
				}else{
					if(page.id == initialId){
						initialPageFound=true;
					}
				}
			}
		});
		
		if(targetId=="" && !isRecursive){
			this.getNextTestPage("xxx",true)
		}
	},
	
	getGo: function(){
		var go=true;
		switch(this.testVariant){
			case "assessment":
				switch(interactions.activeInteraction.status){
					case "passed":
					case "failed":
						$(interactions.containerId).html(
							"<div class='interactionInfoBox ui-corner-all' style='background-color:#EFC847;'></div>"
						);
						
						if(this.testIsCompleted){
							$(interactions.containerId+" .interactionInfoBox")
								.html(this.templateQuestionBlocked("completed"))
								.animate(
									{
										backgroundColor:"#fff",
										color: "#666"
									},{
										duration: 1000,
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
										duration: 1000,
										complete: function(){}
									}
								);
							go=false;
						};
						break;
				};
				break;
			case "selftest":
				switch(interactions.activeInteraction.status){
					case "passed":
					case "failed":				
						
						if(!this.testIsCompleted){
							$(interactions.containerId).html(
								"<div class='interactionInfoBox ui-corner-all'></div>"
							);
							
							$(interactions.containerId+" .interactionInfoBox")
								.html(this.templateQuestionBlocked("inprogress"))
								.animate(
									{
										backgroundColor:"#fff",
										color: "#666"
									},{
										duration: 1000,
										complete: function(){}
									}
								);
							go=false;
						};
						break;
					default:
						break;
				};
				break;				
	
			default:
				break;
		}
		if(!isMobile)writeTree();
		return go;
	},	
	
	getResults: function(){
		var html=""
			resultsHtml="",
			tippHtml="",
			attemptsHtml="",
			tdWidths = [],
			data=this.getSessionData(),
			resetActive=false;
			
		if(data.incomplete==0){ //test completed
			this.testIsCompleted=true;
			this.resultsVisible=true;
			wbt.structure[this.blockNum].status=data.status;
			
			if(this.testVariant=="selftest"){
				this.reviewMode=true;
				if(data.failed>0){
					resetActive=true;
				};
			}else{
				if(data.status=="failed" && this.blockTest.maxAttempts>-1 && (this.blockTest.attempts<this.blockTest.maxAttempts)){
					resetActive=true;
					attemptsHtml="" +
						this.templateRemainingAttempts()
							.replace(/{N}/, this.blockTest.maxAttempts-this.blockTest.attempts);				
				};
				
				if(data.status=="failed" && this.blockTest.maxAttempts==-1){
					resetActive=true;
					attemptsHtml=this.templateInifiteAttempts();
				};
				
			};
			
			switch(true){
				case (data.passed>0 && data.failed==0):
					tdWidths = ["100%", "0%"];
					break;
				case (data.passed==0 && data.failed>0):
					if(this.reviewMode){
						
						switch(wbt.metadata.language){
							case "_de":
								tippHtml="" +
									"<p>" +
										"Sie können Ihre Antworten mit der Musterlösung vergleichen, indem Sie die jeweilige " +
										"Aufgabe anklicken oder die entsprechende Seite im Inhaltsverzeichnis auswählen." +
									"</p>";		
								break;
							case "_en":
								tippHtml="" +
									"<p>" +
										"You can compare your answers with the provided sample solution by clicking on the task. " +
										"Alternatively, you can select the corresponding page in the table of contents." +
									"</p>";		
								break;
						}				
						
						
					};						
					tdWidths = ["0%", "100%"];
					break;
				default:
					switch(wbt.metadata.language){
						case "_de":
							tippHtml="" +
								"<p>" +
									"Sie sehen hier in der Übersicht, welche Aufgaben Sie richtig bzw. falsch gelöst haben. " +
									(this.reviewMode
										? "Tipp: Welche Antworten richtig gewesen wären, erfahren Sie, indem Sie die jeweilige " +
											"Aufgabe anklicken oder im Inhaltsverzeichnis auswählen."
										: ""
									) +
								"</p>";	
							break;
						case "_en":
							tippHtml="" +
								"<p>" +
									"Here you can see at a glance which tasks you've solved correctly or incorrectly. " +
									(this.reviewMode
										? "Tip: Click on a task or chose the corresponding page in the table of contents " +
											"to get a detailed sample solution."
										: ""
									) +
								"</p>";	
							break;
					}
					
					tdWidths = ["50%", "50%"];
					break;
			}

			var itemsPassed=[], itemsFailed=[];
			$.each(wbt.structure[this.blockNum].items, function(i, page){
				$.each(page.steps, function(j, step){
					if(typeof step.interaction=="object"){
						var interaction=step.interaction[0];
						switch(interaction.status){
							case "passed":									
								itemsPassed.push(decodeBase64(page.title));
								break;
							case "failed":
								itemsFailed.push("" +
									(this.reviewMode
										? "<span style='cursor:pointer;border-bottom:thin dotted;' onclick='content.jump(\""+page.id+"\");'>" +
											decodeBase64(page.title) +
										"</span>"
										: decodeBase64(page.title)
									)
								);
								break;
						}
					}
				});
			});
			
			resultsHtml=this.templateResultDetails(itemsPassed, itemsFailed, tdWidths);
			
			html=this.templateTestCompleted()
				.replace(/{HEADER}/, this.templateTestCompletedHeader())
				.replace(/{RESULTS}/, resultsHtml)
				.replace(/{TIPP}/, tippHtml)
				.replace(/{REMAININGATTEMPTS}/, attemptsHtml)
				.replace(/{RESETACTIVE}/, resetActive ? "inline-block" : "none");
			
			if(data.status=="passed"){
				if(typeof content.blockNavigation!="undefined"){
					content.blockNavigation.update();
				}				
			};
			
			scorm.updateSessionData(content.activePage.id, {
				attempts: this.blockTest.attempts,
				status: data.status
			});
			
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
			html=this.templateTestIncomplete();
		};
		
		return html;
	},
	
	getRandomImage: function(){
		var max=13,min=1;
		var rndNum=Math.floor(Math.random() * (max - min + 1)) + min;
		return custom+"shared/images/reflection/reflection"+rndNum+".jpg";
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
	
	jumpToNextTestPage: function(){
		this.getNextTestPage();
		if(this.nextTestPage!=""){
			content.jump(this.nextTestPage);
		}else{
			this.jumpToResultPage();
		}
	},
	
	jumpToResultPage: function(){
		content.jump("result_p");
	},
	
	resetBlockTest: function(){
		
		var pageNum=0,
			pageNums=[];
		
		$.each(wbt.structure, function(i, block){
			$.each(block.items, function(j, page){
				if((i==interactions.blockNum && page.status=="failed") || page.id=="result_p"){
					pageNums.push(pageNum);
					page.status="not attempted";
					page.score=0;
					$.each(page.steps, function(j, step){
						if(typeof step.interaction=="object"){
							var interaction=step.interaction[0];
								interaction.status="not attempted";
								interaction.score=0;
								interaction.blocked=false;
								interaction.attempts=0;
							
							if(typeof interaction.answers=="object"){
								$.each(interaction.answers, function(k, answer){
									answer.checked=false;
								});
							};
							
							if(typeof interaction.draggers=="object"){
								$.each(interaction.draggers, function(k, dragger){
									dragger.selectedDropper="";
									dragger.selected=false;
								});
							};
							
							if(typeof interaction.blanks=="object"){
								$.each(interaction.blanks, function(k, blank){
									blank.selected=false;
								});
							};
						}
					});
				};
				pageNum++;
			});
		});
			
		if(isMobile){
			$.each(wbt.structure, function(i, block){
				$.each(block.items, function(j, page){
					if(i==interactions.blockNum && page.status=="failed"){
						$("#li"+page.id+ " img.statusImg").attr("src",custom+"shared/images/icon_ueb.png");
					}
					$("#liresult_p img.statusImg").attr("src",custom+"shared/images/icon_i.png");
				});
			})
		}else{
			var setCharAt=function(str, index, chr) {
				if(index > str.length-1) return str;
				return str.substr(0,index) + chr + str.substr(index+1);
			};

			$.each(pageNums, function(i, num){
				visiState=setCharAt(visiState, num, 0);
			});
			
			writeTree();
		};
		
		$("#progressIndicator").remove();
		if(this.blockTest.maxAttempts>0){
			this.blockTest.attempts++;
		}
		this.reviewMode=false;
		this.resultsVisible=false;
		this.progressInitialized=false;
		
		var html=this.templateResetInfo();
		if(isMobile){
			content.dynaPopup(
				"type:base64",
				"content:"+encodeBase64("<div>" + html + "</div>"),
				"onclose:interactions.jumpToNextTestPage()"
			);
			
		}else{
			$.elpsOverlay("show", {
				content: html,
				closeKey: true,
				icon: "information",
				bound: $("#divcontainer"),
				width: "300px",
				buttons: {
					ok: {
						text: "OK",
						onclick: function(){
							$.elpsOverlay("hide");
							interactions.jumpToNextTestPage();
						}
					}
				}
			});
		}
	
		
	},
	
	/***** templates ****/
	templateIntroPage: function(){
		return "" +
			"<div id='intro_init' class='question' style='max-width:728px;'>" +
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
							"<td rowspan='2' valign='top' align='right'>" +
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
						(wbt.metadata.language=="_de" ? "Starten" : "Start")  +
					"</button> " +
					"<button class='ui-button' data-role='button' data-inline='true' data-theme='b' onclick='interactions.showHints();'>" +
						(wbt.metadata.language=="_de" ? "Hinweise zur Bedienung" : "Instructions")  +
					"</button>" +
				"</div>" +				
		   "</div>";
	},
	
	templateResumePage: function(){
		return "" +
			"<div id='intro_resume' class='question' style='max-width:728px;display:none;'>" +
				"<div class='questionHeader'>" +
					"<div class='questionText'>{INTRO}</div>" +
				"</div>" +
				"<div>" +
					"<table width='100%' border='0' cellspacing='4' cellpadding='4'>" +
						"<tr>" +
							"<td valign='top'>" +
								"<div class='description'>" +
									"<div>{RESUMEINFO}</div>" +
								"</div>" +
							"</td>" +
							"<td rowspan='2' valign='top' align='right'>" +
								"<img src='{IMGPATH}' />" +
							"</td>" +
						"</tr>" +
					"</table>" +
				"</div>" +
				"<div class='questionFooter'>" +
					"<button id='btnResume' class='ui-button-primary' data-role='button' data-inline='true' data-theme='b' onclick='interactions.jumpToNextTestPage();'>" +
						(wbt.metadata.language=="_de" ? "Zur Auswertung" : "Go to the evaluation page") +
					"</button>" +
				"</div>" +				
		   "</div>";
	},
	
	templateTestInfo: function(){
		var data=this.getSessionData(),
			style="padding: 10px; border-radius:4px; margin-bottom:5px; background:#EFC847;",
			html="";
			
		switch(this.testVariant){
			case "assessment":
				if(data.mastery == data.total){
					switch(wbt.metadata.language){
						case "_de":
							html="" +
								"<div style='"+style+"' id='testInfo'>" +
									"Um den Test erfolgreich zu absolvieren, müssen Sie <strong>alle " +
									"<nobr>" + data.total + " Fragen</nobr></strong> richtig beantworten." +
								"</div>";
							break;
						case "_en":
							html="" +
								"<div style='"+style+"' id='testInfo'>" +
									"In order to pass the exam successfully, you must correctly solve <strong>all " +
									"<nobr>" + data.total + " tasks.</nobr></strong>" +
								"</div>";
							break;
					}
				}else{
					switch(wbt.metadata.language){
						case "_de":
							html="" +
								"<div style='"+style+"' id='testInfo'>" +
									"Um den Test erfolgreich zu absolvieren, müssen Sie mindestens " +
									"<nobr><strong> " + data.mastery + " der " + data.total + " Fragen</strong></nobr> richtig beantworten." +
								"</div>";
							break;
						case "_en":
							html="" +
								"<div style='"+style+"' id='testInfo'>" +
									"In order to pass the exam successfully, you must correctly solve at least " +
									"<nobr><strong> " + data.mastery + " of " + data.total + " tasks.</strong></nobr>" +
								"</div>";
							break;
					};
				}
				break;
			case "selftest":
					if(data.mastery == data.total){
						switch(wbt.metadata.language){
							case "_de":
								html="" +
									"<div style='"+style+"' id='testInfo'>" +
										"Die Beantwortung der folgenden Fragen zeigt Ihnen, welche Lerninhalte Sie bereits verinnerlicht haben oder " +
										"wo noch Nachholbedarf besteht. Sie sollten in der Lage sein, " +
										"<strong>alle <nobr>" + data.total + " Aufgaben</nobr></strong> richtig zu lösen." +
									"</div>";
									break;
							case "_en":
								html="" +
									"<div style='"+style+"' id='testInfo'>" +
										"Based on a series of tasks you can assess whether you have memorized " +
										"the learning content or whether there is a need for additional learning on specific topics." +
										"You should be able to answer <strong>all <nobr>" + data.total + " questions</nobr></strong> correctly." +
									"</div>";
									break;
						}
					}else{
						switch(wbt.metadata.language){
							case "_de":
								html="" +
									"<div style='"+style+"' id='testInfo'>" +
										"Die Beantwortung der folgenden Fragen zeigt Ihnen, welche Lerninhalte Sie bereits verinnerlicht haben oder " +
										"wo noch Nachholbedarf besteht. Sie sollten in der Lage sein, mindestens " +
										"<nobr><strong> " + data.mastery + " der " + data.total + " Aufgaben</strong></nobr> richtig zu lösen." +
									"</div>";
								break;
							case "_en":
								html="" +
									"<div style='"+style+"' id='testInfo'>" +
										"Based on a series of tasks you can assess whether you have memorized " +
										"the learning content or whether there is a need for additional learning on specific topics. " +
										"You should be able to ansewer at least" +
										"<nobr><strong> " + data.mastery + " of " + data.total + " questions</strong></nobr> correctly." +
									"</div>";
								break;
						}
					}
				break;
		};
		return html;
	},
	
	templateResumeInfo: function(){
		var html="",
			data=this.getSessionData(),
			style="padding: 10px; border-radius:4px; margin-bottom:5px; background:#EFC847;";
		
		switch(data.status){
			case "failed":
				
				switch(wbt.metadata.language){
					case "_de":
						html="" +
							"<div style='"+style+"' id='resumeInfo'>" +
								"Sie haben den Test bereits bearbeitet, jedoch nicht erfolgreich absolviert. " +
								"Bitte gehen Sie zur Auswertungsseite für weitere Informationen." +
							"</div>";
						break;
					case "_en":
						html="" +
							"<div style='"+style+"' id='resumeInfo'>" +
								"You have already completed the questionnaire. However, you didn't pass the test successfully. " +
								"Please go to the evaluation page to get detailed information." +
							"</div>";
						break;
				};
				break;
			case "passed":
				switch(wbt.metadata.language){
					case "_de":
						html="" +
							"<div style='"+style+"' id='resumeInfo'>" +
								"Sie haben den Test bereits erfolgreich bearbeitet. " +
								"Bitte gehen Sie zur Auswertungsseite für weitere Informationen." +
							"</div>";
						break;
					case "_en":
						html="" +
							"<div style='"+style+"' id='resumeInfo'>" +
								"You have already passed the test successfully. " +
								"Please go to the evaluation page to get detailed information." +
							"</div>";
						break;
				}	
				break;
		};
		return html;
	},
	
	templateResetInfo: function(){
		switch(wbt.metadata.language){
			case "_de":
				return "" +
					"Sie können den Test nun wiederholen. Aufgaben, die Sie " +
					"bereits richtig beantwortet haben, werden nicht erneut angezeigt.";
			case "_en":
				return "" +
					"You can now repeat the test. Questions that have already " +
					"been solved correctly will not be displayed again.";
		}
	},
	
	templateStartMsg: function(){
		switch(wbt.metadata.language){
			case "_de":
				return "" +
					"<div style='margin-top:10px;padding:10px;font-size:small;'>" +
						"Klicken Sie auf ''Starten'', um mit der Bearbeitung des Fragenkatalogs zu beginnen." +
					"</div>";
			case "_en":
				return "" +
					"<div style='margin-top:10px;padding:10px;font-size:small;'>" +
						"Click ''Start'' to begin working through the questionnaire." +
					"</div>";
		}
	},
	
	templateTestHints: function(){
		switch(this.testVariant){
			case "assessment":
				switch(wbt.metadata.language){
					case "_de":
						return "" +
							"<div>" +
								"<p>" +
									"Sie können jede Aufgabe nur einmal lösen! Lesen Sie daher die Aufgabenstellung aufmerksam durch, " +
									"bevor Sie sich für eine Antwort entscheiden. Falls Sie sich hinsichtlich der Bedienung unsicher sind, klicken Sie " +
									"auf die Schaltfläche ''Hilfe'', die Ihnen bei jeder Aufgabe zur Verfügung steht." +
								"</p>" +
								"<p>" +
									"Anhand eines Fortschrittanzeigers erkennen Sie, wie weit Sie mit der Bearbeitung des " +
									"Fragenkatalogs vorangekommen sind. Bereits beantwortete Aufgaben werden außerdem " +
									"im Inhaltsverzeichnis gekennzeichnet." +
								"</p>" +
								"<p>" +
									"Eine Auswertung Ihrer Antworten erhalten Sie, sobald Sie " +
									"<b>alle</b> Fragen beantwortet haben." +
								"</p>" +
							"</div>";
					case "_en":
						return "" +
							"<div>" +
								"<p>" +
									"Note that each question can be solved only once! Therefore read each task carefully before you make your choice. " +
									"If you are unsure about what to do, you should click the ''Help'' button which is available on every test page." +
								"</p>" +
								"<p>" +
									"A progress indicator shows the overall progress during the exam. Completed tasks are also highlighted " +
									"in the Table of Contents." +
								"</p>" +
								"<p>" +
									"You will receive an evaluation of your answers as soon as you have solved <strong>all</strong> tasks." +
								"</p>" +
							"</div>";
				}
				break;
			case "selftest":
				switch(wbt.metadata.language){
					case "_de":
						return "" +
							"<div>" +
								"<p>" +
									"Lesen Sie die Aufgabenstellung jeweils aufmerksam durch, bevor Sie sich für eine Antwort entscheiden. " +
									"Falls Sie sich hinsichtlich der Bedienung unsicher sind, klicken Sie " +
									"auf die Schaltfläche ''Hilfe'', die Ihnen bei jeder Aufgabe zur Verfügung steht." +
								"</p>" +
								"<p>" +
									"Anhand eines Fortschrittanzeigers erkennen Sie, wie weit Sie mit der Bearbeitung des " +
									"Fragenkatalogs vorangekommen sind. Bereits beantwortete Aufgaben werden außerdem " +
									"im Inhaltsverzeichnis gekennzeichnet." +
								"</p>" +
								"<p>" +
									"Eine Auswertung Ihrer Antworten erhalten Sie, sobald Sie " +
									"<b>alle</b> Fragen beantwortet haben." +
								"</p>" +
							"</div>";
					case "_en":
						return "" +
							"<div>" +
								"<p>" +
									"Read each task carefully before you make your choice. " +
									"If you are unsure about what to do, you should click the ''Help'' button which is available on every test page." +
								"</p>" +
								"<p>" +
									"A progress indicator shows the overall progress during the test. Completed tasks are also highlighted " +
									"in the Table of Contents." +
								"</p>" +
								"<p>" +
									"You will receive an evaluation of your answers as soon as you have solved <strong>all</strong> tasks." +
								"</p>" +
							"</div>";
				}
				break;
		};

	},
	
	templateTestIncomplete: function(){
		switch(wbt.metadata.language){
			case "_de":
				return "" +
					"<div id='resultsContainer' class='question' style='max-width:728px;'>" +
						"<div class='questionHeader'>" +
							"<div id='testInfo' style='padding-top:10px;border-radius:4px; margin-bottom:5px; background-color:#EFC847;background-position: 4px 5px;' class='questionText'>" +
								"<b>Die Auswertung ist erst verfügbar, nachdem Sie alle Aufgaben bearbeitet haben.</b>" +
							"</div>" +
						"</div>" +
						"<div id='testIncomplete' class='questionBody'>" +
							"<p>Prüfen Sie im Inhaltsverzeichnis, welche Aufgaben Sie noch nicht bearbeitet haben und holen Sie dies nach.</p>" +
							"<p>Tipp: Wenn Sie auf 'Weiter' klicken, gelangen Sie automatisch zur ersten nicht bearbeiteten Aufgabe.</p>" +
						"</div>" +			
						"<div style='clear:both;'></div>" +
						"<div class='questionFooter'>" +
							"<button class='ui-button-primary' data-role='button' data-inline='true' data-theme='a' onclick='interactions.jumpToNextTestPage();'>" +
								"Weiter" +
							"</button>" +
						"</div>" +
					"</div>";
			case "_en":
				return "" +
					"<div id='resultsContainer' class='question' style='max-width:728px;'>" +
						"<div class='questionHeader'>" +
							"<div id='testInfo' style='padding-top:10px;border-radius:4px; margin-bottom:5px; background-color:#EFC847;background-position: 4px 5px;' class='questionText'>" +
								"<b>An evaluation will be available as soon as you have answered all questions.</b>" +
							"</div>" +
						"</div>" +
						"<div id='testIncomplete' class='questionBody'>" +
							"<p>Click ''Continue'' or check the Table of Contents to identify the tasks that still have to be processed.</p>" +
						"</div>" +			
						"<div style='clear:both;'></div>" +
						"<div class='questionFooter'>" +
							"<button class='ui-button-primary' data-role='button' data-inline='true' data-theme='a' onclick='interactions.jumpToNextTestPage();'>" +
								"Continue" +
							"</button>" +
						"</div>" +
					"</div>";
		}
	},
	
	templateTestCompleted: function(){
		if(isMobile){
			return "" +
				"<div>" +
					"<div id='resultsContainer' class='question'>" +
						"{HEADER}" +
						"<div class='questionBody' style='position:relative;padding:10px;'>" +
							"{TIPP}" +
							"<div>"+
								"{RESULTS}" +
							"</div>" +				
						"</div>" +
						"<div class='questionFooter' style='display:{RESETACTIVE}'>" +
							"<button data-role='button' data-theme='b' data-inline='true' onclick='interactions.resetBlockTest();'>" +
								eval("msgQuizProfilingReset"+wbt.metadata.language) +
							"</button>" +
							"{REMAININGATTEMPTS}" +
						"</div>" +
					"</div>" +
				"</div>";			
		}else{
			return "" +
				"<div id='resultsContainer' style='max-width:728px;'>" +
					"{HEADER}" +
					"<div class='questionBody' style='position:relative;max-height:300px;overflow-y:auto;'>" +
						"{TIPP}" +
						"<div>"+
							"{RESULTS}" +
						"</div>" +				
					"</div>" +
					"<div style='clear:both;'></div>" +
					"<div class='questionFooter' style='display:{RESETACTIVE}'>" +
						"<button class='ui-button' onclick='interactions.resetBlockTest();'>" +
							eval("msgQuizProfilingReset"+wbt.metadata.language) +
						"</button>" +
						"{REMAININGATTEMPTS}" +
					"</div>" +
				"</div>";
		}
	},

	templateTestCompletedHeader: function(){
		var html="",
			data=this.getSessionData();
		
		switch(data.status){
			case "passed":
				switch(wbt.metadata.language){
					case "_de":
						html+="" +
							"<div class='questionHeader' id='testInfo' style='background-color:#D6E877;" + (isMobile ? "'" : "margin-top:25px;'") + ">" +
								"<div class='questionText' style='background-image:url("+custom+"shared/images/passed.png);'>" +
									"Herzlichen Glückwunsch! Sie haben " +
										"<span class='tooltip' style='cursor:pointer;border-bottom:thin dotted;' title='...das entspricht " + data.score + "%'>" +
											data.passed + " von " + data.total + " Aufgaben " +
										"</span> " +
									"korrekt gelöst und den Fragenkatalog damit erfolgreich bearbeitet. " +
								"</div>" +
							"</div>"
						break;
					case "_en":
						html+="" +
							"<div class='questionHeader' id='testInfo' style='background-color:#D6E877;" + (isMobile ? "'" : "margin-top:25px;'") + ">" +
								"<div class='questionText' style='background-image:url("+custom+"shared/images/passed.png);'>" +
									"Congratulations! You have solved " +
										"<span class='tooltip' style='cursor:pointer;border-bottom:thin dotted;' title='...corresponding " + data.score + "%'>" +
											data.passed + " out of " + data.total + " tasks " +
										"</span> " +
									"correctly. Thus you have passed the exam successfully." +
								"</div>" +
							"</div>"
						break;
				}
				break;
			case "failed":
				switch(wbt.metadata.language){
					case "_de":
						html+="" +
							"<div class='questionHeader' id='testInfo' style='background-color:#E84E34;" + (isMobile ? "'" : "margin-top:25px;'") + ">" +
								"<div class='questionText' style='background-image:url("+custom+"shared/images/failed.png);'>" +
									"Sie haben " +
										"<span class='tooltip' style='cursor:pointer;border-bottom:thin dotted;' title='...das entspricht " + data.score + "%'>" +
											data.passed + " von " + data.total + " Aufgaben " +
										"</span> korrekt gelöst. " +
									"Um den Test erfolgreich zu absolvieren, hätten Sie jedoch <nobr>" + data.mastery + " Aufgaben</nobr> richtig lösen müssen." +
								"</div>" +
							"</div>";
						break;
					case "_en":
						html+="" +
							"<div class='questionHeader' id='testInfo' style='background-color:#E84E34;" + (isMobile ? "'" : "margin-top:25px;'") + ">" +
								"<div class='questionText' style='background-image:url("+custom+"shared/images/failed.png);'>" +
									"You have solved " +
										"<span class='tooltip' style='cursor:pointer;border-bottom:thin dotted;' title='...corresponding " + data.score + "%'>" +
											data.passed + " out of " + data.total + " tasks " +
										"</span> correctly. " +
									"However, " + data.mastery + " correct answers would have been necessary in order to pass the test successfully." +
								"</div>" +
							"</div>";
							break;
				}
				break;
			default:
				break;
		};
		return html;
	},

	templateQuestionBlocked: function(reason){
		switch (reason){
			case "completed":
				if(isMobile){
					switch(wbt.metadata.language){
						case "_de":
							return "" +
								"<p>" +
									"Der Test ist abgeschlossen. Der Zugriff auf die Fragen ist nicht mehr möglich." +
								"</p>"  +
								"<a href='javascript:void(0);' data-role='button' data-theme='b' data-inline='true' onclick='interactions.jumpToResultPage();'>" +
									"Zur Auswertung" +
								"</a>";
						case "_en":
							return "" +
								"<p>" +
									"The test is completed and therefore it is no longer possible to access the questions." +
								"</p>"  +
								"<a href='javascript:void(0);' data-role='button' data-theme='b' data-inline='true' onclick='interactions.jumpToResultPage();'>" +
									"Go to the evaluation page" +
								"</a>";
					}
				}else{
					switch(wbt.metadata.language){
						case "_de":
							return "" +
								"<div style='marging-top:25px;padding:10px;'>" +	
									"<p>" +
										"Der Test ist abgeschlossen. Der Zugriff auf die Fragen ist nicht mehr möglich." +
									"</p>"  +
									"<button class='ui-button-primary' onclick='interactions.jumpToResultPage();'>" +
										"Zur Auswertung" +
									"</button>" +
								"</div>";
						case "_en":
							return "" +
								"<div style='marging-top:25px;padding:10px;'>" +	
									"<p>" +
										"The test is completed and therefore it is no longer possible to access the questions." +
									"</p>"  +
									"<button class='ui-button-primary' onclick='interactions.jumpToResultPage();'>" +
										"Go to the evaluation page" +
									"</button>" +
								"</div>";
					}
				}
				
			case "inprogress":
				return "" +
					"<p>" + eval("msgQuizProfilingQuestionAlreadyCompleted"+wbt.metadata.language) + "</p>";

			default:
					return "";
		}
	},
	
	templateResultDetails: function(itemsPassed, itemsFailed, tdWidths){
		return "" +
			"<table width='95%'>" +
				"<tr>" +
					(
						itemsPassed.length>0
							? 	"<td valign='top' width='" + tdWidths[0] + "'>" +
									"<div class='blockResultDetailsHeader_passed'>" +
										(wbt.metadata.language=="_de" ? "Richtig beantwortete Aufgaben:" : "Correct answers:") +
									"</div>" +
								"</td>"
							: ""
					) + (
						itemsFailed.length>0
							? 	"<td valign='top' width='" + tdWidths[1] + "'>" +
									"<div class='blockResultDetailsHeader_failed'>" +
										(wbt.metadata.language=="_de" ? "Falsch beantwortete Aufgaben" : "Incorrect answers:") +
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
	
	templateRemainingAttempts: function(){
		switch(wbt.metadata.language){
			case "_de":
				return "" +
					"<span style='padding-left:10px;'>" +
						"Sie können den Test noch {N}x wiederholen." +
					"</span>";
			case "_en":
				return "" +
					"<span style='padding-left:10px;'>" +
						"The test can be repeated {N} times." +
					"</span>";
		}
	},
	
	templateInifiteAttempts: function(){
		switch(wbt.metadata.language){
			case "_de":
				return "" +
					"<span style='padding-left:10px;'>" +
						"Sie können den Test beliebig oft wiederholen." +
					"</span>";
			case "_en":
				return "" +
					"<span style='padding-left:10px;'>" +
						"You can repeat the test as often as you want." +
					"</span>";
		}
	}
});