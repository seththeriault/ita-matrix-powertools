import { getCurrentSegs } from "../../parse/itin";
import { registerLink } from "../../print/links";

function printWheretocredit() {
  return {
    url:
      "https://www.wheretocredit.com/calculator#" +
      getCurrentSegs()
        .map(seg =>
          [seg.orig, seg.dest, seg.carrier, seg.bookingclass].join("-")
        )
        .join("/"),
    title: "Where to Credit"
  };
}

registerLink("other", printWheretocredit);
