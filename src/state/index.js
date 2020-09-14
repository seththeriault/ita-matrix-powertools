import { JSONCrush, JSONUncrush } from "../../node_modules/JSONCrush/JSONCrush";

export function manageState() {
  if (
    !window.localStorage ||
    !window.history ||
    !XMLHttpRequest ||
    !XMLHttpRequest.prototype
  )
    return;
  loadState();
  window.addEventListener("click", loadState, false);

  window.addEventListener("hashchange", pageChanged, false);
  // window.history.replaceState does not trigger hashchange so we need to dispatch it manually
  window.addEventListener("popstate", dispatchHashChange, false);

  // save session after searches
  const originalOpen = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function(method, url) {
    if ((url || "").toLowerCase().endsWith("/search")) {
      const search = window.localStorage["savedSearch.0"];
      this.addEventListener("load", () =>
        saveStateToUrl({
          search,
          sessionState: window.localStorage["savedSessionState"]
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

function pageChanged() {
  if (window.location.hash.indexOf("search:") > -1) saveStateToUrl();
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
  for (let i = 0; i < Math.min(len, searches.length); i++) {
    window.localStorage[`savedSearch.${i}`] = searches[i];
  }
}

function saveStateToUrl(currentState) {
  const search = new URLSearchParams(window.location.search.slice(1));
  if (currentState)
    search.set("mpt:state", JSONCrush(JSON.stringify(currentState)));
  else search.delete("mpt:state");
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
