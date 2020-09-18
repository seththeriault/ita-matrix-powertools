import React from "dom-chef";

export function renderHistory() {
  document.body.style.paddingLeft = "241px";
  document.body.append(LinksContainer);
}

const LinksContainer = (
  <div
    style={{
      position: "fixed",
      width: "200px",
      top: "20px",
      left: "20px",
      bottom: "20px",
      borderRight: "1px dashed grey"
    }}
  >
    <div>History</div>
    <div></div>
  </div>
);
