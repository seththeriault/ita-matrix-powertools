import { JSONCrush, JSONUncrush } from "../../node_modules/JSONCrush/JSONCrush";

import userSettings from "../settings/userSettings";

export function stateEnabled() {
  return (
    userSettings.enableMultiSearch &&
    window.localStorage &&
    window.history &&
    window.XMLHttpRequest?.prototype?.open
  );
}

export function manageState() {
  if (!stateEnabled()) return;
  loadState();
  window.addEventListener("click", loadState, false);

  // window.history.replaceState does not trigger hashchange so we need to dispatch it manually
  window.addEventListener("popstate", dispatchHashChange, false);

  // save session after searches
  const originalOpen = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function(method, url) {
    if ((url || "").toLowerCase().endsWith("/search")) {
      const search = JSON.parse(window.localStorage["savedSearch.0"]);
      saveStateToUrl({ search });
      this.addEventListener("load", () =>
        saveStateToUrl({
          search,
          sessionState: JSON.parse(window.localStorage["savedSessionState"])
        })
      );
    }
    originalOpen.apply(this, arguments);
  };
}

function dispatchHashChange() {
  if (window.location.hash)
    window.dispatchEvent(new HashChangeEvent("hashchange"));
}

function loadState() {
  const search = new URLSearchParams(window.location.search.slice(1));
  const savedState = search && search.get("mpt:state");
  if (savedState) {
    const { search, sessionState } = JSON.parse(JSONUncrush(savedState));
    if (search)
      updateCurrentSearch(
        typeof search === "string" ? search : JSON.stringify(search)
      );
    if (sessionState)
      window.localStorage["savedSessionState"] =
        typeof sessionState === "string"
          ? sessionState
          : JSON.stringify(sessionState);
  }
}

export function updateCurrentSearch(search) {
  const len = 6;
  let searches = [];
  for (let i = 0; i < len; i++) {
    const savedSearch = window.localStorage[`savedSearch.${i}`];
    if (savedSearch) searches.push(savedSearch);
  }
  searches = [search, ...searches.filter(s => s !== search)];
  for (let i = 0; i < Math.min(len, searches.length); i++) {
    window.localStorage[`savedSearch.${i}`] = searches[i];
  }
}

export function getStateUrl(state, hash) {
  const search = new URLSearchParams(window.location.search.slice(1));
  if (state) {
    // JSONCrush maxSubstringLength ~ 10 appeared to be optimal
    // https://github.com/KilledByAPixel/JSONCrush/pull/9
    search.set("mpt:state", JSONCrush(JSON.stringify(state), 10));
  } else search.delete("mpt:state");
  return decodeURIComponent(
    `${window.location.pathname}?${search}` + (hash || "")
  );
}

function saveStateToUrl(currentState) {
  const url = getStateUrl(currentState, window.location.hash);
  window.history.replaceState({}, "", url);
}
