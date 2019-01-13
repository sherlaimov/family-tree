export const rootNodeId = 'MhCX23FNQm';
export const motherId = 'Vt4eiud7gy';
export const eleonoraId = 'kRfciWawSG';
export const schnelleIvan = 'MhCXuujLud';
export const sherlaimovaDariaId = 'v77GrqyjEL';

export const hasProp = Function.prototype.call.bind(Object.prototype.hasOwnProperty);
export const hasNoSpouses = data => data.filter(node => node.spouse === undefined);
export const hasNoParents = o => o.father === undefined && o.mother === undefined;
export const findById = ({ data, id }) => data.find(person => person.id === id);

export const getChildren = o =>
  ['spouse', 'child'].reduce((xs, x) => (xs && xs[x] ? xs[x] : null), o);

export const compose = (...fns) => fns.reduce((f, g) => (...args) => f(g(...args)));
