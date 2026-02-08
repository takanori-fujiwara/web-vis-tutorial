import * as d3 from "https://cdn.skypack.dev/d3@7";
import { scatterplot } from "./scatterplot.js";

const chart = scatterplot(
  [
    [0, 0],
    [0, 1],
    [0.5, 0.5],
    [1, 0],
  ],
  {
    c: ["#aa0000", "#00aa00", "#0000aa", "#880088"],
  },
);

d3.select("#view_b").append(() => chart);
