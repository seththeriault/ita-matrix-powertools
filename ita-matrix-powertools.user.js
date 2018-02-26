// ==UserScript==
// @name ITA-Matrix-Powertools
// @namespace https://github.com/SteppoFF/ita-matrix-powertools
// @description Adds new features and builds fare purchase links for ITA Matrix
// @version 0.28
// @require https://greasemonkey.github.io/gm4-polyfill/gm4-polyfill.js
// @grant GM.getValue
// @grant GM_setValue
// @grant GM.setValue
// @grant GM_setValue
// @include http*://matrix.itasoftware.com/*
// ==/UserScript==
/*
 Written by paul21, Steppo & IAkH of FlyerTalk.com
 http://www.flyertalk.com/forum/members/paul21.html
 Includes contriutions by 18sas
 Copyright Reserved -- At least share with credit if you do
*********** Latest Changes **************
**** Version 0.28 ****
# 2018-01-04 Edited by powerivq (Fix DL/AA and add AS/VX support)
# 2017-11-27 Edited by seththeriault (Changes for Delta to address the BE/Main Cabin and C+/PS issues)
# 2017-11-20 Edited by seththeriault (changes for Greasemonkey 4 / FF 57)
**** Version 0.27 ****
# 2017-06-18 Edited by Steppo (Fixed Delta)
**** Version 0.26 ****
# 2017-05-29 Edited by Dead-Flag (Added Skyscanner)
**** Version 0.25 ****
# 2017-05-21 Edited by c0dr (Fix for new matrix release)
**** Version 0.24 ****
# 2017-02-21 Edited by Steppo (Fixed Priceline - thx andydd!)
**** Version 0.23 ****
# 2016-12-11 Edited by Steppo (Fixed Alitalia and added editions
                                added time zone resolving - only affecting links for American Airlines
                                added on the fly link updates for passengers/cabin - printLinksContainer()
                                added support for multiple onClick() events in link section)

**** Version 0.22 ****
# 2016-09-26 Edited by Steppo (Added American US/CA/GB currencies)

**** Version 0.21 ****
# 2016-09-18 Edited by Steppo (Removed Orbitz/Ebookers
                                fixed Air Canada
                                some Kayak tweaking)
**** Version 0.20 ****
# 2016-05-31 Edited by elduce (Added Monomdo & Kayak)
# 2016-06-05 Edited by Steppo (Disabled LAN, Removed invalid Ebookers targets, Regrouped links to Airline/OTA/Meta)

**** Version 0.19 ****
# 2016-05-14 Edited by seththeriault (Specify proper cabin parameter for DL C+/W booking)

**** Version 0.18a ****
# 2016-05-10 Edited by Steppo (Fixed critical bug in Amadeus function - thx to adam.smith)

**** Version 0.18 ****
# 2016-05-01 Edited by Steppo (Renamed UserScript
                                added cabin override
                                added pax management -> use with caution!
                                redesigned settings - added font size for links
                                added editor mode
                                reworked/adapted linking functions - added edition support                               
                                tweaked extraction function - bugs removed/shortened/added plane type & fare carrier/improved currency detection
                                added Amadeus realated functions
                                added AAc1, BA, CZ, IB, LA, LH, LX, TK
                                added advanced routing codes using FareFreaks
                                added flight manager support of FareFreaks)
**** Version 0.17 ****
# 2016-04-11 Edited by Steppo (fixed Priceline)
# 2016-03-24 Edited by tomasdev (Fix Delta booking link like Google does)
**** Version 0.16 ****
# 2015-12-15 Edited by Steppo ( removed UA - Hipmunk,
                                use textNode for printing (external) messages)
# 2015-10-12 Edited by IAkH ( added wheretocredit.com calculator )
**** Version 0.15 ****
# 2015-09-30 Edited by IAkH ( added additional edition flyout menu,
                                added Ebookers, 
                                added Etraveli )
**** Version 0.14a ****
# 2015-09-26 Edited by Steppo ( fixed AA-POS )
**** Version 0.14 ****
# 2015-09-25 Edited by Steppo ( added American Airlines )
**** Version 0.13 ****
# 2015-06-15 Edited by Steppo ( fixed miles/passenger/price extraction,
                                 moved itin-data to global var "currentItin" -> capability to modify/reuse itin,
                                 rearranged config section,
                                 introduced wheretocredit.com,
                                 introduced background resolving of detailed distances using farefreaks.com based on data of OurAirports.com,
                                 tested on FF38, IE11, IE10 (emulated)
                                 )
**** Version 0.12 ****
# 2015-06-13 Edited by IAkH ( added CheapOair )
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
  Unsure about segment-skipping - should be fine but needs heavy testing.
*/
/**************************************** Start Script *****************************************/
// User settings
var mptUsersettings = new Object();
mptUsersettings["timeformat"] = "12h"; // replaces times on resultpage - valid: 12h / 24h
mptUsersettings["language"] = "en"; // replaces several items on resultpage - valid: en / de
mptUsersettings["enableDeviders"] = 1; // Print deviders in links after group (airlines/otas/other stuff) - valid: 0 / 1
mptUsersettings["enableInlinemode"] =  0; // enables inline mode - valid: 0 / 1
mptUsersettings["enableEditormode"] =  0; // prevents the script from automatically parsing the itinerary - valid: 0 / 1
mptUsersettings["enableIMGautoload"] = 0; // enables images to auto load - valid: 0 / 1
mptUsersettings["enableFarerules"] = 1; // enables fare rule opening in new window - valid: 0 / 1
mptUsersettings["enablePricebreakdown"] =  1; // enables price breakdown - valid: 0 / 1
mptUsersettings["enableMilesbreakdown"] =  1; // enables miles breakdown - valid: 0 / 1
mptUsersettings["enableMilesbreakdownautoload"] =  0; // enables autoload of miles breakdown - valid: 0 / 1
mptUsersettings["enableMilesInlinemode"] =  0; // always print miles breakdown inline - valid: 0 / 1
mptUsersettings["linkFontsize"] =  100; // fontsize of links - valid: 50-200


mptUsersettings["enablePlanefinder"] =  1; // enables Planefinder - click on flight numbers to open Planefinder for this flight - valid: 0 / 1
mptUsersettings["enableSeatguru"] =  1; // enables Seatguru - click on plane type to open Seatguru for this flight - valid: 0 / 1
mptUsersettings["enableWheretocredit"] =  1; // enables Wheretocredit - click on booking class to open wheretocredit for this flight - valid: 0 / 1
mptUsersettings["enableFarefreaks"] =  0; // enables FareFreaks features - valid: 0 / 1
mptUsersettings["enableNonDeltaAirlineOnDL"] = 0; // trying to price a non-DL airline on DL site? - valid 0 /  1

mptUsersettings["acEdition"] = "us"; // sets the local edition of AirCanada.com for itinerary pricing - valid: "us", "ca", "ar", "au", "ch", "cl", "cn", "co", "de", "dk", "es", "fr", "gb", "hk", "ie", "il", "it", "jp", "mx", "nl", "no", "pa", "pe", "se"
mptUsersettings["aaEdition"] = "en_DE"; // sets the local edition of AA-Europe/Asia for itinerary pricing - NO US available
mptUsersettings["aac1Edition"] = "US"; // sets the local edition of AA-C1 and UK
mptUsersettings["aac1Currency"] = "1"; // sets the currency of AA-C1 and UK
mptUsersettings["afEdition"] = "US/en"; // sets the local edition of Air France
mptUsersettings["azEdition"] = "us_en"; // sets the local edition of Alitalia
mptUsersettings["baLanguage"] = "en"; // sets the language of British Airways
mptUsersettings["baEdition"] = "US"; // sets the local edition of British Airways
mptUsersettings["czEdition"] = "US-GB"; // sets the local edition of China Southern
mptUsersettings["dlEdition"] = "www_us"; // sets the local edition of Delta
mptUsersettings["ibEdition"] = "en-US"; // sets the local edition of Iberia
mptUsersettings["ibCurrency"] = "USD"; // sets the Currency of Iberia - unused
mptUsersettings["klEdition"] = "us_en"; // sets the local edition of KLM
mptUsersettings["laEdition"] = "en_us"; // sets the local edition of Lan
mptUsersettings["lhEdition"] = "US-gb"; // sets the local edition of Lufthansa
mptUsersettings["lxEdition"] = "us_en"; // sets the local edition of Swiss

// *** DO NOT CHANGE BELOW THIS LINE***/
// General settings
var mptSettings = new Object();
mptSettings["itaLanguage"]="en";
mptSettings["version"]="0.28";
mptSettings["retrycount"]=1;
mptSettings["laststatus"]="";
mptSettings["scriptrunning"]=1;
mptSettings["cabin"]="Auto";

// async for GM4
(async ()=>{

if (typeof GM.info === "undefined") {
   mptSettings["scriptEngine"]=0; // console mode
  }
else {
  mptSettings["scriptEngine"]=1; // tamper or grease mode
  var mptSavedUsersettings = await GM.getValue("mptUsersettings", "");
  if (mptSavedUsersettings) {
    mptSavedUsersettings = JSON.parse(mptSavedUsersettings);
    mptUsersettings["timeformat"] = (mptSavedUsersettings["timeformat"] === undefined ? mptUsersettings["timeformat"] : mptSavedUsersettings["timeformat"]);
    mptUsersettings["language"] = (mptSavedUsersettings["language"] === undefined ? mptUsersettings["language"] : mptSavedUsersettings["language"]);
    mptUsersettings["enableDeviders"]=(mptSavedUsersettings["enableDeviders"] === undefined ? mptUsersettings["enableDeviders"] : mptSavedUsersettings["enableDeviders"]);
    mptUsersettings["enableInlinemode"] = (mptSavedUsersettings["enableInlinemode"] === undefined ? mptUsersettings["enableInlinemode"] : mptSavedUsersettings["enableInlinemode"]);
    mptUsersettings["enableEditormode"] = (mptSavedUsersettings["enableEditormode"] === undefined ? mptUsersettings["enableEditormode"] : mptSavedUsersettings["enableEditormode"]);
    mptUsersettings["enableIMGautoload"] = (mptSavedUsersettings["enableIMGautoload"] === undefined ? mptUsersettings["enableIMGautoload"] : mptSavedUsersettings["enableIMGautoload"]);
    mptUsersettings["enableFarerules"] = (mptSavedUsersettings["enableFarerules"] === undefined ? mptUsersettings["enableFarerules"] : mptSavedUsersettings["enableFarerules"]);
    mptUsersettings["enablePricebreakdown"] = (mptSavedUsersettings["enablePricebreakdown"] === undefined ? mptUsersettings["enablePricebreakdown"] : mptSavedUsersettings["enablePricebreakdown"]);
    mptUsersettings["enableMilesbreakdown"] = (mptSavedUsersettings["enableMilesbreakdown"] === undefined ? mptUsersettings["enableMilesbreakdown"] : mptSavedUsersettings["enableMilesbreakdown"]);
    mptUsersettings["enableMilesbreakdownautoload"] = (mptSavedUsersettings["enableMilesbreakdownautoload"] === undefined ? mptUsersettings["enableMilesbreakdownautoload"] : mptSavedUsersettings["enableMilesbreakdownautoload"]);
    mptUsersettings["enableMilesInlinemode"] = (mptSavedUsersettings["enableMilesInlinemode"] === undefined ? mptUsersettings["enableMilesInlinemode"] : mptSavedUsersettings["enableMilesInlinemode"]);
    mptUsersettings["linkFontsize"] = (mptSavedUsersettings["linkFontsize"] === undefined ? mptUsersettings["linkFontsize"] : mptSavedUsersettings["linkFontsize"]);
    mptUsersettings["enablePlanefinder"] = (mptSavedUsersettings["enablePlanefinder"] === undefined ? mptUsersettings["enablePlanefinder"] : mptSavedUsersettings["enablePlanefinder"]);
    mptUsersettings["enableSeatguru"] = (mptSavedUsersettings["enableSeatguru"] === undefined ? mptUsersettings["enableSeatguru"] : mptSavedUsersettings["enableSeatguru"]);
    mptUsersettings["enableWheretocredit"] = (mptSavedUsersettings["enableWheretocredit"] === undefined ? mptUsersettings["enableWheretocredit"] : mptSavedUsersettings["enableWheretocredit"]);
    mptUsersettings["enableFarefreaks"] = (mptSavedUsersettings["enableFarefreaks"] === undefined ? mptUsersettings["enableFarefreaks"] : mptSavedUsersettings["enableFarefreaks"]);
    mptUsersettings["enableNonDeltaAirlineOnDL"] = (mptSavedUsersettings["enableNonDeltaAirlineOnDL"] === undefined ? mptUsersettings["enableNonDeltaAirlineOnDL"] : mptSavedUsersettings["enableNonDeltaAirlineOnDL"]);
    mptUsersettings["acEdition"] = (mptSavedUsersettings["acEdition"] === undefined ? mptUsersettings["acEdition"] : mptSavedUsersettings["acEdition"]);
    mptUsersettings["aaEdition"] = (mptSavedUsersettings["aaEdition"] === undefined ? mptUsersettings["aaEdition"] : mptSavedUsersettings["aaEdition"]);    
    mptUsersettings["aac1Edition"] = (mptSavedUsersettings["aac1Edition"] === undefined ? mptUsersettings["aac1Edition"] : mptSavedUsersettings["aac1Edition"]);
    mptUsersettings["aac1Currency"] = (mptSavedUsersettings["aac1Currency"] === undefined ? mptUsersettings["aac1Currency"] : mptSavedUsersettings["aac1Currency"]);
    mptUsersettings["afEdition"] = (mptSavedUsersettings["afEdition"] === undefined ? mptUsersettings["afEdition"] : mptSavedUsersettings["afEdition"]);
    mptUsersettings["azEdition"] = (mptSavedUsersettings["azEdition"] === undefined ? mptUsersettings["azEdition"] : mptSavedUsersettings["azEdition"]);
    mptUsersettings["baLanguage"] = (mptSavedUsersettings["baLanguage"] === undefined ? mptUsersettings["baLanguage"] : mptSavedUsersettings["baLanguage"]);
    mptUsersettings["baEdition"] = (mptSavedUsersettings["baEdition"] === undefined ? mptUsersettings["baEdition"] : mptSavedUsersettings["baEdition"]);
    mptUsersettings["czEdition"] = (mptSavedUsersettings["czEdition"] === undefined ? mptUsersettings["czEdition"] : mptSavedUsersettings["czEdition"]);
    mptUsersettings["dlEdition"] = (mptSavedUsersettings["dlEdition"] === undefined ? mptUsersettings["dlEdition"] : mptSavedUsersettings["dlEdition"]);
    mptUsersettings["ibCurrency"] = (mptSavedUsersettings["ibCurrency"] === undefined ? mptUsersettings["ibCurrency"] : mptSavedUsersettings["ibCurrency"]);
    mptUsersettings["ibEdition"] = (mptSavedUsersettings["ibEdition"] === undefined ? mptUsersettings["ibEdition"] : mptSavedUsersettings["ibEdition"]);    
    mptUsersettings["klEdition"] = (mptSavedUsersettings["klEdition"] === undefined ? mptUsersettings["klEdition"] : mptSavedUsersettings["klEdition"]);
    mptUsersettings["laEdition"] = (mptSavedUsersettings["laEdition"] === undefined ? mptUsersettings["laEdition"] : mptSavedUsersettings["laEdition"]);
    mptUsersettings["lhEdition"] = (mptSavedUsersettings["lhEdition"] === undefined ? mptUsersettings["lhEdition"] : mptSavedUsersettings["lhEdition"]);
    mptUsersettings["lxEdition"] = (mptSavedUsersettings["lxEdition"] === undefined ? mptUsersettings["lxEdition"] : mptSavedUsersettings["lxEdition"]);
  }
}

})(); // end async for GM4

var acEditions = ["us", "ca", "ar", "au", "ch", "cl", "cn", "co", "de", "dk", "es", "fr", "gb", "hk", "ie", "il", "it", "jp", "mx", "nl", "no", "pa", "pe", "se"];
var aaEditions = [{value:"en_AU", name:"Australia"},{value:"en_BE", name:"Belgium"},{value:"en_CN", name:"China"},{value:"en_DK", name:"Denmark"},{value:"en_FI", name:"Finland"},{value:"en_FR", name:"France / English"},{value:"fr_FR", name:"France / French"},{value:"en_DE", name:"Germany / English"},{value:"de_DE", name:"Germany / Deutsch"},{value:"en_GR", name:"Greece"},{value:"en_HK", name:"Hong Kong"},{value:"en_IN", name:"India"},{value:"en_IE", name:"Ireland"},{value:"en_IL", name:"Israel"},{value:"en_IT", name:"Italy"},{value:"en_JP", name:"Japan"},{value:"en_KR", name:"Korea"},{value:"en_NL", name:"Netherlands"},{value:"en_NZ", name:"New Zealand"},{value:"en_NO", name:"Norway"},{value:"en_PT", name:"Portugal"},{value:"en_RU", name:"Russia"},{value:"en_ES", name:"Spain"},{value:"en_SE", name:"Sweden"},{value:"en_CH", name:"Switzerland"}];
var aac1Editions = [{value:"CA", name:"Canada"},{value:"US", name:"United States"},{value:"GB", name:"United Kingdom"}];
var aac1Currencies = [{value:"1", name:"USD"},{value:"2", name:"GBP"},{value:"4", name:"CAD"}];
var afEditions = [{value:"DE/de", name:"Germany / Deutsch"},{value:"DE/en", name:"Germany / English"},{value:"FR/en", name:"France / English"},{value:"FI/en", name:"Finland / English"},{value:"FR/fr", name:"France / French"},{value:"NL/en", name:"Netherlands / English"},{value:"GB/en", name:"United Kingdom / English"},{value:"US/en", name:"US / English"}];
var azEditions = [{value:"de_de", name:"Germany / Deutsch"},{value:"at_de", name:"Austria / Deutsch"},{value:"ch_de", name:"Switzerland / Deutsch"},{value:"fr_fr", name:"France / French"},{value:"nl_nl", name:"Netherlands / Dutch"},{value:"it_it", name:"Italy / Italian"},{value:"ca_en", name:"Canada / Englisch"},{value:"us_en", name:"US / Englisch"},{value:"gb_en", name:"GB / Englisch"},{value:"en_en", name:"International / Englisch"}];
var baLanguages = [{value:"de", name:"Deutsch"},{value:"en", name:"English"},{value:"es", name:"Español"},{value:"fr", name:"Français"},{value:"it", name:"Italiano"},{value:"pl", name:"Polski"},{value:"pt", name:"Português"},{value:"sv", name:"Svenska"},{value:"zh", name:"中文"},{value:"ja", name:"日本語"},{value:"ru", name:"Русский"},{value:"ko", name:"한국어"}];
var baEditions = [{value:"AF", name:"Afghanistan"},{value:"AL", name:"Albania"},{value:"DZ", name:"Algeria"},{value:"AS", name:"American Samoa"},{value:"AD", name:"Andorra"},{value:"AO", name:"Angola"},{value:"AI", name:"Anguilla"},{value:"AG", name:"Antigua"},{value:"AR", name:"Argentina"},{value:"AM", name:"Armenia"},{value:"AW", name:"Aruba"},{value:"AU", name:"Australia"},{value:"AT", name:"Austria"},{value:"AZ", name:"Azerbaijan"},{value:"BS", name:"Bahamas"},{value:"BH", name:"Bahrain"},{value:"BD", name:"Bangladesh"},{value:"BB", name:"Barbados"},{value:"BY", name:"Belarus"},{value:"BE", name:"Belgium"},{value:"BZ", name:"Belize"},{value:"BJ", name:"Benin Republic"},{value:"BM", name:"Bermuda"},{value:"BT", name:"Bhutan"},{value:"BO", name:"Bolivia"},{value:"BA", name:"Bosnia-Herzegovina"},{value:"BW", name:"Botswana"},{value:"BR", name:"Brazil"},{value:"VG", name:"British Virgin Islands"},{value:"BN", name:"Brunei"},{value:"BG", name:"Bulgaria"},{value:"BF", name:"Burkina Faso"},{value:"BI", name:"Burundi"},{value:"KH", name:"Cambodia"},{value:"CA", name:"Canada"},{value:"CV", name:"Cape Verde"},{value:"KY", name:"Cayman Islands"},{value:"CF", name:"Central African Rep"},{value:"TD", name:"Chad"},{value:"CL", name:"Chile"},{value:"CN", name:"China"},{value:"CX", name:"Christmas Island"},{value:"CC", name:"Cocos Islands"},{value:"CO", name:"Colombia"},{value:"CG", name:"Congo"},{value:"CK", name:"Cook Islands"},{value:"CR", name:"Costa Rica"},{value:"HR", name:"Croatia"},{value:"CU", name:"Cuba"},{value:"CY", name:"Cyprus"},{value:"CZ", name:"Czech Republic"},{value:"DK", name:"Denmark"},{value:"DJ", name:"Djibouti"},{value:"DM", name:"Dominica"},{value:"DO", name:"Dominican Rep"},{value:"EC", name:"Ecuador"},{value:"EG", name:"Egypt"},{value:"SV", name:"El Salvador"},{value:"GQ", name:"Equatorial Guinea"},{value:"ER", name:"Eritrea"},{value:"EE", name:"Estonia"},{value:"ET", name:"Ethiopia"},{value:"FO", name:"Faeroe Is"},{value:"FK", name:"Falkland Is"},{value:"FJ", name:"Fiji"},{value:"FI", name:"Finland"},{value:"FR", name:"France"},{value:"GF", name:"French Guyana"},{value:"PF", name:"French Polynesia"},{value:"GA", name:"Gabon"},{value:"GM", name:"Gambia"},{value:"GE", name:"Georgia"},{value:"DE", name:"Germany"},{value:"GH", name:"Ghana"},{value:"GI", name:"Gibraltar (UK)"},{value:"GR", name:"Greece"},{value:"GL", name:"Greenland"},{value:"GD", name:"Grenada"},{value:"GP", name:"Guadeloupe"},{value:"GU", name:"Guam"},{value:"GT", name:"Guatemala"},{value:"GN", name:"Guinea"},{value:"GW", name:"Guinea Bissau"},{value:"GY", name:"Guyana"},{value:"HT", name:"Haiti"},{value:"HN", name:"Honduras"},{value:"HK", name:"Hong Kong"},{value:"HU", name:"Hungary"},{value:"IS", name:"Iceland"},{value:"IN", name:"India"},{value:"ID", name:"Indonesia"},{value:"IR", name:"Iran"},{value:"IQ", name:"Iraq"},{value:"IE", name:"Ireland"},{value:"IL", name:"Israel"},{value:"IT", name:"Italy"},{value:"CI", name:"Ivory Coast"},{value:"JM", name:"Jamaica"},{value:"JP", name:"Japan"},{value:"JO", name:"Jordan"},{value:"KZ", name:"Kazakhstan"},{value:"KE", name:"Kenya"},{value:"KI", name:"Kiribati"},{value:"XK", name:"Kosovo"},{value:"KW", name:"Kuwait"},{value:"KG", name:"Kyrgyzstan"},{value:"LA", name:"Laos"},{value:"LV", name:"Latvia"},{value:"LB", name:"Lebanon"},{value:"LS", name:"Lesotho"},{value:"LR", name:"Liberia"},{value:"LY", name:"Libya"},{value:"LI", name:"Liechtenstein"},{value:"LT", name:"Lithuania"},{value:"LU", name:"Luxembourg"},{value:"MO", name:"Macau"},{value:"MK", name:"Macedonia"},{value:"MG", name:"Madagascar"},{value:"MW", name:"Malawi"},{value:"MY", name:"Malaysia"},{value:"MV", name:"Maldives"},{value:"ML", name:"Mali"},{value:"MT", name:"Malta"},{value:"MP", name:"Mariana Islands"},{value:"MH", name:"Marshall Islands"},{value:"MQ", name:"Martinique"},{value:"MR", name:"Mauritania"},{value:"MU", name:"Mauritius"},{value:"MX", name:"Mexico"},{value:"FM", name:"Micronesia"},{value:"UM", name:"Minor Island"},{value:"MD", name:"Moldova"},{value:"MC", name:"Monaco"},{value:"ME", name:"Montenegro"},{value:"MS", name:"Montserrat"},{value:"MA", name:"Morocco"},{value:"MZ", name:"Mozambique"},{value:"MM", name:"Myanmar"},{value:"NA", name:"Namibia"},{value:"NR", name:"Nauru"},{value:"NP", name:"Nepal"},{value:"AN", name:"Netherland Antilles"},{value:"NL", name:"Netherlands"},{value:"NC", name:"New Caledonia"},{value:"NZ", name:"New Zealand"},{value:"NI", name:"Nicaragua"},{value:"NE", name:"Niger"},{value:"NG", name:"Nigeria"},{value:"NU", name:"Niue"},{value:"NF", name:"Norfolk Island"},{value:"NO", name:"Norway"},{value:"OM", name:"Oman"},{value:"PK", name:"Pakistan"},{value:"PA", name:"Panama"},{value:"PG", name:"Papua New Guinea"},{value:"PY", name:"Paraguay"},{value:"KP", name:"Peoples Rep Korea"},{value:"PE", name:"Peru"},{value:"PH", name:"Philippines"},{value:"PL", name:"Poland"},{value:"PT", name:"Portugal"},{value:"PR", name:"Puerto Rico"},{value:"QA", name:"Qatar"},{value:"CM", name:"Republic Cameroon"},{value:"RE", name:"Reunion"},{value:"RO", name:"Romania"},{value:"RU", name:"Russia"},{value:"RW", name:"Rwanda"},{value:"SM", name:"San Marino"},{value:"SA", name:"Saudi Arabia"},{value:"SN", name:"Senegal"},{value:"RS", name:"Serbia"},{value:"SC", name:"Seychelles"},{value:"SL", name:"Sierra Leone"},{value:"SG", name:"Singapore"},{value:"SK", name:"Slovakia"},{value:"SI", name:"Slovenia"},{value:"SB", name:"Solomon Island"},{value:"SO", name:"Somalia"},{value:"ZA", name:"South Africa"},{value:"KR", name:"South Korea"},{value:"ES", name:"Spain"},{value:"LK", name:"Sri Lanka"},{value:"KN", name:"St Kitts and Nevis"},{value:"LC", name:"St Lucia"},{value:"VC", name:"St Vincent"},{value:"SD", name:"Sudan"},{value:"SR", name:"Suriname"},{value:"SZ", name:"Swaziland"},{value:"SE", name:"Sweden"},{value:"CH", name:"Switzerland"},{value:"SY", name:"Syria"},{value:"TW", name:"Taiwan"},{value:"TJ", name:"Tajikistan"},{value:"TZ", name:"Tanzania"},{value:"TH", name:"Thailand"},{value:"TL", name:"Timor - Leste"},{value:"TG", name:"Togo"},{value:"TO", name:"Tonga"},{value:"TT", name:"Trinidad and Tobago"},{value:"TN", name:"Tunisia"},{value:"TR", name:"Turkey"},{value:"TM", name:"Turkmenistan"},{value:"TC", name:"Turks Caicos"},{value:"TV", name:"Tuvalu"},{value:"VI", name:"US Virgin Islands"},{value:"US", name:"USA"},{value:"UG", name:"Uganda"},{value:"UA", name:"Ukraine"},{value:"AE", name:"United Arab Emirates"},{value:"GB", name:"United Kingdom"},{value:"UY", name:"Uruguay"},{value:"UZ", name:"Uzbekistan"},{value:"VU", name:"Vanuatu"},{value:"VE", name:"Venezuela"},{value:"VN", name:"Vietnam"},{value:"WS", name:"Western Samoa"},{value:"YE", name:"Yemen Republic"},{value:"ZM", name:"Zambia"},{value:"ZW", name:"Zimbabwe"}];
var czEditions = [{value:"AR-GB", name:"Argentina / English"},{value:"AU-GB", name:"Australia / English"},{value:"AZ-GB", name:"Azerbaijan / English"},{value:"BD-GB", name:"Bangladesh / English"},{value:"BE-GB", name:"Belgium / English"},{value:"BR-GB", name:"Brazil / English"},{value:"KH-GB", name:"Cambodia / English"},{value:"CA-GB", name:"Canada / English"},{value:"CA-FR", name:"Canada / French"},{value:"CN-GB", name:"China / English"},{value:"DK-GB", name:"Denmark / English"},{value:"FI-GB", name:"Finland / English"},{value:"FR-GB", name:"France / English"},{value:"FR-FR", name:"France / French"},{value:"GE-GB", name:"Georgia / English"},{value:"DE-GB", name:"Germany / English"},{value:"DE-DE", name:"Germany / German"},{value:"GR-GB", name:"Greece / English"},{value:"HK-GB", name:"Hong Kong / English"},{value:"IN-GB", name:"India / English"},{value:"ID-GB", name:"Indonesia / English"},{value:"IR-GB", name:"Iran / English"},{value:"IE-GB", name:"Ireland / English"},{value:"IT-GB", name:"Italy / English"},{value:"JP-GB", name:"Japan / English"},{value:"JO-GB", name:"Jordan / English"},{value:"KZ-GB", name:"Kazakhstan / English"},{value:"KE-GB", name:"Kenya / English"},{value:"KG-GB", name:"Kyrgyzstan / English"},{value:"MY-GB", name:"Malaysia / English"},{value:"MV-GB", name:"Maldives / English"},{value:"MO-GB", name:"Macau / English"},{value:"MM-GB", name:"Myanmar / English"},{value:"NP-GB", name:"Nepal / English"},{value:"NL-GB", name:"Netherlands / English"},{value:"NZ-GB", name:"New Zealand / English"},{value:"NO-GB", name:"Norway / English"},{value:"PK-GB", name:"Pakistan / English"},{value:"PA-GB", name:"Panama / English"},{value:"PE-GB", name:"Peru / English"},{value:"PH-GB", name:"Philippines / English"},{value:"PT-GB", name:"Portugal / English"},{value:"RU-GB", name:"Russia / English"},{value:"SA-GB", name:"Saudi Arabia / English"},{value:"SG-GB", name:"Singapore / English"},{value:"ZA-GB", name:"South Africa / English"},{value:"KR-GB", name:"South Korea / English"},{value:"ES-GB", name:"Spain / English"},{value:"SE-GB", name:"Sweden / English"},{value:"CH-GB", name:"Switzerland / English"},{value:"TW-GB", name:"Taiwan / English"},{value:"TJ-GB", name:"Tajikistan / English"},{value:"TZ-GB", name:"Tanzania / English"},{value:"TH-GB", name:"Thailand / English"},{value:"TR-GB", name:"Turkey / English"},{value:"TM-GB", name:"Turkmenistan / English"},{value:"UA-GB", name:"Ukraine / English"},{value:"GB-GB", name:"United Kingdom / English"},{value:"AE-GB", name:"United Arab Emirates / English"},{value:"UG-GB", name:"Uganda / English"},{value:"US-GB", name:"United  States / English"},{value:"UZ-GB", name:"Uzbekistan / English"},{value:"VE-GB", name:"Venezuela / English"},{value:"VN-GB", name:"Vietnam / English"}];
var dlEditions = [{value:"de_de", name:"Germany"},{value:"www_us", name:"US"}];
var ibEditions = [{value:"es-AO", name:"Angola - Español"},{value:"pt-AO", name:"Angola - Português"},{value:"es-DZ", name:"Argelia - Español"},{value:"fr-DZ", name:"Algérie - Français"},{value:"en-AR", name:"Argentina - English"},{value:"es-AR", name:"Argentina - Español"},{value:"en-BE", name:"Belgium - English"},{value:"es-BE", name:"Bélgica - Español"},{value:"fr-BE", name:"Belgique - Français"},{value:"es-BR", name:"Brasil - Español"},{value:"pt-BR", name:"Brasil - Português"},{value:"en-CL", name:"Chile - English"},{value:"es-CL", name:"Chile - Español"},{value:"en-CO", name:"Colombia - English"},{value:"es-CO", name:"Colombia - Español"},{value:"en-CR", name:"Costa Rica - English"},{value:"es-CR", name:"Costa Rica - Español"},{value:"en-HR", name:"Croatia - English"},{value:"es-HR", name:"Croacia - Español"},{value:"it-HR", name:"Croazia - Italiano"},{value:"en-CU", name:"Cuba - English"},{value:"es-CU", name:"Cuba - Español"},{value:"en-CZ", name:"Czech Republic - English"},{value:"es-CZ", name:"República Checa - Español"},{value:"en-DK", name:"Denmark - English"},{value:"es-DK", name:"Dinamarca - Español"},{value:"de-DE", name:"Deutschland - Deutsch"},{value:"es-DE", name:"Alemania - Español"},{value:"en-DO", name:"Dominican Republic - English"},{value:"es-DO", name:"República Dominicana - Español"},{value:"en-EC", name:"Ecuador - English"},{value:"es-EC", name:"Ecuador - Español"},{value:"en-SV", name:"El Salvador - English"},{value:"es-SV", name:"El Salvador - Español"},{value:"en-GQ", name:"Equatorial Guinea - English"},{value:"es-GQ", name:"Guinea Ecuatorial - Español"},{value:"ca-ES", name:"Espanya - Català"},{value:"en-ES", name:"Spain - English"},{value:"es-ES", name:"España - Español"},{value:"es-FR", name:"Francia - Español"},{value:"fr-FR", name:"France - Français"},{value:"en-GH", name:"Ghana - English"},{value:"es-GH", name:"Ghana - Español"},{value:"en-GR", name:"Greece - English"},{value:"es-GR", name:"Grecia - Español"},{value:"en-GT", name:"Guatemala - English"},{value:"es-GT", name:"Guatemala - Español"},{value:"en-HN", name:"Honduras - English"},{value:"es-HN", name:"Honduras - Español"},{value:"en-IE", name:"Ireland - English"},{value:"es-IE", name:"Irlanda - Español"},{value:"en-IL", name:"Israel - English"},{value:"es-IL", name:"Israel - Español"},{value:"en-IT", name:"Italy - English"},{value:"es-IT", name:"Italia - Español"},{value:"it-IT", name:"Italia - Italiano"},{value:"en-JP", name:"Japan - English"},{value:"es-JP", name:"Japón - Español"},{value:"ja-JP", name:"日本 - 日本語"},{value:"en-MT", name:"Malta - English"},{value:"es-MT", name:"Malta - Español"},{value:"it-MT", name:"Malta - Italiano"},{value:"es-MA", name:"Marruecos - Español"},{value:"fr-MA", name:"Maroc - Français"},{value:"es-MR", name:"Mauritania - Español"},{value:"fr-MR", name:"Mauritanie - Français"},{value:"en-MX", name:"Mexico - English"},{value:"es-MX", name:"México - Español"},{value:"en-NL", name:"Netherlands - English"},{value:"es-NL", name:"Holanda - Español"},{value:"nl-NL", name:"Nederland - Nederlands"},{value:"en-NI", name:"Nicaragua - English"},{value:"es-NI", name:"Nicaragua - Español"},{value:"en-NG", name:"Nigeria - English"},{value:"es-NG", name:"Nigeria - Español"},{value:"en-PA", name:"Panama - English"},{value:"es-PA", name:"Panamá - Español"},{value:"en-PE", name:"Peru - English"},{value:"es-PE", name:"Perú - Español"},{value:"es-PT", name:"Portugal - Español"},{value:"pt-PT", name:"Portugal - Português"},{value:"en-PR", name:"Puerto Rico - English"},{value:"es-PR", name:"Puerto Rico - Español"},{value:"en-RU", name:"Russian Federation - English"},{value:"es-RU", name:"Rusia - Español"},{value:"ru-RU", name:"Rossiya - Русский"},{value:"de-CH", name:"Schweiz - Deutsch"},{value:"es-CH", name:"Suiza - Español"},{value:"fr-CH", name:"Suisse - Français"},{value:"es-SN", name:"Senegal - Español"},{value:"fr-SN", name:"Sénégal - Français"},{value:"en-ZA", name:"South Africa - English"},{value:"es-ZA", name:"Sudáfrica - Español"},{value:"en-SE", name:"Sweden - English"},{value:"es-SE", name:"Suecia - Español"},{value:"en-TR", name:"Turkey - English"},{value:"es-TR", name:"Turquía - Español"},{value:"en-US", name:"USA - English"},{value:"es-US", name:"USA - Español"},{value:"en-GB", name:"United Kingdom - English"},{value:"es-GB", name:"Reino Unido - Español"},{value:"en-UY", name:"Uruguay - English"},{value:"es-UY", name:"Uruguay - Español"},{value:"en-VE", name:"Venezuela - English"},{value:"es-VE", name:"Venezuela - Español"}];
var ibCurrencies = [{value:"EUR", name:"EUR"},{value:"GBP", name:"GBP"},{value:"USD", name:"USD"}];
var klEditions = [{value:"de_de", name:"Germany / Deutsch"},{value:"de_en", name:"Germany / English"},{value:"fr_en", name:"France / English"},{value:"fr_fr", name:"France / French"},{value:"nl_en", name:"Netherlands / English"},{value:"gb_en", name:"United Kingdom / English"},{value:"us_en", name:"US / English"}];
var laEditions = [{value:"es_ar", name:"Argentina / Spanish"},{value:"pt_br", name:"Brasil / Portuguese"},{value:"es_cl", name:"Chile / Spanish"},{value:"es_co", name:"Colombia / Spanish"},{value:"es_ec", name:"Ecuador / Spanish"},{value:"es_pe", name:"Peru / Spanish"},{value:"es_uy", name:"Uruguay / Spanish"},{value:"en_us", name:"US / English"},{value:"es_mx", name:"Mexico / Spanish"},{value:"en_ca", name:"Canada / English"},{value:"de_de", name:"Germany / German"},{value:"es_es", name:"Spain / Spanish"},{value:"fr_fr", name:"France / French"},{value:"en_it", name:"Italy / English"},{value:"en_uk", name:"UK / English"},{value:"en_ue", name:"Rest of Europe / English"},{value:"en_au", name:"Australia / English"},{value:"en_nz", name:"New Zealand / English"},{value:"es_un", name:"Other Countries / Spanish"},{value:"en_un", name:"Other Countries / English"}];
var lhEditions = [{value:"AL-gb", name:"Albania / English"},{value:"DZ-fr", name:"Algeria / Français"},{value:"AO-gb", name:"Angola / English"},{value:"AR-es", name:"Argentina / Español"},{value:"AM-gb", name:"Armenia / English"},{value:"AU-gb", name:"Australia / English"},{value:"AT-de", name:"Austria / Deutsch"},{value:"AT-gb", name:"Austria / English"},{value:"AZ-gb", name:"Azerbaijan / English"},{value:"BH-gb", name:"Bahrain / English"},{value:"BY-gb", name:"Belarus / English"},{value:"BE-gb", name:"Belgium / English"},{value:"BA-gb", name:"Bosnia/Hercegovina / English"},{value:"BR-pt", name:"Brazil / Português"},{value:"BG-gb", name:"Bulgaria / English"},{value:"CA-gb", name:"Canada / English"},{value:"CA-fr", name:"Canada / Français"},{value:"CL-es", name:"Chile / Español"},{value:"CN-gb", name:"China / English"},{value:"CO-es", name:"Colombia / Español"},{value:"HR-gb", name:"Croatia / English"},{value:"CY-gb", name:"Cyprus / English"},{value:"CZ-gb", name:"Czech Republic / English"},{value:"DK-gb", name:"Denmark / English"},{value:"EG-gb", name:"Egypt / English"},{value:"GQ-gb", name:"Equatorial Guinea / English"},{value:"ER-gb", name:"Eritrea / English"},{value:"EE-gb", name:"Estonia / English"},{value:"ET-gb", name:"Ethiopia / English"},{value:"FI-gb", name:"Finland / English"},{value:"FR-gb", name:"France / English"},{value:"FR-fr", name:"France / Français"},{value:"GA-gb", name:"Gabon / English"},{value:"GE-gb", name:"Georgia / English"},{value:"DE-de", name:"Germany / Deutsch"},{value:"DE-gb", name:"Germany / English"},{value:"GH-gb", name:"Ghana / English"},{value:"GR-gb", name:"Greece / English"},{value:"HK-gb", name:"Hong Kong / English"},{value:"HU-gb", name:"Hungary / English"},{value:"IS-gb", name:"Iceland / English"},{value:"IN-gb", name:"India / English"},{value:"ID-gb", name:"Indonesia / English"},{value:"IR-gb", name:"Iran / English"},{value:"IQ-gb", name:"Iraq / English"},{value:"IE-gb", name:"Ireland / English"},{value:"IL-gb", name:"Israel / English"},{value:"IT-it", name:"Italy / Italiano"},{value:"IT-gb", name:"Italy / English"},{value:"JP-gb", name:"Japan / English"},{value:"JO-gb", name:"Jordan / English"},{value:"KZ-gb", name:"Kazakhstan / English"},{value:"KE-gb", name:"Kenya / English"},{value:"KR-gb", name:"Republic of Korea / English"},{value:"KW-gb", name:"Kuwait / English"},{value:"LV-gb", name:"Latvia / English"},{value:"LB-gb", name:"Lebanon / English"},{value:"LY-gb", name:"Libya / English"},{value:"LT-gb", name:"Lithuania / English"},{value:"LU-gb", name:"Luxembourg / English"},{value:"MY-gb", name:"Malaysia / English"},{value:"MV-gb", name:"Maldives / English"},{value:"MT-gb", name:"Malta / English"},{value:"MU-gb", name:"Mauritius / English"},{value:"MX-es", name:"Mexico / Español"},{value:"MD-gb", name:"Moldova / English"},{value:"MA-fr", name:"Morocco / Français"},{value:"NL-gb", name:"Netherlands / English"},{value:"NZ-gb", name:"New Zealand / English"},{value:"NG-gb", name:"Nigeria / English"},{value:"NO-gb", name:"Norway / English"},{value:"OM-gb", name:"Oman / English"},{value:"PK-gb", name:"Pakistan / English"},{value:"PA-es", name:"Panama / Español"},{value:"PH-gb", name:"Philippines / English"},{value:"PL-gb", name:"Poland / English"},{value:"PL-pl", name:"Poland / Polski"},{value:"PT-gb", name:"Portugal / English"},{value:"PT-pt", name:"Portugal / Português"},{value:"QA-gb", name:"Qatar / English"},{value:"CD-gb", name:"Republic of the Congo / English"},{value:"RO-gb", name:"Romania / English"},{value:"RU-gb", name:"Russia / English"},{value:"RU-ru", name:"Russia / Русский"},{value:"SA-gb", name:"Saudi Arabia / English"},{value:"RS-gb", name:"Serbia / English"},{value:"SG-gb", name:"Singapore / English"},{value:"SK-gb", name:"Slovakia / English"},{value:"SI-gb", name:"Slovenia / English"},{value:"ZA-gb", name:"South Africa / English"},{value:"ES-gb", name:"Spain / English"},{value:"ES-es", name:"Spain / Español"},{value:"SD-gb", name:"Sudan / English"},{value:"SE-gb", name:"Sweden / English"},{value:"CH-de", name:"Switzerland / Deutsch"},{value:"CH-gb", name:"Switzerland / English"},{value:"CH-fr", name:"Switzerland / Français"},{value:"TW-gb", name:"Taiwan / English "},{value:"TH-gb", name:"Thailand / English"},{value:"TN-fr", name:"Tunisia / Français"},{value:"TR-gb", name:"Turkey / English"},{value:"TM-gb", name:"Turkmenistan / English"},{value:"UA-gb", name:"Ukraine / English"},{value:"AE-gb", name:"United Arab Emirates / English"},{value:"UK-gb", name:"United Kingdom / English"},{value:"US-gb", name:"United States / English"},{value:"VE-es", name:"Venezuela / Español"},{value:"VN-gb", name:"Vietnam / English"},{value:"XX-gb", name:"Other countries / English"}];
var lxEditions = [{value:"de_de", name:"Germany"},{value:"us_en", name:"US"}];


var classSettings = new Object();
classSettings["startpage"] = new Object();
classSettings["startpage"]["maindiv"]="IR6M2QD-w-d"; //Container of main content. Unfortunately id "contentwrapper" is used twice
classSettings["resultpage"] = new Object();
classSettings["resultpage"]["itin"]="IR6M2QD-v-d"; //Container with headline: "Intinerary"
classSettings["resultpage"]["itinRow"]="IR6M2QD-k-i"; // TR in itin with Orig, Dest and date
classSettings["resultpage"]["milagecontainer"]="IR6M2QD-v-e"; // TD-Container on the right
classSettings["resultpage"]["rulescontainer"]="IR6M2QD-l-d"; // First container before rulelinks (the one with Fare X:)
classSettings["resultpage"]["htbContainer"]="IR6M2QD-l-k"; // full "how to buy"-container inner div (td=>div=>div) 
classSettings["resultpage"]["htbLeft"]="IR6M2QD-l-g"; // Left column in the "how to buy"-container
classSettings["resultpage"]["htbRight"]="IR6M2QD-l-f"; // Class for normal right column
classSettings["resultpage"]["htbGreyBorder"]="IR6M2QD-l-l"; // Class for right cell with light grey border (used for subtotal of passenger)
//inline
classSettings["resultpage"]["mcDiv"]="IR6M2QD-y-d";  // Right menu sections class (3 divs surrounding entire Mileage, Emissions, and Airport Info)
classSettings["resultpage"]["mcHeader"]="IR6M2QD-y-b"; // Right menu header class ("Mileage", etc.)
classSettings["resultpage"]["mcLinkList"]="IR6M2QD-y-c"; // Right menu ul list class (immediately following header)

var matrixCurrencies=[{p:/US\$/,c:"USD"},{p:/\€/,c:"EUR"},{p:/\£/,c:"GBP"},{p:/CA\$/,c:"CAD"},{p:/RS\./,c:"INR"}];
                       
var translations = new Object();
translations["de"] = new Object();
translations["de"]["use"]="&Ouml;ffne ";
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
translations["de"]["resultpage"][" Dec "]=" Dezember ";
translations["de"]["resultpage"]["OPERATED BY "]="Durchgef&uuml;hrt von ";

// initialize local storage for resolved distances
var distances = new Object();
// initialize local storage for current itin
var currentItin = new Object();
// initialize local storage for passenger details
var mtpPassengerConfig = {adults:1, infantsLap:0, infantsSeat:0, cAges:new Array()};

if (mptSettings["scriptEngine"] === 0 && window.top === window.self) {
 startScript(); 
} else if( window.top === window.self ) {
  // execute language detection and afterwards functions for current page
  if (typeof window.addEventListener !== "undefined"){
  window.addEventListener('load', startScript(), false);
  } else if (typeof window.attachEvent !== "undefined") {
  window.attachEvent("onload", startScript());    
  } else {
  window.onload = startScript();
  }
}

function startScript(){
  if (document.getElementById("mptSettingsContainer") === null ) {
    // Create CSS and Settings or anything else that needs to be executed once
    injectCss();
    createUsersettings();
  }
  if (window.location.href !== mptSettings["laststatus"]){
    setTimeout(function(){getPageLang();}, 100);
    mptSettings["laststatus"]=window.location.href;
  }
  if ( mptSettings["scriptrunning"] === 1 ){
   setTimeout(function(){startScript();}, 500); 
  }  
}

/**************************************** Settings Stuff *****************************************/
function createUsersettings(){
    var str="";
    var settingscontainer = document.createElement('div');
    settingscontainer.setAttribute('id', 'mptSettingsContainer');
    settingscontainer.setAttribute('style', 'border-bottom: 1px dashed grey;');
    settingscontainer.innerHTML = '<div style="display:inline-block;float:left;cursor:pointer;" id="passengervistoogler">Passengers (<label id="mtpPaxCount">1a</label>)</div><div id="mptStartparse" class="invis" style="margin-left:20px;display:none;cursor:pointer">Editor-Mode:Parse!</div><div id="mtpNotification" style="margin-left:50px;display:inline-block;"></div><div style="display:inline-block;float:right;"><div id="settingsvistoggler" style="display:inline-block;cursor:pointer;">Settings</div> (v'+mptSettings["version"]+') <div id="mptCabintoggler" style="display:inline-block;">(Cabin: <label id="mptCabinMode" style="width:30px;text-align:center;cursor:pointer;display:inline-block">Auto</label>)</div></div><div id="mptSettings" class="invis" style="display:none;border-top: 1px dotted grey;"></div><div id="mptPassengers" class="invis" style="display:none;border-top: 1px dotted grey;"></div>';
    var target=document.getElementById("contentwrapper");
    target.parentNode.insertBefore(settingscontainer, target);
    document.getElementById('settingsvistoggler').onclick=function(){toggleVis(document.getElementById("mptSettings"));};
    document.getElementById('passengervistoogler').onclick=function(){toggleVis(document.getElementById("mptPassengers"));};
    // Build settings
    target=document.getElementById("mptSettings");
    str ='<div style="text-align:center;font-weight:bold">**** Display Settings: ****</div>';
    str +='<div style="margin:5px 0;"><div style="float:left;width:25%">';
    str +='<div id="mpttimeformat">Timeformat:<label style="cursor:pointer;">'+printSettingsvalue("timeformat")+'</label></div>';   
    str +='<div id="mptlanguage">Language:<label style="cursor:pointer;">'+printSettingsvalue("language")+'</label></div>';
    str +='</div><div style="float:left;width:25%">';
    str +='<div id="mptenableDeviders">Enable deviders:<label style="cursor:pointer;">'+printSettingsvalue("enableDeviders")+'</label></div>';
    str +='<div id="mptenableInlinemode">Inlinemode:<label style="cursor:pointer;">'+printSettingsvalue("enableInlinemode")+'</label></div>';
    str +='</div><div style="float:left;width:25%">';
    str +='<div id="mptenableFarerules">Open fare-rules in new window:<label style="cursor:pointer;">'+printSettingsvalue("enableFarerules")+'</label></div>';
    str +='<div id="mptenablePricebreakdown">Price breakdown:<label style="cursor:pointer;">'+printSettingsvalue("enablePricebreakdown")+'</label></div>';
    str +='</div><div style="float:left;width:25%">';
    str +='<div id="mptlinkFontsize">Link font size:<label style="cursor:pointer;">'+printSettingsvalue("linkFontsize")+'</label>%</div>';
    str +='</div><div style="clear:both"></div></div>';
    str +='<div style="text-align:center;font-weight:bold">**** Feature Settings: ****</div>';
    str +='<div style="margin:5px 0"><div style="float:left;width:25%">';
    str +='<div id="mptenableEditormode">Editor mode:<label style="cursor:pointer;">'+printSettingsvalue("enableEditormode")+'</label></div>';
    str +='</div><div style="float:left;width:25%">';
    str +='<div id="mptenableMilesbreakdown">Miles breakdown:<label style="cursor:pointer;">'+printSettingsvalue("enableMilesbreakdown")+'</label></div>';
    str +='<div id="mptenableMilesbreakdownautoload">Miles breakdown autoload:<label style="cursor:pointer;">'+printSettingsvalue("enableMilesbreakdownautoload")+'</label></div>';
    str +='<div id="mptenableMilesInlinemode">Print miles breakdown inline:<label style="cursor:pointer;">'+printSettingsvalue("enableMilesInlinemode")+'</label></div>';
    str +='</div><div style="float:left;width:25%">';
    str +='<div id="mptenableIMGautoload">Images autoload:<label style="cursor:pointer;">'+printSettingsvalue("enableIMGautoload")+'</label></div>';
    str +='<div id="mptenableWheretocredit">Enable WhereToCredit:<label style="cursor:pointer;">'+printSettingsvalue("enableWheretocredit")+'</label></div>';
    str +='<div id="mptenableFarefreaks">Enable FareFreaks:<label style="cursor:pointer;">'+printSettingsvalue("enableFarefreaks")+'</label></div>';
    str +='</div><div style="float:left;width:25%">';
    str +='<div id="mptenablePlanefinder">Enable Planefinder:<label style="cursor:pointer;">'+printSettingsvalue("enablePlanefinder")+'</label></div>';
    str +='<div id="mptenableSeatguru">Enable Seatguru:<label style="cursor:pointer;">'+printSettingsvalue("enableSeatguru")+'</label></div>';    
    str +='<div id="mptenableNonDeltaAirlineOnDL">Price non-DL airline on dl.com:<label style="cursor:pointer;">'+printSettingsvalue("enableNonDeltaAirlineOnDL")+'</label></div>';
    str +='</div><div style="clear:both"></div></div>'; 
    str +='<div style="text-align:center;font-weight:bold">**** Provider Editions: ****</div>';
    str +='<div style="margin:5px 0">';
    str +='<div id="mptaaEdition" style="width:33%;float:left;">American Edition (Europe/Asia/Pacific):<label style="cursor:pointer;">'+printSettingsvalue("aaEdition")+'</label></div>';
    str +='<div id="mptaac1Edition" style="width:33%;float:left;">American Edition (America & UK):<label style="cursor:pointer;">'+printSettingsvalue("aac1Edition")+'</label></div>';
    str +='<div id="mptaac1Currency" style="width:33%;float:left;">American Currency (America & UK):<label style="cursor:pointer;">'+printSettingsvalue("aac1Currency")+'</label></div>';
    str +='<div id="mptacEdition" style="width:33%;float:left;">Air Canada Edition:<label style="cursor:pointer;">'+printSettingsvalue("acEdition")+'</label></div>';
    str +='<div id="mptafEdition" style="width:33%;float:left;">Air France Edition:<label style="cursor:pointer;">'+printSettingsvalue("afEdition")+'</label></div>';
    str +='<div id="mptazEdition" style="width:33%;float:left;">Alitalia Edition:<label style="cursor:pointer;">'+printSettingsvalue("azEdition")+'</label></div>';
    str +='<div id="mptbaLanguage" style="width:33%;float:left;">British Airways Language:<label style="cursor:pointer;">'+printSettingsvalue("baLanguage")+'</label></div>';
    str +='<div id="mptbaEdition" style="width:33%;float:left;">British Airways Edition:<label style="cursor:pointer;">'+printSettingsvalue("baEdition")+'</label></div>';
    str +='<div id="mptczEdition" style="width:33%;float:left;">China Southern Edition:<label style="cursor:pointer;">'+printSettingsvalue("czEdition")+'</label></div>';
    str +='<div id="mptdlEdition" style="width:33%;float:left;">Delta Edition:<label style="cursor:pointer;">'+printSettingsvalue("dlEdition")+'</label></div>';
    str +='<div id="mptibEdition" style="width:33%;float:left;">Iberia Edition:<label style="cursor:pointer;">'+printSettingsvalue("ibEdition")+'</label></div>';
    //str +='<div id="mptibCurrency" style="width:33%;float:left;">Iberia Currency:<label style="cursor:pointer;">'+printSettingsvalue("ibCurrency")+'</label></div>'; // not supported
    str +='<div id="mptklEdition" style="width:33%;float:left;">KLM Edition:<label style="cursor:pointer;">'+printSettingsvalue("klEdition")+'</label></div>';
    str +='<div id="mptlaEdition" style="width:33%;float:left;">LAN Edition:<label style="cursor:pointer;">'+printSettingsvalue("laEdition")+'</label></div>';
    str +='<div id="mptlhEdition" style="width:33%;float:left;">Lufthansa Edition:<label style="cursor:pointer;">'+printSettingsvalue("lhEdition")+'</label></div>';
    str +='<div id="mptlxEdition" style="width:33%;float:left;">Swiss Edition:<label style="cursor:pointer;">'+printSettingsvalue("lxEdition")+'</label></div>';
    str +='<div style="clear:both"></div></div>';
    str +='<div style="text-align:center;font-weight:bold"><label id="configcloser" style="cursor:pointer;">Close</label><div>';
    target.innerHTML=str;  
    document.getElementById('mpttimeformat').onclick=function(){toggleSettings("timeformat");};
    document.getElementById('mptlanguage').onclick=function(){toggleSettings("language");};
    document.getElementById('mptenableDeviders').onclick=function(){toggleSettings("enableDeviders");};
    document.getElementById('mptenableInlinemode').onclick=function(){toggleSettings("enableInlinemode");};
    document.getElementById('mptenableEditormode').onclick=function(){toggleSettings("enableEditormode");};
    document.getElementById('mptenableIMGautoload').onclick=function(){toggleSettings("enableIMGautoload");};
    document.getElementById('mptenableFarerules').onclick=function(){toggleSettings("enableFarerules");};
    document.getElementById('mptenablePricebreakdown').onclick=function(){toggleSettings("enablePricebreakdown");};
    document.getElementById('mptenableMilesbreakdown').onclick=function(){toggleSettings("enableMilesbreakdown");};
    document.getElementById('mptlinkFontsize').onclick=function(){toggleSettings("linkFontsize");}; 
    document.getElementById('mptenableMilesbreakdownautoload').onclick=function(){toggleSettings("enableMilesbreakdownautoload");}; 
    document.getElementById('mptenableMilesInlinemode').onclick=function(){toggleSettings("enableMilesInlinemode");};
    document.getElementById('mptenablePlanefinder').onclick=function(){toggleSettings("enablePlanefinder");};
    document.getElementById('mptenableSeatguru').onclick=function(){toggleSettings("enableSeatguru");};
    document.getElementById('mptenableWheretocredit').onclick=function(){toggleSettings("enableWheretocredit");};
    document.getElementById('mptenableFarefreaks').onclick=function(){toggleSettings("enableFarefreaks");};
    document.getElementById('mptenableNonDeltaAirlineOnDL').onclick=function(){toggleSettings("enableNonDeltaAirlineOnDL");};
    document.getElementById('mptaaEdition').onclick=function(){toggleSettings("aaEdition");};
    document.getElementById('mptaac1Edition').onclick=function(){toggleSettings("aac1Edition");};
    document.getElementById('mptaac1Currency').onclick=function(){toggleSettings("aac1Currency");};
    document.getElementById('mptacEdition').onclick=function(){toggleSettings("acEdition");};      
    document.getElementById('mptafEdition').onclick=function(){toggleSettings("afEdition");};
    document.getElementById('mptazEdition').onclick=function(){toggleSettings("azEdition");};
    document.getElementById('mptbaLanguage').onclick=function(){toggleSettings("baLanguage");};
    document.getElementById('mptbaEdition').onclick=function(){toggleSettings("baEdition");};
    document.getElementById('mptczEdition').onclick=function(){toggleSettings("czEdition");};
    document.getElementById('mptdlEdition').onclick=function(){toggleSettings("dlEdition");};  
    document.getElementById('mptibEdition').onclick=function(){toggleSettings("ibEdition");}; 
    //document.getElementById('mptibCurrency').onclick=function(){toggleSettings("ibCurrency");};  // not supported
    document.getElementById('mptklEdition').onclick=function(){toggleSettings("klEdition");};
    document.getElementById('mptlaEdition').onclick=function(){toggleSettings("laEdition");};
    document.getElementById('mptlhEdition').onclick=function(){toggleSettings("lhEdition");};
    document.getElementById('mptlxEdition').onclick=function(){toggleSettings("lxEdition");};
    document.getElementById('mptCabintoggler').onclick=function(){toggleSettings("cabin");};
    document.getElementById('configcloser').onclick=function(){toggleVis(document.getElementById("mptSettings"));};
    document.getElementById('mptStartparse').onclick=function(){document.getElementById('mptStartparse').style.display="none";setTimeout(function(){fePS();}, 50);}; 
  
    // Build passengers
    target=document.getElementById("mptPassengers");
    str ='<div style="float:left;width:25%">';
    str +='<div style="margin:2px 0"><label style="width:100px;display:inline-block">Adults:</label> <select name="numAdults" id="numAdults" style="width:50px">';
    for (var i = 1; i<=9; i++) {
     str +='<option>'+i+'</option>'; 
    }
    str +='</select></div>';
    str +='<div style="margin:2px 0"><label style="width:100px;display:inline-block">Infants (Lap):</label> <select name="numInfantsLap" id="numInfantsLap" style="width:50px">';
    for (var i = 0; i<=9; i++) {
     str +='<option>'+i+'</option>'; 
    }
    str +='</select></div>';
    str +='<div style="margin:2px 0"><label style="width:100px;display:inline-block">Infants (Seat):</label> <select name="numInfantsSeat" id="numInfantsSeat" style="width:50px">';
    for (var i = 0; i<=9; i++) {
     str +='<option>'+i+'</option>'; 
    }
    str +='</select></div>';  
    str +='</div><div style="float:left;width:25%">';
    for (var k = 1; k<=3; k++) {
      str +='<div style="margin:2px 0"><label style="width:100px;display:inline-block">Child '+k+' - Age:</label> <select name="child'+k+'age" id="child'+k+'age" style="width:50px">';
      str +='<option value="-1">-</option>'; 
      for (var i = 2; i<=17; i++) {
       str +='<option value="'+i+'">'+i+'</option>'; 
      }
      str +='</select></div>';
    }
    str +='</div><div style="float:left;width:25%">';  
    for (var k = 4; k<=6; k++) {
      str +='<div style="margin:2px 0"><label style="width:100px;display:inline-block">Child '+k+' - Age:</label> <select name="child'+k+'age" id="child'+k+'age" style="width:50px">';
      str +='<option value="-1">-</option>'; 
      for (var i = 2; i<=17; i++) {
       str +='<option value="'+i+'">'+i+'</option>'; 
      }
      str +='</select></div>';
    }
    str +='</div><div style="float:left;width:25%">';  
    for (var k = 7; k<=8; k++) {
      str +='<div style="margin:2px 0"><label style="width:100px;display:inline-block">Child '+k+' - Age:</label> <select name="child'+k+'age" id="child'+k+'age" style="width:50px">';
      str +='<option value="-1">-</option>';
      for (var i = 2; i<=17; i++) {
       str +='<option value="'+i+'">'+i+'</option>'; 
      }
      str +='</select></div>';
    }
    str +='<div style="width:150px;margin:2px 0"><div id="mtpConfirmPax" style="float:left;width:50%;text-align:center;cursor:pointer;font-weight:bold">Confirm</div><div id="mtpCancelPax" style="float:left;width:50%;text-align:center;cursor:pointer;font-weight:bold">Cancel</div></div>';
    str +='</div><div style="clear:both;"></div>';
    target.innerHTML=str;
    document.getElementById('mtpCancelPax').onclick=function(){toggleVis(document.getElementById("mptPassengers"));};
    document.getElementById('mtpConfirmPax').onclick=function(){processPassengers();};
}
function toggleVis(target){
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
      case "linkFontsize":
         if (mptUsersettings["linkFontsize"]<=190 && mptUsersettings["linkFontsize"]>=50){
           mptUsersettings["linkFontsize"]+=10;
         } else {
           mptUsersettings["linkFontsize"]=50;
         }
          break;             
      case "acEdition":
      		if (acEditions.indexOf(mptUsersettings["acEdition"]) == (acEditions.length - 1)) {
			      mptUsersettings["acEdition"] = acEditions[0];
      		} else {
      			mptUsersettings["acEdition"] = acEditions[(acEditions.indexOf(mptUsersettings["acEdition"]) + 1)];	
      		}
      	break;
     case "aaEdition":
          var pos=findPositionForValue(mptUsersettings["aaEdition"],aaEditions);
      		if (pos >= (aaEditions.length - 1) || pos === -1) {
			      mptUsersettings["aaEdition"] = aaEditions[0]["value"];
      		} else {
            pos++;
      			mptUsersettings["aaEdition"] = aaEditions[pos]["value"];	
      		}
      	break;
     case "aac1Edition":
          var pos=findPositionForValue(mptUsersettings["aac1Edition"],aac1Editions);
      		if (pos >= (aac1Editions.length - 1) || pos === -1) {
			      mptUsersettings["aac1Edition"] = aac1Editions[0]["value"];
      		} else {
            pos++;
      			mptUsersettings["aac1Edition"] = aac1Editions[pos]["value"];	
      		}
      	break;
     case "aac1Currency":
          var pos=findPositionForValue(mptUsersettings["aac1Currency"],aac1Currencies);
      		if (pos >= (aac1Currencies.length - 1) || pos === -1) {
			      mptUsersettings["aac1Currency"] = aac1Currencies[0]["value"];
      		} else {
            pos++;
      			mptUsersettings["aac1Currency"] = aac1Currencies[pos]["value"];	
      		}
      	break; 
     case "afEdition":
          var pos=findPositionForValue(mptUsersettings["afEdition"],afEditions);
      		if (pos >= (afEditions.length - 1) || pos === -1) {
			      mptUsersettings["afEdition"] = afEditions[0]["value"];
      		} else {
            pos++;
      			mptUsersettings["afEdition"] = afEditions[pos]["value"];	
      		}
      	break;
     case "azEdition":
          var pos=findPositionForValue(mptUsersettings["azEdition"],azEditions);
      		if (pos >= (azEditions.length - 1) || pos === -1) {
			      mptUsersettings["azEdition"] = azEditions[0]["value"];
      		} else {
            pos++;
      			mptUsersettings["azEdition"] = azEditions[pos]["value"];	
      		}
      	break;
     case "baLanguage":
          var pos=findPositionForValue(mptUsersettings["baLanguage"],baLanguages);
      		if (pos >= (baLanguages.length - 1) || pos === -1) {
			      mptUsersettings["baLanguage"] = baLanguages[0]["value"];
      		} else {
            pos++;
      			mptUsersettings["baLanguage"] = baLanguages[pos]["value"];	
      		}
      	break;       
     case "baEdition":
          var pos=findPositionForValue(mptUsersettings["baEdition"],baEditions);
      		if (pos >= (baEditions.length - 1) || pos === -1) {
			      mptUsersettings["baEdition"] = baEditions[0]["value"];
      		} else {
            pos++;
      			mptUsersettings["baEdition"] = baEditions[pos]["value"];	
      		}
      	break;
     case "czEdition":
          var pos=findPositionForValue(mptUsersettings["czEdition"],czEditions);
      		if (pos >= (czEditions.length - 1) || pos === -1) {
			      mptUsersettings["czEdition"] = czEditions[0]["value"];
      		} else {
            pos++;
      			mptUsersettings["czEdition"] = czEditions[pos]["value"];	
      		}
      	break;       
     case "dlEdition":
          var pos=findPositionForValue(mptUsersettings["dlEdition"],dlEditions);
      		if (pos >= (dlEditions.length - 1) || pos === -1) {
			      mptUsersettings["dlEdition"] = dlEditions[0]["value"];
      		} else {
            pos++;
      			mptUsersettings["dlEdition"] = dlEditions[pos]["value"];	
      		}
      	break;
     case "ibEdition":
          var pos=findPositionForValue(mptUsersettings["ibEdition"],ibEditions);
      		if (pos >= (ibEditions.length - 1) || pos === -1) {
			      mptUsersettings["ibEdition"] = ibEditions[0]["value"];
      		} else {
            pos++;
      			mptUsersettings["ibEdition"] = ibEditions[pos]["value"];	
      		}
      	break;
     case "ibCurrency":
          var pos=findPositionForValue(mptUsersettings["ibCurrency"],ibCurrencies);
      		if (pos >= (ibCurrencies.length - 1) || pos === -1) {
			      mptUsersettings["ibCurrency"] = ibCurrencies[0]["value"];
      		} else {
            pos++;
      			mptUsersettings["ibCurrency"] = ibCurrencies[pos]["value"];	
      		}
      	break;       
     case "klEdition":
          var pos=findPositionForValue(mptUsersettings["klEdition"],klEditions);
      		if (pos >= (klEditions.length - 1) || pos === -1) {
			      mptUsersettings["klEdition"] = klEditions[0]["value"];
      		} else {
            pos++;
      			mptUsersettings["klEdition"] = klEditions[pos]["value"];	
      		}
      	break;
     case "laEdition":
          var pos=findPositionForValue(mptUsersettings["laEdition"],laEditions);
      		if (pos >= (laEditions.length - 1) || pos === -1) {
			      mptUsersettings["laEdition"] = laEditions[0]["value"];
      		} else {
            pos++;
      			mptUsersettings["laEdition"] = laEditions[pos]["value"];	
      		}
      	break;
     case "lhEdition":
          var pos=findPositionForValue(mptUsersettings["lhEdition"],lhEditions);
      		if (pos >= (lhEditions.length - 1) || pos === -1) {
			      mptUsersettings["lhEdition"] = lhEditions[0]["value"];
      		} else {
            pos++;
      			mptUsersettings["lhEdition"] = lhEditions[pos]["value"];	
      		}
      	break;       
     case "lxEdition":
          var pos=findPositionForValue(mptUsersettings["lxEdition"],lxEditions);
      		if (pos >= (lxEditions.length - 1) || pos === -1) {
			      mptUsersettings["lxEdition"] = lxEditions[0]["value"];
      		} else {
            pos++;
      			mptUsersettings["lxEdition"] = lxEditions[pos]["value"];	
      		}
      	break;
      case "cabin":
        if (mptSettings["cabin"]==="Auto"){
          mptSettings["cabin"]="Y";
        } else if (mptSettings["cabin"]==="Y") {
          mptSettings["cabin"]="Y+";
        } else if (mptSettings["cabin"]==="Y+") {
          mptSettings["cabin"]="C";
        } else if (mptSettings["cabin"]==="C") {
          mptSettings["cabin"]="F";
        } else if (mptSettings["cabin"]==="F") {
          mptSettings["cabin"]="Auto";
        }
        document.getElementById('mptCabinMode').innerHTML=mptSettings["cabin"];
        // refresh links
        printLinksContainer();
        return false;
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
      GM.setValue("mptUsersettings", JSON.stringify(mptUsersettings));
    }
}

function processPassengers(){
  var paxText = "";
  var e = false;
  e = document.getElementById("numAdults");
  mtpPassengerConfig.adults=Number(e.options[e.selectedIndex].value);
  e = document.getElementById("numInfantsLap");
  mtpPassengerConfig.infantsLap=Number(e.options[e.selectedIndex].value);
  e = document.getElementById("numInfantsSeat");
  mtpPassengerConfig.infantsSeat=Number(e.options[e.selectedIndex].value);   
  mtpPassengerConfig.cAges=new Array();
  for (var i=1; i<=8; i++) {
   processChild("child"+i+"age"); 
  }
  paxText=mtpPassengerConfig.adults + "a" + (mtpPassengerConfig.cAges.length>0?" "+mtpPassengerConfig.cAges.length+"c":"")+((mtpPassengerConfig.infantsLap+mtpPassengerConfig.infantsSeat)>0?" "+(mtpPassengerConfig.infantsLap+mtpPassengerConfig.infantsSeat)+"i":"");
  document.getElementById('mtpPaxCount').innerHTML = paxText;
  toggleVis(document.getElementById("mptPassengers"));
  // reload links
  printLinksContainer();
}

function processChild(target){
  var e = document.getElementById(target);
  var tmp = 0;
  tmp=Number(e.options[e.selectedIndex].value);
  if (tmp>=2){
    mtpPassengerConfig.cAges.push(tmp);
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
      case "linkFontsize":
          ret=mptUsersettings["linkFontsize"];
          break;       
      case "acEdition":
          ret=mptUsersettings["acEdition"];
          break;
      case "aaEdition":
          ret=findNameForValue(mptUsersettings["aaEdition"],aaEditions);
          break;
      case "aac1Edition":
          ret=findNameForValue(mptUsersettings["aac1Edition"],aac1Editions);
          break;
      case "aac1Currency":
          ret=findNameForValue(mptUsersettings["aac1Currency"],aac1Currencies);
          break;
      case "afEdition":
          ret=findNameForValue(mptUsersettings["afEdition"],afEditions);
          break;
      case "azEdition":
          ret=findNameForValue(mptUsersettings["azEdition"],azEditions);
          break;
      case "baLanguage":
          ret=findNameForValue(mptUsersettings["baLanguage"],baLanguages);
          break;
      case "baEdition":
          ret=findNameForValue(mptUsersettings["baEdition"],baEditions);
          break; 
      case "czEdition":
          ret=findNameForValue(mptUsersettings["czEdition"],czEditions);
          break;          
      case "dlEdition":
          ret=findNameForValue(mptUsersettings["dlEdition"],dlEditions);
          break;
      case "ibEdition":
          ret=findNameForValue(mptUsersettings["ibEdition"],ibEditions);
          break;
      case "ibCurrency":
          ret=findNameForValue(mptUsersettings["ibCurrency"],ibCurrencies);
          break;       
      case "klEdition":
          ret=findNameForValue(mptUsersettings["klEdition"],klEditions);
          break;
      case "laEdition":
          ret=findNameForValue(mptUsersettings["laEdition"],laEditions);
          break;
      case "lhEdition":
          ret=findNameForValue(mptUsersettings["lhEdition"],lhEditions);
          break;        
      case "lxEdition":
          ret=findNameForValue(mptUsersettings["lxEdition"],lxEditions);
          break;       
      default:
          ret=boolToEnabled(mptUsersettings[target]);
  }
  return ret; 
}
function findNameForValue(needle, haystack){  
  var ret="Unknown";
  for (var i in haystack){
    if (haystack[i]["value"]==needle) {
      ret = haystack[i]["name"];
      break;
    }
  }
  return ret;  
}
function findPositionForValue(needle, haystack){
  var ret=-1;
  for (var i in haystack){
    if (haystack[i]["value"]==needle) {
      ret = [i];
      break;
    }
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
     var temp=document.createElement("div");
     temp.appendChild(document.createTextNode(text)); 
     target.appendChild(temp);
   }   
  } 
}
/**************************************** Get Language *****************************************/
function getPageLang(){
    // reset Notification due to pagechange
    printNotification("empty");
    // reset Editor Mode
    document.getElementById('mptStartparse').setAttribute('class', 'invis');
    document.getElementById('mptStartparse').style.display="none";
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
    cyear += 1; // The flight is next year
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
   return "enabled";
   } else {
   return "disabled";
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
function doHttpRequest(url,options,callback){
  if (typeof(callback) !== "function") {
       printNotification("Error: Invalid callback in doHttpRequest -> not a function");
       return false;  
  }
  var xmlHttpObject = false;
  if (typeof(XMLHttpRequest) !== "undefined"){ xmlHttpObject = new XMLHttpRequest(); }
  if (!xmlHttpObject) {
       printNotification("Error: Failed to initialize http request");
       return false;  
  }
  xmlHttpObject.onreadystatechange=function(){
    if (xmlHttpObject.readyState==4 && xmlHttpObject.status==200)
      {
      callback(xmlHttpObject);
      } else if (xmlHttpObject.readyState==4 && xmlHttpObject.status!=200) {
       printNotification("Error: Failed to complete http request");
       return false;  
      }   
   };
  if (options.mode=="get"){
     xmlHttpObject.open("GET",url,true);
     xmlHttpObject.send();
  } else if (options.mode=="post"){
     xmlHttpObject.open("POST",url,true);
    for (var i = 0; i < options.headers.length; i++) {
      xmlHttpObject.setRequestHeader(options.headers[i].name, options.headers[i].val);    
    }
     xmlHttpObject.send(options.data);    
  }

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
function validatePaxcount(config){
  //{maxPaxcount:7, countInf:false, childAsAdult:12, sepInfSeat:false, childMinAge:2}
  var tmpChildren=new Array();
  // push cur children
  for (var i=0; i<mtpPassengerConfig.cAges.length;i++){
      tmpChildren.push(mtpPassengerConfig.cAges[i]);
  }
  var ret= {adults:mtpPassengerConfig.adults, children:new Array(),infLap:mtpPassengerConfig.infantsLap,infSeat:0};
  if (config.sepInfSeat===true){
    ret.infSeat=mtpPassengerConfig.infantsSeat;
  } else {
    for (var i=0; i<mtpPassengerConfig.infantsSeat;i++){
      tmpChildren.push(config.childMinAge);
    }
  }
  // process children
  for (var i=0; i<tmpChildren.length;i++){
    if (tmpChildren[i]<config.childAsAdult) {
       ret.children.push(tmpChildren[i]);
    } else {
       ret.adults++;
    } 
  }
  // check Pax-Count
  if (config.countInf===true){
    if (config.maxPaxcount < ( ret.adults+ret.infLap+ret.infSeat+ret.children.length)) {
      console.log("Too many passengers");
      return false;
    }
  } else {
    if (config.maxPaxcount < ( ret.adults+ret.infSeat+ret.children.length)) {
      console.log("Too many passengers");
      return false;
    }    
  }
  if (0 === ( ret.adults+ret.infSeat+ret.children.length)) {
    console.log("No passengers");
    return false;
  }
  return ret;
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
// editor functions
function bindEditorMode(dir){
  for (var i=0;i<currentItin["itin"].length;i++) {
      // walks each leg
       for (var j=0;j<currentItin["itin"][i]["seg"].length;j++) {
         // bind/unbind cabin & BC
         var target= findItinTarget((i+1),(j+1),"cabin").firstChild;
          if (dir==="create"){
            var tmp=target.innerHTML;    
            var bc=tmp.substr(tmp.length-2,1);
            var cabin=tmp.substr(0,tmp.length-4);
            var tmp = [["Economy","Y"],["Premium Economy","Y+"],["Business","C"],["First","F"]];
            var str='<select style="width:40px" class="editoritem">';
            for (var k = 0; k < tmp.length; k++){
              str +='<option value="'+tmp[k][0]+'"'+(tmp[k][0]===cabin?' selected="selected"':'')+'>'+tmp[k][1]+'</option>';  
            }
            str +='</select>';
            str +=' (<input type="text" class="editoritem" value="'+bc+'" style="width:20px;text-align:center">)';      
          } else {
           var cabin=target.firstChild.options[target.firstChild.selectedIndex].value;
           var bc=target.firstChild.nextSibling.nextSibling.value;
           var str=cabin+' ('+bc+')';   
          }
          target.innerHTML=str;
      }
   }    
}

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
    // empty outputcontainer
    if (document.getElementById('powertoolslinkcontainer')!=undefined){
        var div = document.getElementById('powertoolslinkcontainer');
        div.innerHTML ="";
    }
	
    //  S&D powertool items
  	var elems = findtargets('powertoolsitem');
  	for(var i = elems.length - 1; i >= 0; i--){
  		elems[i].parentNode.removeChild(elems[i]);
  	}
    // S&D price breakdown
    var target=findtarget('pricebreakdown',1);
    if (target!=undefined) target.parentNode.removeChild(target);

    // S&D ff-Container
    var target=findtarget('ff-links',1);
    if (target!=undefined) target.parentNode.removeChild(target);
    var target=findtarget('ff-plancontainer',1);
    if (target!=undefined) target.parentNode.removeChild(target);  
    var target=document.getElementById('ff-routingcodescontainer');
    if (target!=undefined) target.parentNode.removeChild(target); 

  
    // Editor mode?  
    if (mptUsersettings["enableEditormode"]==1 && findtargets("editoritem").length===0){
      toggleVis(document.getElementById('mptStartparse'));
      document.getElementById('mptStartparse').style.display="inline-block";
      readItinerary(false);
      bindEditorMode("create");
      return false;
    } else if (findtargets("editoritem").length>0){
      bindEditorMode("remove");
      toggleVis(document.getElementById('mptStartparse'));
    }
   
    if (mptUsersettings["enableFarerules"]==1) bindRulelinks();
    
    // configure sidebar
    if (mptUsersettings["enableInlinemode"]==1) {
    findtarget(classSettings["resultpage"]["milagecontainer"],1).setAttribute('rowspan', 10);
    //findtarget('GE-ODR-BET',1).setAttribute('class', 'GE-ODR-BBFB');
    } else if (mptUsersettings["enableInlinemode"]==0 && mptUsersettings["enablePricebreakdown"]==1) {
      findtarget(classSettings["resultpage"]["milagecontainer"],1).setAttribute('rowspan', 3);
    } else {
      findtarget(classSettings["resultpage"]["milagecontainer"],1).setAttribute('rowspan', 2);
    }
  
    readItinerary(true);
    // Translate page
    if (mptUsersettings["language"]!=="en" && translations[mptUsersettings["language"]]["resultpage"]!==undefined) translate("resultpage",mptUsersettings["language"],findtarget(classSettings["resultpage"]["itin"],1).nextSibling.nextSibling);
    //Add price breakdown  
    if (mptUsersettings["enablePricebreakdown"]==1) rearrangeprices(currentItin.dist);
    
    if (mptUsersettings["enableInlinemode"]==1) printCPM();
 
    printLinksContainer();

    /*** inline binding ***/
    if(mptUsersettings["enableSeatguru"]==1) bindSeatguru();
    if(mptUsersettings["enablePlanefinder"]==1) bindPlanefinder();  
    if(mptUsersettings["enableMilesbreakdown"]==1 && typeof(JSON) !== "undefined") printMilesbreakdown();  
    if(mptUsersettings["enableWheretocredit"]==1) bindWheretocredit();
    if (mptUsersettings["enableFarefreaks"]==1 && typeof(JSON) !== "undefined"){createFareFreaksContainer();}  
}

function printLinksContainer(){
    // do nothing if editor mode is active
    if (findtargets("editoritem").length>0){
        return false;
    }
    // empty outputcontainer
    if (document.getElementById('powertoolslinkcontainer')!=undefined){
        var div = document.getElementById('powertoolslinkcontainer');
        div.innerHTML ="";
    }
    //  S&D powertool items
  	var elems = findtargets('powertoolsitem');
  	for(var i = elems.length - 1; i >= 1; i--){
  		elems[i].parentNode.removeChild(elems[i]);
  	}
    /*** Print Timezone***/
    if (typeof(currentItin["itin"][0]["dep"]["offset"])==="undefined") {
       printTimezones();
    }    
    /*** Airlines ***/
    printAAc1();
    printAA(); 
    printAC();   
    if (currentItin["itin"].length == 2 &&
        currentItin["itin"][0]["orig"] == currentItin["itin"][1]["dest"] &&
        currentItin["itin"][0]["dest"] == currentItin["itin"][1]["orig"]) {
        printAF();
    }
    // print AS if it's only AS or VX
    if (inArray(currentItin["carriers"][0], ["AS", "VX"]) &&
        (currentItin["carriers"].length === 1 ||
         currentItin["carriers"].length === 2 && inArray(currentItin["carriers"][1], ["AS", "VX"]))) {
        printAS();
    }
    if (inArray("IB",currentItin["carriers"]) || inArray("BA",currentItin["carriers"])){
       printBA();
    }
    if (currentItin["itin"].length >= 3 && inArray("CZ",currentItin["carriers"])) {
        printCZ();
    }    
    // we print AZ if it's only on AZ-flights
    if (currentItin["carriers"].length==1 && currentItin["carriers"][0]=="AZ"){ printAZ(); }  
    printDL();
    if (inArray("IB",currentItin["carriers"]) || inArray("BA",currentItin["carriers"])){
       printIB();
    }  
    printKL();
    // printLA(); // Disabled until further notice
    if (inArray("LH",currentItin["carriers"]) || inArray("OS",currentItin["carriers"])){
       printLH();
    }
    if (currentItin["itin"].length <= 2 && inArray("LX",currentItin["carriers"])) {
        printLX();
    }
    if (inArray("TK",currentItin["carriers"])){
       printTK();
    }   
    if(mptUsersettings["enableDeviders"]==1) printSeperator();
    /*** OTAs ***/
    printCheapOair();
    printPriceline ();
    printEtraveli();
    /*** Metas ***/
    if(mptUsersettings["enableDeviders"]==1) printSeperator();
    printHipmunk ();
    printMomondo();
    printKayak(0);
    printKayak(1);
    printSkyscanner();	
    if(mptUsersettings["enableDeviders"]==1) printSeperator();
    /*** other stuff ***/
    printFarefreaks (0);
    printFarefreaks (1); 
    printGCM ();
    printWheretocredit();
    /*** attach JS events after building link container  ***/
    bindLinkClicks();
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
//*** Price breakdown ****//
function rearrangeprices(){
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
                 output +='<tr><td>'+cur+' per mile</td><td colspan=2 style="text-align:center;">'+((sum/currentItin["dist"])/100).toFixed(4).toString()+'</td></tr>';
                 output +='<tr><td>Basefare</td><td style="padding:0px 3px;text-align:right;">'+((basefares/sum)*100).toFixed(1).toString()+'%</td><td style="text-align:right;">'+cur+(basefares/100).toFixed(2).toString().replace(/\d(?=(\d{3})+\.)/g, '$&,')+"</td></tr>";
                 output +='<tr><td>Tax</td><td style="padding:0px 3px;text-align:right;">'+((taxes/sum)*100).toFixed(1).toString()+'%</td><td style="text-align:right;">'+cur+(taxes/100).toFixed(2).toString().replace(/\d(?=(\d{3})+\.)/g, '$&,')+"</td></tr>";
                 output +='<tr><td>Surcharges</td><td style="padding:0px 3px;text-align:right;">'+((surcharges/sum)*100).toFixed(1).toString()+'%</td><td style="text-align:right;">'+cur+(surcharges/100).toFixed(2).toString().replace(/\d(?=(\d{3})+\.)/g, '$&,')+"</td></tr>";
                 output +='<tr><td style="border-top: 1px solid #878787;padding:2px 0">Bf+Tax</td><td style="border-top: 1px solid #878787;padding:2px 3px;text-align:right;">'+(((basefares+taxes)/sum)*100).toFixed(1).toString()+'%</td><td style="border-top: 1px solid #878787;padding:2px 0; text-align:right;">'+cur+((basefares+taxes)/100).toFixed(2).toString().replace(/\d(?=(\d{3})+\.)/g, '$&,')+"</td></tr>";
                 output +="</tbody></table>"; 
              }
              currentItin.basefares = +(basefares/100).toFixed(2);
              currentItin.taxes = +(taxes/100).toFixed(2);
              currentItin.surcharges = +(surcharges/100).toFixed(2);

              // reset var
              basefound = 0;
              basefares = 0;
              taxes = 0;
              surcharges = 0;
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
//*** Mileage breakdown ****//
function printMilesbreakdown(){
 if (mptUsersettings["enableMilesbreakdownautoload"] == 1) {
   retrieveMileages();
 } else {
  target = findItinTarget(1,1,"headline");
  target.innerHTML = target.innerHTML.replace(target.firstChild.className, target.firstChild.className + '" style="display:inline-block')+'<div id="loadmileage" class="'+target.firstChild.className+'" style="display:inline-block;cursor:pointer;float:right;">Load mileage</div>'; 
  document.getElementById("loadmileage").onclick=function() {
        document.getElementById("loadmileage").parentNode.removeChild(document.getElementById("loadmileage"));
        retrieveMileages();
      };        
 }
  
}
function retrieveMileages(){
   // collect all airport cominations
  var routes = new Object();
  var params = "";
  for (var i=0;i<currentItin["itin"].length;i++) {
      // walks each leg
       for (var j=0;j<currentItin["itin"][i]["seg"].length;j++) {
        //walks each segment of leg
        // check if data is localy stored or already part of current task
        if ( distances[currentItin["itin"][i]["seg"][j]["orig"]+currentItin["itin"][i]["seg"][j]["dest"]] === undefined &&
             distances[currentItin["itin"][i]["seg"][j]["dest"]+currentItin["itin"][i]["seg"][j]["orig"]] === undefined &&
             routes[currentItin["itin"][i]["seg"][j]["orig"]+currentItin["itin"][i]["seg"][j]["dest"]] === undefined &&
             routes[currentItin["itin"][i]["seg"][j]["dest"]+currentItin["itin"][i]["seg"][j]["orig"]] === undefined ) {
             routes[currentItin["itin"][i]["seg"][j]["orig"]+currentItin["itin"][i]["seg"][j]["dest"]] = currentItin["itin"][i]["seg"][j]["orig"]+"-"+currentItin["itin"][i]["seg"][j]["dest"];
        }       
      }
   }
  //build request
  for (i in routes) {
    params+=(params===""?"":"&")+"r[]="+routes[i];
  }
  if (params==="") {
    //no request needed.. call final print function
    printMileages();
    return false; 
  }
  doHttpRequest("https://www.farefreaks.com/ajax/calcroutedist.php?"+params,{mode:"get"},function(xmlHttpObject) {
     var response=false;
     if (typeof(JSON) !== "undefined"){
       try {
          response = JSON.parse(xmlHttpObject.responseText);
        } catch (e){
          response=false;
        }
     } else {
       // do not(!) use eval here :-/
       printNotification("Error: Failed parsing route data - Browser not supporting JSON");
       return false;
     }     
     if (typeof(response) !== "object"){
      printNotification("Error: Failed parsing route data");
      return false;
     }
     if (response["success"]===undefined || response["error"]===undefined || response["data"]===undefined ){
      printNotification("Error: wrong route data format");
      return false;
     }
     if (response["success"]!=="1"){
      printNotification("Error: "+response["error"]+" in retrieveMileages function");
      return false; 
     }
     // add new routes to distances
     for (i in response["data"]) {
        distances[i]=parseFloat(response["data"][i]);
     }
     printMileages(); 
    });  
}
function printMileages(){
  var legdistance=0;
  for (var i=0;i<currentItin["itin"].length;i++) {
      // walks each leg
       for (var j=0;j<currentItin["itin"][i]["seg"].length;j++) {
        //walks each segment of leg
        // check if data is localy stored
        if ( distances[currentItin["itin"][i]["seg"][j]["orig"]+currentItin["itin"][i]["seg"][j]["dest"]] === undefined &&
             distances[currentItin["itin"][i]["seg"][j]["dest"]+currentItin["itin"][i]["seg"][j]["orig"]] === undefined ) {
             printNotification("Error: Missing route data for "+currentItin["itin"][i]["seg"][j]["orig"]+" => "+currentItin["itin"][i]["seg"][j]["dest"]);
             return false;
        } else if ( distances[currentItin["itin"][i]["seg"][j]["orig"]+currentItin["itin"][i]["seg"][j]["dest"]] !== undefined &&
                    distances[currentItin["itin"][i]["seg"][j]["dest"]+currentItin["itin"][i]["seg"][j]["orig"]] === undefined ) {         
          currentItin["itin"][i]["seg"][j]["dist"]=distances[currentItin["itin"][i]["seg"][j]["orig"]+currentItin["itin"][i]["seg"][j]["dest"]];
        } else {
          currentItin["itin"][i]["seg"][j]["dist"]=distances[currentItin["itin"][i]["seg"][j]["dest"]+currentItin["itin"][i]["seg"][j]["orig"]];
        }          
        legdistance+=currentItin["itin"][i]["seg"][j]["dist"];          
        currentItin["itin"][i]["seg"][j]["dist"]=Math.floor(currentItin["itin"][i]["seg"][j]["dist"]);
      }
     currentItin["itin"][i]["dist"]=Math.floor(legdistance);
     legdistance=0;
   }
  // lets finally print it:
  if (mptUsersettings["enableInlinemode"] === 1 || mptUsersettings["enableMilesInlinemode"] === 1) {
  var target = "";
      for (var i=0;i<currentItin["itin"].length;i++) {
      // walks each leg
      target = findItinTarget((i+1),1,"headline");
      target.innerHTML = target.innerHTML.replace(target.firstChild.className, target.firstChild.className + '" style="display:inline-block')+'<div style="display:inline-block;float:right;"> '+currentItin["itin"][i]["dist"]+' miles</div>'; 
       for (var j=0;j<currentItin["itin"][i]["seg"].length;j++) {
        //walks each segment of leg
         if (currentItin["itin"][i]["seg"].length>1) {
         target = findItinTarget((i+1),(j+1),"airportsdate");
         target.innerHTML = target.innerHTML.replace(target.firstChild.className, target.firstChild.className + '" style="display:inline-block')+'<div style="display:inline-block;float:right;margin-right:110px;"> '+currentItin["itin"][i]["seg"][j]["dist"]+' miles</div>';       
        }
      }
   }
  } else {  
  var output="";
  output +='<tbody>';
  output +='<tr><td colspan="4" style="text-align:center;">Mileage breakdown:</td></tr>';         
  for (var i=0;i<currentItin["itin"].length;i++) {
      // walks each leg
    output +='<tr><td style="border-bottom: 1px solid #878787;padding:2px 2px">Leg '+(i+1)+'</td><td style="border-bottom: 1px solid #878787;padding:2px 0">'+currentItin["itin"][i]["orig"]+'</td><td style="border-bottom: 1px solid #878787;padding:2px 0">'+currentItin["itin"][i]["dest"]+'</td><td style="border-bottom: 1px solid #878787;padding:2px 0;text-align:right;">'+currentItin["itin"][i]["dist"]+'</td></tr>';
       for (var j=0;j<currentItin["itin"][i]["seg"].length;j++) {
        //walks each segment of leg
        if (currentItin["itin"][i]["seg"].length>1) output +='<tr><td></td><td>'+currentItin["itin"][i]["seg"][j]["orig"]+'</td><td>'+currentItin["itin"][i]["seg"][j]["dest"]+'</td><td style="text-align:right;">'+currentItin["itin"][i]["seg"][j]["dist"]+'</td></tr>';       
      }
   }
  output +="</tbody>"; 
  if (findtarget("pricebreakdown",1)===undefined){
      // create container
        var printtarget=findtarget(classSettings["resultpage"]["htbContainer"],1).parentNode.parentNode.parentNode;
        var newtr = document.createElement('tr');
        newtr.setAttribute('class','pricebreakdown');
        newtr.innerHTML = '<td><div><table style="float:left; margin-right:15px;">'+output+'</table></div></td>';
        printtarget.parentNode.insertBefore(newtr, printtarget); 
    } else {
      // add to existing container
      var printtarget = findtarget("pricebreakdown",1).firstChild.firstChild.firstChild; 
      var newtable = document.createElement('table');
      newtable.setAttribute('style','float:left; margin-right:15px;');
      newtable.innerHTML = output;
      printtarget.parentNode.insertBefore(newtable, printtarget);    
    }
  }    
}
//*** Readfunction ****//
function parseAddInfo(info){
  var ret= {codeshare:0, layoverduration:0, airportchange:0, arrDate:""};
  var re = /contains\s*airport\s*changes/g;
  if (re.test(info)===true) {ret.airportchange=1;};
  var re = /OPERATED\s*BY/g;
  if (re.test(info)===true) {ret.codeshare=1;};
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
function readItinerary(doReplace){
      // the magical part! :-)
      var replacementsold = new Array(), replacementsnew = new Array(), itin = new Array(), carrieruarray = new Array(), farebases = new Array(), dirtyFare= new Array(), temp = new Array(), tmp = new Array();
      var itinCur="";
      var html = document.getElementById("contentwrapper").innerHTML;
      var re=/colspan\=\"5\"[^\(]+\(([\w]{3})[^\(]+\(([\w]{3})/g;
      var legs = exRE(html,re);
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
      var re=/Carrier\s([\w]{2})\s([\w]+).*?Covers\s([\w\(\)\s\-,]+)/g;
      temp = exRE(html,re);
      tmp = {c:"",f:"",l:new Array()};  
      for(i=0;i<temp.length;i+=3) {
          tmp.c=temp[i];
          tmp.f=temp[i+1];
          farebases.push(tmp.f);
          tmp.l =exRE(temp[i+2],/(\w\w\w\-\w\w\w)/g);
          for(j=0;j<tmp.l.length;j++) {
            dirtyFare.push(tmp.l[j]+"-"+tmp.f+"-"+tmp.c);
          }
      }
      var segs = new Array();
      var re=/35px\/(\w{2}).png[^\(]+\(([A-Z]{3})[^\(]+\(([A-Z]{3})[^\,]*\,\s*([a-zA-Z]{3})\s*([0-9]{1,2}).*?gwt-Label.*?([0-9]*)\<.*?Dep:[^0-9]+(.*?)\<.*?Arr:[^0-9]+(.*?)\<.*?([0-9]{1,2})h\s([0-9]{1,2})m.*?gwt-Label.*?\>(.*?)\<.*?gwt-Label\"\>(\w).*?\((\w)\).*?\<.*?tr(.*?)(table|airline_logos)/g;
      segs = exRE(html,re);
      // used massive regex to get all our segment-info in one extraction
      var legnr=0;
      var segnr=0;
      for(i=0;i<segs.length;i+=15) {
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
            temp["aircraft"]=segs[i+10];
            temp["cabin"]=getcabincode(segs[i+11]);   
            temp["bookingclass"]=segs[i+12];
            var addinformations=parseAddInfo(segs[i+13]);       
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
            temp["farebase"]="";
            temp["farecarrier"]="";
            // find farecode for leg
             for(var j=0;j<dirtyFare.length;j++) {
                 if (dirtyFare[j].indexOf(temp["orig"]+"-"+temp["dest"]+"-")!= -1) {
                    //found farebase of this segment
                     var tmp=dirtyFare[j].split("-");
                     temp["farebase"]=tmp[2];
                     temp["farecarrier"]=tmp[3];
                     dirtyFare[j]=temp["farebase"]; // avoid reuse
                     j=dirtyFare.length;
                     }
             }
            if (itin[legnr]===undefined) itin[legnr] = new Object();
            if (itin[legnr]["seg"]===undefined) itin[legnr]["seg"] = new Array();
            itin[legnr]["seg"].push(temp);     
            // push carrier
            if (!inArray(temp["carrier"],carrieruarray)) {carrieruarray.push(temp["carrier"]);};
            // push dates and times into leg-array
            if ( segnr == 0 ){
              if (itin[legnr]["dep"]===undefined) itin[legnr]["dep"] = new Object();
              itin[legnr]["dep"]["day"]=temp["dep"]["day"];
              itin[legnr]["dep"]["month"]=temp["dep"]["month"];
              itin[legnr]["dep"]["year"]=temp["dep"]["year"];
              itin[legnr]["dep"]["time"]=temp["dep"]["time"];
            }
            if (itin[legnr]["arr"]===undefined) itin[legnr]["arr"] = new Object();
            itin[legnr]["arr"]["day"]=temp["arr"]["day"];
            itin[legnr]["arr"]["month"]=temp["arr"]["month"];
            itin[legnr]["arr"]["year"]=temp["arr"]["year"];
            itin[legnr]["arr"]["time"]=temp["arr"]["time"];
            segnr++;
            // check for legchange
            if(segs[i+14]=="table") {
              legnr++;
              segnr=0;
            }

      }
      // We need to apply remaining fares (Not nonstop - but direct flights) 
      for (var i = 0; i<dirtyFare.length; i++){
        var curfare=dirtyFare[i].split("-");
        if (curfare.length > 1) {
          var tmp=0;
          //currently unused so walk through itin to find flights
          for (var legnr = 0; legnr<itin.length; legnr++){
             for (var segnr = 0; segnr<itin[legnr]["seg"].length; segnr++){
                if (itin[legnr]["seg"][segnr]["orig"]==curfare[0] && 
                    itin[legnr]["seg"][segnr]["dest"]==curfare[1] &&
                    itin[legnr]["seg"][segnr]["farebase"]=="") {
                  // found seg for fare
                    itin[legnr]["seg"][segnr]["farebase"]=curfare[2]; 
                    itin[legnr]["seg"][segnr]["farecarrier"]=curfare[3];
                    dirtyFare[i]=curfare[2]; 
                    segnr=itin[legnr]["seg"].length;
                    tmp=1;                  
                } else if (itin[legnr]["seg"][segnr]["orig"]==curfare[0] && 
                    itin[legnr]["seg"][segnr]["dest"]!=curfare[1] &&
                    itin[legnr]["seg"][segnr]["farebase"]==""){
                  // found start but multiple segs -> find end
                   for (var j = (segnr+1); j<itin[legnr]["seg"].length; j++){
                     if (itin[legnr]["seg"][j]["dest"]==curfare[1] && itin[legnr]["seg"][j]["farebase"]==""){
                       //found end attach fares
                       for (var k = segnr; k<=j; k++) {
                        itin[legnr]["seg"][k]["farebase"]=curfare[2]; 
                        itin[legnr]["seg"][k]["farecarrier"]=curfare[3];
                        dirtyFare[i]=curfare[2];
                       }
                       j=itin[legnr]["seg"].length; 
                       segnr=itin[legnr]["seg"].length;
                       tmp=1;                       
                     } else if (itin[legnr]["seg"][(segnr+j)]["farebase"]!=""){
                       //farebase attached - skip
                       j=itin[legnr]["seg"].length;
                     } 
                   }
                }
            }
            if (tmp==1){legnr=itin.length;}
          }
          if (tmp==0){ printNotification("Unused fare:" +dirtyFare[i]); }
        }
      }
      // extract mileage paxcount and total price
      var milepaxprice = new Array();
      var re=/Mileage.*?([0-9,]+)\stotal\smiles.*?Total\scost\sfor\s([0-9])\spassenger.*?<div.*?>(.*?([1-9][0-9,.]+)[^\<]*)/g;
      milepaxprice = exRE(html,re);
      // detect currency
      for(i=0;i<matrixCurrencies.length;i++) {
        if (matrixCurrencies[i].p.test(milepaxprice[2])===true){
              itinCur=matrixCurrencies[i].c;
              i=matrixCurrencies.length;
            }        
      }
      currentItin={itin:itin, price: Number(milepaxprice[3].replace(/\,/,"")), numPax:Number(milepaxprice[1]) , carriers:carrieruarray, cur : itinCur, farebases:farebases, dist:Number(milepaxprice[0].replace(/\,/,""))}; 
      //console.log(currentItin); //Remove to see flightstructure 
      // lets do the time-replacement
       if(replacementsold.length>0 && doReplace ===true) {
         target=findtarget(classSettings["resultpage"]["itin"],1).nextSibling.nextSibling;
         for(i=0;i<replacementsold.length;i++) {
           re = new RegExp(replacementsold[i],"g");
           target.innerHTML = target.innerHTML.replace(re, replacementsnew[i]);
         }
       }
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

function printCPM(){
  printItemInline((Number(currentItin.price) / Number(currentItin.dist)).toFixed(4) + ' cpm','',1);
}

 // **** START AMADEUS ****
function getAmadeusUrl(config){
  // Do some checks here
  if (config === null && typeof(config) !== 'object') {
    config = new Object();
    config["sepcabin"] = 1;
    config["detailed"] = 0;
    config["inctimes"] = 1;
    config["enablesegskip"]=1;
    config["allowpremium"]=1;
  }
  config["sepcabin"]=(config["sepcabin"] === undefined ? 1: config["sepcabin"]);
  config["detailed"]=(config["detailed"] === undefined ? 0: config["detailed"]);
  config["inctimes"]=(config["inctimes"] === undefined ? 1: config["inctimes"]);
  config["enablesegskip"]=(config["enablesegskip"] === undefined ? 1: config["enablesegskip"]);
  config["allowpremium"]=(config["allowpremium"] === undefined ? 1: config["allowpremium"]);
  var curleg=0;
  var lastcabin=0;
  var curseg=0;
  var lastdest="";
  var maxcabin=0;
  var url="";
  var lastarrtime="";
  var cabins=["E","N","B","F"];
  cabins[1] = (config["allowpremium"]!=1?cabins[0]:cabins[1]);
  //Build multi-city search based on legs
  for (var i=0;i<currentItin["itin"].length;i++) {
      curseg=3; // need to toggle segskip on first leg
      lastcabin = currentItin["itin"][i]["seg"][0]["cabin"];
      // walks each leg
            for (var j=0;j<currentItin["itin"][i]["seg"].length;j++) {
             //walks each segment of leg
                var k=0;
                // lets have a look if we need to skip segments - Flightnumber has to be the same and it must be just a layover
                while ((j+k)<currentItin["itin"][i]["seg"].length-1){
                 if (currentItin["itin"][i]["seg"][j+k]["fnr"] != currentItin["itin"][i]["seg"][j+k+1]["fnr"] || 
                     currentItin["itin"][i]["seg"][j+k]["layoverduration"] >= 1440 || config["enablesegskip"] == 0) break;
                 k++;
                }               
                curseg++;
                if (curseg>3 || (currentItin["itin"][i]["seg"][j]["cabin"] != lastcabin && config["sepcabin"]==1)) {
                  if (lastdest!= '') {
                    //close prior flight
                    url += '&E_LOCATION_'   + curleg + '='+lastdest;
                    url += '&E_DATE_'   + curleg + '='+lastarrtime;    
                  }
                 curseg=1;
                 curleg++;
                 url += '&B_LOCATION_'   + curleg + '='+currentItin['itin'][i]['seg'][j]['orig'];     
                 url += '&B_ANY_TIME_'   + curleg + '=FALSE';
                 url += '&B_DATE_'       + curleg + '='+currentItin['itin'][i]['seg'][j]['dep']['year']+('0'+currentItin['itin'][i]['seg'][j]['dep']['month']).slice(-2)+('0'+currentItin['itin'][i]['seg'][j]['dep']['day']).slice(-2)+(config["inctimes"]==1?('0'+currentItin['itin'][i]['seg'][j]['dep']['time'].replace(':','')).slice(-4):"0000");
                 url += '&CABIN_'        + curleg + '='+cabins[currentItin["itin"][i]["seg"][j]["cabin"]];
                 url += '&ALLOW_ALTERNATE_AVAILABILITY_'        + curleg + '=FALSE';
                 url += '&DATE_RANGE_VALUE_'        + curleg + '=0';
                }
                lastarrtime=currentItin['itin'][i]['seg'][j+k]['arr']['year']+('0'+currentItin['itin'][i]['seg'][j+k]['arr']['month']).slice(-2)+('0'+currentItin['itin'][i]['seg'][j+k]['arr']['day']).slice(-2)+(config["inctimes"]==1?('0'+currentItin['itin'][i]['seg'][j+k]['arr']['time'].replace(':','')).slice(-4):"0000");
                if (config["detailed"]===1){ 
                  url += '&B_LOCATION_'   + curleg +'_' + curseg + '='+currentItin['itin'][i]['seg'][j]['orig'];     
                  url += '&B_LOCATION_CITY_'   + curleg +'_' + curseg + '='+currentItin['itin'][i]['seg'][j]['orig'];     
                  url += '&B_DATE_'       + curleg +'_' + curseg + '='+currentItin['itin'][i]['seg'][j]['dep']['year']+('0'+currentItin['itin'][i]['seg'][j]['dep']['month']).slice(-2)+('0'+currentItin['itin'][i]['seg'][j]['dep']['day']).slice(-2)+(config["inctimes"]==1?('0'+currentItin['itin'][i]['seg'][j]['dep']['time'].replace(':','')).slice(-4):"0000");
                  url += '&E_LOCATION_'   + curleg +'_' + curseg + '='+currentItin['itin'][i]['seg'][j+k]['dest'];
                  url += '&E_LOCATION_CITY_'   + curleg +'_' + curseg + '='+currentItin['itin'][i]['seg'][j+k]['dest'];
                  url += '&E_DATE_'       + curleg +'_' + curseg + '='+lastarrtime;
                }
                url += '&AIRLINE_'      + curleg +'_' + curseg + '='+currentItin['itin'][i]['seg'][j]['carrier'];
                url += '&FLIGHT_NUMBER_'+ curleg +'_' + curseg + '='+currentItin['itin'][i]['seg'][j]['fnr'];
                url += '&RBD_'          + curleg +'_' + curseg + '='+currentItin['itin'][i]['seg'][j]['bookingclass'];
                lastdest=currentItin['itin'][i]['seg'][j+k]['dest'];
                lastcabin=currentItin["itin"][i]["seg"][j]["cabin"];
                if (currentItin["itin"][i]["seg"][j]["cabin"]>maxcabin) maxcabin=currentItin["itin"][i]["seg"][j]["cabin"];
                j+=k;
        }
    }
    url += '&E_LOCATION_'   + curleg + '='+lastdest;  // push final dest
    url += '&E_DATE_'   + curleg + '='+lastarrtime;   // push arr time
    url += '&CABIN='+cabins[(mptSettings["cabin"]==="Auto" ? maxcabin:getForcedCabin())]+'';         // push cabin
    return url;
}
function getAmadeusPax(pax,config){
  // Do some checks here
  if (config === null && typeof(config) !== 'object') {
    config = new Object();
    config["allowinf"] = 1;
    config["youthage"] = 0;
  }
  config["allowinf"]=(config["allowinf"] === undefined ? 1: config["allowinf"]);
  config["youthage"]=(config["sepyouth"] === undefined ? 0: config["sepyouth"]);
  var tmpPax={c:0,y:0};
  var curPax=1;
  var url="&IS_PRIMARY_TRAVELLER_1=True";
    for (i=0;i<pax.children.length;i++){
      if (pax.children[i]>=config["youthage"] && config["youthage"] > 0){
       tmpPax.y++;
      } else if (pax.children[i] >= 12) {
       pax.adults++;
      } else {
       tmpPax.c++; 
      }
    }
    for (i=0;i<pax.adults;i++){
     url += '&TRAVELER_TYPE_'+curPax+'=ADT';
     url += '&HAS_INFANT_'+curPax+'='+(i<pax.infLap && config["allowinf"] == 1 ?"True":"False");
     url += '&IS_YOUTH_'+curPax+'=False';
     curPax++;
    }
    for (i=0;i<tmpPax.y;i++){
     url += '&TRAVELER_TYPE_'+curPax+'=ADT';
     url += '&HAS_INFANT_'+curPax+'=False';
     url += '&IS_YOUTH_'+curPax+'=True';
     curPax++;
    }
    for (i=0;i<tmpPax.c;i++){
     url += '&TRAVELER_TYPE_'+curPax+'=CHD';
     url += '&HAS_INFANT_'+curPax+'=False';
     url += '&IS_YOUTH_'+curPax+'=False';
     curPax++;
    }
  return {url:url ,adults:pax.adults, youth:tmpPax.y, children:tmpPax.c, infants:pax.infLap};
}
function getAmadeusTriptype(){
  return (currentItin['itin'].length > 1 ? (currentItin['itin'].length == 2 && currentItin["itin"][0]["orig"] == currentItin["itin"][1]["dest"] && currentItin["itin"][0]["dest"] == currentItin["itin"][1]["orig"] ? 'R' : 'M') : 'O');
}
 // **** END AMADEUS ****

function printAA(){
  var createUrl = function (edition) {
    var url = "http://i11l-services.aa.com/xaa/mseGateway/entryPoint.php?PARAM=";
    var search ="1,,USD0.00,"+currentItin["itin"].length+",";
    var legs = new Array();
    var leg ="";
    var segs = new Array();
    var seg = ""; 
    
    //Build multi-city search based on legs
    for (var i=0;i<currentItin["itin"].length;i++) {
      // walks each leg
      segs = new Array();
            for (var j=0;j<currentItin["itin"][i]["seg"].length;j++) {
            //walks each segment of leg
                var k=0;
                // lets have a look if we need to skip segments - Flightnumber has to be the same and it must be just a layover
                while ((j+k)<currentItin["itin"][i]["seg"].length-1){
                 if (currentItin["itin"][i]["seg"][j+k]["fnr"] != currentItin["itin"][i]["seg"][j+k+1]["fnr"] || 
                     currentItin["itin"][i]["seg"][j+k]["layoverduration"] >= 1440) break;
                 k++;
                }
                seg    = currentItin['itin'][i]['seg'][j+k]['arr']['year']+'-'+('0'+currentItin['itin'][i]['seg'][j+k]['arr']['month']).slice(-2)+'-'+('0'+currentItin['itin'][i]['seg'][j+k]['arr']['day']).slice(-2)+'T'+('0'+currentItin['itin'][i]['seg'][j+k]['arr']['time']).slice(-5)+(typeof(currentItin['itin'][i]['seg'][j+k]['arr']['offset'])=="undefined" ? "+00:00" : currentItin['itin'][i]['seg'][j+k]['arr']['offset'])+',';
                seg   += currentItin['itin'][i]['seg'][j]['bookingclass']+",";
                seg   += currentItin['itin'][i]['seg'][j]['dep']['year']+'-'+('0'+currentItin['itin'][i]['seg'][j]['dep']['month']).slice(-2)+'-'+('0'+currentItin['itin'][i]['seg'][j]['dep']['day']).slice(-2)+'T'+('0'+currentItin['itin'][i]['seg'][j]['dep']['time']).slice(-5)+(typeof(currentItin['itin'][i]['seg'][j]['dep']['offset'])=="undefined" ? "+00:00" : currentItin['itin'][i]['seg'][j]['dep']['offset'])+',';                
                seg   += currentItin['itin'][i]['seg'][j+k]['dest']+",";
                seg   += currentItin['itin'][i]['seg'][j]['carrier']+currentItin['itin'][i]['seg'][j]['fnr']+",";
                seg   += currentItin['itin'][i]['seg'][j]['orig']; // NO , here!
                segs.push(seg);
                j+=k;
      }
      search+=segs.length+","+segs.join()+",";
      //build leg structure
      leg =currentItin["itin"][i]["dep"]['year']+"-"+("0"+currentItin["itin"][i]["dep"]['month']).slice(-2)+"-"+("0"+currentItin["itin"][i]["dep"]['day']).slice(-2)+",";
      leg+=currentItin["itin"][i]["dest"]+",,";
      leg+=currentItin["itin"][i]["orig"]+","; // USE , here!
      legs.push(leg);     
    }
    search+="DIRECT,";
    search+=edition[0].toUpperCase()+","; // Language
    search+="3,";
    // validate Passengers here: Max Paxcount = 7 (Infs not included) - >11 = Adult - InfSeat = Child
    var pax=validatePaxcount({maxPaxcount:7, countInf:false, childAsAdult:12, sepInfSeat:false, childMinAge:2});
    if (pax===false){
      printNotification("Error: Failed to validate Passengers in printAA");
      return false;
    }
    search+=pax.adults+",";  // ADT
    search+=pax.children.length+",";  // Child
    search+=pax.infLap+",";  // Inf
    search+="0,";  // Senior
    search+=edition[1].toUpperCase()+","; // Country  
    // push outer search
    search+=currentItin["itin"].length+","+legs.join();  
    url+=encodeURIComponent(search);
    return url;
  };
  
  // get edition
  var edition=mptUsersettings["aaEdition"].split("_");
  if (edition.length!=2) {
    printNotification("Error:Invalid AA-Edition");
    return false;
  }
  var url = createUrl(edition);
  if (url === false) {
    return false;
  }
  var extra = ' <span class="pt-hover-container">[+]<span class="pt-hover-menu">';
  extra += aaEditions.map(function (obj, i) { return '<a href="' + createUrl(obj.value.split("_")) + '" target="_blank">' + obj.name +'</a>'; }).join('<br/>');
  extra += '</span></span>';
  
  if (mptUsersettings["enableInlinemode"]==1){
    printUrlInline(url,"American","Europe/Asia/Pacific",null,extra);
  } else {
    printUrl(url,"American","Europe/Asia/Pacific",extra);
  } 
}

function printAAc1(){
    var dateToEpoch = function (y, m, d) {
      var dateStr = y+'-'+('0'+m).slice(-2)+'-'+('0'+d).slice(-2)+'T00:00:00-06:00';
      return Date.parse(dateStr);
    }

    // validate Passengers here: Max Paxcount = 7 (Infs not included) - >11 = Adult - InfSeat = Child
    var createUrl = function (edition) {
      var pax=validatePaxcount({maxPaxcount:6, countInf:true, childAsAdult:12, sepInfSeat:false, childMinAge:2});
      if (pax===false){
        printNotification("Error: Failed to validate Passengers in printAAc1");
        return false;
      }
      var url = "https://www.aa.com/goto/metasearch?ITEN=GOOGLE,,US,";
      if (currentItin["itin"].length === 1){
        url+="oneWay";
      } else {
        url+="multi";
      }
      url+=",4,A"+pax.adults+"S0C"+pax.children.length+"I"+pax.infLap+"Y0L0,0,";
      url+=currentItin["itin"][0]["orig"]+",0,"+currentItin["itin"][0]["dest"];
      url+=",0";

      for (var i=0;i<currentItin["itin"].length;i++) {
        url+=",false,"+dateToEpoch(currentItin['itin'][i]['seg'][0]['dep']['year'], currentItin['itin'][i]['seg'][0]['dep']['month'], currentItin['itin'][i]['seg'][0]['dep']['day']);
      }

      if (currentItin["itin"].length > 1) {
        url+=",0,0";
      }
      url+=","+currentItin["price"]+",1,";

      if (currentItin["itin"].length > 1) {
        var addon = "";
        for (var i=0;i<currentItin["itin"].length;i++) {
          addon+="#"+currentItin["itin"][i]["orig"]+"|"+currentItin["itin"][i]["dest"]+"|0|0|";
          addon+=dateToEpoch(currentItin['itin'][i]['seg'][0]['dep']['year'], currentItin['itin'][i]['seg'][0]['dep']['month'], currentItin['itin'][i]['seg'][0]['dep']['day']);
        }
        url+=encodeURIComponent(addon)+",";
      }

      var itinsegs = new Array();

      //Build multi-city search based on legs
      for (var i=0;i<currentItin["itin"].length;i++) {
        // walks each leg
          for (var j=0;j<currentItin["itin"][i]["seg"].length;j++) {
          //walks each segment of leg
              var k=0;
              // lets have a look if we need to skip segments - Flightnumber has to be the same and it must be just a layover
              while ((j+k)<currentItin["itin"][i]["seg"].length-1){
               if (currentItin["itin"][i]["seg"][j+k]["fnr"] !== currentItin["itin"][i]["seg"][j+k+1]["fnr"] ||
                   currentItin["itin"][i]["seg"][j+k]["layoverduration"] >= 1440) break;
               k++;
              }
              var itinseg= "#"+currentItin['itin'][i]['seg'][j]['carrier']+"|"+currentItin['itin'][i]['seg'][j]['fnr']+"|"+currentItin['itin'][i]['seg'][j]['bookingclass'];
              itinseg   += "|"+currentItin['itin'][i]['seg'][j]['orig'];
              itinseg   += "|"+currentItin['itin'][i]['seg'][j+k]['dest'];
              itinseg   += "|"+Date.parse(currentItin['itin'][i]['seg'][j]['dep']['year']+'-'+
                                           ('0'+currentItin['itin'][i]['seg'][j]['dep']['month']).slice(-2)+'-'+
                                           ('0'+currentItin['itin'][i]['seg'][j]['dep']['day']).slice(-2)+
                                           'T'+('0'+currentItin['itin'][i]['seg'][j]['dep']['time']).slice(-5)+":00"+
                                           (typeof(currentItin['itin'][i]['seg'][j]['dep']['offset'])==="undefined" ? "+00:00" : currentItin['itin'][i]['seg'][j]['dep']['offset']));
              itinseg   += "|"+i;
              itinsegs.push(itinseg);
              j+=k;
        }
      }
      url+=encodeURIComponent(itinsegs.join(""));
      return url;
    };
    var url = createUrl(mptUsersettings["aac1Edition"].toUpperCase());
    if (url === false) {
      return false;
    }
    var extra = ' <span class="pt-hover-container">[+]<span class="pt-hover-menu">';
    extra += aac1Editions.map(function (edition, i) { return '<a href="' + createUrl(edition.value.toUpperCase()) + '" target="_blank">' + edition.name +'</a>'; }).join('<br/>');
    extra += '</span></span>';
    if (mptUsersettings["enableInlinemode"] === 1){
      printUrlInline(url,"American","America & UK", "");
    } else {
      printUrl(url,"American","America & UK", "");
    }
}

function printAC(){
  var createUrl = function (edition) {
    var acUrl = 'https://book.aircanada.com/pl/AConline/en/RedirectionServlet?FareRequest=YES&PRICING_MODE=0&fromThirdParty=YES';
    acUrl += '&country=' + edition + '&countryOfResidence=' + edition + (mptSettings["itaLanguage"]=="de"||mptUsersettings["language"]=="de"?'&language=de':'&language=en');   
    // validate Passengers here: Max Paxcount = 7 (Infs not included) - >11 = Adult - InfSeat = Child
    var pax=validatePaxcount({maxPaxcount:9, countInf:true, childAsAdult:16, sepInfSeat:false, childMinAge:2});
    if (pax===false){
      printNotification("Error: Failed to validate Passengers in printAC");
      return false;
    }    
    var paxConfig={allowinf:0, youthage:12}; // AC does not allow booking of infants for int. flights
    var amadeusConfig =  {sepcabin:1,detailed:1,allowpremium:1};
    var tmpPax=getAmadeusPax(pax,paxConfig);
    acUrl += tmpPax.url;
    acUrl += '&numberOfAdults=' + tmpPax.adults;
    acUrl += '&numberOfInfants=' +tmpPax.infants;    
    acUrl += '&numberOfYouth='+tmpPax.youth;
    acUrl += '&numberOfChildren='+tmpPax.children;    
    acUrl += '&tripType=' + getAmadeusTriptype();
    for (var i=0; i < currentItin['itin'].length; i++) {
       acUrl += '&departure'+(i+1)+'='+('0'+currentItin['itin'][i]['dep']['day']).slice(-2)+'/'+('0'+currentItin['itin'][i]['dep']['month']).slice(-2)+'/'+currentItin['itin'][i]['dep']['year']+'&org'+(i+1)+'='+currentItin['itin'][i]['orig']+'&dest'+(i+1)+'='+currentItin['itin'][i]['dest'];      
    }    
    acUrl +=getAmadeusUrl(amadeusConfig);      
    return acUrl;
  }; 
  var acUrl = createUrl(mptUsersettings["acEdition"].toUpperCase());
  if (acUrl === false) {
    return false;
  }  
  var extra = ' <span class="pt-hover-container">[+]<span class="pt-hover-menu">';
  extra += acEditions.map(function (edition, i) { return '<a href="' + createUrl(edition.toUpperCase()) + '" target="_blank">' + edition +'</a>'; }).join('<br/>');
  extra += '</span></span>';  
  if (mptUsersettings["enableInlinemode"]==1){
    printUrlInline(acUrl,"Air Canada","",null,extra);
  } else {
    printUrl(acUrl,"Air Canada","",extra);
  }
}

function printAF() {
  var createUrl = function (edition) {
    var cabins = ['Y', 'W', 'C', 'F'];
    var mincabin = 3;
    var afUrl = 'https://www.airfrance.com/'+edition+'/local/process/standardbooking/DisplayUpsellAction.do?calendarSearch=1&subCabin=MCHER&typeTrip=2';
    for (var i=0; i < currentItin['itin'].length; i++) {
      if (i == 0) {
        afUrl += '&from='+currentItin['itin'][i]['orig'];
        afUrl += '&to='+currentItin['itin'][i]['dest'];
        afUrl += '&outboundDate='+currentItin['itin'][i]['dep']['year']+'-'+('0'+currentItin['itin'][i]['dep']['month']).slice(-2)+'-'+('0'+currentItin['itin'][i]['dep']['day']).slice(-2);
        afUrl += '&firstOutboundHour='+('0'+currentItin['itin'][i]['dep']['time']).slice(-5);
        
        flights = '';
        for (var j=0; j < currentItin['itin'][i]['seg'].length; j++) {
          if (j > 0) flights += '|';
          flights += currentItin['itin'][i]['seg'][j]['carrier'] + ('000'+currentItin['itin'][i]['seg'][j]['fnr']).slice(-4);
        }
        afUrl += '&flightOutbound=' + flights;
      }
      else if (i == 1) {
        afUrl += '&inboundDate='+currentItin['itin'][i]['dep']['year']+'-'+('0'+currentItin['itin'][i]['dep']['month']).slice(-2)+'-'+('0'+currentItin['itin'][i]['dep']['day']).slice(-2);
        afUrl += '&firstInboundHour='+('0'+currentItin['itin'][i]['dep']['time']).slice(-5);
        
        flights = '';
        for (var j=0; j < currentItin['itin'][i]['seg'].length; j++) {
          if (j > 0) flights += '|';
          flights += currentItin['itin'][i]['seg'][j]['carrier'] + ('000'+currentItin['itin'][i]['seg'][j]['fnr']).slice(-4);
          if (currentItin["itin"][i]["seg"][j]["cabin"]<mincabin){mincabin=currentItin["itin"][i]["seg"][j]["cabin"];};  
        }
        afUrl += '&flightInbound=' + flights;
      }
    }
     afUrl += "&cabin="+cabins[(mptSettings["cabin"]==="Auto" ? mincabin:getForcedCabin())];
    var pax=validatePaxcount({maxPaxcount:9, countInf:true, childAsAdult:18, sepInfSeat:false, childMinAge:2});
    if (pax===false){
      printNotification("Error: Failed to validate Passengers in printAF");
      return false;
    }
    var tmpPax={c:0,y:0};
    for (i=0;i<pax.children.length;i++){
      if (pax.children[i]>11){
       tmpPax.y++;
      } else {
       tmpPax.c++; 
      }
    }
    var curPax=0;
    afUrl+='&nbAdults='+pax.adults;
      for (i=0;i<pax.adults;i++){
       afUrl += '&paxTypoList=ADT';
       curPax++;
      }
    afUrl+='&nbEnfants='+tmpPax.y;
      for (i=0;i<tmpPax.y;i++){
       afUrl += '&paxTypoList=YTH_MIN';
       curPax++;
    }
    afUrl+='&nbChildren='+tmpPax.c;
      for (i=0;i<tmpPax.y;i++){
       afUrl += '&paxTypoList=CHD';
       curPax++;
    }  
    afUrl+='&nbBebes='+pax.infLap;
      for (i=0;i<pax.infLap;i++){
       afUrl += '&paxTypoList=INF';
       curPax++;
      }
    afUrl += '&nbPassenger='+curPax+'&nbPax='+curPax;
    return afUrl;
  }; 
  // get edition
  var edition=mptUsersettings["afEdition"];
  var url = createUrl(edition);
  if (url === false) {
    return false;
  }
  var extra = ' <span class="pt-hover-container">[+]<span class="pt-hover-menu">';
  extra += afEditions.map(function (obj, i) { return '<a href="' + createUrl(obj.value) + '" target="_blank">' + obj.name +'</a>'; }).join('<br/>');
  extra += '</span></span>';
  
  if (mptUsersettings["enableInlinemode"]==1){
    printUrlInline(url,"Air France","",null,extra);
  } else {
    printUrl(url,"Air France","",extra);
  }     
}

function printAS(){
    // validate Passengers here: Max Paxcount = 7 (Infs not included) - >11 = Adult - InfSeat = Child
    var createUrl = function () {
      var pax=validatePaxcount({maxPaxcount:6, countInf:true, childAsAdult:6, sepInfSeat:false, childMinAge:2});
      if (pax===false){
        printNotification("Error: Failed to validate Passengers in printAAc1");
        return false;
      }
      var url = "https://www.alaskaair.com/planbook/shoppingstart?";
      url+="A="+pax.adults+"&C="+pax.children.length+"&FT=";
      if (currentItin["itin"].length == 1){
        url+="ow";
      } else {
        url+="rt";
      }

      var k=0;
      //Build multi-city search based on legs
      for (var i=0;i<currentItin["itin"].length;i++) {
        // walks each leg
          for (var j=0;j<currentItin["itin"][i]["seg"].length;j++) {
          //walks each segment of leg
            var itinseg = currentItin['itin'][i]['seg'][j]['orig']+"|"+currentItin['itin'][i]['seg'][j]['dest'];
            itinseg    += "|"+("0"+currentItin['itin'][i]['seg'][j]['dep']['month']).slice(-2)+"/"+("0"+currentItin['itin'][i]['seg'][j]['dep']['day']).slice(-2);
            itinseg    += "/"+currentItin['itin'][i]['seg'][j]['dep']['year'];
            itinseg    += "|"+currentItin['itin'][i]['seg'][j]['fnr']+"|";
            itinseg    += currentItin['itin'][i]['seg'][j]['cabin'] ? "f" : "c";
            url+="&F"+(++k)+"="+encodeURIComponent(itinseg);
          }
      }
      url+="&DEST="+currentItin['itin'][0]['seg'][currentItin['itin'][0]['seg'].length-1]['dest'];
      url+="&FARE="+currentItin["price"]+"&frm=cart&META=GOO_CS";
      return url;
    };
    var url = createUrl();
    if (url === false) {
      return false;
    }
    if (mptUsersettings["enableInlinemode"]==1){
      printUrlInline(url,"Alaska","");
    } else {
      printUrl(url,"Alaska","");
    }
}

function printAZ() {
  var createUrl = function (edition) {
    var azUrl = 'https://www.alitalia.com/'+edition+'/home-page.metasearch.json?SearchType=BrandMetasearch';
  var cabins = ['Economy', 'Economy', 'Business', 'First'];
  var seg = 0;
  for (var i=0; i < currentItin['itin'].length; i++) {
    for (var j=0; j < currentItin['itin'][i]['seg'].length; j++) {
      azUrl += '&MetaSearchDestinations['+seg+'].From='         +currentItin['itin'][i]['seg'][j]['orig'];
      azUrl += '&MetaSearchDestinations['+seg+'].To='           +currentItin['itin'][i]['seg'][j]['dest'];
        azUrl += '&MetaSearchDestinations['+seg+'].DepartureDate='+currentItin['itin'][i]['seg'][j]['dep']['year']+'-'+('0'+currentItin['itin'][i]['seg'][j]['dep']['month']).slice(-2)+'-'+('0'+currentItin['itin'][i]['seg'][j]['dep']['day']).slice(-2)+':'+('0'+currentItin['itin'][i]['seg'][j]['dep']['time']).slice(-5);
        azUrl += '&MetaSearchDestinations['+seg+'].ArrivalDate='  +currentItin['itin'][i]['seg'][j]['arr']['year']+'-'+('0'+currentItin['itin'][i]['seg'][j]['arr']['month']).slice(-2)+'-'+('0'+currentItin['itin'][i]['seg'][j]['arr']['day']).slice(-2)+':'+('0'+currentItin['itin'][i]['seg'][j]['arr']['time']).slice(-5);
      azUrl += '&MetaSearchDestinations['+seg+'].Flight='       +currentItin['itin'][i]['seg'][j]['fnr']
      azUrl += '&MetaSearchDestinations['+seg+'].code='         +currentItin['itin'][i]['seg'][j]['farebase'];
      azUrl += '&MetaSearchDestinations['+seg+'].MseType=';
      azUrl += '&MetaSearchDestinations['+seg+'].bookingClass=' +currentItin['itin'][i]['seg'][j]['bookingclass'];
      azUrl += '&MetaSearchDestinations['+seg+'].cabinClass='   +cabins[currentItin['itin'][i]['seg'][j]['cabin']];
      azUrl += '&MetaSearchDestinations['+seg+'].slices='       +i;
      seg++;
    }
  }
  var pax=validatePaxcount({maxPaxcount:7, countInf:false, childAsAdult:12, sepInfSeat:false, childMinAge:2});
  if (pax===false){
    printNotification("Error: Failed to validate Passengers in printAZ");
    return false;
  }
  azUrl += '&children_number='+pax.children.length+'&newborn_number='+pax.infLap+'&adult_number='+pax.adults; 
    return azUrl;
  };  
  // get edition
  var edition=mptUsersettings["azEdition"];
  var azUrl = createUrl(edition);
  if (azUrl === false) {
    return false;
  }
  var extra = ' <span class="pt-hover-container">[+]<span class="pt-hover-menu">';
  extra += azEditions.map(function (obj, i) { return '<a href="' + createUrl(obj.value) + '" target="_blank">' + obj.name +'</a>'; }).join('<br/>');
  extra += '</span></span>';  
  if (mptUsersettings["enableInlinemode"]==1){
   printUrlInline(azUrl,"Alitalia","",null,extra);
  } else {
   printUrl(azUrl,"Alitalia","",extra);
  } 
}

function printBA(){
    var createUrl = function (edition,language) {
      // 0 = Economy; 1=Premium Economy; 2=Business; 3=First
      var cabins = ['M', 'W', 'C', 'F'];
      var pax=validatePaxcount({maxPaxcount:9, countInf:false, childAsAdult:16, sepInfSeat:false, childMinAge:2});
      if (pax===false){
        printNotification("Error: Failed to validate Passengers in printBA");
        return false;
      }
      var tmpPax={c:0,y:0};
      for (i=0;i<pax.children.length;i++){
        if (pax.children[i]>11){
         tmpPax.y++;
        } else {
         tmpPax.c++; 
        }
      }  
      var url = "https://www.britishairways.com/travel/fx/public/"+language+"_"+edition+"?eId=111054&data=F"+pax.adults+tmpPax.y+tmpPax.c+pax.infLap+"LF";
      var mincabin=3;
      //Build multi-city search based on legs
      for (var i=0;i<currentItin["itin"].length;i++) {
        // walks each leg          
              for (var j=0;j<currentItin["itin"][i]["seg"].length;j++) {
             //walks each segment of leg
                  var k=0;
                  // lets have a look if we need to skip segments - fnr has to be the same and it must be just a layover
                  while ((j+k)<currentItin["itin"][i]["seg"].length-1){
                   if (currentItin["itin"][i]["seg"][j+k]["fnr"] != currentItin["itin"][i]["seg"][j+k+1]["fnr"] || 
                       currentItin["itin"][i]["seg"][j+k]["layoverduration"] >= 1440) break;
                   k++;
                  }
                  url +=('0'+currentItin['itin'][i]['seg'][j]['dep']['day']).slice(-2)+('0'+currentItin['itin'][i]['seg'][j]['dep']['month']).slice(-2)+currentItin['itin'][i]['seg'][j]['dep']['year']+('0'+currentItin['itin'][i]['seg'][j]['dep']['time'].replace(":","")).slice(-4);
                  url +=currentItin["itin"][i]["seg"][j]["carrier"]+('000'+currentItin["itin"][i]["seg"][j]["fnr"]).slice(-4);
                  url +=cabins[currentItin["itin"][i]["seg"][j]["cabin"]];
                  url +=currentItin['itin'][i]['seg'][j]['orig']+currentItin['itin'][i]['seg'][(j+k)]['dest'];
                  if (currentItin["itin"].length == 2 && i == 1 ) {
                   url +='F'; 
                  } else {
                   url +='T';
                  }
                  if (currentItin["itin"][i]["seg"][j]["cabin"]<mincabin){mincabin=currentItin["itin"][i]["seg"][j]["cabin"];};
                  j+=k;
        }
      }  
      url += "&p=EUR6666.66&e=FP&c="+cabins[(mptSettings["cabin"]==="Auto" ? mincabin:getForcedCabin())]+"&source=FareQuoteEmail&isEmailHBOFareQuote=false";
      return url;
    };    
  // get edition
  var url = createUrl(mptUsersettings["baEdition"],mptUsersettings["baLanguage"]);
  if (url === false) {
    return false;
  }
  var extra = ' <span class="pt-hover-container">[+]<span class="pt-hover-menu">';
  extra += baEditions.map(function (obj, i) { return '<a href="' + createUrl(obj.value,mptUsersettings["baLanguage"]) + '" target="_blank">' + obj.name +'</a>'; }).join('<br/>');
  extra += '</span></span>';  
  if (mptUsersettings["enableInlinemode"]==1){
    printUrlInline(url,"British Airways","",null,extra);
  } else {
    printUrl(url,"British Airways","",extra);
  }     
}

function printCZ(){
  var createUrl = function (edition) {
    var paxConfig={allowinf:1, youthage:0};
    var pax=validatePaxcount({maxPaxcount:9, countInf:false, childAsAdult:12, sepInfSeat:false, childMinAge:2});
    if (pax===false){
      printNotification("Error: Failed to validate Passengers in printCZ");
      return false;
    }   
    var amadeusConfig =  {sepcabin:0,detailed:0,allowpremium:0,inctimes:0};
    var url = "http://global.csair.com/CZPortal/dyn/portal/doEnc?SITE=J00YJ00Y&BOOKING_FLOW=REVENUE&IS_FLEXIBLE=FALSE&LANGUAGE="+edition[1]+"&PRICING_TYPE=O&COUNTRY_SITE="+edition[0]+"&DISPLAY_TYPE=1";
    var tmpPax=getAmadeusPax(pax,paxConfig);
    url += tmpPax.url;
    url += '&NB_ADT=' + tmpPax.adults;
    url += '&NB_INF=' +tmpPax.infants;
    url += '&NB_CHD='+tmpPax.children;    
    url += '&TRIP_TYPE=M';
    url +=getAmadeusUrl(amadeusConfig);      
    return url;
  };
  // get edition
  var edition=mptUsersettings["czEdition"].split("-");
  if (edition.length!=2) {
    printNotification("Error:Invalid CZ-Edition");
    return false;
  }
  var url = createUrl(edition);
  if (url === false) {
    return false;
  }
  var extra = ' <span class="pt-hover-container">[+]<span class="pt-hover-menu">';
  extra += czEditions.map(function (obj, i) { return '<a href="' + createUrl(obj.value.split("-")) + '" target="_blank">' + obj.name +'</a>'; }).join('<br/>');
  extra += '</span></span>';
  if (mptUsersettings["enableInlinemode"]==1){
    printUrlInline(url,"China Southern","",null,extra);
  } else {
    printUrl(url,"China Southern","",extra);
  } 
}

function printDL(){
// Steppo: What about farebasis?
// Steppo: What about segmentskipping?
    var createUrl = function (edition) {
      // 0 = Economy; 1=Premium Economy; 2=Business; 3=First
      // Defaults for cabin identifiers for DL pricing engine; exceptions handled later
      var cabins = ['MAIN', 'DPPS', 'BU', 'FIRST'];
      var mincabin=3;
      var farebases=new Array();
      var pax=validatePaxcount({maxPaxcount:9, countInf:true, childAsAdult:12, sepInfSeat:false, childMinAge:2});
      if (pax===false){
        printNotification("Error: Failed to validate Passengers in printDL");
        return false;
      }
           
      var deltaURL ="http://"+edition[0]+".delta.com/air-shopping/priceTripAction.action?tripType=multiCity";
      deltaURL +="&currencyCd=" + (currentItin["cur"]=="EUR" ? "EUR" : "USD");
      deltaURL +="&exitCountry="+edition[1];
      var segcounter=0;
      for (var i=0;i<currentItin["itin"].length;i++) {
        // walks each leg
         for (var j=0;j<currentItin["itin"][i]["seg"].length;j++) {
           //walks each segment of leg
          deltaURL +="&itinSegment["+segcounter.toString()+"]="+i.toString()+":"+currentItin["itin"][i]["seg"][j]["bookingclass"];
          deltaURL +=":"+currentItin["itin"][i]["seg"][j]["orig"]+":"+currentItin["itin"][i]["seg"][j]["dest"]+":"+currentItin["itin"][i]["seg"][j]["carrier"]+":"+currentItin["itin"][i]["seg"][j]["fnr"];
          deltaURL +=":"+monthnumberToName(currentItin["itin"][i]["seg"][j]["dep"]["month"])+":"+ ( currentItin["itin"][i]["seg"][j]["dep"]["day"] < 10 ? "0":"") +currentItin["itin"][i]["seg"][j]["dep"]["day"]+":"+currentItin["itin"][i]["seg"][j]["dep"]["year"]+":0";
          farebases.push(currentItin["itin"][i]["seg"][j]["farebase"]);
          if (currentItin["itin"][i]["seg"][j]["cabin"] < mincabin) {mincabin=currentItin["itin"][i]["seg"][j]["cabin"];};
          // Exceptions to cabin identifiers for pricing
          switch (currentItin["itin"][i]["seg"][j]["bookingclass"]) {
            // Basic Economy fares
            case "E":
              cabins[0]='BASIC-ECONOMY';
              break;
            // Comfort+ fares
            case "W":
              cabins[1]='DCP';
              break;
            default:
          }
          segcounter++; 
        }
      }
      if (mptUsersettings["enableNonDeltaAirlineOnDL"]==0) {
        deltaURL += "&cabin="+cabins[(mptSettings["cabin"]==="Auto" ? mincabin:getForcedCabin())];
      }
      deltaURL += "&fareBasis="+farebases.join(":");
      //deltaURL += "&price=0";
      deltaURL += "&numOfSegments=" + segcounter.toString() + "&paxCount=" + (pax.adults+pax.children.length+pax.infLap);
      deltaURL += "&vendorRedirectFlag=true&vendorID=Google";
      return deltaURL;
     };   
  // get edition
  var edition=mptUsersettings["dlEdition"].split("_");
  if (edition.length!=2) {
    printNotification("Error:Invalid Delta-Edition");
    return false;
  }
  var url = createUrl(edition);
  if (url === false) {
    return false;
  }
  var extra = ' <span class="pt-hover-container">[+]<span class="pt-hover-menu">';
  extra += dlEditions.map(function (obj, i) { return '<a href="' + createUrl(obj.value.split("_")) + '" target="_blank">' + obj.name +'</a>'; }).join('<br/>');
  extra += '</span></span>';
  
  if (mptUsersettings["enableInlinemode"]==1){
    printUrlInline(url,"Delta","",null,extra);
  } else {
    printUrl(url,"Delta","",extra);
  }     
}

function printIB(){
  var createUrl = function (edition,currency) {
      // 0 = Economy; 1=Premium Economy; 2=Business; 3=First
      var cabins = ['Economy', 'Economy', 'Business', 'First'];   
      var pax=validatePaxcount({maxPaxcount:9, countInf:false, childAsAdult:12, sepInfSeat:false, childMinAge:2});
      if (pax===false){
        printNotification("Error: Failed to validate Passengers in printIB");
        return false;
      }
      var url = "http://www.iberia.com/web/partnerLink.do?Adult="+pax.adults+"&Child="+pax.children.length+"&Infant=0&InfantLap="+pax.infLap+"&PointOfSaleCountry="+edition[1]+"&UserCurrency="+currency+"&UserLanguage="+edition[0]+"&TripType=";
      if (currentItin["itin"].length == 1){
       url+="OneWay";  
      } else if (currentItin["itin"].length == 2 &&
          currentItin["itin"][0]["orig"] == currentItin["itin"][1]["dest"] &&
          currentItin["itin"][0]["dest"] == currentItin["itin"][1]["orig"]) {
       url+="RoundTrip";  
      } else {
       url+="MultiCity"; 
      }

      var seg=0;
      var slice=1;
      var slicestr="";
      //Build multi-city search based on legs
        for (var i=0;i<currentItin["itin"].length;i++) {
          // walks each leg          
                for (var j=0;j<currentItin["itin"][i]["seg"].length;j++) {
                seg++;  
               //walks each segment of leg
                    var k=0;
                    // lets have a look if we need to skip segments - Flightnumber has to be the same and it must be just a layover
                    while ((j+k)<currentItin["itin"][i]["seg"].length-1){
                     if (currentItin["itin"][i]["seg"][j+k]["fnr"] != currentItin["itin"][i]["seg"][j+k+1]["fnr"] || 
                         currentItin["itin"][i]["seg"][j+k]["layoverduration"] >= 1440) break;
                     k++;
                    }               
                    url += "&Origin"+seg+"="+currentItin['itin'][i]['seg'][j]['orig'];
                    url += "&Destination"+seg+"="+currentItin['itin'][i]['seg'][j+k]['dest'];
                    url += "&Carrier"+seg+"="+currentItin['itin'][i]['seg'][j]['carrier'];
                    url += "&DepartureDate"+seg+"="+currentItin['itin'][i]['seg'][j]['dep']['year']+'-'+('0'+currentItin['itin'][i]['seg'][j]['dep']['month']).slice(-2)+'-'+('0'+currentItin['itin'][i]['seg'][j]['dep']['day']).slice(-2); ;
                    url += "&FlightNumber"+seg+"="+currentItin['itin'][i]['seg'][j]['fnr'];
                    url += "&BookingCode"+seg+"="+currentItin['itin'][i]['seg'][j]['bookingclass'];
                    url += "&Cabin"+seg+"="+ cabins[currentItin['itin'][i]['seg'][j]['cabin']];
                    slicestr+=( slicestr === "" ? "":"%2C")+seg;
                    j+=k;
          }
          url += "&Slice"+slice+"="+slicestr;
          slice++;
          slicestr="";
        } 
        return url;
    };
  // get edition
  var edition=mptUsersettings["ibEdition"].split("-");
  var url = createUrl(edition,mptUsersettings["ibCurrency"]);
  if (url === false) {
    return false;
  }
  var extra = ' <span class="pt-hover-container">[+]<span class="pt-hover-menu">';
  extra += ibEditions.map(function (obj, i) { return '<a href="' + createUrl(obj.value.split("-"),mptUsersettings["ibCurrency"]) + '" target="_blank">' + obj.name +'</a>'; }).join('<br/>');
  extra += '</span></span>';
  
  if (mptUsersettings["enableInlinemode"]==1){
    printUrlInline(url,"Iberia","",null,extra);
  } else {
    printUrl(url,"Iberia","",extra);
  }
}

function printKL() {
  var createUrl = function (edition) {
    var klUrl = 'https://www.klm.com/travel/';
    klUrl += edition[0]+'_'+edition[1]+'/apps/ebt/ebt_home.htm?lang='+edition[1].toUpperCase();
    klUrl += '&dev=5&cffcc=ECONOMY';
    var pax=validatePaxcount({maxPaxcount:9, countInf:false, childAsAdult:12, sepInfSeat:false, childMinAge:2});
    if (pax===false){
      printNotification("Error: Failed to validate Passengers in printKL");
      return false;
    }
    klUrl += '&adtQty='+pax.adults+'&chdQty='+pax.children.length+'&infQty='+pax.infLap;
    var fb = '';
    var oper = '';
    for (var i=0; i < currentItin['itin'].length; i++) {
      klUrl += '&c['+i+'].os='+currentItin['itin'][i]['orig'];
      klUrl += '&c['+i+'].ds='+currentItin['itin'][i]['dest'];
      klUrl += '&c['+i+'].dd='+currentItin['itin'][i]['dep']['year']+'-'+('0'+currentItin['itin'][i]['dep']['month']).slice(-2)+'-'+('0'+currentItin['itin'][i]['dep']['day']).slice(-2);   
      if (i > 0) oper += '..';
      for (var j=0; j < currentItin['itin'][i]['seg'].length; j++) {
        klUrl += '&c['+i+'].s['+j+'].os='+currentItin['itin'][i]['seg'][j]['orig'];
        klUrl += '&c['+i+'].s['+j+'].ds='+currentItin['itin'][i]['seg'][j]['dest'];
        klUrl += '&c['+i+'].s['+j+'].dd='+currentItin['itin'][i]['seg'][j]['dep']['year']+'-'+('0'+currentItin['itin'][i]['seg'][j]['dep']['month']).slice(-2)+'-'+('0'+currentItin['itin'][i]['seg'][j]['dep']['day']).slice(-2);
        klUrl += '&c['+i+'].s['+j+'].dt='+('0'+currentItin['itin'][i]['seg'][j]['dep']['time'].replace(':','')).slice(-4);
        klUrl += '&c['+i+'].s['+j+'].mc='+currentItin['itin'][i]['seg'][j]['carrier'];
        klUrl += '&c['+i+'].s['+j+'].fn='+('000'+currentItin['itin'][i]['seg'][j]['fnr']).slice(-4);
        
        if (j > 0) oper += '.';
        oper += currentItin['itin'][i]['seg'][j]['carrier'];
      }
    }
    
    for (var i=0; i < currentItin['farebases'].length; i++) {
      if (i > 0) fb += ',';
      fb += currentItin['farebases'][i];
    }
    
    klUrl += '&ref=fb='+fb;//+',oper='+oper;
    return klUrl;
  };
  // get edition
  var edition=mptUsersettings["klEdition"].split("_");
  if (edition.length!=2) {
    printNotification("Error:Invalid KLM-Edition");
    return false;
  }
  var url = createUrl(edition);
  if (url === false) {
    return false;
  }
  var extra = ' <span class="pt-hover-container">[+]<span class="pt-hover-menu">';
  extra += klEditions.map(function (obj, i) { return '<a href="' + createUrl(obj.value.split("_")) + '" target="_blank">' + obj.name +'</a>'; }).join('<br/>');
  extra += '</span></span>';
  
  if (mptUsersettings["enableInlinemode"]==1){
    printUrlInline(url,"KLM","",null,extra);
  } else {
    printUrl(url,"KLM","",extra);
  } 
}

function printLA(){
  var createUrl = function (edition) {
  var pax=validatePaxcount({maxPaxcount:9, countInf:false, childAsAdult:12, sepInfSeat:false, childMinAge:2});
    if (pax===false){
      printNotification("Error: Failed to validate Passengers in printLA");
      return false;
    }  
    var laUrl='{"apikey":null,"trip":{"flights":[';
        for (var i=0;i<currentItin["itin"].length;i++) {
          var mincabin=3;
          laUrl += '{"segments":[';
          // walks each leg
           for (var j=0;j<currentItin["itin"][i]["seg"].length;j++) {
             //walks each segment of leg
              var k = 0;
             // lets have a look if we need to skip segments - Flightnumber has to be the same and it must be just a layover
              while ((j+k)<currentItin["itin"][i]["seg"].length-1){
              if (currentItin["itin"][i]["seg"][j+k]["fnr"] != currentItin["itin"][i]["seg"][j+k+1]["fnr"] || 
                       currentItin["itin"][i]["seg"][j+k]["layoverduration"] >= 1440) break;
                     k++;
              }
              laUrl+='{"marketing_airline":"'+currentItin["itin"][i]["seg"][j]["carrier"]+'","flight_number":"'+currentItin["itin"][i]["seg"][j]["fnr"]+'","departure_date":"'+ currentItin["itin"][i]["seg"][j]["dep"]["year"].toString() +'-'+ ('0'+currentItin["itin"][i]["seg"][j]["dep"]["month"].toString()).slice(-2) +'-'+ ('0'+currentItin["itin"][i]["seg"][j]["dep"]["day"].toString()).slice(-2) +'","departure_airport":"'+currentItin["itin"][i]["seg"][j]["orig"]+'","arrival_airport":"'+currentItin["itin"][i]["seg"][j+k]["dest"]+'","class":"'+currentItin["itin"][i]["seg"][j]["bookingclass"]+'"},';
              if (currentItin["itin"][i]["seg"][j]["cabin"] < mincabin) {mincabin=currentItin["itin"][i]["seg"][j]["cabin"];};
              j+=k; 
          }
          laUrl = laUrl.substring(0,laUrl.length-1)+']},';
        }
        laUrl = 'https://ssl.lan.com/cgi-bin/compra/paso3.cgi?forced_home='+edition[0]+'%2F'+edition[1]+'&sessionParameters=' + encodeURIComponent(laUrl.substring(0,laUrl.length-1) +']},"passengers":{"numberAdults":'+pax.adults+',"numberInfants":'+pax.infLap+',"numberChildren":'+pax.children.length+'}}');
        return laUrl;
   };
  // get edition
  var edition=mptUsersettings["laEdition"].split("_");
  if (edition.length!=2) {
    printNotification("Error:Invalid LAN-Edition");
    return false;
  }
  var url = createUrl(edition);
  if (url === false) {
    return false;
  }
  var extra = ' <span class="pt-hover-container">[+]<span class="pt-hover-menu">';
  extra += laEditions.map(function (obj, i) { return '<a href="' + createUrl(obj.value.split("_")) + '" target="_blank">' + obj.name +'</a>'; }).join('<br/>');
  extra += '</span></span>';
  desc="Create Session First";
  if (mptUsersettings["enableInlinemode"]==1){
    printUrlInline(url,"LAN",desc,null,extra);
  } else {
    printUrl(url,"LAN",desc,extra);
  } 

}

function printLH(){
  var createUrl = function (edition) {
    var style=0; // 0 is direct booking - 1 is pre selected
    var paxConfig={allowinf:1, youthage:0};
    var pax=validatePaxcount({maxPaxcount:9, countInf:false, childAsAdult:12, sepInfSeat:false, childMinAge:2});
    if (pax===false){
      printNotification("Error: Failed to validate Passengers in printLH");
      return false;
    }   
    var amadeusConfig =  {sepcabin:0,detailed:0,allowpremium:1,inctimes:0};
    if (style==0) {
     var url = "https://book.lufthansa.com/lh/dyn/air-lh/revenue/availThenFare?";
     url += "WDS_MSE_PRICE_CURRENCY=EUR&WDS_MSE_TOTAL_PRICE=1.00&";     
    } else {
     var url = "https://book.lufthansa.com/lh/dyn/air-lh/revenue/viewFlights?";      
    }
    url += "PORTAL=LH&COUNTRY_SITE="+edition[0].toUpperCase()+"&POS="+edition[0].toUpperCase()+"&LANGUAGE="+edition[1].toUpperCase()+"&SECURE=TRUE&SITE=LUFTLUFT&SO_SITE_LH_FRONTEND_URL=www.lufthansa.com&WDS_WR_CHANNEL=LHCOM";
    var tmpPax=getAmadeusPax(pax,paxConfig);
    url += tmpPax.url;
    url += '&NB_ADT=' + tmpPax.adults;
    url += '&NB_INF=' +tmpPax.infants;
    url += '&NB_CHD='+tmpPax.children;    
    url += '&TRIP_TYPE=' + getAmadeusTriptype();  
    url +=getAmadeusUrl(amadeusConfig);  
    
    return url;
  };
  // get edition
  var edition=mptUsersettings["lhEdition"].split("-");
  if (edition.length!=2) {
    printNotification("Error:Invalid Lufthansa-Edition");
    return false;
  }
  var url = createUrl(edition);
  if (url === false) {
    return false;
  }
  var extra = ' <span class="pt-hover-container">[+]<span class="pt-hover-menu">';
  extra += lhEditions.map(function (obj, i) { return '<a href="' + createUrl(obj.value.split("-")) + '" target="_blank">' + obj.name +'</a>'; }).join('<br/>');
  extra += '</span></span>';
  
  if (mptUsersettings["enableInlinemode"]==1){
    printUrlInline(url,"Lufthansa","",null,extra);
  } else {
    printUrl(url,"Lufthansa","",extra);
  } 
}

function printLX() {
  // 0 = Economy; 1=Premium Economy; 2=Business; 3=First
  var cabins = ['', '', '/class-business', '/class-first'];  
  var mincabin = 3;
  var createUrl = function (edition) {
    var url = 'https://www.swiss.com/'+edition[0]+'/'+edition[1]+'/Book/Combined';
    var pax=validatePaxcount({maxPaxcount:9, countInf:false, childAsAdult:12, sepInfSeat:false, childMinAge:2});
    if (pax===false){
      printNotification("Error: Failed to validate Passengers in printLX");
      return false;
    }
    //Build multi-city search based on legs  
    for (var i=0;i<currentItin["itin"].length;i++) {
      // walks each leg
      url += '/'+currentItin["itin"][i]["orig"]+'-'+currentItin["itin"][i]["dest"]+"/";
      for (var j=0;j<currentItin["itin"][i]["seg"].length;j++) {
        //walks each segment of leg
        var k=0;
        // lets have a look if we need to skip segments - Flightnumber has to be the same and it must be just a layover
        while ((j+k)<currentItin["itin"][i]["seg"].length-1) {
          if (currentItin["itin"][i]["seg"][j+k]["fnr"] != currentItin["itin"][i]["seg"][j+k+1]["fnr"] || 
              currentItin["itin"][i]["seg"][j+k]["layoverduration"] >= 1440) break;
          k++;
        }               
        url += currentItin["itin"][i]["seg"][j]["carrier"]+currentItin["itin"][i]["seg"][j]["fnr"]+"-";
        if (currentItin["itin"][i]["seg"][j]["cabin"]<mincabin){mincabin=currentItin["itin"][i]["seg"][j]["cabin"];};
        j+=k;
      }
     url = url.substring(0,url.length-1); 
     url += '/'+(i>0?"to":"from")+'-'+currentItin.itin[i].dep.year+"-"+('0'+currentItin.itin[i].dep.month).slice(-2)+"-"+('0'+currentItin.itin[i].dep.day).slice(-2);      
    }
    url += '/adults-'+pax.adults+'/children-'+pax.children.length+'/infants-'+pax.infLap;
    url += cabins[(mptSettings["cabin"]==="Auto" ? mincabin:getForcedCabin())];
    return url;
  };
  // get edition
  var edition=mptUsersettings["lxEdition"].split("_");
  if (edition.length!=2) {
    printNotification("Error:Invalid Swiss-Edition");
    return false;
  }
  var url = createUrl(edition);
  if (url === false) {
    return false;
  }
  var extra = ' <span class="pt-hover-container">[+]<span class="pt-hover-menu">';
  extra += lxEditions.map(function (obj, i) { return '<a href="' + createUrl(obj.value.split("_")) + '" target="_blank">' + obj.name +'</a>'; }).join('<br/>');
  extra += '</span></span>';
  
  if (mptUsersettings["enableInlinemode"]==1){
    printUrlInline(url,"Swiss","",null,extra);
  } else {
    printUrl(url,"Swiss","",extra);
  } 
}

function printTK(){
  var data=currentItin;
  var curleg=0;
  var lastcabin=0;
  var curseg=0;
  var lastdest="";
  var url = "https://book.eu2.amadeus.com/plnext/turkishairlines/Override.action?"; 
  var paxConfig={allowinf:1, youthage:0};
  var pax=validatePaxcount({maxPaxcount:9, countInf:false, childAsAdult:12, sepInfSeat:false, childMinAge:2});
  if (pax===false){
      printNotification("Error: Failed to validate Passengers in printTK");
      return false;
  }
  var amadeusConfig =  {sepcabin:0,detailed:0,allowpremium:1,inctimes:1};  
  var tmpPax=getAmadeusPax(pax,paxConfig); 
  url += 'TRIP_TYPE=' + getAmadeusTriptype();
  url += tmpPax.url;
  url += getAmadeusUrl(amadeusConfig);
  url += "&PORT_TSC=FALSE&SO_SITE_ALLOW_SERVICE_FEE=0&SO_SITE_SERVICE_FEE_MODE=AIR&SITE=BBAHBBAH";
  url += "&LANGUAGE="+(mptUsersettings["language"]=="tk" || mptUsersettings["language"]=="de" ? mptUsersettings["language"].toUpperCase() : "GB" );
  url += "&EMBEDDED_TRANSACTION=AirComplexAvailability&TRIPFLOW=YES";
  url += "SO_LANG_TRIPFLOW_ENTRY_ADDRE=online.turkishairlines.com%2Finternet-booking%2Famadeus.tk&ARRANGE_BY=N&DIRECT_NON_STOP=false&REFRESH=0&SO_SITE_TAX_BREAKDOWN_DISP=TRUE&SO_LANG_DISABLE_X_XSS_PROTEC=TRUE&SO_SITE_REDIRECT_MODE=AUTOMATIC&SO_LANG_URL_AIR_NFS_SRCH=http%3A%2F%2Fonline.turkishairlines.com%2Finternet-booking%2Fstart.tk";
    if (mptUsersettings["enableInlinemode"]==1){
      printUrlInline(url,"Turkish Airlines","");
    } else {
      printUrl(url,"Turkish Airlines","");
    } 
}

function printCheapOair(){
  // 0 = Economy; 1=Premium Economy; 2=Business; 3=First
  var cabins = ['Economy', 'PREMIUMECONOMY', 'Business', 'First'];
  var coaUrl = 'http://www.cheapoair.com/default.aspx?tabid=1832&ulang=en';
  var pax=validatePaxcount({maxPaxcount:9, countInf:true, childAsAdult:12, sepInfSeat:true, childMinAge:2});
  if (pax===false){
    printNotification("Error: Failed to validate Passengers in printCheapOair");
    return false;
  }
  coaUrl += '&ad='+pax.adults+'&ch='+pax.children.length+'&il='+pax.infLap+'&is='+pax.infSeat;
  var seg = 0;
  var slices = {};
  for (var i=0; i < currentItin.itin.length; i++) {
    slices[i] = '';
    for (var j=0; j < currentItin.itin[i].seg.length; j++) {
      seg++;
      if (slices[i]) slices[i] += ',';
      slices[i] += seg;
      
      coaUrl += '&cbn'        +seg+'='+cabins[currentItin.itin[i].seg[j].cabin];
      coaUrl += '&carr'      +seg+'='+currentItin.itin[i].seg[j].carrier;
      coaUrl += '&dd'+seg+'='+currentItin.itin[i].seg[j].dep.year+('0'+currentItin.itin[i].seg[j].dep.month).slice(-2)+('0'+currentItin.itin[i].seg[j].dep.day).slice(-2);
      coaUrl += '&og'       +seg+'='+currentItin.itin[i].seg[j].orig;
      coaUrl += '&dt'  +seg+'='+currentItin.itin[i].seg[j].dest;
      coaUrl += '&fbc'  +seg+'='+currentItin.itin[i].seg[j].bookingclass;
      coaUrl += '&fnum' +seg+'='+currentItin.itin[i].seg[j].fnr;
    }
    
    coaUrl += '&Slice'+(i+1)+'='+slices[i];
  }
  
  if (currentItin.itin.length == 1) {
    coaUrl += '&tt=OneWay';
  }
  else if (currentItin.itin.length == 2 && currentItin.itin[0].orig == currentItin.itin[1].dest && currentItin.itin[0].dest == currentItin.itin[1].orig) {
    coaUrl += '&tt=RoundTrip';
  }
  else {
    coaUrl += '&tt=MultiCity';
  }
  
  if (mptUsersettings["enableInlinemode"]==1){
    printUrlInline(coaUrl,"CheapOair","");
  } else {
    printUrl(coaUrl,"CheapOair","");
  }
}

/*** OTAs ****/
function printPriceline(){
    var pricelineurl = "https://www.priceline.com/m/fly/search";
    var searchparam="~";
    for (var i=0;i<currentItin["itin"].length;i++) {
      // walks each leg     
      searchparam=searchparam.substring(0,searchparam.length-1)+"-";     
      pricelineurl+="/"+currentItin["itin"][i]["orig"];
      pricelineurl+="-"+currentItin["itin"][i]["dest"];
      pricelineurl+="-"+currentItin["itin"][i]["arr"]["year"].toString()+("0"+currentItin["itin"][i]["dep"]["month"]).slice(-2)+("0"+currentItin["itin"][i]["dep"]["day"]).slice(-2);
      for (var j=0;j<currentItin["itin"][i]["seg"].length;j++) { 
                //walks each segment of leg
                var k=0;
                // lets have a look if we need to skip segments - Flightnumber has to be the same and it must be just a layover
                while ((j+k)<currentItin["itin"][i]["seg"].length-1){
                if (currentItin["itin"][i]["seg"][j+k]["fnr"] != currentItin["itin"][i]["seg"][j+k+1]["fnr"] || 
                         currentItin["itin"][i]["seg"][j+k]["layoverduration"] >= 1440) break;
                       k++;
                }
                searchparam+=currentItin["itin"][i]["seg"][j]["orig"];
                searchparam+=currentItin["itin"][i]["seg"][j]["dep"]["year"].toString()+("0"+currentItin["itin"][i]["seg"][j]["dep"]["month"]).slice(-2)+("0"+currentItin["itin"][i]["seg"][j]["dep"]["day"]).slice(-2)+("0"+currentItin["itin"][i]["seg"][j]["dep"]["time"].replace(":","")).slice(-4);
                searchparam+=currentItin["itin"][i]["seg"][j+k]["dest"];
                searchparam+=currentItin["itin"][i]["seg"][j+k]["arr"]["year"].toString()+("0"+currentItin["itin"][i]["seg"][j+k]["arr"]["month"]).slice(-2)+("0"+currentItin["itin"][i]["seg"][j+k]["arr"]["day"]).slice(-2)+("0"+currentItin["itin"][i]["seg"][j+k]["arr"]["time"].replace(":","")).slice(-4);
                searchparam+=currentItin["itin"][i]["seg"][j]["bookingclass"]+currentItin["itin"][i]["seg"][j]["carrier"]+currentItin["itin"][i]["seg"][j]["fnr"];
                searchparam+="~";         
                j+=k;
      }
    }
     searchparam=searchparam.substring(1,searchparam.length-1);
    var pax=validatePaxcount({maxPaxcount:9, countInf:true, childAsAdult:18, sepInfSeat:false, childMinAge:2});
    if (pax===false){
      printNotification("Error: Failed to validate Passengers in printPriceline");
      return false;
    }
   pricelineurl+="/details/R_"+searchparam+"_"+(pax.adults+pax.children.length+pax.infLap)+"_USD0.00?refid=0&num-adults="+pax.adults+"&num-children="+pax.children.length+"&num-infants="+pax.infLap+"&num-youths=0";
   if (mptUsersettings["enableInlinemode"]==1){
      printUrlInline(pricelineurl,"Priceline","");
    } else {
      printUrl(pricelineurl,"Priceline","");
    }
}

function printEtraveli () {
  if (currentItin.itin.length > 2) return; // no multi segments
  if (currentItin.itin.length == 2 && !(currentItin.itin[0].orig == currentItin.itin[1].dest && currentItin.itin[0].dest == currentItin.itin[1].orig)) return; // no open jaws  
  var editions = [{name:"Seat24.se",host:"www.seat24.se"},{name:"Seat24.de",host:"www.seat24.de"},{name:"Seat24.dk",host:"www.seat24.dk"},{name:"Seat24.fi",host:"www.seat24.fi"},{name:"Seat24.no",host:"www.seat24.no"},{name:"Flygvaruhuset.se",host:"www.flygvaruhuset.se"},{name:"Travelpartner.se",host:"www.travelpartner.se"},{name:"Travelpartner.fi",host:"www.travelpartner.fi"},{name:"Travelpartner.no",host:"www.travelpartner.no"},{name:"Budjet.se",host:"www.budjet.se"},{name:"Budjet.fi",host:"www.budjet.fi"},{name:"Budjet.no",host:"www.budjet.no"},{name:"Budjet.dk",host:"www.budjet.dk"},{name:"Goleif.dk",host:"www.goleif.dk"},{name:"Travelfinder.se",host:"www.travelfinder.se"},{name:"Gotogate.no",host:"www.gotogate.no"},{name:"Gotogate.at",host:"www.gotogate.at"},{name:"Gotogate.be",host:"be.gotogate.com"},{name:"Gotogate.bg",host:"bg.gotogate.com"},{name:"Gotogate.ch",host:"www.gotogate.ch"},{name:"Gotogate.cz",host:"cz.gotogate.com"},{name:"Gotogate.es",host:"www.gotogate.es"},{name:"Gotogate.fr",host:"www.gotogate.fr"},{name:"Gotogate.gr",host:"www.gotogate.gr"},{name:"Gotogate.hu",host:"hu.gotogate.com"},{name:"Gotogate.ie",host:"ie.gotogate.com"},{name:"Gotogate.it",host:"www.gotogate.it"},{name:"Gotogate.pl",host:"www.gotogate.pl"},{name:"Gotogate.pt",host:"www.gotogate.pt"},{name:"Gotogate.ro",host:"ro.gotogate.com"},{name:"Gotogate.sk",host:"www.gotogate.sk"},{name:"Gotogate.tr",host:"tr.gotogate.com"},{name:"Gotogate.com.ua",host:"www.gotogate.com.ua"},{name:"Gotogate.co.uk",host:"www.gotogate.co.uk"},{name:"Flybillet.dk",host:"www.flybillet.dk"},{name:"Travelstart.se",host:"www.travelstart.se"},{name:"Travelstart.de",host:"www.travelstart.de"},{name:"Travelstart.dk",host:"www.travelstart.dk"},{name:"Travelstart.fi",host:"www.travelstart.fi"},{name:"Travelstart.no",host:"www.travelstart.no"},{name:"Supersaver.se",host:"www.supersavertravel.se"},{name:"Supersaver.dk",host:"www.supersaver.dk"},{name:"Supersaver.fi",host:"www.supersaver.fi"},{name:"Supersaver.nl",host:"www.supersaver.nl"},{name:"Supersaver.no",host:"www.supersaver.no"},{name:"Supersaver.ru",host:"www.supersaver.ru"}];  
  var convertDate = function (date, withYear) {
    return ('0'+date.day).slice(-2) + monthnumberToName(date.month) + (withYear ? date.year.toString().slice(-2) : '');
  };  
  var createUrl = function (host) {
    var ggUrl = 'http://' + host + '/air/';   
    ggUrl += currentItin.itin[0].orig + currentItin.itin[0].dest + convertDate(currentItin.itin[0].dep, false);   
    if (currentItin.itin.length > 1) ggUrl += convertDate(currentItin.itin[1].dep, false); 
    ggUrl += '/' + currentItin.numPax;
    ggUrl += '?selectionKey=' + currentItin.itin.map(function (itin) { 
      return itin.seg.map(function (seg) { return seg.carrier + seg.fnr + '-' + convertDate(seg.dep, true) + '-' + seg.bookingclass; }).join('_');
    }).join('_');
    
    return ggUrl;
  };  
  // picked seat24 as main one, but could be any of them
  var ggUrl = createUrl('www.seat24.de');  
  var extra = ' <span class="pt-hover-container">[+]<span class="pt-hover-menu">';
  extra += editions.map(function (obj, i) { return '<a href="' + createUrl(obj.host) + '" target="_blank">' + obj.name +'</a>'; }).join('<br/>');
  extra += '</span></span>';  
  if (mptUsersettings["enableInlinemode"]==1){
    printUrlInline(ggUrl,'Seat24.de',"",null,extra);
  } else {
    printUrl(ggUrl,'Seat24.de',"",extra);
  }
}
/***  META ***/
function printHipmunk(){
  // 0 = Economy; 1=Premium Economy; 2=Business; 3=First
    var cabins = ['Coach', 'Coach', 'Business', 'First'];  
    var url = "https://www.hipmunk.com/search/flights?";
    var mincabin=3;
    var pax=validatePaxcount({maxPaxcount:9, countInf:true, childAsAdult:18, sepInfSeat:true, childMinAge:2});
    if (pax===false){
      printNotification("Error: Failed to validate Passengers in printHipmunk");
      return false;
    } 
    //Build multi-city search based on legs
    for (var i=0;i<currentItin["itin"].length;i++) {
      // walks each leg
            url += "&from"+i+"=" + currentItin["itin"][i]["orig"];            
            for (var j=0;j<currentItin["itin"][i]["seg"].length;j++) {
           //walks each segment of leg
                var k=0;
                // lets have a look if we need to skip segments - Flightnumber has to be the same and it must be just a layover
                while ((j+k)<currentItin["itin"][i]["seg"].length-1){
                 if (currentItin["itin"][i]["seg"][j+k]["fnr"] != currentItin["itin"][i]["seg"][j+k+1]["fnr"] || 
                     currentItin["itin"][i]["seg"][j+k]["layoverduration"] >= 1440) break;
                 k++;
                }               
                url += ( j>0 ? "%20"+currentItin["itin"][i]["seg"][j]["orig"]+"%20":"%3A%3A")+currentItin["itin"][i]["seg"][j]["carrier"] + currentItin["itin"][i]["seg"][j]["fnr"];
                if (currentItin["itin"][i]["seg"][j]["cabin"]<mincabin){mincabin=currentItin["itin"][i]["seg"][j]["cabin"];};  
                j+=k;
      }
      url += "&date"+i+"="+currentItin["itin"][i]["dep"]["year"]+"-"+( Number(currentItin["itin"][i]["dep"]["month"]) <= 9 ? "0":"") +currentItin["itin"][i]["dep"]["month"].toString()+"-"+ ( Number(currentItin["itin"][i]["dep"]["day"]) <= 9 ? "0":"") +currentItin["itin"][i]["dep"]["day"].toString();  
      url += "&to"+i+"="+currentItin["itin"][i]["dest"];
    }  
    url += '&pax='+pax.adults+'&cabin='+cabins[(mptSettings["cabin"]==="Auto" ? mincabin:getForcedCabin())]+'&infant_lap='+pax.infLap+'&infant_seat='+pax.infSeat+'&seniors=0&children='+pax.children.length;
    if (mptUsersettings["enableInlinemode"]==1){
      printUrlInline(url,"Hipmunk","");
    } else {
      printUrl(url,"Hipmunk","");
    } 
}
function printMomondo() {
    //example http://www.Momondo.ru/flightsearch/?...false&NA=false
    //pax # &AD=2&CA=0,8 – not working with children (total amount of adults + kids goes to adult)  
    var MomondoEditions = [{name:"Momondo.com",host:"Momondo.com"},{name:"Momondo.de",host:"Momondo.de"},{name:"Momondo.it",host:"Momondo.it"},{name:"Momondo.es",host:"Momondo.es"},{name:"Momondo.co.uk",host:"Momondo.co.uk"},{name:"Momondo.dk",host:"Momondo.dk"},{name:"Momondo.mx",host:"Momondo.mx"},{name:"Momondo.fi",host:"Momondo.fi"},{name:"Momondo.fr",host:"Momondo.fr"}, {name:"Momondo.no",host:"Momondo.no"},{name:"Momondo.nl",host:"Momondo.nl"},{name:"Momondo.pt",host: "Momondo.pt"},{name:"Momondo.se",host:"Momondo.se" },{name:"Momondo.ru",host:"Momondo.ru"}];
    var MomondoCreateUrl = function(host) {
        var MomondoUrl = 'http://www.' + host + '/flightsearch/?Search=true&TripType=4';
        var seg = 0;
        MomondoUrl += '&SegNo=' + currentItin['itin'].length;
        for (var i = 0; i < currentItin['itin'].length; i++) {
            MomondoUrl += '&SO' + seg + '=' + currentItin['itin'][i]['orig'];
            MomondoUrl += '&SD' + seg + '=' + currentItin['itin'][i]['dest'];
            MomondoUrl += '&SDP' + seg + '=' + ('0' + currentItin['itin'][i]['dep']['day']).slice(-2) + '-' + ('0' + currentItin['itin'][i]['dep']['month']).slice(-2) + '-' + currentItin['itin'][i]['dep']['year'];
            seg++;
        }
        MomondoUrl += '&AD=' + currentItin['numPax'] + '&TK=' + getMomondoCabin(currentItin['itin']['cabin']);
        return MomondoUrl;
    };
    var MomondoUrl = MomondoCreateUrl("Momondo.com");
    var MomondoExtra = ' <span class="pt-hover-container">[+]<span class="pt-hover-menu">';
    MomondoExtra += MomondoEditions.map(function(obj, i) {
        return '<a href="' + MomondoCreateUrl(obj.host) + '" target="_blank">' + obj.name + '</a>';
    }).join('<br/>');
    MomondoExtra += '</span></span>';
    if (mptUsersettings["enableInlinemode"] == 1) {
        printUrlInline(MomondoUrl, "Momondo", "", null, MomondoExtra);
    } else {
        printUrl(MomondoUrl, "Momondo", "", MomondoExtra);
    }
}
function getMomondoCabin(cabin) {
    // not working... i didn't get how to get cabin from itin so far
    // 0 = Economy; 1=Premium Economy; 2=Business; 3=First
    // Booking classes on Momondo &TK=ECO|&TK=FLX|&TK=BIZ|&TK=FST
    switch (cabin) {
        case 0:
            cabin = "ECO";
            break;
        case 1:
            cabin = "FLX";
            break;
        case 2:
            cabin = "BIZ";
            break;
        case 3:
            cabin = "FST";
            break;
        default:
            cabin = "ECO";
    }
    return cabin;
}
function printKayak(method) {
    //example https://www.Kayak.ru/flights/MOW-CPH...OW/2016-05-20/
    // pax: #adults
    // method: 0 = based on leg; 1 = based on segment
    var KayakEditions = [{name:"Kayak.com",host:"Kayak.com"},{name:"Kayak.de",host:"Kayak.de"},{name:"Kayak.it",host:"Kayak.it"},{name:"Kayak.es",host:"Kayak.es"},{name:"Kayak.co.uk",host:"Kayak.co.uk"},{name:"Kayak.dk",host: "Kayak.dk"},{name:"Kayak.mx",host:"Kayak.mx"},{name:"Kayak.fi",host:"Kayak.fi"},{name:"Kayak.fr",host:"Kayak.fr"},{name:"Kayak.no",host:"Kayak.no"},{name:"Kayak.nl",host:"Kayak.nl"},{name:"Kayak.pt",host:"Kayak.pt"},{name:"Kayak.se",host:"Kayak.se"}, {name:"Kayak.ru",host:"Kayak.ru"}];
    var KayakCreateUrl = function(host) {
        var KayakUrl = 'https://www.' + host + '/flights';
        var segsize = 0;
        for (var i = 0; i < currentItin["itin"].length; i++) {
            if (method != 1) {
                KayakUrl += '/' + currentItin["itin"][i]["orig"];
                KayakUrl += '-' + currentItin["itin"][i]["dest"];
                KayakUrl += '/' + currentItin['itin'][i]['dep']['year'] + '-' + ('0' + currentItin['itin'][i]['dep']['month']).slice(-2) + '-' + ('0' + currentItin['itin'][i]['dep']['day']).slice(-2);
                segsize++;
            }
            for (var j = 0; j < currentItin["itin"][i]["seg"].length; j++) {
                if (method == 1) {
                    var k = 0;
                    // lets have a look if we need to skip segments - Flightnumber has to be the same and it must be just a layover
                    while ((j + k) < currentItin["itin"][i]["seg"].length - 1) {
                        if (currentItin["itin"][i]["seg"][j + k]["fnr"] != currentItin["itin"][i]["seg"][j + k + 1]["fnr"] ||
                            currentItin["itin"][i]["seg"][j + k]["layoverduration"] >= 1440) break;
                        k++;
                    }
                    KayakUrl += '/' + currentItin["itin"][i]["seg"][j]["orig"];
                    KayakUrl += '-' + currentItin["itin"][i]["seg"][j + k]["dest"];
                    KayakUrl += '/' + currentItin['itin'][i]['seg'][j]['dep']['year'] + '-' + ('0' + currentItin['itin'][i]['seg'][j]['dep']['month']).slice(-2) + '-' + ('0' + currentItin['itin'][i]['seg'][j]['dep']['day']).slice(-2);
                    j += k;
                    segsize++;
                }
            }
        }
        if(currentItin['numPax']>1){
          KayakUrl += '/' + currentItin['numPax'] + 'adults'; 
        }
        if (method == 1) {
            if (mptUsersettings["language"] == "de") {
                desc = "Benutze " + segsize + " Segment(e)";
            } else {
                desc = "Based on " + segsize + " segment(s)";
            }
        } else {
            if (segsize == 1) {
                return false;
            }
            if (mptUsersettings["language"] == "de") {
                desc = "Benutze " + segsize + " Abschnitt(e)";
            } else {
                desc = "Based on " + segsize + " segment(s)";
            }
        }
        return KayakUrl;
    };
    var KayakUrl = KayakCreateUrl("Kayak.com");
    if (!KayakUrl){
      return false;
    }
    var KayakExtra = ' <span class="pt-hover-container">[+]<span class="pt-hover-menu">';
    KayakExtra += KayakEditions.map(function(obj, i) {
        return '<a href="' + KayakCreateUrl(obj.host) + '" target="_blank">' + obj.name + '</a>';
    }).join('<br/>');
    KayakExtra += '</span></span>';
    if (mptUsersettings["enableInlinemode"] == 1) {
        printUrlInline(KayakUrl, "Kayak", desc, null, KayakExtra);
    } else {
        printUrl(KayakUrl, "Kayak", desc, KayakExtra);
    }
}
function printSkyscanner() {
    //example https://www.skyscanner.ru/transport/d/stoc/2017-09-02/akl/akl/2017-09-16/stoc/akl/2017-09-29/syd?adults=1&children=0&adultsv2=1&childrenv2=&infants=0&cabinclass=economy&ref=day-view#results  
    var SkyscannerEditions = [{name:"Skyscanner.com",host:"Skyscanner.com"},{name:"Skyscanner.de",host:"Skyscanner.de"},{name:"Skyscanner.it",host:"Skyscanner.it"},{name:"Skyscanner.es",host:"Skyscanner.es"},{name:"Skyscanner.co.uk",host:"Skyscanner.co.uk"},{name:"Skyscanner.dk",host:"Skyscanner.dk"},{name:"Skyscanner.mx",host:"Skyscanner.mx"},{name:"Skyscanner.fi",host:"Skyscanner.fi"},{name:"Skyscanner.fr",host:"Skyscanner.fr"}, {name:"Skyscanner.no",host:"Skyscanner.no"},{name:"Skyscanner.nl",host:"Skyscanner.nl"},{name:"Skyscanner.pt",host: "Skyscanner.pt"},{name:"Skyscanner.se",host:"Skyscanner.se" },{name:"Skyscanner.ru",host:"Skyscanner.ru"}];
    var SkyscannerCreateUrl = function(host) {
        var SkyscannerUrl = 'http://www.' + host + '/transport/d/';
        var seg = 0;
        for (var i = 0; i < currentItin['itin'].length; i++) {
            SkyscannerUrl += '/' + currentItin['itin'][i]['orig'];
            SkyscannerUrl += '/' + ('0' + currentItin['itin'][i]['dep']['day']).slice(-2) + '-' + ('0' + currentItin['itin'][i]['dep']['month']).slice(-2) + '-' + currentItin['itin'][i]['dep']['year'];
			SkyscannerUrl += '/' + currentItin['itin'][i]['dest'];
            seg++;
        }
        //SkyscannerUrl += '&AD=' + currentItin['numPax'] + '&TK=' + getSkyscannerCabin(currentItin['itin']['cabin']);
		SkyscannerUrl += '?adults=' + currentItin['numPax'] + '&ref=day-view#results';
        return SkyscannerUrl;
    };
    var SkyscannerUrl = SkyscannerCreateUrl("Skyscanner.com");
    var SkyscannerExtra = ' <span class="pt-hover-container">[+]<span class="pt-hover-menu">';
    SkyscannerExtra += SkyscannerEditions.map(function(obj, i) {
        return '<a href="' + SkyscannerCreateUrl(obj.host) + '" target="_blank">' + obj.name + '</a>';
    }).join('<br/>');
    SkyscannerExtra += '</span></span>';
    if (mptUsersettings["enableInlinemode"] == 1) {
        printUrlInline(SkyscannerUrl, "Skyscanner", "", null, SkyscannerExtra);
    } else {
        printUrl(SkyscannerUrl, "Skyscanner", "", SkyscannerExtra);
    }
}

function printFarefreaks (method){
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
    for (var i=0;i<currentItin["itin"].length;i++) {
        if (method!=1){
          farefreaksurl += "&orig["+segsize+"]=" + currentItin["itin"][i]["orig"];
          farefreaksurl += "&dest["+segsize+"]=" + currentItin["itin"][i]["dest"];
          farefreaksurl += "&date["+segsize+"]="+currentItin["itin"][i]["dep"]["year"].toString() + "-" + currentItin["itin"][i]["dep"]["month"] + "-" + currentItin["itin"][i]["dep"]["day"] + "_"+currentItin["itin"][i]["dep"]["time"]+":00";
          farefreaksurl += "&validtime["+segsize+"]=1";
          segsize++; 
        } 
       for (var j=0;j<currentItin["itin"][i]["seg"].length;j++) {
        if (method==1){
          var k=0;
          // lets have a look if we need to skip segments - Flightnumber has to be the same and it must be just a layover
          while ((j+k)<currentItin["itin"][i]["seg"].length-1){
          if (currentItin["itin"][i]["seg"][j+k]["fnr"] != currentItin["itin"][i]["seg"][j+k+1]["fnr"] || 
                   currentItin["itin"][i]["seg"][j+k]["layoverduration"] >= 1440) break;
                 k++;
          }
          farefreaksurl += "&orig["+segsize+"]=" + currentItin["itin"][i]["seg"][j]["orig"];
          farefreaksurl += "&dest["+segsize+"]=" + currentItin["itin"][i]["seg"][j+k]["dest"];
          farefreaksurl += "&date["+segsize+"]="+currentItin["itin"][i]["seg"][j]["dep"]["year"].toString() + "-" + currentItin["itin"][i]["seg"][j]["dep"]["month"] + "-" + currentItin["itin"][i]["seg"][j]["dep"]["day"] + "_"+currentItin["itin"][i]["seg"][j]["dep"]["time"]+":00";
          farefreaksurl += "&validtime["+segsize+"]=1";
          segsize++;
          j+=k;  
        }         
        if (currentItin["itin"][i]["seg"][j]["cabin"]<mincabin){mincabin=currentItin["itin"][i]["seg"][j]["cabin"];};  
        if (!inArray(currentItin["itin"][i]["seg"][j]["carrier"],carrieruarray)){carrieruarray.push(currentItin["itin"][i]["seg"][j]["carrier"]);};  
      }
    }
    var pax=validatePaxcount({maxPaxcount:9, countInf:true, childAsAdult:18, sepInfSeat:true, childMinAge:2});
    if (pax===false){
      printNotification("Error: Failed to validate Passengers in printFareFreaks");
      return false;
    }  
    farefreaksurl += "&adult="+pax.adults;  
    farefreaksurl += "&cabin="+(mptSettings["cabin"]==="Auto" ? mincabin:getForcedCabin());
    farefreaksurl += "&flexible=0";
    farefreaksurl += "&child="+(pax.infLap+pax.infSeat+pax.children.length);
    for (i=0;i<pax.infLap;i++){
       farefreaksurl += "&childage[]=0";
    }
    for (i=0;i<pax.infSeat;i++){
       farefreaksurl += "&childage[]=1";
    }   
    for (i=0;i<pax.children.length;i++){
       farefreaksurl += "&childage[]="+pax.children[i];
    } 
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

function printGCM (){
    var url = '';
    // Build multi-city search based on segments
    // Keeping continous path as long as possible 
    for (var i=0;i<currentItin["itin"].length;i++) {
      for (var j=0;j<currentItin["itin"][i]["seg"].length;j++) {
        url+=currentItin["itin"][i]["seg"][j]["orig"]+"-";
        if (j+1<currentItin["itin"][i]["seg"].length){
          if (currentItin["itin"][i]["seg"][j]["dest"] != currentItin["itin"][i]["seg"][(j+1)]["orig"]){url+=currentItin["itin"][i]["seg"][j]["dest"]+";";};
        } else {
         url+=currentItin["itin"][i]["seg"][j]["dest"]+";";
        }    
      }
    }
  if (mptUsersettings["enableInlinemode"]==1){
      printImageInline('http://www.gcmap.com/map?MR=900&MX=182x182&PM=*&P='+url, 'http://www.gcmap.com/mapui?P='+url);
  } else {
      printUrl("http://www.gcmap.com/mapui?P="+url,"GCM","");
  }
}
function getForcedCabin(){
  switch (mptSettings["cabin"]){
       case "Y":
        return 0;
          break;     
       case "Y+":
        return 1;
          break;       
       case "C":
        return 2;
          break;
       case "F":
        return 3;
          break; 
       default:
        return 0;
  }
}
function bindSeatguru(){
  for (var i=0;i<currentItin["itin"].length;i++) {
  // walks each leg      
    for (var j=0;j<currentItin["itin"][i]["seg"].length;j++) {
       //walks each segment of leg
             var k=0;
             // lets have a look if we need to skip segments - Flightnumber has to be the same and it must be just a layover
             while ((j+k)<currentItin["itin"][i]["seg"].length-1){
                 if (currentItin["itin"][i]["seg"][j+k]["fnr"] != currentItin["itin"][i]["seg"][j+k+1]["fnr"] || 
                     currentItin["itin"][i]["seg"][j+k]["layoverduration"] >= 1440) break;
                 k++;
                }  
         // build the search to identify flight:
          var target = findItinTarget((i+1),(j+1),"plane");
          if (target===false) {
            printNotification("Error: Could not find target in bindSeatguru");
            return false;
          } else {
            var url='http://www.seatguru.com/findseatmap/findseatmap.php?carrier='+currentItin['itin'][i]['seg'][j]['carrier']+'&flightno='+currentItin['itin'][i]['seg'][j]['fnr']+'&date='+('0'+currentItin['itin'][i]['seg'][j]['dep']['month']).slice(-2)+'%2F'+('0'+currentItin['itin'][i]['seg'][j]['dep']['day']).slice(-2)+'%2F'+currentItin['itin'][i]['seg'][j]['dep']['year']+'&from_loc='+currentItin['itin'][i]['seg'][j]['orig'];
            target.children[0].innerHTML='<a href="'+url+'" target="_blank" style="text-decoration:none;color:black">'+target.children[0].innerHTML+"</a>";
          }
        j+=k;
      }
   }  
}
function bindPlanefinder(){
  for (var i=0;i<currentItin["itin"].length;i++) {
  // walks each leg      
    for (var j=0;j<currentItin["itin"][i]["seg"].length;j++) {
       //walks each segment of leg
             var k=0;
             // lets have a look if we need to skip segments - Flightnumber has to be the same and it must be just a layover
             while ((j+k)<currentItin["itin"][i]["seg"].length-1){
                 if (currentItin["itin"][i]["seg"][j+k]["fnr"] != currentItin["itin"][i]["seg"][j+k+1]["fnr"] || 
                     currentItin["itin"][i]["seg"][j+k]["layoverduration"] >= 1440) break;
                 k++;
                }  
         // build the search to identify flight:
          var target = findItinTarget((i+1),(j+1),"flight");
          if (target===false) {
            printNotification("Error: Could not find target in bindPlanefinder");
            return false;
          } else {
            var url='http://www.planefinder.net/data/flight/'+currentItin['itin'][i]['seg'][j]['carrier']+currentItin['itin'][i]['seg'][j]['fnr'];
            target.children[0].innerHTML='<a href="'+url+'" target="_blank" style="text-decoration:none;color:black">'+target.children[0].innerHTML+"</a>";
          }
        j+=k;
      }
   }  
}

function createFareFreaksContainer(){
  // create links & container
  var printtarget= findtarget(classSettings["resultpage"]["itin"],1);
  var content = '<div>Itinerary';
  content += '<div style="display:inline-block;margin-left:20px;color: #000;font-size: smaller;" class="ff-links">';  
    content += '<div style="display:inline-block;"><label id="ff-createroutingcodes" style="cursor:pointer;">Routing Codes</label></div>';
    content += '<div style="display:inline-block;margin-left:20px"><label id="ff-createflightplan" style="cursor:pointer;">Flight Manager</label></div>';
  content += '</div>';
  content += '<div style="color: #000;font-size: smaller;" class="ff-plancontainer">'; 
    content += '<div id="ff-flightplanoutput" class="invis" style="display: none;margin-top:2px"><input id="ff-flightplanlinkinput" type="text" style="width:600px"> <a id="ff-flightplanlinklink" href="" target="_blank" style="margin-left:20px">Open</a> <label id="ff-closeflightplancontainer" style="cursor:pointer;margin-left:15px">Close</label></div></td>'; 
  content += '</div>';
  printtarget.innerHTML=content;
  // build routing codes container
  var div = document.createElement('div');
  div.setAttribute('id', 'ff-routingcodescontainer');
  div.setAttribute('class', 'invis');
  div.setAttribute('style', 'display: none;border-bottom: 1px dashed grey;');
  content = '<div style="display:inline-block; width:85%" id="ff-routingcodesoutput"></div>'; 
  content += '<div style="display:inline-block; width:14%;text-align:center;"><label id="ff-closeroutingcodescontainer" style="cursor:pointer">Close</label></div>';
  div.innerHTML=content;
  document.getElementById("contentwrapper").parentNode.insertBefore(div, document.getElementById("contentwrapper"));
  // bind
  document.getElementById('ff-createflightplan').onclick=function(){
     if (document.getElementById('ff-flightplanlinkinput').value==""){
       document.getElementById('ff-flightplanlinkinput').value="Loading... Please wait..";
       createFareFreaksPlanlink(); 
     }
     toggleVis(document.getElementById("ff-flightplanoutput"));
   };
  document.getElementById('ff-closeflightplancontainer').onclick=function(){ toggleVis(document.getElementById("ff-flightplanoutput"));};
  document.getElementById('ff-createroutingcodes').onclick=function(){
     if (document.getElementById('ff-routingcodesoutput').innerHTML==""){
       document.getElementById('ff-routingcodesoutput').innerHTML="Loading... Please wait..";
       getFareFreaksRoutingcodes();
     }
     toggleVis(document.getElementById("ff-routingcodescontainer"));
   };
  document.getElementById('ff-closeroutingcodescontainer').onclick=function(){ toggleVis(document.getElementById("ff-routingcodescontainer"));};  
}

function getFareFreaksPlan(){
   function formatDuration(dur){
     var hours   = Math.floor(dur / 60);
     var minutes = Math.floor(dur - (hours * 60));
     return hours+'h '+minutes+'m';
  }
  var plan=new Array();
  var cabins = ['Economy', 'Premium Economy', 'Business', 'First'];  
  for (var i=0;i<currentItin["itin"].length;i++) {
  // walks each leg
  var leg = new Array(); 
    for (var j=0;j<currentItin["itin"][i]["seg"].length;j++) {
       //walks each segment of leg
         var temp= new Object();
         var k=0;
         // lets have a look if we need to skip segments - Flightnumber has to be the same and it must be just a layover
         while ((j+k)<currentItin["itin"][i]["seg"].length-1){
            if (currentItin["itin"][i]["seg"][j+k]["fnr"] != currentItin["itin"][i]["seg"][j+k+1]["fnr"] || 
                currentItin["itin"][i]["seg"][j+k]["layoverduration"] >= 1440) break;
             k++;
         }
         temp.aircraft = currentItin["itin"][i]["seg"][j]["aircraft"].replace(/\s*\(.*?\)s*/g, "");
         temp.airline = currentItin["itin"][i]["seg"][j]["carrier"];
         temp.arrdate = currentItin["itin"][i]["seg"][j+k]["arr"]["year"]+"-"+("0"+currentItin["itin"][i]["seg"][j+k]["arr"]["month"]).slice(-2)+"-"+("0"+currentItin["itin"][i]["seg"][j+k]["arr"]["day"]).slice(-2);
         temp.arrtime = ("00"+currentItin["itin"][i]["seg"][j+k]["arr"]["time"]).slice(-5);
         temp.bc = currentItin["itin"][i]["seg"][j]["bookingclass"];
         temp.cabinReal = cabins[currentItin["itin"][i]["seg"][j]["cabin"]];
         temp.cabin = currentItin["itin"][i]["seg"][j]["cabin"];
         temp.codeshare = currentItin["itin"][i]["seg"][j]["codeshare"];
         temp.depdate = currentItin["itin"][i]["seg"][j]["dep"]["year"]+"-"+("0"+currentItin["itin"][i]["seg"][j]["dep"]["month"]).slice(-2)+"-"+("0"+currentItin["itin"][i]["seg"][j]["dep"]["day"]).slice(-2);
         temp.deptime = ("00"+currentItin["itin"][i]["seg"][j]["dep"]["time"]).slice(-5);      
         temp.dest = currentItin["itin"][i]["seg"][j+k]["dest"]; 
         temp.orig = currentItin["itin"][i]["seg"][j]["orig"]; 
         temp.duration = formatDuration(currentItin["itin"][i]["seg"][j]["duration"]);
         temp.farebase = currentItin["itin"][i]["seg"][j]["farebase"];
         temp.farecarrier = currentItin["itin"][i]["seg"][j]["farecarrier"];
         temp.fnr = currentItin["itin"][i]["seg"][j]["fnr"];
         // attach stops
         if (k>0) {
           temp.stops=new Array();
           var combinedduration = currentItin["itin"][i]["seg"][j]["duration"];
         }      
         for (var l=0;l<k;l++) {
           var tmpstop=new Object();
           tmpstop.apt =currentItin["itin"][i]["seg"][j+l]["dest"];
           tmpstop.arrdate = currentItin["itin"][i]["seg"][j+l]["arr"]["year"]+"-"+("0"+currentItin["itin"][i]["seg"][j+l]["arr"]["month"]).slice(-2)+"-"+("0"+currentItin["itin"][i]["seg"][j+l]["arr"]["day"]).slice(-2);
           tmpstop.arrtime = ("00"+currentItin["itin"][i]["seg"][j+l]["arr"]["time"]).slice(-5); 
           tmpstop.depdate = currentItin["itin"][i]["seg"][(j+l+1)]["dep"]["year"]+"-"+("0"+currentItin["itin"][i]["seg"][(j+l+1)]["dep"]["month"]).slice(-2)+"-"+("0"+currentItin["itin"][i]["seg"][(j+l+1)]["dep"]["day"]).slice(-2);
           tmpstop.deptime = ("00"+currentItin["itin"][i]["seg"][(j+l+1)]["dep"]["time"]).slice(-5);
           tmpstop.duration = formatDuration(currentItin["itin"][i]["seg"][j+l]["layoverduration"]);
           combinedduration+=currentItin["itin"][i]["seg"][j+l]["layoverduration"];
           combinedduration+=currentItin["itin"][i]["seg"][j+l+1]["duration"];
           temp.stops.push(tmpstop);
         }
         if (k>0) {temp.duration = formatDuration(combinedduration);}
         j+=k;
         leg.push(temp);
      }
   plan.push({segs:leg}); 
   }
  return plan;
}

function getFareFreaksRoutingcodes(){
  var options = {};
  options.mode="post";
  options.headers=[{name:'Accept', val:'application/json;charset=UTF-8'}, {name:'Content-Type', val:'application/x-www-form-urlencoded'}];
  options.data="data="+JSON.stringify({action:"creatematrix",plan:getFareFreaksPlan(),type:"matrix",mci_autofocus:1,mci_bcfromfare:1,mci_carriersleg:1,mci_carriersseg:1,mci_fnr:1,mci_inclbc:1,mci_inclcontime:1,mci_inclfare:1}); 
  doHttpRequest("https://www.farefreaks.com/flightmanager/ajax/planhandler.php",options,function(xmlHttpObject) {
     var response=false;
     if (typeof(JSON) !== "undefined"){
       try {
          response = JSON.parse(xmlHttpObject.responseText);
        } catch (e){
          response=false;
        }
     } else {
       // do not(!) use eval here :-/
       printNotification("Error: Failed saving plan - Browser not supporting JSON");
       return false;
     }     
     if (typeof(response) !== "object"){
      printNotification("Error: Failed getting routing codes");
      return false;
     }
     if (response["success"]===undefined || response["type"]===undefined || response["data"]===undefined ){
      printNotification("Error: routing codes data format");
      return false;
     }
     if (response["success"]!=="1"){
      printNotification("Error: "+response["error"]+" while retrieving routing codes");
      return false; 
     } else {
       var div = document.createElement('div');
       for (var i = 0; i < response["data"].length; i++){
         var input = document.createElement('input');
         input.setAttribute('type','text');
         input.setAttribute('style','width:100%;margin: 2px');
         input.setAttribute('value',response["data"][i]);
         div.appendChild(input);
       }
       document.getElementById('ff-routingcodesoutput').innerHTML="";
       document.getElementById('ff-routingcodesoutput').appendChild(div);
     }
    });   
}

function createFareFreaksPlanlink(){
  var options = {};
  options.mode="post";
  options.headers=[{name:'Accept', val:'application/json;charset=UTF-8'}, {name:'Content-Type', val:'application/x-www-form-urlencoded'}];
  options.data="data="+JSON.stringify({action:"createplan",plan:getFareFreaksPlan(),type:"matrix"});  
  doHttpRequest("https://www.farefreaks.com/flightmanager/ajax/planhandler.php",options,function(xmlHttpObject) {
     var response=false;
     if (typeof(JSON) !== "undefined"){
       try {
          response = JSON.parse(xmlHttpObject.responseText);
        } catch (e){
          response=false;
        }
     } else {
       // do not(!) use eval here :-/
       printNotification("Error: Failed saving plan - Browser not supporting JSON");
       return false;
     }     
     if (typeof(response) !== "object"){
      printNotification("Error: Failed saving plan");
      return false;
     }
     if (response["success"]===undefined || response["id"]===undefined || response["url"]===undefined ){
      printNotification("Error: wrong plan data format");
      return false;
     }
     if (response["success"]!=="1"){
      printNotification("Error: "+response["error"]+" while retrieving flight plan");
      return false; 
     } else {
       document.getElementById('ff-flightplanlinkinput').value = response["url"];
       document.getElementById('ff-flightplanlinklink').href = response["url"];
     }
    });   
}

function resolveTimezones(){
  var options = {};
  document.getElementById('timezone-container').style.display = 'inline';
  options.mode="post";
  options.headers=[{name:'Accept', val:'application/json;charset=UTF-8'}, {name:'Content-Type', val:'application/x-www-form-urlencoded'}];
  options.data="data="+JSON.stringify({action:"resolvetimezones",plan:getTimezoneData("small"),type:"matrix"});  
  doHttpRequest("https://www.farefreaks.com/ajax/timezone.php",options,function(xmlHttpObject) {
     var response=false;
     document.getElementById('timezone-container').style.display = 'none';
     if (typeof(JSON) !== "undefined"){
       try {
          response = JSON.parse(xmlHttpObject.responseText);
        } catch (e){
          response=false;
        }
     } else {
       // do not(!) use eval here :-/
       printNotification("Error: Failed retrieving timezones - Browser not supporting JSON");
       return false;
     }     
     if (typeof(response) !== "object"){
      printNotification("Error: Failed retrieving timezones");
      return false;
     }
     if (response["success"]===undefined || response["data"]===undefined){
      printNotification("Error: Failed retrieving timezones - wrong plan data format");
      return false;
     }
     if (response["success"]!=="1"){
      printNotification("Error: "+response["error"]+" while retrieving timezone data");
      return false; 
     } else {
       for (var i=0;i<currentItin["itin"].length;i++) {
        // walks each leg
          currentItin["itin"][i]["dep"]["offset"]=response["data"][i][0]["depoffset"];
          for (var j=0;j<currentItin["itin"][i]["seg"].length;j++) {
            // walks each segment of leg
            // validate
            var temp = response["data"][i][j]["depoffset"].match(/^([\+\-]{1}[0-9]{2}:[0-9]{2})$/);
            if(temp===null){
                  printNotification("Error: Failed retrieving timezones - invalid response");
                  return false;
            }
            currentItin["itin"][i]["seg"][j]["dep"]["offset"]=response["data"][i][j]["depoffset"];
            if (typeof(response["data"][i][j]["arroffset"])!=="undefined"){
              // validate
              var temp = response["data"][i][j]["arroffset"].match(/^([\+\-]{1}[0-9]{2}:[0-9]{2})$/);
              if(temp===null){
                    printNotification("Error: Failed retrieving timezones - invalid response");
                    return false;
              }     
              currentItin["itin"][i]["seg"][j]["arr"]["offset"]=response["data"][i][j]["arroffset"];
            }
          }
          if (typeof(response["data"][i][j-1]["arroffset"])!=="undefined"){
            currentItin["itin"][i]["arr"]["offset"]=response["data"][i][j-1]["arroffset"];
          }          
       }
     }
     printLinksContainer();
    });   
}

function printTimezones(){
  var container;
  var extra = '<span id="timezone-container" style="display: none;">&nbsp;<img src="data:image/gif;base64,R0lGODlhIAAgAMQAAKurq/Hx8f39/e3t7enp6Xh4eOHh4d3d3eXl5dXV1Wtra5GRkYqKitHR0bm5ucnJydnZ2bS0tKGhofb29sHBwZmZmZWVlbGxsb29vcXFxfr6+s3NzZ2dnaampmZmZv///yH/C05FVFNDQVBFMi4wAwEAAAAh+QQECgAAACwAAAAAIAAgAAAF/+AnjiR5ecxQrmwrnp6CuTSpHRRQeDyq1qxJA7Ao7noxhwBIMkSK0CMSRVgCEx1odMpjEDRWV0Ji0RqnCodGM5mEV4aOpVy0RBodpHfdbr9HEw5zcwsXBy88Mh8CfH1uKwkVknMOASMnDAYjjI4TGiUaEZKSF5aXFyucbQGPIwajFRyHTAITAbcBnyMPHKMOTIC4rCQOHL0VCcAiGsKmIgDGxj/AAgED184fEtvGutTX4CQd29vetODXJADkEtNMGgTxBO4Y7BDKHxPy8yR4Hf8Z8A1AQBBBNgT//gHQxGQCAgMGCE6wgaEDgIsUsrWABxFilRIHLop8oBEUgQMHOnaWnJBB5IULDxC0CGAAAsqUH1cQcPDyZQQHDQwEEFBrgIEESCHYNDCxhQGeFyL8dICBAoUMDzY0aIA0gc2SJQxQkOqgbNWrD7JuRXoArM4NZamexaqWK1NlGgw8oGoVbdYNBwaYAwbvQIMHWBtAEPoHn+PHj0MAACH5BAQKAAAALAEAAAAeAB8AAAX/4CeOZGme6CiIw0AYwfBpIp2W2nRQ0SUBnQsmQfgcOpNbLRHhVCyMBSPKqAAiEg9DiXBwFpWFxbIomxkFhccjOwkgF8uzEiZTy+m154IyAJx0YBI/ABUSCwUFeh4FNiQDHXQcch1DMAYDEA55iwcmGIYcThEHbSoRnHodKyICBoMSXw4ErCMTDQyLegVFIhMUsBwASSYBHQqKaXkKDqwEAMGeKBsHDg0ZGBsVDhYQNG8SHR0SzUqtH0lJAisaD+IdAAm15jMfAhoa9xTw8Aj0KhMCBhTwCx6AC6boERQ4gSAFABAjJDS3UOC9DBcyRuj1j2AAiwI2ZMx4YJ6SHAFSrDY00iNChAyOzE1IqZKFA5cRHCAwiUIDzZQ2QuZ04OBBAIoxWgwIUIsA0acbiLnxSUDpAKn2EjjAgIEChgcD8pFYN5OAWRdMSwR4QKFtBgoZDhBQmXIAgrtmq8YcMYAt3AeAEyQ4cMCAgcIG8BLAqpZtBsAbNjQQDIGwYcNXeZLQkADwA8mTE1QufADB1X8EIHRusEHw4MJz1/1DF+DF5btXxc7enCPHCs0jQgAAIfkEBAoAAAAsAQABAB8AHgAABf/gJ47kGBBBMH1C6b4j8UTX1QFOBg1wHySXSkVSsQgXwssm0OrFKACJlMMRCi2WBedyaMIEhoh0TMUWsdmFJKHpGWydjrQoAQA4koVez1h7SQQON3EcHRgHAQMEBAkUeXtaBn8fEw92doYGJS0Tb5AMFwEkAgcRlwAUTF8DDhYMehWHCZwZNReook6UGAwMBb8LBSuBNQARCLoiBBi/Cgoe0A0fEBHVFw9tTgeCDM/P0AUCGhvVEQ6augkM0OzsEuIPDvIOPLqdBe3sGZQZ8xm5ySZI+AaORyUHGHIADJiB4AIR4zBQoIBhYTINBwo8u9CkwUSKyJKNguALwwgDFDKfZKAwSyTENhA21KOU8oFNiz0ETNj5QYMXAQls2jywQpe4nTsF/CHQ4MGGDQ0MTJg0CinSSRMOOG3QIIGBANlKaJiQAqlPFxMScE3A9gCKCRrikk1RVgVVEQEgdE0A4cABAwgIKBI8gK6KsC4EBDjAtu9fA4AJFy571skEBAf6Qo68aIDnwyKVBkCwGXLgznZdjhibqLNnuKoTs1BaOVkIACH5BAQKAAAALAEAAQAfAB4AAAX/4CeOpPBN6BCQbOt+AZJkWOTcD/LuwnRkF4Ck05EYKxVAYrUjETYOgBRALBolHIlD1xQgKJFLkGq9cjgVS+eg2REol/A46IhILBU0siJJuAQDGTdyERsHAyoBBxh3ewsSBi0TCTd1ETkTHyYkBhF7aRFMIwiCGDcbAZstAgEOSBZ4DaoCGxS2DhuZTTARsBYLAKIBtrYYBLsjBhwLzBUQmwYUGRkUssgiGg7MzBkjCQ8P1MfXIgkVzAwXmRrf4A+65ATnzB0rkw8bDwnwTQMmEx0YMOOwgt2GBhv2IRMQ5qCEBRYYdDim4UCDiwp3CQCgoICFAgUYMADQRoCBBglSqQ64BsGDSw8dCyyA0IZAypQIVO3QUOAlTJgVugWAkAAChAOieHTw6bObBgNGDxwg0GbXA6ZAdSmSasDAgKo7AvR8WSBCCQIHuhpAMIDfCAECNEywQDYBWBETEKhFgIBAgAlw4WqQO/gCTAupXORd25cAogB/UUj+QEHguD8TCDR2nAiy5AkaBhxCFpoA586fUcAl12MAZ8iwUQzWSU4u7MgaVpN7EVj3rhAAIfkEBAoAAAAsAQAAAB8AHwAABf/gJ47kKJRoqn7aFwTEEGvaua6BkTwU5VCYB2Qwsd1Mhw0l4rg4ARcAwNEYGG8Bpc/hiESeUkkncpgcCbweBuN9dqSdDgewMacEhM0jkwE6+ns+AGJxYhsqAQ0PixkYFAcIEwEaMgkOABwSmhwHVywHD3o8CRMtJRMDGx2aEhUdASUDDQ0begdHiRWZrQ+mLAazswe+KwIUuhwVAAQjARAJ0AmwRyIBABXYHAkjA8/QBp43D9gVCxQnAggQ6xDT1CIGrdgXsBoIB/gGdu8uHRbYr1jcy0eMmrUFFSxIYJbugIGH+95NALDAwoKFH/A8NBCJn4gBEixYDChgwEMECAK1hCvhLoHFBQsu2JnAEUGMlSMIkIwAE+Y5ERoICBUaEcWFAhQmEHhZEYIJGDEGWFEhoIAHBhQo9gQQMWjUAZPCIfBAlkGBcjATeAogFWyAUgKuXCBLtgCDBQwuFMzI1u1buHE1WCWrQEGBBQAQqNDwovFfuBDoElbAwMANDZJeTNgMt4NkuhYs3xCw+XEpBAUUfPaA9B0NzpsfpLarwMJhBkWLCaBBI0CGA1U4Trjl0YQRdEdCAAAh+QQECgAAACwBAAAAHgAgAAAF/+AnjmRpnmiqrqMQGFDzZE9zEBpLasOxbY8ZZYhxPAw51sSQaDSAQgqm6HBsCKvAIdF8BjPEqiMSoRhSWgi3CwRLq+TLxXE2LQ8QNdcwmAhcBg1jcnIOWCQCBAYHjBAGASgID3IAlRkTJC8GizdJKAEPlaIHLYqbBjgsARSiHRhJEwgImwiYOgYAHbodCCIBsrIDOiMZux0NIgMEywS2wxAS0RIYycypwx8D0hIAyQPfAwLYHxrbHd7g4tgaHBzSvuAB6sMD7e3dHwH6+p46CRUV2jkQMWFfAGc6HAAM+ECEBoN+hh3gsLBCHQEFJ2jUMG+EnEwXKkbwpEGjSY4jDHMw8HBhRAAHFiwsTIDI5EaUGBR4YCniwIUFMWM6QPgB40kNBFbu9HAsgoUFUGN2qFPCqAYNDnQu9VAAqlegEmiiEIBU6VauX6F2EJsikdmtXb9GoLpCQNazcRcAaECUxYC3BQBQONBv3IecO1saRvGXJ4sQACH5BAQKAAAALAEAAQAeAB8AAAX/4CeO5CdoU4qaZesKwjQgyGHYxhC4vBkQt0Ni2GhsGgmDoEeSIQxByDBhfFgbu15s9oRChNTNxpqhUBA9zYBAg7qhQ+ujbFa2BGsCG0HQTVBODxR0GBkELQEDinoDfy0oCRgUGBgODxMkaoprARpMH5GVDg4HSyYTAYk6pkwTDaMOERSYHxqpt56fIgEYEb4OBiK2t7S6Ig2+vg0wqLjGIwgRF9OzMSkprMYBDgAXAA4B1tfZuhMYAOgRA+LYz7sOHejg7BPknwEX8d87Kxr2nwYAdBiIAdMSNDBqKWQiIIMECR0kPFgi4MBDDg8kOsDQAEOuFgMiPgRwYESCAgoKp3hI6UFlh5ItJkSwcDFCFhEMPOjc6YHBrBJ4KFjg8FBCgmwPeK5UAGBApgAGMFSoQLTChWIiJihQWqBDkhxCKEioYGEqhw6HWlTYqSAlAw4LInaAu2Dq1A4QeEBgW2DBAgZ//da1u+DC0R5bCxQALLixBQsMJDhA8G/EBQ8SKklgAFlwhQUSIiQIp8tBgw8BDmxw4A2ArwwGOrmjtSTABAI/DLpj+CwEACH5BAQKAAAALAAAAQAfAB8AAAX/4CeOJKlpgqB9Qum+oxYMNGEPwQrDwjTbBATCQDQgBqidyUcbAIfEA+RgCLR2Kl9gVoMaDlJIAjK4vjTabY1AE4Ih4kZiwPOlt5PUaWYQJxpyViU9E4V4OoMTBn8NGw8HEyVohZRmZwaNjhsIJCmUE0lKHxMHD6YPDWYqo4WWSgGnGRQBI7ANLIiiLBAUGbIHIxQFDKm6JQMYFMrFAhEeCgUJkcYiE8oUGA/TCx7dCg6CxrAOGA4PtAEF3d4WtMYTGQ7yFJEP6/fR06/y8hmRHffuMdigy4CDCBEubEChztszBh0wAFOiYcMFhBESfICwTgG0Ag7o6EKQ8MIFBwhSohRYwKDAMAbgXLkIQAEAgAsA6Img8oDDApYLLhCQKUIATZs2IxywFMABg58/AUCI5MoAhg4dkGobhEAC1J8VHDRAwGYABAcSOGAF0MEBARgHJDz9yqGCTQ4WKkiQgLVDBANYIHT4aaFw3sIcOOxd/JcoCYM+C1eYXCGxYr4U3urqkSBC3QWT80qYHGEqtVoGHmDAidDBBs2nO7GagCO2bVEhAAAh+QQECgAAACwAAAEAHwAeAAAF/+AnjuQonGepruWpTVMgB5PG3p8Lz8HgE4OJAEc6wY4xmW9AAE6InwBk8Dryfk0EQXgbWAqOD9K6JCAQBsRTJQhYFB5AraZBCWKDs2FvWI80CQUegww1QysaeXwHBDYjDoKDHgoERAIDeweaAyIaFXCSgxhQAgSaEBAGNhuhoRyOOBMGqKgBHw8VggqgHgV+N6UJwgmVAgZfBbweDVBREMINqjkXDAwFBRYMCh2wNxMJDeEQNgMdDBYLHOEOF90s3xsNGwk2ExIMCwwSth+cUN8PNjxI8GRChwUIFyBoNmLCg4cDC0bAt8ACM4b9KGR4mODQg4QLIrgDlkBjBgoHRq8cqJCwQspmAyjIlMkvCoCK6C74i7XBwcwNh3IkqGDBQoUKDgYEbRGggQMHGBxkMFBiggOjRytEoKpiAoIHESI8ddDglwgEB7Na4OBgyhIIYC9cEOtT6YoDHbJW4EBUwgUHAC4ACDz3AoWFLIwBMMqBg4THjzt0GCw3wuGlKwhgkOAYsuTJgwE4eEAA87sEF4567iAhcIYDXDB+ILAhqoMIGDIkMFBTNokJQWDkwBECACH5BAQKAAAALAAAAQAfAB4AAAX/4CeOo/BN5yesK+m+4uRAFJVdTpVo2sS3MFegoPAUjB6P4tKbOJ3A4CexSFqTBUPTGQhApSqJoniV+J7c7sQEEyQsxKsnIeD1unhv0MCxMI5WBWsqdRN4A4goLhMXDAsLRGQdLiuGiJdsIw2PC35wSRBtE5cEBAGZEwCOjxEQHQoFGlIBBAOlA7IiBxWcFgYfBgsAYAK2pQSKHw8WnBcmAg8DYB8BCNYGA88OFswWDSO5YBMECAYGBLKM3BYcv9MkGuXmCLIBAJ0WEgTv8AgH5gZQpFpQgR0CfiX8HfiHQkOEChArHEAoQoOBAxD+ydJAISKHDZneBYBAEoKBZ28iuwJI9s5AgpcJ9okgAKACB4gJEAaA+TLAiAkUOHCQUEHfuwkQGihtcCCcAAIShkqwcEGLlAkJHmzYoFSaiwdFJXSQECEmyx4EHlB4wPbBgZAxIkiVIAEABabkECR1YCMD2wQ+YQxwMLaD4Q4XIkSgEAHD4hoZMmzw2oYABbEdAGgGcCGxAwcYMNTYEBhMgAYRMmvurPgz3ww7KCLY4CAx5wgXMDh4EJOiiBUDDijV2iABNpa+K/o4hQKuixAAOw==" style="width: 1em; height: 1em;"></span>';
  if (mptUsersettings["enableInlinemode"]==1){
      printUrlInline('javascript: void(0);', 'Resolve Timezones', '', 1, extra);
      container = getSidebarContainer(1);
  } else {
      printUrl('javascript: void(0);', 'Resolve Timezones', '', extra);
      container = document.getElementById('powertoolslinkcontainer');
  } 
  var links = container.getElementsByTagName('a');
  var link = links[0];
  link.innerHTML = 'Resolve Timezones';
  link.target = '_self';
  link.style='color:black';
}

function getTimezoneData(mode){
  var plan=new Array(); 
  for (var i=0;i<currentItin["itin"].length;i++) {
  // walks each leg
  var leg = new Array(); 
    for (var j=0;j<currentItin["itin"][i]["seg"].length;j++) {
       //walks each segment of leg
         var temp= new Object();
         temp.orig = currentItin["itin"][i]["seg"][j]["orig"];
         temp.depdatetime = currentItin["itin"][i]["seg"][j]["dep"]["year"]+"-"+("0"+currentItin["itin"][i]["seg"][j]["dep"]["month"]).slice(-2)+"-"+("0"+currentItin["itin"][i]["seg"][j]["dep"]["day"]).slice(-2)+"T"+("00"+currentItin["itin"][i]["seg"][j]["dep"]["time"]).slice(-5);
         if(mode==="full"){
           temp.dest = currentItin["itin"][i]["seg"][j]["dest"];
           temp.arrdatetime = currentItin["itin"][i]["seg"][j]["arr"]["year"]+"-"+("0"+currentItin["itin"][i]["seg"][j]["arr"]["month"]).slice(-2)+"-"+("0"+currentItin["itin"][i]["seg"][j]["arr"]["day"]).slice(-2)+"T"+("00"+currentItin["itin"][i]["seg"][j]["arr"]["time"]).slice(-5);          
         }
         leg.push(temp);
      }
   plan.push({segs:leg}); 
   }
  return plan;
}

function openWheretocredit(link) {
  var container = document.getElementById('wheretocredit-container');
  container.style.display = 'inline';
  
  var itin = {
    ticketingCarrier: currentItin.carriers.length == 1 ? currentItin.carriers[0] : null,
    baseFareUSD: currentItin.basefares + currentItin.surcharges,
    segments: []
  };
  for (var i = 0; i < currentItin.itin.length; i++) {
    for (var j = 0; j < currentItin.itin[i].seg.length; j++) {
      itin.segments.push({
        origin: currentItin.itin[i].seg[j].orig,
        destination: currentItin.itin[i].seg[j].dest,
        departure: new Date(currentItin.itin[i].seg[j].dep.year, currentItin.itin[i].seg[j].dep.month, currentItin.itin[i].seg[j].dep.day),
        carrier: currentItin.itin[i].seg[j].carrier,
        bookingClass: currentItin.itin[i].seg[j].bookingclass,
        codeshare: currentItin.itin[i].seg[j].codeshare,
        flightNumber: currentItin.itin[i].seg[j].fnr,
      });
    }
  }
  
  var xhr = new XMLHttpRequest();
  xhr.open('POST', '//www.wheretocredit.com/api/beta/calculate');
  xhr.setRequestHeader('Accept', 'application/json;charset=UTF-8');
  xhr.setRequestHeader('Content-Type', 'application/json;charset=UTF-8');
  xhr.onreadystatechange = function() {
    if (xhr.readyState === 4) {
      link.href = '//www.wheretocredit.com';
      link.target = '_blank';
      link.innerHTML = 'Data provided by wheretocredit.com';

      var data, result, temp;
      try {
        data = JSON.parse(xhr.responseText);
      } catch (e) {
        data = xhr.responseText;
      }
      
      if (xhr.status === 200 && data && data.success && data.value && data.value.length && data.value[0].success) {
          data.value[0].value.totals.sort(function (a, b) {
            if (a.value === b.value) {
              return +(a.name > b.name) || +(a.name === b.name) - 1;
            }
            return b.value - a.value; // desc
          });
          
         result = document.createElement("div");
         temp = data.value[0].value.totals.map(function (seg, i) { return parseInt(seg.value).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") + ' ' + seg.name + ' miles'; });
         for (var i = 0 ; i<temp.length;i++){
           result.appendChild(document.createTextNode(temp[i])); 
           result.appendChild(document.createElement("br"));
         }
         result.removeChild(result.lastChild);
      }
      else {
        result = data.errorMessage || data || 'API quota exceeded :-/';
        result = document.createTextNode(result);
      }
      container.style.display = 'block';
      container.innerHTML ="";
      container.appendChild(result);
    }
  };
  xhr.send(JSON.stringify([itin]));
}

function printWheretocredit() {
  var extra = '<span id="wheretocredit-container" style="display: none;">&nbsp;<img src="data:image/gif;base64,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" style="width: 1em; height: 1em;"></span>';
  
  var container;
  if (mptUsersettings["enableInlinemode"]==1){
      printUrlInline('javascript: void(0);', 'wheretocredit.com', '', 1, extra);
      container = getSidebarContainer(1);
  } else {
      printUrl('javascript: void(0);', 'wheretocredit.com', '', extra);
      container = document.getElementById('powertoolslinkcontainer');
  }
  
  var links = container.getElementsByTagName('a');
  var link = links[links.length - 1];
  link.target = '_self';
  link.innerHTML = 'Calculate miles with wheretocredit.com';
}

function bindWheretocredit(){
  for (var i=0;i<currentItin["itin"].length;i++) {
  // walks each leg      
    for (var j=0;j<currentItin["itin"][i]["seg"].length;j++) {
       //walks each segment of leg
          var target = findItinTarget((i+1),(j+1),"cabin");
          if (target===false) {
            printNotification("Error: Could not find target in bindWheretocredit");
            return false;
          } else {
            var url='http://www.wheretocredit.com/'+currentItin['itin'][i]['seg'][j]['carrier'].toLowerCase()+'/'+currentItin['itin'][i]['seg'][j]['bookingclass'].toLowerCase();
            target.children[0].innerHTML= target.children[0].innerHTML.replace(/<a.*?\/a>/,'('+currentItin['itin'][i]['seg'][j]['bookingclass']+')').replace('('+currentItin['itin'][i]['seg'][j]['bookingclass']+')','<a href="'+url+'" target="_blank" style="text-decoration:none;color:black">('+currentItin['itin'][i]['seg'][j]['bookingclass']+")</a>");        
          }
      }
   }  
}

function bindLinkClicks(){
  var container;
  var linkid=0;
  if (mptUsersettings["enableInlinemode"]==1){
      container = getSidebarContainer(1);
  } else {
      container = document.getElementById('powertoolslinkcontainer');
  } 
  var links = container.getElementsByTagName('a');
  if (typeof(currentItin["itin"][0]["dep"]["offset"])==="undefined") {
    links[linkid].onclick=function () {
      resolveTimezones();
    };
    linkid++;
  }
  if (mptUsersettings["enableInlinemode"]!=1){
      linkid = links.length - 1;
  }  
  links[linkid].onclick = function () {
     links[linkid].onclick = null;
     openWheretocredit(links[linkid]);
  };
}

// Inline Stuff
function printUrlInline(url,text,desc,nth,extra){
  var otext = '<a href="'+url+ '" target="_blank">';
  var valid=false;
  if (translations[mptUsersettings["language"]] !== undefined) {
    if (translations[mptUsersettings["language"]]["openwith"] !== undefined) {
      otext += translations[mptUsersettings["language"]]["openwith"];
      valid=true;
    }
  }
  otext+=(valid===false ? "Open with":"");
  otext+=' '+text+'</a>' + (extra||''); 
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
function printUrl(url,name,desc,extra) {
    if (document.getElementById('powertoolslinkcontainer')==undefined){
    createUrlContainer();
    }
  var text = '<div style="margin:5px 0px 10px 0px"><label style="font-size:'+Number(mptUsersettings["linkFontsize"])+'%;font-weight:600"><a href="'+url+'" target=_blank>';
  var valid=false;
  if (translations[mptUsersettings["language"]] !== undefined) {
    if (translations[mptUsersettings["language"]]["use"] !== undefined) {
      text += translations[mptUsersettings["language"]]["use"];
      valid=true;
    }
  }
  text+=(valid===false ? "Use ":"");
  text+=" "+name+"</a></label>"+(extra||'')+(desc ? '<br><label style="font-size:'+(Number(mptUsersettings["linkFontsize"])-15)+'%">('+desc+")</label>" : "")+"</div>";  
  var target = document.getElementById('powertoolslinkcontainer');
  target.innerHTML = target.innerHTML + text;
}
function createUrlContainer(){
  var newdiv = document.createElement('div');
  newdiv.setAttribute('id','powertoolslinkcontainer');
  newdiv.setAttribute('style','margin:15px 0px 0px 10px');
  findtarget(classSettings["resultpage"]["htbContainer"],1).parentNode.parentNode.parentNode.appendChild(newdiv);
}
function printSeperator() {
  var container = document.getElementById('powertoolslinkcontainer') || getSidebarContainer();
  if (container) {
    container.innerHTML = container.innerHTML + (mptUsersettings["enableInlinemode"] ? '<hr class="powertoolsitem"/>' : '<hr/>');
  }
}
function injectCss() {
  var css = '',
    head = document.head || document.getElementsByTagName('head')[0],
    style = document.createElement('style');
  style.type = 'text/css';

  css += '.pt-hover-menu { position:absolute; padding: 8px; background-color: #FFF; border: 1px solid #808080; display:none; }';
  css += '.pt-hover-container:hover .pt-hover-menu { display:inline; }';
    
  if (style.styleSheet){
    style.styleSheet.cssText = css;
  } else {
    style.appendChild(document.createTextNode(css));
  }

  head.appendChild(style);
}
