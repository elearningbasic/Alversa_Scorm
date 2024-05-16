$(document).on("pageinit","#landingPage", function() {
    
    $(window).bind("orientationchange resize", function(e){
        if(typeof(e.originalEvent)!="undefined"){
            if(e.originalEvent.type=="resize"){
                if(typeof content.alignModerationPanel=="function"){
                    content.alignModerationPanel();
                }
            }
        }
        
        var oldOrientation=wbt.metadata.orientation;
        
        if(e.orientation) { //orientationchange
            wbt.metadata.orientation=e.orientation;
        }else{ //resize
            if($(window).width()>=$(window).height()){
                wbt.metadata.orientation="landscape";
            }else{
                wbt.metadata.orientation="portrait";
            }
        }
        if(oldOrientation!=wbt.metadata.orientation){
            window.setTimeout(function() {
                content.autoShowHidePanels();
            }, 200);
        }
    });				
    
    $(document).on("pagechange", function(e,data){
        var from=data.options.fromPage;
        if(from){
            if(from.attr("id")=="splashPage"){
                window.setTimeout(function(){
                    content.setActivePage("start");
                },1000);
            }
        };

        switch(data.toPage.attr("id")){
            case "splashPage":							
                wbt.metadata.orientation="landscape";
                if($(window).width()>=$(window).height()){
                    wbt.metadata.orientation="landscape";
                }else{
                    wbt.metadata.orientation="portrait";
                };						
                
                break;
            case "contents":
                switch(from.attr("id")){
                    case "glossary":
                    case "files":
                        break;
                    default:
                        content.autoShowHidePanels();
                        if(typeof randomFacts!="undefined"){
                            if(typeof randomFacts.alignNavbar=="function"){
                                randomFacts.alignNavbar();
                            }
                        }
                };
                $("#landingPage").remove();
                $("#splashPage").remove();
        };
    });
    
    $(document).bind("pagebeforechange", function(e, data) {
        var to = data.toPage["0"].id;
        if(typeof to=="string"){
            if(to=="landingPage")e.preventDefault(); //avoid JQM's default href="#" behaviour on cloze 
        }
    });
    
    $(document).on("popupafteropen", "div.ui-popup-active", function(){
        //avoid JQM's default href="#" behaviour
        $(this).find("a")
            .attr("href", "#")
            .attr("rel","external")            
    });

    
});