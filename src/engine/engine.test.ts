import { describe, expect, it } from 'vitest';
import { countSigFigs, formatSig, parseNumber } from './numeric';
import { molarMass, molarMassIgnoringGroupSubscript, parseFormula } from './formula';
import { checkAnswer } from './check';
import type { NumericAnswer } from '../content/types';

describe('parseNumber', () => {
  it.each([
    ['12.5', 12.5, 3, false],
    ['0.0030', 0.003, 2, false],
    ['1500', 1500, 2, false],
    ['1500.', 1500, 4, false],
    ['3.01e23', 3.01e23, 3, true],
    ['3.01E-4', 3.01e-4, 3, true],
    ['3.01 x 10^23', 3.01e23, 3, true],
    ['3.01×10^23', 3.01e23, 3, true],
    ['3.01*10^23', 3.01e23, 3, true],
    ['6.020 X 10 ^ -4', 6.02e-4, 4, true],
    ['3.01×10²³', 3.01e23, 3, true],
    ['1,250', 1250, 3, false],
    ['−2.0', -2, 2, false],
  ])('%s', (text, value, sf, sci) => {
    const p = parseNumber(text)!;
    expect(p).not.toBeNull();
    expect(p.value).toBeCloseTo(value, 20);
    expect(p.value / value).toBeCloseTo(1, 10);
    expect(p.sigFigs).toBe(sf);
    expect(p.scientific).toBe(sci);
  });

  it('rejects junk', () => {
    expect(parseNumber('abc')).toBeNull();
    expect(parseNumber('1.2.3')).toBeNull();
    expect(parseNumber('')).toBeNull();
  });

  it('counts sig figs', () => {
    expect(countSigFigs('0.00450')).toBe(3);
    expect(countSigFigs('100')).toBe(1);
    expect(countSigFigs('100.0')).toBe(4);
  });

  it('formats', () => {
    expect(formatSig(1.505e24, 3)).toBe('1.51 × 10^{24}');
    expect(formatSig(0.4275, 3)).toBe('0.428');
    expect(formatSig(29.22, 3)).toBe('29.2');
    expect(formatSig(1250, 2)).toBe('1300');
  });
});

describe('formula', () => {
  it('parses nested groups and hydrates', () => {
    expect(parseFormula('Ca(NO3)2')).toEqual({ Ca: 1, N: 2, O: 6 });
    expect(parseFormula('CuSO4·5H2O')).toEqual({ Cu: 1, S: 1, O: 9, H: 10 });
    expect(parseFormula('(NH4)3PO4')).toEqual({ N: 3, H: 12, P: 1, O: 4 });
  });
  it('uses NL chart molar masses', () => {
    expect(molarMass('H2O')).toBe(18.02);
    expect(molarMass('Ca(NO3)2')).toBe(164.1);
    expect(molarMass('NaCl')).toBe(58.44);
    expect(molarMass('H2SO4')).toBe(98.09);
    expect(molarMass('CO2')).toBe(44.01);
  });
  it('computes the ignored-group-subscript mistake', () => {
    expect(molarMassIgnoringGroupSubscript('Ca(NO3)2')).toBe(102.09);
    expect(molarMassIgnoringGroupSubscript('H2O')).toBeNull();
  });
  it('rejects bad capitals', () => {
    expect(() => parseFormula('NACL')).toThrow();
  });
});

describe('checkAnswer numeric', () => {
  const spec: NumericAnswer = { kind: 'numeric', value: 0.42779, sigFigs: 3, unit: 'mol' };
  it('accepts correct value', () => {
    expect(checkAnswer(spec, { kind: 'numeric', text: '0.428' }).status).toBe('correct');
  });
  it('accepts extra sig figs with a note', () => {
    const r = checkAnswer(spec, { kind: 'numeric', text: '0.42779' });
    expect(r.status).toBe('correct');
    expect(r.note).toMatch(/5 sig figs/);
  });
  it('strict sig figs rejects', () => {
    expect(checkAnswer({ ...spec, strictSigFigs: true }, { kind: 'numeric', text: '0.43' }).status).toBe('incorrect');
  });
  it('accepts under-rounded value with a note', () => {
    const r = checkAnswer(spec, { kind: 'numeric', text: '0.43' });
    expect(r.status).toBe('correct');
    expect(r.note).toBeDefined();
  });
  it('spots power-of-ten errors', () => {
    const r = checkAnswer(spec, { kind: 'numeric', text: '4.28' });
    expect(r.status).toBe('incorrect');
    expect(r.message).toMatch(/power of 10/);
  });
  it('matches listed mistakes', () => {
    const r = checkAnswer(spec, { kind: 'numeric', text: '1461' }, [{ value: 1461.2, message: 'multiplied' }]);
    expect(r.message).toBe('multiplied');
  });
  it('checks unit choice', () => {
    const s: NumericAnswer = { ...spec, unitChoices: ['g', 'mol'] };
    expect(checkAnswer(s, { kind: 'numeric', text: '0.428', unit: 'g' }).status).toBe('incorrect');
    expect(checkAnswer(s, { kind: 'numeric', text: '0.428', unit: 'mol' }).status).toBe('correct');
  });
  it('flags unreadable input as invalid', () => {
    expect(checkAnswer(spec, { kind: 'numeric', text: 'abc' }).status).toBe('invalid');
  });
});

describe('checkAnswer formula', () => {
  const spec = { kind: 'formula' as const, formula: 'Ca(NO3)2' };
  it('accepts', () => expect(checkAnswer(spec, { kind: 'formula', text: 'Ca(NO₃)₂' }).status).toBe('correct'));
  it('flags capitals', () =>
    expect(checkAnswer(spec, { kind: 'formula', text: 'CA(NO3)2' }).message).toMatch(/capital/));
  it('flags missing brackets', () =>
    expect(checkAnswer(spec, { kind: 'formula', text: 'CaN2O6' }).message).toMatch(/brackets/));
});

describe('checkAnswer name', () => {
  const spec = { kind: 'name' as const, accepted: ['iron(III) chloride'], oldNames: ['ferric chloride'] };
  const check = (text: string) => checkAnswer(spec, { kind: 'name', text });
  it('forgives case and spacing', () => {
    expect(check('Iron (III)  Chloride').status).toBe('correct');
    expect(check('iron(iii)chloride').status).toBe('correct');
  });
  it('redirects old names without counting a try', () => expect(check('ferric chloride').status).toBe('invalid'));
  it('flags a missing Roman numeral', () => expect(check('iron chloride').message).toMatch(/Roman numeral/));
  it('flags a wrong Roman numeral', () => expect(check('iron(II) chloride').message).toMatch(/Check the Roman numeral/));
  it('flags -ine endings', () => expect(check('iron(III) chlorine').message).toMatch(/-ide/));
  it('flags prefixes', () =>
    expect(checkAnswer({ kind: 'name', accepted: ['calcium chloride'] }, { kind: 'name', text: 'calcium dichloride' }).message).toMatch(/prefixes/));
});
