import { printNotification, to2digits } from "../../utils";
import { validatePaxcount, registerLink } from "../../print/links";
import { currentItin, getCurrentSegs } from "../../parse/itin";
import { getCabin } from "../../settings/appSettings";

const cabins = ["Y", "S", "C", "F"];

function printOvago(title, host, cid) {
  var pax = validatePaxcount({
    maxPaxcount: 9,
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

  const segs = getCurrentSegs();
  const search = `${cid}*${cabin}${pax.adults}${pax.children.length}${
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

  let url = `https://${host}/ms?cid=${cid}&key=1_${btoa(search)}`;

  return {
    url,
    title
  };
}

registerLink("otas", () => printOvago("Ovago", "ovago.com", "OSKDCR"));
registerLink("otas", () => printOvago("Hop2", "hop2.com", "OSKDCR"));
registerLink("otas", () => printOvago("Wowfare", "wowfare.com", "OSKDCR"));
