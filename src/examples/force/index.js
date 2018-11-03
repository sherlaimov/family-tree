import * as d3 from 'd3';
import chartFactory from '../../helpers/index';
// import { data2 } from '../../data/stub-data';
// import sherlaimovData from '../../data/rootNode.json';
import getTreeData from './dataHandler';

const rootNodeId = 'MhCX23FNQm';
const colors = d3.scaleOrdinal(d3.schemeDark2);
window.d3 = d3;
class ForceGraph {
  constructor(chartId) {
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    const { svg, container } = chartFactory({ id: chartId });
    this.svg = svg;
    this.container = container;
    this.init();
  }

  init() {
    this.zoom = d3.zoom().on('zoom', () => {
      this.container.attr('transform', d3.event.transform);
    });

    this.zoom(this.svg);
    this.svg.on('dblclick.zoom', null);

    this.link = this.container.append('g').selectAll('.link');
    this.node = this.container.selectAll('.node');

    this.tooltip = d3
      .select('body')
      .append('div')
      .classed('tooltip', true)
      .style('opacity', 0); // start invisible
    // TODO
    // https://github.com/ericsoco/d3-force-attract
    this.simulation = d3
      .forceSimulation()
      .force(
        'link',
        d3
          .forceLink()
          .id(d => d.id)
          .distance(d => 100)
          .strength(0.2)
      )
      .force('charge', d3.forceManyBody().strength(-20))
      // .force('center', d3.forceCenter())
      // this.width / 2, this.height / 2
      // .force('bounds', this.boxingForce.bind(this));
      // .force("collide", d3.forceCollide(50))
      // // .force('x', d3.forceX(this.width / 2));
      // .force('y', d3.forceY(this.height / 2));
    // .force(
    //   'collide',
    //   d3.forceCollide((d) => d.target.followers_count / 100)
    // );
    // .alphaTarget(1);

    this.simulation.on('end', () => {
      console.log('end event');
    });
  }

  appendNodes(d, i) {
    const currNode = d3.select(this);
    currNode
      .append('circle')
      // .transition(t)
      // .attr('r', () => rScale(d.followers_count))
      .attr('r', () => 20)
      .style('fill', () => colors(i));

    currNode
      .append('text')
      .text(() => d.fullname)
      // Automatic Text Sizing
      .style('font-size', function() {
        const textWidth = this.getComputedTextLength();
        const parentWidth = this.parentNode.getBBox().width;
        let scale = 16;
        scale = ((parentWidth - 30) / textWidth) * 16;
        if (scale < 16) scale = 16;
        return `${scale}px`;
      })
      .attr('text-anchor', 'middle')
      .attr('y', 5);
  }

  buildGraph(data) {
    const { nodes, links } = data;
    const t = d3.transition().duration(1000);
    const that = this;

    this.link = this.link.data(links);
    this.link.exit().remove();
    this.link = this.link
      .enter()
      .append('line')
      .attr('class', 'link')
      .merge(this.link);

    this.node = this.node.data(nodes, d => d.id);
    // .style('fill', '#b26745')
    // .transition(t)
    // .attr('r', 0)
    this.node.exit().remove();

    const nodeEnter = this.node
      .enter()
      .append('g')
      .attr('class', d => `node ${d.screen_name}`)
      .each(this.appendNodes);

    this.node = nodeEnter.merge(this.node);
    // const rootNode = this.node.filter(node => node.screen_name === 'sherlaimov');
    // window.root = rootNode;

    this.node.on('dblclick', this.releaseNode);
    this.node.call(
      d3
        .drag()
        .on('start', function(d) {
          ForceGraph.dragStarted(d, that.simulation, this);
        })
        .on('drag', this.dragged.bind(this))
        .on('end', this.dragEnded.bind(this))
    );

    // node.call(tooltip(d => d.screen_name, container));
    this.node.on('mouseover', d => this.showTooltip(d));
    this.node.on('mouseleave', d => this.hideTooltip(d));
    // this.node.on('dblclick.zoom', this.center.bind(this));
    this.simulation.on('tick', this.ticked.bind(this));
    this.simulation.nodes(nodes);
    this.simulation.force('link').links(links);
    // this.zoom.translateTo(this.svg, this.width / 2, this.height / 2);
    this.simulation.alphaTarget(0.3).restart();
  }

  ticked() {
    this.link
      .attr('x1', d => d.source.x)
      .attr('y1', d => d.source.y)
      .attr('x2', d => d.target.x)
      .attr('y2', d => d.target.y);

    // node.attr('cx', d => d.x).attr('cy', d => d.y);
    // since now we are dealing with the g SVG element
    this.node.attr('transform', d => `translate(${d.x}, ${d.y})`);
  }

  center(d) {
    d3.event.stopPropagation();
    console.log(d);
    console.log(this.zoom.translateTo(this.svg, d.x, d.y));
  }

  showTooltip(d) {
    const {
      screen_name,
      description,
      followers_count,
      friends_count,
      location,
      statuses_count,
      ranking,
      verified
    } = d;
    const htmlContent = [
      `<p>Name: ${screen_name}</p>`,
      `<p class="description">${description}</p>`,
      `<p>Followers: ${followers_count}</p>`,
      `<p>Following: ${friends_count}</p>`,
      `<p>Location: ${location}</p>`,
      `<p>Tweets total: ${statuses_count}</p>`
    ].join('');
    this.tooltip
      .html(htmlContent)
      .style('left', `${d3.event.pageX - d3.select('.tooltip').node().offsetWidth - 5}px`)
      .style('top', `${d3.event.pageY - d3.select('.tooltip').node().offsetHeight}px`);
    this.tooltip
      .transition()
      .duration(300)
      .style('opacity', 1); // show the tooltip
  }

  hideTooltip() {
    this.tooltip
      .transition()
      .duration(200)
      .style('opacity', 0);
  }

  static dragStarted(d, simulation, node) {
    d3.select(node).raise();
    if (!d3.event.active) simulation.alphaTarget(0.3).restart();
    // d.fixed = true;
    d.fx = d.x;
    d.fy = d.y;
  }

  dragged(d) {
    d.fx = d3.event.x;
    d.fy = d3.event.y;
  }

  dragEnded(d) {
    if (!d3.event.active) this.simulation.alphaTarget(0);
    // not setting these values to null keeps node where you left it
    // d.fx = null;
    // d.fy = null;
  }

  releaseNode(d) {
    d.fx = null;
    d.fy = null;
  }
}

// const getRootNodeData = () => sherlaimovData;

const graph = new ForceGraph('force-graph');

async function prepareGraphData() {
  const { nodes, links } = await getTreeData();
  console.log(links);
  console.log(nodes);
  const target = links.filter(link => link.target === 'PyCQ7nd6I2');
  console.log(target);
  graph.buildGraph({ nodes, links });
}
prepareGraphData();
