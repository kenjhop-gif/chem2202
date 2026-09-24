// Values transcribed from the NL "Periodic Chart of the Elements (2019-20 Revision)"
// used in NL Chemistry 2202 classrooms. Some molar masses intentionally differ from
// current IUPAC values (e.g. S 32.07, Ni 58.71, Pb 207.19) so answers match class.

export type ElementState = 'solid' | 'liquid' | 'gas';

export interface Element {
  z: number;
  symbol: string;
  name: string;
  /** Molar mass in g/mol, exactly as printed on the chart. */
  mass: number;
  /** True when the chart prints the mass in brackets (most stable isotope). */
  massEstimated: boolean;
  electronegativity: number | null;
  /** Ion charges as printed, most common first, e.g. ['3+', '2+']. */
  charges: string[];
  state: ElementState;
}

// z|symbol|name|mass|electronegativity|charges (comma separated)
// A mass in brackets means estimated.
const RAW = `
1|H|hydrogen|1.01|2.1|1+,1-
2|He|helium|4.00||
3|Li|lithium|6.94|1.0|1+
4|Be|beryllium|9.01|1.5|2+
5|B|boron|10.81|2.0|
6|C|carbon|12.01|2.5|
7|N|nitrogen|14.01|3.0|3-
8|O|oxygen|16.00|3.5|2-
9|F|fluorine|19.00|4.0|1-
10|Ne|neon|20.18||
11|Na|sodium|22.99|0.9|1+
12|Mg|magnesium|24.31|1.2|2+
13|Al|aluminum|26.98|1.5|3+
14|Si|silicon|28.09|1.8|
15|P|phosphorus|30.97|2.1|3-
16|S|sulfur|32.07|2.5|2-
17|Cl|chlorine|35.45|3.0|1-
18|Ar|argon|39.95||
19|K|potassium|39.10|0.8|1+
20|Ca|calcium|40.08|1.0|2+
21|Sc|scandium|44.96|1.3|3+
22|Ti|titanium|47.90|1.5|4+,3+
23|V|vanadium|50.94|1.6|5+,4+
24|Cr|chromium|52.00|1.6|3+,2+
25|Mn|manganese|54.94|1.5|2+,4+
26|Fe|iron|55.85|1.8|3+,2+
27|Co|cobalt|58.93|1.8|2+,3+
28|Ni|nickel|58.71|1.8|2+,3+
29|Cu|copper|63.55|1.9|2+,1+
30|Zn|zinc|65.38|1.6|2+
31|Ga|gallium|69.74|1.6|3+
32|Ge|germanium|72.59|1.8|4+
33|As|arsenic|74.92|2.0|3-
34|Se|selenium|78.96|2.4|2-
35|Br|bromine|79.90|2.8|1-
36|Kr|krypton|83.80||
37|Rb|rubidium|85.47|0.8|1+
38|Sr|strontium|87.62|1.0|2+
39|Y|yttrium|88.91|1.3|3+
40|Zr|zirconium|91.22|1.4|4+
41|Nb|niobium|92.91|1.6|5+,3+
42|Mo|molybdenum|95.94|1.8|6+
43|Tc|technetium|98.91|1.9|7+
44|Ru|ruthenium|101.07|2.2|3+,4+
45|Rh|rhodium|102.91|2.2|3+
46|Pd|palladium|106.40|2.2|2+,4+
47|Ag|silver|107.87|1.9|1+
48|Cd|cadmium|112.41|1.7|2+
49|In|indium|114.82|1.7|3+
50|Sn|tin|118.69|1.8|4+,2+
51|Sb|antimony|121.75|1.9|3+,5+
52|Te|tellurium|127.60|2.1|2-
53|I|iodine|126.90|2.5|1-
54|Xe|xenon|131.30||
55|Cs|cesium|132.91|0.7|1+
56|Ba|barium|137.33|0.9|2+
57|La|lanthanum|138.91|1.1|3+
58|Ce|cerium|140.12|1.1|3+
59|Pr|praseodymium|140.91|1.1|3+
60|Nd|neodymium|144.24|1.2|3+
61|Pm|promethium|(145)||3+
62|Sm|samarium|150.35|1.2|3+,2+
63|Eu|europium|151.96||3+,2+
64|Gd|gadolinium|157.25|1.1|3+
65|Tb|terbium|158.93|1.2|3+
66|Dy|dysprosium|162.50||3+
67|Ho|holmium|164.93|1.2|3+
68|Er|erbium|167.26|1.2|3+
69|Tm|thulium|168.93|1.2|3+
70|Yb|ytterbium|173.04|1.1|3+,2+
71|Lu|lutetium|174.97|1.2|3+
72|Hf|hafnium|178.49|1.3|4+
73|Ta|tantalum|180.95|1.5|5+
74|W|tungsten|183.85|1.7|6+
75|Re|rhenium|186.21|1.9|7+
76|Os|osmium|190.20|2.2|4+
77|Ir|iridium|192.22|2.2|4+
78|Pt|platinum|195.09|2.2|4+,2+
79|Au|gold|196.97|2.4|3+,1+
80|Hg|mercury|200.59|1.9|2+,1+
81|Tl|thallium|204.37|1.8|1+,3+
82|Pb|lead|207.19|1.8|2+,4+
83|Bi|bismuth|208.98|1.9|3+,5+
84|Po|polonium|(209)|2.0|2+,4+
85|At|astatine|(210)|2.2|1-
86|Rn|radon|(222)||
87|Fr|francium|(223)|0.7|1+
88|Ra|radium|(226)|0.9|2+
89|Ac|actinium|(227)|1.1|3+
90|Th|thorium|232.04|1.3|4+
91|Pa|protactinium|231.04|1.5|5+,4+
92|U|uranium|238.03|1.7|6+,4+
93|Np|neptunium|(237)|1.3|5+
94|Pu|plutonium|(244)|1.3|4+,6+
95|Am|americium|(243)|1.3|3+,4+
96|Cm|curium|(247)||3+
97|Bk|berkelium|(247)||3+,4+
98|Cf|californium|(251)||3+
99|Es|einsteinium|(252)||3+
100|Fm|fermium|(257)||3+
101|Md|mendelevium|(258)||2+,3+
102|No|nobelium|(259)||2+,3+
103|Lr|lawrencium|(262)||3+
104|Rf|rutherfordium|(267)||
105|Db|dubnium|(270)||
106|Sg|seaborgium|(269)||
107|Bh|bohrium|(270)||
108|Hs|hassium|(270)||
109|Mt|meitnerium|(278)||
110|Ds|darmstadtium|(281)||
111|Rg|roentgenium|(281)||
112|Cn|copernicium|(285)||
113|Nh|nihonium|(286)||
114|Fl|flerovium|(289)||
115|Mc|moscovium|(289)||
116|Lv|livermorium|(293)||
117|Ts|tennessine|(293)||
118|Og|oganesson|(294)||
`;

const GASES = new Set(['H', 'He', 'N', 'O', 'F', 'Ne', 'Cl', 'Ar', 'Kr', 'Xe', 'Rn']);
const LIQUIDS = new Set(['Br', 'Hg']);

export const ELEMENTS: Element[] = RAW.trim()
  .split('\n')
  .map((line) => {
    const [z, symbol, name, massText, en, charges] = line.split('|');
    const massEstimated = massText.startsWith('(');
    return {
      z: Number(z),
      symbol,
      name,
      mass: Number(massText.replace(/[()]/g, '')),
      massEstimated,
      electronegativity: en ? Number(en) : null,
      charges: charges ? charges.split(',') : [],
      state: GASES.has(symbol) ? 'gas' : LIQUIDS.has(symbol) ? 'liquid' : 'solid',
    };
  });

export const ELEMENT_BY_SYMBOL: Record<string, Element> = Object.fromEntries(
  ELEMENTS.map((e) => [e.symbol, e]),
);

export function massOf(symbol: string): number {
  const el = ELEMENT_BY_SYMBOL[symbol];
  if (!el) throw new Error(`Unknown element symbol: ${symbol}`);
  return el.mass;
}

/** Grid position on the standard 18-column table; f-block rows are 9 and 10. */
export function gridPosition(z: number): { row: number; col: number } {
  if (z === 1) return { row: 1, col: 1 };
  if (z === 2) return { row: 1, col: 18 };
  if (z <= 10) return { row: 2, col: z <= 4 ? z - 2 : z + 8 };
  if (z <= 18) return { row: 3, col: z <= 12 ? z - 10 : z };
  if (z <= 36) return { row: 4, col: z - 18 };
  if (z <= 54) return { row: 5, col: z - 36 };
  if (z >= 57 && z <= 71) return { row: 9, col: z - 54 };
  if (z >= 89 && z <= 103) return { row: 10, col: z - 86 };
  if (z <= 86) return { row: 6, col: z <= 56 ? z - 54 : z - 68 };
  return { row: 7, col: z <= 88 ? z - 86 : z - 100 };
}
