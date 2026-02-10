import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";
import { scatterplot } from "./scatterplot.js";
import { lassoSelection } from "./lasso.js";

const cars = await d3.csv("./data/mtcars.csv", d3.autoType);

const defaultColor = "#aa0000";
const unselectedColor = "#aaaaaa";
const chart = scatterplot(cars, {
  svgId: "scatterplot",
  x: (d) => d.mpg,
  y: (d) => d.hp,
  c: defaultColor,
});

d3.select("#view_b").append(() => chart);

const lasso = lassoSelection();

lasso.on("end", () => {
  const selected = lasso.selected(); // get list of selected/unselected in boolean array

  if (Math.max(...selected) === 0) {
    // nothing selected by lasso
    chart.update(defaultColor);
  } else {
    const pointColors = selected.map((s) =>
      s ? defaultColor : unselectedColor,
    );
    chart.update(pointColors);
  }
});

d3.select(chart).call(
  lasso(chart, d3.select(chart).selectAll("circle").nodes()),
);

// Note for me: current lassoSelection needs to set lasso.on in advance
// also, need to indicate lasso(svgAre, svgItems). See TODO list in lasso.js
