import * as d3 from "https://cdn.skypack.dev/d3@7";

const mapValue = (data, a) =>
  typeof a === "function"
    ? Object.assign(d3.map(data, a), {
        type: "function",
      }) // mapping from data to size
    : Array.isArray(a)
      ? Object.assign([...a], {
          type: "array",
        }) // array
      : Object.assign(
          data.map(() => a),
          {
            type: "constant",
          },
        ); // constant number

export const scatterplot = (
  data,
  {
    svgId = "scatterplot",
    links = [],
    x = ([x]) => x, // given d in data, returns the (quantitative) x-value
    y = ([, y]) => y, // given d in data, returns the (quantitative) y-value
    r = 5,
    c = "#4D7AA7",
    stroke = "#CCCCCC", // stroke color for the dots
    strokeWidth = 1, // stroke width for dots
    marginTop = 20, // top margin, in pixels
    marginRight = 30, // right margin, in pixels
    marginBottom = 30, // bottom margin, in pixels
    marginLeft = 40, // left margin, in pixels
    width = 640, // outer width, in pixels
    height = width, // outer height, in pixels
    xType = d3.scaleLinear, // type of x-scale
    xDomain, // [xmin, xmax]
    xRange, // [left, right]
    yType = d3.scaleLinear, // type of y-scale
    yDomain, // [ymin, ymax]
    yRange, // [bottom, top]
    xLabel, // a label for the x-axis
    yLabel, // a label for the y-axis
    showColorLegend = "auto",
    linkStroke = "#DDDDDD", // link's line color
    linkStrokeWidth = 1, // link's line Width
    linkStrokeOpacity = 0.7, // link's opacity
    showXAxis = true,
    showYAxis = true,
  } = {},
) => {
  // Compute values.
  const X = d3.map(data, x);
  const Y = d3.map(data, y);
  const C = mapValue(data, c);
  const I = d3.range(X.length);

  // Compute default domains.
  if (xDomain === undefined) xDomain = d3.extent(X);
  if (yDomain === undefined) yDomain = d3.extent(Y);

  // Construct scales and axes.
  if (xRange === undefined) xRange = [marginLeft, width - marginRight];
  if (yRange === undefined) yRange = [height - marginBottom, marginTop];

  const xScale = xType(xDomain, xRange);
  const yScale = yType(yDomain, yRange);

  const xAxis = d3.axisBottom(xScale).ticks(width / 80);
  const yAxis = d3.axisLeft(yScale).ticks(height / 50);

  // prepare SVG
  const svg = d3
    .create("svg")
    .attr("id", svgId)
    .attr("width", width)
    .attr("height", height)
    .attr("viewBox", [0, 0, width, height])
    .attr("style", "max-width: 100%; height: auto; height: intrinsic;");

  // draw x, y-axes
  if (showXAxis) {
    const xAxisG = svg
      .append("g")
      .attr("transform", `translate(0,${height - marginBottom})`)
      .call(xAxis)
      .call((g) =>
        g
          .append("text")
          .attr("x", width)
          .attr("y", marginBottom - 4)
          .attr("fill", "currentColor")
          .attr("text-anchor", "end")
          .text(xLabel),
      );
  }
  if (showYAxis) {
    const yAxisG = svg
      .append("g")
      .attr("transform", `translate(${marginLeft},0)`)
      .call(yAxis)
      .call((g) =>
        g
          .append("text")
          .attr("x", -marginLeft)
          .attr("y", 10)
          .attr("fill", "currentColor")
          .attr("text-anchor", "start")
          .text(yLabel),
      );
  }

  // draw links in SVG if exists
  if (links) {
    svg
      .append("g")
      .attr("stroke", linkStroke)
      .attr("stroke-width", linkStrokeWidth)
      .attr("stroke-opacity", linkStrokeOpacity)
      .selectAll("line")
      .data(links)
      .join("line")
      .attr("x1", (link) => xScale(X[link[0]]))
      .attr("x2", (link) => xScale(X[link[1]]))
      .attr("y1", (link) => yScale(Y[link[0]]))
      .attr("y2", (link) => yScale(Y[link[1]]));
  }
  // draw points in SVG
  svg
    .append("g")
    .attr("stroke", stroke)
    .attr("stroke-width", strokeWidth)
    .selectAll("circle")
    .data(I)
    .join("circle")
    .attr("fill", (i) => C[i])
    .attr("cx", (i) => xScale(X[i]))
    .attr("cy", (i) => yScale(Y[i]))
    .attr("r", r);

  const update = (newC) => {
    const C = mapValue(data, newC);
    svg
      .selectAll("circle")
      .data(I)
      .attr("fill", (i) => C[i]);
  };

  return Object.assign(svg.node(), {
    update,
  });
};
