import path from 'path';
import fs from 'fs';
import util from 'util';

import { hasProp, schnelleIvan, sherlaimovaDariaId } from './common';

const readFile = util.promisify(fs.readFile);
const writeFile = util.promisify(fs.writeFile);

const filePathAll = path.resolve(__dirname, '../../data/sherlaimov/mergedBySpouseAndByHand2.json');

const getChildren = o => {
  if (Array.isArray(o)) {
    return o.reduce((acc, line) => {
      if (hasProp(line, 'child') && line.child.id !== '') {
        acc.push(line.child.id);
      }
      return acc;
    }, []);
  }
  if (hasProp(o, 'spouse') === false || hasProp(o.spouse, 'child' === false)) {
    return [];
  }
  const children = ['spouse', 'child'].reduce((acc, x) => (acc && acc[x] ? acc[x] : []), o);
  // if (children === null) {
  //   return [];
  // }
  if (Array.isArray(children)) {
    return children.map(({ id }) => id);
  }
  return [children.id];
};

const getParentId = o => {
  if (hasProp(o, 'father')) {
    return o.father.id;
  }
  if (hasProp(o, 'mother')) {
    return o.mother.id;
  }
  return null;
};

async function getTreeData() {
  const mapData = person => {
    if (hasProp(person, 'firstName')) {
      return person;
    }
    person.firstName = 'Unknown Name';
    return person;
  };
  try {
    const response = await readFile(filePathAll, 'utf8');
    const data = JSON.parse(response);
    return data.map(mapData);
  } catch (e) {
    console.error(e);
    return undefined;
  }
}

const createFile = ({ data, fileName }) => {
  const json = JSON.stringify(data);
  const finalString = 'define(() => ('.concat(json).concat('))');
  const file = writeFile(`./data/sherlaimov/${fileName}.js`, finalString, 'utf8');
  file.then(() => console.log('Success')).catch(e => console.log(e));
};

const calculateChildren = data =>
  data.map(rootNode => {
    const { fullname } = rootNode;
    let childrenCnt = 0;

    function getAllChildren(node) {
      if (hasProp(node, 'children') === false) return childrenCnt;

      const { children } = node;
      childrenCnt += children.length;

      for (let i = 0; i < children.length; i += 1) {
        if (hasProp(children[i], 'children')) {
          getAllChildren(children[i]);
        }
      }

      return childrenCnt;
    }
    childrenCnt = getAllChildren(rootNode);
    return { fullname, cnt: childrenCnt };
  });

const buildTrees = async () => {
  const data = await getTreeData();
  console.log(`Total nodes => ${data.length}`);

  const dataMap = data.reduce((map, node) => {
    if (hasProp(node, 'spouseData')) {
      const { spouseData } = node;
      if (Array.isArray(spouseData)) {
        spouseData.forEach(spouse => (map[spouse.id] = node));
      } else {
        map[spouseData.id] = node;
      }
    }
    map[node.id] = node;
    return map;
  }, {});

  // create the tree array
  const treeData = [];
  data.forEach(node => {
    const parentNode = getParentId(node);
    const parent = dataMap[parentNode];

    if (parent) {
      // create child array if it doesn't exist
      (parent.children || (parent.children = [])).push(node);
    } else {
      // attach to root if has children
      const nodeChildrenIds = getChildren(node);
      if (nodeChildrenIds.length > 0) {
        node.children = [];
        nodeChildrenIds.forEach(childId => {
          node.children.push(dataMap[childId]);
        });
      }
      treeData.push(node);
    }
  });
  console.log(`Tree data.length => ${treeData.length}`);
  const withChildren = treeData.filter(person => hasProp(person, 'children'));
  const allRootChildrenCnt = calculateChildren(withChildren);
  console.table(allRootChildrenCnt);
  const targetNestedData = withChildren.find(node => node.id === sherlaimovaDariaId);
  createFile({ data: targetNestedData, fileName: 'sherlaimovaDariaAndByHand2' });
};

buildTrees();
