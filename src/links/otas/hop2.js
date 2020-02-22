import { printNotification, to2digits } from "../../utils";
import { validatePax, register } from "..";
import { currentItin, getCurrentSegs } from "../../parse/itin";
import { getCabin } from "../../settings/appSettings";

const editions = [
  { title: "Ovago", host: "ovago.com" },
  { title: "Wowfare", host: "wowfare.com" }
];

const cabins = ["Y", "S", "C", "F"];

function print() {
  var pax = validatePax({
    maxPaxcount: 9,
    countInf: false,
    childAsAdult: 12,
    sepInfSeat: false,
    childMinAge: 2
  });
  if (!pax) {
    printNotification("Error: Failed to validate Passengers in printHop2");
    return;
  }

  const cabin =
    cabins[getCabin(Math.min(...getCurrentSegs().map(seg => seg.cabin)))];

  const segs = getCurrentSegs();
  const search = `OSKDCR*${cabin}${pax.adults}${pax.children.length}${
    pax.infSeat
  }0/${currentItin.itin
    .map(
      itin =>
        itin.orig +
        itin.dest +
        `${itin.dep.year}-${to2digits(itin.dep.month)}-${to2digits(
          itin.dep.day
        )}`
    )
    .join("/")}*${segs[segs.length - 1].carrier}~#${segs
    .map(seg => seg.carrier + seg.fnr)
    .join("#")}`;

  const createUrl = function(host) {
    return `https://${host}/ms?key=1_${btoa(search)}`;
  };

  var url = createUrl("hop2.com");
  if (!url) return;

  let extra =
    ' <span class="pt-hover-container">[+]<span class="pt-hover-menu">';
  extra += editions
    .map(function(obj, i) {
      return (
        '<a href="' +
        createUrl(obj.host) +
        '" target="_blank">' +
        obj.title +
        "</a>"
      );
    })
    .join("<br/>");
  extra += "</span></span>";

  return {
    url,
    title: "Hop2",
    extra
  };
}

register("otas", print);
