// PREMIUM BOND DATA
class Prize {
  constructor(value, number) {
    this.value = value;
    this.number = number;
  }
}
const nsi = {};
nsi.month = "August 2025";
nsi.prizes = [
  new Prize(25, 2_205_679),
  new Prize(50, 1_860_128),
  new Prize(100, 1_860_128),
  new Prize(500, 50_124),
  new Prize(1000, 16_708),
  new Prize(5000, 1590),
  new Prize(10_000, 797),
  new Prize(25_000, 318),
  new Prize(50_000, 158),
  new Prize(100_000, 80),
  new Prize(1_000_000, 2),
];
nsi.noWinBonds = 131_899_636_194;
// nsi.month = "February 2025";
// nsi.prizes = [
//   new Prize(25, 1_807_915),
//   new Prize(50, 1_992_297),
//   new Prize(100, 1_992_297),
//   new Prize(500, 51_606),
//   new Prize(1000, 17_202),
//   new Prize(5000, 1641),
//   new Prize(10_000, 820),
//   new Prize(25_000, 328),
//   new Prize(50_000, 164),
//   new Prize(100_000, 82),
//   new Prize(1_000_000, 2),
// ];
// nsi.noWinBonds = 129_009_849_598;
nsi.bonds = nsi.noWinBonds + nsi.prizes.reduce((acc, i) => acc + i.number, 0);

// USER DATA
const user = {};
user.bonds = 50000;
user.period = 300;
// user.brackets = [
//   25, 50, 100, 500, 1000, 5000, 10_000, 25_000, 50_000, 100_000, 1_000_000,
// ];
user.brackets = [
  25, 50, 75, 100, 150, 200, 250, 300, 350, 400, 450, 500, 750, 1000, 1500,
  2500, 5000, 10_000, 25_000, 50_000, 100_000, 1_000_000,
];

// discard prize combinations with immaterial probabilities
const materialityThreshold = 1e-15;

// options to increase calculation speed vs very small impact on big win probabilities
// 0 - no cap, use full distribution (subject to materialityThreshold)
// 1 - as 0 but lump any winnings over £1m together (safe if ">£1m" is top bracket)
// 2 - as 1 but also lump £100k to £1m together (assumes cannot enter £1m bracket without £1m prize!)
const bracketCapType = 2;
const bracketCap = makeBracketCap(bracketCapType);

console.time("analyseMonth");
const pdMonth = makePDMonth();
console.timeEnd("analyseMonth");

console.time("analysePeriod");
const pdPeriod = makePDPeriod(pdMonth);
output(pdPeriod);
summaryStats();
medianWinnings(pdPeriod);
console.timeEnd("analysePeriod");

function output(pd) {
  const strings = [
    `\nAnalysis based on prize breakdown for ${nsi.month}`,
    `${pd.size} material prize totals found`,
    `Total probability = ${sumValues(pd)}\n`,
    `£0 exactly => ${percent(pd.get(0))}`,
  ];
  for (const b of user.brackets) {
    const p = pd.entries().reduce((p, e) => (e[0] >= b ? p + e[1] : p), 0);
    strings.push(
      p >= 0.01
        ? `At least £${b} => ${percent(p)}`
        : `At least £${b} => 1 in ${Math.floor(1 / p)}`
    );
  }
  for (const s of strings) {
    console.log(s);
  }
}

function summaryStats() {
  const expMonthlyInt = expMonthlyInterest();
  const expAnnualInt = (1 + expMonthlyInt) ** 12 - 1;
  const expPeriodInt = (1 + expMonthlyInt) ** user.period - 1;
  const expPeriodReturn = expPeriodInt * user.bonds;

  console.log(`Expected reinvested winnings of £${Math.floor(expPeriodReturn)}`);
  console.log(`with annual interest of ${percent(expAnnualInt)}`);
}

function expMonthlyInterest() {
  return nsi.prizes.reduce((a, p) => p.value * p.number + a, 0) / nsi.bonds;
}

function medianWinnings(pd) {
  let value = 0;
  let pLast = 0;
  let p = pd.get(value) ?? 0;
  if (p >= 0.5) return 0;

  while (p < 0.5) {
    pLast = p;
    value += 25;
    p += pd.get(value) ?? 0;
  }
  const median = Math.abs(p - 0.5) < Math.abs(pLast - 0.5)
    ? value
    : value - 25;
  console.log(`Median winnings over period is £${median}`)
}

function makePDPeriod(pdm) {
  let t = user.period;
  let ans = new Map([[0, 1]]);
  let pdExp = pdm;

  while (true) {
    if ((t & 1) !== 0) {
      ans = combine(ans, pdExp);
    }
    t >>= 1;
    if (t === 0) {
      return ans;
    }
    pdExp = combineSelf(pdExp);
  }

  function combine(pdA, pdB) {
    const pdC = new Map([[0, 0]]);
    for (const [prizeA, probA] of pdA.entries()) {
      for (const [prizeB, probB] of pdB.entries()) {
        const probC = probA * probB;
        if (probC > materialityThreshold) {
          const prizeC = bracketCap(prizeA + prizeB);
          pdC.set(prizeC, (pdC.get(prizeC) || 0) + probC);
        }
      }
    }
    return pdC;
  }

  function combineSelf(pdA) {
    const pdC = new Map();
    for (const [prizeA, probA] of pdA.entries()) {
      for (const [prizeB, probB] of pdA.entries()) {
        if (prizeA < prizeB) continue;
        const probC = probA * probB;
        if (probC > materialityThreshold) {
          const prizeC = bracketCap(prizeA + prizeB);
          const factor = prizeA === prizeB ? 1 : 2;
          pdC.set(prizeC, (pdC.get(prizeC) || 0) + factor * probC);
        }
      }
    }
    return pdC;
  }
}

// returns full probability distribution for a holding of n over one month
function makePDMonth() {
  const pdm = new Map();
  const getTailP = tailPCache();
  buildPDRecur(0, 0, 0, 1);
  return pdm;

  // build up distribution by recursively considering each prize category in turn
  function buildPDRecur(
    prizeTypeIndex,
    prizesWonSoFar,
    prizeTotalWonSoFar,
    cumulP
  ) {
    // terminating condition - no more prizes to win so add tail probability
    if (prizeTypeIndex === nsi.prizes.length) {
      const tailP = getTailP(prizesWonSoFar);
      const newCumulP = cumulP * tailP;
      if (newCumulP > materialityThreshold) {
        const bracket = bracketCap(prizeTotalWonSoFar);
        pdm.set(bracket, (pdm.get(bracket) || 0) + newCumulP);
      }
      return;
    }

    // iteration - consider next prize type
    const nsiRemBonds = nsi.bonds - prizesWonSoFar;
    const userRemBonds = user.bonds - prizesWonSoFar;
    const numPrizeType = nsi.prizes[prizeTypeIndex].number;
    const valuePrizeType = nsi.prizes[prizeTypeIndex].value;
    const maxWinnable = Math.floor(userRemBonds, numPrizeType);
    let newCumulP = cumulP;
    for (let k = 0; k <= maxWinnable; k++) {
      buildPDRecur(
        prizeTypeIndex + 1,
        prizesWonSoFar + k,
        prizeTotalWonSoFar + k * valuePrizeType,
        newCumulP
      );
      const probFact = (numPrizeType - k) / (nsiRemBonds - k);
      const combFact = (userRemBonds - k) / (k + 1);
      newCumulP *= probFact * combFact;
      if (newCumulP < materialityThreshold) break;
    }
  }
}

function tailPCache() {
  const cache = new Map();

  return function (prizesWon) {
    let tailP = cache.get(prizesWon);
    if (!tailP) {
      tailP = calculateTailP(prizesWon);
      cache.set(prizesWon, tailP);
    }
    return tailP;
  };

  function calculateTailP(prizesWon) {
    const userRemBonds = user.bonds - prizesWon;
    const nsiRemBonds = nsi.bonds - prizesWon;
    let p = 1;
    for (let i = 0; i < userRemBonds; i++) {
      p *= (nsi.noWinBonds - i) / (nsiRemBonds - i);
    }
    return p;
  }
}

function makeBracketCap(type) {
  switch (type) {
    case 0:
      return (a) => a;
    case 1:
      return (a) => Math.min(a, user.brackets.at(-1));
    case 2: // try rearranging bottom test first?
      return (a) =>
        a >= user.brackets.at(-1)
          ? user.brackets.at(-1)
          : Math.min(a, user.brackets.at(-2));
  }
}

function sumValues(m) {
  return m.values().reduce((acc, p) => acc + p, 0);
}

function round(x, dp) {
  return Number.parseFloat(x).toFixed(dp);
}

function percent(x) {
  return `${round(100 * x, 1)}%`;
}
