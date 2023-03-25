// ==UserScript==
// @name         XingScraper
// @namespace    XingScraper
// @version      0.1
// @description  Scraping names, positions and crafting emails.
// @author       You
// @match        *://www.xing.com/pages/*
// @icon         data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==
// @require      https://gist.githubusercontent.com/arantius/3123124/raw/grant-none-shim.js
// @require      https://code.jquery.com/jquery-3.6.4.min.js
// @noframes
// @run-at document-end
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    ///
    /// Global variables
    ///
    var debug = false;
    var company = GM_getValue("company", "UNDEFINED");
    var emailDomain = GM_getValue("emailDomain", "DOMAIN"); // used for crafting email addresses
    var csvSeparator = ";";

    if (!String.prototype.format) { // set String format implementation, if not exist
        String.prototype.format = function() {
            var args = arguments;
            return this.replace(/{(\d+)}/g, function(match, number) {
                return typeof args[number] != 'undefined' ? args[number] : match;
            });
        };
    }

    ///
    /// Styles
    ///
    var styleCSS = "@import url('https://fonts.googleapis.com/css?family=Heebo:100,400');\
	#GUIBox {\
		background-color: #0698A0;\
		bottom:0px;\
		border-radius:6px;\
		-webkit-box-shadow: 4px 4px 18px 0px rgba(97,97,97,1);\
		-moz-box-shadow: 4px 4px 18px 0px rgba(97,97,97,1);\
		box-shadow: 4px 4px 18px 0px rgba(97,97,97,1);\
		color: #000; \
		font-family: 'XING Sans', 'Trebuchet MS', Arial, 'Helvetica Neue', sans-serif; \
		font-weight: 00;\
		height:280px; \
		margin-bottom:25px;\
		margin-left:2px;\
		overflow:auto;\
		padding: 14px; \
		position:fixed;\
		width:290px; \
		z-index:10; \
	}\
	#GUIBox a {\
		color: #69be28;\
		font-weight: 400;\
		margin-top: 4px;\
		text-decoration: underline;\
	}\
	#GUIBox p {\
		margin: 10px 0;\
		text-align: center;\
	}\
	#GUIBox p.left-align {\
		margin-top: 20px;\
		text-align: left;\
	}\
	#GUIBox .headline {\
		font-size: 24px;\
		font-weight: 400;\
		margin: 18px 0; \
	}\
	#GUIBox #InputBox {\
		bottom:14px;\
		position:absolute;\
	}\
	#GUIBox #InputBox input {\
		background-color: #007B80;\
		border: none;\
		border-radius: 4px;\
		cursor: pointer;\
		font-weight: 400;\
		padding: 2px 6px;\
		margin: 0px 3px;\
	}\
	#GUIBox #InputBox input:hover {\
		background-color: #007B80;\
	}";

    GM_addStyle(styleCSS); // set style

    ///
    /// Functions
    ///
    function initGUIBox() {
        var box = document.createElement('div');
        box.id = "GUIBox";

        var script_version = GM_info.script.version;
        var headline = document.createElement("p");
          headline.innerHTML = "Xing Scraper " + script_version;
          var headlineClass = document.createAttribute("class");
          headlineClass.value = "headline";
        headline.setAttributeNode(headlineClass);
        box.appendChild(headline);

        var infospans = document.createElement("p");
          var spanStatus = document.createElement("span");
          spanStatus.id = "statusspan";
        infospans.appendChild(spanStatus);
        infospans.appendChild(document.createElement("br"));
          var spanReload = document.createElement("span");
          spanReload.id = "reloadspan";
        infospans.appendChild(spanReload);
        box.appendChild(infospans);

        // buttonbox
        var inputbox = document.createElement('div');
        inputbox.id = "InputBox";
        // logs button
        var btnStats = document.createElement('input');
        btnStats.id = "btnCollectedData";
        btnStats.type = "button";
        btnStats.value = "Show data";
        btnStats.onclick = function() {
            saveStringAsFile(GM_getValue("collectedData", "no logs"));
        };
        inputbox.appendChild(btnStats);
        // clear logs button
        var btnClearStats = document.createElement('input');
        btnClearStats.id = "btnClearData";
        btnClearStats.type = "button";
        btnClearStats.value = "Clear data";
        btnClearStats.onclick = function(){
            if (confirm('Clear data?')) GM_setValue("collectedData", "");
        };
        inputbox.appendChild(btnClearStats);
        box.appendChild(inputbox);
        // set company button
        var btnCompany = document.createElement('input');
        btnCompany.id = "btnClearData";
        btnCompany.type = "button";
        btnCompany.value = "Set settings";
        btnCompany.onclick = function(){
            var inputCompany = prompt("Please set company name token!\r\nIt is visible in the URL of the companies page.", company);
            if (inputCompany != null) {
                company = inputCompany;
                GM_setValue("company", inputCompany);
            }
            var inputEmailDomain = prompt("Please set domain name for email crafting!", emailDomain);
            if (inputEmailDomain != null) {
                emailDomain = inputEmailDomain;
                GM_setValue("emailDomain", inputEmailDomain);
            }
        };
        inputbox.appendChild(btnCompany);
        box.appendChild(inputbox);

        document.getElementsByTagName("body")[0].appendChild(box);
    }

    function addCSVEntry(mail,name,job,company,link) {
        var collectedData = GM_getValue("collectedData", "");
        var entry = "{1}{0}{2}{0}{3}{0}{4}{0}{5}".format(csvSeparator,mail,name,job,company,link);
        if (collectedData.includes(entry)) {
            if (debug) console.log("Entry already exists: {0}".format(entry));
            return;
        }
        if (debug) console.log("Entry added: {0}".format(entry));
        GM_setValue("collectedData", collectedData + entry + "\r\n");
    }

    function popUpTextWindow(content) {
        var ScreenWidth=window.screen.width;
        var ScreenHeight=window.screen.height;
        var movefromedge=0;
        var placementx=(ScreenWidth/2)-((400)/2);
        var placementy=(ScreenHeight/2)-((300+50)/2);
        var WinPop=window.open("","","width=800,height=300,toolbar=0,location=0,directories=0,status=0,scrollbars=0,menubar=0,resizable=0,left="+placementx+",top="+placementy+",scre enX="+placementx+",screenY="+placementy+",");
        WinPop.document.write('<html>\n<head>\n</head>\n<body><span style="white-space: pre-line">'+content+'</span></body></html>');
    }

    function saveStringAsFile(text) {
        //var blob = new Blob([text], {type: "text/plain;charset=utf-8"});
        //var filename = getTimeStamp()+"_requestlog.txt"
        popUpTextWindow(text)
    }

    function setGUIBoxSpanText(span,text,color) {
        var MessBoxSpan = document.getElementById(span);
        if(MessBoxSpan==null) { console.log("Konnte GUIBoxSpan nicht finden!"); return; }
        if(color!="") MessBoxSpan.style.color = color;
        MessBoxSpan.innerHTML = text;
    }

    function sanitizeName(name) {
        let sanName = name;
        sanName = sanName.replace('Dipl.-Ing. ','')
        sanName = sanName.replace('Ing. ','')
        sanName = sanName.replace('Mag. ','')
        return sanName;
    }

    function craftEmailAddress(name) {
        let emailName = name;
        emailName = emailName.replace(' ','.');
        emailName = emailName.replace('ü','ue');
        emailName = emailName.replace('ö','oe');
        emailName = emailName.replace('ä','ae');
        emailName = emailName.toLowerCase();
        return emailName +"@"+ emailDomain;
    }

    ///
    /// Main instructions
    ///
    initGUIBox();

    if (company == "UNDEFINED") {
        setGUIBoxSpanText("statusspan", "Please set settings!", "red");
        return;
    } else {
        setGUIBoxSpanText("statusspan", "Looking for {0} employees..".format(company), "greenyellow");
    }

    // on the specified company pages, start scraping
    var bIsCompanyWebsite = ( window.location.href.startsWith("www.xing.com/pages/"+company, 8) );
    if (bIsCompanyWebsite) {
        setInterval(function() {
            $('div[data-xds=ProfileInfo]').each(function( index ) {
                let nametext = $(this).find('[data-xds=Headline]').text();
                let name = sanitizeName(nametext);
                let job = $(this).find('[data-xds=BodyCopy]').text();
                let mail = craftEmailAddress(name);
                let link = $(this).children('a')[0].href; link = link.substr(0,link.lastIndexOf('/')+1);
                if (debug) console.log("{0}: Name: {1} | Job: {2} | Mail: {3} | Link: {4}".format(index,name,job,mail,link));
                addCSVEntry(mail,name,job,company,link);
            });
        },10000);
    }

})();