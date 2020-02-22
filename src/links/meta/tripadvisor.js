import { getCabin } from "../../settings/appSettings";
import mptUserSettings from "../../settings/userSettings";
import { register, validatePax } from "..";
import { currentItin, getCurrentSegs } from "../../parse/itin";
import { printNotification, to2digits } from "../../utils";

const editions = [
  { name: "Arabic", host: "ar.tripadvisor.com" },
  { name: "Argentina", host: "www.tripadvisor.com.ar" },
  { name: "Australia", host: "www.tripadvisor.com.au" },
  { name: "Austria", host: "www.tripadvisor.at" },
  { name: "Belgium", host: "fr.tripadvisor.be" },
  { name: "Belgium", host: "www.tripadvisor.be" },
  { name: "Brazil", host: "www.tripadvisor.com.br" },
  { name: "Canada (English)", host: "www.tripadvisor.ca" },
  { name: "Canada (French)", host: "fr.tripadvisor.ca" },
  { name: "Chile", host: "www.tripadvisor.cl" },
  { name: "China", host: "www.tripadvisor.cn" },
  { name: "Chinese International", host: "cn.tripadvisor.com" },
  { name: "Colombia", host: "www.tripadvisor.co" },
  { name: "Czech Republic", host: "www.tripadvisor.cz" },
  { name: "Denmark", host: "www.tripadvisor.dk" },
  { name: "Egypt", host: "www.tripadvisor.com.eg" },
  { name: "Finland", host: "www.tripadvisor.fi" },
  { name: "France", host: "www.tripadvisor.fr" },
  { name: "Germany", host: "www.tripadvisor.de" },
  { name: "Greece", host: "www.tripadvisor.com.gr" },
  { name: "Hong Kong", host: "en.tripadvisor.com.hk" },
  { name: "Hong Kong", host: "www.tripadvisor.com.hk" },
  { name: "Hungary", host: "www.tripadvisor.co.hu" },
  { name: "India", host: "www.tripadvisor.in" },
  { name: "Indonesia", host: "www.tripadvisor.co.id" },
  { name: "Ireland", host: "www.tripadvisor.ie" },
  { name: "Israel", host: "www.tripadvisor.co.il" },
  { name: "Italy", host: "www.tripadvisor.it" },
  { name: "Japan", host: "www.tripadvisor.jp" },
  { name: "Malaysia", host: "www.tripadvisor.com.my" },
  { name: "Mexico", host: "www.tripadvisor.com.mx" },
  { name: "New Zealand", host: "www.tripadvisor.co.nz" },
  { name: "Norway", host: "no.tripadvisor.com" },
  { name: "Peru", host: "www.tripadvisor.com.pe" },
  { name: "Philippines", host: "www.tripadvisor.com.ph" },
  { name: "Poland", host: "pl.tripadvisor.com" },
  { name: "Portugal", host: "www.tripadvisor.pt" },
  { name: "Russia", host: "www.tripadvisor.ru" },
  { name: "Serbia", host: "www.tripadvisor.rs" },
  { name: "Singapore", host: "www.tripadvisor.com.sg" },
  { name: "Slovakia", host: "www.tripadvisor.sk" },
  { name: "South Africa", host: "www.tripadvisor.co.za" },
  { name: "South Korea", host: "www.tripadvisor.co.kr" },
  { name: "Spain", host: "www.tripadvisor.es" },
  { name: "Sweden", host: "www.tripadvisor.se" },
  { name: "Switzerland", host: "www.tripadvisor.ch" },
  { name: "Switzerland", host: "fr.tripadvisor.ch" },
  { name: "Switzerland", host: "it.tripadvisor.ch" },
  { name: "Taiwan", host: "www.tripadvisor.com.tw" },
  { name: "Thailand", host: "th.tripadvisor.com" },
  { name: "The Netherlands", host: "www.tripadvisor.nl" },
  { name: "Turkey", host: "www.tripadvisor.com.tr" },
  { name: "United Kingdom", host: "www.tripadvisor.co.uk" },
  { name: "United States", host: "www.tripadvisor.com" },
  { name: "Venezuela", host: "www.tripadvisor.com.ve" },
  { name: "Vietnam", host: "www.tripadvisor.com.vn" }
];

const cabins = ["0", "3", "1", "2"];

function print(method) {
  // method: 0 = based on leg; 1 = based on segment
  const segs = !method ? currentItin.itin : getCurrentSegs();
  if (method && currentItin.itin.length === segs.length) return;

  const pax = validatePax({
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

  const nonstop = method ? "yes" : "no";

  const createUrl = function(host) {
    let url = `https://${host}/CheapFlightsSearchResults?&cos=${cabin}&nonstop=${nonstop}`;

    let paxNum = 0;

    const addPax = age => (url += `&pax${paxNum++}=${age}`);

    Array.apply(null, { length: pax.adults }).forEach(o => addPax("a"));
    Array.apply(null, { length: pax.infLap }).forEach(o => addPax(0));
    pax.children.forEach(age => addPax(age));

    url +=
      "&" +
      segs
        .map(
          (seg, i) =>
            `date${i * 2}=${seg.dep.year}${to2digits(seg.dep.month)}${to2digits(
              seg.dep.day
            )}&airport${i * 2}=${seg.orig}&nearby${i * 2}=no&airport${i * 2 +
              1}=${seg.dest}&nearby${i * 2 + 1}=no`
        )
        .join("&");

    return url;
  };
  const url = createUrl("www.tripadvisor.com");
  let extra =
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
    title: "Tripadvisor",
    desc:
      mptUserSettings.language == "de"
        ? `Benutze ${segs.length} Segment(e)`
        : `Based on ${segs.length} segment(s)`,
    extra
  };
}

register("meta", () => print(0));
register("meta", () => print(1));
