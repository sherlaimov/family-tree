const mapData = ({ doc, ...rest }) => ({ ...rest });
export default async function getTreeData() {
  const getData = async () => {
    try {
      const response = await fetch('../../data/sherlaimov-tree.json');
      const data = await response.json();
      const treeData = data.map(mapData);
      // .filter((node, i) => i < 200);

      return treeData;
    } catch (e) {
      console.log(e);
      return undefined;
    }
  };

  const data = await getData();
  // const hasProp = (obj, prop) => Object.prototype.hasOwnProperty.call(obj, prop)
  const hasProp = Function.prototype.call.bind(Object.prototype.hasOwnProperty);

  const whoAreYou = data.filter(
    person => !hasProp(person, 'father') && !hasProp(person, 'mother') && !person.spouse.id
  );

  console.log(whoAreYou);
  const links = data
    .map(person => {
      if (hasProp(person, 'father')) {
        return { target: person.id, source: person.father.id };
      }
      if (hasProp(person, 'mother')) {
        return { target: person.id, source: person.mother.id };
      }
      return { target: person.id, source: person.spouse.id };
    })
    .filter(link => link.source !== undefined && link.source !== '');
  return { nodes: data, links };
}

export const createLinks = async () => {
  const data = await getTreeData();
  const findChildById = childId => data.filter(person => person.id === childId);
  const getChildren = o => ['spouse', 'child'].reduce((xs, x) => (xs && xs[x] ? xs[x] : null), o);
};

// { target: id, source: 'sherlaimov' }
