import mptUserSettings from "../settings/userSettings";
import classSettings from "../settings/itaSettings";
import translations from "../settings/translations";
import mtpPassengerConfig from "../settings/paxSettings";

import { currentItin, getCurrentSegs } from "../parse/itin";
import { findtargets, findtarget } from "../utils";

/** @type {{ [key: string]: ((itin: typeof currentItin) => { url: string, title: string, desc?: string, extra?: string, target?: string })[]}} */
const links = {};

require("../links");

var skimlinks = document.createElement("script");
skimlinks.setAttribute(
  "src",
  "https://s.skimresources.com/js/122783X1611548.skimlinks.js"
);

/**
 * Registers a link
 * @param {(itin: typeof currentItin) => { url: string, title: string, desc?: string, extra?: string, target?: string }} factory
 */
export function registerLink(type, factory) {
  if (!links[type]) links[type] = [];
  links[type].push(factory);
}

export function printLinksContainer() {
  // do nothing if editor mode is active
  if (findtargets("editoritem").length > 0) {
    return false;
  }

  // empty outputcontainer
  const div = getSidebarContainer();
  div.innerHTML = "";

  //  S&D powertool items
  const elems = findtargets("powertoolsitem");
  for (let i = elems.length - 1; i >= 1; i--) {
    elems[i].parentElement.removeChild(elems[i]);
  }

  for (let group in links) {
    const groupLinks = links[group]
      .map(link => link(currentItin))
      .sort((a, b) => {
        return a.title.localeCompare(b.title);
      });
    groupLinks.forEach(link => {
      if (!link) return;

      if (mptUserSettings.enableInlineMode == 1) {
        printUrlInline(link);
      } else {
        printUrl(link);
      }
    });

    mptUserSettings.enableDeviders == 1 &&
      links[group].length &&
      printSeperator();
  }

  printGCM();
  printWheretocredit();
  /*** attach JS events after building link container  ***/
  bindLinkClicks();
}

function printGCM() {
  var url = "";
  // Build multi-city search based on segments
  // Keeping continous path as long as possible
  for (var i = 0; i < currentItin.itin.length; i++) {
    for (var j = 0; j < currentItin.itin[i].seg.length; j++) {
      url += currentItin.itin[i].seg[j].orig + "-";
      if (j + 1 < currentItin.itin[i].seg.length) {
        if (
          currentItin.itin[i].seg[j].dest != currentItin.itin[i].seg[j + 1].orig
        ) {
          url += currentItin.itin[i].seg[j].dest + ";";
        }
      } else {
        url += currentItin.itin[i].seg[j].dest + ";";
      }
    }
  }

  printImage({
    img: "http://www.gcmap.com/map?MR=900&MX=182x182&PM=*&P=" + url,
    url: "http://www.gcmap.com/mapui?P=" + url,
    title: "GCM"
  });
}

function printWheretocredit() {
  const link = {
    url:
      "https://www.wheretocredit.com/calculator#" +
      getCurrentSegs()
        .map(seg =>
          [seg.orig, seg.dest, seg.carrier, seg.bookingclass].join("-")
        )
        .join("/"),
    title: "Where to Credit"
  };

  if (mptUserSettings.enableInlineMode == 1) {
    printUrlInline(link);
  } else {
    printUrl(link);
  }
}

function bindLinkClicks() {
  if (mptUserSettings.enableAffiliates == 1) {
    skimlinks.parentNode && skimlinks.parentNode.removeChild(skimlinks);
    document.body.appendChild(skimlinks);
  }
}

export function validatePaxcount(config) {
  //{maxPaxcount:7, countInf:false, childAsAdult:12, sepInfSeat:false, childMinAge:2}
  var tmpChildren = new Array();
  // push cur children
  for (var i = 0; i < mtpPassengerConfig.cAges.length; i++) {
    tmpChildren.push(mtpPassengerConfig.cAges[i]);
  }
  var ret = {
    adults: mtpPassengerConfig.adults,
    children: new Array(),
    infLap: mtpPassengerConfig.infantsLap,
    infSeat: 0
  };
  if (config.sepInfSeat === true) {
    ret.infSeat = mtpPassengerConfig.infantsSeat;
  } else {
    for (var i = 0; i < mtpPassengerConfig.infantsSeat; i++) {
      tmpChildren.push(config.childMinAge);
    }
  }
  // process children
  for (var i = 0; i < tmpChildren.length; i++) {
    if (tmpChildren[i] < config.childAsAdult) {
      ret.children.push(tmpChildren[i]);
    } else {
      ret.adults++;
    }
  }
  // check Pax-Count
  if (config.countInf === true) {
    if (
      config.maxPaxcount <
      ret.adults + ret.infLap + ret.infSeat + ret.children.length
    ) {
      console.log("Too many passengers");
      return;
    }
  } else {
    if (config.maxPaxcount < ret.adults + ret.infSeat + ret.children.length) {
      console.log("Too many passengers");
      return;
    }
  }
  if (0 === ret.adults + ret.infSeat + ret.children.length) {
    console.log("No passengers");
    return;
  }
  return ret;
}

// Inline Stuff
function printUrlInline(link) {
  var otext =
    '<a href="' + link.url + '" target="' + (link.target || "_blank") + '">';
  otext +=
    (translations[mptUserSettings.language] &&
      translations[mptUserSettings.language]["use"]) ||
    "Use ";
  otext += " " + link.title + "</a>" + (link.extra || "");
  printItemInline(otext, link.desc);
}

export function printItemInline(text, desc) {
  const div = getSidebarContainer();
  div.insertAdjacentHTML(
    "beforeend",
    '<li class="powertoolsitem">' +
      text +
      (desc ? "<br/><small>(" + desc + ")</small>" : "") +
      "</li>"
  );
}

export function printImage(link) {
  const div = getSidebarContainer();
  const imgLink =
    (link.url
      ? '<a href="' + link.url + '" target="_blank" class="powertoolsitem">'
      : "") +
    '<img src="' +
    link.img +
    '" style="margin-top:10px;"' +
    (!link.url ? ' class="powertoolsitem"' : "") +
    "/>" +
    (link.url ? "</a>" : "");
  if (mptUserSettings.enableIMGautoload == 1) {
    div.insertAdjacentHTML("beforeend", imgLink);
  } else {
    var id = Math.random().toString();
    div.insertAdjacentHTML(
      "beforeend",
      `<div id="${id}" class="powertoolsitem" style="width:184px;height:100px;background-color:white;border:1px solid #808080;cursor:pointer;text-align:center;margin-top:10px;padding-top:84px;"><span>${link.title}</span></div>`
    );

    document.getElementById(id).addEventListener("click", function() {
      this.outerHTML = imgLink;
    });
  }
}

export function getSidebarContainer() {
  if (mptUserSettings.enableInlineMode == 1) {
    return (
      document.getElementById("powertoolslinkinlinecontainer") ||
      createUrlContainerInline()
    );
  } else {
    return (
      document.getElementById("powertoolslinkcontainer") || createUrlContainer()
    );
  }
}

function createUrlContainerInline() {
  var newdiv = document.createElement("div");
  newdiv.setAttribute("class", classSettings.resultpage.mcDiv);
  newdiv.innerHTML =
    '<div class="' +
    classSettings.resultpage.mcHeader +
    '">Powertools</div><ul id="powertoolslinkinlinecontainer" class="' +
    classSettings.resultpage.mcLinkList +
    '"></ul>';
  findtarget(classSettings.resultpage.mcDiv, 1).parentElement.appendChild(
    newdiv
  );
  return document.getElementById("powertoolslinkinlinecontainer");
}

// Printing Stuff
function printUrl(link) {
  var text =
    '<div style="margin:5px 0px 10px 0px"><label style="font-size:' +
    Number(mptUserSettings.linkFontsize) +
    '%;font-weight:600"><a href="' +
    link.url +
    '" target=' +
    (link.target || "_blank") +
    ">";
  text +=
    (translations[mptUserSettings.language] &&
      translations[mptUserSettings.language]["use"]) ||
    "Use ";
  text +=
    " " +
    link.title +
    "</a></label>" +
    (link.extra || "") +
    (link.desc
      ? '<br><label style="font-size:' +
        (Number(mptUserSettings.linkFontsize) - 15) +
        '%">(' +
        link.desc +
        ")</label>"
      : "") +
    "</div>";
  const container = getSidebarContainer();
  container.insertAdjacentHTML("beforeend", text);
}

function createUrlContainer() {
  var newdiv = document.createElement("div");
  newdiv.setAttribute("id", "powertoolslinkcontainer");
  newdiv.setAttribute("style", "margin:15px 0px 0px 10px");
  return findtarget(
    classSettings.resultpage.htbContainer,
    1
  ).parentElement.parentElement.parentElement.appendChild(newdiv);
}

function printSeperator() {
  var container = getSidebarContainer();
  if (container) {
    container.insertAdjacentHTML(
      "beforeend",
      mptUserSettings.enableInlineMode
        ? '<hr class="powertoolsitem"/>'
        : "<hr/>"
    );
  }
}
