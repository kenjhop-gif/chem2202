// Solubility rules for ionic compounds in water at 25 °C, as on the NL Chemistry 2202
// data table (2019 revision). High solubility (aq) > 0.1 mol/L; low solubility (s) < 0.1 mol/L.
import type { Ion } from './ions';

const GROUP_1 = ['Li', 'Na', 'K', 'Rb', 'Cs'];
const GROUP_2 = ['Be', 'Mg', 'Ca', 'Sr', 'Ba', 'Ra'];

function cationKey(c: Ion): string {
  // Cu+ vs Cu2+ matters for halides; Hg2 2+ and Hg+ are listed together.
  if (c.formula === 'Cu') return c.charge === 1 ? 'Cu+' : 'Cu2+';
  return c.formula;
}

/** Rows of the table: which cations make each anion **low** solubility, with the reason shown to students. */
export function isSoluble(cation: Ion, anion: Ion): boolean {
  const k = cationKey(cation);
  const alwaysSoluble = GROUP_1.includes(k) || k === 'NH4' || k === 'H';
  switch (anion.formula) {
    case 'NO3':
    case 'ClO3':
    case 'ClO4':
      return true;
    case 'Cl':
    case 'Br':
    case 'I':
      return !['Ag', 'Tl', 'Hg', 'Cu+', 'Pb'].includes(k);
    case 'CH3COO':
      return !['Ag', 'Hg'].includes(k);
    case 'SO4':
      return !['Ca', 'Sr', 'Ba', 'Ra', 'Pb', 'Ag'].includes(k);
    case 'S':
      return alwaysSoluble || GROUP_2.includes(k);
    case 'OH':
      return alwaysSoluble || ['Sr', 'Ba', 'Tl'].includes(k);
    case 'PO4':
    case 'SO3':
    case 'CO3':
      return alwaysSoluble;
    default:
      throw new Error(`No solubility rule for ${anion.formula}`);
  }
}

/** The data-table rule that decides a compound, in words. */
export function solubilityReason(cation: Ion, anion: Ion): string {
  const k = cationKey(cation);
  const sol = isSoluble(cation, anion);
  const ion = (a: Ion) => a.name;
  if (GROUP_1.includes(k) || k === 'NH4') return `Group 1 and ammonium compounds are all high solubility.`;
  switch (anion.formula) {
    case 'NO3':
    case 'ClO3':
      return `All ${ion(anion)}s are high solubility.`;
    case 'Cl':
    case 'Br':
    case 'I':
      return sol ? `Most ${ion(anion)}s are high solubility.` : `${ion(anion)}s of Ag^{+}, Pb^{2+}, Cu^{+}, Hg^{+}, and Tl^{+} are low solubility.`;
    case 'SO4':
      return sol ? 'Most sulfates are high solubility.' : 'Sulfates of Ca^{2+}, Sr^{2+}, Ba^{2+}, Ra^{2+}, Pb^{2+}, and Ag^{+} are low solubility.';
    case 'S':
      return sol ? 'Sulfides of groups 1 and 2 (and ammonium) are high solubility.' : 'Most sulfides are low solubility.';
    case 'OH':
      return sol ? 'Hydroxides of group 1, ammonium, Sr^{2+}, Ba^{2+}, and Tl^{+} are high solubility.' : 'Most hydroxides are low solubility.';
    default:
      return sol ? 'Group 1 and ammonium compounds of this ion are high solubility.' : `Most ${ion(anion)}s are low solubility (only group 1 and ammonium dissolve well).`;
  }
}
