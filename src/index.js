import mptSettings, { reset } from "./settings/appSettings";
import { loadUserSettings } from "./settings/userSettings";
import classSettings, { findTargetSetVersion } from "./settings/itaSettings";
import { printNotification, findtarget } from "./utils";

import { readItinerary } from "./parse/itin";

import { render, cleanUp } from "./print";
import { createUsersettings } from "./print/settings";
import { bindDarkmode } from "./print/darkmode";

/**************************************** Start Script *****************************************/

// *** DO NOT CHANGE BELOW THIS LINE***/
(async () => {
  await loadUserSettings();
  createUsersettings();
  injectCss();
  bindDarkmode();

  if (window.top === window.self) {
    if (mptSettings.scriptEngine === 0) {
      startScript();
    } else {
      // execute language detection and afterwards functions for current page
      if (typeof window.addEventListener !== "undefined") {
        window.addEventListener("load", () => startScript(), false);
      } else {
        window.onload = () => startScript();
      }
    }
  }
})(); // end async for GM4

function startScript() {
  if (window.location.href !== mptSettings.laststatus) {
    setTimeout(function() {
      reset();
      cleanUp();
      getPageLang();
    }, 0);
    mptSettings.laststatus = window.location.href;
  }
  if (mptSettings.scriptrunning === 1) {
    setTimeout(function() {
      startScript();
    }, 500);
  }
}

/**************************************** Get Language *****************************************/
function getPageLang() {
  if (window.location.href.indexOf("view-details") != -1) {
    setTimeout(function() {
      fePS();
    }, 200);
  } else if (
    window.location.href.indexOf("#search:") != -1 ||
    window.location.href == "https://matrix.itasoftware.com/" ||
    window.location.href == "https://matrix.itasoftware.com/"
  ) {
    setTimeout(function() {
      startPage();
    }, 200);
  }
}
/********************************************* Start page *********************************************/
function startPage() {
  // try to get content
  if (!findTargetSetVersion(settings => settings.startpage.maindiv, 1)) {
    printNotification("Error: Unable to find content on start page.");
    return false;
  } else {
    // apply style-fix
    const target = findtarget(classSettings.startpage.maindiv, 1);
    target.children[0].children[0].children[0].children[0].setAttribute(
      "valign",
      "top"
    );
  }
}
/********************************************* Result page *********************************************/

//Primary function for extracting flight data from ITA/Matrix
function fePS() {
  // try to get content
  const itin = findTargetSetVersion(settings => settings.resultpage.itin, 1);
  if (!itin) {
    printNotification("Error: Unable to find Content on result page.");
    return false;
  }
  // retry if itin not loaded
  if (itin.parentElement.previousElementSibling.style.display != "none") {
    mptSettings.retrycount++;
    if (mptSettings.retrycount > 50) {
      printNotification(
        "Error: Timeout on result page. Content not found after 10s."
      );
      return false;
    }
    setTimeout(function() {
      fePS();
    }, 200);
    return false;
  }
  // do some self-testing to prevent crashing on class-changes
  for (let i in classSettings.resultpage) {
    if (findtarget(classSettings.resultpage[i], 1) === undefined) {
      printNotification(
        "Error: Unable to find class " +
          classSettings.resultpage[i] +
          " for " +
          i +
          "."
      );
      return false;
    }
  }

  readItinerary();
  render();
}

function injectCss() {
  let css = "",
    head = document.head || document.getElementsByTagName("head")[0],
    style = document.createElement("style");
  style.type = "text/css";

  css += `body.dark-mode, body.dark-mode input[type='text'], body.dark-mode input[type='radio'], body.dark-mode textarea, body.dark-mode select, body.dark-mode button, body.dark-mode .powertoolsimage, body.dark-mode .pt-hover-menu, body.dark-mode .pt-hover-menu-flex { background-color: #121212; color: #f5f5f5; }`;
  css += `body.dark-mode .${classSettings.resultpage.mcDiv}.powertoolslinkinlinecontainer { background-color: #1f1f1f; }`;
  css +=
    "body.dark-mode img.logo, body.dark-mode img[src^='data'] { filter: hue-rotate(180deg) brightness(.93) invert(1); }";
  css += "body.dark-mode img[src^='http'] { opacity: 0.75 }";
  css +=
    "body.dark-mode a, body.dark-mode a:link, body.dark-mode a:hover, body.dark-mode a:active, body.dark-mode .linked { color: #85daff; }";
  css += "body.dark-mode a:visited { color: #8ec6ec; }";
  css +=
    "body.dark-mode .pt-textlink a { text-decoration: none; color: #f5f5f5; }";
  css +=
    ".pt-hover-menu, .pt-hover-menu-flex { position:absolute; padding: 8px; z-index: 1; background-color: #FFF; border: 1px solid #808080; display:none; }";
  css += ".pt-hover-container:hover .pt-hover-menu { display:inline; }";
  css += ".pt-hover-container:hover .pt-hover-menu-flex { display:flex; }";
  css += ".pt-textlink a { text-decoration: none; color: black; }";
  css += `.${classSettings.resultpage.mcDiv}.powertoolslinkinlinecontainer { background-color: #f2f2f2; }`;
  css +=
    ".powertoolsimage { width: 184px; height: 100px; background-color: white; border: 1px solid #808080; cursor: pointer; text-align: center; margin-top: 10px; padding-top: 84px; }";

  style.appendChild(document.createTextNode(css));

  head.appendChild(style);
}
