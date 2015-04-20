// ==UserScript==
// @name DL/ORB Itinary Builder
// @namespace https://github.com/SteppoFF/ita-matrix-powertools
// @description Builds fare purchase links
// @version 0.11a
// @grant GM_getValue
// @grant GM_setValue
// @include http*://matrix.itasoftware.com/*
// ==/UserScript==
/*
 Written by paul21, Steppo & IAkH of FlyerTalk.com
 http://www.flyertalk.com/forum/members/paul21.html
 Includes contriutions by 18sas
 Copyright Reserved -- At least share with credit if you do
*********** Latest Changes **************
**** Version 0.11a ****
# 2015-14-20 Edited by Steppo (fixed Bug in findItinTarget for one-seg-flights,
                                fixed typo,
                                added CSS fix for startpage)
**** Version 0.11 ****
# 2015-04-19 Edited by Steppo (added SeatGuru,
                                added Planefinder,
                                moved translation to external var/function adding capability to add translations,
                                added possibility to print notifications,
                                added self-test to prevent crashing on class-changes,
                                set timeout of resultpage to 10s,
                                added powerfull selector-function to get desired td in itin => see findItinTarget,
                                moved exit in frames to top,
                                some cleanups,
                                moved older changelogitems to seperate file on GitHub - no one wants to read such lame stuff :-) )
                                
**** Version 0.10a ****
# 2015-04-05 Edited by RizwanK (Attempted to merge functionality from .user. and .console. into one file)
**** Version 0.10 ****
# 2015-03-31 Edited by IAkH/Steppo (Adapted to new classes)
*********** About **************
 --- Resultpage ---
  # collecting a lot of information in data-var
  # based on gathered data-var: creating links to different OTAs and other pages
  # able to transform timeformat into 24h format
  # able to translate some things
 *********** Hints ***********
  Unsure about handling of different fares/pax. 
  Unsure about correct usage of cabins while creating links.
  Unsure about correct usage of farebase-per-leg - usage in order of appearance.
  Unsere about segment-skipping - should be fine but needs heavy testing.
*/
/**************************************** Start Script *****************************************/
// User settings
var mptUsersettings = new Object();
mptUsersettings["timeformat"] = "12h"; // replaces times on resultpage - valid: 12h / 24h
mptUsersettings["language"] = "en"; // replaces several items on resultpage - valid: en / de
mptUsersettings["enableDeviders"] = 1; // Print deviders in links after group (airlines/otas/other stuff) - valid: 0 / 1
mptUsersettings["enableInlinemode"] =  0; // enables inline mode - valid: 0 / 1
mptUsersettings["enableIMGautoload"] = 0; // enables images to auto load - valid: 0 / 1
mptUsersettings["enableFarerules"] = 1; // enables fare rule opening in new window - valid: 0 / 1
mptUsersettings["enablePricebreakdown"] =  1; // enables price breakdown - valid: 0 / 1
mptUsersettings["acEdition"] = "us"; // sets the local edition of AirCanada.com for itinerary pricing - valid: "us", "ca", "ar", "au", "ch", "cl", "cn", "co", "de", "dk", "es", "fr", "gb", "hk", "ie", "il", "it", "jp", "mx", "nl", "no", "pa", "pe", "se"

// *** DO NOT CHANGE BELOW THIS LINE***/
// General settings
var mptSettings = new Object();
mptSettings["itaLanguage"]="en";
mptSettings["retrycount"]=1;
mptSettings["laststatus"]="";
mptSettings["scriptrunning"]=1;

if (typeof GM_info === "undefined") {
   mptSettings["scriptEngine"]=0; // console mode
  }
else {
  if (window.top != window.self) exit; //don't run on frames or iframes and exit as soon as possible
  mptSettings["scriptEngine"]=1; // tamper or grease mode
  var mptSavedUsersettings = GM_getValue("mptUsersettings", "");
  if (mptSavedUsersettings) {
    mptSavedUsersettings = JSON.parse(mptSavedUsersettings);
    mptUsersettings["timeformat"] = mptSavedUsersettings["timeformat"] || mptUsersettings["timeformat"];
    mptUsersettings["language"] = mptSavedUsersettings["language"] || mptUsersettings["language"];
    mptUsersettings["enableDeviders"]=(mptSavedUsersettings["enableDeviders"] === undefined ? mptUsersettings["enableDeviders"] : mptSavedUsersettings["enableDeviders"]); // had a mysterious bug here?!
    mptUsersettings["enableInlinemode"] = mptSavedUsersettings["enableInlinemode"] || mptUsersettings["enableInlinemode"];
    mptUsersettings["enableIMGautoload"] = mptSavedUsersettings["enableIMGautoload"] || mptUsersettings["enableIMGautoload"];
    mptUsersettings["enableFarerules"] = mptSavedUsersettings["enableFarerules"] || mptUsersettings["enableFarerules"];
    mptUsersettings["enablePricebreakdown"] = mptSavedUsersettings["enablePricebreakdown"] || mptUsersettings["enablePricebreakdown"];
    mptUsersettings["acEdition"] = mptSavedUsersettings["acEdition"] || mptUsersettings["acEdition"];    
  }
}

var acEditions = ["us", "ca", "ar", "au", "ch", "cl", "cn", "co", "de", "dk", "es", "fr", "gb", "hk", "ie", "il", "it", "jp", "mx", "nl", "no", "pa", "pe", "se"];

var classSettings = new Object();
classSettings["startpage"] = new Object();
classSettings["startpage"]["maindiv"]="FNGTPEB-w-d"; //Container of main content. Unfortunately id "contentwrapper" is used twice
classSettings["resultpage"] = new Object();
classSettings["resultpage"]["itin"]="FNGTPEB-A-d"; //Container with headline: "Intinerary"
classSettings["resultpage"]["itinRow"]="FNGTPEB-k-i"; // TR in itin with Orig, Dest and date
classSettings["resultpage"]["milagecontainer"]="FNGTPEB-A-e"; // Container on the right
classSettings["resultpage"]["rulescontainer"]="FNGTPEB-l-d"; // First container before rulelinks (the one with Fare X:)
classSettings["resultpage"]["htbContainer"]="FNGTPEB-F-k"; // full "how to buy"-container inner div (td=>div=>div) 
classSettings["resultpage"]["htbLeft"]="FNGTPEB-l-g"; // Left column in the "how to buy"-container
classSettings["resultpage"]["htbRight"]="FNGTPEB-l-f"; // Class for normal right column
classSettings["resultpage"]["htbGreyBorder"]="FNGTPEB-l-l"; // Class for right cell with light grey border (used for subtotal of passenger)
//inline
classSettings["resultpage"]["mcDiv"]="FNGTPEB-U-e";  // Right menu sections class (3 divs surrounding entire Mileage, Emissions, and Airport Info)
classSettings["resultpage"]["mcHeader"]="FNGTPEB-U-b"; // Right menu header class ("Mileage", etc.)
classSettings["resultpage"]["mcLinkList"]="FNGTPEB-y-c"; // Right menu ul list class (immediately following header)


var translations = new Object();
translations["de"] = new Object();
translations["de"]["openwith"]="&Ouml;ffne mit";
translations["de"]["resultpage"] = new Object();
translations["de"]["resultpage"]["Dep:"]="Abflug:";
translations["de"]["resultpage"]["Arr:"]="Ankunft:";
translations["de"]["resultpage"]["Layover in"]="Umst. in";
translations["de"]["resultpage"][" to "]=" nach ";
translations["de"]["resultpage"]["Mon,"]="Mo.,";
translations["de"]["resultpage"]["Tue,"]="Di.,";
translations["de"]["resultpage"]["Wed,"]="Mi.,";
translations["de"]["resultpage"]["Thu,"]="Do.,";
translations["de"]["resultpage"]["Fri,"]="Fr.,";
translations["de"]["resultpage"]["Sat,"]="Sa.,";
translations["de"]["resultpage"]["Sun,"]="So.,";
translations["de"]["resultpage"][" Jan "]=" Januar ";
translations["de"]["resultpage"][" Feb "]=" Februar ";
translations["de"]["resultpage"][" Mar "]=" M&auml;rz ";
translations["de"]["resultpage"][" Apr "]=" April ";
translations["de"]["resultpage"][" May "]=" Mai ";
translations["de"]["resultpage"][" Jun "]=" Juni ";
translations["de"]["resultpage"][" Jul "]=" Juli ";
translations["de"]["resultpage"][" Aug "]=" August ";
translations["de"]["resultpage"][" Sep "]=" September ";
translations["de"]["resultpage"][" Oct "]=" Oktober ";
translations["de"]["resultpage"][" Nov "]=" November ";
translations["de"]["resultpage"][" Dez "]=" Dezember ";
translations["de"]["resultpage"]["OPERATED BY "]="Durchgef&uuml;hrt von ";

if (mptSettings["scriptEngine"] === 0) {
 startScript(); 
} else {
  // execute language detection and afterwards functions for current page
  if (window.addEventListener){
  window.addEventListener('load', startScript, false);
  } else if (window.attachEvent)
  window.attachEvent("onload", startScript);
  else {
  window.onload = startScript;
  }
}

function startScript(){
  if (document.getElementById("mptSettingsContainer")== null ) {
  createUsersettings();
  }
  if (window.location.href!=mptSettings["laststatus"]){
    setTimeout(function(){getPageLang();}, 100);
    mptSettings["laststatus"]=window.location.href;
  }
  if (mptSettings["scriptrunning"]==1){
   setTimeout(function(){startScript();}, 500); 
  }  
}

/**************************************** Settings Stuff *****************************************/
function createUsersettings(){
    var settingscontainer = document.createElement('div');
    settingscontainer.setAttribute('id', 'mptSettingsContainer');
    settingscontainer.setAttribute('style', 'border-bottom: 1px dashed grey;');
    settingscontainer.innerHTML = '<div><div style="display:inline-block;float:left;">Powertools running</div><div id="mtpNotification" style="margin-left:50px;display:inline-block;"></div><div id="settingsvistoggler" style="display:inline-block;float:right;cursor:pointer;">Show/Hide Settings</div><div id="mptSettings" class="invis" style="display:none;border-top: 1px dotted grey;"><div>';
    var target=document.getElementById("contentwrapper");
    target.parentNode.insertBefore(settingscontainer, target);
    document.getElementById('settingsvistoggler').onclick=function(){toggleSettingsvis();};
    target=document.getElementById("mptSettings");
    target.innerHTML ='<span id="mpttimeformat" style="cursor:pointer;">Timeformat:<span>'+printSettingsvalue("timeformat")+'</span></span><br>';   
    target.innerHTML +='<span id="mptlanguage" style="cursor:pointer;">Language:<span>'+printSettingsvalue("language")+'</span></span><br>';
    target.innerHTML +='<span id="mptenableDeviders" style="cursor:pointer;">Enable deviders:<span>'+printSettingsvalue("enableDeviders")+'</span></span><br>';
    target.innerHTML +='<span id="mptenableInlinemode" style="cursor:pointer;">Inlinemode:<span>'+printSettingsvalue("enableInlinemode")+'</span></span><br>';
    target.innerHTML +='<span id="mptenableIMGautoload" style="cursor:pointer;">Images autoload:<span>'+printSettingsvalue("enableIMGautoload")+'</span></span><br>';
    target.innerHTML +='<span id="mptenableFarerules" style="cursor:pointer;">Farerules in new window:<span>'+printSettingsvalue("enableFarerules")+'</span></span><br>';
    target.innerHTML +='<span id="mptenablePricebreakdown" style="cursor:pointer;">Price breakdown:<span>'+printSettingsvalue("enablePricebreakdown")+'</span></span><br>';
    target.innerHTML +='<span id="mptacEdition" style="cursor:pointer;">Air Canada Edition:<span>'+printSettingsvalue("acEdition")+'</span></span>';
    document.getElementById('mpttimeformat').onclick=function(){toggleSettings("timeformat");};
    document.getElementById('mptlanguage').onclick=function(){toggleSettings("language");};
    document.getElementById('mptenableDeviders').onclick=function(){toggleSettings("enableDeviders");};
    document.getElementById('mptenableInlinemode').onclick=function(){toggleSettings("enableInlinemode");};
    document.getElementById('mptenableIMGautoload').onclick=function(){toggleSettings("enableIMGautoload");};
    document.getElementById('mptenableFarerules').onclick=function(){toggleSettings("enableFarerules");};
    document.getElementById('mptenablePricebreakdown').onclick=function(){toggleSettings("enablePricebreakdown");};
    document.getElementById('mptacEdition').onclick=function(){toggleSettings("acEdition");};
}
function toggleSettingsvis(){
  var target=document.getElementById("mptSettings");
  if (hasClass(target,"vis")){
    target.setAttribute('class', 'invis');
    target.style.display="none"; 
  } else {
    target.setAttribute('class', 'vis');
    target.style.display="block"; 
  }
}
function toggleSettings(target){
   switch(target) {
      case "timeformat":
         if (mptUsersettings["timeformat"]=="12h"){
           mptUsersettings["timeformat"]="24h";
         } else {
           mptUsersettings["timeformat"]="12h";
         }
          break;
      case "language":
         if (mptUsersettings["language"]=="de"){
           mptUsersettings["language"]="en";
         } else {
           mptUsersettings["language"]="de";
         }
          break;
      case "acEdition":
      		if (acEditions.indexOf(mptUsersettings["acEdition"]) == (acEditions.length - 1)) {
			      mptUsersettings["acEdition"] = acEditions[0];
      		} else {
      			mptUsersettings["acEdition"] = acEditions[(acEditions.indexOf(mptUsersettings["acEdition"]) + 1)];	
      		}
      	break;
      default:
        if (mptUsersettings[target]==1){
           mptUsersettings[target]=0;
         } else {
           mptUsersettings[target]=1;
         };
  }
  document.getElementById("mpt"+target).firstChild.nextSibling.innerHTML=printSettingsvalue(target);
  if (mptSettings["scriptEngine"] === 1) {
      GM_setValue("mptUsersettings", JSON.stringify(mptUsersettings));
    }
}

function printSettingsvalue(target){
   var ret="";
   switch(target) {
      case "timeformat":
          ret=mptUsersettings["timeformat"];
          break;
      case "language":
          ret=mptUsersettings["language"];
          break;
      case "acEdition":
          ret=mptUsersettings["acEdition"];
          break;
      default:
          ret=boolToEnabled(mptUsersettings[target]);
  }
  return ret; 
}

function printNotification(text) {
  var target = document.getElementById('mtpNotification');
  if (target===null){
    alert("mtp Error: Notification container not Found");
  } else {
   if (text=="empty"){
     target.innerHTML= "";
   } else {
     //possibility to print multiple notifications
     target.innerHTML= target.innerHTML+"<div>"+text+"</div>";
   }   
  } 
}
/**************************************** Get Language *****************************************/
function getPageLang(){
    // reset Notification due to pagechange
    printNotification("empty");
    mptSettings["itaLanguage"]="en";
    mptSettings["retrycount"]=1;
    if (window.location.href.indexOf("view-details") !=-1) {
       setTimeout(function(){fePS();}, 200);   
    } else if (window.location.href.indexOf("#search:") !=-1 || window.location.href == "https://matrix.itasoftware.com/" || window.location.href == "https://matrix.itasoftware.com/") {
       setTimeout(function(){startPage();}, 200);   
    }
}

/**************************************** General Functions *****************************************/
//Parses all of the outputs of regexp matches into an array
function exRE(str,re){
  var ret= new Array();
  var m;
  var i=0;
  while( (m = re.exec(str)) != null ) {
  if (m.index === re.lastIndex) {
  re.lastIndex++;
  }
  for (k=1;k<m.length;k++) {
  ret[i++]=m[k];
  }
  }
  return ret;
}
function inArray(needle, haystack) {
    var length = haystack.length;
    for(var i = 0; i < length; i++) {
        if(haystack[i] == needle) return true;
    }
    return false;
}
function monthnameToNumber(month){
  var monthnames=["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP","OCT", "NOV", "DEC"];
  return (monthnames.indexOf(month.toUpperCase())+1);
}
function monthnumberToName(month){
  var monthnames=["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP","OCT", "NOV", "DEC"];
  return (monthnames[month-1]);
}
function getFlightYear(day,month){
 //Do date magic
    var d = new Date();
    var cmonth=d.getMonth();
    var cday=d.getDate();
    var cyear=d.getFullYear();
  // make sure to handle the 0-11 issue of getMonth()
    if (cmonth > (month-1) || (cmonth == (month-1) && day < cday)) {
    cyear += 1; //The flight is next year
    }
   return cyear;
}
function return12htime(match){
        var regex = /([01]?\d)(:\d{2})(AM|PM|am|pm| AM| PM| am| pm)/g;
        match = regex.exec(match);
        var offset = 0;
        match[3]=trimStr(match[3]);
        if  ((match[3]=='AM' || match[3]=='am') && match[1]=='12'){offset = -12;}
        else if  ((match[3]=='PM' || match[3]=='pm') && match[1]!='12'){ offset = 12;}
        return (+match[1] + offset) +match[2];        
};
function trimStr(x) {
    return x.replace(/^\s+|\s+$/gm,'');
}
function boolToEnabled(value){
   if (value==1) {
   return "enabled"
   } else {
   return "disabled"
   }
}
function getcabincode(cabin){
  switch(cabin) {
      case "E":
          cabin=0;
          break;
      case "P":
          cabin=1;
          break;
      case "B":
          cabin=2;
          break;
      case "F":
          cabin=3;
          break;
      default:
          cabin=0;
  }
  return cabin;
}
function findtarget(tclass,nth){
  var elems = document.getElementsByTagName('*'), i;
  j=0;
  for (i in elems) {
       if((' ' + elems[i].className + ' ').indexOf(' '+tclass+' ') > -1) {
        j++;
        if (j==nth){
         return elems[i];
         break;
        }
       }
   }
}

function findtargets(tclass){
  var elems = document.getElementsByTagName('*'), i;
  var ret = new Array();
  for (i in elems) {
       if((' ' + elems[i].className + ' ').indexOf(' '+tclass+' ') > -1) {
         ret.push(elems[i]);
       }
   }
  return ret;
}

function hasClass(element, cls) {
  return (' ' + element.className + ' ').indexOf(' ' + cls + ' ') > -1;
}

function findItinTarget(leg,seg,tcell){
  var target = findtarget(classSettings["resultpage"]["itin"],1);
  if (target === false) {
  printNotification("Error: Itin not found in findItinTarget-function");
  return false;
  }
  
  target=target.nextSibling.nextSibling;
  // go to leg
  var target=target.children[(leg-1)];
  if (target === undefined) {
  printNotification("Error: Leg not found in findItinTarget-function");
  return false;
  }
  // go to segments of leg
  target=target.children[1].children;
  if (target.length >= 2) {
      // go to desired segment
      var index = 0;
      var j = 0;
      for(i=0;i<target.length;i++) {
       if( hasClass(target[i], classSettings["resultpage"]["itinRow"]) == 1) {
         j++;
          if (j>=seg){
            index = i;
            //special handling for one-seg-legs here
            if (target.length === 2 || target.length === 3){
              // 1. Headline 2. Flight-details 3. arrival next day.. 
              index--;
            }
            break;
          }
        }
      } // end-for
      if (i==target.length){
        //target not found
        printNotification("Error: Call to unreachable Segment in Leg "+leg+" in findItinTarget-function");
        return false;
      }
      var rowoffset=0;
      var columnoffset=0;
      
      switch(tcell) {
          case "headline":
              // special case here allways first row... even in one-seg-legs
              rowoffset= index * -1;
              columnoffset=1;
              break;          
          case "logo":
              rowoffset=0;
              columnoffset=0;
              break;
          case "airportsdate":
              rowoffset=0;
              columnoffset=1;
              break;
          case "flight":
              rowoffset=1;
              columnoffset=0;
              break;
          case "deptime":
              rowoffset=1;
              columnoffset=1;
              break;
          case "arrtime":
              rowoffset=1;
              columnoffset=2;
              break;
          case "duration":
              rowoffset=1;
              columnoffset=2;
              break;          
          case "plane":
              rowoffset=1;
              columnoffset=4;
              break;
          case "cabin":
              rowoffset=1;
              columnoffset=5;
              break;  
          default:
              printNotification("Error: Unknown Target in findItinTarget-function");
              return false;
      }
      return target[index+rowoffset].children[columnoffset];    
  } else {
     printNotification("Error: Unknown error in findItinTarget-function");
     return false;
  }  
}
/********************************************* Start page *********************************************/
function startPage() {
    // try to get content  
    if (findtarget( classSettings["startpage"]["maindiv"],1)===undefined){
      printNotification("Error: Unable to find content on start page.");
      return false;
    } else {
      // apply style-fix
      target = findtarget( classSettings["startpage"]["maindiv"],1);
      target.children[0].children[0].children[0].children[0].setAttribute('valign', 'top');
    }
  
}

/********************************************* Result page *********************************************/
//Primary function for extracting flight data from ITA/Matrix
function fePS() {
    // try to get content
    if (findtarget(classSettings["resultpage"]["itin"],1)===undefined){
      printNotification("Error: Unable to find Content on result page.");
      return false;
    }
    // retry if itin not loaded  
    if (findtarget(classSettings["resultpage"]["itin"],1).parentNode.previousSibling.previousSibling.style.display!="none") { 
      mptSettings["retrycount"]++;
      if (mptSettings["retrycount"]>50) {
        printNotification("Error: Timeout on result page. Content not found after 10s.");
        return false;
      };
      setTimeout(function(){fePS();}, 200);    
      return false;
    };
    // do some self-testing to prevent crashing on class-changes
    for (i in classSettings["resultpage"]) {
       if (findtarget(classSettings["resultpage"][i],1) === undefined) {
          printNotification("Error: Unable to find class "+classSettings["resultpage"][i]+" for "+i+".");
          return false;                  
       }
   }
   
   
    if (mptUsersettings["enableFarerules"]==1) bindRulelinks();
       
    // empty outputcontainer
    if (document.getElementById('powertoolslinkcontainer')!=undefined){
        var div = document.getElementById('powertoolslinkcontainer');
        div.innerHTML ="";
    }
	
    // remove powertool items
  	var elems = findtargets('powertoolsitem');
  	for(var i = elems.length - 1; i >= 0; i--){
  		elems[i].parentNode.removeChild(elems[i]);
  	}
    
    // configure sidebar
    if (mptUsersettings["enableInlinemode"]==1) {
    findtarget(classSettings["resultpage"]["milagecontainer"],1).setAttribute('rowspan', 10);
    //findtarget('GE-ODR-BET',1).setAttribute('class', 'GE-ODR-BBFB');
    } else if (mptUsersettings["enableInlinemode"]==0 && mptUsersettings["enablePricebreakdown"]==1) {
      findtarget(classSettings["resultpage"]["milagecontainer"],1).setAttribute('rowspan', 3);
    } else {
      findtarget(classSettings["resultpage"]["milagecontainer"],1).setAttribute('rowspan', 2);
    }
  
    var data = readItinerary();
    // Translate page
    if (mptUsersettings["language"]!=="en" && translations[mptUsersettings["language"]]["resultpage"]!==undefined) translate("resultpage",mptUsersettings["language"],findtarget(classSettings["resultpage"]["itin"],1).nextSibling.nextSibling);
    // Search - Remove - Add Pricebreakdown
    var target=findtarget('pricebreakdown',1);
    if (target!=undefined) target.parentNode.removeChild(target);
    if (mptUsersettings["enablePricebreakdown"]==1) rearrangeprices(data.dist);
    if (mptUsersettings["enableInlinemode"]==1) printCPM(data);
	 
    printAC(data);
    
    if (data["itin"].length == 2 &&
        data["itin"][0]["orig"] == data["itin"][1]["dest"] &&
        data["itin"][0]["dest"] == data["itin"][1]["orig"]) {
        printAF(data);
    }
  
    // we print AZ if its only on AZ-flights
    if (data["carriers"].length==1 && data["carriers"][0]=="AZ"){
      printAZ(data);
    }
  
    printDelta(data);
    
    printKL(data);
    
    printUA(data);
  
    // we print US if its only on US-flights
    if (data["carriers"].length==1 && data["carriers"][0]=="US"){
      printUS(data);
    }
  
    if(mptUsersettings["enableDeviders"]==1) printSeperator();
  
    printOrbitz(data);

    printHipmunk (data);

    printPriceline (data);
  
    if(mptUsersettings["enableDeviders"]==1) printSeperator();
  
    /*** Farefreaksstuff ****/
    printFarefreaks (data,0);
    printFarefreaks (data,1);

    /*** GCM ****/
    printGCM (data);

    /*** Seatguru ****/
    bindSeatguru(data);
  
    /*** Planefinder ****/
    bindPlanefinder(data);
}
    //*** Rulelinks ****//
function bindRulelinks(){
    var i = 0;
    var j = 0;
    var t = 1;
    var target=findtarget(classSettings["resultpage"]["rulescontainer"],t);
    if (target!=undefined){
      do {
          var current=Number(target.firstChild.innerHTML.replace(/[^\d]/gi, ""));
          if (i>current){
            j++;
            i=0;  
          }
          target=target.nextSibling.nextSibling.nextSibling;
          var targeturl = window.location.href.replace(/view-details/, "view-rules")+";fare-key="+j+"/"+i;
          var newlink = document.createElement('a');
          newlink.setAttribute('class', 'gwt-Anchor');
          newlink.setAttribute('href', targeturl);
          newlink.setAttribute('target', "_blank");
          var linkText = document.createTextNode("rules");
          newlink.appendChild(linkText);
          target.parentNode.replaceChild(newlink,target);    
          i++;
          t++;
          target=findtarget(classSettings["resultpage"]["rulescontainer"],t);
      }
      while (target!=undefined);  
    }   
}
    //*** Price breackdown ****//
function rearrangeprices(dist){
    var basefares = 0;
    var taxes = 0;
    var surcharges =0;
    var basefound=0;
    var cur="";
    // define searchpattern to detect carrier imposed surcharges
    var searchpatt = new RegExp("\((YQ|YR)\)");
    var t=1;
    var target=findtarget(classSettings["resultpage"]["htbLeft"],t);
    if (mptUsersettings["enableInlinemode"] == 0){
     var output="";
     var count=0;
    }
    if (target!=undefined){
      do {    
          var type = target.firstChild.firstChild.nodeType;
          if (type == 1) {
            basefound=1;
            //it's a basefare
            var price = Number(target.nextSibling.firstChild.innerHTML.replace(/[^\d]/gi, ""));
            if (cur=="") cur=target.nextSibling.firstChild.innerHTML.replace(/[\d,.]/g, "");
            basefares+=price;
          } else if(basefound==1 && type == 3) {
            //its a pricenode
            var name  = target.firstChild.innerHTML;    
            var price = Number(target.nextSibling.firstChild.innerHTML.replace(/[^\d]/gi, ""));            
            if( hasClass(target.nextSibling, classSettings["resultpage"]["htbGreyBorder"]) == 1) {
             //we are done for this container
              //console.log( "Basefare: "+ basefares);    
              //console.log( "Taxes: "+ taxes); 
              //console.log( "Surcharges: "+ surcharges);
              var sum=basefares+taxes+surcharges;
              if (mptUsersettings["enableInlinemode"] == 1){
                  var newtr = document.createElement('tr');
                  newtr.innerHTML = '<td class="'+classSettings["resultpage"]["htbLeft"]+'"><div class="gwt-Label">Basefare per passenger ('+((basefares/sum)*100).toFixed(2).toString()+'%)</div></td><td class="'+classSettings["resultpage"]["htbGreyBorder"]+'"><div class="gwt-Label">'+cur+(basefares/100).toFixed(2).toString().replace(/\d(?=(\d{3})+\.)/g, '$&,')+'</div></td>';
                  target.parentNode.parentNode.insertBefore(newtr, target.parentNode);  
                  var newtr = document.createElement('tr');
                  newtr.innerHTML = '<td class="'+classSettings["resultpage"]["htbLeft"]+'"><div class="gwt-Label">Taxes per passenger ('+((taxes/sum)*100).toFixed(2).toString()+'%)</div></td><td class="'+classSettings["resultpage"]["htbRight"]+'"><div class="gwt-Label">'+cur+(taxes/100).toFixed(2).toString().replace(/\d(?=(\d{3})+\.)/g, '$&,')+'</div></td>';
                  target.parentNode.parentNode.insertBefore(newtr, target.parentNode); 
                  var newtr = document.createElement('tr');
                  newtr.innerHTML = '<td class="'+classSettings["resultpage"]["htbLeft"]+'"><div class="gwt-Label">Surcharges per passenger ('+((surcharges/sum)*100).toFixed(2).toString()+'%)</div></td><td class="'+classSettings["resultpage"]["htbRight"]+'"><div class="gwt-Label">'+cur+(surcharges/100).toFixed(2).toString().replace(/\d(?=(\d{3})+\.)/g, '$&,')+'</div></td>';
                  target.parentNode.parentNode.insertBefore(newtr, target.parentNode);  
                  var newtr = document.createElement('tr');
                  newtr.innerHTML = '<td class="'+classSettings["resultpage"]["htbLeft"]+'"><div class="gwt-Label">Basefare + Taxes per passenger ('+(((basefares+taxes)/sum)*100).toFixed(2).toString()+'%)</div></td><td class="'+classSettings["resultpage"]["htbGreyBorder"]+'"><div class="gwt-Label">'+cur+((basefares+taxes)/100).toFixed(2).toString().replace(/\d(?=(\d{3})+\.)/g, '$&,')+'</div></td>';
                  target.parentNode.parentNode.insertBefore(newtr, target.parentNode); 
              } else {
                 count++;
                 output +='<table style="float:left; margin-right:15px;"><tbody>';
                 output +='<tr><td colspan=3 style="text-align:center;">Price breakdown '+count+':</td></tr>';
                 output +='<tr><td>CPM</td><td colspan=2 style="text-align:center;">'+cur+((sum/dist)/100).toFixed(4).toString()+'</td></tr>';
                 output +='<tr><td>Basefare</td><td style="padding:0px 3px;text-align:right;">'+((basefares/sum)*100).toFixed(1).toString()+'%</td><td style="text-align:right;">'+cur+(basefares/100).toFixed(2).toString().replace(/\d(?=(\d{3})+\.)/g, '$&,')+"</td></tr>";
                 output +='<tr><td>Tax</td><td style="padding:0px 3px;text-align:right;">'+((taxes/sum)*100).toFixed(1).toString()+'%</td><td style="text-align:right;">'+cur+(taxes/100).toFixed(2).toString().replace(/\d(?=(\d{3})+\.)/g, '$&,')+"</td></tr>";
                 output +='<tr><td>Surcharges</td><td style="padding:0px 3px;text-align:right;">'+((surcharges/sum)*100).toFixed(1).toString()+'%</td><td style="text-align:right;">'+cur+(surcharges/100).toFixed(2).toString().replace(/\d(?=(\d{3})+\.)/g, '$&,')+"</td></tr>";
                 output +='<tr><td style="border-top: 1px solid #878787;padding:2px 0">Bf+Tax</td><td style="border-top: 1px solid #878787;padding:2px 3px;text-align:right;">'+(((basefares+taxes)/sum)*100).toFixed(1).toString()+'%</td><td style="border-top: 1px solid #878787;padding:2px 0; text-align:right;">'+cur+((basefares+taxes)/100).toFixed(2).toString().replace(/\d(?=(\d{3})+\.)/g, '$&,')+"</td></tr>";
                 output +="</tbody></table>"; 
              }
      
              // reset var
              basefound=0;
              basefares = 0;
              taxes = 0;
              surcharges =0;         
            } else {
              //Carrier surcharge?
              if (searchpatt.test(name)===true){
               surcharges+=price; 
              } else {
               taxes+=price; 
              }           
            }
          }    
          t++;
          target=findtarget(classSettings["resultpage"]["htbLeft"],t);
      }
      while (target!=undefined);  
    }
    if (mptUsersettings["enableInlinemode"] == 0){
      var printtarget=findtarget(classSettings["resultpage"]["htbContainer"],1).parentNode.parentNode.parentNode;
      var newtr = document.createElement('tr');
      newtr.setAttribute('class','pricebreakdown');
      newtr.innerHTML = '<td><div>'+output+'</div></td>';
      printtarget.parentNode.insertBefore(newtr, printtarget); 
    }
}
  //*** Readfunction ****//
function parseAddInfo(info){
  var ret= {codeshare:0, layoverduration:0, airportchange:0, arrDate:""};
  if (info.indexOf("This flight contains airport changes") ==-1){
               airportchange=1; 
              }
  if (info.indexOf("OPERATED BY") ==-1){
               codeshare=1; 
              }
  var temp = new Array();
  var re=/\,\s*([a-zA-Z]{3})\s*([0-9]{1,2})/g;
  temp = exRE(info,re);
  if (temp.length == 2){
    // Got datechange
      ret["arrDate"]={};
      ret["arrDate"]["month"]=monthnameToNumber(temp[0]);
      ret["arrDate"]["day"]=parseInt(temp[1]);
      ret["arrDate"]["year"]=getFlightYear(ret["arrDate"]["day"],ret["arrDate"]["month"]);
    }
  var temp = new Array();
  var re=/([0-9]{1,2})h\s([0-9]{1,2})m/g;
  temp = exRE(info,re);
  if (temp.length == 2){
     // Got layover
      ret["layoverduration"]=parseInt(temp[0])*60 + parseInt(temp[1]);
    }
  return ret;
}

function readItinerary(){
      // the magical part! :-)
      var replacementsold = new Array();
      var replacementsnew = new Array();

      var itin= new Array();
      var carrieruarray= new Array();
      var html = document.getElementById("contentwrapper").innerHTML;
      var re=/colspan\=\"5\"[^\(]+\(([\w]{3})[^\(]+\(([\w]{3})/g
      legs = exRE(html,re);
      // Got our outer legs now:
      for(i=0;i<legs.length;i+=2) {
        var legobj={};
        // prepare all elements but fill later
        legobj["arr"]={};
        legobj["dep"]={};
        legobj["orig"]=legs[i];
        legobj["dest"]=legs[i+1];
        legobj["seg"]= new Array();
        itin.push(legobj);
      }
      // extract basefares
      var farebases = new Array();
      var re=/Carrier\s[\w]{2}\s([\w]+).*?Covers\s([\w\(\)\s\-,]+)/g;
      farebases = exRE(html,re);
      var fareBaseLegs = { fares :new Array(), legs:new Array()};
      for(i=0;i<farebases.length;i+=2) {
        fareBaseLegs["fares"].push(farebases[i]);
        // find the covered airports
        fareBaseLegs["legs"].push(exRE(farebases[i+1],/(\w\w\w\-\w\w\w)/g));
      }
      var dirtyFare= new Array();  
      // dirty but handy for later usage since there is no each function
      for(var i=0;i<fareBaseLegs["legs"].length;i++) {
              for(var j=0;j<fareBaseLegs["legs"][i].length;j++) {
               dirtyFare.push(fareBaseLegs["legs"][i][j]+"-"+fareBaseLegs["fares"][i]);
              }
        }   
      var segs = new Array();
      var re=/35px\/(\w{2}).png[^\(]+\(([A-Z]{3})[^\(]+\(([A-Z]{3})[^\,]*\,\s*([a-zA-Z]{3})\s*([0-9]{1,2}).*?gwt-Label.*?([0-9]*)\<.*?Dep:[^0-9]+(.*?)\<.*?Arr:[^0-9]+(.*?)\<.*?([0-9]{1,2})h\s([0-9]{1,2})m.*?gwt-Label.*?\<.*?gwt-Label\"\>(\w).*?\((\w)\).*?\<.*?tr(.*?)(table|airline_logos)/g;
      segs = exRE(html,re);
      // used massive regex to get all our segment-info in one extraction
      var legnr=0;
      var segnr=0;
      for(i=0;i<segs.length;i+=14) {
            temp={};
            temp["carrier"]=segs[i];
            temp["orig"]=segs[i+1];
            temp["dest"]=segs[i+2];
            temp["dep"]={};
            temp["arr"]={};
            temp["dep"]["month"]=monthnameToNumber(segs[i+3]);
            temp["dep"]["day"]=parseInt(segs[i+4]);
            temp["dep"]["year"]=getFlightYear(temp["dep"]["day"],temp["dep"]["month"]);
            temp["fnr"]=segs[i+5];      
            if (mptUsersettings["timeformat"]=="24h") {
                 replacementsold.push(segs[i+6]);
                 replacementsold.push(segs[i+7]); 
                }
            segs[i+6]=return12htime(segs[i+6]);
            segs[i+7]=return12htime(segs[i+7]);
            if (mptUsersettings["timeformat"]=="24h") {          
                  replacementsnew.push((segs[i+6].length==4? "0":"")+segs[i+6]) ;
                  replacementsnew.push((segs[i+7].length==4? "0":"")+segs[i+7]);
                }
            temp["dep"]["time"]=segs[i+6];  
            temp["arr"]["time"]=segs[i+7];  
            temp["duration"]=parseInt(segs[i+8])*60 + parseInt(segs[i+9]);
            temp["cabin"]=getcabincode(segs[i+10]);   
            temp["bookingclass"]=segs[i+11];
            var addinformations=parseAddInfo(segs[i+12]);  
            if (addinformations["arrDate"]!=""){
            temp["arr"]["day"]=addinformations["arrDate"]["day"];
            temp["arr"]["month"]=addinformations["arrDate"]["month"];
            temp["arr"]["year"]=addinformations["arrDate"]["year"]; 
            } else {
            temp["arr"]["day"]=temp["dep"]["day"];
            temp["arr"]["month"]=temp["dep"]["month"];
            temp["arr"]["year"]=temp["dep"]["year"];
            }
            temp["codeshare"]=addinformations["codeshare"];
            temp["layoverduration"]=addinformations["layoverduration"];  
            temp["airportchange"]=addinformations["airportchange"];
            // find farecode for leg
             for(var j=0;j<dirtyFare.length;j++) {
                 if (dirtyFare[j].indexOf(temp["orig"]+"-"+temp["dest"]+"-")!= -1) {
                    //found farebase of this segment
                     temp["farebase"]=dirtyFare[j].replace(temp["orig"]+"-"+temp["dest"]+"-","");
                     dirtyFare[j]=temp["farebase"]; // avoid reuse
                     j=dirtyFare.length;
                     }
             }
            itin[legnr]["seg"].push(temp);     
            // push carrier
            if (!inArray(temp["carrier"],carrieruarray)) {carrieruarray.push(temp["carrier"]);};
            // push dates and times into leg-array
            if ( segnr == 0 ){
              itin[legnr]["dep"]["day"]=temp["dep"]["day"];
              itin[legnr]["dep"]["month"]=temp["dep"]["month"];
              itin[legnr]["dep"]["year"]=temp["dep"]["year"];
              itin[legnr]["dep"]["time"]=temp["dep"]["time"];
            }
            itin[legnr]["arr"]["day"]=temp["arr"]["day"];
            itin[legnr]["arr"]["month"]=temp["arr"]["month"];
            itin[legnr]["arr"]["year"]=temp["arr"]["year"];
            itin[legnr]["arr"]["time"]=temp["arr"]["time"];
            segnr++;
            // check for legchange
            if(segs[i+13]=="table") {
              legnr++;
              segnr=0;
            }

      }
      // extract mileage paxcount and total price
      var milepaxprice = new Array();
      var re=/Mileage[^0-9]+([0-9,]+).*?Total\scost\sfor\s([0-9])\spassenger[^0-9]+([0-9,.]+)/g;
      milepaxprice = exRE(html,re);
      // detect currency
      itinCur="";
      var re = /Total\scost\sfor\s[0-9]\spassenger([^0-9]+[^\<]+)/g;
      var curstring=new Array();
      curstring = exRE(html,re);
      curstring=curstring[0].replace(/<[^>]+>/g,"")
      var searchpatt = /\€/;
      if (searchpatt.test(curstring)===true){
            itinCur="EUR";
                    }
      var searchpatt = /US\$/;
      if (searchpatt.test(curstring)===true){
            itinCur="USD";
                    }
      data={itin:itin, price: milepaxprice[2].replace(/\,/g,""), numPax:milepaxprice[1] , carriers:carrieruarray, cur : itinCur, farebases:fareBaseLegs["fares"], dist:milepaxprice[0].replace(/\./g,"").replace(/\,/g,"")}; 
      //console.log(data); //Remove to see flightstructure 
      // lets do the time-replacement
       if(replacementsold.length>0) {
         target=findtarget(classSettings["resultpage"]["itin"],1).nextSibling.nextSibling;
         for(i=0;i<replacementsold.length;i++) {
           re = new RegExp(replacementsold[i],"g");
           target.innerHTML = target.innerHTML.replace(re, replacementsnew[i]);
         }
       }
      return data;
}  

//*** Printfunctions ****//
function translate(page,lang,target){
       if (translations[lang]===undefined){
         printNotification("Error: Translation "+lang+" not found");
         return false;
       }
       if (translations[lang][page]===undefined){
         printNotification("Error: Translation "+lang+" not found for page "+page);
         return false;
       }
      for (i in translations[lang][page]) {
           re = new RegExp(i,"g");
           target.innerHTML = target.innerHTML.replace(re, translations[lang][page][i]);
       }  
}

function printCPM(data){
  printItemInline((Number(data.price) / Number(data.dist)).toFixed(4) + ' cpm','',1);
}
function getDeltaCabin(cabin){
// 0 = Economy; 1=Premium Economy; 2=Business; 3=First
// // B5-Coach / B2-Business on DL
  switch(cabin) {
      case 2:
          cabin="B2-Business";
          break;
      case 3:
          cabin="B2-Business";
          break;
      default:
          cabin="B5-Coach";
  }
  return cabin;
}  
function printDelta(data){
// Steppo: Cabincodefunction needs some care!?
// Steppo: What about farebasis?
// Steppo: What about segmentskipping?
    var deltaURL ="http://"+(mptSettings["itaLanguage"]=="de" || mptUsersettings["language"]=="de" ? "de" : "www");
    deltaURL +=".delta.com/booking/priceItin.do?dispatchMethod=priceItin&tripType=multiCity&cabin=B5-Coach";
    deltaURL +="&currencyCd=" + (data["cur"]=="EUR" ? "EUR" : "USD") + "&exitCountry="+(mptSettings["itaLanguage"]=="de" || mptUsersettings["language"]=="de" ? "US" : "US");
    var segcounter=0;
    for (var i=0;i<data["itin"].length;i++) {
      // walks each leg
       for (var j=0;j<data["itin"][i]["seg"].length;j++) {
         //walks each segment of leg
        deltaURL +="&itinSegment["+segcounter.toString()+"]="+i.toString()+":"+data["itin"][i]["seg"][j]["bookingclass"];
        deltaURL +=":"+data["itin"][i]["seg"][j]["orig"]+":"+data["itin"][i]["seg"][j]["dest"]+":"+data["itin"][i]["seg"][j]["carrier"]+":"+data["itin"][i]["seg"][j]["fnr"];
        deltaURL +=":"+monthnumberToName(data["itin"][i]["seg"][j]["dep"]["month"])+":"+ ( data["itin"][i]["seg"][j]["dep"]["day"] < 10 ? "0":"") +data["itin"][i]["seg"][j]["dep"]["day"]+":"+data["itin"][i]["seg"][j]["dep"]["year"]+":0";
        segcounter++; 
      }
    }
    deltaURL += "&fareBasis="+data["farebases"].toString().replace(/,/g, ":");
    deltaURL += "&price=0";
    deltaURL += "&numOfSegments=" + segcounter.toString() + "&paxCount=" + data["numPax"];
    deltaURL += "&vendorRedirectFlag=true&vendorID=Google";      
    if (mptUsersettings["enableInlinemode"]==1){
     printUrlInline(deltaURL,"Delta","");
    } else {
     printUrl(deltaURL,"Delta","");
    }    
}
function printAF(data) {
  var afUrl = 'https://www.airfrance.com/';
  var flights="";
  if (mptSettings["itaLanguage"]=="de"||mptUsersettings["language"]=="de"){
    afUrl += 'DE/de';
    } else {
    afUrl += 'US/en';
   }
  afUrl += '/local/process/standardbooking/DisplayUpsellAction.do?cabin=Y&calendarSearch=1&listPaxTypo=ADT&subCabin=MCHER&typeTrip=2';
  afUrl += '&nbPax=' + data["numPax"];
  for (var i=0; i < data['itin'].length; i++) {
    if (i == 0) {
      afUrl += '&from='+data['itin'][i]['orig'];
      afUrl += '&to='+data['itin'][i]['dest'];
      afUrl += '&outboundDate='+data['itin'][i]['dep']['year']+'-'+('0'+data['itin'][i]['dep']['month']).slice(-2)+'-'+('0'+data['itin'][i]['dep']['day']).slice(-2);
      afUrl += '&firstOutboundHour='+('0'+data['itin'][i]['dep']['time']).slice(-5);
      
      flights = '';
      for (var j=0; j < data['itin'][i]['seg'].length; j++) {
        if (j > 0) flights += '|';
        flights += data['itin'][i]['seg'][j]['carrier'] + ('000'+data['itin'][i]['seg'][j]['fnr']).slice(-4);
      }
      afUrl += '&flightOutbound=' + flights;
    }
    else if (i == 1) {
      afUrl += '&inboundDate='+data['itin'][i]['dep']['year']+'-'+('0'+data['itin'][i]['dep']['month']).slice(-2)+'-'+('0'+data['itin'][i]['dep']['day']).slice(-2);
      afUrl += '&firstInboundHour='+('0'+data['itin'][i]['dep']['time']).slice(-5);
      
      flights = '';
      for (var j=0; j < data['itin'][i]['seg'].length; j++) {
        if (j > 0) flights += '|';
        flights += data['itin'][i]['seg'][j]['carrier'] + ('000'+data['itin'][i]['seg'][j]['fnr']).slice(-4);
      }
      afUrl += '&flightInbound=' + flights;
    }
  }
  if (mptUsersettings["enableInlinemode"]==1){
    printUrlInline(afUrl,"Air France","");
  } else {
    printUrl(afUrl,"Air France","");
  }
}
function printAZ(data) {
  var azUrl = 'http://booking.alitalia.com/Booking/'+(mptSettings["itaLanguage"]=='de'||mptUsersettings["language"]=='de'?'de_de':'us_en')+'/Flight/ExtMetaSearch?SearchType=BrandMetasearch';
  azUrl += '&children_number=0&Children=0&newborn_number=0&Infants=0';
  azUrl += '&adult_number='+data["numPax"]+'&Adults='+data["numPax"];
  var seg = 0;
  for (var i=0; i < data['itin'].length; i++) {
    for (var j=0; j < data['itin'][i]['seg'].length; j++) {
      azUrl += '&MetaSearchDestinations['+seg+'].From='         +data['itin'][i]['seg'][j]['orig'];
      azUrl += '&MetaSearchDestinations['+seg+'].to='           +data['itin'][i]['seg'][j]['dest'];
      azUrl += '&MetaSearchDestinations['+seg+'].DepartureDate='+data['itin'][i]['seg'][j]['dep']['year']+'-'+('0'+data['itin'][i]['seg'][j]['dep']['month']).slice(-2)+'-'+('0'+data['itin'][i]['seg'][j]['dep']['day']).slice(-2);
      azUrl += '&MetaSearchDestinations['+seg+'].Flight='       +data['itin'][i]['seg'][j]['fnr']
      azUrl += '&MetaSearchDestinations['+seg+'].code='         +data['itin'][i]['seg'][j]['farebase'];
      azUrl += '&MetaSearchDestinations['+seg+'].slices='       +i;
      seg++;
    }
  }
  
  if (mptUsersettings["enableInlinemode"]==1){
   printUrlInline(azUrl,"Alitalia","");
  } else {
   printUrl(azUrl,"Alitalia","");
  } 
}
function printKL(data) {
  var klUrl = 'https://www.klm.com/travel/';
   if (mptSettings["itaLanguage"]=="de"||mptUsersettings["language"]=="de"){
    klUrl += 'de_de/apps/ebt/ebt_home.htm?lang=DE';
    } else {
    klUrl += 'us_en/apps/ebt/ebt_home.htm?lang=EN';
    }
  klUrl += '&chdQty=0&infQty=0&dev=5&cffcc=ECONOMY';
  var fb = '';
  var oper = '';
  klUrl += '&adtQty=' + data["numPax"];
  for (var i=0; i < data['itin'].length; i++) {
    klUrl += '&c['+i+'].os='+data['itin'][i]['orig'];
    klUrl += '&c['+i+'].ds='+data['itin'][i]['dest'];
    klUrl += '&c['+i+'].dd='+data['itin'][i]['dep']['year']+'-'+('0'+data['itin'][i]['dep']['month']).slice(-2)+'-'+('0'+data['itin'][i]['dep']['day']).slice(-2);   
    if (i > 0) oper += '..';
    for (var j=0; j < data['itin'][i]['seg'].length; j++) {
      klUrl += '&c['+i+'].s['+j+'].os='+data['itin'][i]['seg'][j]['orig'];
      klUrl += '&c['+i+'].s['+j+'].ds='+data['itin'][i]['seg'][j]['dest'];
      klUrl += '&c['+i+'].s['+j+'].dd='+data['itin'][i]['seg'][j]['dep']['year']+'-'+('0'+data['itin'][i]['seg'][j]['dep']['month']).slice(-2)+'-'+('0'+data['itin'][i]['seg'][j]['dep']['day']).slice(-2);
      klUrl += '&c['+i+'].s['+j+'].dt='+('0'+data['itin'][i]['seg'][j]['dep']['time'].replace(':','')).slice(-4);
      klUrl += '&c['+i+'].s['+j+'].mc='+data['itin'][i]['seg'][j]['carrier'];
      klUrl += '&c['+i+'].s['+j+'].fn='+('000'+data['itin'][i]['seg'][j]['fnr']).slice(-4);
      
      if (j > 0) oper += '.';
      oper += data['itin'][i]['seg'][j]['carrier'];
    }
  }
  
  for (var i=0; i < data['farebases'].length; i++) {
    if (i > 0) fb += ',';
    fb += data['farebases'][i];
  }
  
  klUrl += '&ref=fb='+fb;//+',oper='+oper;
    if (mptUsersettings["enableInlinemode"]==1){
     printUrlInline(klUrl,"KLM","");
    } else {
     printUrl(klUrl,"KLM","");
    } 
}
function getOrbitzCabin(cabin){
// 0 = Economy; 1=Premium Economy; 2=Business; 3=First
// C - Coach / B - Business / F - First on ORB
  switch(cabin) {
      case 2:
          cabin="B";
          break;
      case 3:
          cabin="F";
          break;
      default:
          cabin="C";
  }
  return cabin;
}
function printOrbitz(data){
    // Steppo: This should be fine
    var selectKey="";
    var orbitzUrl = "/shop/home?type=air&source=GOOGLE_META&searchHost=ITA&ar.type=multiCity&strm=true";
    //Build multi-city search based on legs
  
    for (var i=0;i<data["itin"].length;i++) {
      // walks each leg
            var iStr = i.toString();
            orbitzUrl += "&ar.mc.slc["+iStr+"].orig.key=" + data["itin"][i]["orig"];
            orbitzUrl += "&_ar.mc.slc["+iStr+"].originRadius=0";
            orbitzUrl += "&ar.mc.slc["+iStr+"].dest.key=" + data["itin"][i]["dest"];
            orbitzUrl += "&_ar.mc.slc["+iStr+"].destinationRadius=0";
            var twoyear = data["itin"][i]["dep"]["year"]%100;
            orbitzUrl += "&ar.mc.slc["+iStr+"].date=" + data["itin"][i]["dep"]["month"].toString() + "/" + data["itin"][i]["dep"]["day"].toString() + "/" + twoyear.toString();
            orbitzUrl += "&ar.mc.slc["+iStr+"].time=Anytime"; 
        
       for (var j=0;j<data["itin"][i]["seg"].length;j++) {
         //walks each segment of leg
                var k=0;
                // lets have a look if we need to skip segments - Flightnumber has to be the same and it must be just a layover
                while ((j+k)<data["itin"][i]["seg"].length-1){
                 if (data["itin"][i]["seg"][j+k]["fnr"] != data["itin"][i]["seg"][j+k+1]["fnr"] || 
                     data["itin"][i]["seg"][j+k]["layoverduration"] >= 1440) break;
                 k++;
                }               
                selectKey += data["itin"][i]["seg"][j]["carrier"] + data["itin"][i]["seg"][j]["fnr"] + data["itin"][i]["seg"][j]["orig"] + data["itin"][i]["seg"][j+k]["dest"] + ( data["itin"][i]["seg"][j]["dep"]["month"] < 10 ? "0":"") + data["itin"][i]["seg"][j]["dep"]["month"] +  ( data["itin"][i]["seg"][j]["dep"]["day"] < 10 ? "0":"") + data["itin"][i]["seg"][j]["dep"]["day"] + getOrbitzCabin(data["itin"][i]["seg"][j]["cabin"]);
                selectKey += "_";                      
                j+=k;
      }
    }

  orbitzUrl += "&ar.mc.numAdult=" + data["numPax"];
    orbitzUrl += "&ar.mc.numSenior=0&ar.mc.numChild=0&ar.mc.child[0]=&ar.mc.child[1]=&ar.mc.child[2]=&ar.mc.child[3]=&ar.mc.child[4]=&ar.mc.child[5]=&ar.mc.child[6]=&ar.mc.child[7]=&search=Search Flights&ar.mc.nonStop=true&_ar.mc.nonStop=0";
    //lets see if we can narrow the carriers  Orbitz supports up to 3
    if (data["carriers"].length <= 3) {
      orbitzUrl += "&_ar.mc.narrowSel=1&ar.mc.narrow=airlines";
      for (var i = 0; i< 3;i++){
          if (i<data["carriers"].length){
          orbitzUrl += "&ar.mc.carriers["+i+"]="+data["carriers"][i];
          } else {
          orbitzUrl += "&ar.mc.carriers["+i+"]=";
          }       
      }
    } else {
      orbitzUrl += "&_ar.mc.narrowSel=0&ar.mc.narrow=airlines&ar.mc.carriers[0]=&ar.mc.carriers[1]=&ar.mc.carriers[2]=";
    }
    orbitzUrl += "&ar.mc.cabin=C";
    orbitzUrl += "&selectKey=" + selectKey.substring(0,selectKey.length-1);
    if (data["cur"]=="USD") {
    //lets do this when USD is cur
    var priceval = parseFloat(data["price"]) + 6.99;
    orbitzUrl += "&userRate.price=USD|" + priceval.toString();
    }
    if (mptUsersettings["enableInlinemode"]==1){
      printUrlInline("http://www.cheaptickets.com"+orbitzUrl,"Cheaptickets","");
      printUrlInline("http://www.orbitz.com"+orbitzUrl,"Orbitz","");
    } else {
      printUrl("http://www.cheaptickets.com"+orbitzUrl,"Cheaptickets","");
      printUrl("http://www.orbitz.com"+orbitzUrl,"Orbitz","");
    }    
}
function getUACabin(cabin){
// 0 = Economy; 1=Premium Economy; 2=Business; 3=First
// Coach - Coach / Business - Business / First - First on UA
  switch(cabin) {
      case 2:
          cabin="Business";
          break;
      case 3:
          cabin="First";
          break;
      default:
          cabin="Coach";
  }
  return cabin;
}
function printUA(data){
var uaUrl='{\"post\": {\"pax\": '+data["numPax"];
uaUrl += ', \"trips\": [';
    for (var i=0;i<data["itin"].length;i++) {
      var minCabin=3;
      uaUrl += '{\"origin\": \"'+data["itin"][i]["orig"]+'\", \"dest\": \"'+data["itin"][i]["dest"]+'\", \"dep_date\": \"'+data["itin"][i]["dep"]["month"]+'/'+data["itin"][i]["dep"]["day"]+'/'+data["itin"][i]["dep"]["year"]+'\", \"segments\": [';
      // walks each leg
       for (var j=0;j<data["itin"][i]["seg"].length;j++) {
         //walks each segment of leg
          var k = 0;
         // lets have a look if we need to skip segments - Flightnumber has to be the same and it must be just a layover
          while ((j+k)<data["itin"][i]["seg"].length-1){
          if (data["itin"][i]["seg"][j+k]["fnr"] != data["itin"][i]["seg"][j+k+1]["fnr"] || 
                   data["itin"][i]["seg"][j+k]["layoverduration"] >= 1440) break;
                 k++;
          }
          uaUrl += '{\"origin\": \"'+data["itin"][i]["seg"][j]["orig"]+'\", \"dep_date\": \"'+ data["itin"][i]["seg"][j]["dep"]["month"].toString() +'/'+ data["itin"][i]["seg"][j]["dep"]["day"].toString() +'/'+data["itin"][i]["seg"][j]["dep"]["year"].toString() +'\", \"dest_date\": \" \", \"dest\": \"'+data["itin"][i]["seg"][j+k]["dest"]+'\", ';
          uaUrl += '\"flight_num\": '+data["itin"][i]["seg"][j]["fnr"]+', \"carrier\": \"'+data["itin"][i]["seg"][j]["carrier"]+'\", \"fare_code\": \"'+data["itin"][i]["seg"][j]["farebase"]+'\"},';         
          if (data["itin"][i]["seg"][j]["cabin"] < minCabin) {minCabin=data["itin"][i]["seg"][j]["cabin"];};
          j+=k; 
      }
      uaUrl = uaUrl.substring(0,uaUrl.length-1)+'],\"cabin\": \"'+getUACabin(minCabin)+'\"},';
    }
    uaUrl = 'https://www.hipmunk.com/bookjs?booking_info=' + encodeURIComponent(uaUrl.substring(0,uaUrl.length-1) +']}, \"kind\": \"flight\", \"provider_code\": \"UA\" }');
        if (mptUsersettings["language"]=="de"){
        desc="Kopiere den Link bei Hipmunk";
      } else {
        desc="Copy Link in Text, via Hipmunk";
      }     
    if (mptUsersettings["enableInlinemode"]==1){
      printUrlInline(uaUrl,"United",desc);
    } else {
      printUrl(uaUrl,"United",desc);
    }
}
function printAC(data){
  var acUrl = 'http://www.aircanada.com/aco/flights.do?AH_IATA_NUMBER=0005118&AVAIL_EMMBEDDED_TRANSACTION=FlexPricerAvailabilityServlet'
    if (mptSettings["itaLanguage"]=="de"||mptUsersettings["language"]=="de"){
    acUrl += '&country=DE&countryOfResidence=DE&language=de&LANGUAGE=DE';
    } else {
    	acUrl += '&country=' + mptUsersettings["acEdition"].toUpperCase() + '&countryofResidence=' + mptUsersettings["acEdition"].toUpperCase() + '&language=en&LANGUAGE=US';
    }
  acUrl += '&CREATION_MODE=30&EMBEDDED_TRANSACTION=FareServelet&FareRequest=YES&fromThirdParty=YES&HAS_INFANT_1=False&IS_PRIMARY_TRAVELLER_1=True&SITE=SAADSAAD&thirdPartyID=0005118&TRAVELER_TYPE_1=ADT&PRICING_MODE=0';
  acUrl += '&numberOfChildren=0&numberOfInfants=0&numberOfYouth=0&numberOfAdults=' + data["numPax"];
  acUrl += '&tripType=' + (data['itin'].length > 1 ? 'R' : 'O');
  for (var i=0; i < data['itin'].length; i++) {
    if (i == 0) {
      acUrl += '&departure1='+('0'+data['itin'][i]['dep']['day']).slice(-2)+'/'+('0'+data['itin'][i]['dep']['month']).slice(-2)+'/'+data['itin'][i]['dep']['year']+'&org1='+data['itin'][i]['orig']+'&dest1='+data['itin'][i]['dest'];
    }
    else if (i == 1) {
      acUrl += '&departure2='+('0'+data['itin'][i]['dep']['day']).slice(-2)+'/'+('0'+data['itin'][i]['dep']['month']).slice(-2)+'/'+data['itin'][i]['dep']['year'];
    }
    
    for (var j=0; j < data['itin'][i]['seg'].length; j++) {
      acUrl += '&AIRLINE_'      +(i+1)+'_'+(j+1)+'='+data['itin'][i]['seg'][j]['carrier'];
      acUrl += '&B_DATE_'       +(i+1)+'_'+(j+1)+'='+data['itin'][i]['seg'][j]['dep']['year']+('0'+data['itin'][i]['seg'][j]['dep']['month']).slice(-2)+('0'+data['itin'][i]['seg'][j]['dep']['day']).slice(-2)+('0'+data['itin'][i]['seg'][j]['dep']['time'].replace(':','')).slice(-4);
      acUrl += '&B_LOCATION_'   +(i+1)+'_'+(j+1)+'='+data['itin'][i]['seg'][j]['orig'];
      acUrl += '&E_DATE_'       +(i+1)+'_'+(j+1)+'='+data['itin'][i]['seg'][j]['arr']['year']+('0'+data['itin'][i]['seg'][j]['arr']['month']).slice(-2)+('0'+data['itin'][i]['seg'][j]['arr']['day']).slice(-2)+('0'+data['itin'][i]['seg'][j]['arr']['time'].replace(':','')).slice(-4);
      acUrl += '&E_LOCATION_'   +(i+1)+'_'+(j+1)+'='+data['itin'][i]['seg'][j]['dest'];
      acUrl += '&FLIGHT_NUMBER_'+(i+1)+'_'+(j+1)+'='+data['itin'][i]['seg'][j]['fnr'];
      acUrl += '&RBD_'          +(i+1)+'_'+(j+1)+'='+data['itin'][i]['seg'][j]['bookingclass'];
    }
  }
    if (mptUsersettings["enableInlinemode"]==1){
      printUrlInline(acUrl,"Air Canada","");
    } else {
      printUrl(acUrl,"Air Canada","");
    }
}
function getUSCabin(cabin){
  // 0 = Economy; 1=Premium Economy; 2=Business; 3=First
  switch(cabin) {
      case 2:
          cabin="B";
          break;
      case 3:
          cabin="F";
          break;
      default:
          cabin="C";
  }
  return cabin;
}
function printUS(data){
// Steppo: is class of service implemented correct?
// Steppo: legskipping necessary?

    var usUrl = "https://shopping.usairways.com/Flights/Passenger.aspx?g=goo&c=goog_US_pax";
    usUrl += "&a=" + data["numPax"];
    usUrl += "&s=" + getUSCabin(data["itin"][0]["seg"][0]["cabin"]).toLowerCase();

    for (var i=0;i<data["itin"].length;i++) {
      // walks each leg
       for (var j=0;j<data["itin"][i]["seg"].length;j++) {
         //walks each segment of leg
        var segstr = (i+1).toString()+(j+1).toString();
        usUrl += "&o"+segstr+"=" + data["itin"][i]["seg"][j]["orig"] + "&d"+segstr+"=" + data["itin"][i]["seg"][j]["dest"] + "&f"+segstr+"=" + data["itin"][i]["seg"][j]["fnr"];
        usUrl += "&t"+segstr+"=" + data["itin"][i]["seg"][j]["dep"]["year"] + (data["itin"][i]["seg"][j]["dep"]["month"] < 10 ? "0":"" )+ data["itin"][i]["seg"][j]["dep"]["month"] +(data["itin"][i]["seg"][j]["dep"]["day"] < 10 ? "0":"" ) + data["itin"][i]["seg"][j]["dep"]["day"] + "0000";
        usUrl += "&x"+segstr+"=" + data["itin"][i]["seg"][j]["farebase"];
      }
    }   
    if (mptUsersettings["enableInlinemode"]==1){
      printUrlInline(usUrl,"US Airways","");
    } else {
      printUrl(usUrl,"US Airways","");
    }
}
function printFarefreaks (data,method){
// Should be fine
// method: 0 = based on leg; 1 = based on segment
    var carrieruarray = new Array();
    var mincabin=3;
    var segsize=0;  
    var farefreaksurl = "https://www.farefreaks.com/landing/landing.php?";
    if (mptSettings["itaLanguage"]=="de"||mptUsersettings["language"]=="de"){
    farefreaksurl +="lang=de";
    } else {
    farefreaksurl +="lang=en";
    }
    farefreaksurl += "&target=flightsearch&referrer=matrix";
    for (var i=0;i<data["itin"].length;i++) {
        if (method!=1){
          farefreaksurl += "&orig["+segsize+"]=" + data["itin"][i]["orig"];
          farefreaksurl += "&dest["+segsize+"]=" + data["itin"][i]["dest"];
          farefreaksurl += "&date["+segsize+"]="+data["itin"][i]["dep"]["year"].toString() + "-" + data["itin"][i]["dep"]["month"] + "-" + data["itin"][i]["dep"]["day"] + "_"+data["itin"][i]["dep"]["time"]+":00";
          farefreaksurl += "&validtime["+segsize+"]=1";
          segsize++; 
        } 
       for (var j=0;j<data["itin"][i]["seg"].length;j++) {
        if (method==1){
          var k=0;
          // lets have a look if we need to skip segments - Flightnumber has to be the same and it must be just a layover
          while ((j+k)<data["itin"][i]["seg"].length-1){
          if (data["itin"][i]["seg"][j+k]["fnr"] != data["itin"][i]["seg"][j+k+1]["fnr"] || 
                   data["itin"][i]["seg"][j+k]["layoverduration"] >= 1440) break;
                 k++;
          }
          farefreaksurl += "&orig["+segsize+"]=" + data["itin"][i]["seg"][j]["orig"];
          farefreaksurl += "&dest["+segsize+"]=" + data["itin"][i]["seg"][j+k]["dest"];
          farefreaksurl += "&date["+segsize+"]="+data["itin"][i]["seg"][j]["dep"]["year"].toString() + "-" + data["itin"][i]["seg"][j]["dep"]["month"] + "-" + data["itin"][i]["seg"][j]["dep"]["day"] + "_"+data["itin"][i]["seg"][j]["dep"]["time"]+":00";
          farefreaksurl += "&validtime["+segsize+"]=1";
          segsize++;
          j+=k;  
        }         
        if (data["itin"][i]["seg"][j]["cabin"]<mincabin){mincabin=data["itin"][i]["seg"][j]["cabin"];};  
        if (!inArray(data["itin"][i]["seg"][j]["carrier"],carrieruarray)){carrieruarray.push(data["itin"][i]["seg"][j]["carrier"]);};  
      }
    }
    farefreaksurl += "&adult="+data["numPax"];  
    farefreaksurl += "&cabin="+mincabin;  
    farefreaksurl += "&child=0&childage[]=&flexible=0";
    if (method==1){  
      farefreaksurl += "&nonstop=1";
      if (mptUsersettings["language"]=="de"){
        desc="Benutze "+segsize+" Segment(e)";
      } else {
        desc="Based on "+segsize+" segment(s)";
      }
      
    } else {
      if (segsize==1) {
        return false;
      }
      farefreaksurl += "&nonstop=0";  
      if (mptUsersettings["language"]=="de"){
        desc="Benutze "+segsize+" Abschnitt(e)";
      } else {
        desc="Based on "+segsize+" segment(s)";
      }
    }
    if (carrieruarray.length <= 3) {farefreaksurl += "&carrier="+ carrieruarray.toString();}
    
    if (mptUsersettings["enableInlinemode"]==1 && segsize<=6){
      printUrlInline(farefreaksurl,"Farefreaks",desc);
    } else if (segsize<=6) {
      printUrl(farefreaksurl,"Farefreaks",desc);
    }    
}
function printGCM (data){
    var url = '';
    // Build multi-city search based on segments
    // Keeping continous path as long as possible 
    for (var i=0;i<data["itin"].length;i++) {
      for (var j=0;j<data["itin"][i]["seg"].length;j++) {
        url+=data["itin"][i]["seg"][j]["orig"]+"-";
        if (j+1<data["itin"][i]["seg"].length){
          if (data["itin"][i]["seg"][j]["dest"] != data["itin"][i]["seg"][(j+1)]["orig"]){url+=data["itin"][i]["seg"][j]["dest"]+";";};
        } else {
         url+=data["itin"][i]["seg"][j]["dest"]+";";
        }    
      }
    }
  if (mptUsersettings["enableInlinemode"]==1){
      printImageInline('http://www.gcmap.com/map?MR=900&MX=182x182&PM=*&P='+url, 'http://www.gcmap.com/mapui?P='+url);
  } else {
      printUrl("http://www.gcmap.com/mapui?P="+url,"GCM","");
  }
}
function getHipmunkCabin(cabin){
  // 0 = Economy; 1=Premium Economy; 2=Business; 3=First
  switch(cabin) {
      case 2:
          cabin="Business";
          break;
      case 3:
          cabin="First";
          break;
      default:
          cabin="Coach";
  }
  return cabin;
}
function printHipmunk (data){
    var url = "https://www.hipmunk.com/search/flights?";
    var mincabin=3;
    //Build multi-city search based on legs
    for (var i=0;i<data["itin"].length;i++) {
      // walks each leg
            url += "&from"+i+"=" + data["itin"][i]["orig"];            
            for (var j=0;j<data["itin"][i]["seg"].length;j++) {
           //walks each segment of leg
                var k=0;
                // lets have a look if we need to skip segments - Flightnumber has to be the same and it must be just a layover
                while ((j+k)<data["itin"][i]["seg"].length-1){
                 if (data["itin"][i]["seg"][j+k]["fnr"] != data["itin"][i]["seg"][j+k+1]["fnr"] || 
                     data["itin"][i]["seg"][j+k]["layoverduration"] >= 1440) break;
                 k++;
                }               
                url += ( j>0 ? "%20"+data["itin"][i]["seg"][j]["orig"]+"%20":"%3A%3A")+data["itin"][i]["seg"][j]["carrier"] + data["itin"][i]["seg"][j]["fnr"];
                if (data["itin"][i]["seg"][j]["cabin"]<mincabin){mincabin=data["itin"][i]["seg"][j]["cabin"];};  
                j+=k;
      }
      url += "&date"+i+"="+data["itin"][i]["dep"]["year"]+"-"+( Number(data["itin"][i]["dep"]["month"]) <= 9 ? "0":"") +data["itin"][i]["dep"]["month"].toString()+"-"+ ( Number(data["itin"][i]["dep"]["day"]) <= 9 ? "0":"") +data["itin"][i]["dep"]["day"].toString();  
      url += "&to"+i+"="+data["itin"][i]["dest"];
    }  
    url += "&pax=" + data["numPax"]+"&cabin="+getHipmunkCabin(mincabin)+"&infant_lap=0&infant_seat=0&seniors=0&children=0";    
    if (mptUsersettings["enableInlinemode"]==1){
      printUrlInline(url,"Hipmunk","");
    } else {
      printUrl(url,"Hipmunk","");
    } 
}
function printPriceline (data){
    var url = "https://www.priceline.com/airlines/landingServlet?userAction=search";
    var pricelineurl="&TripType=MD&ProductID=1";
    // outer params
    pricelineurl+="&DepCity="+data["itin"][0]["orig"];
    pricelineurl+="&ArrCity="+data["itin"][0]["dest"];
    pricelineurl+="&DepartureDate="+(Number(data["itin"][0]["dep"]["month"]) <= 9 ? "0":"") +data["itin"][0]["dep"]["month"].toString()+"/"+(Number(data["itin"][0]["dep"]["day"]) <= 9 ? "0":"") +data["itin"][0]["dep"]["day"].toString()+"/"+data["itin"][0]["dep"]["year"].toString();
    var legsize=1;
    var segsize=1;
    var searchparam="<externalSearch>";
    for (var i=0;i<data["itin"].length;i++) {
      // walks each leg
      pricelineurl+="&MDCity_"+legsize.toString()+"="+data["itin"][i]["orig"];
      pricelineurl+="&DepDateMD"+legsize.toString()+"="+(Number(data["itin"][i]["dep"]["month"]) <= 9 ? "0":"") +data["itin"][i]["dep"]["month"].toString()+"/"+(Number(data["itin"][i]["dep"]["day"]) <= 9 ? "0":"") +data["itin"][i]["dep"]["day"].toString()+"/"+data["itin"][i]["dep"]["year"].toString();
      legsize++;
      pricelineurl+="&MDCity_"+legsize.toString()+"="+data["itin"][i]["dest"];
      pricelineurl+="&DepDateMD"+legsize.toString()+"="+(Number(data["itin"][i]["arr"]["month"]) <= 9 ? "0":"") +data["itin"][i]["arr"]["month"].toString()+"/"+(Number(data["itin"][i]["arr"]["day"]) <= 9 ? "0":"") +data["itin"][i]["arr"]["day"].toString()+"/"+data["itin"][i]["arr"]["year"].toString();
      legsize++;
      searchparam+="<slice>";    
       for (var j=0;j<data["itin"][i]["seg"].length;j++) {
         searchparam+="<segment>";  
                //walks each segment of leg
                var k=0;
                // lets have a look if we need to skip segments - Flightnumber has to be the same and it must be just a layover
                while ((j+k)<data["itin"][i]["seg"].length-1){
                if (data["itin"][i]["seg"][j+k]["fnr"] != data["itin"][i]["seg"][j+k+1]["fnr"] || 
                         data["itin"][i]["seg"][j+k]["layoverduration"] >= 1440) break;
                       k++;
                }
                searchparam+="<number>"+segsize.toString()+"</number>";
                searchparam+="<departDateTime>"+(Number(data["itin"][i]["seg"][j]["dep"]["month"]) <= 9 ? "0":"") +data["itin"][i]["seg"][j]["dep"]["month"].toString()+"/"+(Number(data["itin"][i]["seg"][j]["dep"]["day"]) <= 9 ? "0":"") +data["itin"][i]["seg"][j]["dep"]["day"].toString()+"/"+data["itin"][i]["seg"][j]["dep"]["year"].toString()+" "+data["itin"][i]["seg"][j]["dep"]["time"]+":00</departDateTime>";
                searchparam+="<arrivalDateTime>"+(Number(data["itin"][i]["seg"][j+k]["arr"]["month"]) <= 9 ? "0":"") +data["itin"][i]["seg"][j+k]["arr"]["month"].toString()+"/"+(Number(data["itin"][i]["seg"][j+k]["arr"]["day"]) <= 9 ? "0":"") +data["itin"][i]["seg"][j+k]["arr"]["day"].toString()+"/"+data["itin"][i]["seg"][j+k]["arr"]["year"].toString()+" "+data["itin"][i]["seg"][j+k]["arr"]["time"]+":00</arrivalDateTime>";
                searchparam+="<origAirportCode>"+data["itin"][i]["seg"][j]["orig"]+"</origAirportCode>";
                searchparam+="<destAirportCode>"+data["itin"][i]["seg"][j+k]["dest"]+"</destAirportCode>";
                searchparam+="<carrierCode>"+data["itin"][i]["seg"][j]["carrier"]+"</carrierCode>";
                searchparam+="<flightNumber>"+data["itin"][i]["seg"][j]["fnr"]+"</flightNumber>";
                searchparam+="<equipmentCode></equipmentCode>";
                searchparam+="<bookingClass>"+data["itin"][i]["seg"][j]["bookingclass"]+"</bookingClass>";         
                segsize++;
                j+=k;
         searchparam+="</segment>";
      }
      searchparam+="</slice>";
    }
   searchparam+="<numberOfTickets>"+data["numPax"]+"</numberOfTickets><cost><totalFare>0.00</totalFare><baseFare>0.00</baseFare><tax>0.00</tax><fee>0.00</fee></cost>";
   searchparam+="</externalSearch>";
   pricelineurl+="&NumTickets="+data["numPax"]+"&AirAffiliateSearch=";
   if (mptUsersettings["enableInlinemode"]==1){
      printUrlInline(url+pricelineurl+encodeURIComponent(searchparam),"Priceline","");
    } else {
      printUrl(url+pricelineurl+encodeURIComponent(searchparam),"Priceline","");
    }
}

function bindSeatguru(data){
  for (var i=0;i<data["itin"].length;i++) {
  // walks each leg      
    for (var j=0;j<data["itin"][i]["seg"].length;j++) {
       //walks each segment of leg
             var k=0;
             // lets have a look if we need to skip segments - Flightnumber has to be the same and it must be just a layover
             while ((j+k)<data["itin"][i]["seg"].length-1){
                 if (data["itin"][i]["seg"][j+k]["fnr"] != data["itin"][i]["seg"][j+k+1]["fnr"] || 
                     data["itin"][i]["seg"][j+k]["layoverduration"] >= 1440) break;
                 k++;
                }  
         // build the search to identify flight:
          var target = findItinTarget((i+1),(j+1),"plane");
          if (target===false) {
            printNotification("Error: Could not find target in bindSeatguru");
            return false;
          } else {
            var url='http://www.seatguru.com/findseatmap/findseatmap.php?carrier='+data['itin'][i]['seg'][j]['carrier']+'&flightno='+data['itin'][i]['seg'][j]['fnr']+'&date='+('0'+data['itin'][i]['seg'][j]['dep']['month']).slice(-2)+'%2F'+('0'+data['itin'][i]['seg'][j]['dep']['day']).slice(-2)+'%2F'+data['itin'][i]['seg'][j]['dep']['year']+'&from_loc='+data['itin'][i]['seg'][j]['orig'];
            target.children[0].innerHTML='<a href="'+url+'" target="_blank" style="text-decoration:none;color:black">'+target.children[0].innerHTML+"</a>";
          }
        j+=k;
      }
   }  
}

function bindPlanefinder(data){
  for (var i=0;i<data["itin"].length;i++) {
  // walks each leg      
    for (var j=0;j<data["itin"][i]["seg"].length;j++) {
       //walks each segment of leg
             var k=0;
             // lets have a look if we need to skip segments - Flightnumber has to be the same and it must be just a layover
             while ((j+k)<data["itin"][i]["seg"].length-1){
                 if (data["itin"][i]["seg"][j+k]["fnr"] != data["itin"][i]["seg"][j+k+1]["fnr"] || 
                     data["itin"][i]["seg"][j+k]["layoverduration"] >= 1440) break;
                 k++;
                }  
         // build the search to identify flight:
          var target = findItinTarget((i+1),(j+1),"flight");
          if (target===false) {
            printNotification("Error: Could not find target in bindPlanefinder");
            return false;
          } else {
            var url='http://www.planefinder.net/data/flight/'+data['itin'][i]['seg'][j]['carrier']+data['itin'][i]['seg'][j]['fnr'];
            target.children[0].innerHTML='<a href="'+url+'" target="_blank" style="text-decoration:none;color:black">'+target.children[0].innerHTML+"</a>";
          }
        j+=k;
      }
   }  
}

// Inline Stuff
function printUrlInline(url,text,desc,nth){
  var otext = '<a href="'+url+ '" target="_blank">';
  var valid=false;
  if (translations[mptUsersettings["language"]] !== undefined) {
    if (translations[mptUsersettings["language"]]["openwith"] !== undefined) {
      otext += translations[mptUsersettings["language"]]["openwith"];
      valid=true;
    }
  }
  otext+=(valid===false ? "Open with":"");
  otext+=' '+text+'</a>'; 
  printItemInline(otext,desc,nth);
}
function printItemInline(text,desc,nth){
  div = getSidebarContainer(nth);
  div.innerHTML = div.innerHTML + '<li class="powertoolsitem">'+text+(desc ? '<br/><small>('+desc+')</small>' : '')+'</li>';
}
function printImageInline(src,url,nth){
  div = getSidebarContainer(nth).parentNode;
   if (mptUsersettings["enableIMGautoload"] == 1) {
    div.innerHTML = div.innerHTML + (url?'<a href="'+url+ '" target="_blank" class="powertoolsitem">':'')+'<img src="'+src+'" style="margin-top:10px;"'+(!url?' class="powertoolsitem"':'')+'/>'+(url?'</a>':'');      
   } else {
     var id=Math.random();
     div.innerHTML = div.innerHTML + '<div id="'+id+'" class="powertoolsitem" style="width:184px;height:100px;background-color:white;cursor:pointer;text-align:center;margin-top:10px;padding-top:84px;"><span>Click</span></div>';
     document.getElementById(id).onclick=function(){
       var newdiv = document.createElement('div');
       newdiv.setAttribute('class','powertoolsitem');
       newdiv.innerHTML =(url?'<a href="'+url+ '" target="_blank">':'')+'<img src="'+src+'" style="margin-top:10px;"'+(!url?' class="powertoolsitem"':'')+'/>'+(url?'</a>':'');
       document.getElementById(id).parentNode.replaceChild(newdiv,document.getElementById(id));
      };   
   } 
}
function getSidebarContainer(nth){
  var div = !nth || nth >= 4 ? document.getElementById('powertoolslinkinlinecontainer') : findtarget(classSettings["resultpage"]["mcHeader"], nth).nextElementSibling;
  return div ||createUrlContainerInline();
}
function createUrlContainerInline(){
  var newdiv = document.createElement('div');
  newdiv.setAttribute('class',classSettings["resultpage"]["mcDiv"]);
  newdiv.innerHTML = '<div class="'+classSettings["resultpage"]["mcHeader"]+'">Powertools</div><ul id="powertoolslinkinlinecontainer" class="'+classSettings["resultpage"]["mcLinkList"]+'"></ul>';
  findtarget(classSettings["resultpage"]["mcDiv"],1).parentNode.appendChild(newdiv);
  return document.getElementById('powertoolslinkinlinecontainer');
}
// Printing Stuff
function printUrl(url,name,desc) {
    if (document.getElementById('powertoolslinkcontainer')==undefined){
    createUrlContainer();
    }
  var text = "<br><font size=3><bold><a href=\""+url+ "\" target=_blank>";
  var valid=false;
  if (translations[mptUsersettings["language"]] !== undefined) {
    if (translations[mptUsersettings["language"]]["openwith"] !== undefined) {
      text += translations[mptUsersettings["language"]]["openwith"];
      valid=true;
    }
  }
  text+=(valid===false ? "Open with":"");
  text+=" "+name+"</a></font></bold>"+(desc ? "<br>("+desc+")<br>" : "<br>");  
  var div = document.getElementById('powertoolslinkcontainer');
  div.innerHTML = div.innerHTML + text;
}
function createUrlContainer(){
  var newdiv = document.createElement('div');
  newdiv.setAttribute('id','powertoolslinkcontainer');
  newdiv.setAttribute('style','margin-left:10px;');
  findtarget(classSettings["resultpage"]["htbContainer"],1).parentNode.parentNode.parentNode.appendChild(newdiv);
}
function printSeperator() {
  var container = document.getElementById('powertoolslinkcontainer') || getSidebarContainer();
  if (container) {
    container.innerHTML = container.innerHTML + (mptUsersettings["enableInlinemode"] ? '<hr class="powertoolsitem"/>' : '<br/><hr/>');
  }
}
