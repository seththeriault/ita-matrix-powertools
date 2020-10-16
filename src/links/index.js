import mptUserSettings from "../settings/userSettings";
import mtpPassengerConfig from "../settings/paxSettings";
import { registerLink } from "../print/links";
import { currentItin } from "../parse/itin";

const req = require.context("./", true, /.[jt]s$/);

req.keys().forEach(req);

/**
 * Registers a link
 * @param {() => { url: string, title: string, img?: string, desc?: string, extra?: string, target?: string }} factory
 */
export function register(type, factory) {
  registerLink(type, factory);
}

export function allCarriers() {
  const args = Array.from(arguments);
  return (
    mptUserSettings.showAllAirlines ||
    currentItin.carriers.every(cxr => args.some(arg => cxr === arg))
  );
}

export function anyCarriers() {
  const args = Array.from(arguments);
  return (
    mptUserSettings.showAllAirlines ||
    currentItin.carriers.some(cxr => args.some(arg => cxr === arg))
  );
}

export function validatePax(config) {
  //{maxPaxcount:7, countInf:false, childAsAdult:12, sepInfSeat:false, childMinAge:2}
  var tmpChildren = new Array();
  // push cur children
  for (var i = 0; i < mtpPassengerConfig.cAges.length; i++) {
    tmpChildren.push(mtpPassengerConfig.cAges[i]);
  }
  var ret = {
    adults: mtpPassengerConfig.adults,
    children: new Array(),
    infLap: mtpPassengerConfig.infantsLap,
    infSeat: 0
  };
  if (config.sepInfSeat === true) {
    ret.infSeat = mtpPassengerConfig.infantsSeat;
  } else {
    for (var i = 0; i < mtpPassengerConfig.infantsSeat; i++) {
      tmpChildren.push(config.childMinAge);
    }
  }
  // process children
  for (var i = 0; i < tmpChildren.length; i++) {
    if (tmpChildren[i] < config.childAsAdult) {
      ret.children.push(tmpChildren[i]);
    } else {
      ret.adults++;
    }
  }
  // check Pax-Count
  if (
    config.maxPaxcount <=
    ret.adults +
      (config.countInf && ret.infLap) +
      ret.infSeat +
      ret.children.length
  ) {
    console.log("Too many passengers");
    return;
  }
  if (0 === ret.adults + ret.infSeat + ret.children.length) {
    console.log("No passengers");
    return;
  }
  return ret;
}
