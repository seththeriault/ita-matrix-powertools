import mptUserSettings from "../../settings/userSettings";
import { printNotification, to2digits } from "../../utils";
import { register, validatePax } from "..";
import { currentItin, getTripType } from "../../parse/itin";
import { getCabin } from "../../settings/appSettings";

const travix = [
  {
    name: "CheapTickets.nl",
    value: "www.cheaptickets.nl",
    pos: "NL",
    cur: "EUR"
  },
  {
    name: "CheapTickets.be",
    value: "www.cheaptickets.be",
    pos: "BE",
    cur: "EUR"
  },
  {
    name: "CheapTickets.de",
    value: "www.cheaptickets.de",
    pos: "DE",
    cur: "EUR"
  },
  {
    name: "CheapTickets.ch",
    value: "www.cheaptickets.ch",
    pos: "CH",
    cur: "CHF"
  },
  {
    name: "CheapTickets.sg",
    value: "www.cheaptickets.sg",
    pos: "SG",
    cur: "SGD"
  },
  {
    name: "CheapTickets.co.th",
    value: "www.cheaptickets.co.th",
    pos: "TH",
    cur: "THB"
  },
  {
    name: "CheapTickets.hk",
    value: "www.cheaptickets.hk",
    pos: "HK",
    cur: "HKD"
  },
  {
    name: "Vliegwinkel.nl",
    value: "www.vliegwinkel.nl",
    pos: "NL",
    cur: "EUR"
  },
  {
    name: "Vayama Argentina",
    value: "www.vayama.com/es_ar",
    pos: "AR",
    cur: "ARS"
  },
  {
    name: "Vayama Chile",
    value: "www.vayama.com/es_cl",
    pos: "CL",
    cur: "CLP"
  },
  {
    name: "Vayama Colombia",
    value: "www.vayama.com/es_co",
    pos: "CO",
    cur: "COP"
  },
  { name: "Vayama Ireland", value: "www.vayama.ie", pos: "IE", cur: "EUR" },
  {
    name: "Vayama Mexico",
    value: "www.vayama.com/es_mx",
    pos: "MX",
    cur: "MXN"
  },
  {
    name: "Vayama Panama",
    value: "www.vayama.com/es_pa",
    pos: "PA",
    cur: "USD"
  },
  { name: "Vayama USA", value: "www.vayama.com", pos: "US", cur: "USD" },
  {
    name: "Flugladen Austria",
    value: "www.flugladen.at",
    pos: "AT",
    cur: "EUR"
  },
  {
    name: "Flugladen Deutschland",
    value: "www.flugladen.de",
    pos: "DE",
    cur: "EUR"
  }
];

const budgetairs = [
  {
    name: "BudgetAir Australia",
    value: "www.budgetair.com/en_au",
    pos: "AU",
    cur: "AUD"
  },
  {
    name: "BudgetAir Belgium",
    value: "www.budgetair.be",
    pos: "BE",
    cur: "EUR"
  },
  {
    name: "BudgetAir Canada",
    value: "www.budgetair.com/en_ca",
    pos: "CA",
    cur: "CAD"
  },
  {
    name: "BudgetAir Denmark",
    value: "www.budgetair.dk",
    pos: "DK",
    cur: "DKK"
  },
  {
    name: "BudgetAir France",
    value: "www.budgetair.fr",
    pos: "FR",
    cur: "EUR"
  },
  { name: "BudgetAir India", value: "www.budgetair.in", pos: "IN", cur: "INR" },
  {
    name: "BudgetAir Indonesia",
    value: "www.budgetair.com/id_id",
    pos: "ID",
    cur: "IDR"
  },
  { name: "BudgetAir Italy", value: "www.budgetair.it", pos: "IT", cur: "EUR" },
  {
    name: "BudgetAir Japan",
    value: "www.budgetair.com/jp",
    pos: "JP",
    cur: "JPY"
  },
  {
    name: "BudgetAir Korea",
    value: "www.budgetair.com/ko_kr",
    pos: "KR",
    cur: "KRW"
  },
  {
    name: "BudgetAir Latvia",
    value: "www.budgetair.lv",
    pos: "LV",
    cur: "EUR"
  },
  {
    name: "BudgetAir Malaysia",
    value: "www.budgetair.com/en_my",
    pos: "MY",
    cur: "MYR"
  },
  {
    name: "BudgetAir Netherlands",
    value: "www.budgetair.nl",
    pos: "NL",
    cur: "EUR"
  },
  {
    name: "BudgetAir New Zealand",
    value: "www.budgetair.com/en_nz",
    pos: "NZ",
    cur: "NZD"
  },
  {
    name: "BudgetAir Philippines",
    value: "www.budgetair.com/en_ph",
    pos: "PH",
    cur: "PHP"
  },
  {
    name: "BudgetAir Poland",
    value: "www.budgetair.com/pl_pl",
    pos: "PL",
    cur: "PLN"
  },
  {
    name: "BudgetAir Portugal",
    value: "www.budgetair.pt",
    pos: "PT",
    cur: "EUR"
  },
  {
    name: "BudgetAir Saudi Arabia",
    value: "www.budgetair.com/en_sa",
    pos: "SA",
    cur: "SAR"
  },
  {
    name: "BudgetAir South Africa",
    value: "www.budgetair.com/en_za",
    pos: "ZA",
    cur: "ZAR"
  },
  { name: "BudgetAir Spain", value: "www.budgetair.es", pos: "ES", cur: "EUR" },
  {
    name: "BudgetAir Sweden",
    value: "www.budgetair.se",
    pos: "SE",
    cur: "SEK"
  },
  {
    name: "BudgetAir Arab Emirates",
    value: "www.budgetair.com/en_ae",
    pos: "AE",
    cur: "AED"
  },
  {
    name: "BudgetAir Taiwan",
    value: "www.budgetair.com.tw",
    pos: "TW",
    cur: "TWD"
  },
  {
    name: "BudgetAir Turkey",
    value: "www.budgetair.com/tr_tr",
    pos: "TR",
    cur: "TRY"
  },
  {
    name: "BudgetAir United Kingdom",
    value: "www.budgetair.co.uk",
    pos: "GB",
    cur: "GBP"
  },
  {
    name: "BudgetAir Vietnam",
    value: "www.budgetair.com/vn",
    pos: "VN",
    cur: "VND"
  }
];

const cabins = ["Economy", "PremiumEconomy", "Business", "First"];

function print(displayName, editions, startValue) {
  var pax = validatePax({
    maxPaxcount: 9,
    countInf: true,
    childAsAdult: 12,
    sepInfSeat: false,
    childMinAge: 2
  });
  if (!pax) {
    printNotification("Error: Failed to validate Passengers in edestinos");
    return;
  }

  var createUrl = function(host, pos, cur) {
    let url = `https://${host}/checkout/googleflights?PointOfSaleCountry=${pos}&UserCurrency=${cur}&DisplayedPrice=${
      currentItin.price
    }&DisplayedPriceCurrency=${cur}&UserLanguage=${mptUserSettings.language ||
      "en"}&TripType=${getTripType("OneWay", "RoundTrip", "MultiCity")}`;
    url += "&UserLanguage=" + mptUserSettings.language || "en";
    url += "&Adult=" + pax.adults;
    url += "&Child=" + pax.children.length;
    url += "&InfantLap=" + pax.infLap;

    let j = 0;
    currentItin.itin.forEach((itin, i) => {
      const slices = [];

      itin.seg.forEach(seg => {
        j++;
        slices.push(j);

        url += `&Cabin${j}=` + cabins[getCabin(seg.cabin)];
        url += `&Carrier${j}=` + seg.carrier;
        url += `&Origin${j}=` + seg.orig;
        url += `&Destination${j}=` + seg.dest;
        url += `&BookingCode${j}=` + seg.bookingclass;
        url += `&FlightNumber${j}=` + seg.fnr;
        url += `&DepartureDate${j}=${seg.dep.year}-${to2digits(
          seg.dep.month
        )}-${to2digits(seg.dep.day)}`;
        url += `&FareBasis${j}=` + seg.farebase;
      });

      url += `&Slice${i + 1}=` + slices.join(",");
    });

    return url;
  };

  var startEdition = editions.find(e => e.value === startValue);
  var url = createUrl(startEdition.value, startEdition.pos, startEdition.cur);
  var extra =
    ' <span class="pt-hover-container">[+]<span class="pt-hover-menu">';
  extra += editions
    .map(function(obj, i) {
      return (
        '<a href="' +
        createUrl(obj.value, obj.pos, obj.cur) +
        '" target="_blank">' +
        obj.name +
        "</a>"
      );
    })
    .join("<br/>");
  extra += "</span></span>";

  return {
    url,
    title: displayName,
    extra
  };
}

register("otas", () => print("Vayama", travix, "www.vayama.com"));
register("otas", () => print("BudgetAir", budgetairs, "www.budgetair.nl"));
