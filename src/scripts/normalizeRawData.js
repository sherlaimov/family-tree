import path from 'path';
import fs from 'fs';
import util from 'util';

import { compose, hasNoParents, hasProp } from './common';

const readFile = util.promisify(fs.readFile);
const writeFile = util.promisify(fs.writeFile);

const filePathAll = path.resolve(__dirname, '../../data/sherlaimovTreeRaw.json');

const getPreview = o => ['doc', 'preview'].reduce((acc, x) => (acc && acc[x] ? acc[x] : null), o);

const getSpouseId = o => {
  if (Array.isArray(o.spouse)) {
    const { id } = o.spouse.find(line => hasProp(line, 'id') && line.id !== '');
    return id;
  }
  return ['spouse', 'id'].reduce((xs, x) => (xs && xs[x] ? xs[x] : null), o);
};

const findIndexById = ({ data, id }) => data.findIndex(person => person.id === id);

async function getRawTreeData() {
  // const mapData = ({ doc, ...rest }) => ({ ...rest });
  try {
    const response = await readFile(filePathAll, 'utf8');
    const data = JSON.parse(response);
    return data;
  } catch (e) {
    console.error(e);
    return undefined;
  }
}
// TODO if no parents object should merge with a spouse object:
// TODO 1) by a spouse property
// TODO 2) children should be merged as well
// ! IF NO PARENTS && NO SPOUSE LEAVE AS IT IS
// ! IF NO PARENTS && NO SPOUSE && NO CHILDREN -> REMOVE

const addPersonImage = person => {
  if (hasProp(person, 'doc')) {
    if (Array.isArray(person.doc)) {
      const targetDoc = person.doc.find(doc => {
        const title = String(doc.title);
        if (title.includes(person.firstName)) {
          return true;
        }
      });
      if (targetDoc !== null && targetDoc !== undefined) {
        person.image = targetDoc.preview;
      } else {
        person.image = person.doc[0].preview;
      }
    } else {
      person.image = getPreview(person);
    }

    delete person.doc;
  }
  return person;
};
const mergeSpouseArray = person => {
  if (!hasProp(person, 'spouse')) return person;
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
};

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
  const normalizedFullData = data.map(addPersonImage).map(mergeSpouseArray);
  const mergedBySpouse = mergeBySpouseIfNoParents(normalizedFullData);
  const noParentsRoots = mergedBySpouse.filter(person => hasNoParents(person));
  console.log(`No parents roots total => ${noParentsRoots.length}`);
  console.log(`MergedBySoupe nodes total => ${mergedBySpouse.length}`);
  const json = JSON.stringify(mergedBySpouse);
  const file = writeFile('./data/sherlaimov/mergedBySpouse.json', json, 'utf8');
  file.then(() => console.log('Success')).catch(e => console.log(e));
};

runParser();
