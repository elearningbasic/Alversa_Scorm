if(!Array.indexOf){Array.prototype.indexOf=function(e){for(var t=0;t<this.length;t++){if(this[t]==e){return t}}return-1}}(function(e){e.fn.quizyMemoryGame=function(t){var n=e.extend({},e.fn.quizyMemoryGame.defaults,t);var r=e(this).children("ul").children("li").length;var i=new Array;var s=new Array;var o=new Array;var u="quizy-mg-item";var a="";var f=-1;var l=0;var c=0;var h=0;var p=0;var d;var v=n.openDelay;var m=n.itemWidth;var g=n.itemHeight;var y=n.itemsMargin;var b=Math.ceil(r/n.colCount);var w=function(){if(c==0)d=setInterval(C,1e3);c++;var t=e(this).attr("id");var o=parseInt(t.substring(u.length,t.length));var m=s[o];E(e(this));x(e(this),o);if(l==0){l++;a=m;f=t}else if(l==1){l=0;if(m==a){N("correct");E(e("."+m));i.push(t);i.push(f);h++;if(h==r/2){clearInterval(d);if(n.gameSummary){e("div#quizy-game-summary").children("div#gs-column2").html(p+"<br>"+n.textSummaryTime);e("div#quizy-game-summary").children("div#gs-column3").html(c+"<br>"+n.textSummaryClicks);e("div#quizy-game-summary").delay(2e3).fadeIn(1e3)}if(n.onFinishCall!=""){n.onFinishCall({clicks:c,time:p})}}}else{N("wrong");E(e("div."+u));T(e("div#"+f));T(e(this));setTimeout(function(){e("."+u).each(function(){var t=e(this).attr("id");if(i.indexOf(t)==-1){S(e(this))}})},v+n.animSpeed+250)}}};var E=function(e){e.unbind("click");e.css("cursor","default")};var S=function(e){e.bind("click",w);e.css("cursor","pointer")};var x=function(t,r){var i=t.children("div.quizy-mg-item-top").attr("id");switch(n.animType){default:case"fade":k(t,r);e("#"+i).fadeOut(n.animSpeed);break;case"flip":t.flip({direction:n.flipAnim,speed:n.animSpeed,content:t.children("div.quizy-mg-item-bottom"),color:"#777",onEnd:function(){L(t,r)}});break;case"scroll":k(t,r);e("#"+i).animate({height:"toggle",opacity:.3},n.animSpeed);break}};var T=function(t){var r=t.children("div.quizy-mg-item-top").attr("id");switch(n.animType){default:case"fade":e("#"+r).delay(v).fadeIn(n.animSpeed,function(){A(t)});break;case"flip":setTimeout(function(){t.revertFlip()},v);setTimeout(function(){A(t)},v+n.animSpeed*4);break;case"scroll":e("#"+r).delay(v).animate({height:"toggle",opacity:1},n.animSpeed,function(){A(t)});break}};var N=function(t){if(n.resultIcons){var r;var i=Math.round(v/3);if(t=="wrong"){r=e("div#quizy-mg-msgwrong")}else if(t=="correct"){r=e("div#quizy-mg-msgcorrect")}r.delay(i).fadeIn(i/2).delay(i/2).hide("explode",i/2)}};var C=function(){p++};var k=function(e,t){e.children(".quizy-mg-item-bottom").children(".mgcard-show").html(o[t])};var L=function(e,t){e.children(".mgcard-show").html(o[t])};var A=function(e){e.children(".quizy-mg-item-bottom").children(".mgcard-show").html("")};e(this).children("ul").hide();e(this).css({height:b*(g+y)+"px"});var O=Array();for(var M=0;M<r;M++){o[M]="";O.push(M)}var _=0;while(_<r){var D=Math.floor(Math.random()*O.length);var M=O[D];O.splice(D,1);var P=e(this).children("ul").children("li").eq(M);var H=(_+n.colCount)%n.colCount;var B=Math.floor(_/n.colCount);var j=H*(m+y);var F=B*(g+y);o[M]=P.html();e(this).append('<div id="'+u+M+'" class="'+u+'" style="width:'+m+"px; height:"+g+"px; left:"+j+"px; top:"+F+'px">'+'<div class="quizy-mg-item-bottom"><div class="mgcard-show">'+'</div></div><div id="quizy-mg-item-top'+M+'" class="quizy-mg-item-top" style="width:'+m+"px; height:"+g+'px;"></div></div>');_++;s[M]=P.attr("class")}e(this).children("ul").remove();if(n.resultIcons){e(this).append('<div id="quizy-mg-msgwrong"'+' class="quizy-mg-notification-fly quizy-mg-notification-fly-neg"></div>'+'<div id="quizy-mg-msgcorrect" class="quizy-mg-notification-fly '+' quizy-mg-notification-fly-pos"></div>');var I=e(this).width()/2-e("div.quizy-mg-notification-fly").width()/2;var q=e(this).height()/2-e("div.quizy-mg-notification-fly").height()/2-n.itemsMargin/2;e("div.quizy-mg-notification-fly").css({top:q+"px",left:I+"px"})}if(n.gameSummary){e(this).append('<div id="quizy-game-summary"><div id="gs-column1">'+n.textSummaryTitle+'</div><div id="gs-column2"></div>'+'<div id="gs-column3"></div></div>');var I=e(this).width()/2-e("div#quizy-game-summary").width()/2;var q=e(this).height()/2-e("div#quizy-game-summary").height()/2-n.itemsMargin/2;e("div#quizy-game-summary").css({top:q+"px",left:I+"px"});e("div#quizy-game-summary").click(function(){e(this).remove()})}e(".quizy-mg-item").click(w)};e.fn.quizyMemoryGame.defaults={itemWidth:156,itemHeight:156,itemsMargin:10,colCount:4,animType:"scroll",animSpeed:250,openDelay:2500,flipAnim:"rl",resultIcons:true,gameSummary:true,textSummaryTitle:"Your game summary",textSummaryClicks:"clicks",textSummaryTime:"seconds",onFinishCall:""}})(jQuery)