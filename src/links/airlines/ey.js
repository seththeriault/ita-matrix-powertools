import { printNotification, to2digits, to4digitTime } from "../../utils";
import { registerLink } from "../../print/links";
import { currentItin } from "../../parse/itin";
import { getCabin } from "../../settings/appSettings";
import { validatePax, anyCarriers } from "..";

const cabins = ["ECONOMY", "ECONOMY", "BUSINESS", "FIRST"];

function printEY() {
  if (!anyCarriers("EY")) {
    return;
  }

  var createUrl = function() {
    var pax = validatePax({
      maxPaxcount: 9,
      countInf: false,
      childAsAdult: 12,
      sepInfSeat: false,
      childMinAge: 2
    });
    if (!pax) {
      printNotification("Error: Failed to validate Passengers in printEY");
      return;
    }

    let url =
      "https://booking.etihad.com/SSW2010/EYEY/webqtrip.html?journeySpan=MC";
    url += `&numAdults=${pax.adults}`;
    url += `&numChildren=${pax.children.length}`;
    url += `&numInfants=${pax.infLap}`;
    url += `&advertisedFare=${currentItin.price}`;
    url += `&currency=${currentItin.cur || "USD"}`;

    let segnum = 0;
    currentItin.itin.forEach((itin, legnum) => {
      itin.seg.forEach(seg => {
        url += `&ms[${segnum}].from=${seg.orig}`;
        url += `&ms[${segnum}].to=${seg.dest}`;
        url += `&ms[${segnum}].departure=${seg.dep.year}-${to2digits(
          seg.dep.month
        )}-${to2digits(seg.dep.day)}T${to4digitTime(seg.dep.time24)}`;
        url += `&ms[${segnum}].arrival=${seg.arr.year}-${to2digits(
          seg.arr.month
        )}-${to2digits(seg.arr.day)}T${to4digitTime(seg.arr.time24)}`;
        url += `&ms[${segnum}].leg=${legnum}`;
        url += `&ms[${segnum}].cbnClass=${cabins[getCabin(seg.cabin)]}`;

        segnum++;
      });
    });

    return url;
  };

  var url = createUrl();
  if (!url) {
    return;
  }

  return {
    url,
    title: "Etihad"
  };
}

registerLink("airlines", printEY);
