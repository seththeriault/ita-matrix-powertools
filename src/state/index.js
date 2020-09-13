import { JSONCrush, JSONUncrush } from "../../node_modules/JSONCrush/JSONCrush";

let originalSetItem;

export function manageState() {
  if (!window.localStorage || !window.history) return;
  loadState();

  window.addEventListener("hashchange", clearState, false);
  window.addEventListener(
    "popstate",
    () => {
      // window.history.replaceState does not trigger hashchange so we need to dispatch it manually
      if (window.location.hash)
        window.dispatchEvent(new HashChangeEvent("hashchange"));
    },
    false
  );

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
    if (search) updateSavedSearch(search);
    if (sessionState) window.localStorage["savedSessionState"] = sessionState;
  }
}

function updateSavedSearch(search) {
  const len = 6;
  let searches = [];
  for (let i = 0; i < len; i++) {
    const savedSearch = window.localStorage[`savedSearch.${i}`];
    if (savedSearch) searches.push(savedSearch);
  }
  searches = [search, ...searches.filter(s => s !== search)];
  for (let i = 0; i < Math.min(len, search.length); i++) {
    window.localStorage[`savedSearch.${i}`] = searches[i];
  }
}

function getState() {
  return {
    search: window.localStorage["savedSearch.0"],
    sessionState: window.localStorage["savedSessionState"]
  };
}

function clearState() {
  if (window.location.hash.indexOf("search:research") === -1) return;
  const search = new URLSearchParams(window.location.search);
  search.delete("mpt:state");
  replaceState(search);
}

function saveStateToUrl() {
  const currentState = getState();
  setQueryStringParameter("mpt:state", JSONCrush(JSON.stringify(currentState)));
}

function setQueryStringParameter(name, value) {
  const search = new URLSearchParams(window.location.search);
  search.set(name, value);
  replaceState(search);
}

function replaceState(search) {
  window.history.replaceState(
    {},
    "",
    decodeURIComponent(
      `${window.location.pathname}?${search}` + (window.location.hash || "")
    )
  );
}
