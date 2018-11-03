import path from 'path';
import fs from 'fs';
import util from 'util';

import { flattenData, hasProp } from './index';

const readFile = util.promisify(fs.readFile);
const writeFile = util.promisify(fs.writeFile);

const filePathAll = path.resolve(__dirname, '../data/sherlaimov-tree.json');

async function getRawTreeData() {
  const mapData = ({ doc, ...rest }) => ({ ...rest });
  try {
    const response = await readFile(filePathAll, 'utf8');
    const data = JSON.parse(response);
    const mappedData = data.map(mapData);
    return mappedData;
  } catch (e) {
    console.error(e);
    return undefined;
  }
}

// Group data sets into multiple related networks
// Incrementally save related objects into groups
// OUTPUT -> array of arrays

const MAP = {
  father: 0,
  mother: 0,
  spouse: 0,
  children: 0
};
const logifTrue = val => {
  MAP[val] += 1;
};

const collectedGroups = [];
const unattached = [];
const stratifySparseArray = async () => {
  const data = await getRawTreeData();

  const findById = id => data.find(person => person.id === id);

  const getSpouseId = o => ['spouse', 'id'].reduce((xs, x) => (xs && xs[x] ? xs[x] : null), o);
  const getChildren = o => ['spouse', 'child'].reduce((xs, x) => (xs && xs[x] ? xs[x] : null), o);

  const getIndexIfRelated = twoRelated => {
    const firstId = twoRelated[0].id;
    const secondId = twoRelated[1].id;

    const checkPossibleRelations = person => {
      if (hasProp(person, 'father')) {
        if (person.father.id === firstId || person.father.id === secondId) {
          logifTrue('father');
          return true;
        }
      }
      if (hasProp(person, 'mother')) {
        if (person.mother.id === firstId || person.mother.id === secondId) {
          logifTrue('mother');
          return true;
        }
      }
      const spouseId = getSpouseId(person);
      if (spouseId && spouseId !== '') {
        // console.log('spouse');
        if (spouseId === firstId || spouseId === secondId) {
          logifTrue('spouse');
          return true;
        }
        // return spouseId === firstId || spouseId === secondId;
      }

      const children = getChildren(person);
      if (Array.isArray(children)) {
        // logifTrue('children');
        return children.some(childId => childId === firstId || childId === secondId);
      }
      if (children !== null && hasProp(children, 'id')) {
        if (children.id === firstId || children.id === secondId) {
          logifTrue('children');
          return true;
        }
      }

      return false;
    };
    return collectedGroups.findIndex(subset => subset.some(checkPossibleRelations));
  };
  const checkIfBothNotPresent = twoRelated => {
    const firstId = twoRelated[0].id;
    const secondId = twoRelated[1].id;

    const isFirstPresent = collectedGroups.findIndex(subset =>
      subset.some(({ id }) => id === firstId)
    );
    const isSecondPresent = collectedGroups.findIndex(subset =>
      subset.some(({ id }) => id === secondId)
    );
    if (isFirstPresent === -1 && isSecondPresent === -1) {
      return true;
    }
    if (isFirstPresent !== -1) {
      collectedGroups[isFirstPresent].push(twoRelated[1]);
    }
    if (isSecondPresent !== -1) {
      collectedGroups[isSecondPresent].push(twoRelated[0]);
    }
    return false;
  };
  const cnt = 0;
  const checkRelationAndRecord = twoPersons => {
    if (checkIfBothNotPresent(twoPersons) === false) return;
    const isPresentIndex = getIndexIfRelated(twoPersons);
    // console.log(isPresentIndex);
    if (isPresentIndex !== -1) {
      collectedGroups[isPresentIndex].push(...twoPersons);
    } else {
      // console.log(cnt++);
      collectedGroups.push(twoPersons);
    }
  };

  // We need to compare two arrays of objects
  const sortIntoRelatedGroups = person => {
    if (hasProp(person, 'father')) {
      const father = findById(person.father.id);
      checkRelationAndRecord([person, father]);
      return;
    }

    if (hasProp(person, 'mother')) {
      const mother = findById(person.mother.id);
      checkRelationAndRecord([person, mother]);
      return;
    }

    const spouseId = getSpouseId(person);
    if (spouseId && spouseId !== '') {
      const spouse = findById(spouseId);
      checkRelationAndRecord([person, spouse]);
    } else {
      const spouse = findById(spouseId);
      unattached.push(person, spouse);
    }
  };

  for (let i = 0; i < data.length; i += 1) {
    sortIntoRelatedGroups(data[i]);
  }
  return collectedGroups;
};

function removeDuplicates(myArr, prop) {
  return myArr.filter(
    (obj, pos, arr) => arr.map(mapObj => mapObj[prop]).indexOf(obj[prop]) === pos
  );
}

const getRestructuredData = async () => {
  const result = await stratifySparseArray();
  console.log(MAP);
  console.log(`Result.length => ${result.length}`);
  console.log(`Unattached.length => ${unattached.length}`);
  const lengths = result.map(subset => subset.length).sort((a, b) => b - a);
  const totalLengths = lengths.reduce((a, b) => a + b, 0);
  console.log({ totalLengths });
  console.log('Just lengths');
  console.log(lengths[0], lengths[1]);
  const largestSubset = result.filter(subset => subset.length === lengths[1]);

  const uniqueSubsets = result.map(subset => removeDuplicates(subset, 'id'));
  const uniqueLengths = uniqueSubsets.map(subset => subset.length).sort((a, b) => b - a);
  console.log('Unique lengths');
  console.log(uniqueLengths[0], uniqueLengths[1]);
  const totalUniqueLengths = uniqueLengths.reduce((a, b) => a + b, 0);
  console.log({ totalUniqueLengths });
  const sortedUniqueSubsets = uniqueSubsets.sort((a, b) => b.length - a.length);
  // console.log(largestSubset);
  // console.log(sortedUniqueSubsets[0]);
  // console.log(sortedUniqueSubsets[1].length);
  // return;
  const promises = [];
  for (let i = 0; i < 3; i += 1) {
    const json = JSON.stringify(sortedUniqueSubsets[i]);
    try {
      const file = writeFile(`./data/unique-set${i}.json`, json, 'utf8');
      promises.push(file);
    } catch (e) {
      console.log(e);
    }
  }
  Promise.all(promises).then(() => console.log('success'));
  // const testJson = JSON.stringify(sortedUniqueSubsets);
  // const file = writeFile('./sorted-unique.json', testJson, 'utf8');
  // file.then(data => console.log('Success')).catch(e => console.log(e));
};

// getRestructuredData();

const stratifyDataFromRoot = rootNode => {
  const childrenIds = getChildren(rootNode);
  // console.log(childrenIds);
  if (childrenIds === undefined) {
    console.log({ rootNode });
  }
  rootNode.children = [];
  // for (let i = 0; i < childrenIds.length; i++) {
  //   const child = findById({ data, id: childrenIds[i] });
  //   // console.log(child);
  //   rootNode.children.push(child);
  //   stratifyDataFromRoot(child);
  // }
  return rootNode;
};
