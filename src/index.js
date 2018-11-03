import * as d3 from 'd3';
// { tooltip }
import chartFactory from './helpers/common';

const width = window.innerWidth;
const height = window.innerHeight;

const colors = d3.scaleOrdinal(d3.schemeDark2);

const { svg, container } = chartFactory();

