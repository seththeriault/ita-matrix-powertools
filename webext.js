/**
 * Inject userscript to DOM
 */
var s = document.createElement("script");
s.src = chrome.extension.getURL("ita-matrix-powertools.user.js");
s.onload = function() {
  this.remove();
};
(document.head || document.documentElement).appendChild(s);
