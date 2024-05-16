$.extend(content, {

    blockNavigation: {

        init: function(){
            if($("#blockNav").length==0){
                this.create();
            }else{
                this.update();
            }
        },
        
        getActiveBlockNum: function(){
            var retVal=0;
            for(var i in wbt.structure){
                for (var j in wbt.structure[i].items) {
                    if(typeof wbt.structure[i].items[j] == "object"){
                        if(wbt.structure[i].items[j].id == content.activePage.id){
                            retVal = i;
                        }
                    }
                }
            }
            return retVal;
        },
        
        getFirstPageOfBlock: function(num){
            if(typeof wbt.structure[num]=="object"){
                
                if(typeof wbt.structure[num].items!="undefined"){
                    return {
                        pageId: wbt.structure[num].items[0].id,
                        tooltip: decodeBase64(wbt.structure[num].items[0].title)
                    }
                }
            }
            return {};
        },
        
        getBlockStatus: function(num){
            var pagesCompleted=0, status="incomplete";
            $.each(wbt.structure[num].items, function(i,page){
                switch(page.status){
                    case "completed":
                    case "passed":
                    case "browsed":
                        pagesCompleted++;
                        break;
                    case "incomplete":
                    case "failed":
                    case "not attempted":
                        if(wbt.structure[num].masteryScore>0){
                            status="mandatory";
                        }
                    default:
                        break;
                }
            });

            if(pagesCompleted==wbt.structure[num].items.length){
                status="completed";
            }else{
                if(wbt.structure[num].masteryScore>0){ //calc by masteryscore
                    if(typeof wbt.structure[num].status!="undefined"){
                        status=wbt.structure[num].status;
                    }else{
                        var score=parseInt(round(pagesCompleted / wbt.structure[num].items.length) * 100);
                        if(score>=wbt.structure[num].masteryScore){
                            status="completed";
                        };
                    };
                };
                
                if(typeof wbt.structure[num].status!="undefined"){
                    switch(wbt.structure[num].status){
                        case "completed":
                        case "passed":
                        case "browsed":
                            status="completed";
                            break;
                        case "failed":
                            if(wbt.structure[num].masteryScore>0){
                                status="mandatory";
                            }else{
                                status="incomplete";
                            }
                            break;
                        case "incomplete":
                        case "not attempted":
                        default:
                            if(wbt.structure[num].masteryScore>0){
                                status="mandatory";
                            }
                            break;
                    }
                };
                
            };
            return status;
        },
        
        preloadImage: function(src, attrib, callback){
            
            if(typeof callback!="function"){
                callback = function(){};
            }
            
            if(typeof attrib=="undefined"){
                attrib={};
            }
            
            if($("#trashBin").length > 0){
                
            }else{
                $("<div/>", {
                    id: "trashBin" //used for preloading images
                }).appendTo($("body"));
                
                if(msie8){ //ie8 cannot get image sizes within hidden containers
                    $("#trashBin").css({
                        position: "absolute",
                        top: "2000px"
                    })
                }else{
                    $("#trashBin").css({
                        display: "none"                       
                    })
                }                
            };
            
            if(msie8){
                var img=$("<img/>")
                    .appendTo($("#trashBin"))
                    .bind("load", function(e){
                            callback(e, attrib)
                        })
                    .attr("src", src);
            }else{
                
                var img=$("<img/>", { 
                    src: src + "?" + new Date().getTime(),
                    load: function(e){
                        callback(e)
                    }
                }).appendTo($("#trashBin"));
            }

            if(!$.isEmptyObject(attrib)){
                if(msie8){
                    img.attr("data-" + attrib.name, attrib.val.toString());
                }else{
                    img.data(attrib.name, attrib.val.toString());
                }
            }
            
        },

        create: function(){  
            
            if(isMobile){
                $("<div/>", {
                    id: "blockNav",
                    css: {
                        display: "none",
                        position: "absolute",
                        top: $("#pageTitle").position().top+"px",
                        marginTop: "5px",
                        right: "20px",
                        left: "auto"
                    }
                }).appendTo($("#mainContainer"));
            }else{
                $("<div/>", {
                    id: "blockNav",
                    css: {
                        display: "none",
                        position: "absolute",
                        top: 0,
                        right: "5px",
                        left: "auto",
                        "z-index": "2"
                    }
                }).appendTo($("#mainGrid"));
            }
           
            this.preloadImage(custom+"shared/images/blocks/status_incomplete.png");
            this.preloadImage(custom+"shared/images/blocks/status_completed.png");
            this.preloadImage(custom+"shared/images/blocks/status_mandatory.png");
        
            this.queueLength=0;
            for(var i=0;i<wbt.structure.length;i++){
                var block=wbt.structure[i];
                if(typeof block.friendlyId!="undefined"){
                    this.queueLength++;
                }
            };
            if(msie8){
                this.queueLength++;
            }
            
            for(var i=0;i<wbt.structure.length;i++){
                var block=wbt.structure[i];
             
                if(typeof block.friendlyId!="undefined"){
                    this.preloadImage( 
                        i==0
                            ? custom+"shared/images/blocks/block_"+block.friendlyId+"_inactive.png"
                            : custom+"shared/images/blocks/block_"+block.friendlyId+"_active.png"
                    );
                    
                    this.preloadImage(
                        i==0
                            ? custom+"shared/images/blocks/block_"+block.friendlyId+"_active.png"
                            : custom+"shared/images/blocks/block_"+block.friendlyId+"_inactive.png",
                        {
                            "name": "blocknum",
                            "val" : i
                        },
                        content.blockNavigation.queueElements
                    );
                    
                };
            };
            
            if(msie8){ //workaround for an ie8 bug (last image in queue is messed up, so load a dummy image)
                this.preloadImage(
                    custom+"shared/images/logo.png",
                    {
                        "name": "blocknum",
                        "val" : i
                    },
                    content.blockNavigation.queueElements
                );
            }
            
        },
        
        queueElements: function(e,a){
            if(typeof content.blockNavigation.queue=="undefined"){
                content.blockNavigation.queue=new Array(content.blockNavigation.queueLength);
            };

            if(msie8){
                content.blockNavigation.queue[parseInt(a.val)]=$(e.currentTarget);
            }else{
                content.blockNavigation.queue[parseInt($(e.currentTarget).data("blocknum"))]=e.currentTarget;                
            }

            var itemsRemaining=content.blockNavigation.queueLength;
            $.each(content.blockNavigation.queue, function(i,item){
                if(typeof item!="undefined"){
                    itemsRemaining--;
                };
            });

            if(itemsRemaining==0){                
                content.blockNavigation.applyElements();
            };
        },
        
        applyElements: function(){
        
            $.each(this.queue, function(i,item){
                
                var imgWidth=$(item).get(0).width,
                    imgHeight=$(item).get(0).height,
                    blocknum=parseInt($(item).data("blocknum")),
                    linkData=content.blockNavigation.getFirstPageOfBlock(blocknum),
                    go=true;

                if(msie8){
                    if(typeof $(item).data("blocknum")=="undefined"){
                        go=false;
                    };
                };
                
                if(go){
                
                    if(typeof $(item)[0].naturalWidth!="undefined" && typeof $(item)[0].naturalHeight!="undefined"){
                        if(imgWidth==0 || imgHeight==0){
                            imgWidth=$(item)[0].naturalWidth;
                            imgHeight=$(item)[0].naturalHeight;
                        }    
                    };
                    
                    if(!$.isEmptyObject(linkData)){
     
                        $("<div/>", {
                            id: "blockDiv"+blocknum,
                            css: {
                                display:"inline-block",
                                width: imgWidth+"px",
                                height: imgHeight+"px",
                                background: "url("+ $(item).attr("src").split("?")[0] + ") no-repeat",
                                margin: "0 2px"
                            }
                        }).appendTo($("#blockNav"));
        
                        var elm=$("<img/>", {
                            id: "blockImg"+blocknum,
                            src: custom+"shared/images/blocks/status_"+content.blockNavigation.getBlockStatus(blocknum)+".png",
                            css: {
                                display:"block",
                                cursor: "pointer"
                            },
                            "class": "tooltip",
                            title: linkData.tooltip,
                            click: function(){
                                content.jump(linkData.pageId);
                            }
                        }).appendTo($("#blockDiv"+blocknum));
                        
                        if(!isMobile){
                            $(elm).elpsTooltip({
                                animation: "fade", //fade, grow, swing, slide, fall
                                arrow: true,
                                arrowColor: "#F0F0F0",
                                content: linkData.tooltip,
                                delay: 200,
                                fixedWidth: 0,
                                maxWidth: 400,
                                interactive: true,
                                interactiveTolerance: 350,
                                offsetX: 0,
                                offsetY: 0,
                                onlyOne: true,
                                position: "top",
                                speed: 350,
                                timer: 0,
                                theme: ".elpsTooltip-shadow",
                                touchDevices: false,
                                trigger: "hover", //hover, click, custom
                                updateAnimation: true			
                            });
                        };
                    };
                };
            });
            
            $("#blockNav").fadeIn("slow", function(){
                $("#trashBin").remove();
            });
            
        },
        
        update: function(){
            $("#blockNav div").each(function(ix, elm) {
                if(typeof wbt.structure[ix].friendlyId!="undefined"){
                    $(elm).css("background",
                        ix==content.blockNavigation.getActiveBlockNum()
                            ? "url("+custom+"shared/images/blocks/block_"+wbt.structure[ix].friendlyId+"_active.png" + ") no-repeat"
                            : "url("+custom+"shared/images/blocks/block_"+wbt.structure[ix].friendlyId+"_inactive.png" + ") no-repeat"
                    );
                    $(elm).find("img").attr("src", custom+"shared/images/blocks/status_"+content.blockNavigation.getBlockStatus(ix)+".png");
                };
            });
        }
    }
});