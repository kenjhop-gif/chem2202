# Chemistry 2202 Study Companion — Project Plan (v2)

Updated 2026-09-24 after the planning discussion. Supersedes `chem2202-app-plan.md` (the original on the Desktop).

---

## 1. Overview

A start-to-finish study/practice companion for **Chemistry 2202** (Newfoundland & Labrador). The student is in Grade 10 and taking **Science 1206 at the same time**. Modeled on the Math 1201 "Step Coach" site (https://math-1201-step-coach.khop123.chatgpt.site/): topic library, guided step-by-step practice with hints and retries, saved progress (not grades), a "take a break" screen, printable step guides, calm tone.

Each topic follows **learn it → see it → try it**: explanation, worked examples, guided practice, and verified videos.

### Sources
- **Primary:** Official NL curriculum outcomes. Chemistry 2202: https://enlightened.gov.nl.ca/ords/r/curr_external/public/curriculum-view?p50_id=762&p50_doc_section=HOME and Science 1206: `p50_id=749`
- **Secondary (how it's taught and tested in NL):** Ms. Kavanagh's class site: https://sites.google.com/a/nlesd.ca/ms-kavanagh-s-classes/chemistry-2202 (not the student's teacher)
- **Data values:** the NL "Periodic Chart of the Elements (2019‑20 Revision)" used in NL classrooms. Molar masses to 2 decimals (H 1.01, C 12.01, O 16.00, Na 22.99…).
- If the student's own teacher provides a course outline, adjust the topic map to match.

Unit weights (from the class site): Unit 1: 47%, Unit 2: 30%, Unit 3: 24.5%.

---

## 2. Topic Map (60 topics)

Tags: **[O]** official outcome · **[K]** from Kavanagh's materials · **[needed]** prerequisite for an outcome · **[likely]** standard in Canadian Gr 11, not confirmed for this teacher

### Chemistry Basics (optional review; open anytime)
Covers background from earlier grades and the chemistry in Science 1206. Unit topics link here ("Need a refresher? See B4").
- B1. Matter: elements, compounds, mixtures; physical vs. chemical changes
- B2. Atomic structure: protons, neutrons, electrons, isotopes
- B3. The periodic table: groups, periods, families, metals/non-metals
- B4. Bohr diagrams, valence electrons, how ions form
- B5. Measurement skills: sig figs, scientific notation, metric conversions
- B6. Acids, bases and salts; neutralization *(Sci 1206)*
- B7. What affects reaction rate *(Sci 1206)*
- B8. Lab safety and WHMIS

### Unit 1: Stoichiometry (18)
**Naming**
1. Ionic compounds: polyatomic ions, multivalent metals, hydrates [O]
2. Molecular compounds and acids [O]

**The mole**
3. The mole and Avogadro's number [O]
4. Molar mass [O]
5. Mole conversions: mass, particles, gas volume at STP (22.4 L/mol) [O+K]
6. Percent composition
7. Empirical and molecular formulas

**Reactions**
8. Reaction types, predicting products, balancing (formation, decomposition, single/double displacement, combustion) [O]

**Solutions**
9. Concentration and dilution (C₁V₁ = C₂V₂) [K]
10. Dissociation equations and ion concentrations [K]
11. Solubility and equilibrium: *how much* dissolves and why it varies [O]
12. Using the solubility table to predict precipitates [O]
13. Non-ionic, total ionic, and net ionic equations [O+K]

**Stoichiometry**
14. Mole ratios and mole-to-mole [O]
15. Mass, solution, and gas stoichiometry [O+K]
16. Limiting and excess reagents [O]
17. Percent yield and maximizing yield [O]
18. Stoichiometry in the real world (STSE) [O]

### Unit 2: From Structures to Properties (15)
**Covalent and molecular substances**
1. Covalent bonding: shared pairs; single, double, triple bonds [O]
2. Lewis structures for molecules and polyatomic ions [O]
3. Molecular shapes (VSEPR) [O+K]
4. Electronegativity and bond polarity [needed]
5. Molecular polarity [needed]
6. Intermolecular forces: London dispersion, dipole-dipole, hydrogen bonding [O+K]
7. Properties of molecular substances explained by IMFs [O]

**Ionic substances**
8. Ionic bonding: electron transfer, Lewis symbols [O]
9. Ionic crystal lattices and properties of ionic compounds [O]

**Metallic substances**
10. Metallic bonding and properties of metals [O]

**Putting it together**
11. Classifying ionic, molecular, and metallic substances by properties [O]
12. Dissolving explained with intra- and intermolecular forces: *why*, at the particle level [O]
13. Molar solubility [O]
14. How solutes lower the melting point of ice [O]
15. Bonding in the real world (STSE, Canadian contributions) [O]

### Unit 3: Organic Chemistry (19)
**Hydrocarbons**
1. What makes carbon special [O]
2. Drawing organic molecules: structural, condensed, line formulas [needed]
3. Alkanes: naming and formulas [O]
4. Branched alkanes: naming with substituents [O]
5. Alkenes and alkynes [O]
6. Cyclic hydrocarbons [O]
7. Aromatic hydrocarbons [O]
8. Structural isomers [O]

**Hydrocarbon derivatives**
9. Functional groups: identifying the family from a name or structure [O]
10. Haloalkanes [likely]
11. Alcohols [O]
12. Ethers [O]
13. Aldehydes and ketones [O]
14. Carboxylic acids [O]
15. Esters [O]
16. Amines and amides [O / likely]

**Reactions and applications**
17. Organic reactions: combustion, addition, substitution, elimination, esterification [O]
18. Polymers: addition and condensation; natural and synthetic [O]
19. Organic chemistry in everyday life (STSE) [O]

**Removed from the original plan:** electron configuration, orbital diagrams, periodic trends (Chemistry 3202 material, not 2202 outcomes).

---

## 3. Content Format (per topic)
1. Plain-language explanation, with collapsible "Quick background" boxes linking to Basics
2. 1–2 worked examples showing full steps, with units at every step
3. **8–15 guided practice questions.** Calculation topics use generators that produce fresh numbers; conceptual and naming topics use hand-written banks.
4. 1–2 verified YouTube videos (link works, embedding allowed, content checked via title, description or transcript; a human spot-checks them)
5. Terminology matches NL usage: "formation / decomposition / single and double displacement", "non-ionic / total ionic / net ionic"

---

## 4. Practice Engine Decisions

| Area | Decision |
|---|---|
| **Sig figs** | Correct value plus wrong sig figs: accepted with a gentle note. **Strict** inside B5 (sig figs topic). |
| **Units** | Shown next to the box by default; a unit dropdown on some questions per topic. |
| **Scientific notation** | One box accepts `3.01e23`, `3.01x10^23`, `3.01*10^23`, etc. Live preview (3.01 × 10²³) and a **×10ⁿ** button. A full-digit answer is accepted with a nudge. |
| **Numeric tolerance** | About 1% relative (tunable per question). |
| **Modes** | "Walk me through it" (steps) or "Let me try it first" (final answer, falling back to steps when wrong). The student picks; new topics default to steps. |
| **Hints** | Ladder: nudge → specific → setup → "Show me" (reveals the answer with an explanation). |
| **Retries** | Unlimited. Specific feedback for common mistakes. The Hint button pulses after 2 wrong tries. |
| **Formulas** | Typed (`Ca(NO3)2`), with live subscript preview and a helper button row `( ) · + −`. Capitals strict, with a specific hint if capitals are the only error. Positive ion first. States required only in equation and net ionic questions. |
| **Balancing** | A coefficient box in front of each formula, blank = 1, live atom counter (the student can hide it; tracked). Non-lowest multiples get a nudge. Predicting products comes before balancing. |
| **Names** | Case, spacing, and a space before the Roman numeral are forgiven. IUPAC only; older names get a gentle redirect (not counted as a wrong try). Standard common names are accepted (water, ammonia, methane, hydrogen peroxide, glucose…). |
| **Structures** | Launch: guided counting steps plus multiple choice between rendered structures (SmilesDrawer); name ↔ structure both ways; condensed formulas typed. **Later:** a tap-to-build Lewis builder. |
| **Concept/STSE** | Multiple choice, sorting (drag into categories), and short written answers the student self-checks against a model answer. |
| **Reference tools** | On-screen NL periodic chart. No molar-mass calculator (that's the skill being practised). |

**Progress logged per attempt:** topic, question, date, mode, hints used, retries, "Show me" used, atom counter on/off. Never shown as a grade.

---

## 5. Accounts and Roles

| Role | Can do |
|---|---|
| **Student** | Open sign-up via the link. Sees own progress. Generates a link code for parents; sees which parents are linked. |
| **Parent** | Signs up, enters a student's link code (no approval needed). Read-only view of linked students' progress; can link several students. |
| **Admin** | User list: change roles, disable or re-enable accounts, set `hasAccess`, unlink parents, view any progress. |

- Firebase **Spark (free) plan.** "Disabled" is a Firestore flag enforced by security rules and the UI (the user can still log in but sees "account disabled"). Full deletion is done in the Firebase console.
- `hasAccess` field on every user, default `true` (future Stripe subscription hook).
- The first admin is set once by hand in the Firebase console.
- Minimal personal data: email and display name only.

---

## 6. Tech Stack
- **Vite + React + TypeScript**, with content stored as typed data files separate from engine code
- **Firebase** Authentication (email/password) + Firestore
- **GitHub** repo, hosted on **GitHub Pages** with GitHub Actions auto-deploy (add the Pages domain to Firebase authorized domains)
- Mobile-first layout; printable step-guide view per topic

---

## 6a. Visual Design
Goal: **very modern, clean, and visually appealing**, on par with a polished consumer app.
- Clean, airy layouts with lots of white space; soft rounded cards; semantic green, amber, and red reserved for feedback
- **Each main section has its own color** (Basics, Unit 1, Unit 2, Unit 3): used on topic cards, headers, progress bars, and buttons inside that section
- **Selectable color themes** in settings (saved per user): Periodic (default: slate / violet / teal / coral), Ocean, Sunset, Forest. Each theme is a harmonized set of 4 section colors that works in light and dark mode. More themes can be added later as data.
- Feedback colors stay the same in every theme, so "correct" always looks like correct
- Modern type (Inter), clear hierarchy, comfortable reading size for explanations
- Light and dark mode (follows the device, with a toggle)
- Subtle, purposeful motion: step transitions, answer feedback, progress fills; respects reduced-motion settings
- Mobile-first, thumb-friendly controls; same polish on desktop
- Icon set: Lucide (clean outline icons)
- Calm, encouraging microcopy (no "Wrong!"; say "Not quite" or "Almost")

---

## 7. Build Order
1. **Milestone 1:** app shell, topic library, practice engine, and 2–3 Unit 1 topics (mole, molar mass, mole conversions). Runs locally with no login yet.
2. Connect Firebase auth and progress storage (needs the config snippet); roles and admin page.
3. The user tests Milestone 1 as a student; adjust the content format.
4. Remaining Unit 1 content, then Basics, Unit 2, Unit 3.
5. Video curation per topic as each topic's text is settled.
6. Publish to GitHub Pages, share the link, iterate.
7. Later: the Lewis builder.

## 8. Open Items
- Firebase config snippet (user)
- GitHub repo creation and Pages setup (at publish time)
- Student's own teacher's course outline, if obtainable, to fine-tune the topic map
