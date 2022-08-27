import * as d3 from 'https://cdn.skypack.dev/d3@7';
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

// prepare data to mimic network data
const randomPositions = cars.map(d => [Math.random(), Math.random()]);
const randomLinks = [];
for (let i = 0; i < 20; ++i) {
  randomLinks.push([
    Math.floor(Math.random() * randomPositions.length),
    Math.floor(Math.random() * randomPositions.length)
  ]);
}

const network = scatterplot(randomPositions, {
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