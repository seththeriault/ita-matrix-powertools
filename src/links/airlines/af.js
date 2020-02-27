import { getCabin } from "../../settings/appSettings";
import mptUserSettings, { registerSetting } from "../../settings/userSettings";
import {
  printNotification,
  to2digits,
  to4digitTime,
  to4digits
} from "../../utils";
import { validatePax, register, anyCarriers } from "..";
import { getCurrentSegs } from "../../parse/itin";

const editions = [
  { name: "Brazil", value: "www.airfrance.com.br", country: "BR" },
  { name: "Finland", value: "www.airfrance.fi", country: "FI" },
  { name: "France", value: "www.airfrance.fr", country: "FR" },
  { name: "Germany", value: "www.airfrance.de", country: "DE" },
  { name: "Italy", value: "www.airfrance.it", country: "IT" },
  { name: "Netherlands", value: "www.airfrance.nl", country: "NL" },
  { name: "Spain", value: "www.airfrance.es", country: "ES" },
  { name: "United Kingdom", value: "www.airfrance.co.uk", country: "GB" },
  { name: "United States", value: "www.airfrance.us", country: "US" }
];

const cabins = ["ECONOMY", "W", "C", "F"];

function print() {
  if (!anyCarriers("AF", "KL")) {
    return;
  }

  var pax = validatePax({
    maxPaxcount: 9,
    countInf: true,
    childAsAdult: 12,
    sepInfSeat: false,
    childMinAge: 2
  });
  if (!pax) {
    printNotification("Error: Failed to validate Passengers in printAF");
    return;
  }

  const segs = getCurrentSegs();
  const cabin = cabins[getCabin(Math.max(...segs.map(seg => seg.cabin)))];

  const createUrl = function(edition) {
    const country = editions.find(e => e.value === edition).country;
    return (
      `https://${edition}/ams/exchange?language=${mptUserSettings.language}&country=${country}&target=` +
      encodeURIComponent(
        `/search/summary?deviationValue=5&connections=${segs
          .map(
            seg =>
              `${seg.orig}:${seg.dep.year}${to2digits(
                seg.dep.month
              )}${to2digits(seg.dep.day)}@${to4digitTime(seg.dep.time24)}:${
                seg.carrier
              }${to4digits(seg.fnr)}:${seg.bookingclass}:${seg.farebase}:${
                cabins[getCabin(seg.cabin)]
              }>${seg.dest}`
          )
          .join("-")}&cabinClass=${cabin}&pax=${pax.adults}:0:${
          pax.children.length
        }:${pax.infLap}`
      )
    );
  };

  var url = createUrl(mptUserSettings.afEdition2);
  if (!url) {
    return;
  }

  var extra =
    ' <span class="pt-hover-container">[+]<span class="pt-hover-menu">';
  extra += editions
    .map(function(obj, i) {
      return (
        '<a href="' +
        createUrl(obj.value) +
        '" target="_blank">' +
        obj.name +
        "</a>"
      );
    })
    .join("<br/>");
  extra += "</span></span>";

  return {
    url,
    title: "Air France",
    extra
  };
}

register("airlines", print);
registerSetting("Air France", "afEdition2", editions, "www.airfrance.us");
