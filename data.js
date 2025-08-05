// USER DATA
const user = {};
user.bonds = 1000;
user.periods = [3, 6, 12, 24, 60];
user.brackets = [
  25, 50, 75, 100, 200, 500, 1_000, 
  2_000, 5_000, 10_000, 25_000, 50_000, 100_000, 1_000_000,
];
// user.brackets = [
//   25, 50, 75, 100, 150, 200, 250, 300, 350, 400, 450, 500, 750, 1000, 1500,
//   2500, 5000, 10_000, 25_000, 50_000, 100_000, 1_000_000,
// ];

// PREMIUM BOND DATA
class Prize {
  constructor(value, number) {
    this.value = value;
    this.number = number;
  }
}

let nsi = setupNSIdata(6_009_717, 396_641_075, 22000);
console.log(nsi);

function setupNSIdata(totalPrizes, totalPrizeValue, odds) {
  const bonds = totalPrizes * odds;
  const noWinBonds = bonds - totalPrizes;
  const monthlyReturn = totalPrizeValue / bonds;

  const prizes = [];
  const higherFund = 0.1 * totalPrizeValue;
  const mediumFund = 0.1 * totalPrizeValue;

  // set higher value prizes
  prizes.push(new Prize(1_000_000, 2));
  const eachHigherFund = (higherFund - 1_000_000 * 2) / 5;
  let remainder = 0;
  [100_000, 50_000, 25_000, 10_000, 5_000].forEach((value) => {
    const availableFund = eachHigherFund + remainder;
    const numPrizes = Math.round(availableFund / value);
    prizes.push(new Prize(value, numPrizes));
    remainder = availableFund - numPrizes * value;
  });
  console.log(remainingPrizeFund() - 0.9 * totalPrizeValue, "|r| < 2500");

  // set medium value prizes
  const newMediumFund = mediumFund + remainder;
  const grouping = 1000 + 3 * 500;
  const divisor = Math.floor(newMediumFund / grouping);
  prizes.push(new Prize(1_000, divisor));
  prizes.push(new Prize(500, 3 * divisor));
  console.log(remainingPrizeFund() - 0.8 * totalPrizeValue, "0 < r < 2500");

  // set lower value prizes
  const lowerFund = Math.floor(remainingPrizeFund() / 25) * 25;
  const lowerPrizes = remainingNumPrizes();
  // solve pair of simultaneous equations
  const num150s = Math.round((lowerFund - 25 * lowerPrizes) / 100);
  const num25s = lowerPrizes - 2 * num150s;
  prizes.push(new Prize(100, num150s));
  prizes.push(new Prize(50, num150s));
  prizes.push(new Prize(25, num25s));

  return {
    prizes,
    bonds,
    noWinBonds,
    totalPrizes,
    totalPrizeValue,
    odds,
    monthlyReturn,
  };

  function remainingPrizeFund() {
    return (
      totalPrizeValue - prizes.reduce((acc, c) => acc + c.value * c.number, 0)
    );
  }

  function remainingNumPrizes() {
    return totalPrizes - prizes.reduce((a, c) => a + c.number, 0);
  }
}
