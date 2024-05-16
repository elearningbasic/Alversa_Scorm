$.extend(modPanel, {
		
	init:function(){
		$("<div/>", {
			id: "modTextContainer"
		}).appendTo($("body")).hide();
		
		$("<span/>", {
			id: "dynaModControl",
			click: function(){
				modPanel.toggle();
			}
		}).appendTo($("#divfooter")).hide();
	},

	setContent:function(html){
		
		$("#modTextContainer").html(html);

		if($("#draggersContainer").length>0){
			$("#dynaModControl").hide();
			return;
		};
		
		if(html!=""){
			$("#dynaModControl").show("fast", function(){
				if(scorm.getPreference("showModeration")){
					modPanel.showPanel();
				}else{
					modPanel.hidePanel();
				};
			});
		}else{
			if(scorm.getPreference("showModeration")){
				this.showPanel();
			}else{
				this.hidePanel();
			};
		}		
	},
	
	toggle: function(){
		if(scorm.getPreference("showModeration")){
			this.hidePanel();
		}else{
			this.showPanel();
		};
	},
	
	showPanel:function(){
		
		var msg="";
		switch(wbt.metadata.language){
			case "_de":
				msg ="Sprechertext ausblenden";
				break;
			case "_en":
				msg ="Скрыть дикторский текст";
				break;
		};
		
		scorm.setPreference("showModeration", true);
		
		$("#dynaModControl")
			.removeClass("mod_activate")
			.addClass("mod_deactivate")
			.attr("title",msg);
		
		if($("#dynaModContainer").length==0){
			buildDynaDiv();
			$("<div/>", {
				id: "dynaModContainer"
			}).appendTo($("#dynaContainer"));
		};

		$("#dynaModContainer")
			.html($("#modTextContainer").html())
			.show();
			
		$("#mainGrid").trigger("toggle", "open");
	},	

	hidePanel:function(){
		
		var msg="";
		switch(wbt.metadata.language){
			case "_de":
				msg ="Sprechertext einblenden";
				break;
			case "_en":
				msg ="Показать дикторский текст";
				break;
		};
		
		scorm.setPreference("showModeration", false);
		$("#dynaModControl")
			.removeClass("mod_deactivate")
			.addClass("mod_activate")
			.attr("title",msg);
		$("#dynaModContainer").hide();
		doMenuItem("toc", "no-open");
	}
});