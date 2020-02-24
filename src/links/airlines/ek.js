import mptUserSettings, { registerSetting } from "../../settings/userSettings";
import { printNotification, to2digits, monthnumberToName } from "../../utils";
import { validatePax, register } from "..";
import { currentItin, getCurrentSegs } from "../../parse/itin";
import { getCabin } from "../../settings/appSettings";

const cabins = ["0", "0", "1", "2"];

const editions = [
  { name: "Arabic (AE)", value: "/ae/arabic" },
  { name: "Arabic (BH)", value: "/bh/arabic" },
  { name: "Arabic (DZ)", value: "/dz/arabic" },
  { name: "Arabic (EG)", value: "/eg/arabic" },
  { name: "Arabic (IQ)", value: "/iq/arabic" },
  { name: "Arabic (JO)", value: "/jo/arabic" },
  { name: "Arabic (KW)", value: "/kw/arabic" },
  { name: "Arabic (LB)", value: "/lb/arabic" },
  { name: "Arabic (LY)", value: "/ly/arabic" },
  { name: "Arabic (MA)", value: "/ma/arabic" },
  { name: "Arabic (OM)", value: "/om/arabic" },
  { name: "Arabic (QA)", value: "/qa/arabic" },
  { name: "Arabic (SA)", value: "/sa/arabic" },
  { name: "Arabic (SD)", value: "/sd/arabic" },
  { name: "Arabic (SY)", value: "/sy/arabic" },
  { name: "Arabic (YE)", value: "/ye/arabic" },
  { name: "Chinese (CN)", value: "/cn/chinese" },
  { name: "Chinese (HK)", value: "/hk/chinese" },
  { name: "Chinese (TW)", value: "/tw/chinese" },
  { name: "Czech (CZ)", value: "/cz/czech" },
  { name: "Danish (DK)", value: "/dk/danish" },
  { name: "Dutch (BE)", value: "/be/dutch" },
  { name: "Dutch (NL)", value: "/nl/dutch" },
  { name: "English (AF)", value: "/af/english" },
  { name: "English (AU)", value: "/au/english" },
  { name: "English (BD)", value: "/bd/english" },
  { name: "English (BG)", value: "/bg/english" },
  { name: "English (EE)", value: "/ee/english" },
  { name: "English (ET)", value: "/et/english" },
  { name: "English (FI)", value: "/fi/english" },
  { name: "English (GH)", value: "/gh/english" },
  { name: "English (Global)", value: "/global/english" },
  { name: "English (HR)", value: "/hr/english" },
  { name: "English (IE)", value: "/ie/english" },
  { name: "English (IN)", value: "/in/english" },
  { name: "English (IR)", value: "/ir/english" },
  { name: "English (IS)", value: "/is/english" },
  { name: "English (KE)", value: "/ke/english" },
  { name: "English (KH)", value: "/kh/english" },
  { name: "English (LK)", value: "/lk/english" },
  { name: "English (LT)", value: "/lt/english" },
  { name: "English (LV)", value: "/lv/english" },
  { name: "English (MM)", value: "/mm/english" },
  { name: "English (MT)", value: "/mt/english" },
  { name: "English (MU)", value: "/mu/english" },
  { name: "English (MV)", value: "/mv/english" },
  { name: "English (MY)", value: "/my/english" },
  { name: "English (NG)", value: "/ng/english" },
  { name: "English (NZ)", value: "/nz/english" },
  { name: "English (PH)", value: "/ph/english" },
  { name: "English (PK)", value: "/pk/english" },
  { name: "English (RO)", value: "/ro/english" },
  { name: "English (SC)", value: "/sc/english" },
  { name: "English (SG)", value: "/sg/english" },
  { name: "English (TZ)", value: "/tz/english" },
  { name: "English (UG)", value: "/ug/english" },
  { name: "English (UK)", value: "/uk/english" },
  { name: "English (US)", value: "/us/english" },
  { name: "English (ZA)", value: "/za/english" },
  { name: "English (ZM)", value: "/zm/english" },
  { name: "English (ZW)", value: "/zw/english" },
  { name: "French (CA)", value: "/ca/french" },
  { name: "French (CI)", value: "/ci/french" },
  { name: "French (FR)", value: "/fr/french" },
  { name: "French (GN)", value: "/gn/french" },
  { name: "French (SN)", value: "/sn/french" },
  { name: "French (TN)", value: "/tn/french" },
  { name: "German (AT)", value: "/at/german" },
  { name: "German (DE)", value: "/de/german" },
  { name: "Greek (CY)", value: "/cy/greek" },
  { name: "Greek (GR)", value: "/gr/greek" },
  { name: "Hungarian (HU)", value: "/hu/hungarian" },
  { name: "Indonesian (ID)", value: "/id/indonesian" },
  { name: "Italian (CH)", value: "/ch/italian" },
  { name: "Italian (IT)", value: "/it/italian" },
  { name: "Japanese (JP)", value: "/jp/japanese" },
  { name: "Korean (KR)", value: "/kr/korean" },
  { name: "Norwegian (NO)", value: "/no/norwegian" },
  { name: "Polish (PL)", value: "/pl/polish" },
  { name: "Portuguese (AO)", value: "/ao/portuguese" },
  { name: "Portuguese (BR)", value: "/br/portuguese" },
  { name: "Portuguese (PT)", value: "/pt/portuguese" },
  { name: "Russian (RU)", value: "/ru/russian" },
  { name: "Russian (UA)", value: "/ua/russian" },
  { name: "Spanish (AR)", value: "/ar/spanish" },
  { name: "Spanish (CL)", value: "/cl/spanish" },
  { name: "Spanish (CO)", value: "/co/spanish" },
  { name: "Spanish (EC)", value: "/ec/spanish" },
  { name: "Spanish (ES)", value: "/es/spanish" },
  { name: "Spanish (MX)", value: "/mx/spanish" },
  { name: "Spanish (PA)", value: "/pa/spanish" },
  { name: "Spanish (PE)", value: "/pe/spanish" },
  { name: "Spanish (UY)", value: "/uy/spanish" },
  { name: "Swedish (SE)", value: "/se/swedish" },
  { name: "Thai (TH)", value: "/th/thai" },
  { name: "Turkish (TR)", value: "/tr/turkish" },
  { name: "Vietnamese (VN)", value: "/vn/vietnamese" }
];

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
  const createUrl = function(edition) {
    let url = `https://www.emirates.com/sessionhandler.aspx?pageurl=/IBE.aspx&pub=${edition}&j=f&section=IBE&j=t&seldcity1=${
      currentItin.itin[0].orig
    }&selacity1=${currentItin.itin[0].dest}&selddate1=${formatDate(
      currentItin.itin[0].dep
    )}&seladults=${pax.adults}&selofw=0&selteenager=0&selchildren=${
      pax.children.length
    }&selinfants=${pax.infLap}&selcabinclass=${
      cabins[getCabin(Math.max(...getCurrentSegs().map(seg => seg.cabin)))]
    }&selcabinclass1=${
      cabins[
        getCabin(Math.max(...currentItin.itin[0].seg.map(seg => seg.cabin)))
      ]
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
        `https://mobile.emirates.com${edition}/CAB/IBE/searchResults.xhtml?cugoDisabledCabinClass=true&flexiDate=false&searchType=MC&classTypeRadioMulti=0&bookingType=Revenue&originInterlineFlag=false&destInterlineFlag=false&totalAdults=${pax.adults}&totalTeens=0&totalChildren=${pax.children.length}&totalInfants=${pax.infLap}&` +
        currentItin.itin
          .map(
            itin =>
              `fromCity=${itin.orig}&toCity=${itin.dest}&classType=${
                cabins[getCabin(Math.max(...itin.seg.map(seg => seg.cabin)))]
              }&departDay=${to2digits(itin.dep.day)}&departMonth=${to2digits(
                itin.dep.month
              )}&departYear=${
                itin.dep.year
              }&returnDay=&returnMonth=&returnYear=`
          )
          .join("&");
      desc = "Mobile (or resize browser)";
    }
    return url;
  };

  const url = createUrl(mptUserSettings.ekEdition);
  if (!url) {
    return;
  }
  let extra =
    ' <span class="pt-hover-container">[+]<span class="pt-hover-menu">';
  extra += editions
    .map(function(edition, i) {
      return (
        '<a href="' +
        createUrl(edition.value) +
        '" target="_blank">' +
        edition.name +
        "</a>"
      );
    })
    .join("<br/>");
  extra += "</span></span>";

  return {
    url,
    title: "Emirates",
    desc,
    extra
  };
}

function formatDate(date) {
  return `${to2digits(date.day)}-${monthnumberToName(date.month)}-${to2digits(
    date.year
  )}`;
}

register("airlines", print);
registerSetting("Emirates", "ekEdition", editions, "/global/english");
