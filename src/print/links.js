import mptUserSettings from "../settings/userSettings";
import classSettings from "../settings/itaSettings";
import translations from "../settings/translations";

import { findtargets, findtarget } from "../utils";

/** @type {{ [key: string]: (() => { url: string, title: string, img?: string, desc?: string, extra?: string, target?: string })[]}} */
const links = {};

require("../links");

const skimlinks = document.createElement("script");
skimlinks.setAttribute(
  "src",
  "https://s.skimresources.com/js/122783X1611548.skimlinks.js"
);

/**
 * Registers a link
 * @param {() => { url: string, title: string, img?: string, desc?: string, extra?: string, target?: string }} factory
 */
export function registerLink(type, factory) {
  if (!links[type]) links[type] = [];
  links[type].push(factory);
}

export function printLinksContainer() {
  // do nothing if editor mode is active
  if (findtargets("editoritem").length > 0) {
    return;
  }

  // empty outputcontainer
  const div = getSidebarContainer();
  if (!div) return;
  div.innerHTML = "";

  //  S&D powertool items
  const elems = findtargets("powertoolsitem");
  for (let i = elems.length - 1; i >= 1; i--) {
    elems[i].parentElement.removeChild(elems[i]);
  }

  const groups = Object.keys(links);
  groups.forEach((group, i) => {
    const groupLinks = links[group]
      .map(link => link())
      .sort((a, b) => {
        return a.title.localeCompare(b.title);
      });
    groupLinks.forEach(link => {
      if (!link) return;

      if (link.img) {
        printImage(link);
      } else if (mptUserSettings.enableInlineMode == 1) {
        printUrlInline(link);
      } else {
        printUrl(link);
      }
    });

    mptUserSettings.enableDeviders == 1 &&
      links[group].length &&
      i != groups.length - 1 &&
      printSeperator();
  });

  /*** attach JS events after building link container  ***/
  bindLinkClicks();
}

function bindLinkClicks() {
  if (mptUserSettings.enableAffiliates == 1) {
    skimlinks.parentNode && skimlinks.parentNode.removeChild(skimlinks);
    document.body.appendChild(skimlinks);
  }
}

// Inline Stuff
function printUrlInline(link) {
  const item = `<li class="powertoolsitem">${printLink(link)}</li>`;
  const container = getSidebarContainer();
  container && container.insertAdjacentHTML("beforeend", item);
}

export function printImage(link) {
  const container = getSidebarContainer();
  const item =
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
    container && container.insertAdjacentHTML("beforeend", item);
  } else {
    const id = Math.random().toString();
    container &&
      container.insertAdjacentHTML(
        "beforeend",
        `<div id="${id}" class="powertoolsitem powertoolsimage"><span>${link.title}</span></div>`
      );

    document.getElementById(id).addEventListener("click", function() {
      this.outerHTML = item;
    });
  }
}

export function getSidebarContainer() {
  return (
    document.getElementById("powertoolslinkcontainer") ||
    (mptUserSettings.enableInlineMode == 1
      ? createUrlContainerInline()
      : createUrlContainer())
  );
}

function createUrlContainerInline() {
  const target = findtarget(classSettings.resultpage.mcDiv, 1);
  if (!target) return;

  const newdiv = document.createElement("div");
  newdiv.classList.add(classSettings.resultpage.mcDiv);
  newdiv.classList.add(`powertoolslinkinlinecontainer`);
  newdiv.innerHTML =
    '<div class="' +
    classSettings.resultpage.mcHeader +
    '">Powertools</div><ul id="powertoolslinkcontainer" class="' +
    classSettings.resultpage.mcLinkList +
    '"></ul>';
  target.parentElement.appendChild(newdiv);
  return document.getElementById("powertoolslinkcontainer");
}

// Printing Stuff
function printUrl(link) {
  const item = `<div class="powertoolsitem" style="margin:5px 0px 10px 0px">${printLink(
    link
  )}</div>`;
  const container = getSidebarContainer();
  container && container.insertAdjacentHTML("beforeend", item);
}

function printLink(link) {
  let html = `<div><label style="font-size:${Number(
    mptUserSettings.linkFontsize
  )}%;font-weight:600">
    <a href="${link.url}" target=${link.target || "_blank"}>${(translations[
    mptUserSettings.language
  ] &&
    translations[mptUserSettings.language]["use"]) ||
    "Use "} ${link.title}</a>
  </label>`;
  if (link.extra) html += link.extra;
  if (link.desc)
    html += `<br/><label style="font-size:${Number(
      mptUserSettings.linkFontsize
    ) - 15}%">${link.desc}</label>`;
  html += "</div";
  return html;
}

function createUrlContainer() {
  const target = findtarget(classSettings.resultpage.milagecontainer, 1);
  if (!target) return;

  const newdiv = document.createElement("div");
  newdiv.setAttribute("id", "powertoolslinkcontainer");
  newdiv.setAttribute("style", "margin:15px 0px 0px 10px");
  return target.appendChild(newdiv);
}

function printSeperator() {
  const container = getSidebarContainer();
  container &&
    container.insertAdjacentHTML(
      "beforeend",
      mptUserSettings.enableInlineMode
        ? '<hr class="powertoolsitem"/>'
        : "<hr/>"
    );
}
