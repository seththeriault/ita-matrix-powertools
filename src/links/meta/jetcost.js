import { register, validatePax } from "..";
import { currentItin, getCurrentSegs, isMulticity } from "../../parse/itin";
import { printNotification, to2digits } from "../../utils";
import { getCabin } from "../../settings/appSettings";

const editions = [
  { name: "Argentina", host: "https://ar.jetcost.com/vuelos/busqueda" },
  { name: "Australia", host: "https://www.jetcost.com.au/flights/search" },
  { name: "Bolivia", host: "https://www.jetcost.com.bo/vuelos/busqueda" },
  { name: "Brasil", host: "https://www.jetcost.com.br/voos/pesquisa" },
  { name: "Canada (en)", host: "https://ca.jetcost.com/en/flights/search" },
  { name: "Canada (fr)", host: "https://ca.jetcost.com/fr/vols/recherche" },
  { name: "Chile", host: "https://www.jetcost.cl/vuelos/busqueda" },
  { name: "Colombia", host: "https://www.jetcost.com.co/vuelos/busqueda" },
  { name: "Danmark", host: "https://www.jetcost.dk/flyrejser/sogning" },
  { name: "Deutschland", host: "https://www.jetcost.de/fluge/suche" },
  { name: "España", host: "https://www.jetcost.es/vuelos/busqueda" },
  {
    name: "Estados Unidos (es)",
    host: "https://us.jetcost.com/es/vuelos/busqueda"
  },
  { name: "France", host: "https://www.jetcost.com/vols/recherche" },
  { name: "Hong Kong", host: "https://www.jetcost.hk/en/flights/search" },
  { name: "India", host: "https://www.jetcost.co.in/en/flights/search" },
  { name: "Indonesia", host: "https://www.jetcost.co.id/en/flights/search" },
  { name: "Ireland", host: "https://www.jetcost.ie/flights/search" },
  { name: "Italia", host: "https://www.jetcost.it/voli/ricerca" },
  { name: "Magyarország", host: "https://www.jetcost.hu/jaratok/kereses" },
  { name: "Malaysia", host: "https://www.jetcost.com.my/en/flights/search" },
  { name: "México", host: "https://www.jetcost.com.mx/vuelos/busqueda" },
  { name: "Nederland", host: "https://www.jetcost.nl/vluchten/zoeken" },
  { name: "New Zealand", host: "https://www.jetcost.co.nz/flights/search" },
  { name: "Norge", host: "https://www.jetcost.no/flyvninger/sok" },
  { name: "Österreich", host: "https://www.jetcost.at/fluge/suche" },
  { name: "Perú", host: "https://www.jetcost.com.pe/vuelos/busqueda" },
  { name: "Philippines", host: "https://www.jetcost.com.ph/en/flights/search" },
  { name: "Polska", host: "https://www.jetcost.pl/loty/wyszukiwanie" },
  { name: "Portugal", host: "https://www.jetcost.pt/voos/pesquisar" },
  { name: "România", host: "https://www.jetcost.ro/zboruri/cautare" },
  { name: "Россия", host: "https://www.jetcost.ru/reysy/poisk" },
  { name: "Singapore", host: "https://www.jetcost.com.sg/en/flights/search" },
  { name: "South Africa", host: "https://www.jetcost.co.za/en/flights/search" },
  { name: "Suomi", host: "https://www.jetcost.fi/lennot/hae" },
  { name: "Sverige", host: "https://www.jetcost.se/flighter/sokning" },
  { name: "Thailand", host: "https://www.jetcost.co.th/en/flights/search" },
  { name: "United Kingdom", host: "https://www.jetcost.co.uk/flights/search" },
  {
    name: "United States (en)",
    host: "https://us.jetcost.com/en/flights/search"
  },
  { name: "Uruguay", host: "https://www.jetcost.com.uy/vuelos/busqueda" },
  { name: "Venezuela", host: "https://www.jetcost.co.ve/vuelos/busqueda" },
  { name: "한국", host: "https://www.jetcost.co.kr/flights/search" }
];

const cabins = [0, 0, 1, 2];

function print() {
  if (isMulticity()) return; // no multi segments

  var pax = validatePax({
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

  var createUrl = function(host) {
    return `${host}?adults=${pax.adults}&children=${
      pax.children.length
    }&infants=${pax.infLap}&cabin_class=${cabin}&${currentItin.itin
      .map(
        (seg, i) =>
          `trips[${i}][date]=${formatDate(seg.dep)}&trips[${i}][from_iata]=${
            seg.orig
          }&trips[${i}][to_iata]=${seg.dest}`
      )
      .join("&")}`;
  };

  var url = createUrl("https://us.jetcost.com/en/flights/search");
  if (!url) {
    return;
  }

  var extra =
    ' <span class="pt-hover-container">[+]<span class="pt-hover-menu">';
  extra += editions
    .map(function(obj, i) {
      return (
        '<a href="' +
        createUrl(obj.host) +
        '" target="_blank">' +
        obj.name +
        "</a>"
      );
    })
    .join("<br/>");
  extra += "</span></span>";

  return {
    url,
    title: "Jetcost",
    extra
  };
}

function formatDate(date) {
  return `${date.year}-${to2digits(date.month)}-${to2digits(date.day)}`;
}

register("meta", print);
