import mptUserSettings from "../../settings/userSettings";
import { printNotification, to2digits, monthnumberToName } from "../../utils";
import { validatePax, register } from "..";
import { currentItin, getCurrentSegs } from "../../parse/itin";
import { getCabin } from "../../settings/appSettings";

var cabins = ["0", "0", "1", "2"];

function print() {
  if (
    !mptUserSettings.showAllAirlines &&
    !currentItin.carriers.some(cxr => cxr === "EK")
  ) {
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
    printNotification("Error: Failed to validate Passengers in printEK");
    return;
  }

  let desc = "";
  let url = `https://www.emirates.com/sessionhandler.aspx?pageurl=/IBE.aspx&pub=/us/english&j=f&section=IBE&j=t&seldcity1=${
    currentItin.itin[0].orig
  }&selacity1=${currentItin.itin[0].dest}&selddate1=${formatDate(
    currentItin.itin[0].dep
  )}&seladults=${pax.adults}&selofw=0&selteenager=0&selchildren=${
    pax.children.length
  }&selinfants=${pax.infLap}&selcabinclass=${
    cabins[getCabin(Math.max(...getCurrentSegs().map(seg => seg.cabin)))]
  }&selcabinclass1=${
    cabins[getCabin(Math.max(...currentItin.itin[0].seg.map(seg => seg.cabin)))]
  }&showsearch=false&showTeenager=false&showOFW=false&chkFlexibleDates=false&resultby=0&multiCity=`;
  if (currentItin.itin.length == 1) {
    url += `&seladate1=&TID=OW`;
  } else if (
    currentItin.itin.length == 2 &&
    currentItin.itin[0].orig == currentItin.itin[1].dest &&
    currentItin.itin[0].dest == currentItin.itin[1].orig
  ) {
    url += `&seladate1=${formatDate(currentItin.itin[1].dep)}&TID=SB`;
  } else {
    // open-jaw and multi-city for mobile only (TID=AS)
    url =
      `https://mobile.emirates.com/us/english/CAB/IBE/searchResults.xhtml?cugoDisabledCabinClass=true&flexiDate=false&searchType=MC&classTypeRadioMulti=0&bookingType=Revenue&originInterlineFlag=false&destInterlineFlag=false&totalAdults=${pax.adults}&totalTeens=0&totalChildren=${pax.children.length}&totalInfants=${pax.infLap}&` +
      currentItin.itin
        .map(
          itin =>
            `fromCity=${itin.orig}&toCity=${itin.dest}&classType=${
              cabins[getCabin(Math.max(...itin.seg.map(seg => seg.cabin)))]
            }&departDay=${to2digits(itin.dep.day)}&departMonth=${to2digits(
              itin.dep.month
            )}&departYear=${itin.dep.year}&returnDay=&returnMonth=&returnYear=`
        )
        .join("&");
    desc = "Mobile (or resize browser)";
  }

  return {
    url,
    title: "Emirates",
    desc
  };
}

function formatDate(date) {
  return `${to2digits(date.day)}-${monthnumberToName(date.month)}-${to2digits(
    date.year
  )}`;
}

register("airlines", print);
