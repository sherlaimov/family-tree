export const personObject = {
  fullname: 'Шерлаимов Алексей Герасимович',
  sex: 'M',
  sn: 'Шерлаимов',
  firstName: 'Алексей',
  patronymic: 'Герасимович',
  ltrust: 10,
  lconf: 0,
  di: '07.01.2013',
  father: { id: 'MhCX23FNQm' },
  mother: { id: 'v77GrqyjEL' },
  spouse: { marriage: {}, child: { id: '12ygNc4wKC' }, id: '12ygMOCPhY' },
  id: 'V866yZb5Vz'
};

const getChildren = o => ['spouse', 'child'].reduce((xs, x) => (xs && xs[x] ? xs[x] : null), o);

console.log(getChildren(personObject));

export const nested = {
  id: 1,
  children: [
    { id: 2 },
    {
      id: 3,
      children: [{ id: 5 }, { id: 6 }]
    },
    { id: 4 }
  ]
};

const collectedGroups = [
  [{ id: 'asdsd' }, { id: 'jh' }],
  [{ id: 'kk' }],
  [{ id: 1 }, { id: 'as' }]
];
const findById = id => data.find(person => person.id === id);

const getIndexIfPresent = twoPersons => {
  const firstId = twoPersons[0].id; // ?
  const secondId = twoPersons[1].id; // ?
  return collectedGroups.findIndex(subset =>
    subset.some(({ id }) => id === firstId || id === secondId)
  );
};
const uniqueSubset = data => {
  const resArr = [];
  data.filter(item => {
    const i = resArr.findIndex(x => x.id === item.id);
    if (i <= -1) {
      resArr.push(item);
    }
    return null;
  });
};
function removeDuplicates(myArr, prop) {
  return myArr.filter(
    (obj, pos, arr) => arr.map(mapObj => mapObj[prop]).indexOf(obj[prop]) === pos
  );
}

const calculateNestedObjects = object => {
  if (object.hasOwnProperty('children')) {
    const { children } = object;
    delete object.children;
    found.push(object);
    for (let i = 0; i < children.length; i++) {
      calculateNestedObjects(children[i]);
    }
  }
};

const subset = [{ a: 1 }, { a: 2 }, { a: 1 }];
console.log(removeDuplicates(subset, 'a'));
// const res = getIndexIfPresent([{ id: 'd' }, { id: 'kk' }]);
