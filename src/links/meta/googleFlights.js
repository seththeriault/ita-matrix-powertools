import { register, validatePax } from "..";
import { currentItin, getCurrentSegs } from "../../parse/itin";
import { printNotification, to2digits } from "../../utils";
import { getCabin } from "../../settings/appSettings";

const cabins = ["", "p", "b", "f"];

function print() {
  var pax = validatePax({
    maxPaxcount: 9,
    countInf: false,
    childAsAdult: 12,
    sepInfSeat: true,
    childMinAge: 2
  });
  if (!pax) {
    printNotification(
      "Error: Failed to validate Passengers in printGoogleFlights"
    );
    return;
  }

  const cabin =
    cabins[getCabin(Math.min(...getCurrentSegs().map(seg => seg.cabin)))];

  const url =
    "https://www.google.com/flights/#flt=" +
    currentItin.itin
      .map(
        itin =>
          `${itin.orig}.${itin.dest}.${itin.dep.year}-${to2digits(
            itin.dep.month
          )}-${to2digits(itin.dep.day)}.${itin.seg
            .map(
              (seg, j) => `${seg.orig}${seg.dest}${j}${seg.carrier}${seg.fnr}`
            )
            .join("~")}`
      )
      .join("*") +
    `;c:${currentItin.cur || "USD"};px:${pax.adults},${pax.children.length},${
      pax.infLap
    },${pax.infSeat};sc:${cabin};tt:${
      currentItin.itin.length === 1 ? "o" : "m"
    }`;

  return {
    url,
    title: "Google Flights"
  };
}

register("meta", print);
