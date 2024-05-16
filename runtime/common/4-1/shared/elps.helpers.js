var base64Matcher = new RegExp("^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=|[A-Za-z0-9+/]{4})$");
//call: base64Matcher.test(b64string) returns true/false

function numsort(a, b){
	return parseInt(a)-parseInt(b);
}

function isEmpty(obj) {
    if (obj == null) return true;
    if (obj.length && obj.length > 0)    return false;
    if (obj.length === 0)  return true;
    for (var key in obj) {
        if (hasOwnProperty.call(obj, key)) return false;
    }
    return true;
}

function executeFunctionByName(functionName, context) {
  var args = Array.prototype.slice.call(arguments).splice(2);
  var namespaces = functionName.split(".");
  var func = namespaces.pop();
  for(var i = 0; i < namespaces.length; i++) {
    context = context[namespaces[i]];
  }
  return context[func].apply(this, args);
}

(function($) {
  $.randomize = function(arr) {
    for(var j, x, i = arr.length; i; j = parseInt(Math.random() * i), x = arr[--i], arr[i] = arr[j], arr[j] = x);
    return arr;
  };
})(jQuery);

(function($){
	$.fn.extend({
		center: function () {
			return this.each(function() {
				var top = ($(window).height() - $(this).outerHeight()) / 2;
				var left = ($(window).width() - $(this).outerWidth()) / 2;
				$(this).css({position:"absolute", margin:0, top: (top > 0 ? top : 0)+"px", left: (left > 0 ? left : 0)+"px"});
			});
		}
	});
})(jQuery);

function replaceString(str,searchFor,replaceWith) {
  var i = str.indexOf(searchFor);
  while ( i!=-1 ) {
    var j = i+searchFor.length;
    str = str.substring(0,i)+replaceWith+str.substring(j,str.length);
    i = str.indexOf(searchFor,i+replaceWith.length);
  }
  return str;
}

function getProtocol(url){
	return url.substring(0,url.indexOf(":"));
}

function round(number,decPlace){
	decPlace = (!decPlace ? 2 : decPlace);
	return Math.round(number * Math.pow(10,decPlace)) / Math.pow(10,decPlace);
}

function killMeById(objId){
	var node = document.getElementById(objId);
	if(node)node.parentNode.removeChild(node);
}

function toggleDisplayById(objId){
	var node = document.getElementById(objId);
	if(node){
		switch(node.style.display){
			case "none":
				node.style.display="block";
				break;
			default:
				node.style.display="none";
				break;
		}
	}
}

Array.prototype.inArray=function(value){
	for(var i=0;i<this.length;i++) {
		if(this[i]===value)return true;
	}
	return false;
};

Array.prototype.search=function(value,strict){
    if(typeof value=="undefined"){
        return false;
    }
    var retVal=false;
    if(strict){
        for(key in this){
            if(this[key] === value ) {
                retVal=key;
                break;
            }
        }
    }else{
        for(key in this){
            if(this[key]==value){
                retVal=key;
                break;
            }
        }
    }
    return retVal;
}

function isNumeric(input){
	return (input-0)==input && input.length>0;
}

function getUnixTimestamp(){
	return Math.floor(new Date().getTime()/1000);
}

function urlDecode(str){
    str=str.replace(new RegExp('\\+','g'),' ');
    return unescape(str);
}
function urlEncode(str){
    str=escape(str);
    str=str.replace(new RegExp('\\+','g'),'%2B');
    return str.replace(new RegExp('%20','g'),'+');
}

function getJsonObjects(obj, key, val, drillDown) {
	var objects = [];
	for (var i in obj) {
		if (!obj.hasOwnProperty(i)) continue;
		if (typeof obj[i] == "object") {
			if(drillDown){
				objects = objects.concat(getJsonObjects(obj[i], key, val, drillDown));
			}else{
				objects.push(obj);
			}
		} else if (i == key ) {// && obj[key] == val) {
			objects.push(obj);
		}
	}
	return objects;
}

function getAbsolutePath(relUrl){
    if(relUrl.search(/^https?:\/\//)>-1)return relUrl;
    var loc = location.href;	
    loc = loc.substring(0, loc.lastIndexOf("/"));
    while (/^\.\./.test(relUrl)){
        loc = loc.substring(0, loc.lastIndexOf("/"));
        relUrl= relUrl.substring(3);
    }
    return loc + "/" + relUrl;
}

function scaleImagemap(initializeMap, html, isWidth, unscaledWidth){
	if(unscaledWidth==0)return html;
	var newHtml="";
	var scaleBy=(isWidth/unscaledWidth).toFixed(2);
	var areas=html.split(">");
	for(var i=0;i<areas.length-1;i++){
		var attribs=areas[i].split(" ");
		for(var j=0;j<attribs.length;j++){
			if(attribs[j].indexOf(initializeMap?"coords":"cooini")!=-1){
				newHtml+='coords="';
				var coords=attribs[j].substring(8,attribs[j].length-1).split(",");
				for(var k=0;k<coords.length;k++){
					newHtml+=Math.round(parseInt(coords[k])*scaleBy);
					if(k<coords.length-1)newHtml+=",";
				}
				newHtml+='"';
				newHtml+=' cooini="'+coords+'"';
			}else if(attribs[j]=="\r\n" || attribs[j]=="/"){
				newHtml+="";
			}else{
				if(attribs[j].indexOf("coords")==-1)newHtml+=attribs[j]+" ";
			}
		}
		newHtml+=">";
	}
	return newHtml;	
}

/* IE8 helpers */
'use strict';

// Add ECMA262-5 method binding if not supported natively
//
if (!('bind' in Function.prototype)) {
    Function.prototype.bind = function(owner) {
        var that = this;
        if (arguments.length <= 1) {
            return function() {
                return that.apply(owner, arguments);
            };
        } else {
            var args = Array.prototype.slice.call(arguments, 1);
            return function() {
                return that.apply(owner, arguments.length === 0 ? args : args.concat(Array.prototype.slice.call(arguments)));
            };
        }
    };
}

// Add ECMA262-5 string trim if not supported natively
//
if (!('trim' in String.prototype)) {
    String.prototype.trim = function() {
        return this.replace(/^\s+/, '').replace(/\s+$/, '');
    };
}

// Add ECMA262-5 Array methods if not supported natively
//
if (!('indexOf' in Array.prototype)) {
    Array.prototype.indexOf = function(find, i /*opt*/ ) {
        if (i === undefined) i = 0;
        if (i < 0) i += this.length;
        if (i < 0) i = 0;
        for (var n = this.length; i < n; i++)
            if (i in this && this[i] === find)
                return i;
        return -1;
    };
}
if (!('lastIndexOf' in Array.prototype)) {
    Array.prototype.lastIndexOf = function(find, i /*opt*/ ) {
        if (i === undefined) i = this.length - 1;
        if (i < 0) i += this.length;
        if (i > this.length - 1) i = this.length - 1;
        for (i++; i-- > 0;) /* i++ because from-argument is sadly inclusive */
            if (i in this && this[i] === find)
                return i;
        return -1;
    };
}
if (!('forEach' in Array.prototype)) {
    Array.prototype.forEach = function(action, that /*opt*/ ) {
        for (var i = 0, n = this.length; i < n; i++)
            if (i in this)
                action.call(that, this[i], i, this);
    };
}
if (!('map' in Array.prototype)) {
    Array.prototype.map = function(mapper, that /*opt*/ ) {
        var other = new Array(this.length);
        for (var i = 0, n = this.length; i < n; i++)
            if (i in this)
                other[i] = mapper.call(that, this[i], i, this);
        return other;
    };
}
if (!('filter' in Array.prototype)) {
    Array.prototype.filter = function(filter, that /*opt*/ ) {
        var other = [],
            v;
        for (var i = 0, n = this.length; i < n; i++)
            if (i in this && filter.call(that, v = this[i], i, this))
                other.push(v);
        return other;
    };
}
if (!('every' in Array.prototype)) {
    Array.prototype.every = function(tester, that /*opt*/ ) {
        for (var i = 0, n = this.length; i < n; i++)
            if (i in this && !tester.call(that, this[i], i, this))
                return false;
        return true;
    };
}
if (!('some' in Array.prototype)) {
    Array.prototype.some = function(tester, that /*opt*/ ) {
        for (var i = 0, n = this.length; i < n; i++)
            if (i in this && tester.call(that, this[i], i, this))
                return true;
        return false;
    };
}