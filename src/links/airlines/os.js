import {
  printNotification,
  to2digits,
  to4digitTime,
  to4digits,
  toDate,
  dayDiff
} from "../../utils";
import mptUserSettings, { registerSetting } from "../../settings/userSettings";
import { validatePax, register, anyCarriers } from "..";
import { currentItin } from "../../parse/itin";

const editions = [
  { value: "en", name: "English" },
  { value: "de", name: "Deutsch" },
  { value: "cs", name: "čeština" },
  { value: "fr", name: "Français" },
  { value: "it", name: "Italiano" },
  { value: "ja", name: "日本語" },
  { value: "ro", name: "Romana" },
  { value: "ru", name: "Русский" },
  { value: "uk", name: "Українська" },
  { value: "pl", name: "Polski" },
  { value: "sv", name: "Svenska" },
  { value: "es", name: "Español" },
  { value: "zh", name: "中文" },
  { value: "el", name: "Ελληνικά" }
];

function print() {
  if (!anyCarriers("OS")) {
    return;
  }

  const createUrl = function(edition) {
    const pax = validatePax({
      maxPaxcount: 9,
      countInf: false,
      childAsAdult: 12,
      sepInfSeat: false,
      childMinAge: 2
    });
    if (!pax) {
      printNotification("Error: Failed to validate Passengers for OS");
      return;
    }

    let url = "https://book.austrian.com/app/fb.fly?action=avail&mode=date";

    const carriers = {};
    const farebases = [];
    currentItin.itin.forEach((itin, itinnum) => {
      const startDate = toDate(itin.dep);
      /** @param {Date} endDate */
      const getDays = function(endDate) {
        const days = dayDiff(startDate, endDate);
        return days ? "+" + days : "";
      };

      itin.seg.forEach((seg, segnum) => {
        const endDate = new Date(seg.arr.year, seg.arr.month, seg.arr.day);

        url += `&origin${itinnum}_${segnum}=${seg.orig}`;
        url += `&destin${itinnum}_${segnum}=${seg.dest}`;
        url += `&day${itinnum}_${segnum}=${to2digits(itin.dep.day)}`;
        url += `&month${itinnum}_${segnum}=${to2digits(itin.dep.month)}`;
        url += `&year${itinnum}_${segnum}=${itin.dep.year}`;
        url +=
          `&deptime${itinnum}_${segnum}=${to4digitTime(seg.dep.time24)}` +
          getDays(toDate(seg.dep));
        url +=
          `&arrtime${itinnum}_${segnum}=${to4digitTime(seg.arr.time24)}` +
          getDays(toDate(seg.arr));
        url += `&fn${itinnum}_${segnum}=${seg.carrier}${to4digits(seg.fnr)}`;
        url += `&comp${itinnum}_${segnum}=EC`;

        carriers[seg.carrier] = (carriers[seg.carrier] || 0) + 1;
        farebases.push(currentItin.farebases[itinnum]);
      });
    });
    url += `&fbc=` + farebases.join(",");
    url += `&numadt=${pax.adults}`;
    url += `&numchd=${pax.children.length}`;
    url += `&numinf=${pax.infLap}`;
    url += `&l=${edition}`;
    url +=
      `&carrier=` +
        (Object.keys(carriers) || []).sort(
          (a, b) => carriers[b] - carriers[a]
        )[0] || "OS";

    return url;
  };

  var edition = mptUserSettings.osEdition;
  if (edition.length != 2) {
    printNotification("Error:Invalid Austrian-Edition");
    return;
  }
  var url = createUrl(edition);
  if (!url) {
    return;
  }

  var extra =
    ' <span class="pt-hover-container">[+]<span class="pt-hover-menu">';
  extra += editions
    .map(function(obj, i) {
      return (
        '<a href="' +
        createUrl(obj.value) +
        '" target="_blank">' +
        obj.name +
        "</a>"
      );
    })
    .join("<br/>");
  extra += "</span></span>";

  return {
    url,
    title: "Austrian",
    extra
  };
}

register("airlines", print);
registerSetting("Austrian", "osEdition", editions, "en");
