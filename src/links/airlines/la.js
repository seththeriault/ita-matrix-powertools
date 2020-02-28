import mptUserSettings, { registerSetting } from "../../settings/userSettings";
import { printNotification, to2digits } from "../../utils";
import { validatePax, register, anyCarriers } from "..";
import { currentItin } from "../../parse/itin";

const laEditions = [
  { value: "es/ar", name: "Argentina / Spanish" },
  { value: "pt/br", name: "Brasil / Portuguese" },
  { value: "es/cl", name: "Chile / Spanish" },
  { value: "es/co", name: "Colombia / Spanish" },
  { value: "es/ec", name: "Ecuador / Spanish" },
  { value: "es/pe", name: "Peru / Spanish" },
  { value: "es/uy", name: "Uruguay / Spanish" },
  { value: "en/us", name: "US / English" },
  { value: "es/mx", name: "Mexico / Spanish" },
  { value: "en/ca", name: "Canada / English" },
  { value: "de/de", name: "Germany / German" },
  { value: "es/es", name: "Spain / Spanish" },
  { value: "fr/fr", name: "France / French" },
  { value: "en/it", name: "Italy / English" },
  { value: "en/uk", name: "UK / English" },
  { value: "en/ue", name: "Rest of Europe / English" },
  { value: "en/au", name: "Australia / English" },
  { value: "en/nz", name: "New Zealand / English" },
  { value: "es/un", name: "Other Countries / Spanish" },
  { value: "en/un", name: "Other Countries / English" }
];

function printLA() {
  if (!anyCarriers("LA")) {
    return;
  }

  // NOTE: currency will be determined by the locale; the deeplink does not support manually specifying the currency
  var createUrl = function(edition) {
    var pax = validatePax({
      maxPaxcount: 9,
      countInf: false,
      childAsAdult: 12,
      sepInfSeat: false,
      childMinAge: 2
    });
    if (!pax) {
      printNotification("Error: Failed to validate Passengers in printLA");
      return;
    }

    const parameters = {
      passengers: {
        numberAdults: pax.adults.toString(),
        numberInfants: pax.infLap.toString(),
        numberChildren: pax.children.length.toString()
      },
      trip: {
        flights: currentItin.itin.map(itin => {
          return {
            amount: currentItin.price,
            currency: currentItin.cur || "USD",
            segments: itin.seg.map(seg => {
              return {
                departure_airport: seg.orig,
                flight_number: seg.fnr,
                departure_date: formatDate(seg.dep),
                arrival_airport: seg.dest,
                farebasis: seg.farebase,
                marketing_airline: seg.carrier,
                class: seg.bookingclass,
                arrival_date: formatDate(seg.arr)
              };
            })
          };
        })
      }
    };

    // The booking.lan.com url as of 2/27/2020 needs to be http instead of https. Fortunately, it does redirect you
    // to https://ssl.lan.com afterwards, but the booking link seems to be more successful than starting with ssl
    return (
      `http://booking.lan.com/cgi-bin/compra/paso4.cgi?forced_home=${edition}&sessionParameters=` +
      encodeURIComponent(JSON.stringify(parameters))
    );
  };
  var url = createUrl(mptUserSettings.laEdition);
  if (!url) {
    return;
  }
  var extra =
    ' <span class="pt-hover-container">[+]<span class="pt-hover-menu">';
  extra += laEditions
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
    title: "LATAM",
    extra
  };
}

function formatDate(date) {
  return `${date.year}-${to2digits(date.month)}-${to2digits(date.day)}`;
}

register("airlines", printLA);
registerSetting("LATAM", "laEdition", laEditions, "en/us");
