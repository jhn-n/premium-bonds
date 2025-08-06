// need to discard prize combinations with immaterial probabilities
// 1e-15 appears to be past the level where no further impact is observed
const materialityThreshold = 1e-15;

// options to increase calculation speed by restricting big win bands
// 0 - no cap, use full distribution (subject to materialityThreshold)
//     DO NOT USE EXCEPT IN TESTING
// 1 - as 0 but lump any winnings over £1m together (safe if "at least £1m" is top bracket)
// 2 - as 1 but also lump any £100k <= x < £1m together at £100k. Use this if:
//     a) we have no use for any intermediate bands between £100k and £1m AND
//     b) probability of reaching £1m bracket without £1m prize is immaterial
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

class CDF {
  constructor(pmf) {
    this.cdf = new Map();
    this.cdf.set(0, pmf.get(0) ?? 0);
    const topPrize = user.brackets.at(-1);
    const secPrize = user.brackets.at(-2);

    switch (bracketCapType) {
      case 0:
        const highestKey = Math.max(...pmf.keys());
        for (let v = 25; v <= highestKey; v += 25) {
          this.cdf.set(v, this.F(v - 25) + (pmf.get(v) ?? 0));
        }
        break;
      case 1:
        for (let v = 25; v <= topPrize; v += 25) {
          this.cdf.set(v, this.F(v - 25) + (pmf.get(v) ?? 0));
        }
        break;
      case 2:
        for (let v = 25; v <= secPrize; v += 25) {
          this.cdf.set(v, this.F(v - 25) + (pmf.get(v) ?? 0));
        }
        this.cdf.set(topPrize, this.F(secPrize) + (pmf.get(topPrize) ?? 0));
        break;
    }
  }

  F(x) {
    return this.cdf.get(x) ?? NaN;
  }

  probAtLeast(x) {
    if (x === 0) return 1;
    if (bracketCapType === 2 && x === user.brackets.at(-1)) {
      return 1 - (this.F(user.brackets.at(-2)) ?? 0);
    }
    return 1 - (this.F(x - 25) ?? 0);
  }

  getPercentile(percentile) {
    const percentage = percentile / 100;
    if (this.cdf.get(0) >= percentage) return 0;

    const bracketCap = user.brackets.at(-2);
    if (this.cdf.get(bracketCap) < percentage) {
      console.error("Using too high percentiles for banding type 2");
    }

    // binary search for lowest x with F(x) >= target
    // this is where the percentile lies (represented by high)
    let low = 0;
    let high = bracketCap;
    while (high - low > 25) {
      const mid = 25 * Math.round((high + low) / 50);
      if (this.cdf.get(mid) >= percentage) {
        high = mid;
      } else {
        low = mid;
      }
    }
    return high;
  }
}

// returns full probability distribution for a holding of n over one month
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
