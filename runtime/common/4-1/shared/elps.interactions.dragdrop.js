$.extend(interactions, {
    
    dragdrop: {

        /**** help text ***********/
        
        getHelp: function(){
            var html="";
			switch(wbt.metadata.language){
				case "_de":
					html="" +
						"Ordnen Sie die nach dem Zufallsprinzip verteilten Kärtchen durch Ziehen und Fallenlassen dem passenden Zielfeld zu. " +
						"Die Reihenfolge innerhalb eines Zielfelds spielt dabei keine Rolle.";
					break;
				case "_en":
					html="" +
						"Drag and drop the randomly distributed cards to the appropriate target box. " +
						"The sequence within a target field is irrelevant.";
					break;
			}
			
			return html;
        },
		
		getEvaluationInfo: function(status){
            var s="";
            switch(status){
                case "passed":
                    switch(wbt.metadata.language){
						case "_de":
							s="Dieses Kärtchen haben Sie richtig zugeordnet.";
							break;
						case "_en":
							s="You have assigned this card correctly.";
							break;
					}
					
					break;
                case "failed":
                    switch(wbt.metadata.language){
						case "_de":
							s="Dieses Kärtchen haben Sie falsch zugeordnet.";
							break;
						case "_en":
							s="You have not assigned this card correctly.";
							break;
					}
					break;
            }
            return s;
        },
		
		getAssistanceInfo: function(){
			var html="";
			switch(wbt.metadata.language){
				case "_de":
					html = "Als Hilfestellung zur weiteren Bearbeitung sehen Sie nun die derzeit falsch zugeordneten Kärtchen.";
					break;
				case "_en":
					html = "As an aid to further processing, you can now see the currently mismatched cards.";
					break;
			};
			return html;
		},
		
		getEvaluationHelp: function(){
			return "";
		},
		
		getMenuInactiveMessage: function(){
			var html="";
			switch(wbt.metadata.language){
				case "_de":
					html = "" +
						"Diese Funktion ist derzeit nicht verfügbar. Bitte bearbeiten Sie erst die Aufgabe oder verwenden Sie " +
						"die Navigations-Schaltflächen, um sie zu überspringen."
						break;
				case "_en":
					html = "" +
						"This feature is currently unavailable. Please complete the task first, " +
						"or use the navigation buttons to skip it."
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
                "<div class='ddContainer dropShadow' id='{CONTAINERID}'>" +
					"<div class='questionBody'>" +
						"{DROPPERS}" +
					"</div>" +
				"</div>";
        },
		
		interactionMatrixDropperTemplate: function(){
			return "" +
				"<div class='dropperBox'>" +
					"<div>{TITLE}</div>" +
					"<ul id='{DROPPERID}' class='connected list{DROPPERSNUM} ui-sortable'></ul>" +
				"</div>";
		},
		
		interactionImageDropperTemplate: function(){
			return "" +
				"<div class='dropperBox'>" +
					"<ul id='{DROPPERID}' class='connected ui-sortable'></ul>" +
				"</div>";
		},
		
		interactionDraggersContainerTemplate: function(){
			var msg="";
			switch(wbt.metadata.language){
				case "_de":
					msg = "Ordnen Sie zu:";
					break;
				case "_en":
					msg = "Arrange the cards:";
					break;
			}
			
			return "" +
				"<div>" +
					"<span class='iconMove'>" + msg +"</span>" +
				"</div>" +
				"<ul id='dropSource' class='connected list{DROPPERSNUM} ui-sortable' style='min-height:100px !important;'>" +
					"{DRAGGERS}" +
				"</ul>";
		},
		
		interactionDraggerTemplate: function(){
			return "" +
				"<li id='{DRAGGERID}' ddtarget='{DROPPERID}' style='display:block;'>" +
					"{TITLE}" +
				"</li>";
		},
       
        interactionFooterTemplate: function(){
            return templates.interactionFooterTemplate();
        },
		
		interactionInfoTemplate: function(){
            return templates.interactionInfoTemplate();
        },
        
        /**** public functions ****/
        /**************************/

		previousSidebarStatus: "",
		
        assemble: function(){
            
            var q=interactions.activeInteraction,
				html="",
				droppersHtml="",
				draggersHtml="";

			if(typeof q.pic!="undefined"){
				this.taskMode="image";
            }else{
				this.taskMode="matrix";
			};
			
            //header
            html+=this.interactionHeaderTemplate()
                .replace(/{TITLE}/g, decodeBase64(q.title))
                .replace(/{QUESTION}/g, decodeBase64(q.question));

            //body
			html+=this.interactionBodyTemplate().replace(/{CONTAINERID}/g, q.id);
			
			//droppers
            switch(this.taskMode){
				case "matrix":
					$.each(q.droppers, function(i,item){
						droppersHtml+=interactions[interactions.activeInteractionType].interactionMatrixDropperTemplate()
							.replace(/{TITLE}/g, decodeBase64(item.html))
							.replace(/{DROPPERID}/g, item.id)
							.replace(/{DROPPERSNUM}/g, q.droppers.length)
					});
					break;
				case "image":
					$.each(q.droppers, function(i,item){
						droppersHtml+=interactions[interactions.activeInteractionType].interactionImageDropperTemplate()
							.replace(/{DROPPERID}/g, item.id)
					});
					break;
			}

			html=html.replace(/{DROPPERS}/g, droppersHtml);
			
			//draggers
			var arr=$.randomize(q.draggers.slice());
            for(var i=0;i<arr.length;i++){
				draggersHtml+=interactions[interactions.activeInteractionType].interactionDraggerTemplate()
					.replace(/{TITLE}/g, decodeBase64(arr[i].html))
					.replace(/{DRAGGERID}/g, arr[i].id)
					.replace(/{DROPPERID}/g, arr[i].correctDropper);
            };

            //footer
            html+=this.interactionFooterTemplate();

			//container
            html=this.interactionContainerTemplate()
                .replace(/{CONTENTS}/g, html);
				
			//infobox
            html+=this.interactionInfoTemplate();
				
			//draggable dropsource
			var appendToContainer=isMobile ? "#contents .ui-content" : "#westPane"; //"#divcontainer";
			
			$("<div/>", {
				id: "draggersContainer",
				"class": "dropperBox dropShadow",
				css: {
					position: "absolute",
					top: isMobile ? "132px" : "3px",
					left: isMobile ? "66%" : "3px",
					maxHeight: wbt.metadata.stageHeight+"px",
					backgroundColor: "#fff"
				},
				html: interactions[interactions.activeInteractionType].interactionDraggersContainerTemplate()
					.replace(/{DROPPERSNUM}/g, q.droppers.length)
					.replace(/{DRAGGERS}/g, draggersHtml)
			}).appendTo(appendToContainer);

			$("#dropSource").css({
				maxWidth: isMobile ? "300px" : (($("#dynaWrapper").width()==0 ? 280 : $("#dynaWrapper").width()) - 20) + "px",
				maxHeight: wbt.metadata.stageHeight+"px",
				overflow:"hidden"
			});
			
			if(this.taskMode=="image"){
				this.preloadImage(q.pic.src);
			};
			
			return html;
        },
		
		preloadImage: function(src, callback){
            
            if(typeof callback!="function"){
                callback = function(){};
            };
            
            if($("#trashBin").length > 0){
                
            }else{
                $("<div/>", {
                    id: "trashBin", //used for preloading images
                    css: {
                        display: "none"
                    }
                }).appendTo($("body"));
            };
            
            var img=$("<img/>", { 
                src: src,
                load: function(e){
                    callback(e)
                }
            }).appendTo($("#trashBin"));
            
        },
        
        applyQuestionStatus: function(){
            var q=interactions.activeInteraction;
			
			if(this.taskMode=="image"){
				
				$("#"+q.id).css({
					background: "url(" + q.pic.src + ") no-repeat top left",
					width: q.pic.width + "px",
					height: q.pic.height + "px"
				});
				
				$.each(q.droppers, function(i,dropper){
					
					var scaleX = q.pic.width / parseInt(q.pic.cx),
						scaleY = q.pic.height / parseInt(q.pic.cy);
				
					var X = parseInt(dropper.pos.x * scaleX) , 
						Y = parseInt(dropper.pos.y * scaleY) ,
						W = parseInt(dropper.size.cx * scaleX),
						H = parseInt(dropper.size.cy * scaleY);
					
					$("#dropSource").css({
						minWidth: "125px",
						width: W + "px"
					});
					
					$("#"+dropper.id)
						.css({
							minHeight: $("#dropSource li").height() + "px"
						})
						.parent()
						.css({
							position: "absolute",
							"float": "none",
							left: X + "px",
							top: Y + "px",
							width: W + "px",
							height: (H + 9) + "px",
							zIndex: 0							
						});					
				});
			}else{
				$(".questionBody").css({
					minHeight: $(".ddContainer").height() + "px"
				})
			};		
			
            $.each(q.draggers, function(i,item){
                if(item.selectedDropper!=""){
					$("#"+item.id).appendTo($("#"+item.selectedDropper));
				}
            });
			
			if(q.blocked){
				$("#draggersContainer").fadeOut("slow", function(){
					if(!isMobile){
						$("#dynaWrapper").fadeIn("slow");
					}
				});
				
				$.each(q.draggers, function(i,item){
					$("#"+item.id).css({
						cursor: "default"
					})
				});			
			}else{
				$(".connected").sortable({
					appendTo: "body",
					helper: "clone", //css -> .ui-sortable-helper!!				
					connectWith: ".connected",
					placeholder: "dropPlaceholder",
					start: function( event, ui ) {
						interactions.hideBtnAssistance();
					}
				});
				
				$(".dragger").css({
					cursor: "move"
				});
				
				if(isMobile){
					$("#draggersContainer").draggable({
						handle: "div"
					});
				}else{
					$("#dynaWrapper").fadeOut("slow", function(){
						$("#mainGrid").trigger("open");
					});
				};
				
			};
        },
               
        getGoForEvaluation: function(){
			var q=interactions.activeInteraction;
			$.each(q.draggers, function(i,item){
				var selectedDropper=$("#"+item.id).parent().attr("id");
				if(selectedDropper!="dropSource"){
					item.selectedDropper=selectedDropper;
				}else{
					item.selectedDropper="";
				}
			});
            return $("#dropSource li").length==0 ? true : false;
        },
        
        evaluate: function(){
            var q=interactions.activeInteraction;
			var target=q.draggers.length, actual=0;
			$.each(q.draggers, function(i,item){
				var selectedDropper=$("#"+item.id).parent().attr("id");
				if(selectedDropper==item.correctDropper){
					actual++;
				}
			});
			
            return actual==target ? "passed" : "failed";
        },
        
        showSampleSolution: function(){
            var q=interactions.activeInteraction;
            $(".dragger").removeClass("dragger_passed dragger_failed dragger_missing");
			$(".dropperBox li").remove();
			
			$.each(q.draggers, function(i,item){
				$("<li/>", {
					html: decodeBase64(item.html),
					css: {
						cursor: "default"
					}
				}).appendTo("#"+item.correctDropper);
			});
        },
        
        showUserSolution: function(){
			$(".dropperBox li").remove();			
			var q=interactions.activeInteraction;
            $.each(q.draggers, function(i,item){
				$("<li/>", {
					html: decodeBase64(item.html),
					"class": item.selectedDropper==item.correctDropper ? "dragger dragger_passed" : "dragger dragger_failed"
				}).appendTo("#"+item.selectedDropper);
				
			});
        },
		
		showAssistance: function(){
			var q=interactions.activeInteraction;
			$.each(q.draggers, function(i,item){
                if(item.selectedDropper!=item.correctDropper){
					$("#"+item.id).addClass("dragger dragger_failed");
				}
            });
		},
		
		hideAssistance: function(){
			$(".dragger").removeClass("dragger dragger_failed");
		},
		
        cleanUp: function(){
			//when navigating to another page or step
			$("#trashBin").remove();
			$("#draggersContainer").remove();
			$("#dynaWrapper").show();
			if(scorm.getPreference("sidebar")=="hidden"){
				$("#mainGrid").trigger("close");
			};
		},

		statusChange: function(newStatus){
			$("#draggersContainer").remove();
			$("#dynaWrapper").fadeIn("slow");
			try{
				$(".connected").sortable("destroy");
			}catch(e){}
		},
		
        reset: function(jsonOnly){
			
			var q=interactions.activeInteraction;
			$.each(q.draggers, function(i,item){
                item.selectedDropper="";
            });
			
			if(!jsonOnly){
				$("#draggersContainer").remove();
				$("#dynaWrapper").fadeIn("slow");
				$(".interactionInfoBox").remove();
				$(interactions.containerId+" .question").remove();
				interactions.assemble();  
			}; 
        }
        
        /**** private functions ****/
        /***************************/        
        
    }
});