// discard prize combinations with immaterial probabilities
const materialityThreshold = 1e-15;

// options to increase calculation speed vs very small impact on big win probabilities
// 0 - no cap, use full distribution (subject to materialityThreshold)
// 1 - as 0 but lump any winnings over £1m together (safe if ">£1m" is top bracket)
// 2 - as 1 but also lump £100k to £1m together (assumes cannot enter £1m bracket without £1m prize!)
const bracketCapType = 2;

const bracketCap = (function () {
  const cap1 = user.brackets.at(-1);
  const cap2 = user.brackets.at(-2);
  switch (bracketCapType) {
    case 0:
      return (a) => a;
    case 1:
      return (a) => (a <= cap1 ? a : cap1);
    case 2:
      return (a) => (a < cap2 ? a : a < cap1 ? cap2 : cap1);
  }
})();

function summaryStats() {
  const expMonthlyInt = expMonthlyInterest();
  const expAnnualInt = (1 + expMonthlyInt) ** 12 - 1;
  const expPeriodInt = (1 + expMonthlyInt) ** user.period - 1;
  const expPeriodReturn = expPeriodInt * user.bonds;

  console.log(
    `Expected reinvested winnings of £${Math.floor(expPeriodReturn)}`
  );
  console.log(`with annual interest of ${percent(expAnnualInt, 2)}`);
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
  const median = Math.abs(p - 0.5) < Math.abs(pLast - 0.5) ? value : value - 25;
  console.log(`Median winnings over period is £${median}`);
}

function* makePDs(pds) {
  pds[0] = makePDMonth();
  yield 0;

  const t = [0, ...user.periods];
  for (let i = 1; i < t.length; i++) {
    pds[i] = new Map([[0, 1]]);
  }
  let pdExp = pds[0];

  while (t.some((e) => e !== 0)) {
    for (let i = 1; i < t.length; i++) {
      if (t[i] === 0) continue;
      if ((t[i] & 1) !== 0) pds[i] = combine(pds[i], pdExp);
      t[i] >>= 1;
      if (t[i] === 0) yield i;
    }
    pdExp = combineSelf(pdExp);
  }
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
}

function calculateTailP(prizesWon) {
  const userRemBonds = user.bonds - prizesWon;
  const nsiRemBonds = nsi.bonds - prizesWon;
  let p = 1;
  for (let i = 0; i < userRemBonds; i++) {
    p *= (nsi.noWinBonds - i) / (nsiRemBonds - i);
  }
  return p;
}


