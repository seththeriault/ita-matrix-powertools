import React from "dom-chef";
import formatDistanceToNow from "date-fns/esm/formatDistanceToNow";
import enUS from "date-fns/esm/locale/en-US";
import de from "date-fns/esm/locale/de";

import userSettings, { saveUserSettings } from "../settings/userSettings";
import { getCabinFromITA } from "../settings/appSettings";
import { updateCurrentSearch, stateEnabled, getStateUrl } from "../state";

const MAX_HISTORY_LENGTH = 100;

let container: HTMLDivElement;

function showHistory() {
  return userSettings.enableHistory && window.Storage?.prototype?.setItem;
}

export function renderHistory() {
  if (!showHistory()) return;
  subscribeSearchChanges();
  container = renderHistoryContainer();
}

export function removeHistory() {
  container?.parentNode?.removeChild(container);
  document.body.classList.remove("show-history");
}

function subscribeSearchChanges() {
  var _setItem = window.Storage.prototype.setItem;
  window.Storage.prototype.setItem = function(key, value) {
    _setItem.apply(this, arguments);
    if (key !== "savedSearch.0") return;

    const { "12": _, ...search } = JSON.parse(value);
    userSettings.history = [
      { ts: new Date().toISOString(), savedSearch: value },
      ...userSettings.history.filter(h => {
        const { "12": _, ...hist } = JSON.parse(h.savedSearch);
        return JSON.stringify(hist) !== JSON.stringify(search);
      })
    ].slice(0, MAX_HISTORY_LENGTH);
    saveUserSettings();
  };
}

function renderHistoryContainer() {
  const container = buildContainer();
  document.body.classList.add("show-history");
  document.body.append(container);
  return container;
}

function buildContainer() {
  let lastDistance;
  return (
    <div
      style={{
        position: "fixed",
        width: "200px",
        top: "20px",
        left: "20px",
        bottom: "20px",
        paddingRight: "20px",
        borderRight: "1px dashed grey"
      }}
    >
      <p>History</p>
      {userSettings.history
        .sort((a, b) => new Date(b.ts).getTime() - new Date(a.ts).getTime())
        .map(h => {
          const search = JSON.parse(h.savedSearch);
          const distance = formatDistanceToNow(new Date(h.ts), {
            locale: userSettings.language === "de" ? de : enUS,
            addSuffix: true
          });
          const label =
            distance !== lastDistance ? <div>{distance}</div> : null;
          lastDistance = distance;
          return (
            <>
              {label}
              <a
                style={{ cursor: "pointer", display: "block", margin: "1em 0" }}
                onClick={e => changeSearch(e, search[1], h.savedSearch)}
                href={getSearchUrl(this, search[1], h.savedSearch)}
              >
                {(search[3][7] || []).map(s => `${s[5]}-${s[3]}`).join(" ")} (
                {getCabinFromITA(search[3][8])})
              </a>
            </>
          );
        })}
    </div>
  ) as HTMLDivElement;
}

function getHash(key) {
  return `#search:research=${key}`;
}

function changeSearch(e: MouseEvent, key: string, savedSearch: string) {
  if (stateEnabled()) return; // stateful URL will handle everything

  updateCurrentSearch(savedSearch);

  if (
    e.ctrlKey ||
    e.shiftKey ||
    e.metaKey || // apple
    (e.button && e.button == 1) // middle click, >IE9 + everyone else
  ) {
    // https://stackoverflow.com/a/20087506/82199
    return;
  }
  e.preventDefault();
  window.location.hash = getHash(key);
  window.location.reload(true);
}

function getSearchUrl(obj, key: string, search: string) {
  if (stateEnabled()) {
    return getStateUrl({ search }, getHash(key));
  } else {
    return (
      window.location.pathname +
      window.location.search +
      `#search:research=${key}`
    );
  }
}
