import * as d3 from 'd3';
import d3multiSelect from 'd3-selection-multi';
// import data from '../../../data/datasets/flare';
import data from '../../../data/sherlaimov/sherlaimovaDariaAndByHand2';
import allRoots from '../../../data/sherlaimov/allNodes';
import chartFactory from '../../helpers/index';

window.data = data;

const hasProp = Function.prototype.call.bind(Object.prototype.hasOwnProperty);
//  require("@observablehq/flare")
const { container, svg, margin, width, height } = chartFactory();

// https://bl.ocks.org/Andrew-Reid/bbb62ebadb78a0da831ab4f8d2cb410c

const dy = height / 8;
const dx = 25;

const defs = svg.append('svg:defs');
const imageWidth = 40;

const boxWidth = 150;
const boxHeight = 50;
const boxMultiplicator = 1.5;
const edgeWeight = d3
  .scaleLinear()
  .domain([0, 10])
  .range([0, 50]);

const tree = d3
  .tree()
  // .size([360, width]);
  // .size([height, width])
  // .nodeSize([height, width]);
  .nodeSize([130, 200])
  .separation((a, b) => (a.parent === b.parent ? 1.9 : 2));

const diagonal = d3
  .linkVertical()
  .x(d => d.x)
  .y(d => d.y);

const colorScale = d3.scaleOrdinal(d3.schemeCategory10);

console.log('data', data);
const root = d3.hierarchy(data);
window.root = root;
console.log('root', root);

// DATA SEARCH
const allLastNames = root
  .descendants()
  .map(({ data }) => data)
  .reduce((acc, a) => {
    if (acc.includes(a.lastName) === false) {
      acc.push(a.lastName);
    }
    return acc;
  }, []);
console.log(allLastNames);

const allComments = root
  .descendants()
  .map(({ data }) => data)
  .filter(person => hasProp(person, 'comment'));
console.log(allComments);
// DATA SEARCH

root.x0 = width / 2;
root.y0 = 0;

const collapseNodes = (d, i) => {
  if (d.children && d.depth > 3) {
    d._children = d.children;
    d.children = null;
    d._children.forEach(collapseNodes);
  } else if (d.children) {
    d._children = d.children;
    d.children.forEach(collapseNodes);
  }
  d.id = i; // ?
};

root.descendants().forEach(collapseNodes);

// console.log(`Viewbox -> ${-margin.left}, ${-margin.top}, ${width}, ${dx}`);

svg
  .attr('width', width)
  .attr('height', height)
  .attr('viewBox', [-width / 2, -margin.top, width, height])
  // .attr('viewBox', [-margin.left, -margin.top, width, height])
  // .attr('transform', `translate(${width / 2},0)`)
  .style('font', '10px sans-serif')
  .style('user-select', 'none');
svg.call(
  d3.zoom().on('zoom', () => {
    container.attr('transform', d3.event.transform);
  })
);

const gLink = container
  .append('g')
  .attr('fill', 'none')
  // .attr('transform', `translate(${width / 2},0)`)
  .attr('stroke', '#555')
  .attr('class', 'links');
// .attr('stroke-opacity', 0.4);
// .attr('stroke-width', 1.5);

const gNode = container
  .append('g')
  .attr('cursor', 'pointer')
  .attr('class', 'nodes');

function update(source) {
  // console.log(source);
  const duration = d3.event && d3.event.altKey ? 2500 : 250;
  const nodes = root.descendants().reverse();
  const links = root.links();

  // Compute the new tree layout.
  tree(root);

  let left = root;
  let right = root;
  root.eachBefore(node => {
    if (node.x < left.x) left = node;
    if (node.x > right.x) right = node;
  });

  // console.log(left);
  // console.log(right);

  // const height = right.x - left.x + margin.top + margin.bottom;

  const transition = svg
    .transition()
    .duration(duration)
    .attr('height', height)
    // .attr('viewBox', [width / 2, -margin.left, width, height])
    // .attr('viewBox', [left.x - margin.top, -margin.left, width, height])
    .tween('resize', window.ResizeObserver ? null : () => () => svg.dispatch('toggle'));

  // Update the nodes…
  const node = gNode.selectAll('g').data(nodes, d => d.id);

  // Enter any new nodes at the parent's previous position.
  const nodeEnter = node
    .enter()
    .append('g')
    .attr('transform', d => `translate(${source.x0},${source.y0})`)
    .attr('fill-opacity', 0)
    .attr('stroke-opacity', 0)
    .on('click', d => {
      d.children = d.children ? null : d._children;
      update(d);
    });

  nodeEnter.append('rect').attrs({
    x: d => {
      if (hasProp(d.data, 'spouseData')) {
        return -(boxWidth / 2) * boxMultiplicator;
      }
      return -(boxWidth / 2);
    },
    y: -(boxHeight / 2),
    width: d => {
      if (hasProp(d.data, 'spouseData')) {
        return boxWidth * boxMultiplicator;
      }
      return boxWidth;
    },
    height: boxHeight,
    fill: d => (d._children ? '#555' : '#999')
  });

  const appendNodeImage = (data, currNode, type) => {
    const transformMap = {
      left: `translate(${-((boxWidth * boxMultiplicator) / 2) + 3}, -18)`,
      right: 'translate(0, -18)',
      normal: `translate(${-(boxWidth / 2) + 3}, -18)`
    };
    defs
      .append('svg:pattern')
      .attrs({
        id: `image-${data.id}`,
        height: imageWidth,
        width: imageWidth,
        patternUnits: 'userSpaceOnUse'
      })
      .append('image')
      .attrs({
        height: imageWidth,
        width: imageWidth,
        'xlink:href': () => `data:image/png;base64,${data.image ? data.image : null}`
      });
    currNode.append('circle').attrs({
      cx: imageWidth / 2,
      cy: imageWidth / 2,
      r: imageWidth / 2,
      transform: () => transformMap[type],
      fill: () => (data.image ? `url(#image-${data.id})` : '#ccc')
    });
  };

  const appendNodeText = (data, currNode, type) => {
    const xValueMap = {
      left: -60,
      right: 40,
      normal: -30
    };
    currNode
      .append('text')
      .attr('x', () => xValueMap[type])
      .attr('y', -5)
      .text(() => data.lastName || data.sn || 'Unknown')
      .attr('class', 'lastName');

    currNode
      .append('text')
      .attr('x', () => xValueMap[type])
      .attr('y', 5)
      .text(() => data.firstName || 'Uknown')
      .attr('class', 'firstName');

    currNode
      .append('text')
      .attr('x', () => xValueMap[type])
      .attr('y', 15)
      .text(() => data.patronymic || 'Uknown')
      .attr('class', 'patronymic');

    currNode
      .append('text')
      .attr('x', () => xValueMap[type])
      .attr('y', 25)
      .attr('class', 'birthDate')
      .text(() => data.birthDate || 'Uknown');
  };

  function appendTextNodes(d) {
    const { data } = d;
    const currNode = d3.select(this);
    if (hasProp(data, 'spouseData')) {
      const { spouseData } = data;
      /* LEFT IMAGE */
      appendNodeImage(data, currNode, 'left');
      /* RIGHT IMAGE */
      appendNodeImage(spouseData, currNode, 'right');

      /* LEFT DATA */
      appendNodeText(data, currNode, 'left');
      /* RIGHT DATA */
      appendNodeText(spouseData, currNode, 'right');
    } else {
      /* NORMAL */
      appendNodeImage(data, currNode, 'normal');
      appendNodeText(data, currNode, 'normal');
    }
  }

  nodeEnter.each(appendTextNodes);

  // Transition nodes to their new position.
  const nodeUpdate = node
    .merge(nodeEnter)
    .transition(transition)
    .attr('transform', d => `translate(${d.x},${d.y})`)
    .attr('fill-opacity', 1)
    .attr('stroke-opacity', 1);

  // Transition exiting nodes to the parent's new position.
  const nodeExit = node
    .exit()
    .transition(transition)
    .remove()
    .attr('transform', d => `translate(${source.x},${source.y})`)
    .attr('fill-opacity', 0)
    .attr('stroke-opacity', 0);

  // Update the links…
  // .data(links, d => d.target.id);
  const link = gLink.selectAll('path').data(links, d => d.target.id);

  const calcStrokeWidth = d => {
    const { target } = d;
    // console.log(target);
    if (hasProp(target, '_children')) {
      return edgeWeight(target._children.length);
    }
    if (hasProp(target, 'children') && target.children !== null) {
      return edgeWeight(target.children.length);
    }
    return 1.5;
  };

  // Enter any new links at the parent's previous position.
  const linkEnter = link
    .enter()
    .append('path')
    .attr('d', () => {
      const o = { x: source.x0, y: source.y0 };
      return diagonal({ source: o, target: o });
    })
    // '#555'
    .attr('stroke', d => {
      const { data } = d.source;
      console.log(data);
      return colorScale(data.lastName);
    })
    .attr('stroke-opacity', 0.4)
    .attr('stroke-width', calcStrokeWidth);

  // Transition links to their new position.
  link
    .merge(linkEnter)
    .transition(transition)
    .attr('d', diagonal)
    // .attr('d', () => {
    //   const o = { x: source.x, y: source.y };
    //   return diagonal({ source: o, target: o });
    // })
    .attr('stroke-width', calcStrokeWidth);

  // Transition exiting nodes to the parent's new position.
  link
    .exit()
    .transition(transition)
    .remove()
    .attr('d', () => {
      const o = { x: source.x, y: source.y };
      return diagonal({ source: o, target: o });
    });

  // .attr('stroke-width', d => edgeWeight(d._children.length));

  // Stash the old positions for transition.
  root.eachBefore(d => {
    d.x0 = d.x;
    d.y0 = d.y;
  });
}

update(root);
