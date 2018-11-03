import * as d3 from 'd3';
import data from '../../../data/d3noob';
import chartFactory from '../../helpers/common';

const width = window.innerWidth;
const height = window.innerHeight;

const colors = d3.scaleOrdinal(d3.schemeDark2);

const { container } = chartFactory();

// ************** Generate the tree diagram	 *****************

// const i = 0;

const duration = 750;

let root;

// declares a tree layout and assigns the size
const treemap = d3.tree().size([height, width]);

const shiftedData = data.children[0];
// Assigns parent, children, height, depth
root = d3.hierarchy(data, d => d.children);
root.x0 = width / 2;
root.y0 = 0;
// console.log({ root });
//  after the second level
root.children.forEach(collapse);

update(root);

// Collapse the node and all it's children
function collapse(d) {
  if (d.children) {
    d._children = d.children;
    d._children.forEach(collapse);
    d.children = null;
  }
}

function update(source) {
  // Assigns the x and y position for the nodes
  const treeData = treemap(root);
  // console.log({ treeData });

  // Compute the new tree layout.
  const nodes = treeData.descendants();
  console.log({ nodes });
  const links = treeData.descendants().slice(1);
  console.log({ links });

  // Normalize for fixed-depth.
  nodes.forEach(d => {
    d.y = d.depth * 100;
  });

  // ****************** Nodes section ***************************

  // Update the nodes...
  const node = container.selectAll('g.node').data(nodes, (d, i) => d.id || (d.id = ++i));

  // Enter any new modes at the parent's previous position.
  const nodeEnter = node
    .enter()
    .append('g')
    .attr('class', 'node')
    .attr('transform', d => `translate(${source.x0},${source.y0})`)
    .on('click', click);

  // Add Circle for the nodes
  nodeEnter
    .append('circle')
    .attr('class', 'node')
    .attr('r', 1e-6)
    .style('fill', d => (d._children ? 'lightsteelblue' : '#fff'));

  // Add labels for the nodes
  /**
   nodeEnter
     .append('text')
     .attr('dy', '.35em')
     .attr('x', d => (d.children || d._children ? -13 : 13))
     .attr('text-anchor', d => (d.children || d._children ? 'end' : 'start'))
     .text(d => d.data.name);
   */

  nodeEnter
    .append('text')
    .attr('y', d => (d.children || d._children ? -18 : 18))
    .attr('dy', '.35em')
    .attr('text-anchor', 'middle')
    .text(d => d.data.name)
    .style('fill-opacity', 1);

  // UPDATE
  const nodeUpdate = nodeEnter.merge(node);

  // Transition to the proper position for the node
  nodeUpdate
    .transition()
    .duration(duration)
    // .attr('transform', d => `translate(${d.y},${d.x})`);
    .attr('transform', d => `translate(${d.x},${d.y})`);

  // Update the node attributes and style
  nodeUpdate
    .select('circle.node')
    .attr('r', 10)
    .style('fill', d => (d._children ? 'lightsteelblue' : '#fff'))
    .attr('cursor', 'pointer');

  // Remove any exiting nodes
  const nodeExit = node
    .exit()
    .transition()
    .duration(duration)
    .attr('transform', () => `translate(${source.x},${source.y})`)
    .remove();

  // On exit reduce the node circles size to 0
  nodeExit.select('circle').attr('r', 1e-6);

  // On exit reduce the opacity of text labels
  nodeExit.select('text').style('fill-opacity', 1e-6);

  // ****************** links section ***************************

  // Update the links...
  const link = container.selectAll('path.link').data(links, d => d.id);

  // Enter any new links at the parent's previous position.
  const linkEnter = link
    .enter()
    .insert('path', 'g')
    .attr('class', 'link')
    .attr('d', d => {
      const o = { x: source.x0, y: source.y0 };
      return diagonal(o, o);
    });

  // UPDATE
  const linkUpdate = linkEnter.merge(link);

  // Transition back to the parent element position
  linkUpdate
    .transition()
    .duration(duration)
    .attr('d', d => diagonal(d, d.parent));

  // Remove any exiting links
  const linkExit = link
    .exit()
    .transition()
    .duration(duration)
    .attr('d', d => {
      const o = { x: source.x, y: source.y };
      return diagonal(o, o);
    })
    .remove();

  // Store the old positions for transition.
  nodes.forEach(d => {
    d.x0 = d.x;
    d.y0 = d.y;
  });

  // Creates a curved (diagonal) path from parent to the child nodes
  function diagonal(s, d) {
    const path = `M ${s.x} ${s.y}
            C ${s.x} ${(s.y + d.y) / 2} ,
            ${d.x} ${(s.y + d.y) / 2},
            ${d.x} ${d.y}`;

    return path;
  }

  // Toggle children on click.
  function click(d) {
    if (d.children) {
      d._children = d.children;
      d.children = null;
    } else {
      d.children = d._children;
      d._children = null;
    }
    update(d);
  }
}
