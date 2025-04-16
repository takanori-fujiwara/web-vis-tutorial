// import * as d3 from 'https://cdn.skypack.dev/d3@7';
import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";

import {
  scatterplot
} from './scatterplot.js';
import {
  lassoSelection
} from './lasso.js';

const cars = await d3.csv('./data/mtcars.csv', d3.autoType);

const defaultColor = '#aa0000';
const unselectedColor = '#aaaaaa';

const scatter = scatterplot(cars, {
  svgId: 'scatterplot',
  x: d => d.mpg,
  y: d => d.hp,
  c: defaultColor,
  width: d3.select('#view_b').node().getBoundingClientRect().width,
  height: d3.select('#view_b').node().getBoundingClientRect().height,
});

// prepare laid-out network with python/networkX
const randomLinks = [];
for (let i = 0; i < 50; ++i) {
  randomLinks.push([
    Math.floor(Math.random() * cars.length),
    Math.floor(Math.random() * cars.length)
  ]);
}

// load pyodide(python webassembly). check index.html's header as well
const pyodide = await loadPyodide();
// supported built-in packages can be found: https://pyodide.org/en/stable/usage/packages-in-pyodide.html#packages-in-pyodide
await pyodide.loadPackage('networkx');
await pyodide.loadPackage('numpy');

const vars = {
  nodes: [...Array(cars.length).keys()], // [0, 1, ..., n-1]
  links: randomLinks
};

pyodide.registerJsModule('vars_from_js', vars);
// if you want to load external python script, you can do like this
// pyodide.runPython(await (await fetch('./sampling.py')).text());
pyodide.runPython(`
  import numpy as np
  import networkx as nx

  from vars_from_js import nodes, links

  G = nx.Graph()
  G.add_nodes_from(nodes)
  G.add_edges_from(links)
  positions = nx.spring_layout(G)
  positions = np.array(list(positions.values())) # converting from dict to array
  `);
const positions = pyodide.globals.get('positions').toJs();

const network = scatterplot(positions, {
  svgId: 'network',
  links: randomLinks,
  c: defaultColor,
  width: d3.select('#view_c').node().getBoundingClientRect().width,
  height: d3.select('#view_c').node().getBoundingClientRect().height,
  showXAxis: false,
  showYAxis: false
});

d3.select('#view_b').append(() => scatter);
d3.select('#view_c').append(() => network);


const lasso = lassoSelection();

lasso.on('end', () => {
  const selected = lasso.selected(); // get list of selected/unselected in boolean array

  if (Math.max(...selected) === 0) { // nothing selected by lasso
    scatter.update(defaultColor);
    network.update(defaultColor);
  } else {
    const pointColors = selected.map(s => s ? defaultColor : unselectedColor);
    scatter.update(pointColors);
    network.update(pointColors);
  }
});

d3.select(scatter).call(
  lasso(scatter, d3.select(scatter).selectAll('circle').nodes()));
d3.select(network).call(
  lasso(network, d3.select(network).selectAll('circle').nodes()));

// Note for me: current lassoSelection needs to set lasso.on in advance
// also, need to indicate lasso(svgAre, svgItems). See TODO list in lasso.js