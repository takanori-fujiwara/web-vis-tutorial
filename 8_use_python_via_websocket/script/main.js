import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";
import { scatterplot } from "./scatterplot.js";
import { lassoSelection } from "./lasso.js";

const fileName = "mtcars.csv";
const defaultColor = "#aa0000";
const unselectedColor = "#aaaaaa";

const model = {
  data: undefined,
  nodes: undefined,
  links: undefined,
  scatter: undefined,
  network: undefined,
};

const prepareScatter = (data) => {
  const scatter = scatterplot(data, {
    svgId: "scatterplot",
    x: (d) => d.mpg,
    y: (d) => d.hp,
    c: defaultColor,
    width: d3.select("#view_b").node().getBoundingClientRect().width,
    height: d3.select("#view_b").node().getBoundingClientRect().height,
  });
  d3.select("#view_b").append(() => scatter);

  return scatter;
};

const prepareNetwork = (nodePositions, links) => {
  const network = scatterplot(nodePositions, {
    svgId: "network",
    links: links,
    c: defaultColor,
    width: d3.select("#view_c").node().getBoundingClientRect().width,
    height: d3.select("#view_c").node().getBoundingClientRect().height,
    showXAxis: false,
    showYAxis: false,
  });
  d3.select("#view_c").append(() => network);

  return network;
};

const prepareLasso = (scatter, network) => {
  const lasso = lassoSelection();

  lasso.on("end", () => {
    const selected = lasso.selected(); // get list of selected/unselected in boolean array

    if (Math.max(...selected) === 0) {
      // nothing selected by lasso
      scatter.update(defaultColor);
      network.update(defaultColor);
    } else {
      const pointColors = selected.map((s) =>
        s ? defaultColor : unselectedColor,
      );
      scatter.update(pointColors);
      network.update(pointColors);
    }
  });

  d3.select(scatter).call(
    lasso(scatter, d3.select(scatter).selectAll("circle").nodes()),
  );
  d3.select(network).call(
    lasso(network, d3.select(network).selectAll("circle").nodes()),
  );

  return lasso;
};

////////
const websocketUrl = `ws://localhost:9000`;
const ws = new WebSocket(websocketUrl);
const messageActions = {
  passData: 0,
  passNetworkLayout: 1,
};

ws.onopen = (event) => {
  ws.send(
    JSON.stringify({
      action: messageActions.passData,
      content: {
        name: fileName,
      },
    }),
  );
};

ws.onmessage = (event) => {
  const receivedData = JSON.parse(event.data);
  const content = receivedData.content;
  const action = receivedData.action;
  if (action === messageActions.passData) {
    model.data = JSON.parse(content);
    model.scatter = prepareScatter(model.data);
    model.nodes = [...Array(model.data.length).keys()]; // [0, 1, ..., n-1]
    model.links = [];
    for (let i = 0; i < 50; ++i) {
      model.links.push([
        Math.floor(Math.random() * model.data.length),
        Math.floor(Math.random() * model.data.length),
      ]);
    }

    // sent message again to receive network layout
    ws.send(
      JSON.stringify({
        action: messageActions.passNetworkLayout,
        content: {
          nodes: model.nodes,
          links: model.links,
        },
      }),
    );
  } else if (action === messageActions.passNetworkLayout) {
    const positions = content;
    model.network = prepareNetwork(positions, model.links);
    prepareLasso(model.scatter, model.network);
  }
};
