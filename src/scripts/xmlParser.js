const fs = require('fs');
const path = require('path');
const convert = require('xml-js');
const util = require('util');

const writeFile = util.promisify(fs.writeFile);

const filePath = path.resolve(__dirname, '../../data/Eugene-Sherlaimov.xml');

const xml = fs.readFileSync(filePath, 'utf8');

const removeJsonTextAttribute = (value, parentElement) => {
  try {
    const keyNo = Object.keys(parentElement._parent).length;
    const keyName = Object.keys(parentElement._parent)[keyNo - 1];
    parentElement._parent[keyName] = nativeType(value);
  } catch (e) {
    console.log(e);
  }
};

function nativeType(value) {
  const nValue = Number(value);
  if (!isNaN(nValue)) {
    return nValue;
  }
  const bValue = value.toLowerCase();
  if (bValue === 'true') {
    return true;
  }
  if (bValue === 'false') {
    return false;
  }
  return value;
}

const attributesFn = (value, parentElement) => value;
const whichType = val =>
  Object.prototype.toString
    .call(val)
    .match(/^\[object\s(.*)\]$/)[1]
    .toLowerCase();

const elementNameFn = (value, parentElement) => {
  if (value === 'bfdate') {
    return 'birthDate';
  }
  if (value === 'msn') {
    return 'lastName';
  }
  if (value === 'fn') {
    return 'firstName';
  }
  if (value === 'mn') {
    return 'patronymic';
  }
  return value;
};

const options = {
  compact: true,
  trim: true,
  ignoreDeclaration: true,
  ignoreInstruction: true,
  // ignoreAttributes: true,
  ignoreComment: true,
  ignoreCdata: true,
  ignoreDoctype: true,
  elementNameFn,
  // attributesFn,
  // attributeNameFn,
  textFn: removeJsonTextAttribute
  // alwaysChildren: true,
};

const result = convert.xml2js(xml, options);
const { agelongtree } = result;

function removeAttributes(object) {
  if (typeof object !== 'object') return;

  if (object.hasOwnProperty('_attributes')) {
    const [keyAndVal] = Object.entries(object._attributes);
    const [key, val] = keyAndVal;
    object[key] = val;
    delete object._attributes;
  }
  Object.keys(object).forEach(keyV => {
    if (Array.isArray(object[keyV])) {
      object[keyV].forEach(value => {
        if (typeof object[keyV] === 'object') {
          return removeAttributes(value);
        }
      });
    }
    if (typeof object[keyV] === 'object') {
      return removeAttributes(object[keyV]);
    }
  });
  return object;
}

const noAttributesData = removeAttributes(agelongtree.Pers.r);

const removeRnFromPreview = data => {
  // text.replace(/\r\n/, '');
  const removeRn = text => text.split('\r\n').join('');
  const handleArray = array => {
    const targetArray = [...array];
    return targetArray.map(item => {
      if (item.hasOwnProperty('preview')) {
        item.preview = removeRn(item.preview);
      }
      return item;
    });
  };
  return data.map(item => {
    if (item.hasOwnProperty('doc')) {
      if ('preview' in item.doc) {
        item.doc.preview = removeRn(item.doc.preview);
      }
      if (Array.isArray(item.doc)) {
        item.doc = handleArray(item.doc);
      }
    }
    return item;
  });
};

const targetData = removeRnFromPreview(noAttributesData);
const testJson = JSON.stringify(targetData);

const file = writeFile('./sherlaimov-tree.json', testJson, 'utf8');

file.then(() => console.log('Success')).catch(e => console.log(e));
