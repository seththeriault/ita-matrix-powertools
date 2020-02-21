import { getCabin } from "../../settings/appSettings";
import mptUserSettings from "../../settings/userSettings";
import { registerLink, validatePaxcount } from "../../print/links";
import { currentItin, getCurrentSegs } from "../../parse/itin";
import { printNotification, to2digits } from "../../utils";

const editions = [
  { name: "Momondo.ar", host: "www.momondo.com.ar" },
  { name: "Momondo.at", host: "www.momondo.at" },
  { name: "Momondo.au", host: "www.momondo.com.au" },
  { name: "Momondo.be", host: "www.momondo.be" },
  { name: "Momondo.br", host: "www.momondo.com.br" },
  { name: "Momondo.by", host: "www.momondo.by" },
  { name: "Momondo.ca", host: "www.momondo.ca" },
  { name: "Momondo.ch", host: "www.momondo.ch" },
  { name: "Momondo.cl", host: "www.momondo.cl" },
  { name: "Momondo.cn", host: "www.cn.momondo.com" },
  { name: "Momondo.co", host: "www.momondo.com.co" },
  { name: "Momondo.cz", host: "www.momondo.cz" },
  { name: "Momondo.de", host: "www.momondo.de" },
  { name: "Momondo.dk", host: "www.momondo.dk" },
  { name: "Momondo.ee", host: "www.momondo.ee" },
  { name: "Momondo.es", host: "www.momondo.es" },
  { name: "Momondo.fi", host: "www.momondo.fi" },
  { name: "Momondo.fr", host: "www.momondo.fr" },
  { name: "Momondo.hk", host: "www.momondo.hk" },
  { name: "Momondo.ie", host: "www.momondo.ie" },
  { name: "Momondo.in", host: "www.momondo.in" },
  { name: "Momondo.it", host: "www.momondo.it" },
  { name: "Momondo.kz", host: "www.momondo.kz" },
  { name: "Momondo.mx", host: "www.momondo.mx" },
  { name: "Momondo.nl", host: "www.momondo.nl" },
  { name: "Momondo.no", host: "www.momondo.no" },
  { name: "Momondo.nz", host: "www.momondo.co.nz" },
  { name: "Momondo.om", host: "www.momondo.com" },
  { name: "Momondo.pe", host: "www.momondo.com.pe" },
  { name: "Momondo.pl", host: "www.momondo.pl" },
  { name: "Momondo.pt", host: "www.momondo.pt" },
  { name: "Momondo.ro", host: "www.momondo.ro" },
  { name: "Momondo.ru", host: "www.momondo.ru" },
  { name: "Momondo.se", host: "www.momondo.se" },
  { name: "Momondo.tr", host: "www.momondo.com.tr" },
  { name: "Momondo.tw", host: "www.momondo.tw" },
  { name: "Momondo.ua", host: "www.momondo.ua" },
  { name: "Momondo.uk", host: "www.momondo.co.uk" },
  { name: "Momondo.za", host: "www.momondo.co.za" }
];

var cabins = ["economy", "premium", "business", "first"];

function print(method) {
  //example https://www.Momondo.ru/flightsearch/?...false&NA=false
  //pax # &AD=2&CA=0,8 – not working with children (total amount of adults + kids goes to adult)
  // method: 0 = based on leg; 1 = based on segment
  const segs = !method ? currentItin.itin : getCurrentSegs();
  if (method && currentItin.itin.length === segs.length) return;

  var pax = validatePaxcount({
    maxPaxcount: 9,
    countInf: false,
    childAsAdult: 12,
    sepInfSeat: true,
    childMinAge: 2
  });
  if (!pax) {
    printNotification("Error: Failed to validate Passengers in printOvago");
    return;
  }

  const cabin =
    cabins[getCabin(Math.min(...getCurrentSegs().map(seg => seg.cabin)))];

  var createUrl = function(host) {
    let url =
      `https://${host}/flight-search/` +
      segs
        .map(
          seg =>
            `${seg.orig}-${seg.dest}/${seg.dep.year}-${to2digits(
              seg.dep.month
            )}-${to2digits(seg.dep.day)}`
        )
        .join("/");

    if (pax.adults > 1 || pax.children.length || pax.infSeat || pax.infLap) {
      url += `/${currentItin.numPax}adults`;
    }

    if (pax.children.length || pax.infSeat || pax.infLap) {
      url += "/children";
      for (let i = 0; i < pax.infSeat; i++) {
        url += "-1S";
      }
      for (let i = 0; i < pax.infLap; i++) {
        url += "-1L";
      }
      for (let i = 0; i < pax.children.length; i++) {
        url += "-11";
      }
    }

    url += "/" + cabin;

    return url;
  };

  var url = createUrl("www.momondo.com");
  var extra =
    ' <span class="pt-hover-container">[+]<span class="pt-hover-menu">';
  extra += editions
    .map(function(obj, i) {
      return (
        '<a href="' +
        createUrl(obj.host) +
        '" target="_blank">' +
        obj.name +
        "</a>"
      );
    })
    .join("<br/>");
  extra += "</span></span>";

  return {
    url,
    title: "Momondo",
    desc:
      mptUserSettings.language == "de"
        ? `Benutze ${segs.length} Segment(e)`
        : `Based on ${segs.length} segment(s)`,
    extra
  };
}

registerLink("meta", () => print(0));
registerLink("meta", () => print(1));
