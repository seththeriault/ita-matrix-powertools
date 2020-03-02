import userSettings from "../settings/userSettings";

const tokens = {
  "#1e1e1e": "#e1e1e1", // dark gray text
  "#e2f2f9": "rgba(227,241,249,0.1)", // light blue box background
  "#155fa9": "#85daff", // blue
  "#145EA9": "#85daff", // blue (tab text)
  "#0062AB": "#8ec6ec", // blue (visited link)
  "#4e8bc1": "#9ecbe6", // blue (box border)
  "#185ea8": "#f8b85b", // blue (calendar) -> orange
  "#fff8bd": "rgb(0,0,0)", // light yellow
  "#f0f0dc": "rgb(0,0,0)", // light yellow
  "#ba0000": "#f39691", // red
  white: "rgb(0,0,0)", // white
  "#ffffff": "rgb(0,0,0)", // white
  "#fff": "rgb(0,0,0)", // white
  "rgb\\(0,0,0\\)-": "white-", // fix for "white-space", etc
  black: "#E1E1E1", // black
  "#000000": "#E1E1E1", // black
  "#000": "#E1E1E1", // black
  "#f7f7f7": "#232323", // light gray
  "#f0f0f0": "#232323", // light gray
  "rgba\\(255,255,255,0.6\\)": "#232323", // light gray
  "#c2e0ff": "rgba(194,224,255,.1)" // light blue
};

let headObserver;

export function bindDarkmode() {
  if (userSettings.enableDarkmode) {
    document.body.classList.add("dark-mode");
    if (!headObserver) {
      headObserver = new window.MutationObserver((mutations, observer) => {
        mutations.forEach(m => {
          m.addedNodes.forEach(node => {
            if (
              node.nodeName.toUpperCase() === "STYLE" &&
              node.textContent.indexOf("dark-mode") === -1
            ) {
              const old = node.textContent;
              node.textContent = Object.keys(tokens).reduce(
                (css, token) =>
                  css.replace(new RegExp(token, "gi"), tokens[token]),
                node.textContent
              );
              if (old == node.textContent) alert("no changes");
            }
          });
        });
      });
      headObserver.observe(document.head, { childList: true });
    }
  }
}

export function transformItaCss() {}
