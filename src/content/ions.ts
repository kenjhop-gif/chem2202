// Ions used in naming questions. Charges match the NL periodic chart and the class ion list.

export interface Ion {
  /** Formula without charge, e.g. "Fe", "SO4", "NH4". */
  formula: string;
  name: string;
  charge: number;
  polyatomic?: boolean;
  /** Metals with more than one possible charge need a Roman numeral. */
  multivalent?: boolean;
  /** Older (non-IUPAC) name, for multivalent metals. */
  oldName?: string;
}

export const FIXED_CATIONS: Ion[] = [
  { formula: 'Li', name: 'lithium', charge: 1 },
  { formula: 'Na', name: 'sodium', charge: 1 },
  { formula: 'K', name: 'potassium', charge: 1 },
  { formula: 'Ag', name: 'silver', charge: 1 },
  { formula: 'Mg', name: 'magnesium', charge: 2 },
  { formula: 'Ca', name: 'calcium', charge: 2 },
  { formula: 'Ba', name: 'barium', charge: 2 },
  { formula: 'Zn', name: 'zinc', charge: 2 },
  { formula: 'Al', name: 'aluminum', charge: 3 },
];

export const MULTIVALENT_CATIONS: Ion[] = [
  { formula: 'Fe', name: 'iron', charge: 2, multivalent: true, oldName: 'ferrous' },
  { formula: 'Fe', name: 'iron', charge: 3, multivalent: true, oldName: 'ferric' },
  { formula: 'Cu', name: 'copper', charge: 1, multivalent: true, oldName: 'cuprous' },
  { formula: 'Cu', name: 'copper', charge: 2, multivalent: true, oldName: 'cupric' },
  { formula: 'Pb', name: 'lead', charge: 2, multivalent: true, oldName: 'plumbous' },
  { formula: 'Pb', name: 'lead', charge: 4, multivalent: true, oldName: 'plumbic' },
  { formula: 'Sn', name: 'tin', charge: 2, multivalent: true, oldName: 'stannous' },
  { formula: 'Sn', name: 'tin', charge: 4, multivalent: true, oldName: 'stannic' },
  { formula: 'Co', name: 'cobalt', charge: 2, multivalent: true, oldName: 'cobaltous' },
  { formula: 'Co', name: 'cobalt', charge: 3, multivalent: true, oldName: 'cobaltic' },
  { formula: 'Mn', name: 'manganese', charge: 2, multivalent: true },
  { formula: 'Cr', name: 'chromium', charge: 3, multivalent: true, oldName: 'chromic' },
];

export const AMMONIUM: Ion = { formula: 'NH4', name: 'ammonium', charge: 1, polyatomic: true };

export const MONATOMIC_ANIONS: Ion[] = [
  { formula: 'F', name: 'fluoride', charge: -1 },
  { formula: 'Cl', name: 'chloride', charge: -1 },
  { formula: 'Br', name: 'bromide', charge: -1 },
  { formula: 'I', name: 'iodide', charge: -1 },
  { formula: 'O', name: 'oxide', charge: -2 },
  { formula: 'S', name: 'sulfide', charge: -2 },
  { formula: 'N', name: 'nitride', charge: -3 },
  { formula: 'P', name: 'phosphide', charge: -3 },
];

export const POLYATOMIC_ANIONS: Ion[] = [
  { formula: 'OH', name: 'hydroxide', charge: -1, polyatomic: true },
  { formula: 'NO3', name: 'nitrate', charge: -1, polyatomic: true },
  { formula: 'NO2', name: 'nitrite', charge: -1, polyatomic: true },
  { formula: 'HCO3', name: 'hydrogen carbonate', charge: -1, polyatomic: true },
  { formula: 'ClO3', name: 'chlorate', charge: -1, polyatomic: true },
  { formula: 'MnO4', name: 'permanganate', charge: -1, polyatomic: true },
  { formula: 'CN', name: 'cyanide', charge: -1, polyatomic: true },
  { formula: 'SO4', name: 'sulfate', charge: -2, polyatomic: true },
  { formula: 'SO3', name: 'sulfite', charge: -2, polyatomic: true },
  { formula: 'CO3', name: 'carbonate', charge: -2, polyatomic: true },
  { formula: 'CrO4', name: 'chromate', charge: -2, polyatomic: true },
  { formula: 'Cr2O7', name: 'dichromate', charge: -2, polyatomic: true },
  { formula: 'PO4', name: 'phosphate', charge: -3, polyatomic: true },
];

export const HYDRATE_PREFIX = ['', 'mono', 'di', 'tri', 'tetra', 'penta', 'hexa', 'hepta', 'octa', 'nona', 'deca'];

const ROMAN = ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII'];

/** "Fe^{3+}", "SO4^{2−}" in formula markup. */
export function ionText(ion: Ion): string {
  const mag = Math.abs(ion.charge);
  return `[[${ion.formula}^{${mag === 1 ? '' : mag}${ion.charge > 0 ? '+' : '−'}}]]`;
}

export function cationName(ion: Ion): string {
  return ion.multivalent ? `${ion.name}(${ROMAN[ion.charge]})` : ion.name;
}

function gcd(a: number, b: number): number {
  return b ? gcd(b, a % b) : a;
}

export interface IonicCompound {
  cation: Ion;
  anion: Ion;
  nCation: number;
  nAnion: number;
  formula: string;
  name: string;
  oldName?: string;
}

function part(ion: Ion, n: number): string {
  if (n === 1) return ion.formula;
  return ion.polyatomic ? `(${ion.formula})${n}` : `${ion.formula}${n}`;
}

export function ionic(cation: Ion, anion: Ion): IonicCompound {
  const a = cation.charge;
  const b = -anion.charge;
  const lcm = (a * b) / gcd(a, b);
  const nCation = lcm / a;
  const nAnion = lcm / b;
  return {
    cation,
    anion,
    nCation,
    nAnion,
    formula: part(cation, nCation) + part(anion, nAnion),
    name: `${cationName(cation)} ${anion.name}`,
    oldName: cation.oldName ? `${cation.oldName} ${anion.name}` : undefined,
  };
}

/** Common formula mistakes for an ionic compound, as Mistake-style entries. */
export function ionicFormulaMistakes(c: IonicCompound): { formula: string; message: string }[] {
  const out: { formula: string; message: string }[] = [];
  const swapped = part(c.cation, c.nAnion) + part(c.anion, c.nCation);
  if (swapped !== c.formula) out.push({ formula: swapped, message: 'The numbers are swapped. You need enough of each ion for the charges to cancel.' });
  const oneToOne = c.cation.formula + c.anion.formula;
  if (oneToOne !== c.formula) out.push({ formula: oneToOne, message: `The charges don’t balance yet: ${c.cation.charge}+ and ${-c.anion.charge}−. How many of each ion make the total charge zero?` });
  return out;
}
