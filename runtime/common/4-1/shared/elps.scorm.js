$.extend(scorm, {

    init: function () {
        this.windowMode = "self";
        this.score = 0;
        this.lessonStatus = "incomplete";
        this.resumePageId = "";
        this.scoVersion = "";
        this.scoAPI = this.getAPI();
        this.sessionData = new Object();
        this.sessionEnded = false;
        this.unit=new Object();
        
        //if masteryScore present in data.js -> use this value
        if($.isNumeric(wbt.metadata.masteryScore)){
            this.masteryScore = parseInt(wbt.metadata.masteryScore)
        }else{
            this.masteryScore = 80;
        }
        
        if (this.scoAPI) {

            this.getWindowMode();

            $(window).unload(function () {
                scorm.exitSession();
            });

            if(this.scoVersion == "scormCon"){
                var units = this.scoAPI.courseData[0].units;
                for(var i=0;i<units.length;i++){
                    if(units[i].id==wbt.metadata.id){
                        this.unit = units[i];
                    }
                };
            };

            if (this.fetchSessionData()) {
                //sessiondata available -> set results for interactions
                $.each(wbt.structure, function(i,block){
                    $.each(block.items, function(j, page){
                        $.each(page.steps, function(k, step){
                            if(typeof step.interaction=="object"){
                                var interaction=step.interaction[0];
                                if(interaction.status=="not attempted"){
                                    switch(page.status){
                                        case "passed":
                                            page.score=page.maxScore;
                                            interaction.status=page.status;
                                            interaction.blocked=true;
                                            interaction.score=interaction.maxScore;
                                            break;
                                        case "failed":
                                            page.score=9;
                                            interaction.status=page.status;
                                            interaction.blocked=true;
                                            interaction.score=0;
                                            break;
                                    };
                                };
                            };
                        });
                    });
                });
            };
        };
        this.fetchPreferences();
        this.setLogonTime();
    },

    getAPI: function () {
        try {

            var oAPI = null;
        
            //check for scorm connector
            if (typeof window.dialogArguments == "object") {
                if (typeof window.dialogArguments.courseData == "object") {
                    this.scoVersion = "scormCon";
                    oAPI = window.dialogArguments;
                    return oAPI;
                }
            }
            
            if(window.opener){
                if (typeof window.opener.courseData == "object") {
                    this.scoVersion = "scormCon";
                    oAPI = window.opener;
                    return oAPI;
                }
            }
           
            if ((window.parent) && (window.parent != window)){
                if (typeof window.parent.courseData == "object") {
                    this.scoVersion = "scormCon";
                    oAPI = window.parent;
                    return oAPI;
                }
            }

            //check for lms scorm api            
            //...in the parent window
            if ((window.parent) && (window.parent != window)) {
                oAPI = this.findAPI(window.parent);
            };
            
            //...in the opener window
            if ((oAPI == null) && (window.opener != null)) {
                oAPI = this.findAPI(window.opener);
            };
            
            //...on top
            if ((oAPI == null) && (top != null)) {
                oAPI = this.findAPI(top);
            };
            
            //...in frames of the parent window
            if (oAPI == null) {
                
                this.oFrame = "top";
                this.frX;
                this.frY = [];
                this.frY[0] = 0;
                this.frLevel = 0;                
                
                while (this.oFrame != "") {
                    this.frX = eval(this.oFrame);
                    oAPI = this.parseFrames();
                    if (oAPI != null) return oAPI;
                }
            }
            
            //...in frames of the opener window
            if (oAPI == null) {
                
                this.oFrame = "window.opener.top";
                this.frX;
                this.frY = [];
                this.frY[0] = 0;
                this.frLevel = 0;

                while (this.oFrame != "") {
                    this.frX = eval(this.oFrame);
                    oAPI = this.parseFrames();
                    if (oAPI != null) return oAPI;
                }
            }
            
            return oAPI;
        } catch (e) {
            return null;
        }
    },

    findAPI: function (win) {
        
        if (typeof (win.API_1484_11) == "object"){
            if (win.API_1484_11 != null) {
                this.scoVersion = "scorm2004";
                return win.API_1484_11;
            }
        };
        
        if (typeof (win.API) == "object"){
            if (win.API != null) {
                this.scoVersion = "scorm12";
                return win.API;
            }
        };
        
        return null;
    },

    parseFrames: function () {
        for (var i = this.frY[this.frLevel]; i < this.frX.length; i++) {
            switch (true) {
            case (typeof (this.frX.frames[i].API_1484_11) != "undefined"):
                this.scoVersion = "scorm2004";
                return this.frX.frames[i].API_1484_11;
            case (typeof (this.frX.frames[i].API) != "undefined"):
                this.scoVersion = "scorm12";
                return this.frX.frames[i].API;
            }

            if (this.frX.frames[i].length > 0) {
                this.oFrame = this.oFrame + ".frames[" + i + "]";
                this.frY[this.frLevel] = i + 1;
                this.frLevel++;
                this.frY[this.frLevel] = 0;
                return null;
            }
        }
        this.oFrame = this.oFrame.substring(0, this.oFrame.lastIndexOf("."));
        if (this.frLevel == 0) this.oFrame == "";
        this.frLevel--;
        return null;
    },

    getWindowMode: function () {
        if (top.frames.length > 1) {
            this.windowMode = "popup";
        };

        if (top.frames.length == 1) {
            if ($("#introFrame").length == 0) {
                this.windowMode = "popup";
            };
        };

        if (this.scoVersion == "scormCon") {
            this.windowMode = "self";
        };
    },

    fetchSessionData: function () {

        if (this.doScormCommand("lmsInitialize") == "true") {

      
            //overwrite masteryScore with value delivered from lms, if available
            var msLms = this.doScormCommand("lmsGetValue", "masteryScore");
            if (parseInt(msLms) > 0) this.masteryScore = parseInt(msLms);

            var ls = this.doScormCommand("lmsGetValue", "lessonStatus");
            this.lessonStatus = ls == "null" ? "incomplete" : ls;
            var suspendData = this.doScormCommand("lmsGetValue", "suspendData");
            if (suspendData != null && suspendData != "undefined" && suspendData != "" && suspendData != "false" && suspendData != "e30=") { //"e30=" = {}
                this.parseSessionData(suspendData);
                return true;
            } else {
                return false;
            }
        } else {
            this.scoAPI = null;
            return false;
        }
    },

    setLogonTime: function () {
        var now = new Date();
        var minutes = ((now.getMinutes() < 10) ? "0" : "") + now.getMinutes();
        var seconds = ((now.getSeconds() < 10) ? "0" : "") + now.getSeconds();
        this.logonTime = now.getHours() + ":" + minutes + ":" + seconds;
    },

    parseSessionData: function (data) {
        data = decodeBase64(data);
        this.sessionData = JSON.parse(data);
        
        for (var item in this.sessionData) {
            if (typeof (this.sessionData[item]) == "object") {
                var oldId=content.activePage.id;
                if(isMobile){
                    content.setActivePageById(item);
                }else{
                    content.getPageById(item); //set active page
                };
                
                if(content.activePage.id!=oldId){
                    for (var prop in this.sessionData[item]) {
                        var val = (this.sessionData[item][prop] == "true" || this.sessionData[item][prop] == "false" || this.sessionData[item][prop] == true || this.sessionData[item][prop] == false)
                            ? eval(this.sessionData[item][prop])
                            : this.sessionData[item][prop];

                        if (typeof content.activePage == "object") {
                            
                            content.activePage[prop] = val;
                            if (prop == "isCurrent") {
                                if (this.sessionData[item][prop] == true) {
                                    this.resumePageId = item;
                                } else {
                                    delete this.sessionData[item].isCurrent
                                }
                            }
                        }
                    }                    
                };
            }
        }
    },
    
    parseTestData: function () {
        var retVal={};
        for (var item in this.sessionData) {
            if (typeof (this.sessionData[item]) == "object") {
                switch(item){
                    case "result_p":
                        for (var prop in this.sessionData[item]) {
                            retVal[prop] = (this.sessionData[item][prop] == "true" || this.sessionData[item][prop] == "false" || this.sessionData[item][prop] == true || this.sessionData[item][prop] == false)
                                ? eval(this.sessionData[item][prop])
                                : this.sessionData[item][prop];
                        };
                        break;
                    default:
                        break;
                };
            }
        };
        
        return retVal;
    },

    updateSessionData: function (pId, args) {
        
        if (typeof interactions.updateProgress != "undefined"){
            interactions.updateProgress();
        };
        
        if (typeof interactions.blockTest != "undefined"){
            interactions.updateProgress();
        };  
        
        if (typeof this.sessionData[pId] == "undefined") {
            this.sessionData[pId] = new Object();
        };

        for (var arg in args) {
            if (args.hasOwnProperty(arg)) {
                if (arg == "isCurrent") {
                    for (var item in this.sessionData) {
                        if (typeof (this.sessionData[item]) == "object") {
                            if (this.sessionData[item]["isCurrent"] == true) {
                                delete this.sessionData[item]["isCurrent"];
                            }
                        }
                    }
                };
                
                if (arg == "bookmark") {
                    for (var item in this.sessionData) {
                        if (typeof (this.sessionData[item]) == "object") {
                            if (this.sessionData[item]["bookmark"] == 0) {
                                delete this.sessionData[item]["bookmark"];
                            }
                        }
                    }
                };
            };
            this.sessionData[pId][arg] = args[arg];
        };

        $.each(this.sessionData, function(i,item){
            if($.isEmptyObject(item)){
                delete scorm.sessionData[item]
            }
        });
 
        if(typeof wbt.metadata.resourceType!="undefined"){
            switch (wbt.metadata.resourceType){
                case "profiling":
                case "distributedAssessment":
                case "distributedSelfTest":
                    break;
                default:
                    this.score=this.getScorePercent();
                    break;
            }
        }else{
            this.score=this.getScorePercent();
        };
        
        this.updateLessonStatus();
    },

    pushSessionData: function () {
        if (this.scoAPI) {
            
            this.doScormCommand("lmsSetScore",this.score);
            this.doScormCommand("lmsSetStatus", this.lessonStatus);
            
            if (this.sessionData != "") {                
                var s = encodeBase64(JSON.stringify(this.sessionData));
                    s = s.replace(/(\r\n|\n|\r)/gm,"");
                    
                if(typeof wbt.metadata.resourceType!="undefined"){
                    switch (wbt.metadata.resourceType){
                        case "profiling":
                        case "distributedAssessment":
                        case "distributedSelfTest":
                            s="";
                            break;
                        default:
                            break;
                    }            
                };
                
                if(s!=""){
                    switch (this.scoVersion) {
                        case "scorm2004":
                            if (s.length > 64000) {
                                if (!isMobile) $("#logger").log("suspendData may be too long: " + s.length);
                            };
                            break;
                        case "scorm12":
                            if (s.length > 4000) {
                                if (!isMobile) $("#logger").log("suspendData may be too long: " + s.length);
                            };
                            break;
                        }
                    this.doScormCommand("lmsSetSuspendData", s);
                };
            };
            this.doScormCommand("lmsCommit");
        }
    },

    exitSession: function () {

        if(this.sessionEnded)return;
        this.sessionEnded=true;
        if (this.scoAPI) {

            this.pushPreferences();
            
            this.doScormCommand("lmsSetSessionTime", "00" + this.getSessionTime() + ".0");
            
            if (this.lessonStatus == "completed" || this.lessonStatus == "passed" || this.lessonStatus == "failed") {
                this.doScormCommand("lmsExit", "logout");
            } else {
                this.doScormCommand("lmsExit", "suspend");
            };

            this.doScormCommand("lmsCommit");
            if (this.doScormCommand("lmsExitAU") == "true") {
                //go
            } else {
                //no-go
                try {
                    //console.log(this.doScormCommand("lmsGetErrorString")+" - "+this.doScormCommand("lmsGetLastError"));
                } catch (e) {}
            }

            this.scoAPI = null;

            try {
                if (this.windowMode == "popup") {
                    //parent.close(); works everywhere but not with sitos 
                    top.close();
                } else {
                    if(this.scoVersion!="scormCon"){
                        self.close();
                    }
                }
            } catch (e) {}
        } else {

            try {
                top.close();
            } catch (e) {}
        }
    },
    
    getExitConfirmation: function(){
        var html="";
        if(this.scoVersion=="scormCon") {
            if(typeof this.unit.timing != "undefined" && (this.unit.status=="passed" || this.unit.status=="completed")){
                if(this.unit.timing.minimal > 0){
                    var totalTimeSpent=0;
                    for(var i=0; i<this.unit.timing.actual.length; i++){
                        totalTimeSpent+=parseInt(this.unit.timing.actual[i]);
                    }
                    if(totalTimeSpent < this.unit.timing.minimal){
                        html += "<p>" +
                            eval("exitToofastMessage" + wbt.metadata.language)
                                .replace(/{TYPICAL}/g, this.unit.timing.typical)
                                .replace(/{ACTUAL}/g, totalTimeSpent) +
                            "</p>";                            
                    }  
                }
            }
        };
        
        html += eval("exitConfirmationMessage" + wbt.metadata.language);
        return html;
    },

    setDefaultPreferences: function () {
        this.preferences = [{
            id: "desktop",
            audioEnabled: true,
            audioVolume: 0.8,
            showModeration: false,
            dyna: "toc",
            sidebar: "hidden",
            splitterPos: 280
        }, {
            id: "mobile",
            tocPanelPref: "closed",
            audioEnabled: true,
            audioVolume: 0.8
        }]
    },

    fetchPreferences: function () {
        this.setDefaultPreferences();
        if (this.scoAPI) {
            var s = this.doScormCommand("lmsGetValue", "lessonLocation");
            if (s == "") return;
            s = decodeBase64(s);
            try {
                this.preferences = JSON.parse(s);
            } catch (e) {
                return;
            };
        }
    },

    pushPreferences: function () {
        if (this.scoAPI) {
            this.doScormCommand("lmsSetLocation", encodeBase64(JSON.stringify(this.preferences)));
        }
    },

    getPreference: function (pref) {
        var val = "";
        for (var item in this.preferences) {
            if (typeof (this.preferences[item]) == "object") {
                if (this.preferences[item].id == (isMobile ? "mobile" : "desktop")) {
                    for (var prop in this.preferences[item]) {
                        if (prop == pref) {
                            val = this.preferences[item][prop];
                        }
                    }
                }
            }
        };
        return val;
    },

    setPreference: function (pref, val) {
        for (var item in this.preferences) {
            if (typeof (this.preferences[item]) == "object") {
                if (this.preferences[item].id == (isMobile ? "mobile" : "desktop")) {
                    for (var prop in this.preferences[item]) {
                        if (prop == pref) {
                            this.preferences[item][prop] = val;
                        }
                    }
                }
            }
        };
    },

    getSessionTime: function () {
        if (typeof this.logonTime == "undefined") return ("00:00:00");

        var now = new Date(),
            onTime = this.logonTime.split(":");
        var offSeconds = now.getSeconds(),
            offMinutes = now.getMinutes(),
            offHours = now.getHours();
        var onHours = parseInt(onTime[0]),
            onMinutes = parseInt(onTime[1]),
            onSeconds = parseInt(onTime[2]);

        if (offSeconds >= onSeconds) {
            logSeconds = offSeconds - onSeconds
        } else {
            offMinutes -= 1;
            logSeconds = (offSeconds + 60) - onSeconds;
        }

        if (offMinutes >= onMinutes) {
            logMinutes = offMinutes - onMinutes;
        } else {
            offHours -= 1;
            logMinutes = (offMinutes + 60) - onMinutes;
        }

        logHours = offHours - onHours;
        logHours = ((logHours < 10) ? "0" : "") + logHours;
        logMinutes = ((logMinutes < 10) ? ":0" : ":") + logMinutes;
        logSeconds = ((logSeconds < 10) ? ":0" : ":") + logSeconds;

        return logHours + logMinutes + logSeconds;
    },

    updateLessonStatus: function (usePassedFailed) {
           
        var blockLessonStatus = false;
        switch (this.lessonStatus) {
            case "not started":
            case "incomplete":
            case "not attempted,a":
                this.lessonStatus = "incomplete";
                blockLessonStatus = false;
                break;
            case "completed":
                blockLessonStatus = true;
                break;
            case "passed":
                blockLessonStatus = true;
                break;
            case "failed":
                blockLessonStatus = false;
                break;
            default:
                this.lessonStatus = "incomplete";
                blockLessonStatus = false;
        };

        if(typeof usePassedFailed!="undefined")usePassedFailed=false;
        if(this.scoVersion=="scorm12")usePassedFailed=false;
        
        if (!blockLessonStatus) {
            if (this.score >= this.masteryScore) {
                if(usePassedFailed){
                    this.lessonStatus = "passed";
                }else{
                    this.lessonStatus = "completed";
                }                
            }else{
                if(usePassedFailed){
                    this.lessonStatus = "failed";
                }
            }
        };
        
        this.pushSessionData();
        
    },

    getPagesTotal: function () {
        var count = 0;
        for (var i in wbt.structure) {
            for (var j in wbt.structure[i].items) {
                if (typeof wbt.structure[i].items[j] == "object") {
                    count++;
                }
            }
        };
        return count;
    },

    getPagesVisited: function () {
        var count = 0;
        for (var i in wbt.structure) {
            for (var j in wbt.structure[i].items) {
                if (typeof wbt.structure[i].items[j] == "object") {
                    switch (wbt.structure[i].items[j].status) {
                    case "passed":
                    case "completed":
                    case "failed":
                        count++;
                        break;
                    default:
                        break;
                    }
                }
            }
        };
        return count;
    },

    getScorePercent: function () {
        var score = 0,
            maxScore = 0;
            
        for (var i in wbt.structure) {
            for (var j in wbt.structure[i].items) {
                if (typeof wbt.structure[i].items[j] == "object") {
                    score += wbt.structure[i].items[j].score<9 ? wbt.structure[i].items[j].score : 0;
                    maxScore += wbt.structure[i].items[j].maxScore;
                }
            }
        };
        
        var scorePercent = maxScore > 0 ? parseInt(round(score / maxScore) * 100) : 0;
        
        if(typeof wbt.metadata.resourceType!="undefined"){
            switch (wbt.metadata.resourceType){
                case "profiling":
                    if(scorm.lessonStatus=="completed"){
                        scorePercent=100;
                    }else{
                        scorePercent=0;
                    }
                    break;
                case "distributedSelfTest":
                case "distributedAssessment":
                    scorePercent=this.score;
                    break;
                default:
                    break;
            }            
        }
        
        return scorePercent;
    },

    getScorePoints: function () {
        var score = 0;
        for (var i in wbt.structure) {
            for (var j in wbt.structure[i].items) {
                if (typeof wbt.structure[i].items[j] == "object") {
                    score += wbt.structure[i].items[j].score;
                }
            }
        };
        return score;
    },

    getMaxScore: function () {
        var maxScore = 0;
        for (var i in wbt.structure) {
            for (var j in wbt.structure[i].items) {
                if (typeof wbt.structure[i].items[j] == "object") {
                    maxScore += wbt.structure[i].items[j].maxScore;
                }
            }
        };
        return maxScore;
    },

    doScormCommand: function (command, args) {
        if (this.scoAPI == null) return null;
        
        command = String(command);
        args = String(args);
        args = args.split(";");
        var result = null;

        switch (command) {
        case "lmsInitialize":
            switch (this.scoVersion) {
            case "scorm12":
                result = this.scoAPI.LMSInitialize("");
                break;
            case "scorm2004":
                result = this.scoAPI.Initialize("");
                break;
            case "scormCon":
                result = this.scoAPI.scormConnector.lmsInitialize(); //returns "true";
                break;
            }
            break;

        case "lmsExitAU":
            switch (this.scoVersion) {
            case "scorm12":
                result = this.scoAPI.LMSFinish("");
                break;
            case "scorm2004":
                result = this.scoAPI.Terminate("");
                break;
            case "scormCon":
                result = this.scoAPI.scormConnector.lmsExitAU(); //returns "true";
                break;
            }
            break;

        case "lmsCommit":
            switch (this.scoVersion) {
            case "scorm12":
                result = this.scoAPI.LMSCommit("");
                break;
            case "scorm2004":
                result = this.scoAPI.Commit("");
                break;
            case "scormCon":
                result = this.scoAPI.scormConnector.lmsCommit();
                break;
            }
            break;

        case "lmsGetValue":
            switch (this.scoVersion) {
                case "scorm12":
                    switch (args[0]) {
                        case "lessonLocation":
                            result = this.scoAPI.LMSGetValue("cmi.core.lesson_location");
                            break;
                        case "lessonStatus":
                            result = this.scoAPI.LMSGetValue("cmi.core.lesson_status");
                            break;
                        case "score":
                            result = this.scoAPI.LMSGetValue("cmi.core.score.raw");
                            break;
                        case "masteryScore":
                            result = this.scoAPI.LMSGetValue("cmi.student_data.mastery_score");
                            if (result == "") {
                                result = 0;
                            } else {
                                result = parseInt(result * 100);
                            };
                            break;
                        case "notepad":
                            result = this.scoAPI.LMSGetValue("cmi.comments");
                            break;
                        case "suspendData":
                            result = this.scoAPI.LMSGetValue("cmi.suspend_data");
                            break;
                        default:
                            result = this.scoAPI.LMSGetValue(args[0]);
                    }
                    if (typeof result == "undefined") result = "";
                    result = String(result);
                    break;
                
                case "scorm2004":
                    switch (args[0]) {
                        case "lessonLocation":
                            result = this.scoAPI.GetValue("cmi.location");
                            break;
                        case "lessonStatus":
                            var val = this.scoAPI.GetValue("cmi.success_status");
                            var ss = "";
                            if ((val == "passed") || (val == "failed")) {
                                ss = val;
                            } else {
                                ss = this.scoAPI.GetValue("cmi.completion_status");
                            }
                            if ((ss == "") || (ss == "unknown")) ss = "not attempted";
                            break;
                        case "notepad":
                            result = this.scoAPI.GetValue("cmi.comments_from_learner.0.comment");
                            break;
                        case "masteryScore":
                            result = this.scoAPI.GetValue("cmi.scaled_passing_score");
                            if (result == "") {
                                result = 0;
                            } else {
                                result = parseInt(result * 100);
                            };
                            break;
                        case "score":
                            result = this.scoAPI.GetValue("cmi.score.raw");
                            break;
                        case "suspendData":
                            result = this.scoAPI.GetValue("cmi.suspend_data");
                            break;
                        default:
                            result = this.scoAPI.GetValue(args[0]);
                    }
                    if (typeof result == "undefined") result = "";
                    result = String(result);
                    break;
                
                case "scormCon":
                    switch (args[0]) {
                        case "lessonLocation":
                            result = "";
                            break;
                        case "lessonStatus":
                            result = this.unit.status;
                            break;
                        case "score":
                            result = this.unit.score;
                            break;
                        case "masteryScore":
                            result = this.unit.masteryScore;
                            break;
                        case "suspendData":
                            result = this.unit.data;
                            break;
                        default:
                            result = this.unit[args[0]];
                            break;
                    };
                    if (typeof result == "undefined") result = "";
                    result = String(result);
                    break;               
            };
            break;
        
        case "lmsSetScore":
            switch (this.scoVersion) {
                case "scorm12":
                    this.scoAPI.LMSSetValue("cmi.core.score.raw", args[0] + "");
                    break;
                case "scorm2004":
                    this.scoAPI.SetValue("cmi.score.raw", args[0] + "");
                    this.scoAPI.SetValue("cmi.score.scaled", (parseInt(args[0]) / 100) + "");
                    break;
                case "scormCon":
                    this.unit.score=args[0];
                    break;
            }
            break;

        case "lmsSetStatus":
            //completed,incomplete,not attempted,failed,passed
            switch (this.scoVersion) {
                case "scorm12":
                    this.scoAPI.LMSSetValue("cmi.core.lesson_status", args[0]);
                    break;
                case "scorm2004":
                    switch (args[0]) {
                        case "completed":
                            this.scoAPI.SetValue("cmi.progress_measure", "1");
                            this.scoAPI.SetValue("cmi.completion_status", args[0]);
                            break;
                        case "incomplete":
                        case "not attempted":
                            this.scoAPI.SetValue("cmi.completion_status", args[0]);
                            break;
                        case "passed":
                        case "failed":
                            this.scoAPI.SetValue("cmi.completion_status", "completed")
                            this.scoAPI.SetValue("cmi.success_status", args[0]);
                        case "browsed":
                            //ignore
                    }
                    break;
                case "scormCon":
                    this.unit.status=args[0];
                    break;
            }
            break;      

        case "lmsSetSessionTime":
            switch (this.scoVersion) {
                case "scorm12":
                    //out: [HH]HH:MM:SS[.SS]
                    this.scoAPI.LMSSetValue("cmi.core.session_time", args[0]);
                    break;
                case "scorm2004":
                    //out: ISO-Time
                    this.scoAPI.SetValue("cmi.session_time", this.centisecsToISODuration(this.SCORM12DurationToCs(args[0], true)));
                    break;
                case "scormCon":
                    //out: sec.
                    if(this.unit.timing=="object"){
                        this.unit.timing.actual.push(SCORM12DurationToCs(args[0],true)/100); 
                    }
                    break;
            }
            break;

        case "lmsSetSuspendData":
            switch (this.scoVersion) {
                case "scorm12":
                    this.scoAPI.LMSSetValue("cmi.suspend_data", args[0]);
                    break;
                case "scorm2004":
                    this.scoAPI.SetValue("cmi.suspend_data", args[0]);
                    break;
                case "scormCon":
                    this.unit.data=args[0];
                    break;
            }
            break;

        case "lmsSetLocation":
            switch (this.scoVersion) {
                case "scorm12":
                    this.scoAPI.LMSSetValue("cmi.core.lesson_location", args[0]);
                    break;
                case "scorm2004":
                    this.scoAPI.SetValue("cmi.location", args[0]);
                    break;
                case "scormCon":
                    this.scoAPI.scormConnector.lmsSetLocation(args[0]);
                    break;
            }
            break;

        case "lmsExit":
            //time-out,suspend,logout
            switch (this.scoVersion) {
                case "scorm12":
                    this.scoAPI.LMSSetValue("cmi.core.exit", args[0]);
                    break;
                case "scorm2004":
                    this.scoAPI.SetValue("cmi.exit", args[0]);
                    break;
                case "scormCon":
                    this.scoAPI.scormConnector.lmsExit();
                    break;
            }
            break;

        case "lmsGetLastError":
            switch (this.scoVersion) {
                case "scorm12":
                    result = this.scoAPI.LMSGetLastError();
                    break;
                case "scorm2004":
                    var n = parseInt(this.scoAPI.GetLastError());
                    if (isNaN(n)) result = 101;
                    result = n;
                    break;
                case "scormCon":
                    result=this.scoAPI.scormConnector.lmsGetLastError();
                    break;
            }
            break;

        case "lmsGetErrorString":
            switch (this.scoVersion) {
                case "scorm12":
                    result = this.scoAPI.LMSGetErrorString(args[0]);
                    break;
                case "scorm2004":
                    result = this.scoAPI.GetErrorString(args[0]);
                    break;
                case "scormCon":
                    result=this.scoAPI.scormConnector.lmsGetErrorString();
                    break;
            }
            break;
        
        case "lmsHandleDistributedResults":
            switch (this.scoVersion) {
                case "scorm12":
                case "scorm2004":
                    result = null;
                    break;
                case "scormCon":
                    if(typeof this.scoAPI.scormConnector.lmsHandleDistributedResults=="function"){
                        result=this.scoAPI.scormConnector.lmsHandleDistributedResults(args[0]);
                    }else{
                        result= "";
                    }
                    break;
            }
        };        

        return result;
    },

    centisecsToISODuration: function (n, bPrecise) {
        var str = "P",
            nCs = n,
            nY = 0,
            nM = 0,
            nD = 0,
            nH = 0,
            nMin = 0,
            nS = 0;
        n = Math.max(n, 0);
        var nCs = n;
        with(Math) {
            if (bPrecise == true) {
                nD = floor(nCs / 8640000);
            } else {
                nY = floor(nCs / 3155760000);
                nCs -= nY * 3155760000;
                nM = floor(nCs / 262980000);
                nCs -= nM * 262980000;
                nD = floor(nCs / 8640000);
            }
            nCs -= nD * 8640000;
            nH = floor(nCs / 360000);
            nCs -= nH * 360000;
            var nMin = floor(nCs / 6000);
            nCs -= nMin * 6000;
        }

        if (nY > 0) str += nY + "Y";
        if (nM > 0) str += nM + "M";
        if (nD > 0) str += nD + "D";
        if ((nH > 0) || (nMin > 0) || (nCs > 0)) {
            str += "T";
            if (nH > 0) str += nH + "H";
            if (nMin > 0) str += nMin + "M";
            if (nCs > 0) str += (nCs / 100) + "S";
        }
        if (str == "P") str = "PT0H0M0S";
        return str;
    },

    ISODurationToCentisec: function (str) {
        var aV = new Array(0, 0, 0, 0, 0, 0);
        var bErr = false,
            bTFound = false;
        if (str.indexOf("P") != 0) bErr = true;
        if (!bErr) {
            var aT = new Array("Y", "M", "D", "H", "M", "S");
            var p = 0,
                i = 0;
            str = str.substr(1);
            for (i = 0; i < aT.length; i++) {
                if (str.indexOf("T") == 0) {
                    str = str.substr(1);
                    i = Math.max(i, 3);
                    bTFound = true;
                }
                p = str.indexOf(aT[i]);
                if (p > -1) {
                    if ((i == 1) && (str.indexOf("T") > -1) && (str.indexOf("T") < p)) continue;
                    if (aT[i] == "S") {
                        aV[i] = parseFloat(str.substr(0, p));
                    } else {
                        aV[i] = parseInt(str.substr(0, p));
                    }
                    if (isNaN(aV[i])) {
                        bErr = true;
                        break;
                    } else if ((i > 2) && (!bTFound)) {
                        bErr = true;
                        break;
                    }
                    str = str.substr(p + 1);
                }
            }
            if ((!bErr) && (str.length != 0)) bErr = true;
        }
        if (bErr) return null;
        return aV[0] * 3155760000 + aV[1] * 262980000 + aV[2] * 8640000 + aV[3] * 360000 + aV[4] * 6000 + Math.round(aV[5] * 100);
    },

    SCORM12DurationToCs: function (str) {
        var a = str.split(":");
        var nS = 0,
            n = 0;
        var nMult = 1;
        var bErr = ((a.length < 2) || (a.length > 3));
        if (!bErr) {
            for (i = a.length - 1; i >= 0; i--) {
                n = parseFloat(a[i]);
                if (isNaN(n)) {
                    bErr = true;
                    break;
                }
                nS += n * nMult;
                nMult *= 60;
            }
        }
        if (bErr) return NaN;
        return Math.round(nS * 100);
    },

    centisecsToSCORM12Duration: function (n) {
        var bTruncated = false;
        with(Math) {
            var nH = floor(n / 360000);
            var nCs = n - nH * 360000;
            var nM = floor(nCs / 6000);
            nCs = nCs - nM * 6000;
            var nS = floor(nCs / 100);
            nCs = nCs - nS * 100;
        }
        if (nH > 9999) {
            nH = 9999;
            bTruncated = true;
        }
        var str = "0000" + nH + ":";
        str = str.substr(str.length - 5, 5);
        if (nM < 10) str += "0";
        str += nM + ":";
        if (nS < 10) str += "0";
        str += nS;
        if (nCs > 0) {
            str += ".";
            if (nCs < 10) str += "0";
            str += nCs;
        }
        return str;
    }
});