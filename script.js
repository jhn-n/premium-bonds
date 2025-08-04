generateTable();

function generateTable() {
  generateTableTemplate();
  const numPDs = 1 + user.periods.length;
  const pds = [...Array(numPDs)];
  const nextPD = makePDs(pds);

  console.time("pds");
  liveDistUpdates(numPDs);

  function liveDistUpdates(n) {
    if (n > 0) {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          const j = nextPD.next().value;
          addDistColumn(j + 1, pds[j]);
          liveDistUpdates(n - 1);
        });
      });
    } else {
      console.timeEnd("pds");
      statementText.innerText = `Chance of winning with premium bonds of £${numberWithCommas(
        user.bonds
      )}`;
    }
  }
}
