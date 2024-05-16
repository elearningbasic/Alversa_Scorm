var wbt=new Object(),
    scorm=new Object(),
    content=new Object(),
    modPanel=new Object(),
    files=new Object(),
    interactions=new Object(),
    glossary=new Object(),
    notes=new Object(),
    page=new Object(),
	mainGridSettings=new Object(),
    templates=new Object(),
    isMobile=false,
    common="",custom="";

var defaultSettings = {

    timeUntilBrowsed: 3000,
    
	masteryScores: {
        lesson: 100,
        questionnaire: 70
    },
	
	helpURL: {
		desktop: custom+"desktop/help.pdf",
		mobile: custom+"mobile/help.pdf"
	},	
	
	imprint: {
        overrideMetadata: false,
        items: [
            {
                title: {
                    de: "Herausgeber",
                    en: "Publisher"
                },
                html: {
                    de: "TÜV Rheinland Akademie GmbH<br/>Alboinstraße 56<br/>12103 Berlin",
                    en: "TÜV Rheinland Akademie GmbH<br/>Alboinstraße 56<br/>12103 Berlin"
                }
            },{
                title: {
                    de: "Copyright",
                    en: "Copyright"
                },
                html: {
                    de: "Copyright {YEAR}, TÜV Rheinland Akademie GmbH",
                    en: "Copyright {YEAR}, TÜV Rheinland Akademie GmbH"
                }
            },{
                title: {
                    de: "Rechte"
                },
                html: {
                    de: "" +
                        "Alle Rechte vorbehalten. Kein Teil des Werkes darf in irgendeiner Form " +
                        "(durch Fotokopie, Mikrofilm oder ein anderes Verfahren) ohne schriftliche Genehmigung " +
                        "des Herausgebers reproduziert oder unter Verwendung elektronischer Systeme verarbeitet, " +
                        "vervielfältigt oder verbreitet werden. Auch die Rechte der Wiedergabe durch Vortrag, " +
                        "Funk und Fernsehen sind vorbehalten. Im Fall der Zuwiderhandlung wird Strafantrag gestellt."
                }
            },{
                title: {
                    de: "Inhaltliche Verantwortung"
                },
                html: {
                    de: "" +
                        "Text, Abbildungen und Programme wurden mit größter Sorgfalt erarbeitet. " +
                        "Herausgeber, Programmierer und Autoren können jedoch für eventuell verbliebene " +
                        "fehlerhafte Angaben und deren Folgen weder eine juristische Verantwortung noch irgendeine " +
                        "Haftung übernehmen."
                }
            },{
                title: {
                    de: "Haftung für Hyperlinks"
                },
                html: {
                    de: "" +
                        "Die Produkte enthalten Verweise (so genannte Hyperlinks) auf Seiten im World Wide Web. " +
                        "Wir möchten darauf hinweisen, dass wir keinen Einfluss auf die Gestaltung sowie die " +
                        "Inhalte der gelinkten Seiten haben. Deshalb distanzieren wir uns hiermit ausdrücklich " +
                        "von allen Inhalten der Seiten, auf die aus unseren Produkten (insbesondere Lerninhalten) " +
                        "verwiesen wird. Diese Erklärung gilt für alle in den Produkten (Lerninhalten) " +
                        "ausgebrachten Links und für alle Inhalte der Seiten, zu denen Links oder Banner führen."
                }
            }
        ]
    }	
};
    
//base64

(function(global){"use strict";var _Base64=global.Base64;var version="2.1.9";var buffer;if(typeof module!=="undefined"&&module.exports){try{buffer=require("buffer").Buffer}catch(err){}}var b64chars="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";var b64tab=function(bin){var t={};for(var i=0,l=bin.length;i<l;i++)t[bin.charAt(i)]=i;return t}(b64chars);var fromCharCode=String.fromCharCode;var cb_utob=function(c){if(c.length<2){var cc=c.charCodeAt(0);return cc<128?c:cc<2048?fromCharCode(192|cc>>>6)+fromCharCode(128|cc&63):fromCharCode(224|cc>>>12&15)+fromCharCode(128|cc>>>6&63)+fromCharCode(128|cc&63)}else{var cc=65536+(c.charCodeAt(0)-55296)*1024+(c.charCodeAt(1)-56320);return fromCharCode(240|cc>>>18&7)+fromCharCode(128|cc>>>12&63)+fromCharCode(128|cc>>>6&63)+fromCharCode(128|cc&63)}};var re_utob=/[\uD800-\uDBFF][\uDC00-\uDFFFF]|[^\x00-\x7F]/g;var utob=function(u){return u.replace(re_utob,cb_utob)};var cb_encode=function(ccc){var padlen=[0,2,1][ccc.length%3],ord=ccc.charCodeAt(0)<<16|(ccc.length>1?ccc.charCodeAt(1):0)<<8|(ccc.length>2?ccc.charCodeAt(2):0),chars=[b64chars.charAt(ord>>>18),b64chars.charAt(ord>>>12&63),padlen>=2?"=":b64chars.charAt(ord>>>6&63),padlen>=1?"=":b64chars.charAt(ord&63)];return chars.join("")};var btoa=global.btoa?function(b){return global.btoa(b)}:function(b){return b.replace(/[\s\S]{1,3}/g,cb_encode)};var _encode=buffer?function(u){return(u.constructor===buffer.constructor?u:new buffer(u)).toString("base64")}:function(u){return btoa(utob(u))};var encode=function(u,urisafe){return!urisafe?_encode(String(u)):_encode(String(u)).replace(/[+\/]/g,function(m0){return m0=="+"?"-":"_"}).replace(/=/g,"")};var encodeURI=function(u){return encode(u,true)};var re_btou=new RegExp(["[À-ß][-¿]","[à-ï][-¿]{2}","[ð-÷][-¿]{3}"].join("|"),"g");var cb_btou=function(cccc){switch(cccc.length){case 4:var cp=(7&cccc.charCodeAt(0))<<18|(63&cccc.charCodeAt(1))<<12|(63&cccc.charCodeAt(2))<<6|63&cccc.charCodeAt(3),offset=cp-65536;return fromCharCode((offset>>>10)+55296)+fromCharCode((offset&1023)+56320);case 3:return fromCharCode((15&cccc.charCodeAt(0))<<12|(63&cccc.charCodeAt(1))<<6|63&cccc.charCodeAt(2));default:return fromCharCode((31&cccc.charCodeAt(0))<<6|63&cccc.charCodeAt(1))}};var btou=function(b){return b.replace(re_btou,cb_btou)};var cb_decode=function(cccc){var len=cccc.length,padlen=len%4,n=(len>0?b64tab[cccc.charAt(0)]<<18:0)|(len>1?b64tab[cccc.charAt(1)]<<12:0)|(len>2?b64tab[cccc.charAt(2)]<<6:0)|(len>3?b64tab[cccc.charAt(3)]:0),chars=[fromCharCode(n>>>16),fromCharCode(n>>>8&255),fromCharCode(n&255)];chars.length-=[0,0,2,1][padlen];return chars.join("")};var atob=global.atob?function(a){return global.atob(a)}:function(a){return a.replace(/[\s\S]{1,4}/g,cb_decode)};var _decode=buffer?function(a){return(a.constructor===buffer.constructor?a:new buffer(a,"base64")).toString()}:function(a){return btou(atob(a))};var decode=function(a){return _decode(String(a).replace(/[-_]/g,function(m0){return m0=="-"?"+":"/"}).replace(/[^A-Za-z0-9\+\/]/g,""))};var noConflict=function(){var Base64=global.Base64;global.Base64=_Base64;return Base64};global.Base64={VERSION:version,atob:atob,btoa:btoa,fromBase64:decode,toBase64:encode,utob:utob,encode:encode,encodeURI:encodeURI,btou:btou,decode:decode,noConflict:noConflict};if(typeof Object.defineProperty==="function"){var noEnum=function(v){return{value:v,enumerable:false,writable:true,configurable:true}};global.Base64.extendString=function(){Object.defineProperty(String.prototype,"fromBase64",noEnum(function(){return decode(this)}));Object.defineProperty(String.prototype,"toBase64",noEnum(function(urisafe){return encode(this,urisafe)}));Object.defineProperty(String.prototype,"toBase64URI",noEnum(function(){return encode(this,true)}))}}if(global["Meteor"]){Base64=global.Base64}})(this);

function encodeBase64(str,t) {
	if(typeof str!="string")return str;
	return Base64.encode(str);
};

function decodeBase64(str) {
   return Base64.decode(str);
};

/*yepnope1.5.x|WTFPL*/
(function(a,b,c){function d(a){return"[object Function]"==o.call(a)}function e(a){return"string"==typeof a}function f(){}function g(a){return!a||"loaded"==a||"complete"==a||"uninitialized"==a}function h(){var a=p.shift();q=1,a?a.t?m(function(){("c"==a.t?B.injectCss:B.injectJs)(a.s,0,a.a,a.x,a.e,1)},0):(a(),h()):q=0}function i(a,c,d,e,f,i,j){function k(b){if(!o&&g(l.readyState)&&(u.r=o=1,!q&&h(),l.onload=l.onreadystatechange=null,b)){"img"!=a&&m(function(){t.removeChild(l)},50);for(var d in y[c])y[c].hasOwnProperty(d)&&y[c][d].onload()}}var j=j||B.errorTimeout,l=b.createElement(a),o=0,r=0,u={t:d,s:c,e:f,a:i,x:j};1===y[c]&&(r=1,y[c]=[]),"object"==a?l.data=c:(l.src=c,l.type=a),l.width=l.height="0",l.onerror=l.onload=l.onreadystatechange=function(){k.call(this,r)},p.splice(e,0,u),"img"!=a&&(r||2===y[c]?(t.insertBefore(l,s?null:n),m(k,j)):y[c].push(l))}function j(a,b,c,d,f){return q=0,b=b||"j",e(a)?i("c"==b?v:u,a,b,this.i++,c,d,f):(p.splice(this.i++,0,a),1==p.length&&h()),this}function k(){var a=B;return a.loader={load:j,i:0},a}var l=b.documentElement,m=a.setTimeout,n=b.getElementsByTagName("script")[0],o={}.toString,p=[],q=0,r="MozAppearance"in l.style,s=r&&!!b.createRange().compareNode,t=s?l:n.parentNode,l=a.opera&&"[object Opera]"==o.call(a.opera),l=!!b.attachEvent&&!l,u=r?"object":l?"script":"img",v=l?"script":u,w=Array.isArray||function(a){return"[object Array]"==o.call(a)},x=[],y={},z={timeout:function(a,b){return b.length&&(a.timeout=b[0]),a}},A,B;B=function(a){function b(a){var a=a.split("!"),b=x.length,c=a.pop(),d=a.length,c={url:c,origUrl:c,prefixes:a},e,f,g;for(f=0;f<d;f++)g=a[f].split("="),(e=z[g.shift()])&&(c=e(c,g));for(f=0;f<b;f++)c=x[f](c);return c}function g(a,e,f,g,h){var i=b(a),j=i.autoCallback;i.url.split(".").pop().split("?").shift(),i.bypass||(e&&(e=d(e)?e:e[a]||e[g]||e[a.split("/").pop().split("?")[0]]),i.instead?i.instead(a,e,f,g,h):(y[i.url]?i.noexec=!0:y[i.url]=1,f.load(i.url,i.forceCSS||!i.forceJS&&"css"==i.url.split(".").pop().split("?").shift()?"c":c,i.noexec,i.attrs,i.timeout),(d(e)||d(j))&&f.load(function(){k(),e&&e(i.origUrl,h,g),j&&j(i.origUrl,h,g),y[i.url]=2})))}function h(a,b){function c(a,c){if(a){if(e(a))c||(j=function(){var a=[].slice.call(arguments);k.apply(this,a),l()}),g(a,j,b,0,h);else if(Object(a)===a)for(n in m=function(){var b=0,c;for(c in a)a.hasOwnProperty(c)&&b++;return b}(),a)a.hasOwnProperty(n)&&(!c&&!--m&&(d(j)?j=function(){var a=[].slice.call(arguments);k.apply(this,a),l()}:j[n]=function(a){return function(){var b=[].slice.call(arguments);a&&a.apply(this,b),l()}}(k[n])),g(a[n],j,b,n,h))}else!c&&l()}var h=!!a.test,i=a.load||a.both,j=a.callback||f,k=j,l=a.complete||f,m,n;c(h?a.yep:a.nope,!!i),i&&c(i)}var i,j,l=this.yepnope.loader;if(e(a))g(a,0,l,0);else if(w(a))for(i=0;i<a.length;i++)j=a[i],e(j)?g(j,0,l,0):w(j)?B(j):Object(j)===j&&h(j,l);else Object(a)===a&&h(a,l)},B.addPrefix=function(a,b){z[a]=b},B.addFilter=function(a){x.push(a)},B.errorTimeout=1e4,null==b.readyState&&b.addEventListener&&(b.readyState="loading",b.addEventListener("DOMContentLoaded",A=function(){b.removeEventListener("DOMContentLoaded",A,0),b.readyState="complete"},0)),a.yepnope=k(),a.yepnope.executeStack=h,a.yepnope.injectJs=function(a,c,d,e,i,j){var k=b.createElement("script"),l,o,e=e||B.errorTimeout;k.src=a;for(o in d)k.setAttribute(o,d[o]);c=j?h:c||f,k.onreadystatechange=k.onload=function(){!l&&g(k.readyState)&&(l=1,c(),k.onload=k.onreadystatechange=null)},m(function(){l||(l=1,c(1))},e),i?k.onload():n.parentNode.insertBefore(k,n)},a.yepnope.injectCss=function(a,c,d,e,g,i){var e=b.createElement("link"),j,c=i?h:c||f;e.href=a,e.rel="stylesheet",e.type="text/css";for(j in d)e.setAttribute(j,d[j]);g||(n.parentNode.insertBefore(e,n),m(c,0))}})(this,document);

(function () {
    var user_agent=window.navigator.userAgent.toLowerCase();
    window.device={};

    device.ios=function(){
        return device.iphone() || device.ipod() || device.ipad();
    };

    device.iphone=function(){
        return find("iphone");
    };

    device.ipod=function(){
        return find("ipod");
    };

    device.ipad=function(){
        return find("ipad");
    };

    device.android=function(){
        return find("android");
    };

    device.androidPhone=function(){
        return device.android() && find("mobile");
    };

    device.androidTablet=function(){
        return device.android() && !find("mobile");
    };

    device.blackberry=function(){
        return find("blackberry") || find("bb10") || find("rim");
    };

    device.blackberryPhone=function(){
        return device.blackberry() && !find("tablet");
    };

    device.blackberryTablet=function(){
        return device.blackberry() && find("tablet");
    };

    device.windows=function(){
        return find("windows");
    };

    device.windowsPhone=function(){
        return device.windows() && find("phone");
    };

    device.windowsTablet=function(){
        return device.windows() && find("touch");
    };

    device.fxos=function(){
        return find("(mobile; rv:") || find("(tablet; rv:");
    };

    device.fxosPhone=function(){
        return device.fxos() && find("mobile");
    };

    device.fxosTablet=function(){
        return device.fxos() && find("tablet");
    };

    device.mobile=function(){
        return device.androidPhone() || device.iphone() || device.ipod() || device.windowsPhone() || device.blackberryPhone() || device.fxosPhone();
    };

    device.tablet=function(){
        return device.ipad() || device.androidTablet() || device.blackberryTablet() || device.windowsTablet() || device.fxosTablet();
    };

    find = function (needle) {
        return user_agent.indexOf(needle) !== -1;
    };    
    
    yepnope(
		[
			{
				load: "js/data.js",
				callback: function (url,result,key) {
					var search = location.search.substring(1), params={};
					isMobile=device.mobile() || device.tablet();
				  
					if(search!=""){
						try{
							params=JSON.parse('{"' + decodeURI(search.replace(/&/g, "\",\"").replace(/=/g,"\":\"")) + '"}');
						}catch(e){
							if(search=="m")isMobile=true;
						}
					}
		
					var style=wbt.metadata.customName;            
					if(typeof params.style!="undefined"){
						style=params.style;
					}           
								
					if(typeof params.runtime!="undefined"){
						if(params.runtime=="mobile"){
							isMobile=true;
						}else if(params.runtime=="desktop"){
							isMobile=false;
						}
					}
					
					var version="4-1";
					if(typeof params.version!="undefined"){
						version=params.version;
					}
					
					common="../runtime/common/"+version+"/"; 
					custom="../runtime/custom/"+version+"/"+style+"/";
					
					var arr=location.pathname.split("/");
					for(var i=0; i<arr.length; i++){
						if(arr[i].indexOf("elps")>-1){
							common="../../../runtime/common/"+version+"/"; 
							custom="../../../runtime/custom/"+version+"/"+style+"/";
						}
					}
                    
                    switch (wbt.metadata.language) {
                        case "_de":
                        case "_en":
                            break;
                        default:
                            wbt.metadata.language="_en";
                    }
					
					var arrMobile = [
						common+"lib/jquery.mobile.css",
						custom+"mobile/css/elps.mobile.mediaplayer.css",
						custom+"mobile/css/elps.mobile.css",
						common+"lib/jquery.js",
						common+"lib/jquery.plugin.default.jplayer.js",
						common+"lib/jquery.plugin.default.jstorage.js",
						common+"lib/jquery.plugin.default.pulsate.js",
						common+"lib/jquery.plugin.default.touchpunch.js",
						common+"mobile/elps.mobile.init.js",
						common+"lib/jquery.mobile.js",
						common+"shared/elps.languages.js",
						common+"shared/elps.checkboxradio.js",				
						common+"shared/elps.helpers.js",
						common+"mobile/elps.mobile.runtime.js",
						common+"mobile/elps.mobile.templates.js",
						common+"lib/jquery.plugin.ondemand.maphilight.js",
						common+"lib/jquery.plugin.ondemand.cycle.lite.js",
						common+"lib/jquery.plugin.ondemand.jsmovie.js",
						common+"shared/elps.scorm.js",
						custom+"user.js"
					];
					
					var arrDesktop = [
						custom+"desktop/css/elps.desktop.mediaplayer.css",
						custom+"desktop/css/elps.desktop.css",
						common+"lib/jquery.js",
						common+"lib/jquery.plugin.default.jplayer.js",
						common+"lib/jquery.plugin.default.blockui.js",
						common+"lib/jquery.plugin.default.hotkeys.js",
						common+"lib/jquery.plugin.default.jstorage.js",
						common+"lib/jquery.plugin.default.console.js",
						common+"lib/jquery.plugin.default.pulsate.js",
						common+"shared/elps.checkboxradio.js",
						common+"shared/elps.languages.js",
						common+"shared/elps.helpers.js",
						common+"desktop/elps.desktop.runtime.js",
						common+"desktop/elps.desktop.moderationpanel.js",
						common+"desktop/elps.desktop.tooltip.js",
						common+"desktop/elps.desktop.splitter.js",
						common+"desktop/elps.desktop.overlay.js",
						common+"desktop/elps.desktop.topnotifier.js",
						common+"desktop/elps.desktop.templates.js",						
						common+"lib/jquery.plugin.ondemand.maphilight.js",
						common+"lib/jquery.plugin.ondemand.cycle.lite.js",
						common+"lib/jquery.plugin.ondemand.jsmovie.js",						
						common+"shared/elps.scorm.js",
						custom+"user.js"
					];
        
                    isMobile=false;  

					yepnope([{
						test: isMobile,
						yep: arrMobile,
						nope: arrDesktop,
						complete: function(){
							onloadActions();
						}                
					}]); 
				}
			}
		]
	);
}).call(this);