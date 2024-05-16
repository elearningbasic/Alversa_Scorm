$.extend(interactions, {
    
    singlechoice: {

        /**** texts ***********/
        
        getHelp: function(){
            var html="";
			switch(wbt.metadata.language){
				case "_de":
					html= "" +
						"Nur eine Antwort ist richtig. " +
						"Wählen Sie das entsprechende Optionsfeld aus. " +
						"Bestätigen Sie Ihre Eingabe mit 'Fertig'.";
					break;
				case "_en":
					html= "" +
						"Only one answer is correct. " +
						"Select the appropriate radio button. " +
						"Click ''Done'' to confirm your selection.";
					break;
			}
			return html;
        },
        
        getEvaluationInfo: function(status){
            var s="";
			switch(wbt.metadata.language){
				case "_de":		
					switch(status){
						case "passed":
							s="Diese Antwortalternative haben Sie richtig markiert.";
							break;
						case "failed":
							s="Diese Antwortalternative haben Sie falsch markiert.";
							break;
						case "missing":
							s="Diese Antwortalternative wäre richtig gewesen.";
							break;
					}
					break;
				
				case "_en":
					switch(status){
						case "passed":
							s="This answer is correctly marked.";
							break;
						case "failed":
							s="This answer is incorrectly marked.";
							break;
						case "missing":
							s="This answer should have been marked.";
							break;
					}
					break;
			};
            return s;
        },
		
		getAssistanceInfo: function(){
			return ""; //macht bei sc wenig sinn...
		},
		
        getEvaluationHelp: function(){
            var html="";
			switch(wbt.metadata.language){
				case "_de":
					
					html = "" +
						"<table class='scEvaluationHelp' border='0' cellspacing='0' cellpadding='0'>" +
							"<tr>" +
								"<td colspan='2'>" +
									"<p>Bedeutung der Symbole:</p>" +
								"</td>" +
							"</tr>" +
							
							"<tr>" +
								"<td>" +
									"<span class='scEvaluationHelp_passed'></span>" +
								"</td>" +
								"<td>" +
									"<p>Diese Antwortalternative haben Sie richtig markiert.</p>" +
								"</td>" +
							"</tr>" +
							
							"<tr>" +
								"<td>" +
									"<span class='scEvaluationHelp_failed'></span>" +
								"</td>" +
								"<td>" +
									"<p>Diese Antwortalternative haben Sie falsch markiert.</p>" +
								"</td>" +
							"</tr>" +
							
							"<tr>" +
								"<td>" +
									"<span class='scEvaluationHelp_incomplete'></span>" +
								"</td>" +
								"<td>" +
									"<p>Diese Antwortalternative wäre richtig gewesen.</p>" +
								"</td>" +
							"</tr>" +
							
							"<tr>" +
								"<td>" +
									"<span class='scEvaluationHelp_hasFeedback'></span>" +
								"</td>" +
								"<td>" +
									"<p>Zu dieser Antwortalternative können Sie eine Erläuterung abrufen.</p>" +
								"</td>" +
							"</tr>" +                    
								
						"</table>";
					break;
						
				case "_en":
					html = "" +
						"<table class='scEvaluationHelp' border='0' cellspacing='0' cellpadding='0'>" +
							"<tr>" +
								"<td colspan='2'>" +
									"<p>Meaning of symbols:</p>" +
								"</td>" +
							"</tr>" +
							
							"<tr>" +
								"<td>" +
									"<span class='scEvaluationHelp_passed'></span>" +
								"</td>" +
								"<td>" +
									"<p>This answer is correctly marked.</p>" +
								"</td>" +
							"</tr>" +
							
							"<tr>" +
								"<td>" +
									"<span class='scEvaluationHelp_failed'></span>" +
								"</td>" +
								"<td>" +
									"<p>This answer is incorrectly marked.</p>" +
								"</td>" +
							"</tr>" +
							
							"<tr>" +
								"<td>" +
									"<span class='scEvaluationHelp_incomplete'></span>" +
								"</td>" +
								"<td>" +
									"<p>This answer should have been marked.</p>" +
								"</td>" +
							"</tr>" +
							
							"<tr>" +
								"<td>" +
									"<span class='scEvaluationHelp_hasFeedback'></span>" +
								"</td>" +
								"<td>" +
									"<p>Further information on this answer is available.</p>" +
								"</td>" +
							"</tr>" +                    
								
						"</table>";
					break;
			};
			
			return html;
			
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
                    "{CHOICES}" +
                "</div>";
        },
        
        interactionBodyTemplateWithImage: function(){
            return "" +
                "<table width='100%' border='0' cellspacing='0' cellpadding='0'>" +
                    "<tr>" +
                        "<td valign='top'>" +
                            "<div class='questionBody dropShadow' style='float:left;'>" +
                                "{CHOICES}" +
                            "</div>" +
                        "</td>" +
                        "<td valign='top' align='right'>" +
                            "<div style='background: url({SRC}) top left no-repeat;' class='questionImage dropShadow'></div>" +
                        "</td>" +
                    "</tr>" +
                "</table>";
        },
        
        interactionChoiceTemplate: function(){
            return "" +
                "<div id='div{CID}' class='clearfix choice choiceLarge'>" +
                    "<input id='choice{CID}' name='radio{QID}' type='radio' data-label='{TEXT}' data-feedback='{FEEDBACK}' data-role='none' />" +
                "</div>";
        },
        
        interactionChoiceImageTemplate: function(){
            return "" +
                "<img src='{RELPATH}images/{SRC}' />";
        },
        
        interactionFooterTemplate: function(){
            return templates.interactionFooterTemplate();
        },
        
        interactionInfoTemplate: function(){
            return templates.interactionInfoTemplate();
        },
        
        /**** public functions ****/
        /**************************/

        assemble: function(){
            
            var html="", choices="", q=interactions.activeInteraction;
            
            //header
            html=this.interactionHeaderTemplate()
                .replace(/{TITLE}/g, decodeBase64(q.title))
                .replace(/{QUESTION}/g, decodeBase64(q.question));

            aRan = new Array();
            for(var i=0; i<q.answers.length; i++) {
                aRan[i] = i+1;
            };
            
            if(q.randomize){
                for(var i=0; i<q.answers.length; i++) {
                    rand = Math.floor(Math.random()*q.answers.length);
                    temp = aRan[i];
                    aRan[i] = aRan[rand];
                    aRan[rand] = temp;
                }
            };
                
            //body
            for(var i=0;i<aRan.length;i++){
                var item=q.answers[aRan[i]-1];
                choices+=interactions[interactions.activeInteractionType].interactionChoiceTemplate();
                choices=choices.replace(/{TEXT}/g, item.html);
                choices=choices.replace(/{CID}/g, item.id);
                choices=choices.replace(/{QID}/g, q.id);                
                
                if(item.feedback!=""){
                    choices=choices.replace(/{FEEDBACK}/g,item.feedback);
                }else{
                    choices=choices.replace(/{FEEDBACK}/g,"");
                }
                
                if(item.pic!=""){
                    choices=choices.replace(
                        /{CHOICEIMAGE}/g,
                        interactions[interactions.activeInteractionType].interactionChoiceImageTemplate().replace(
                            /{SRC}/g,
                            item.pic
                        )
                    );
                }else{
                    choices=choices.replace(/{CHOICEIMAGE}/g,"");
                }
            };
            
			var picSrc="";
            switch(typeof q.pic){
                case "undefined":
                    break;
                case "object":
                    if(typeof q.pic.src!="undefined"){
						if(q.pic.src!=""){
							picSrc=q.pic.src;
						}
					}
                    break;
                case "string":
                    if(q.pic!=""){
                       picSrc=q.pic;
                    }
                    break;
            };
			
			if(picSrc==""){
				html+=this.interactionBodyTemplate()
					.replace(/{CHOICES}/g, choices);
			}else{
				html+=this.interactionBodyTemplateWithImage()
					.replace(/{CHOICES}/g, choices)
					.replace(/{SRC}/g, q.pic.src);
			};
			
            
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
            $.each(q.answers, function(i,item){
                
                if(!$("#choice"+item.id).parent().hasClass("prettyradio")){
                    $("#choice"+item.id).prettyCheckable();
                };         

                if(item.checked){
                    $("#choice"+item.id)
                        .attr("checked","checked")
                        .prettyCheckable("check");
                };
                
                if(q.blocked){
                    $("#choice"+item.id)
                        .attr("disabled",true)
                        .prettyCheckable("disable");
                }else{
                    $("#choice"+item.id)
                        .attr("disabled",false)
                        .prettyCheckable("enable");
                };
                
                if(isMobile){
					var w = wbt.metadata.stageWidth-90;
				}else{
					var w = $("#divcontent").width()-90;
				}

                switch(typeof q.pic){
                    case "undefined":
                        break;
                    case "object":
                        if(typeof q.pic.width!="undefined"){
							w-=(q.pic.width+60);
						}else{
							if(typeof q.pic.src!="undefined"){
								w-=300;
							}							
						}
                        break;
                    case "string":
                        if(q.pic!=""){
                            w-=300;
                        }
                        break;
                };                
                
                if($("#choice"+item.id).data("feedback") != ""){
                    w-=30;
                }
                
                $("#choice"+item.id)
                    .parent()
                    .children("label")
                    .css({
                        width:w+"px"
                    });
                
                $("#choice"+item.id).parent().children("label").html(
                    decodeBase64($("#choice"+item.id).data("label"))
                );
                
                if(status != "not attempted" && typeof $("#choice"+item.id).data("feedback") != "undefined"){
                    if($("#choice"+item.id).data("feedback") != ""){
                        $("#choice"+item.id).parent().children("label")
                            .addClass("hasFeedback")
                            .attr("title", wbt.metadata.langage=="_de" ? "Klicken Sie, um eine Erläuterung zu dieser Antwort zu erhalten." : "Click here for an explanation on this answer.")
                            .unbind("click.feedbackEvents")
                            .bind("click.feedbackEvents", function(){
                                if(isMobile){
                                    content.dynaPopup("type:base64","content:"+$("#choice"+item.id).data("feedback"));
                                }else{
                                    $.elpsOverlay("show", {
                                        content: decodeBase64($("#choice"+item.id).data("feedback")),
                                        closeKey: true,
                                        icon: "information",
                                        bound: $("#divcontainer"),
                                        width: "450px"
                                    });
                                };
                                content.moderate(21+i);
                            })
                    };
                };
            });
        },
        
        getGoForEvaluation: function(){
            var q=interactions.activeInteraction,go=false;
            $.each(q.answers, function(i,item){
                
                if($("#choice"+item.id).is(":checked")){
                    go=true;
                };
            });
            return go;
        },
        
        evaluate: function(){
            var q=interactions.activeInteraction, target="", actual="";
            $.each(q.answers, function(i,item){
                target+=item.isCorrect?"1":"0";
                
                if($("#choice"+item.id).is(":checked")){
                    actual+="1";
                    item.checked=true;
                }else{
                    item.checked=false;
                    actual+="0";
                };
            });

            if(actual===target){
                return "passed";
            }else{
                return "failed";
            }
        },
        
        showSampleSolution: function(){
            var q=interactions.activeInteraction;
            $.each(q.answers, function(i,item){

                if(item.isCorrect){
                    $("#choice"+item.id).prop("checked",true);
                    $("#choice"+item.id).prettyCheckable("check");
                }else{
                    $("#choice"+item.id).prop("checked",false);
                    $("#choice"+item.id).prettyCheckable("uncheck");
                };
                
                $("#choice"+item.id).parent().children("label").html(
                    decodeBase64($("#choice"+item.id).data("label"))
                );
                
                if(typeof $("#choice"+item.id).data("feedback") != "undefined"){
                    if($("#choice"+item.id).data("feedback") != ""){
                        $("#choice"+item.id).parent().children("label")
                            .addClass("hasFeedback")
                            .attr("title", wbt.metadata.langage=="_de" ? "Klicken Sie, um eine Erläuterung zu dieser Antwort zu erhalten." : "Click here for an explanation on this answer.")
                            .unbind("click.feedbackEvents")
                            .bind("click.feedbackEvents", function(){
                                if(isMobile){
                                    content.dynaPopup("type:base64","content:"+$("#choice"+item.id).data("feedback"));
                                }else{
                                    $.elpsOverlay("show", {
                                        content: decodeBase64($("#choice"+item.id).data("feedback")),
                                        closeKey: true,
                                        icon: "information",
                                        bound: $("#divcontainer"),
                                        width: "450px"
                                    });
                                };
                                content.moderate(21+i);
                            })
                    };
                };
               
            });
        },
        
        showUserSolution: function(){
            var q=interactions.activeInteraction;
            $.each(q.answers, function(i,item){

                if(item.checked){
                    $("#choice"+item.id).prop("checked",true);
                    $("#choice"+item.id).prettyCheckable("check");
                }else{
                    $("#choice"+item.id).prop("checked",false);
                    $("#choice"+item.id).prettyCheckable("uncheck");
                };
                 
                $("#choice"+item.id).parent().children("label").html(
                    decodeBase64($("#choice"+item.id).data("label"))
                );
                
                if(typeof $("#choice"+item.id).data("feedback") != "undefined"){
                    if($("#choice"+item.id).data("feedback") != ""){
                        $("#choice"+item.id).parent().children("label")
                            .addClass("hasFeedback")
                            .attr("title", wbt.metadata.langage=="_de" ? "Klicken Sie, um eine Erläuterung zu dieser Antwort zu erhalten." : "Click here for an explanation on this answer.")
                            .unbind("click.feedbackEvents")
                            .bind("click.feedbackEvents", function(){
                                if(isMobile){
                                    content.dynaPopup("type:base64","content:"+$("#choice"+item.id).data("feedback"));
                                }else{
                                    $.elpsOverlay("show", {
                                        content: decodeBase64($("#choice"+item.id).data("feedback")),
                                        closeKey: true,
                                        icon: "information",
                                        bound: $("#divcontainer"),
                                        width: "450px"
                                    });
                                };
                                content.moderate(21+i);
                            })
                    };                       
                };                    
                
                switch(true){
                    case (item.checked && item.isCorrect):
                        $("#choice"+item.id).prettyCheckable("passed");
                        break;
                    case (!item.checked && item.isCorrect):
                        $("#choice"+item.id).prettyCheckable("incomplete");
                        break;
                    case (item.checked && !item.isCorrect):
                        $("#choice"+item.id).prettyCheckable("failed");
                        break;
                }                
            });
        },
        
        reset: function(jsonOnly){
            var q=interactions.activeInteraction;
            $.each(q.answers, function(i,item){
                
                item.checked=false;
                
                if(!jsonOnly){
                    $("#choice"+item.id).prop("checked",false).prop("disabled",false);
                    
                    $("#choice"+item.id).prettyCheckable("uncheck");
                    
                    $("#choice"+item.id).parent().children("label")
                        .html(decodeBase64($("#choice"+item.id).data("label")))
                        .unbind("click.feedbackEvents")
                        .removeClass("hasFeedback");
					$(".interactionInfoBox").remove();
				}
            });
			if(!jsonOnly){
				content.jump(content.activePage.id);
			}
        }
    }
});