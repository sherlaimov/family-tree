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
const textData = [
  { text: 'Here is some sample text that has been wrapped using d3plus.textBox.' },
  { text: '...and here is a second sentence!' },
  { text: '这是句3号。这也即使包装没有空格！' }
];

const boxWidth = 150;
const boxHeight = 50;
const boxMultiplicator = 1.5;

const tree = d3
  .tree()
  // .size([360, width]);
  // .size([height, width])
  // .nodeSize([height, width]);
  .nodeSize([130, 200])
  .separation((a, b) => (a.parent === b.parent ? 1.9 : 2));

// const diagonal = d3
//   .linkHorizontal()
//   .x(d => d.y)
//   .y(d => d.x);

const diagonal = d3
  .linkVertical()
  .x(d => d.x)
  .y(d => d.y);

/**
 * Custom path function that creates straight connecting lines.
 const elbow = d =>
   `M${d.source.x},${d.source.y}H${d.source.x + (d.target.x - d.source.x) / 2}V${d.target.y}H${
     d.target.y
   }`;
 */
function elbow(d, i) {
  console.log(d);
  return `M${d.source.x},${d.source.y}V${d.target.y}H${d.target.x}${
    d.target.children ? '' : `v${margin.bottom}`
  }`;
}

const testElbow = d => `M${d.source.x},${d.source.y}V${d.source.y}H${d.target.x}V${d.target.y}`;

const root = d3.hierarchy(data);

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

// d3.select('body').append(svg);

const gLink = container
  .append('g')
  .attr('fill', 'none')
  // .attr('transform', `translate(${width / 2},0)`)
  .attr('stroke', '#555')
  .attr('stroke-opacity', 0.4)
  .attr('stroke-width', 1.5);

const gNode = container.append('g').attr('cursor', 'pointer');
// const textBox = container.append('g');
console.log(root);
// const box = new d3plus.TextBox()
function update(source) {
  console.log(source);
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

  /**
     * 
     nodeEnter
    .append('circle')
    .attr('r', 10)
    .attr('fill', d => (d._children ? '#555' : '#999'));
     */

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

  const defs = svg.append('svg:defs');
  const imageWidth = 40;

  function appendTextNodes(d, i) {
    const { data } = d;
    const currNode = d3.select(this);
    if (hasProp(data, 'spouseData')) {
      const { spouseData } = data;
      // console.log(currNode.select('rect').node());

      /* IMAGE */
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
        transform: `translate(${-((boxWidth * boxMultiplicator) / 2) + 3}, -18)`,
        fill: () => (data.image ? `url(#image-${data.id})` : '#ccc')
      });

      /* SPOUSE IMAGE */
      defs
        .append('svg:pattern')
        .attrs({
          id: `image-${data.spouseData.id}`,
          height: imageWidth,
          width: imageWidth,
          patternUnits: 'userSpaceOnUse'
        })
        .append('image')
        .attrs({
          height: imageWidth,
          width: imageWidth,
          'xlink:href': () =>
            `data:image/png;base64,${data.spouseData.image ? data.spouseData.image : null}`
        });
      currNode.append('circle').attrs({
        cx: imageWidth / 2,
        cy: imageWidth / 2,
        r: imageWidth / 2,
        transform: `translate(0, -18)`,
        fill: () => (data.spouseData.image ? `url(#image-${data.spouseData.id})` : '#ccc')
      });

      currNode
        .append('text')
        .attr('x', -60)
        .attr('y', 0)
        .text(() => data.firstName)
        .attr('class', 'firstName');
      // .call(wrap, boxWidth);
      currNode
        .append('text')
        .attr('x', -60)
        .attr('y', 20)
        .attr('class', 'birthDate')
        .text(() => data.birthDate || 'Uknown');
      // .call(wrap, boxWidth);

      currNode
        .append('text')
        .attr('x', 40)
        .attr('y', 0)
        .text(() => spouseData.firstName || 'Uknown')
        .attr('class', 'firstName');
      // .call(wrap, boxWidth);
      currNode
        .append('text')
        .attr('x', 40)
        .attr('y', 20)
        .attr('class', 'birthDate')
        .text(() => spouseData.birthDate || 'Uknown');
      // .call(wrap, boxWidth);
    } else {
      /* IMAGE */
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
        transform: `translate(${-(boxWidth / 2) + 3}, -18)`,
        fill: () => (data.image ? `url(#image-${data.id})` : '#ccc')
      });
      currNode
        .append('text')
        .attr('x', -30)
        .attr('y', 0)
        .text(() => data.firstName);

      currNode
        .append('text')
        .attr('x', -30)
        .attr('y', 10)
        .text(() => data.patronymic);

      currNode
        .append('text')
        .attr('x', -30)
        .attr('y', 20)
        .text(() => data.birthDate);
    }
  }
  nodeEnter.each(appendTextNodes);

  function wrap(text, boxWidth) {
    boxWidth /= 2;
    // console.log(text);
    text.each(function each() {
      const text = d3.select(this);

      const words = text
        .text()
        .split(/\s+/)
        .reverse();

      let word;
      let line = [];
      let lineNumber = 0;
      const lineHeight = 1.1;
      // ems

      const y = text.attr('y') || 0;
      const dy = parseFloat(text.attr('dy')) || 0;
      let tspan = text
        .text(null)
        .append('tspan')
        .attr('x', -(boxWidth / 2))
        .attr('y', y)
        .attr('dy', `${dy}em`);
      while ((word = words.pop())) {
        // word
        line.push(word);
        tspan.text(line.join(' '));
        if (tspan.node().getComputedTextLength() > boxWidth) {
          line.pop();
          tspan.text(line.join(' '));
          line = [word];
          tspan = text
            .append('tspan')
            .attr('x', -(boxWidth / 2))
            .attr('y', y)
            .attr('dy', `${++lineNumber * lineHeight + dy}em`)
            .text(word);
        }
      }
    });
  }

  /*
  nodeEnter
    .append('text')
    // .attr('dy', '0.31em')
    .attr('dy', 0)
    .attr('dx', 0)
    // .attr('x', d => 0)
    // .attr('x', d => (d._children ? -6 : 6))
    // .attr('text-anchor', d => (d._children ? 'end' : 'start'))
    .text(d => d.data.fullname);
  */

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
  const link = gLink.selectAll('path').data(links, d => d.target.id);

  // Enter any new links at the parent's previous position.
  const linkEnter = link
    .enter()
    .append('path')
    .attr('d', d => {
      const o = { x: source.x0, y: source.y0 };
      return diagonal({ source: o, target: o });
    });

  // Transition links to their new position.
  link
    .merge(linkEnter)
    .transition(transition)
    .attr('d', diagonal);

  // Transition exiting nodes to the parent's new position.
  link
    .exit()
    .transition(transition)
    .remove()
    .attr('d', d => {
      const o = { x: source.x, y: source.y };
      return diagonal({ source: o, target: o });
    });

  // Stash the old positions for transition.
  root.eachBefore(d => {
    d.x0 = d.x;
    d.y0 = d.y;
  });
}

update(root);

// return svg.node();

/*
A possible solution is using this simple math:

node.attr("transform", function(d) {
    return "translate(" + (d.x = Math.max(0, Math.min(width, d.x))) + "," 
    + (d.y = Math.max(0, Math.min(height, d.y))) + ")"
});
If you want to take into account the radii of your circles (which right now is 10), it becomes:

node.attr("transform", function(d) {
    return "translate(" + (d.x = Math.max(10, Math.min(width - 10, d.x))) + "," 
    + (d.y = Math.max(10, Math.min(height - 10, d.y))) + ")"
});
*/
