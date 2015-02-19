// ==UserScript==
// @name DL/ORB Itinary Builder
// @namespace http://matrix.itasoftware.com
// @description Builds fare purchase links
// @version 0.7n
// @grant none
// @include http://matrix.itasoftware.com/*
// ==/UserScript==

/*
The CONSOLE version is designed to maintain minify support for execution in the command line of browsers
(Thus may have special unicode restrictions for OS which do not support copying outside of 7-8bit ASCII)
*/

/*
 Written by paul21 & Steppo of FlyerTalk.com
 http://www.flyertalk.com/forum/members/paul21.html
 Includes contriutions by 18sas
 Copyright Reserved -- At least share with credit if you do

*********** Changelog **************
**** Version 0.7n ****
# 2015-02-11 Edited by Steppo (Bugfix for Hipmunk,
                                added Priceline)
# 2015-01-12 Edited by Steppo (Added Hipmunk,
                                fixed massive bug in leg detection)
# 2015-01-03 Edited by Steppo (Fixed double execution bug caused by iframe of google,
                                removed searchpage & calendar,
                                removed unused functions,
                                serveral other cleanups
                                               *** Note ***
                                Started to rewrite the extraction-function but stopped.
                                I think google will change some things in the near future.
                                I am going to do only minimal maintenance to keep the script working.
                                Let's see how google is going to develop our beloved matrix.)
# 2015-01-02 Edited by Steppo (Added eventListener to handle switch to ajax,
                               added support to transform times to 24h-format
                               added german translation,
                               several other tweaks & fixes)
                               
# 2015-01-01 Edited by Steppo (Quickfix for Matrix 3.0,
                               removed most content. Only linking at the moment,
                               will do the cleanup ASAP)

**** Version 0.6 ****
# 2014-11-12 Edited by Steppo (added quicklinks for currency (USD & EUR),
                               added quicklinks for selecting flexible dates,
                               rewrote initial call-function to start the script)

**** Version 0.5 ****
# 2014-11-11 Edited by Steppo (Fixed bug causing close of advanced routing on searchpage,
                                moved extraction and linkgenerating to seperate functions,
                                added a lot of information like flightdurations/codeshare/layovertime/arrival-time-object,
                                complete redesign of data-object, adapted DL/Orbitz/UA/US/Farefreaks/GCM to data-object,
                                added segmentskip to Orbitz && FF if its just a technical stop,
                                removed usage of itaLocal (replaced by itaLanguage ) and default values in function ( thx to kulin for this hints) )
**** Version 0.4 ****
# 2014-11-10 Edited by paul21 (Improved united.com booking support)
# 2014-11-09 Edited by Steppo (Added monthly navigation to calendar,
                                added retry for details if content is loading slow,
                                added flights as object (see data var ),
                                added Farefreaks,
                                added GCM)
**** Version 0.3a ****
# 2014-11-01 Edited by Steppo (shortened some regex,
                               added support for german version of matrix)

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
  Unsere about segment-skipping - should be fine bud needs heavy testing.
*/
/**************************************** Start Script *****************************************/
// Get language first but do not use itaLocale
var itaLanguage="en";
// Replacementsetting
var timeformat="24h";  // replaces times on resultpage
var userlang="en";     // de is the only supported one at the moment
// global retrycount for setup
var retrycount=1;

// we need to detect pagechange 3.0 is using ajax only
var laststatus = "";
var scriptrunning = 1;

// execute language detection and afterwards functions for current page
if (window.top != window.self) exit; //don't run on frames or iframes

if (window.addEventListener){
window.addEventListener('load', startcript, false);
} else if (window.attachEvent)
window.attachEvent("onload", startcript);
else {
window.onload = startcript;
}
function startcript(){
  if (window.location.href!=laststatus){
    setTimeout(function(){getPageLang();}, 100);
    laststatus=window.location.href;
  }
  if (scriptrunning==1){
   setTimeout(function(){startcript();}, 500); 
  }
  
}

/**************************************** Get Language *****************************************/

function getPageLang(){
    if (document.getElementById("localeSelect_label")== null ) {
      console.log("Matrix 3.0: Falling back to EN"); 
      itaLanguage="en";
      retrycount=1;  
    } else {      
      if (document.getElementById("localeSelect_label").innerHTML == "Deutsch") {
      itaLanguage="de";
      retrycount=1;
     } else if (document.getElementById("localeSelect_label").innerHTML == "English") {
      itaLanguage="en";
      retrycount=1;
     } else if (retrycount>=20) {
      //set default and go ahead 
      console.log("Unable to detect language: Falling back to EN"); 
      itaLanguage="en";
      retrycount=1; 
     } else {
      retrycount++; 
      setTimeout(function(){getPageLang();}, 100);
      return false; 
     }
   }  
      
    if (window.location.href.indexOf("view-details") !=-1) {
       setTimeout(function(){fePS();}, 200);   
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
/********************************************* Link Creator *********************************************/
//Primary function for extracting flight data from ITA/Matrix
function fePS() {
    // retry if itin not loaded  
    if (findtarget("GE-ODR-BMBB",1).firstChild.nextSibling.style.display!="none") { 
      retrycount++;
      if (retrycount>20) {
        console.log("Error Content not found.");
        return false;
      };
      setTimeout(function(){fePS();}, 200);    
      return false;
    };
    // empty outputcontainer
    if (document.getElementById('powertoolslinkcontainer')!=undefined){
        var div = document.getElementById('powertoolslinkcontainer');
        div.innerHTML ="";
    }
	
    // remove powertool items
	var elems = document.getElementsByClassName('powertoolsitem');
	for(var i = elems.length - 1; i >= 0; i--){
		elems[i].parentNode.removeChild(elems[i]);
	}

    // configure sidebar
    findtarget('GE-ODR-BOBB',1).setAttribute('rowspan', 3);
    findtarget('GE-ODR-BET',1).setAttribute('class', 'GE-ODR-BBFB');

    var data = readItinerary();
    
	printCPM(data);
    
    printDelta(data);
    
    printAF(data);
    
    printKL(data);
    
    printOrbitz(data);
    
    printUA(data);
    //*** Hipmunk ****//
    printHipmunk (data);
    
    // we print US if its only on US-flights
    if (data["carriers"].length==1 && data["carriers"][0]=="US"){
      printUS(data);
    } 
       
    printAC(data);
       
    //*** Farefreaksstuff ****//
    printFarefreaks (data,0);
    printFarefreaks (data,1);
    //*** Priceline ****//
    printPriceline (data); 
    //*** GCM ****//
    printGCM (data);  
}

  //*** Readfunction ****//
function readaddinfo(str){
  var result=new Array();
  var re=/<td>(.*?)<\/td>/g;
  result=exRE(str,re);
  for (i=result.length;i<5;i++) {
  result.push("");
  }
  return result;
}

function readItinerary(){
      // the magical part! :-)
      var replacementsold = new Array();
      var replacementsnew = new Array();
      if (userlang=="de"){
       replacementsold.push("Dep:");
       replacementsnew.push("Abflug:");
       replacementsold.push("Arr:");
       replacementsnew.push("Ankunft:");
       replacementsold.push("Layover in");
       replacementsnew.push("Umst. in");
       replacementsold.push(" to ");
       replacementsnew.push(" nach ");
        replacementsold.push("Mon,");
       replacementsnew.push("Mo.,");
        replacementsold.push("Tue,");
       replacementsnew.push("Di.,");
        replacementsold.push("Wed,");
       replacementsnew.push("Mi.,");
        replacementsold.push("Thu,");
       replacementsnew.push("Do.,");
        replacementsold.push("Fri,");
       replacementsnew.push("Fr.,");
        replacementsold.push("Sat,");
       replacementsnew.push("Sa.,");
        replacementsold.push("Sun,");
       replacementsnew.push("So.,");
         replacementsold.push(" Jan ");
       replacementsnew.push(" Januar ");
         replacementsold.push(" Feb ");
       replacementsnew.push(" Februar ");
        replacementsold.push(" Mar ");
       replacementsnew.push(" M&auml;rz ");
        replacementsold.push(" Apr ");
       replacementsnew.push(" April ");
        replacementsold.push(" May ");
       replacementsnew.push(" Mai ");
        replacementsold.push(" Jun ");
       replacementsnew.push(" Juni ");
        replacementsold.push(" Jul ");
       replacementsnew.push(" Juli ");
        replacementsold.push(" Aug ");
       replacementsnew.push(" August ");
        replacementsold.push(" Sep ");
       replacementsnew.push(" September ");
        replacementsold.push(" Oct ");
       replacementsnew.push(" Oktober ");
        replacementsold.push(" Nov ");
       replacementsnew.push(" November ");
        replacementsold.push(" Dez ");
       replacementsnew.push(" Dezember ");
        replacementsold.push("OPERATED BY ");
       replacementsnew.push("Durchgef&uuml;hrt von ");        
      }
  
      var data= new Array();
      var carrieruarray= new Array();  
      //Searches through inner-html of div itineraryNode
      var itinHTML = new Array();
      // Seaerch for itin
      var re=/GE-ODR-BNBB(.*?)GE-ODR-BOBB/g;
      itinHTML = exRE(document.getElementById("contentwrapper").innerHTML,re);
      itinHTML=itinHTML[0];
  
      // Lets split result into legs
      var legs = new Array();
      var re=/<tbody>(.*?)<\/tbody>/g;
      legs = exRE(itinHTML,re);
      // devide into tr
      var re=/<tr>(.*?)<\/tr>/g;
      var tmp_airarrdate=new Array();
      var offset=0; 
      for (i=0;i<legs.length;i++) {
        speicher = exRE(legs[i],re);
        legs[i]=new Array();
        for (j=0;j<speicher.length;j++) {
            if(speicher[j].indexOf("This flight contains airport changes") ==-1){
            legs[i].push(speicher[j]);
            }
        }            
        if (legs[i].length>3){
          for (j=2;j<legs[i].length;j+=2) {
           tmp_airarrdate=tmp_airarrdate.concat(readaddinfo(legs[i][j]));
          }  
        } else {
           tmp_airarrdate=tmp_airarrdate.concat(readaddinfo(legs[i][1])); 
        }
        if (legs[i].length%2 == 0){
            for (k=0;k<5;k++) {
            tmp_airarrdate.push("");
            }
        }
        
      }
      
      //Find carrier
      var re=/airline_logos\/35px\/(\w\w)\.png/g;
      var carriers = new Array();
      carriers = exRE(itinHTML,re);
      var re = /airline_logos.*?gwt-Label\"\>(.*?)\s{1}[0-9]*\<\/div>/g;
      var airlineName = new Array();
      airlineName = exRE(itinHTML, re);
  
      // build the array of unique carriers  
      for (i=0;i<carriers.length;i++) {
        if (!inArray(carriers[i],carrieruarray)) {carrieruarray.push(carriers[i]);};
      }  
          
      //Find Airports
      var re=/(GE-ODR-BHR")*\>[^\(\<]*\(([A-Z]{3})[^\(\<]*\(([A-Z]{3})/g;
      var airports= new Array();
      var tmp_airports= new Array();
      var legNum = new Array();
      var legAirports = new Array();
      tmp_airports = exRE(itinHTML,re);
      //Find Date
      var re=/(strong)*\>[^\(\<]*\([A-Z]{3}[^\(\<]*\([A-Z]{3}[^\,]*\,\s*([a-zA-Z0-9]{1,3})\.?\s*([a-zA-Z0-9ä]{1,3})/g;
      var tmp_airdate= new Array();
      tmp_airdate = exRE(itinHTML,re);
      // lets swap values if german language
      if (itaLanguage=="de"){
        for (var i = 0; i < tmp_airdate.length; i+=3) {
          var speicher=tmp_airdate[i+1];
          tmp_airdate[i+1]=tmp_airdate[i+2].replace(/ä/g, "a").replace(/i/g, "y").replace(/Dez/g, "Dec").replace(/Okt/g, "Oct");
          tmp_airdate[i+2]=speicher;
          }
      }
      
      // find information like codeshare layoverduration and timechange on arrival

      // lets see what we got
      var addinformations = Array();
      for (var i = 0; i < tmp_airarrdate.length; i+=5) {
        var speicher = {codeshare:0, arrdate:"", layoverduration:""};
          // check for codeshare
          if(tmp_airarrdate[i]!="") {speicher["codeshare"]=1;}
          // check timeshift on arrival
          if(tmp_airarrdate[i+2]!="") {
            speicher["arrdate"]={};
            var re=/[^\,]*\,\s*([a-zA-Z0-9]{1,3})\.?\s*([a-zA-Z0-9ä]{1,3})/g;
            var speicher2= new Array();
            speicher2 = exRE(tmp_airarrdate[i+2],re);
            // lets swap values if german language
            if (itaLanguage=="de"){
                var speicher3=speicher2[0];
                speicher2[0]=speicher2[1].replace(/ä/g, "a").replace(/i/g, "y").replace(/Dez/g, "Dec").replace(/Okt/g, "Oct");
                speicher2[1]=speicher3;
            }
           speicher["arrdate"]["day"]=parseInt(speicher2[1]);
           speicher["arrdate"]["month"]=monthnameToNumber(speicher2[0]);
           speicher["arrdate"]["year"]=getFlightYear(speicher["arrdate"]["day"],speicher["arrdate"]["month"]);
            
          }
          if(tmp_airarrdate[i+3]!="") {
            var re=/([0-9]{1,2})/g;
            var speicher2 = new Array();
            speicher2 = exRE(tmp_airarrdate[i+3],re);
            speicher["layoverduration"]=parseInt(speicher2[0])*60 + parseInt(speicher2[1]);
          }
          addinformations.push(speicher);
       }
      
      //Find times
      var re=/Dep:[^0-9]+(.*?)\<\/div\>/g;
      var deptimes= new Array();
      deptimes = exRE(itinHTML,re);
      
      var re=/Arr:[^0-9]+(.*?)\<\/div\>/g;
      var arrtimes= new Array();
      arrtimes = exRE(itinHTML,re);
      if (itaLanguage!="de"){
      // take care of 12h
        for (var i = 0; i < deptimes.length; i++) {
          if (timeformat=="24h") {
           replacementsold.push(deptimes[i]);
           replacementsold.push(arrtimes[i]); 
          }
          deptimes[i]=return12htime(deptimes[i]);
          arrtimes[i]=return12htime(arrtimes[i]);
          if (timeformat=="24h") {          
            replacementsnew.push((deptimes[i].length==4? "0":"")+deptimes[i]) ;
            replacementsnew.push((arrtimes[i].length==4? "0":"")+arrtimes[i]);
          }
        }
      }
      // find flightduration
      var re=/([0-9]{1,2})h\s([0-9]{1,2})m[^\(]*\(\w\)/g; // we need [^\(]*\(\w\) to skip layovers
      var durations= new Array();
      speicher = exRE(itinHTML,re);
      for (var i=0; i<(speicher.length/2);i++){
        durations[i]=parseInt(speicher[i*2])*60 + parseInt(speicher[(i*2)+1]);                 
      }
 
      //Find flight number      
      var re = /airline_logos.*?gwt-Label.*?([0-9]*)\<\/div>/g;
      var flightnums = new Array();
      flightnums = exRE(itinHTML,re);
  
      //Find Book Class
      var re = /\((\w)\)/g;
      var bookclass = new Array();
      bookclass = exRE(itinHTML,re);
  
      //Find Class of Service
      var re = /(\w)[\w]+\s\(\w\)/g;
      var classofservice = new Array();
      classofservice = exRE(itinHTML,re);

  
      var basisHTML = document.getElementById("contentwrapper").innerHTML;
      //Currency in EUR?
      var itinCur="";
      var re=/(€)/g;
      var speicher = new Array();
      speicher = exRE(basisHTML,re);
      if (speicher.length>1) itinCur="EUR";
      if (itinCur==""){
          var re=/($)/g;
          var speicher = new Array();
          speicher = exRE(basisHTML,re);
          if (speicher.length>1) itinCur="USD";
      }
      //console.log("Cur: "+itinCur);
  
      // Find fare-price
      var re=/GE-ODR-BOR\"\>\<div[^0-9]*([0-9,.]+)/g;
      var farePrice = new Array();
      farePrice = exRE(basisHTML,re);
      //total price will be the last one
      farePrice=farePrice[(farePrice.length-1)];
      if (itaLanguage=="de"){
      farePrice=farePrice.replace(/\./g,"").replace(/\,/g,".");
      } else {
      farePrice=farePrice.replace(/\,/g,"");
      }
	  
      // Find mileage
      var re=/GE-ODR-BCT\"\>([0-9,.]+)/g;
      var mileage = exRE(basisHTML,re);
      //total mileage will be the first one
      if (mileage.length){
        mileage=mileage[0].replace(/\./g,"").replace(/\,/g,"");
      } else {
        mileage='0';
      }
      
      // Get the number of Pax
      if (itaLanguage=="de"){
      var re=/Gesamtpreis\sfür\s([0-9])\sPassagier/g;
      } else {
      var re=/Total\scost\sfor\s([0-9])\spassenger/g;
      }
      var numPax = new Array();
      numPax = exRE(basisHTML,re);
      //console.log(numPax+" pax with total fare of "+farePrice);

      //find farecodes
      if (itaLanguage=="de"){
      var re=/Airline\s\w\w\s(\w+)\s[\w{3}]/g;
      } else {
      var re=/Carrier\s\w\w\s(\w+)\s[\w{3}]/g;
      }
      var fareBasis=new Array();
      fareBasis=exRE(basisHTML,re);
         
      //Find basis legs  => NEW
      if (itaLanguage=="de"){
      var re=/Strecke\(n\) ([\w\(\)\s\-,]+)/g;
      } else {
      var re=/Covers ([\w\(\)\s\-,]+)/g;
      }
      var fareBaseLegs = { fares :new Array(), legs:new Array()};
      fareBaseLegs["fares"]= exRE(basisHTML,re);
      var re=/(\w\w\w\-\w\w\w)/g;
      // find the covered airports
      for (i=0;i<fareBaseLegs["fares"].length;i++) {
       fareBaseLegs["legs"].push(exRE(fareBaseLegs["fares"][i],re));
      }
      fareBaseLegs["fares"]=fareBasis;
      // We have an object now in which fares[i] covers coutes[i]
      
      var dirtyFare= new Array();  
      // dirty but handy for later usage since there is no each function
      for(var i=0;i<fareBaseLegs["legs"].length;i++) {
        for(var j=0;j<fareBaseLegs["legs"][i].length;j++) {
         dirtyFare.push(fareBaseLegs["legs"][i][j]+"-"+fareBaseLegs["fares"][i]);
        }
      }
      
      var k=-1;
      var datapointer=0;  
      var legobj={};
      // lets try to build a structured object
      for(i=0;i<tmp_airports.length;i+=3) {
            if (tmp_airports[i] == 'GE-ODR-BHR"' ) //Matches the heading airport
            {
                if (k>=0) {data.push(legobj);}
                k++;
                legobj={};
                //lets build the outer structure
                legobj["orig"]=tmp_airports[i+1];
                legobj["dest"]=tmp_airports[i+2];
                legobj["dep"]={};
                legobj["arr"]={};
                legobj["dep"]["day"]=parseInt(tmp_airdate[i+2]);
                legobj["dep"]["month"]=monthnameToNumber(tmp_airdate[i+1]);
                legobj["dep"]["year"]=getFlightYear(legobj["dep"]["day"],legobj["dep"]["month"]);
                legobj["dep"]["time"] = deptimes[datapointer];
                legobj["seg"] = new Array();
                if (tmp_airports.length <= i+3 || tmp_airports[i+3] == 'GE-ODR-BHR"') //Single flight in leg
                {                       
                    speicher={};
                    speicher["orig"]=tmp_airports[i+1];
                    speicher["dest"]=tmp_airports[i+2];
                    speicher["dep"]={};
                    speicher["dep"]["day"]=parseInt(tmp_airdate[i+2]);
                    speicher["dep"]["month"]=monthnameToNumber(tmp_airdate[i+1]);
                    speicher["dep"]["year"]=getFlightYear(speicher["dep"]["day"],speicher["dep"]["month"]);
                    speicher["dep"]["time"]=deptimes[datapointer];
                    speicher["arr"]={};
                    if (addinformations[datapointer]["arrdate"]!=""){
                      speicher["arr"]["day"]=addinformations[datapointer]["arrdate"]["day"];
                      speicher["arr"]["month"]=addinformations[datapointer]["arrdate"]["month"];
                      speicher["arr"]["year"]=addinformations[datapointer]["arrdate"]["year"];                     
                    } else {
                      speicher["arr"]["day"]=speicher["dep"]["day"];
                      speicher["arr"]["month"]=speicher["dep"]["month"];
                      speicher["arr"]["year"]=speicher["dep"]["year"];                    
                    }
                    speicher["arr"]["time"]=arrtimes[datapointer];
                    legobj["arr"]["day"]=speicher["arr"]["day"];
                    legobj["arr"]["month"]=speicher["arr"]["month"];
                    legobj["arr"]["year"]=speicher["arr"]["year"];
                    legobj["arr"]["time"]=speicher["arr"]["time"];
                    speicher["codeshare"]=addinformations[datapointer]["codeshare"];
                    speicher["layoverduration"]=addinformations[datapointer]["layoverduration"];    
                    speicher["duration"]=durations[datapointer];
                    speicher["carrier"]=carriers[datapointer];
                    speicher["bookingclass"]=bookclass[datapointer];
                    speicher["fnr"]=flightnums[datapointer];
                    speicher["cabin"]=getcabincode(classofservice[datapointer]);
                    // find farecode for leg
                    for(var j=0;j<dirtyFare.length;j++) {
                         if (dirtyFare[j].indexOf(speicher["orig"]+"-"+speicher["dest"]+"-")!= -1) {
                          //found farebase of this segment
                           speicher["farebase"]=dirtyFare[j].replace(speicher["orig"]+"-"+speicher["dest"]+"-","");
                           dirtyFare[j]=speicher["farebase"]; // avoid reuse
                           j=dirtyFare.length;
                         }
                    }
                    legobj["seg"].push(speicher);
                    datapointer++;
                }
            } else {
                speicher={};
                speicher["orig"]=tmp_airports[i+1];
                speicher["dest"]=tmp_airports[i+2];
                speicher["dep"]={};
                speicher["dep"]["day"]=parseInt(tmp_airdate[i+2]);
                speicher["dep"]["month"]=monthnameToNumber(tmp_airdate[i+1]);
                speicher["dep"]["year"]=getFlightYear(speicher["dep"]["day"],speicher["dep"]["month"]);
                speicher["dep"]["time"]=deptimes[datapointer];
                speicher["arr"]={};
                if (addinformations[datapointer]["arrdate"]!=""){
                  speicher["arr"]["day"]=addinformations[datapointer]["arrdate"]["day"];
                  speicher["arr"]["month"]=addinformations[datapointer]["arrdate"]["month"];
                  speicher["arr"]["year"]=addinformations[datapointer]["arrdate"]["year"];                     
                 } else {
                  speicher["arr"]["day"]=speicher["dep"]["day"];
                  speicher["arr"]["month"]=speicher["dep"]["month"];
                  speicher["arr"]["year"]=speicher["dep"]["year"];                    
                 }
                speicher["arr"]["time"]=arrtimes[datapointer];
                legobj["arr"]["day"]=speicher["arr"]["day"];
                legobj["arr"]["month"]=speicher["arr"]["month"];
                legobj["arr"]["year"]=speicher["arr"]["year"];
                legobj["arr"]["time"]=speicher["arr"]["time"];
                speicher["codeshare"]=addinformations[datapointer]["codeshare"];
                speicher["layoverduration"]=addinformations[datapointer]["layoverduration"];    
                speicher["duration"]=durations[datapointer];
                speicher["carrier"]=carriers[datapointer];
                speicher["bookingclass"]=bookclass[datapointer];
                speicher["fnr"]=flightnums[datapointer];
                speicher["cabin"]=getcabincode(classofservice[datapointer]);
                // find farecode for leg
                for(var j=0;j<dirtyFare.length;j++) {
                    if (dirtyFare[j].indexOf(speicher["orig"]+"-"+speicher["dest"]+"-")!= -1) {
                     //found farebase of this segment
                      speicher["farebase"]=dirtyFare[j].replace(speicher["orig"]+"-"+speicher["dest"]+"-","");
                      dirtyFare[j]=speicher["farebase"]; // avoid reuse
                      j=dirtyFare.length;
                    }
                 }
                legobj["seg"].push(speicher);
                datapointer++;      
            }
      }
      data.push(legobj); // push of last leg
      // add price and pax
      // a little bit unsure about multiple pax with different farebase
      data={itin:data, price: farePrice, numPax:numPax[0] , carriers:carrieruarray, cur : itinCur, farebases:fareBaseLegs["fares"], dist:mileage};
       
      //console.log(data); //Remove to see flightstructure
  
      // lets do the replacement
     if(replacementsold.length>0) {
       target=findtarget("GE-ODR-BNBB",1).nextSibling.nextSibling;
       for(i=0;i<replacementsold.length;i++) {
         re = new RegExp(replacementsold[i],"g");
         target.innerHTML = target.innerHTML.replace(re, replacementsnew[i]);
       }
     }
      return data;
}  
  //*** Printfunctions ****//
function printCPM(data){
  printItem((Number(data.price) / Number(data.dist)).toFixed(4) + ' cpm','',1);
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
    var deltaURL ="http://"+(itaLanguage=="de" ? "de" : "www");
    deltaURL +=".delta.com/booking/priceItin.do?dispatchMethod=priceItin&tripType=multiCity&cabin=B5-Coach";
    deltaURL +="&currencyCd=" + (data["cur"]=="EUR" ? "EUR" : "USD") + "&exitCountry=US";
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
    deltaURL += "&price="+data["price"];
    deltaURL += "&numOfSegments=" + segcounter.toString() + "&paxCount=" + data["numPax"];
    deltaURL += "&vendorRedirectFlag=true&vendorID=Google";  
    printUrl(deltaURL,"DL","");
}
function printAF(data) {
  var afUrl = 'https://www.airfrance.com/US/en/local/process/standardbooking/DisplayUpsellAction.do?cabin=Y&calendarSearch=1&listPaxTypo=ADT&subCabin=MCHER&typeTrip=2', flights;
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
  printUrl(afUrl, 'AF');
}
function printKL(data) {
  var klUrl = 'https://www.klm.com/travel/nl_en/apps/ebt/ebt_home.htm?lang=EN&chdQty=0&infQty=0&dev=5&cffcc=ECONOMY', fb = '', oper = '';
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
  printUrl(klUrl, 'KL');
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
    orbitzUrl += "&selectKey=" + selectKey.substring(0,selectKey.length-1);;
    if (data["cur"]=="USD") {
    //lets do this when USD is cur
    var priceval = parseFloat(pricing) + 6.99;
    orbitzUrl += "&userRate.price=USD|" + priceval.toString();
    }
    printUrl("http://www.cheaptickets.com"+orbitzUrl,"CHPTIX","");
    printUrl("http://www.orbitz.com"+orbitzUrl,"ORB","");
    
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
        if (userlang=="de"){
        desc="Kopiere den Link bei Hipmunk";
      } else {
        desc="Copy Link in Text, via Hipmunk";
      }  
  
     printUrl(uaUrl,"UA",desc);
}
function printAC(data){
  var acUrl = 'http://www.aircanada.com/aco/flights.do?AH_IATA_NUMBER=0005118&AVAIL_EMMBEDDED_TRANSACTION=FlexPricerAvailabilityServlet&country=US&countryOfResidence=US&CREATION_MODE=30&EMBEDDED_TRANSACTION=FareServelet&FareRequest=YES&fromThirdParty=YES&HAS_INFANT_1=False&IS_PRIMARY_TRAVELLER_1=True&language=en&LANGUAGE=US&SITE=SAADSAAD&thirdPartyID=0005118&TRAVELER_TYPE_1=ADT&PRICING_MODE=0';
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
  printUrl(acUrl,"AC");
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
    printUrl(usUrl,"US","");
}
function printFarefreaks (data,method){
// Should be fine
// method: 0 = based on leg; 1 = based on segment
    var carrieruarray = new Array();
    var mincabin=3;
    var segsize=0;  
    var farefreaksurl = "https://www.farefreaks.com/landing/landing.php?";
    if (itaLanguage=="de"||userlang=="de"){
    farefreaksurl +="lang=de";
    } else {
    farefreaksurl +="lang=us";
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
      if (userlang=="de"){
        desc="Benutze "+segsize+" Segment(e)";
      } else {
        desc="Based on "+segsize+" segment(s)";
      }
      
    } else {
      farefreaksurl += "&nonstop=0";  
      if (userlang=="de"){
        desc="Benutze "+segsize+" Abschnitt(e)";
      } else {
        desc="Based on "+segsize+" segment(s)";
      }
    }
    if (carrieruarray.length <= 3) {farefreaksurl += "&carrier="+ carrieruarray.toString();}
    if (segsize<=6) {printUrl(farefreaksurl,"FF",desc);};
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
 printImage('http://www.gcmap.com/map?MR=900&MX=210x210&PM=*&P='+url, 'http://www.gcmap.com/mapui?P='+url, 3);
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
          cabin="";
  }
  return cabin;
}
function printHipmunk (data){
    var url = "https://www.hipmunk.com/flights/";
    var datestring="#!dates=";
    var mincabin=3;
    //Build multi-city search based on legs
    for (var i=0;i<data["itin"].length;i++) {
      // walks each leg
            if (i>0) url +="-and-";
            url += "" + data["itin"][i]["orig"];
            datestring+= ( i>0 ? ",":"")+monthnumberToName(data["itin"][i]["dep"]["month"])+ ( Number(data["itin"][i]["dep"]["day"]) <= 9 ? "0":"") +data["itin"][i]["dep"]["day"].toString();      
       for (var j=0;j<data["itin"][i]["seg"].length;j++) {
         //walks each segment of leg
                var k=0;
                // lets have a look if we need to skip segments - Flightnumber has to be the same and it must be just a layover
                while ((j+k)<data["itin"][i]["seg"].length-1){
                 if (data["itin"][i]["seg"][j+k]["fnr"] != data["itin"][i]["seg"][j+k+1]["fnr"] || 
                     data["itin"][i]["seg"][j+k]["layoverduration"] >= 1440) break;
                 k++;
                }               
                url += ( j>0 ? "-"+data["itin"][i]["seg"][j]["orig"]+"-":"::")+data["itin"][i]["seg"][j]["carrier"] + data["itin"][i]["seg"][j]["fnr"];
                if (data["itin"][i]["seg"][j]["cabin"]<mincabin){mincabin=data["itin"][i]["seg"][j]["cabin"];};  
                j+=k;
      }
      url += "-to-" + data["itin"][i]["dest"];
    }  
    datestring += "&pax=" + data["numPax"]+(mincabin>0?"&cabin="+getHipmunkCabin(mincabin):"");
    printUrl(url+datestring,"Hipmunk","");
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
   printUrl(url+pricelineurl+encodeURIComponent(searchparam),"Priceline","");
}


//ID sidebarNode
function printUrl(url,text,desc,nth){
  printItem('<a href="'+url+ '" target="_blank">'+(userlang=='de'?'&Ouml;ffne mit':'Open with') +' '+text+'</a>',desc,nth);
}
function printItem(text,desc,nth){
  div = getSidebarContainer(nth);
  div.innerHTML = div.innerHTML + '<li class="powertoolsitem">'+text+(desc ? '<br/><small>('+desc+')</small>' : '')+'</li>';
}
function printImage(src,url,nth){
  div = getSidebarContainer(nth).parentNode;
  div.innerHTML = div.innerHTML + (url?'<a href="'+url+ '" target="_blank" class="powertoolsitem">':'')+'<img src="'+src+'" style="margin-top:10px;"'+(!url?' class="powertoolsitem"':'')+'/>'+(url?'</a>':'');
}
function getSidebarContainer(nth){
  var div = !nth || nth >= 4 ? document.getElementById('powertoolslinkcontainer') : findtarget('GE-ODR-BBFB',nth);
  return div ||createUrlContainer();
}
function createUrlContainer(){
  var newdiv = document.createElement('div');
  newdiv.setAttribute('class','GE-ODR-BDFB');
  newdiv.innerHTML = '<div class="GE-ODR-BAFB">Powertools</div><ul id="powertoolslinkcontainer" class="GE-ODR-BBFB"></ul>';
  findtarget('GE-ODR-BCFB',1).appendChild(newdiv);
  return document.getElementById('powertoolslinkcontainer');
}

