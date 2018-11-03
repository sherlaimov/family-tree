
import * as d3 from 'd3';
import { path } from 'd3';
import chartFactory from './common';
import '../main.scss';

const { container, svg, margin, width } = chartFactory();

const points = [[0, 80], [100, 100], [200, 30], [300, 50], [400, 40], [500, 80]];
const curves = [
  'curveBasis',
  'curveBasisClosed',
  'curveBasisOpen',
  'curveBundle',
  'curveCardinal',
  'curveCardinalClosed',
  'curveCardinalOpen',
  'curveCatmullRom',
  'curveCatmullRomClosed',
  'curveCatmullRomOpen',
  'curveLinear',
  'curveLinearClosed',
  'curveMonotoneX',
  'curveMonotoneY',
  'curveNatural',
  'curveStep',
  'curveStepAfter',
  'curveStepBefore'
];
// d="M0,80 L100,100 L200,30 L300,50 L400,40 L500,80"
const line = d3
  .line()
  .x(d => d[0])
  .y(d => d[1])
  .curve(d3.curveCardinal);

const lineGenerator = d3.line().curve(d3.curveStep);
const pathData = lineGenerator(points);
lineGenerator.defined(d => d !== null);

const symbol = d3.symbolWye;
console.log(symbol.draw(container, 100));
// d3.path.

// path.attr('d', pathData);

container
  .append('path')
  .attr('d', pathData)
  .attr('fill', 'none')
  .attr('stroke', 'brown')
  .attr('stroke-width', '2px');

// Selecting and appending elements
// d3.select('#root')
//   .append('h5')
//   .append('text')
//   .text(`D3 version: ${d3.version}`);

// // Loading external data
// d3.csv('/data/sample.csv', (error, dataset) => {
//   dataset.forEach(data => {
//     console.log(data);
//   });
// });
