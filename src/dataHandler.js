import * as d3 from 'd3';
import data from '../data/sherlaimov-tree.json';
import { addRoot } from './helpers/index';

console.log(root);
const d3noodConvert = data => {
  const dataMap = data.reduce((map, node) => {
    map[node.name] = node;
    return map;
  }, {});

  // create the tree array
  const treeData = [];
  data.forEach(node => {
    // add to parent
    const parent = dataMap[node.parent];
    if (parent) {
      // create child array if it doesn't exist
      (parent.children || (parent.children = []))
        // add node to child array
        .push(node);
    } else {
      // parent is null or missing
      treeData.push(node);
    }
  });
};

const stratifyData = () => {
  const root = d3
    .stratify()
    .id(d => d.name)
    .parentId(d => d.parent)(table);
};

const stratify = d3
  .stratify()
  .parentId(d => d.father.id)
  .id(d => d.id);

export default async function getTreeData() {
  const getData = async () => {
    try {
      const response = await fetch('../stratified.json');
      const data = await response.json();
      return data;
    } catch (e) {
      console.error(e);
      return undefined;
    }
  };
  const nodes = await getData();

  return nodes;
}

// getTreeData();
