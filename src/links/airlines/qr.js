import { printNotification, to2digits } from "../../utils";
import { validatePax, register, allCarriers } from "..";
import { currentItin, getCurrentSegs } from "../../parse/itin";
import appSettings, { getCabin } from "../../settings/appSettings";

var cabins = ["E", "E", "B", "F"];

function print() {
  if (!allCarriers("QR")) {
    return;
  }

  const pax = validatePax({
    maxPaxcount: 9,
    countInf: false,
    childAsAdult: 12,
    sepInfSeat: false,
    childMinAge: 2
  });
  if (!pax) {
    printNotification("Error: Failed to validate Passengers in printQR");
    return;
  }

  const cabin =
    cabins[getCabin(Math.min(...getCurrentSegs().map(seg => seg.cabin)))];

  const tripType = currentItin.itin.length > 1 ? "M" : "O";

  let url = `https://booking.qatarairways.com/nsp/views/showBooking.action?widget=MLC&selLang=${appSettings.itaLanguage}&tripType=${tripType}&bookingClass=${cabin}&adults=${pax.adults}&children=${pax.children.length}&infants=${pax.infLap}&isMetaSearch=true&`;
  url += currentItin.itin
    .map((itin, i) => {
      let qs = `fromStation=${itin.orig}&toStation=${itin.dest}&departing=${
        itin.dep.year
      }-${to2digits(itin.dep.month)}-${to2digits(itin.dep.day)}`;
      if (i <= 1)
        qs += `&${i === 0 ? "out" : "in"}boundFltNumber=${itin.seg
          .map(seg => seg.fnr)
          .join(",")}`;
      return qs;
    })
    .join("&");
  if (currentItin.itin.length <= 2) url += "&price=0";
  return {
    url,
    title: "Qatar Airways"
  };
}

register("airlines", print);
