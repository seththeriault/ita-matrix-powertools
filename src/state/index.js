import { JSONCrush, JSONUncrush } from "../../node_modules/JSONCrush/JSONCrush";

let originalSetItem;

export function manageState() {
  if (!window.localStorage || !window.history) return;
  loadState();

  var _setItem = Storage.prototype.setItem;
  Storage.prototype.setItem = function(key, value) {
    _setItem.apply(this, arguments);
    if (key === "savedSessionState") saveStateToUrl();
  };
}

function loadState() {
  const search = new URLSearchParams(window.location.search.slice(1));
  const savedState = search && search.get("mpt:state");
  if (savedState) {
    const { search, sessionState } = JSON.parse(JSONUncrush(savedState));
    if (search) window.localStorage["savedSearch.0"] = search;
    if (sessionState) window.localStorage["savedSessionState"] = sessionState;
  }
}

function getState() {
  return {
    search: window.localStorage["savedSearch.0"],
    sessionState: window.localStorage["savedSessionState"]
  };
}

function saveStateToUrl() {
  const currentState = getState();
  setQueryStringParameter("mpt:state", JSONCrush(JSON.stringify(currentState)));
}

function setQueryStringParameter(name, value) {
  const search = new URLSearchParams(window.location.search);
  search.set(name, value);
  window.history.replaceState(
    {},
    "",
    decodeURIComponent(
      `${window.location.pathname}?${search}` + (window.location.hash || "")
    )
  );
}
