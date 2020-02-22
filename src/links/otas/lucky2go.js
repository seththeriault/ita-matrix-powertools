import mptUserSettings, { registerSetting } from "../../settings/userSettings";
import { printNotification } from "../../utils";
import { validatePax, register } from "..";
import { currentItin } from "../../parse/itin";

const editions = [
  { lang: "pl", country: "PL" },
  { lang: "bg", country: "BG" },
  { lang: "ro", country: "RO" },
  { lang: "cs", country: "CZ" },
  { lang: "hu", country: "HU" },
  { lang: "sk", country: "SK" },
  { lang: "pt", country: "PT" },
  { lang: "es", country: "ES" },
  { lang: "en", country: "GB" },
  { lang: "en", country: "IE" },
  { lang: "en", country: "US" },
  { lang: "it", country: "IT" },
  { lang: "de", country: "DE" },
  { lang: "fr", country: "FR" },
  { lang: "el", country: "GR" }
];

function printLucky2go() {
  var createUrl = function(edition) {
    // 0 = Economy; 1=Premium Economy; 2=Business; 3=First
    var cabins = ["Economy", "Economy", "Business", "First"];
    var pax = validatePax({
      maxPaxcount: 9,
      countInf: false,
      childAsAdult: 12,
      sepInfSeat: false,
      childMinAge: 2
    });
    if (!pax) {
      printNotification(
        "Error: Failed to validate Passengers in printLucky2go"
      );
      return;
    }
    var url =
      "https://secure.lucky2go.com/flights/options/?Adult=" +
      pax.adults +
      "&Child=" +
      pax.children.length +
      "&Infant=0&InfantLap=" +
      pax.infLap +
      "&PointOfSaleCountry=" +
      edition.country +
      "&UserCurrency=" +
      (currentItin.cur || "USD") +
      "&DisplayedPrice=" +
      currentItin.price +
      "&DisplayedPriceCurrency=" +
      (currentItin.cur || "USD") +
      "&UserLanguage=" +
      edition.lang +
      "&TripType=";
    if (currentItin.itin.length == 1) {
      url += "OneWay";
    } else if (
      currentItin.itin.length == 2 &&
      currentItin.itin[0].orig == currentItin.itin[1].dest &&
      currentItin.itin[0].dest == currentItin.itin[1].orig
    ) {
      url += "RoundTrip";
    } else {
      url += "MultiCity";
    }

    var seg = 0;
    var slice = 1;
    var slicestr = "";
    //Build multi-city search based on legs
    for (var i = 0; i < currentItin.itin.length; i++) {
      // walks each leg
      for (var j = 0; j < currentItin.itin[i].seg.length; j++) {
        seg++;
        //walks each segment of leg
        var k = 0;
        // lets have a look if we need to skip segments - Flightnumber has to be the same and it must be just a layover
        while (j + k < currentItin.itin[i].seg.length - 1) {
          if (
            currentItin.itin[i].seg[j + k].fnr !=
              currentItin.itin[i].seg[j + k + 1].fnr ||
            currentItin.itin[i].seg[j + k].layoverduration >= 1440
          )
            break;
          k++;
        }
        url += "&Origin" + seg + "=" + currentItin.itin[i].seg[j].orig;
        url += "&Destination" + seg + "=" + currentItin.itin[i].seg[j + k].dest;
        url += "&Carrier" + seg + "=" + currentItin.itin[i].seg[j].carrier;
        url +=
          "&DepartureDate" +
          seg +
          "=" +
          currentItin.itin[i].seg[j].dep.year +
          "-" +
          ("0" + currentItin.itin[i].seg[j].dep.month).slice(-2) +
          "-" +
          ("0" + currentItin.itin[i].seg[j].dep.day).slice(-2);
        url += "&FlightNumber" + seg + "=" + currentItin.itin[i].seg[j].fnr;
        url +=
          "&BookingCode" + seg + "=" + currentItin.itin[i].seg[j].bookingclass;
        url += "&Cabin" + seg + "=" + cabins[currentItin.itin[i].seg[j].cabin];
        slicestr += (slicestr === "" ? "" : "%2C") + seg;
        j += k;
      }
      url += "&Slice" + slice + "=" + slicestr;
      slice++;
      slicestr = "";
    }
    return url;
  };
  // get edition
  var url = createUrl({ lang: "en", country: "US" });
  if (!url) {
    return;
  }
  var extra =
    ' <span class="pt-hover-container">[+]<span class="pt-hover-menu">';
  extra += editions
    .map(
      edition =>
        `<a href="${createUrl(edition)}" target="_blank">${
          edition.lang
        }&#8209;${edition.country}</a>`
    )
    .join("<br/>");
  extra += "</span></span>";

  return {
    url,
    title: "lucky2go",
    extra
  };
}

register("otas", printLucky2go);
