import { printNotification, to2digits } from "../../utils";
import { validatePaxcount, registerLink } from "../../print/links";
import { currentItin } from "../../parse/itin";

const editions = [
  { name: "English", url: "" },
  { name: "Español", url: "es" },
  { name: "Português", url: "pt" },
  { name: "Deutsch", url: "de" },
  { name: "Italiano", url: "it" },
  { name: "Dansk", url: "da" },
  { name: "Svenska", url: "sv" },
  { name: "Norsk", url: "no" },
  { name: "Nederlands", url: "nl" },
  { name: "Finnish", url: "fi" },
  { name: "Polish", url: "pl" },
  { name: "Turkish", url: "tk" }
];

function printFN() {
  var pax = validatePaxcount({
    maxPaxcount: 9,
    countInf: false,
    childAsAdult: 12,
    sepInfSeat: false,
    childMinAge: 2
  });
  if (!pax) {
    printNotification("Error: Failed to validate Passengers in printFN");
    return;
  }

  const createUrl = function(edition) {
    let search = `cref=&tty=1&curr=${currentItin.cur ||
      "USD"}&nativecurr=&cls=0&adt=${pax.adults}&chd=${
      pax.children.length
    }&inf=${pax.infLap}&tot=0.00&tax=0.00&`;

    search += currentItin.itin
      .map((leg, i) => {
        const key = currentItin.itin.length === 2 && i === i ? "ib" : "ob";
        return leg.seg
          .map(
            (seg, j) =>
              `${key}${i + 1}${j ? j : ""}=${seg.carrier}${seg.fnr}${
                seg.bookingclass
              }!${formatDate(seg.dep)}!${seg.orig}${seg.dest}!${formatDate(
                seg.arr
              )}`
          )
          .join("&");
      })
      .join("&");

    return `https://www.flightnetwork.com/${edition.url}${
      edition.url ? "/" : ""
    }flights/showflight?enc=${btoa(search)}`;
  };

  var url = createUrl(editions[0]);
  if (!url) return;

  let extra =
    ' <span class="pt-hover-container">[+]<span class="pt-hover-menu">';
  extra += editions
    .map(function(obj, i) {
      return (
        '<a href="' + createUrl(obj) + '" target="_blank">' + obj.name + "</a>"
      );
    })
    .join("<br/>");
  extra += "</span></span>";

  return {
    url,
    title: "FlightNetwork",
    extra
  };
}

function formatDate(date) {
  return (
    "" +
    date.year +
    to2digits(date.month) +
    to2digits(date.day) +
    date.time24.replace(":", "")
  );
}

registerLink("otas", printFN);
