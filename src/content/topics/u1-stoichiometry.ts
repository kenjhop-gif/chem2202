import type { Question, Topic } from '../types';
import { TOPIC_META } from '../curriculum';
import { MOLAR_VOLUME_STP, f, given, measured, sf } from '../substances';
import { coefOf, eq, massToMolesSteps, molesToMassStep, molesToVolumeStep, pickPair, ratioStep } from '../stoich';
import { molarMass } from '../../engine/formula';
import type { Rng } from '../../engine/rng';

function massToMass(rng: Rng): Question {
  const { r, from, to } = pickPair(rng, (r, a) => r.reactants.includes(a));
  const m = measured(rng, 2, 90, 3);
  const { steps, n } = massToMolesSteps(from, m);
  const nTo = (n * coefOf(r, to)) / coefOf(r, from);
  return {
    prompt: `${r.context}: ${eq(r)}. What mass of ${f(to)} ${r.reactants.includes(to) ? 'is needed to react with' : 'is produced from'} ${given(m, 3)} g of ${f(from)}?`,
    steps: [...steps, ratioStep(r, from, to, n, sf(n, 4)), molesToMassStep(to, nTo)],
    finalMistakes: [
      { value: (m * coefOf(r, to)) / coefOf(r, from), message: 'You can’t use the mole ratio on grams. Convert to moles first.' },
      { value: n * molarMass(to), message: 'Don’t forget the mole ratio between the two substances.' },
    ],
  };
}

function massToVolume(rng: Rng): Question {
  const { r, from, to } = pickPair(rng, (r, a, b) => r.gases.includes(b) && !r.gases.includes(a) && r.reactants.includes(a));
  const m = measured(rng, 2, 90, 3);
  const { steps, n } = massToMolesSteps(from, m);
  const nTo = (n * coefOf(r, to)) / coefOf(r, from);
  return {
    prompt: `${r.context}: ${eq(r)}. What volume of ${f(to)} at STP is ${r.reactants.includes(to) ? 'needed for' : 'produced from'} ${given(m, 3)} g of ${f(from)}?`,
    steps: [...steps, ratioStep(r, from, to, n, sf(n, 4)), molesToVolumeStep(to, nTo)],
    finalMistakes: [{ value: nTo, message: 'That’s moles. One more step: × 22.7 L/mol for the volume at STP.' }],
  };
}

function volumeToMass(rng: Rng): Question {
  const { r, from, to } = pickPair(rng, (r, a, b) => r.gases.includes(a) && !r.gases.includes(b) && b !== 'H2O');
  const V = measured(rng, 1, 60, 3);
  const n = V / MOLAR_VOLUME_STP;
  const nTo = (n * coefOf(r, to)) / coefOf(r, from);
  return {
    prompt: `${r.context}: ${eq(r)}. What mass of ${f(to)} ${r.reactants.includes(to) ? 'reacts with' : 'forms from'} ${given(V, 3)} L of ${f(from)} at STP?`,
    steps: [
      {
        prompt: `Convert ${given(V, 3)} L of ${f(from)} at STP to moles.`,
        answer: { kind: 'numeric', value: n, unit: 'mol' },
        hints: ['At STP, 1 mol of gas = 22.7 L.', 'n = V ÷ 22.7 L/mol', `${given(V, 3)} ÷ 22.7 = ?`],
        mistakes: [{ value: V * MOLAR_VOLUME_STP, message: 'Litres → moles: divide by 22.7 L/mol.' }],
        explain: `n = ${given(V, 3)} L ÷ 22.7 L/mol = ${sf(n, 4)} mol`,
      },
      ratioStep(r, from, to, n, sf(n, 4)),
      molesToMassStep(to, nTo),
    ],
  };
}

function solutionToMass(rng: Rng): Question {
  const { r, from, to } = pickPair(rng, (r, a, b) => r.aqueous.includes(a) && !r.aqueous.includes(b) && b !== 'H2O' && !r.gases.includes(b));
  const c = measured(rng, 0.1, 2, 3);
  const vmL = measured(rng, 10, 250, 3);
  const n = c * (vmL / 1000);
  const nTo = (n * coefOf(r, to)) / coefOf(r, from);
  return {
    prompt: `${r.context}: ${eq(r)}. What mass of ${f(to)} ${r.reactants.includes(to) ? 'reacts with' : 'forms from'} ${given(vmL, 3)} mL of ${given(c, 3)} mol/L ${f(from)}?`,
    steps: [
      {
        prompt: `Moles of ${f(from)} in the solution.`,
        answer: { kind: 'numeric', value: n, unit: 'mol' },
        hints: ['n = c × V', `V = ${given(vmL, 3)} mL = ${sf(vmL / 1000, 3)} L`, `${given(c, 3)} × ${sf(vmL / 1000, 3)} = ?`],
        mistakes: [{ value: c * vmL, message: 'Use the volume in litres.' }],
        explain: `n = ${given(c, 3)} mol/L × ${sf(vmL / 1000, 3)} L = ${sf(n, 4)} mol`,
      },
      ratioStep(r, from, to, n, sf(n, 4)),
      molesToMassStep(to, nTo),
    ],
  };
}

function solutionToVolume(rng: Rng): Question {
  const { r, from, to } = pickPair(rng, (r, a, b) => r.aqueous.includes(a) && r.aqueous.includes(b) && r.reactants.includes(a) && r.reactants.includes(b));
  const cA = measured(rng, 0.1, 1.5, 3);
  const vA = measured(rng, 10, 100, 3);
  const cB = measured(rng, 0.1, 1.5, 3);
  const nA = cA * (vA / 1000);
  const nB = (nA * coefOf(r, to)) / coefOf(r, from);
  const vB = (nB / cB) * 1000;
  return {
    prompt: `${r.context}: ${eq(r)}. What volume of ${given(cB, 3)} mol/L ${f(to)} reacts completely with ${given(vA, 3)} mL of ${given(cA, 3)} mol/L ${f(from)}?`,
    steps: [
      {
        prompt: `Moles of ${f(from)}.`,
        answer: { kind: 'numeric', value: nA, unit: 'mol' },
        hints: ['n = c × V (in litres)', `${given(cA, 3)} × ${sf(vA / 1000, 3)}`, 'Keep an extra digit.'],
        mistakes: [{ value: cA * vA, message: 'Use the volume in litres.' }],
        explain: `n = ${sf(nA, 4)} mol`,
      },
      ratioStep(r, from, to, nA, sf(nA, 4)),
      {
        prompt: `Volume of ${f(to)} solution needed, in mL.`,
        answer: { kind: 'numeric', value: vB, unit: 'mL', sigFigs: 3 },
        hints: ['V = n ÷ c', `${sf(nB, 4)} ÷ ${given(cB, 3)} = ? L`, 'Multiply by 1000 for mL.'],
        mistakes: [{ value: vB / 1000, message: 'That’s in litres. The question asks for mL.' }, { value: nB * cB * 1000, message: 'V = n ÷ c, not n × c.' }],
        explain: `V = ${sf(nB, 4)} mol ÷ ${given(cB, 3)} mol/L = ${sf(vB / 1000, 3)} L = **${sf(vB, 3)} mL**`,
      },
    ],
  };
}

export const stoichiometryTopic: Topic = {
  meta: TOPIC_META['u1-stoichiometry'],
  summary: 'Grams, litres of gas, or a solution’s volume: convert to moles, use the mole ratio, then convert to what you need.',
  learn: [
    { type: 'key', title: 'The stoichiometry path', text: 'given quantity → **moles of given** → (mole ratio) → **moles of wanted** → wanted quantity' },
    {
      type: 'table',
      head: ['You have…', 'To moles', 'From moles'],
      rows: [
        ['mass (g)', 'n = m ÷ M', 'm = n × M'],
        ['gas volume at STP (L)', 'n = V ÷ 22.7 L/mol', 'V = n × 22.7 L/mol'],
        ['solution (mol/L and L)', 'n = c × V', 'V = n ÷ c'],
        ['particles', 'n = N ÷ N_{A}', 'N = n × N_{A}'],
      ],
    },
    { type: 'tip', text: 'The mole ratio only ever connects **moles** to **moles**. Never use it on grams or litres of solution directly.' },
    { type: 'background', title: 'Mole ratios', text: 'The middle step is Topic 14.', topicId: 'u1-mole-ratios' },
  ],
  examples: [
    {
      title: 'Mass to mass',
      problem: `2 ${f('H2')} + ${f('O2')} → 2 ${f('H2O')}. What mass of water forms from 8.00 g of H_{2}?`,
      steps: [
        { label: 'To moles', work: '8.00 g ÷ 2.02 g/mol = 3.960 mol H_{2}' },
        { label: 'Ratio', work: '3.960 × 2/2 = 3.960 mol H_{2}O' },
        { label: 'To grams', work: '3.960 × 18.02 = 71.4 g' },
      ],
      answer: '71.4 g of water',
    },
    {
      title: 'Solution to gas',
      problem: `${f('Zn')} + 2 ${f('HCl')} → ${f('ZnCl2')} + ${f('H2')}. What volume of H_{2} at STP forms from 50.0 mL of 2.00 mol/L HCl?`,
      steps: [
        { label: 'To moles', work: '2.00 mol/L × 0.0500 L = 0.100 mol HCl' },
        { label: 'Ratio', work: '0.100 × 1/2 = 0.0500 mol H_{2}' },
        { label: 'To litres', work: '0.0500 × 22.7 = 1.14 L' },
      ],
      answer: '1.14 L of H_{2} at STP',
    },
  ],
  stepGuide: [
    'Balanced equation first.',
    'Convert what you’re given to moles (÷ M, ÷ 22.7, or × c·V).',
    'Mole ratio: × wanted/given.',
    'Convert moles to what you need (× M, × 22.7, or ÷ c).',
  ],
  practice: [
    { id: 'm-m', skill: 'mass to mass', generate: massToMass },
    { id: 'm-v', skill: 'mass to gas volume', generate: massToVolume },
    { id: 'sol-m', skill: 'solution to mass', generate: solutionToMass },
    { id: 'v-m', skill: 'gas volume to mass', generate: volumeToMass },
    { id: 'm-m-2', skill: 'mass to mass', generate: massToMass },
    { id: 'sol-v', skill: 'solution to solution volume', generate: solutionToVolume },
    { id: 'm-v-2', skill: 'mass to gas volume', generate: massToVolume },
    { id: 'm-m-3', skill: 'mass to mass', generate: massToMass },
    { id: 'sol-m-2', skill: 'solution to mass', generate: solutionToMass },
    { id: 'v-m-2', skill: 'gas volume to mass', generate: volumeToMass },
  ],
  videos: [
    {
      youtubeId: "guuo5P9p-XU",
      title: "Stoichiometry: Mole to mole, Grams to grams",
      channel: "Najam Academy",
      note: "The full stoichiometry path. (Use 22.7 L/mol at STP, as on your data table.)",
    },
  ],
};
