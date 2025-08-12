// initial user data and nsi data processing
// note any change in nsi methodology will require updates here

class Prize {
  constructor(value, number) {
    this.value = value;
    this.number = number;
  }
}

// premium bond data (from NSI)
let nsi = setupNSIdata(6_005_404, 396_356_500, 22_000);
document.querySelector("#update-text").innerText =
  "Based on August 2025 prize draw";

// user data
const user = {
  bonds: 25,
  periods: [3, 6, 12, 24, 60],
  brackets: [
    25, 50, 75, 100, 200, 500, 1_000, 2_000, 5_000, 10_000, 25_000, 50_000,
    100_000, 1_000_000,
  ],
  percentiles: [99, 95, 75, 50, 25, 5, 1],
  percentileDescriptions: [
    "- very lucky",
    "",
    "",
    "- average luck",
    "",
    "",
    "- very unlucky",
  ],
};

// to calculated prize numbers for each band (nsi methodology)
// as well as some other stats
function setupNSIdata(totalPrizes, totalPrizeValue, odds) {
  const prizes = [];

  // set higher value prizes
  const higherFund = 0.1 * totalPrizeValue;
  prizes.push(new Prize(1_000_000, 2));
  const higherBandFund = (higherFund - 1_000_000 * 2) / 5;
  let remainder = 0;
  [100_000, 50_000, 25_000, 10_000, 5_000].forEach((value) => {
    const availableFund = higherBandFund + remainder;
    const numPrizes = Math.round(availableFund / value);
    prizes.push(new Prize(value, numPrizes));
    remainder = availableFund - numPrizes * value;
  });
  console.assert(
    Math.abs(remainingPrizeFund() - 0.9 * totalPrizeValue) < 2500,
    "Invalid remainder after higher values prizes set"
  );

  // set medium value prizes
  const mediumFund = 0.1 * totalPrizeValue + remainder;
  const grouping = 1000 + 3 * 500;
  const divisor = Math.floor(mediumFund / grouping);
  prizes.push(new Prize(1_000, divisor));
  prizes.push(new Prize(500, 3 * divisor));
  remainder = mediumFund - grouping * divisor;
  console.assert(
    remainingPrizeFund() - 0.8 * totalPrizeValue === remainder &&
      remainder >= 0 &&
      remainder < 2500,
    "Invalid remainder after medium value prizes set"
  );

  // set lower value prizes
  const lowerFund = Math.floor(remainingPrizeFund() / 25) * 25;
  const lowerPrizes = remainingNumPrizes();

  // solve pair of simultaneous equations
  const num150s = Math.round((lowerFund - 25 * lowerPrizes) / 100);
  const num25s = lowerPrizes - 2 * num150s;
  prizes.push(new Prize(100, num150s));
  prizes.push(new Prize(50, num150s));
  prizes.push(new Prize(25, num25s));

  function remainingPrizeFund() {
    return (
      totalPrizeValue - prizes.reduce((acc, c) => acc + c.value * c.number, 0)
    );
  }

  function remainingNumPrizes() {
    return totalPrizes - prizes.reduce((a, c) => a + c.number, 0);
  }

  return {
    prizes,
    totalPrizes,
    totalPrizeValue,
    odds,
    bonds: totalPrizes * odds,
    noWinBonds: totalPrizes * (odds - 1),
    monthlyReturn: totalPrizeValue / (totalPrizes * odds),
  };
}
