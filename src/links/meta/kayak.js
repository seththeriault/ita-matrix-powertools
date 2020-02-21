import { getCabin } from "../../settings/appSettings";
import mptUserSettings from "../../settings/userSettings";
import { registerLink, validatePaxcount } from "../../print/links";
import { currentItin, getCurrentSegs } from "../../parse/itin";
import { printNotification, to2digits } from "../../utils";

const editions = [
  { name: "Kayak.ae", host: "www.kayak.ae" },
  { name: "Kayak.ar", host: "www.kayak.com.ar" },
  { name: "Kayak.at", host: "www.kayak.cat" },
  { name: "Kayak.au", host: "www.kayak.com.au" },
  { name: "Kayak.br", host: "www.kayak.com.br" },
  { name: "Kayak.ca", host: "www.ca.kayak.com" },
  { name: "Kayak.ch", host: "www.kayak.ch" },
  { name: "Kayak.cl", host: "www.kayak.cl" },
  { name: "Kayak.cn", host: "www.cn.kayak.com" },
  { name: "Kayak.co", host: "www.kayak.com.co" },
  { name: "Kayak.com", host: "www.kayak.com" },
  { name: "Kayak.de", host: "www.kayak.de" },
  { name: "Kayak.dk", host: "www.kayak.dk" },
  { name: "Kayak.es", host: "www.es.kayak.com" },
  { name: "Kayak.es", host: "www.kayak.es" },
  { name: "Kayak.fi", host: "www.fi.kayak.com" },
  { name: "Kayak.fr", host: "www.kayak.fr" },
  { name: "Kayak.gr", host: "www.gr.kayak.com" },
  { name: "Kayak.hk", host: "www.kayak.com.hk" },
  { name: "Kayak.id", host: "www.kayak.co.id" },
  { name: "Kayak.ie", host: "www.kayak.ie" },
  { name: "Kayak.in", host: "www.kayak.co.in" },
  { name: "Kayak.it", host: "www.kayak.it" },
  { name: "Kayak.jp", host: "www.kayak.co.jp" },
  { name: "Kayak.kr", host: "www.kayak.co.kr" },
  { name: "Kayak.mx", host: "www.kayak.com.mx" },
  { name: "Kayak.my", host: "www.kayak.com.my" },
  { name: "Kayak.nl", host: "www.kayak.nl" },
  { name: "Kayak.no", host: "www.kayak.no" },
  { name: "Kayak.nz", host: "www.nz.kayak.com" },
  { name: "Kayak.pe", host: "www.kayak.com.pe" },
  { name: "Kayak.pl", host: "www.kayak.pl" },
  { name: "Kayak.pt", host: "www.kayak.pt" },
  { name: "Kayak.ru", host: "www.kayak.ru" },
  { name: "Kayak.se", host: "www.kayak.se" },
  { name: "Kayak.sg", host: "www.kayak.sg" },
  { name: "Kayak.th", host: "www.kayak.co.th" },
  { name: "Kayak.tr", host: "www.kayak.com.tr" },
  { name: "Kayak.tw", host: "www.tw.kayak.com" },
  { name: "Kayak.uk", host: "www.kayak.co.uk" },
  { name: "Kayak.vn", host: "www.vn.kayak.com" },
  { name: "Kayak.za", host: "www.za.kayak.com" }
];

const cabins = ["economy", "premium", "business", "first"];

function print(method) {
  //example https://www.Kayak.ru/flights/MOW-CPH...OW/2016-05-20/
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

  const createUrl = function(host) {
    let url =
      `https://${host}/flights/` +
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

  var url = createUrl("kayak.com");
  if (!url) {
    return;
  }

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
    title: "Kayak",
    desc:
      mptUserSettings.language == "de"
        ? `Benutze ${segs.length} Segment(e)`
        : `Based on ${segs.length} segment(s)`,
    extra
  };
}

registerLink("meta", () => print(0));
registerLink("meta", () => print(1));
