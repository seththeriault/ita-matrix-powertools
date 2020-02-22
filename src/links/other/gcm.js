import { currentItin } from "../../parse/itin";
import { register } from "..";

function printGCM() {
  let url = "";
  // Build multi-city search based on segments
  // Keeping continous path as long as possible
  for (let i = 0; i < currentItin.itin.length; i++) {
    for (let j = 0; j < currentItin.itin[i].seg.length; j++) {
      url += currentItin.itin[i].seg[j].orig + "-";
      if (j + 1 < currentItin.itin[i].seg.length) {
        if (
          currentItin.itin[i].seg[j].dest != currentItin.itin[i].seg[j + 1].orig
        ) {
          url += currentItin.itin[i].seg[j].dest + ";";
        }
      } else {
        url += currentItin.itin[i].seg[j].dest + ";";
      }
    }
  }

  return {
    img: "http://www.gcmap.com/map?MR=900&MX=182x182&PM=*&P=" + url,
    url: "http://www.gcmap.com/mapui?P=" + url,
    title: "GCM"
  };
}

register("other", printGCM);
