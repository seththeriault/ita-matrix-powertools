import userSettings from "../settings/userSettings";

const tokens = {
  "#1e1e1e": "#f5f5f5", // dark gray text
  "#e2f2f9": "#1f1f1f", // light blue box background
  "#155fa9": "#85daff", // blue
  "#145EA9": "#85daff", // blue (tab text)
  "#0062AB": "#8ec6ec", // blue (visited link)
  "#3275b5": "#9ecbe6", // blue (box border)
  "#4e8bc1": "#9ecbe6", // blue (box border)
  "#185ea8": "#f8b85b", // blue (calendar) -> orange
  "#fff8bd": "#242424", // light yellow
  "#f0f0dc": "#242424", // light yellow
  "#ba0000": "#f39691", // red
  white: "#121212", // white
  "#ffffff": "#121212", // white
  "#fff": "#121212", // white
  "#121212-": "white-", // fix for "white-space", etc
  black: "#f5f5f5", // black
  "#000000": "#f5f5f5", // black
  "#000": "#f5f5f5", // black
  "#f7f7f7": "#232323", // light gray
  "#f0f0f0": "#232323", // light gray
  "rgba\\(255,255,255,0.6\\)": "#232323", // light gray
  "#c2e0ff": "rgba(194,224,255,.1)" // light blue
};

let headObserver;

export function bindDarkmode() {
  if (userSettings.enableDarkmode && window.MutationObserver) {
    document.body.classList.add("dark-mode");
    if (!headObserver) {
      document.head.querySelectorAll("style").forEach(transformCss);

      headObserver = new window.MutationObserver((mutations, observer) =>
        mutations.forEach(m => m.addedNodes.forEach(transformCss))
      );
      headObserver.observe(document.head, { childList: true });
    }
  }
}

const transformCss = node => {
  if (
    node.nodeName.toUpperCase() === "STYLE" &&
    node.textContent.indexOf("dark-mode") === -1
  ) {
    const old = node.textContent;
    node.textContent = Object.keys(tokens).reduce(
      (css, token) => css.replace(new RegExp(token, "gi"), tokens[token]),
      node.textContent
    );
    if (old == node.textContent) alert("no changes");
  }
};
