// probability mass function for winnings based on holding

// technical parameters:

// need to discard prize combinations with immaterial probabilities
// 1e-15 appears to be past the level where no further impact is observed
const materialityThreshold = 1e-15;

// options to increase calculation speed by restricting big win bands
// 0 - no cap, use full distribution (subject to materialityThreshold)
//     DO NOT USE EXCEPT IN TESTING
// 1 - as 0 but lump any winnings over £1m together (safe if "at least £1m" is top bracket)
// 2 - as 1 but also lump any £100k <= x < £1m together at £100k. Use this if:
//     a) we have no use for any intermediate bands between £100k and £1m AND
//     b) probability of reaching £1m bracket without winning £1m prize is immaterial
//        (appears to be <0.1% impact so probably worth the trade off for speed
//         justifies rounding to 3.s.f.)
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

// create Probability Mass Function for prizes in monthly draw
// using fast implementation of multinomial distribution
function makeMonthPMF() {
  const pmf = new Map();
  const tailCache = new Map();
  buildPDRecur(0, 0, 0, 1);
  return pmf;

  // build up distribution by recursively considering each prize category in turn
  function buildPDRecur(
    prizeTypeIndex,
    prizesWonSoFar,
    prizeTotalWonSoFar,
    cumulP
  ) {
    // terminating condition - no more prizes to win so add tail probability
    if (prizeTypeIndex === nsi.prizes.length) {
      const tailP = lookupTailP(prizesWonSoFar);
      const newCumulP = cumulP * tailP;
      if (newCumulP > materialityThreshold) {
        const bracket = bracketCap(prizeTotalWonSoFar);
        pmf.set(bracket, (pmf.get(bracket) ?? 0) + newCumulP);
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

  // tailP returns probability of all remaining user bonds not winning
  function lookupTailP(prizesWon) {
    let tailP = tailCache.get(prizesWon);
    if (!tailP) {
      tailP = calculateTailP(prizesWon);
      tailCache.set(prizesWon, tailP);
    }
    return tailP;
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
}

// generator of PMFs over all required time periods using binary exponentiation
// yields the array index of the next completed PMF
function* generatePeriodPMFs(arrayPMFs) {
  arrayPMFs[0] = makeMonthPMF();
  yield 0;

  const t = [0, ...user.periods];
  for (let i = 1; i < t.length; i++) {
    arrayPMFs[i] = new Map([[0, 1]]);
  }
  let pdExp = arrayPMFs[0];

  while (t.some((e) => e !== 0)) {
    for (let i = 1; i < t.length; i++) {
      if (t[i] === 0) continue;
      if ((t[i] & 1) !== 0) arrayPMFs[i] = combine(arrayPMFs[i], pdExp);
      t[i] >>= 1;
      if (t[i] === 0) yield i;
    }
    pdExp = combineSelf(pdExp);
  }

  function combine(pdA, pdB) {
    const pdC = new Map();
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
