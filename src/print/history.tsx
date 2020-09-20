import React from "dom-chef";
import formatDistanceToNow from "date-fns/esm/formatDistanceToNow";
import enUS from "date-fns/esm/locale/en-US";
import de from "date-fns/esm/locale/de";

import userSettings, { saveUserSettings } from "../settings/userSettings";
import { getCabinFromITA } from "../settings/appSettings";
import { updateCurrentSearch } from "../state";

const MAX_HISTORY_LENGTH = 100;

let container: HTMLDivElement;

export function renderHistory() {
  subscribeSearchChanges();
  container = renderHistoryContainer();
}

export function removeHistory() {
  container?.parentNode?.removeChild(container);
  document.body.style.paddingLeft = "0";
}

function subscribeSearchChanges() {
  var _setItem = Storage.prototype.setItem;
  Storage.prototype.setItem = function(key, value) {
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
  document.body.style.paddingLeft = "241px";
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
                href={
                  window.location.pathname +
                  window.location.search +
                  `#search:research=${search[1]}`
                }
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

function changeSearch(e: MouseEvent, key: string, savedSearch: string) {
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
  window.location.hash = `#search:research=${key}`;
  window.location.reload(true);
}
