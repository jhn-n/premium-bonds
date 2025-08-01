// PREMIUM BOND DATA
class Prize {
  constructor(value, number) {
    this.value = value;
    this.number = number;
  }
}

const nsi = {};
nsi.month = "July 2025";
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
user.period = 600;
user.periods = [3,6,12,24,60];
user.brackets = [
  25, 50, 75, 100, 150, 200, 250, 300, 350, 400, 450, 500, 750, 1000, 1500,
  2500, 5000, 10_000, 25_000, 50_000, 100_000, 1_000_000,
];