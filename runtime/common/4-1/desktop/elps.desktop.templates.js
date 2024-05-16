templates.interactionContainerTemplate=function(){ //default interaction container
    return "" +
        "<div class='question'>" +
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
    
    var html = "";
    switch(wbt.metadata.language){
        case "_de":
            html = "" +
                "<div class='interactionFooterInProcess questionFooter'>" +
                    "<button class='interactionBtnHelp ui-button'>Hilfe</button> " +
                    "<button class='interactionBtnHint ui-button'>Hinweis</button> " +
                    "<button class='interactionBtnEvaluate ui-button-primary'>Fertig</button> " +
                    "<button class='interactionBtnAssistance ui-button-warning'>Hilfestellung</button> " +
                "</div>" +
                "<div class='interactionFooterSolution questionFooter'>" +
                    "<button class='interactionBtnEvaluationHelp ui-button'>Hilfe</button> " +
                    "<span class='buttonset' style='margin-right:10px;'>" +                
                        "<input id='interactionRadioUserSolution{STEPID}' name='interactionRadioSolution{STEPID}' type='radio' checked='checked' value='userSolution' />" +
                        "<label for='interactionRadioUserSolution{STEPID}'>Ihre Antwort</label>" +
                        "<input id='interactionRadioSampleSolution{STEPID}' name='interactionRadioSolution{STEPID}' type='radio' value='sampleSolution' />" +
                        "<label for='interactionRadioSampleSolution{STEPID}'>Musterlösung</label>" +
                    "</span>" +            
                    "<button class='interactionBtnReset ui-button'>Nochmal versuchen?</button>" +
                    "<button class='interactionBtnResults ui-button'>Zur Auswertungsseite</button>" +
                "</div>";
            break;
        case "_en":
            html = "" +
                "<div class='interactionFooterInProcess questionFooter'>" +
                    "<button class='interactionBtnHelp ui-button'>Help</button> " +
                    "<button class='interactionBtnHint ui-button'>Hint</button> " +
                    "<button class='interactionBtnEvaluate ui-button-primary'>Done</button> " +
                    "<button class='interactionBtnAssistance ui-button-warning'>Assistance</button> " +
                "</div>" +
                "<div class='interactionFooterSolution questionFooter'>" +
                    "<button class='interactionBtnEvaluationHelp ui-button'>Help</button> " +
                    "<span class='buttonset' style='margin-right:10px;'>" +                
                        "<input id='interactionRadioUserSolution{STEPID}' name='interactionRadioSolution{STEPID}' type='radio' checked='checked' value='userSolution' />" +
                        "<label for='interactionRadioUserSolution{STEPID}'>Your answer</label>" +
                        "<input id='interactionRadioSampleSolution{STEPID}' name='interactionRadioSolution{STEPID}' type='radio' value='sampleSolution' />" +
                        "<label for='interactionRadioSampleSolution{STEPID}'>Sample solution</label>" +
                    "</span>" +            
                    "<button class='interactionBtnReset ui-button'>Try again?</button>" +
                    "<button class='interactionBtnResults ui-button'>Go to the evaluation page</button>" +
                "</div>";
            break;
    }
        
    return html;
};

templates.interactionInfoTemplate=function(){
    return "" +
        "<div class='interactionInfoBox ui-corner-all'></div>";
}