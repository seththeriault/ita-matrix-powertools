import { printNotification, to2digits } from "../../utils";
import { validatePax, register } from "..";
import { currentItin, getCurrentSegs } from "../../parse/itin";
import { getCabin } from "../../settings/appSettings";

const eDreams = [
  { name: "eDreams.com", domain: "www.edreams.com" },
  { name: "eDreams.au", domain: "www.edreams.com.au" },
  { name: "eDreams.br", domain: "www.edreams.com.br" },
  { name: "eDreams.ca", domain: "ca.edreams.com" },
  { name: "eDreams.ch", domain: "www.edreams.ch" },
  { name: "eDreams.cl", domain: "cl.edreams.com" },
  { name: "eDreams.cn", domain: "cn.edreams.com" },
  { name: "eDreams.co", domain: "co.edreams.com" },
  { name: "eDreams.co.uk", domain: "www.edreams.co.uk" },
  { name: "eDreams.com.ar", domain: "www.edreams.com.ar" },
  { name: "eDreams.com.mx", domain: "www.edreams.com.mx" },
  { name: "eDreams.com.ru", domain: "www.edreams.com.ru" },
  { name: "eDreams.com.tr", domain: "www.edreams.com.tr" },
  { name: "eDreams.de", domain: "www.edreams.de" },
  { name: "eDreams.es", domain: "www.edreams.es" },
  { name: "eDreams.fr", domain: "www.edreams.fr" },
  { name: "eDreams.gr", domain: "www.edreams.gr" },
  { name: "eDreams.hk", domain: "www.edreams.hk" },
  { name: "eDreams.id", domain: "id.edreams.com" },
  { name: "eDreams.in", domain: "www.edreams.in" },
  { name: "eDreams.it", domain: "www.edreams.it" },
  { name: "eDreams.jp", domain: "www.edreams.jp" },
  { name: "eDreams.ma", domain: "www.edreams.ma" },
  { name: "eDreams.net", domain: "www.edreams.net" },
  { name: "eDreams.nl", domain: "nl.edreams.com" },
  { name: "eDreams.nz", domain: "nz.edreams.com" },
  { name: "eDreams.pe", domain: "www.edreams.pe" },
  { name: "eDreams.ph", domain: "www.edreams.ph" },
  { name: "eDreams.pt", domain: "www.edreams.pt" },
  { name: "eDreams.sg", domain: "sg.edreams.com" },
  { name: "eDreams.th", domain: "th.edreams.com" },
  { name: "eDreams.za", domain: "za.edreams.com" }
];

const opodo = [
  { name: "Opodo.com", domain: "www.opodo.com" },
  { name: "Opodo.at", domain: "www.opodo.at" },
  { name: "Opodo.be", domain: "www.opodo.be" },
  { name: "Opodo.ch", domain: "www.opodo.ch" },
  { name: "Opodo.co.uk", domain: "www.opodo.co.uk" },
  { name: "Opodo.com.au", domain: "www.opodo.com.au" },
  { name: "Opodo.de", domain: "www.opodo.de" },
  { name: "Opodo.dk", domain: "www.opodo.dk" },
  { name: "Opodo.es", domain: "www.opodo.es" },
  { name: "Opodo.fi", domain: "www.opodo.fi" },
  { name: "Opodo.fr", domain: "www.opodo.fr" },
  { name: "Opodo.it", domain: "www.opodo.it" },
  { name: "Opodo.nl", domain: "www.opodo.nl" },
  { name: "Opodo.no", domain: "www.opodo.no" },
  { name: "Opodo.pl", domain: "www.opodo.pl" },
  { name: "Opodo.pt", domain: "www.opodo.pt" },
  { name: "Opodo.se", domain: "www.opodo.se" }
];

const travellink = [
  { name: "Travellink.com", domain: "www.travellink.com" },
  { name: "Travellink.de", domain: "www.travellink.de" },
  { name: "Travellink.dk", domain: "www.travellink.dk" },
  { name: "Travellink.fi", domain: "www.travellink.fi" },
  { name: "Travellink.is", domain: "www.travellink.is" },
  { name: "Travellink.no", domain: "www.travellink.no" },
  { name: "Travellink.se", domain: "www.travellink.se" }
];

const cabins = ["TOURIST", "PREMIUM_ECONOMY", "BUSINESS", "FIRST"];

function printEdreams(title, editions) {
  var pax = validatePax({
    maxPaxcount: 9,
    countInf: false,
    childAsAdult: 12,
    sepInfSeat: false,
    childMinAge: 2
  });
  if (!pax) {
    printNotification("Error: Failed to validate Passengers in printEdreams");
    return;
  }

  const cabin =
    cabins[getCabin(Math.min(...getCurrentSegs().map(seg => seg.cabin)))];

  var createUrl = function(domain) {
    const deeplink = `/results/type=M;${currentItin.itin
      .map(
        (itin, i) =>
          `dep${i}=${itin.dep.year}-${to2digits(itin.dep.month)}-${to2digits(
            itin.dep.day
          )};from${i}=${itin.orig};to${i}=${itin.dest}`
      )
      .join(";")};class=${cabin};adults=${pax.adults};children=${
      pax.children.length
    };infants=${
      pax.infLap
    };collectionmethod=false;airlinescodes=false;internalSearch=true`;

    const segKeys = currentItin.itin
      .map(
        (itin, i) =>
          `segmentKey${i}=0,${itin.seg
            .map(seg => seg.carrier + seg.fnr)
            .join(",")}`
      )
      .join("&");

    return `https://${domain}/travel/?landingPageType=TEST_AB&searchId=${new Date().getTime()}&deeplink=${deeplink}&fareItineraryKey=0,1A&${segKeys}&searchMainProductTypeName=FLIGHT`;
  };

  var url = createUrl(editions[0].domain);
  if (!url) return;

  var extra =
    ' <span class="pt-hover-container">[+]<span class="pt-hover-menu">';
  extra += editions
    .map(function(obj, i) {
      return (
        '<a href="' +
        createUrl(obj.domain) +
        '" target="_blank">' +
        obj.name +
        "</a>"
      );
    })
    .join("<br/>");
  extra += "</span></span>";

  return {
    url,
    title,
    extra
  };
}

register("otas", () => printEdreams("eDreams", eDreams));
register("otas", () => printEdreams("Opodo", opodo));
register("otas", () => printEdreams("Travellink", travellink));
