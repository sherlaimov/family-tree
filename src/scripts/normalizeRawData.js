import path from 'path';
import fs from 'fs';
import util from 'util';

import { flattenData, hasProp } from './index';

const readFile = util.promisify(fs.readFile);
const writeFile = util.promisify(fs.writeFile);

const filePathAll = path.resolve(__dirname, '../../data/sherlaimovTreeRaw.json');

const rootNodeId = 'MhCX23FNQm';
const motherId = 'Vt4eiud7gy';

const hasNoParents = o => o.father === undefined && o.mother === undefined;

const hasNoSpouses = data => data.filter(node => node.spouse === undefined);

const findById = ({ data, id }) => data.find(person => person.id === id);

const getChildren = o => ['spouse', 'child'].reduce((xs, x) => (xs && xs[x] ? xs[x] : null), o);

const getSpouseId = o => {
  if (Array.isArray(o.spouse)) {
    const { id } = o.spouse.find(line => hasProp(line, 'id') && line.id !== '');
    return id;
  }
  return ['spouse', 'id'].reduce((xs, x) => (xs && xs[x] ? xs[x] : null), o);
};

const findIndexById = ({ data, id }) => data.findIndex(person => person.id === id);

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
// ! SPOUSE prop can be an array
// TODO if no parents object should merge with a spouse object:
// TODO 1) by a spouse property
// TODO 2) children should be merged as well
// ! IF NO PARENTS && NO SPOUSE LEAVE AS IT IS
// ! IF NO PARENTS && NO SPOUSE && NO CHILDREN -> REMOVE

const normalizeData = data =>
  data.map(person => {
    const { spouse } = person;
    if (Array.isArray(spouse)) {
      const newSpouse = spouse.map(line => {
        if (line.id === '') {
          line.id = 'Unknown spouse';
          return line;
        }
        return line;
      });
      person.spouse = newSpouse;
    }
    return person;
  });

const mergeBySpouseIfNoParents = data => {
  const dataCopy = [...data];

  for (let idx = 0; idx < data.length; idx += 1) {
    if (hasNoParents(data[idx])) {
      const spouseId = getSpouseId(data[idx]);
      const spouseIndex = findIndexById({ data: dataCopy, id: spouseId });
      if (spouseIndex !== -1) {
        if (hasProp(dataCopy[spouseIndex], 'spouseData')) {
          let spouseDataCopy;
          if (Array.isArray(dataCopy[spouseIndex].spouseData)) {
            spouseDataCopy = [...dataCopy[spouseIndex].spouseData];
            dataCopy[spouseIndex].spouseData = [...spouseDataCopy, { ...data[idx] }];
          } else {
            spouseDataCopy = { ...dataCopy[spouseIndex].spouseData };
            dataCopy[spouseIndex].spouseData = [spouseDataCopy, { ...data[idx] }];
          }
          dataCopy.splice(idx, 1, { removed: true });
        } else {
          dataCopy[spouseIndex].spouseData = { ...data[idx] };
          dataCopy.splice(idx, 1, { removed: true });
        }
      }
    }
  }
  const result = dataCopy.filter(person => hasProp(person, 'removed') === false);
  return result;
};

const runParser = async () => {
  const data = await getRawTreeData();
  // console.log(personsWithSpouseArray);
  const normalizedFullData = normalizeData(data);
  const mergedBySpouse = mergeBySpouseIfNoParents(normalizedFullData);
  const noParentsRoots = mergedBySpouse.filter(person => hasNoParents(person));
  console.log(mergedBySpouse.length);
  console.log(noParentsRoots.length);
  const testJson = JSON.stringify(noParentsRoots);
  const file = writeFile('./data/sherlaimov/stillNoParents.json', testJson, 'utf8');
  file.then(data => console.log('Success')).catch(e => console.log(e));
};

runParser();
