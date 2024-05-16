$.extend(interactions, {
    
    cloze: {

        /**** help text ***********/
        
        getHelp: function(){
            return eval("msgQuizDirectionsCBO"+wbt.metadata.language);
        },

        getEvaluationInfo: function(status){
            var s="";
            switch(status){
                case "passed":
                    switch(wbt.metadata.language){
						case "_de":
							s="Sie haben die richtige Antwortalternative ausgewählt.";
							break;
						case "_en":
							s="You have selected the correct answer.";
							break;
					}
					
					break;
                case "failed":
					switch(wbt.metadata.language){
						case "_de":
							s="Sie haben die falsche Antwortalternative ausgewählt.";
							break;
						case "_en":
							s="You have selected the wrong answer.";
							break;
					}
                    
					break;
            };
            return s;
        },
		
		getAssistanceInfo: function(){
			var html="";
			switch(wbt.metadata.language){
				case "_de":
					html = "Als Hilfestellung zur weiteren Bearbeitung wurden die derzeit falsch ergänzten Lücken optisch hervorgehoben.";
					break;
				case "_en":
					html = "As an aid for further processing erroneously completed gaps were highlighted.";
					break;
			};
		},
		
		getEvaluationHelp: function(){
			return "";
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
                "<div class='questionBody dropShadow'><form data-ajax='false'>" +
                    "{CLOZE}" +
                "</form></div>";
        },
        
        interactionBlankTemplateInteractive: function(){
            return "" +
                "<span id='blank{FIBID}'>" +
					"<select id='{FIBID}' data-theme='b' data-inline='true' data-native-menu='false' size='1' name='answer'>" +
						"{OPTIONS}" +
					"</select>" +
				"</span>";
        },
        
        interactionOptionTemplate: function(){
            return "" +
                "<option{ISPLACEHOLDER}>{TEXT}</option>";
        },
        
        interactionBlankTemplateInactiveMobile: function(){
            return "" +
                "<div class='ui-select'>" +
                    "<span class='ui-btn ui-shadow ui-btn-corner-all ui-mini ui-btn-inline ui-btn-up-b'>" +
                        "<span class='ui-btn-inner'>" +
                            "<span class='ui-btn-text'>" +
                                "{TEXT}" +
                            "</span>" +
                        "</span>" +
                    "</span>" +
                "</div>";
        },
		
		interactionBlankTemplateInactiveDesktop: function(){
            return "" +
                "<span id='blank{FIBID}'>" +
					"<select id='{FIBID}' disabled='disabled' size='1'>" +
						"<option>" +
							"{TEXT}" +
						"</option>" +
					"</select>" +
				"</span>";
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
            
            var html="", blank="", options="", minWidth=0, spacer="", q=interactions.activeInteraction;
                      
            //header
            html+=this.interactionHeaderTemplate()
                .replace(/{TITLE}/g, decodeBase64(q.title))
                .replace(/{QUESTION}/g, decodeBase64(q.question));

            //body
            html+=this.interactionBodyTemplate()
                .replace(/{CLOZE}/g, decodeBase64(q.cloze));
            
            $.each(q.blanks, function(i,item){
                blank=interactions[interactions.activeInteractionType].interactionBlankTemplateInteractive()
                    .replace(/{FIBID}/g, q.id+"_"+item.id);
                
                options=interactions[interactions.activeInteractionType].interactionOptionTemplate()
                    .replace(/{TEXT}/g, "{SPACER}")
                    .replace(/{ISPLACEHOLDER}/g, " data-placeholder='true'");
               
                spacer="...";
                minWidth=15;

                var arr=$.randomize(item.options);
                for(var j=0;j<arr.length;j++){
                    options+=interactions[interactions.activeInteractionType].interactionOptionTemplate();
                    options=options
                        .replace(/{TEXT}/g, decodeBase64(arr[j].text))
                        .replace(/{ISPLACEHOLDER}/g, isMobile ? " data-placeholder='false'" : "");
                    if(decodeBase64(arr[j].text).length>minWidth){
                        minWidth=decodeBase64(arr[j].text).length;
                    }
                }

                for(var k=2;k<minWidth;k++){
                    spacer+="&nbsp;"
                }

                blank=blank
                    .replace(/{OPTIONS}/g, options)
                    .replace(/{SPACER}/g, spacer);

                
                html=html.replace("{"+item.id+"}", blank);
            });

            //footer
            html+=this.interactionFooterTemplate();

			//container
            html=this.interactionContainerTemplate()
                .replace(/{CONTENTS}/g, html);
			
			//infobox
            html+=this.interactionInfoTemplate();
			
            return html;
        },
        
        applyQuestionStatus: function(){
            var q=interactions.activeInteraction;
            $.each(q.blanks, function(i,item){

                if(item.selected!=""){
                    $("#"+q.id+"_"+item.id)
						.val(decodeBase64(item.selected))
                };

				$("#"+q.id+"_"+item.id)
					.bind("click", function(){
						interactions.hideBtnAssistance();
					});					
				
				if(q.blocked){
					$("#"+q.id+"_"+item.id)
						.prop("disabled", "disabled")
						.unbind("click");
				};
				
				if(isMobile){
					
					//$(".ui-select a").attr("rel","external")
				}
				
            });
        },
               
        getGoForEvaluation: function(){
            var q=interactions.activeInteraction;
            var target=q.blanks.length, actual=0;
            $.each(q.blanks, function(i,item){
                if($("#"+q.id+"_"+item.id+" option:selected").val().indexOf("...")==-1){
                    item.selected=encodeBase64($("#"+q.id+"_"+item.id+" option:selected").val());
                    actual++;
                };
            });
            return (actual==target ? true : false);
        },
        
        evaluate: function(){
            var q=interactions.activeInteraction;
            var target=q.blanks.length, actual=0;
                
            $.each(q.blanks, function(i,item){
                $.each(item.options, function(j,option){
                    if(option.isCorrect && item.selected==option.text){
                        actual++;
                    };
                });
            });
            return (actual==target ? "passed" : "failed");
        },
        
        showSampleSolution: function(){
            var q=interactions.activeInteraction, html="";
            $(".choice").removeClass("choice_passed choice_failed choice_missing");
            $.each(q.blanks, function(i,item){
              
                $.each(item.options, function(j,option){
                    if(option.isCorrect){
                        html=decodeBase64(option.text);
                    };
                });

                if(isMobile){
					html=interactions[interactions.activeInteractionType].interactionBlankTemplateInactiveMobile()
					    .replace(/{TEXT}/g,html);	
				}else{
					html=interactions[interactions.activeInteractionType].interactionBlankTemplateInactiveDesktop()
					    .replace(/{TEXT}/g,html);
                }
				
                $("#blank"+q.id+"_"+item.id).html(html);

            });
        },
        
        showUserSolution: function(){
            var q=interactions.activeInteraction, cls="", html="";
            $.each(q.blanks, function(i,item){
                
                cls="choice choice_failed";
                $.each(item.options, function(j,option){
                    if(option.isCorrect && item.selected==option.text){
                        cls="choice choice_passed";
                    };
                });
                
				if(isMobile){
					html=interactions[interactions.activeInteractionType]
						.interactionBlankTemplateInactiveMobile()
						.replace(/{TEXT}/g,decodeBase64(item.selected));
					$("#blank"+q.id+"_"+item.id).html(html);
					$("#blank"+q.id+"_"+item.id+ " .ui-select").addClass(cls);
				}else{
					html=interactions[interactions.activeInteractionType]
						.interactionBlankTemplateInactiveDesktop()
						.replace(/{TEXT}/g,decodeBase64(item.selected));
					$("#blank"+q.id+"_"+item.id).html(html);
					$("#blank"+q.id+"_"+item.id).addClass(cls);
                }
           });
        },

		showAssistance: function(){
			var q=interactions.activeInteraction, cls="";
			$.each(q.blanks, function(i,item){
				cls="choice choice_failed";
				$.each(item.options, function(j,option){
					if(option.isCorrect && item.selected==option.text){
						cls="";
					};
				});
				
				if(cls!=""){
					if(isMobile){
						$("#blank"+q.id+"_"+item.id+ " .ui-select").addClass(cls);
					}else{
						$("#blank"+q.id+"_"+item.id).addClass(cls);
					}				
				};
           });
		},
		
		hideAssistance: function(){
			var q=interactions.activeInteraction;
			$.each(q.blanks, function(i,item){
				if(isMobile){
					$("#blank"+q.id+"_"+item.id+ " .ui-select").removeClass("choice choice_failed");
				}else{
					$("#blank"+q.id+"_"+item.id).removeClass("choice choice_failed");
                }
           });
		},
        
        reset: function(jsonOnly){
            var q=interactions.activeInteraction;
            $.each(q.blanks, function(i,item){
                item.selected="";
            });
            if(!jsonOnly){
				$(interactions.containerId+" .question").remove();
				$(".interactionInfoBox").remove();
				interactions.assemble();
			}
        }
    
    }
});