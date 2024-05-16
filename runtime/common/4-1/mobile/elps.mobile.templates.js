templates.splashPage=function(){
    return "" +
        "<div data-role='content'>" +
            "<div id='splashContainer'>" +
                "<div id='splashHeader'></div>" +
                "<div class='ui-grid-a ui-responsive'>" +
                    "<div class='ui-block-a'>" +
                        "{SPLASHTITLE}" +
                        "{SPLASHINTRO}" +
                        "{SPLASHLEARNINGTIME}" +
                    "</div>" +
                    "<div class='ui-block-b'>" +
                        "<img src='images/default.jpg' />" +
                    "</div>" +
                "</div>" +                
            "</div>" +
        "</div>" +			
        "<div data-role='footer' data-theme='c'>" +
            "<div style='text-align: center;'>" +
                "<a id='btnReleaseAudio' href='javascript:void(0);' onclick='content.releaseAudio();' " +
                    "data-role='button' data-theme='a' data-icon='arrow-r' data-inline='true' data-transition='slidedown'>START</a>" +
            "</div>" +
        "</div>"
}

templates.splashTitle=function(){
    return "" +
        "<h2 class='splashTitle'>{TITLE}</h2>";
}

templates.splashIntro=function(){
    return "" +
        "<p class='splashIntro'>{INTRO}</p>";
}

templates.splashLearningTime=function(){
    var html="";
    switch(wbt.metadata.language){
        case "_de":
            html = "" +
                "<p class='splashLearningTime'>" +
                    "Durchschnittliche Bearbeitungszeit: {LEARNINGTIME} Std." +
                "</p>";
            break;
        case "_en":
            html = "" +
                "<p class='splashLearningTime'>" +
                    "Typical learning time: {LEARNINGTIME} hrs." +
                "</p>";
            break;
    };
    return html="";
}

templates.contentPage=function(){
    var exit, close, yes, no;
    switch(wbt.metadata.language){
        case "_de":
            exit = "Ende";
            close = "Schließen";
            yes = "Ja";
            no = "Nein";
            break;
        case "_en":
            exit = "Exit";
            close = "Close";
            yes = "Yes";
            no = "No";
            break;
    }
    
    return "" +
        "<div id='mainContainer' data-role='content'>" +
            "<div id='header' style='width:100%'>" +
                "<div style='float:left;'>" +
                    "<div data-role='controlgroup' data-type='horizontal' data-mini='true'>" +
                        "{MENUITEMS}" +
                    "</div>" +
                "</div>" +
                "<div style='float:right;'>" +
                    "<div data-role='controlgroup' data-type='horizontal' data-mini='true'>" +
                        "<a id='exitButton' onclick='content.quit();' href='javascript:void(0);' " +
                            "data-role='button' data-theme='b' data-icon='delete' data-iconpos='right'>" +
                            exit +
                        "</a>" +
                    "</div>" +
                "</div>" +
            "</div>" +
            
            "<div style='clear:both;'></div>" +
            
            "<h1 id='pageTitle'></h1>" +
           
            "<div style='clear:both;'></div>" +
            
            "<div id='divcontent' style='float:left;'></div>" +

            "<div id='moderationPanel' style='display:none;position:relative;'>" +
                "<div>" +
                    "<a href='javascript:void(0);' onclick='content.closeModerationPanel()' style='float:right;' " +
                        "data-role='button' data-theme='b' data-icon='delete' data-iconpos='notext' data-inline='true'>" +
                        close +
                    "</a>" +
                "</div>" +
                "<div id='moderationContainer'></div>" +
                "<div id='audioContainer' style='position:absolute;bottom:0'></div>" +
            "</div>" +
            "<div style='clear:both;'></div>" +
            "<div id='logo'></div>" +
        "</div>" +
        "<div id='footer' data-role='footer' data-theme='a'>" +
            "<div style='width:100%'>" +
                "<div id='playbar' style='float:left;'></div>" +
                "<div id='navbar' style='float:right;'>" +
                    "<a id='aNavPrev' href='javascript:void(0);' data-role='button' data-icon='arrow-l' data-iconpos='notext' data-inline='true'> </a>" +
                    "<span id='stepnav' style='vertical-align:middle;'></span>" +
                    "<a id='aNavNext' href='javascript:void(0);' data-role='button' data-icon='arrow-r' data-iconpos='notext' data-inline='true'> </a>" +
                "</div>" +
            "</div>" +           
        "</div>" +
        "<div id='tocPanel' data-role='panel' data-dismissible='true' data-display='overlay' data-theme='b' data-position-fixed='true' data-position='left'>" + 
            "<a href='javascript:void(0);' data-rel='close' data-role='button' data-mini='true' data-inline='true' data-icon='arrow-l' data-iconpos='left' data-theme='b'>" +
                close +
            "</a>" +
            
            "<div data-role='collapsible-set' data-inset='false' data-theme='b'>" +
                "{BLOCKCOLLAPSIBLES}" +
            "</div>" +
            
            "<div id='stickySwitch'>" +
                "<label for='sticky'>Inhaltsverzeichnis stets einblenden?</label>" +
                "<select name='sticky' id='sticky' data-role='slider' data-mini='true' data-theme='b'>" +
                    "<option selected='selected' value='n'>" +
                        no +
                    "</option>" +
                    "<option value='y'>" +
                        yes +
                    "</option>" +
                "</select>" +
            "</div>" +
            
        "</div>" +
        "{POPUPMENU}" +
        "{QUICKNAVMENU}";
}

templates.menuItemToc=function(){
    var msg=""
    switch(wbt.metadata.language){
        case "_de":
            msg="Inhalt";
            break;
        case "_en":
            msg="Contents";
            break;
    }
    
    return "" +
        "<a id='tocPanelButton' href='javascript:void(0);' data-role='button' data-theme='b' data-icon='arrow-r' data-iconpos='left'>" +
            msg +
        "</a>";
}

templates.menuItemGlossary=function(){
    
    var msg=""
    switch(wbt.metadata.language){
        case "_de":
            msg="Glossar";
            break;
        case "_en":
            msg="Glossary";
            break;
    }
    
    return "" +
        "<a id='glossaryButton' href='javascript:void(0);' onclick='content.doMenuCommand(\"glossary\");' " +
            "data-rel='dialog' data-role='button' data-theme='b' data-iconpos='noicon'>" +
            msg +
        "</a>";
}

templates.menuItemFiles=function(){
    
    var msg=""
    switch(wbt.metadata.language){
        case "_de":
            msg="Dokumente";
            break;
        case "_en":
            msg="Documents";
            break;
    }
    
    return "" +
        "<a id='filesButton' href='javascript:void(0);' onclick='content.doMenuCommand(\"files\");' " +
            "data-rel='dialog' data-role='button' data-theme='b' data-iconpos='noicon'>" +
            msg +
        "</a>";
}

templates.menuItemTools=function(){

    var msg=""
    switch(wbt.metadata.language){
        case "_de":
            msg="Hilfsmittel";
            break;
        case "_en":
            msg="Tools";
            break;
    }

    return "" +
        "<a id='menuButton' href='#popupMenu' data-rel='popup' data-role='button' data-theme='b' data-iconpos='noicon' data-transition='fade'>" +
            msg +
        "</a>";
}
                
templates.atomFullsize=function(){
    
    var msg=""
    switch(wbt.metadata.language){
        case "_de":
            msg="Zurück";
            break;
        case "_en":
            msg="Back";
            break;
    }
    
    return "" +
        "<div data-role='header' data-position='fixed' data-theme='b'>" +
            "<a href='javascript:void(0);' onclick='content.hidePage()' data-icon='back' data-theme='b'>" +
                msg +
            "</a>" +
            "<h1 id='atomFullsizeHeader'></h1>" +
        "</div>" +
        "<div data-role='content'>"+
            "<div id='atomFullsizeContent'></div>" +
        "</div>";
}

templates.paginationBubble=function(){
    return "" +
        "<span class='ui-li-count ui-btn-corner-all'>{X}</span>";
}

templates.paginationDotsCompleted=function(){
    return "" +
        "<img src='"+custom+"shared/images/bullet_green.png' />";
}

templates.paginationDotsActive=function(){
    return "" +
        "<img src='"+custom+"shared/images/bullet_blue.png' />";
}

templates.paginationDotsIncomplete=function(){
    return "" +
        "<img src='"+custom+"shared/images/bullet_yellow.png' />";
}

templates.tocBlockCollapsible=function(){
    
    var msg=""
    switch(wbt.metadata.language){
        case "_de":
            msg="Noch zu bearbeitende Seiten";
            break;
        case "_en":
            msg="Pages remaining";
            break;
    }
    
    return "" +
        "<div data-role='collapsible' id='{BLOCKID}' class='block' data-collapsed='{TRUEFALSE}'>" +
            "<h3>" +
                "<span class='ui-li-heading' style='float:left;width:75%;'>{BLOCKTITLE}</span>" +
                "<span id='bubble{BLOCKID}' title='" + msg +"' class='ui-li-count ui-btn-corner-all' style='float:right;padding:2px 6px;margin-top:3px;'>{NUMPAGES}</span>" +
            "</h3>" +
            "<ul data-role='listview' data-inset='false' data-split-icon='bookmark'>" +
                "{PAGES}" +
            "</ul>" +
        "</div>";
}

templates.tocPageListItem=function(){
    
    var msg=""
    switch(wbt.metadata.language){
        case "_de":
            msg="Lesezeichen setzen/entfernen";
            break;
        case "_en":
            msg="Set/remove bookmark";
            break;
    }
    
    return "" +
        "<li id='li{PAGEID}' class='tocPageListItem' data-theme='c'>" +
            "<a href='javascript:void(0);' class='tocPageListItemLink'>" +
                "<img src='"+custom+"shared/images/icon_{ICON}.png' class='statusImg ui-li-icon ui-corner-none' />" +
                "<h3>{PAGETITLE}</h3>" +
                "{PAGEHASFILES}" +
            "</a>" +
            "<a id='bm{PAGEID}' class='bmIcon' data-theme='c' href='javascript:void(0);' onclick='content.setBookmark(\"{PAGEID}\");'>" +
                msg +
            "</a>" +
        "</li>";
}

templates.tocPageHasFiles=function(){
    return "" +
        "<p class='ui-li-aside'>" +
            "<img src='"+custom+"shared/images/icon_files.png' />" +
        "</p>"
}

templates.bookmarkUnset=function(){
    return "" +
        "<img src='"+custom+"shared/images/icon_star-empty.png' />";
}

templates.bookmarkSet=function(){
    return "" +
        "<img src='"+custom+"shared/images/icon_star.png' />";
}

templates.glossaryPage=function(){
    
    var back, glossar, filter;
    switch(wbt.metadata.language){
        case "_de":
            back="Zurück";
            glossary="Glossar";
            filter="Einträge filtern...";
            break;
        case "_en":
            back="Back";
            glossary="Glossary";
            filter="Filter...";
            break;
    }
    
    return "" +
        "<div data-role='header' data-position='fixed' data-theme='b'>" +
            "<a href='javascript:void(0);' onclick='content.hidePage()' data-icon='back' data-theme='b'>" +
                back +
            "</a>" +
            "<h1>" +
                glossary +
            "</h1>" +
        "</div>" +
        "<div data-role='content'>" +
            "<ul id='glossaryList' data-role='listview' data-divider-theme='a' data-autodividers='true' data-filter='true' data-filter-placeholder='" + filter + "' data-inset='false'>" +
                "{GLOSSARYITEMS}" +
            "</ul>" +
        "</div>" +
        "<div id='itemPanelGlossary' data-role='panel' data-dismissible='true' data-display='overlay' data-position-fixed='true' data-position='right'>" + 
            "<div id='glossaryItemContainer'></div>" +
            "<br/><a href='javascript:void(0);' data-role='button' data-theme='b' data-rel='close' data-icon='back' data-iconpos='left' data-inline='true'>OK</a>" +
        "</div>";        
}

templates.glossaryItem=function(){
    return "" +
        "<li class='glossaryItem' data-theme='c'>" +
            "<a href='#' onclick='javascript:glossary.showItem(\"{ITEMID}\")'>" +
                "{ITEMTITLE}" +
            "</a>" +
        "</li>";
}

templates.filesPage=function(){
    
    var back, files;
    switch(wbt.metadata.language){
        case "_de":
            back="Zurück";
            files="Dokumente";
            break;
        case "_en":
            back="Back";
            files="Documents";
            break;
    }
    
    return "" +
        "<div data-role='header' data-position='fixed' data-theme='b'>" +
            "<a href='javascript:void(0);' onclick='content.hidePage()' data-icon='back' data-theme='b'>" +
                back +
            "</a>" +
            "<h1>" +
                files +
            "</h1>" +
        "</div>" +
        "<div data-role='content'>" +
            "<ul id='filesList' data-role='listview'>" +
                "{FILES}" +
            "</ul>" +
        "</div>";
}

templates.filesItem=function(){
    return "" +
        "<li data-theme='c' class='fi{PAGEID}'>" +
            "<a href='#' onclick='javascript:files.showItem(\"{ITEMID}\")'>" +
                "<img src='"+custom+"shared/images/{ICON}.png' class='ui-li-icon ui-corner-none' />" +
                  "{ITEMTITLE}" +
            "</a>" +
        "</li>";        
}

templates.aboutPage=function(){
    
    var back, info;
    switch(wbt.metadata.language){
        case "_de":
            back="Zurück";
            info="Info";
            break;
        case "_en":
            back="Back";
            info="Information";
            break;
    }
    
    return "" +
        "<div data-role='header' data-position='fixed' data-theme='b'>" +
            "<a href='javascript:void(0);' onclick='content.hidePage()' data-icon='back' data-theme='b'>" +
                back +
            "</a>" +
            "<h1>" +
                info +
            "</h1>" +
        "</div>" +
        "<div data-role='content'>" +
            "{CONTENT}" +
        "</div>";
}

templates.imprintPage=function(){
    
    var back, imprint;
    switch(wbt.metadata.language){
        case "_de":
            back="Zurück";
            imprint="Impressum";
            break;
        case "_en":
            back="Back";
            imprint="Impressum";
            break;
    }
    
    return "" +
        "<div data-role='header' data-position='fixed' data-theme='b'>" +
            "<a href='javascript:void(0);' onclick='content.hidePage()' data-icon='back' data-theme='b'>" +
                back +
            "</a>" +
            "<h1>" +
                imprint +
            "</h1>" +
        "</div>" +
        "<div data-role='content'>" +
            "{CONTENT}" +
        "</div>";
}

templates.dynaPopup=function(){
    return "" +
        "<div data-role='popup' class='ui-content dynaPopup' data-history='false' data-corners='false' data-tolerance='30,15'>" +
            "<a href='#' data-role='button' data-rel='back' data-icon='delete' data-iconpos='notext' class='ui-btn-right closePopup'>OK</a>" +
            "<div>{CONTENT}</div>" +
        "</div>";
}

templates.menuPopup=function(){
    var html="";
    switch(wbt.metadata.language){
        case "_de":
            html = "" +
                "<div data-role='popup' id='popupMenu' data-history='false'>" +
                    "<ul data-role='listview' data-theme='c'>" +
                        "<li><a href='#' onclick='content.doMenuCommand(\"about\");' data-rel='dialog'>Information</a></li>" +
                        "<li><a href='#' onclick='content.doMenuCommand(\"imprint\");' data-rel='dialog'>Impressum</a></li>" +
                        "<li id='menuItemWbtPhotoCredits'><a href='#' data-rel='dialog'>Bildnachweis</a></li>" +
                        "<li id='menuItemHelp'><a href='#' data-rel='dialog'>Hilfe</a></li>" +
                    "</ul>" +
                "</div>";  
            break;
        case "_en":
            html = "" +
                "<div data-role='popup' id='popupMenu' data-history='false'>" +
                    "<ul data-role='listview' data-theme='c'>" +
                        "<li><a href='#' onclick='content.doMenuCommand(\"about\");' data-rel='dialog'>Information</a></li>" +
                        "<li><a href='#' onclick='content.doMenuCommand(\"imprint\");' data-rel='dialog'>Imprint</a></li>" +
                        "<li id='menuItemWbtPhotoCredits'><a href='#' data-rel='dialog'>Photo credits</a></li>" +
                        "<li id='menuItemHelp'><a href='#' data-rel='dialog'>Help</a></li>" +
                    "</ul>" +
                "</div>";  
            break;
    }
    
    return html;      
}

templates.audioPlayerControlsTemplate=function(){
    
    var mute, unmute, maxVolume;
	switch(wbt.metadata.language){
		case "_de":
			mute="Stumm";
			unmute="Stummschaltung aufheben";
			maxVolume="Maximale Lautstärke";
			break;
		case "_en":
			mute="Mute";
			unmute="Unmute";
			maxVolume="Maximum volume";
			break;
	}
    
    return "" +
        "<div id='jp-text'></div>" +
        "<div id='jp-notext'></div>" +
        "<div id='jplayer_audio' class='jp-jplayer' ></div>" +
        "<div id='jp_container_audio' class='jp-audio'>" +
            "<div class='jp-type-single'>" +
                "<div class='jp-gui jp-interface'>" +
                    "<ul class='jp-controls'>" +
                        "<li><a href='javascript:void(0);' class='jp-play' style='display:block;' tabindex='1'>play</a></li>" +
                        "<li><a href='javascript:void(0);' class='jp-pause' style='display:block;' tabindex='1'>pause</a></li>" +
                        "<li><a href='javascript:void(0);' class='jp-stop' style='display:block;' tabindex='1'>stop</a></li>" +
                        "<li><a href='javascript:void(0);' class='jp-mute' style='display:block;' tabindex='1' title='"+mute+"'>mute</a></li>" +
                        "<li><a href='javascript:void(0);' class='jp-unmute' style='display:block;' tabindex='1' title='"+unmute+"'>unmute</a></li>" +
                        "<li><a href='javascript:void(0);' class='jp-volume-max' style='display:block;' tabindex='1' title='"+maxVolume+"'>max volume</a></li>" +
                    "</ul>" +
                    "<div class='jp-progress'>" +
                        "<div class='jp-seek-bar'>" +
                            "<div class='jp-play-bar'></div>" +
                        "</div>" +
                    "</div>" +
                    "<div class='jp-volume-bar'>" +
                        "<div class='jp-volume-bar-value'></div>" +
                    "</div>" +
                   
                    "<div class='jp-time-holder'>" +
                        "<div class='jp-current-time'></div>" +
                        "<div class='jp-duration'></div>" +
                        "<ul class='jp-toggles'>" +
                            "<li><a href='javascript:;' class='jp-repeat' tabindex='1' title='repeat'>repeat</a></li>" +
                            "<li><a href='javascript:;' class='jp-repeat-off' tabindex='1' title='repeat off'>repeat off</a></li>" +
                        "</ul>" +
                    "</div>" +
                "</div>" +
                "<div class='jp-title'></div>" +
                "<div class='jp-no-solution'></div>" +
            "</div>" +
        "</div>"
}

content.videoPlayerControlsTemplate=function(){
    
    var mute, unmute, maxVolume;
	switch(wbt.metadata.language){
		case "_de":
			mute="Stumm";
			unmute="Stummschaltung aufheben";
			maxVolume="Maximale Lautstärke";
			break;
		case "_en":
			mute="Mute";
			unmute="Unmute";
			maxVolume="Maximum volume";
			break;
	}
    
    return "<div id='jplayer_video' class='jp-jplayer' ></div>" +
        "<div id='jp_container_video' class='jp-video'>" +
            "<div class='jp-type-single'>" +
                "<div class='jp-gui jp-interface'>" +
                    "<ul class='jp-controls'>" +
                        "<li><a href='javascript:void(0);' class='jp-play' style='display:block;' tabindex='1'>play</a></li>" +
                        "<li><a href='javascript:void(0);' class='jp-pause' style='display:block;' tabindex='1'>pause</a></li>" +
                        "<li><a href='javascript:void(0);' class='jp-stop' style='display:block;' tabindex='1'>stop</a></li>" +
                        "<li><a href='javascript:void(0);' class='jp-mute' style='display:block;' tabindex='1' title='"+mute+"'>mute</a></li>" +
                        "<li><a href='javascript:void(0);' class='jp-unmute' style='display:block;' tabindex='1' title='"+unmute+"'>unmute</a></li>" +
                        "<li><a href='javascript:void(0);' class='jp-volume-max' style='display:block;' tabindex='1' title='"+maxVolume+"'>max volume</a></li>" +
                    "</ul>" +
                    "<div class='jp-progress'>" +
                        "<div class='jp-seek-bar'>" +
                            "<div class='jp-play-bar'></div>" +
                        "</div>" +
                    "</div>" +
                    "<div class='jp-volume-bar'>" +
                        "<div class='jp-volume-bar-value'></div>" +
                    "</div>" +
                    "<div class='jp-time-holder'>" +
                        "<div class='jp-current-time'></div>" +
                        "<div class='jp-duration'></div>" +
                        "<ul class='jp-toggles'>" +
                            "<li><a href='javascript:;' class='jp-repeat' tabindex='1' title='repeat'>repeat</a></li>" +
                            "<li><a href='javascript:;' class='jp-repeat-off' tabindex='1' title='repeat off'>repeat off</a></li>" +
                        "</ul>" +
                    "</div>" +
                "</div>" +
                "<div class='jp-title'></div>" +
                "<div class='jp-no-solution'></div>" +
            "</div>" +
        "</div>"
};

templates.interactionContainerTemplate=function(){ //default interaction container
    return "" +
        "<div class='question dropShadow'>" +
            "{CONTENTS}" +
        "</div>";
};

templates.interactionHeaderTemplate=function(){ //default interaction header
    return "" +
        "<div class='questionHeader'>" +
            "<div class='questionText'>{QUESTION}</div>" +
        "</div>";
};

templates.interactionFooterTemplate=function(){ //default interaction footer
    var html="";
    switch(wbt.metadata.language){
        case "_de":
            html = "" +
                "<div class='interactionFooterInProcess questionFooter' data-role='controlgroup' data-type='horizontal'>" +
                    "<a class='interactionBtnHint' data-role='button' data-theme='b' href='javascript:void(0);'>Hinweis</a> " +
                    "<a class='interactionBtnEvaluate' data-role='button' data-theme='a' href='javascript:void(0);'>Fertig</a> " +
                    "<a class='interactionBtnAssistance' data-role='button' data-theme='b' href='javascript:void(0);'>Hilfestellung</button> " +
                    "<a class='interactionBtnHelp' data-role='button' data-theme='b' href='javascript:void(0);'>Hilfe</a> " +
                "</div>" +
                "<div class='interactionFooterSolution questionFooter' data-role='controlgroup' data-type='horizontal'>" +
                    "<input id='interactionRadioUserSolution{STEPID}' name='interactionRadioSolution{STEPID}' data-theme='b' type='radio' checked='checked' value='userSolution' />" +
                    "<label for='interactionRadioUserSolution{STEPID}'>Ihre Antwort</label>" +
                    "<input id='interactionRadioSampleSolution{STEPID}' name='interactionRadioSolution{STEPID}' data-theme='b' type='radio' value='sampleSolution' />" +
                    "<label for='interactionRadioSampleSolution{STEPID}'>Musterlösung</label>" +
                    "<a class='interactionBtnFeedback' data-role='button' data-theme='b'>Hinweis</a>" +
                    "<a class='interactionBtnReset' data-role='button' data-theme='b' href='javascript:void(0);'>Nochmal versuchen?</a>" +
                    "<a class='interactionBtnEvaluationHelp' data-role='button' data-theme='b' href='javascript:void(0);'>Hilfe</a> " +
                "</div>";
            break;
        case "_en":
             html = "" +
                "<div class='interactionFooterInProcess questionFooter' data-role='controlgroup' data-type='horizontal'>" +
                    "<a class='interactionBtnHint' data-role='button' data-theme='b' href='javascript:void(0);'>Hint</a> " +
                    "<a class='interactionBtnEvaluate' data-role='button' data-theme='a' href='javascript:void(0);'>Done</a> " +
                    "<a class='interactionBtnAssistance' data-role='button' data-theme='b' href='javascript:void(0);'>Assistance</button> " +
                    "<a class='interactionBtnHelp' data-role='button' data-theme='b' href='javascript:void(0);'>Help</a> " +
                "</div>" +
                "<div class='interactionFooterSolution questionFooter' data-role='controlgroup' data-type='horizontal'>" +
                    "<input id='interactionRadioUserSolution{STEPID}' name='interactionRadioSolution{STEPID}' data-theme='b' type='radio' checked='checked' value='userSolution' />" +
                    "<label for='interactionRadioUserSolution{STEPID}'>Your answer</label>" +
                    "<input id='interactionRadioSampleSolution{STEPID}' name='interactionRadioSolution{STEPID}' data-theme='b' type='radio' value='sampleSolution' />" +
                    "<label for='interactionRadioSampleSolution{STEPID}'>Sample solution</label>" +
                    "<a class='interactionBtnFeedback' data-role='button' data-theme='b'>Feedback</a>" +
                    "<a class='interactionBtnReset' data-role='button' data-theme='b' href='javascript:void(0);'>Try again?</a>" +
                    "<a class='interactionBtnEvaluationHelp' data-role='button' data-theme='b' href='javascript:void(0);'>Help</a> " +
                "</div>";
            break;
    };
    return html;
};

templates.interactionInfoTemplate=function(){
    return "" +
        "<div class='interactionInfoBox'></div>";
};