// discard prize combinations with immaterial probabilities
const materialityThreshold = 1e-15;

// options to increase calculation speed vs very small impact on big win probabilities
// 0 - no cap, use full distribution (subject to materialityThreshold)
// 1 - as 0 but lump any winnings over £1m together (safe if ">£1m" is top bracket)
// 2 - as 1 but also lump £100k to £1m together (assumes cannot enter £1m bracket without £1m prize!)
const bracketCapType = 1;

class Prize {
  constructor(value, number) {
    this.value = value;
    this.number = number;
  }
}

// DATA
const brackets = [
  25, 50, 75, 100, 150, 200, 250, 300, 350, 400, 450, 500, 750, 1000, 1500,
  2500, 5000, 10_000, 25_000, 50_000, 100_000, 1_000_000,
];

let prizeDate = "February 2025";
const prizes = [
  new Prize(25, 1_807_915),
  new Prize(50, 1_992_297),
  new Prize(100, 1_992_297),
  new Prize(500, 51_606),
  new Prize(1000, 17_202),
  new Prize(5000, 1641),
  new Prize(10_000, 820),
  new Prize(25_000, 328),
  new Prize(50_000, 164),
  new Prize(100_000, 82),
  new Prize(1_000_000, 2),
];

let totalNoWinBonds = 129_009_849_598;
let totalBonds = totalNoWinBonds + prizes.reduce((acc, i) => acc + i.number, 0);
let applyBracketCap = makeApplyBracketCap(bracketCapType, brackets);

let n = 25;
let v = 1;
monthOutput(buildMonthlyDist(50000));

function monthOutput(probDist) {
  for (let i = 0; i <= 1000; i += 25) {
    x = probDist.get(i);
    if (x) {
      console.log(`${i} => ${x}`);
    }
  }
}
// returns full probability distribution for a holding of n over one month
function buildMonthlyDist(bondsHeld) {
  console.time("analyseMonth");
  const probDist = new Map();
  const tailProbabilities = makeTailProbabilities(
    totalBonds,
    totalNoWinBonds,
    bondsHeld
  );
  buildMonthlyDistRecur(0, 0, 0, 1);
  console.timeEnd("analyseMonth");
  return probDist;

  // cumulatively build up distribution considering each prize category in turn
  function buildMonthlyDistRecur(
    prizeTypeIndex,
    prizeTotalWonSoFar,
    numPrizesWonSoFar,
    cumulProb
  ) {
    // terminating condition - no more prizes to win so add tail probability
    if (prizeTypeIndex === prizes.length) {
      const tailProb = tailProbabilities(numPrizesWonSoFar);
      const newCumulProb = cumulProb * tailProb;
      if (newCumulProb > materialityThreshold) {
        const bracket = applyBracketCap(prizeTotalWonSoFar);
        probDist.set(bracket, (probDist.get(bracket) || 0) + newCumulProb);
      }
      return;
    }

    // iterating condition - consider next prize type
    const totalBondsRemaining = totalBonds - numPrizesWonSoFar;
    const remainingBondsHeld = bondsHeld - numPrizesWonSoFar;
    const numPrizesOfType = prizes[prizeTypeIndex].number;
    const maxWinnable = Math.floor(remainingBondsHeld, numPrizesOfType);

    let newCumulProb = cumulProb;
    for (let k = 0; k <= maxWinnable; k++) {
      buildMonthlyDistRecur(
        prizeTypeIndex + 1,
        prizeTotalWonSoFar + k * prizes[prizeTypeIndex].value,
        numPrizesWonSoFar + k,
        newCumulProb
      );
      const probabilityFactor = (numPrizesOfType - k) / (totalBondsRemaining - k);
      const combinatoricFactor = (remainingBondsHeld - k) / (k + 1);
      newCumulProb *= probabilityFactor * combinatoricFactor;
      if (newCumulProb < materialityThreshold) break;
    }
  }
}

function makeTailProbabilities(totalBonds, totalNoWinBonds, bondsHeld) {
  const cache = new Map();

  return function (numPrizesWon) {
    let tailProbability = cache.get(numPrizesWon);

    if (!tailProbability) {
      tailProbability = 1;
      const remainingBondsHeld = bondsHeld - numPrizesWon;
      const totalBondsRemaining = totalBonds - numPrizesWon;
      for (let i = 0; i < remainingBondsHeld; i++) {
        tailProbability *= (totalNoWinBonds - i) / (totalBondsRemaining - i);
      }
      cache.set(numPrizesWon, tailProbability);
    }

    return tailProbability;
  };
}

function makeApplyBracketCap(type, brackets) {
  switch (type) {
    case 0:
      return (a) => a;
    case 1:
      return (a) => Math.min(a, brackets.at(-1));
    case 2: // try rearranging bottom test first?
      return (a) =>
        a >= brackets.at(-1) ? brackets.at(-1) : Math.min(a, brackets.at(-2));
  }
}

function totalProbability(m) {
  return m.values().reduce((acc, p) => acc + p, 0);
}
