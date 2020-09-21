import { clearNotification } from "../utils";
import { processPassengers } from "../print/settings";
import { removeHistory } from "../print/history";

// General settings
const appSettings = {
  isUserscript: !(typeof GM === "undefined" || typeof GM.info === "undefined"), // is using tamper or greasemonkey
  itaLanguage: "en",
  version: __VERSION__,
  retrycount: 1,
  laststatus: "",
  scriptrunning: 1,
  cabin: "Auto"
};

export function reset() {
  // reset Notification due to pagechange
  clearNotification();

  // reset Editor Mode
  document.getElementById("mptStartparse").setAttribute("class", "invis");
  document.getElementById("mptStartparse").style.display = "none";
  appSettings.itaLanguage = "en";
  appSettings.retrycount = 1;

  // reset pax and cabin
  const search = JSON.parse(window.localStorage["savedSearch.0"] || "{}");
  const x = search[3] || {};

  appSettings.cabin = getCabinFromITA(x[8]);
  document.getElementById("mptcabin").firstElementChild.innerHTML =
    appSettings.cabin;

  const itaPax = x[5] || {};
  const itaAdults = itaPax[1] || 1;
  const itaChildren = itaPax[2] || 0;
  const itaInfantLap = itaPax[3] || 0;
  const itaInfantSeat = itaPax[4] || 0;
  const itaSeniors = itaPax[5] || 0;
  const itaYouths = itaPax[6] || 0;

  let e = document.getElementById("numAdults") as HTMLSelectElement;
  e.value = Math.min(9, itaAdults + itaSeniors + itaYouths).toString();
  e = document.getElementById("numInfantsLap") as HTMLSelectElement;
  e.value = itaInfantLap;
  e = document.getElementById("numInfantsSeat") as HTMLSelectElement;
  e.value = itaInfantSeat;

  const ages = [
    ...new Array(itaYouths).fill(17),
    ...new Array(itaChildren).fill(11)
  ];
  for (let i = 1; i <= 8; i++) {
    e = document.getElementById("child" + i + "age") as HTMLSelectElement;
    e.value = ages[i - 1] || -1;
  }

  processPassengers();

  removeHistory();
}

export function getCabinFromITA(itaCabin: string) {
  switch (itaCabin) {
    case "FIRST":
      return "F";
    case "BUSINESS":
      return "C";
    case "PREMIUM-COACH":
      return "Y+";
    default:
      return "Y";
  }
}

export function getCabin(autoCabin) {
  return appSettings.cabin === "Auto" ? autoCabin : getForcedCabin();
}

export function getForcedCabin() {
  switch (appSettings.cabin) {
    case "Y":
      return 0;
    case "Y+":
      return 1;
    case "C":
      return 2;
    case "F":
      return 3;
    default:
      return 0;
  }
}

export default appSettings;
