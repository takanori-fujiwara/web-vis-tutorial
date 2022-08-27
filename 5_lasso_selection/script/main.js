import * as d3 from 'https://cdn.skypack.dev/d3@7';
import {
  scatterplot
} from './scatterplot.js';
import {
  lassoSelection
} from './lasso.js';

const cars = await d3.csv('./data/mtcars.csv', d3.autoType);

const chart = scatterplot(cars, {
  svgId: 'scatterplot',
  x: d => d.mpg,
  y: d => d.hp,
  c: '#aa0000'
});

d3.select('#view_b').append(() => chart);

const lasso = lassoSelection(chart, d3.select(chart).selectAll('circle').nodes());
lasso.on('end', () => {
  console.log(lasso.selected())
});
d3.select(chart).call(lasso());