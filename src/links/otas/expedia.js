import mptSettings, { getForcedCabin } from "../../settings/appSettings";
import { printNotification } from "../../utils";
import { validatePax, register } from "..";
import { currentItin } from "../../parse/itin";

const editions = [
  { name: "expedia.at", host: "www.expedia.at" },
  { name: "expedia.be", host: "www.expedia.be" },
  { name: "expedia.ca", host: "www.expedia.ca" },
  { name: "expedia.ch", host: "www.expedia.ch" },
  { name: "expedia.co.id", host: "www.expedia.co.id" },
  { name: "expedia.co.in", host: "www.expedia.co.in" },
  { name: "expedia.co.jp", host: "www.expedia.co.jp" },
  { name: "expedia.co.kr", host: "www.expedia.co.kr" },
  { name: "expedia.co.nz", host: "www.expedia.co.nz" },
  { name: "expedia.co.th", host: "www.expedia.co.th" },
  { name: "expedia.co.uk", host: "www.expedia.co.uk" },
  { name: "expedia.com", host: "www.expedia.com" },
  { name: "expedia.com.au", host: "www.expedia.com.au" },
  { name: "expedia.com.br", host: "www.expedia.com.br" },
  { name: "expedia.com.hk", host: "www.expedia.com.hk" },
  { name: "expedia.com.my", host: "www.expedia.com.my" },
  { name: "expedia.com.ph", host: "www.expedia.com.ph" },
  { name: "expedia.com.sg", host: "www.expedia.com.sg" },
  { name: "expedia.com.tw", host: "www.expedia.com.tw" },
  { name: "expedia.de", host: "www.expedia.de" },
  { name: "expedia.dk", host: "www.expedia.dk" },
  { name: "expedia.es", host: "www.expedia.es" },
  { name: "expedia.fr", host: "www.expedia.fr" },
  { name: "expedia.ie", host: "www.expedia.ie" },
  { name: "expedia.it", host: "www.expedia.it" },
  { name: "expedia.mx", host: "www.expedia.mx" },
  { name: "expedia.nl", host: "www.expedia.nl" },
  { name: "expedia.no", host: "www.expedia.no" },
  { name: "expedia.se", host: "www.expedia.se" }
];

const editions2 = [
  { name: "cheaptickets.com", host: "www.cheaptickets.com" },
  { name: "ebookers.ch", host: "www.ebookers.ch" },
  { name: "ebookers.com", host: "www.ebookers.com" },
  { name: "ebookers.de", host: "www.ebookers.de" },
  { name: "ebookers.fi", host: "www.ebookers.fi" },
  { name: "ebookers.fr", host: "www.ebookers.fr" },
  { name: "ebookers.ie", host: "www.ebookers.ie" },
  { name: "hotels.com", host: "travel.hotels.com" },
  { name: "hotels.com (ca)", host: "travel.ca.hotels.com" },
  { name: "hotels.com (fr)", host: "travel.fr.hotels.com" },
  { name: "hotels.com (jp)", host: "travel.jp.hotels.com" },
  { name: "hotels.com (no)", host: "travel.no.hotels.com" },
  { name: "hotels.com (se)", host: "travel.se.hotels.com" },
  { name: "hotels.com (uk)", host: "travel.uk.hotels.com" },
  { name: "hotwire.com", host: "vacation.hotwire.com" },
  { name: "lastminute.co.nz", host: "www.lastminute.co.nz" },
  { name: "lastminute.com.au", host: "www.lastminute.com.au" },
  { name: "mrjet.se", host: "www.mrjet.se" },
  { name: "orbitz.com", host: "www.orbitz.com" },
  { name: "travelocity.ca", host: "www.travelocity.ca" },
  { name: "travelocity.com", host: "www.travelocity.com" },
  { name: "wotif.co.nz", host: "www.wotif.co.nz" },
  { name: "wotif.com", host: "www.wotif.com" }
];

function printExpedia() {
  var pax = validatePax({
    maxPaxcount: 9,
    countInf: true,
    childAsAdult: 18,
    sepInfSeat: false,
    childMinAge: 2
  });
  if (!pax) {
    printNotification("Error: Failed to validate Passengers in printExpedia");
    return;
  }
  let expediaClasses = ["coach", "premium", "business", "first"];
  let minCabin = 3;
  let ExpediaCreateUrl = function(expediaBase) {
    let segUrl = "";
    for (var i = 0; i < currentItin.itin.length; i++) {
      segUrl +=
        "&legs%5B" + i + "%5D.departureAirport=" + currentItin.itin[i].orig;
      segUrl +=
        "&legs%5B" + i + "%5D.arrivalAirport=" + currentItin.itin[i].dest;
      segUrl +=
        "&legs%5B" +
        i +
        "%5D.departureDate=" +
        currentItin.itin[i].arr.year.toString() +
        "-" +
        ("0" + currentItin.itin[i].dep.month).slice(-2) +
        "-" +
        ("0" + currentItin.itin[i].dep.day).slice(-2);
      for (var j = 0; j < currentItin.itin[i].seg.length; j++) {
        segUrl += (
          "&legs%5B" +
          i +
          "%5D.segments%5B" +
          j +
          "%5D=" +
          currentItin.itin[i].seg[j].dep.year.toString() +
          "-" +
          ("0" + currentItin.itin[i].seg[j].dep.month).slice(-2) +
          "-" +
          ("0" + currentItin.itin[i].seg[j].dep.day).slice(-2) +
          "-" +
          expediaClasses[
            mptSettings.cabin === "Auto" ? minCabin : getForcedCabin()
          ] +
          "-" +
          currentItin.itin[i].seg[j].orig +
          "-" +
          currentItin.itin[i].seg[j].dest +
          "-" +
          currentItin.itin[i].seg[j].carrier +
          "-" +
          currentItin.itin[i].seg[j].fnr
        ).toLowerCase();

        // check the min cabin:
        if (currentItin.itin[i].seg[j].cabin < minCabin) {
          minCabin = currentItin.itin[i].seg[j].cabin;
        }
      }
    }
    // Build the URL:
    let baseUrl =
      "https://" +
      expediaBase +
      "/Flight-Search-Details?action=dl&trip=MultipleDestination";
    // Add travel class to URL:
    baseUrl +=
      "&cabinClass=" +
      expediaClasses[
        mptSettings.cabin === "Auto" ? minCabin : getForcedCabin()
      ];
    // Add passenger info to URL:
    baseUrl += "&adults=" + pax.adults;
    return baseUrl + segUrl;
  };
  var ExpediaUrl = ExpediaCreateUrl("expedia.com");
  var container =
    ' <span class="pt-hover-container">[+]<span class="pt-hover-menu-flex"><div style="margin-right: 1rem;">';
  container += editions
    .map(function(obj, i) {
      return (
        '<a href="' +
        ExpediaCreateUrl(obj.host) +
        '" target="_blank">' +
        obj.name +
        "</a>"
      );
    })
    .join("<br/>");
  container += "</div><div>";
  container += editions2
    .map(function(obj, i) {
      return (
        '<a href="' +
        ExpediaCreateUrl(obj.host) +
        '" target="_blank">' +
        obj.name +
        "</a>"
      );
    })
    .join("<br/>");
  container += "</div></span></span>";

  return {
    url: ExpediaUrl,
    title: "Expedia",
    extra: container
  };
}

register("otas", printExpedia);
