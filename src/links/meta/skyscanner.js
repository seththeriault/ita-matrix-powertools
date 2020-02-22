import { getCabin } from "../../settings/appSettings";
import mptUserSettings from "../../settings/userSettings";
import { register, validatePax } from "..";
import { currentItin, getCurrentSegs } from "../../parse/itin";
import { printNotification, to2digits } from "../../utils";

const editions = [
  { name: "Skyscanner.com", market: "US" },
  { name: "Skyscanner.de", market: "DE" },
  { name: "Skyscanner.it", market: "IT" },
  { name: "Skyscanner.es", market: "ES" },
  { name: "Skyscanner.co.uk", market: "UK" },
  { name: "Skyscanner.dk", market: "DK" },
  { name: "Skyscanner.mx", market: "MX" },
  { name: "Skyscanner.fi", market: "FI" },
  { name: "Skyscanner.fr", market: "FR" },
  { name: "Skyscanner.no", market: "NO" },
  { name: "Skyscanner.nl", market: "NL" },
  { name: "Skyscanner.pt", market: "PT" },
  { name: "Skyscanner.se", market: "SE" },
  { name: "Skyscanner.ru", market: "RU" }
];

var cabins = ["", "premiumeconomy", "business", "first"];

function print(method) {
  //example https://www.skyscanner.ru/transport/d/stoc/2017-09-02/akl/akl/2017-09-16/stoc/akl/2017-09-29/syd?adults=1&children=0&adultsv2=1&childrenv2=&infants=0&cabinclass=economy&ref=day-view#results
  // method: 0 = based on leg; 1 = based on segment
  const segs = !method ? currentItin.itin : getCurrentSegs();
  if (method && currentItin.itin.length === segs.length) return;

  var pax = validatePax({
    maxPaxcount: 8,
    countInf: false,
    childAsAdult: 12,
    sepInfSeat: false,
    childMinAge: 2
  });
  if (!pax) {
    printNotification("Error: Failed to validate Passengers in printOvago");
    return;
  }

  const cabin =
    cabins[getCabin(Math.min(...getCurrentSegs().map(seg => seg.cabin)))];

  var createUrl = function(market) {
    var url = "http://www.skyscanner.com/transport/d/";

    // Add the segments:
    url += segs
      .map(
        seg =>
          `${seg.orig}/${seg.dep.year}-${to2digits(seg.dep.month)}-${to2digits(
            seg.dep.day
          )}/${seg.dest}`
      )
      .join("/");

    // Add passenger info:
    url += "?adults=" + pax.adults + "adultsv2=" + pax.adults;
    if (pax.children.length || pax.infLap)
      url +=
        "&childrenv2=" +
        Array.apply(null, { length: pax.infLap })
          .map(o => 0)
          .concat(pax.children)
          .join("|");
    if (pax.infLap) url += "&infants=" + pax.infLap;
    // Add cabin / class of service:
    url += "&cabinclass=" + cabin;
    // Add locale ("market"):
    url += "&ref=day-view&market=" + market;

    return url;
  };
  var url = createUrl("US");
  var extra =
    ' <span class="pt-hover-container">[+]<span class="pt-hover-menu">';
  extra += editions
    .map(function(obj, i) {
      return (
        '<a href="' +
        createUrl(obj.market) +
        '" target="_blank">' +
        obj.name +
        "</a>"
      );
    })
    .join("<br/>");
  extra += "</span></span>";

  return {
    url,
    title: "Skyscanner",
    desc:
      mptUserSettings.language == "de"
        ? `Benutze ${segs.length} Segment(e)`
        : `Based on ${segs.length} segment(s)`,
    extra
  };
}

register("meta", () => print(0));
register("meta", () => print(1));
