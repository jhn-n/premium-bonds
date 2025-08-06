const tableContainer = document.querySelector("#table-container");
const prizesContainer = document.querySelector("#prizes-container");

function generateAnalysisTable() {
  initialiseTable();
  const numPMFs = 1 + user.periods.length;
  const PMFs = [...Array(numPMFs)];
  const nextPMF = generatePeriodPMFs(PMFs);

  console.time("PMFs");
  liveDistUpdates(numPMFs);

  function liveDistUpdates(n) {
    if (n > 0) {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          const j = nextPMF.next().value;
          addTableColumn(j + 1, PMFs[j]);
          liveDistUpdates(n - 1);
        });
      });
    } else {
      console.timeEnd("PMFs");
      const holding = numberWithCommas(user.bonds);
      statementText.innerText = `Outcomes with holding of £${holding}`;
    }
  }

  function initialiseTable() {
    tableContainer.innerHTML = "";
    let numDists = 1 + user.periods.length;
    const tbl = document.createElement("table");

    // create column headers
    const tblHeader = document.createElement("thead");

    const headerRow = document.createElement("tr");

    for (let j = 0; j <= numDists; j++) {
      const cell = document.createElement("th");
      cell.id = `th0-${j}`;
      cell.textContent = columnHeader(j);
      headerRow.appendChild(cell);
    }

    tblHeader.appendChild(headerRow);
    tbl.appendChild(tblHeader);

    // create body
    const tblBody = document.createElement("tbody");
    const numRows = 1 + user.brackets.length + 1 + user.percentiles.length;
    for (let i = 1; i <= numRows; i++) {
      const row = document.createElement("tr");

      // create row headers
      const headerCell = document.createElement("th");
      headerCell.id = `th${i}-0`;
      headerCell.textContent = rowHeader(i);
      row.appendChild(headerCell);

      if (i === user.brackets.length + 2) {
        // merged row
        const cell = document.createElement("td");
        cell.colSpan = numDists;
        cell.textContent = `Expected payouts for luck percentiles`
        row.appendChild(cell);
      } else {
        // create data cells for other rows
        for (let j = 1; j <= numDists; j++) {
          const cell = document.createElement("td");
          cell.id = `td${i}-${j}`;
          cell.textContent = `...`;
          row.appendChild(cell);
        }
      }
      tblBody.appendChild(row);
    }
    tbl.appendChild(tblBody);

    tableContainer.appendChild(tbl);
  }

  function addTableColumn(j, pmf) {
    const dist = new CDF(pmf);
    addItem(1, j, `${percent(dist.F(0) ?? 0, 1)}`);

    let rowOffset = 2;
    for (let i = 0; i < user.brackets.length; i++) {
      const p = dist.probAtLeast(user.brackets[i]);
      const s =
        p >= 0.01
          ? `${percent(p, 1)}`
          : `1 in ${numberWithCommas(Math.floor(1 / p))}`;
      addItem(i + rowOffset, j, s);
    }

    rowOffset = user.brackets.length + 3;
    for (let i = 0; i < user.percentiles.length; i++) {
      const v = dist.getPercentile(user.percentiles[i]);
      const s = v === 0 ? "-" : `£${numberWithCommas(v)}`;
      addItem(i + rowOffset, j, s);
    }
    console.log("Percentiles for column", j);
    console.log(user.percentiles.map((pc) => dist.getPercentile(pc)));
  }

  function addItem(i, j, item) {
    const cell = document.querySelector(`#td${i}-${j}`);
    cell.textContent = item;
  }

  function rowHeader(row) {
    switch (true) {
      case row === 1:
        return "£0 exactly";
        break;
      case row < user.brackets.length + 2:
        return `At least £${numberWithCommas(user.brackets[row - 2])}`;
        break;
      case row === user.brackets.length + 2:
        return `Luck Level`;
        break;
      default:
        const index = row - user.brackets.length - 3;
        return `${user.percentiles[index]}%`;
      // return `${user.percentileDescriptions[index]}  (${user.percentiles[index]}%)`;
    }
  }

  function columnHeader(column) {
    switch (column) {
      case 0:
        return "Winning chance";
      case 1:
        return "1 month";
      default:
        const months = user.periods[column - 2];
        if (months === 12) return `1 year`;
        if (months % 12 === 0) return `${months / 12} years`;
        return `${user.periods[column - 2]} months`;
    }
  }
}

function initPrizeTable() {
  prizesContainer.innerHTML = "";
  const tbl = document.createElement("table");

  // create column headers
  const tblHeader = document.createElement("thead");
  const headerRow = document.createElement("tr");

  let cell = document.createElement("th");
  cell.textContent = "Prize value";
  headerRow.appendChild(cell);

  cell = document.createElement("th");
  cell.textContent = "Monthly draw (estimated)";
  headerRow.appendChild(cell);

  tblHeader.appendChild(headerRow);
  tbl.appendChild(tblHeader);

  // create body
  const tblBody = document.createElement("tbody");
  for (let i = 1; i <= nsi.prizes.length + 5; i++) {
    // create merged row
    if (i === nsi.prizes.length + 3) {
      const row = document.createElement("tr");
      const dataCell = document.createElement("td");
      dataCell.colSpan = "2";
      row.appendChild(dataCell);
      tblBody.appendChild(row);
      continue;
    }

    // create other rows
    const row = document.createElement("tr");
    const headerCell = document.createElement("td");
    const dataCell = document.createElement("td");
    headerCell.textContent = rowHeader(i);
    // dataCell.textContent = ``;
    dataCell.id = `td${i}`;
    row.appendChild(headerCell);
    row.appendChild(dataCell);
    tblBody.appendChild(row);
  }

  tbl.appendChild(tblBody);
  prizesContainer.appendChild(tbl);

  function addItem(i, item) {
    const cell = document.querySelector(`#td${i}`);
    cell.textContent = item;
  }

  function rowHeader(row) {
    switch (row) {
      case 1:
        return "£1 million";
      case nsi.prizes.length + 3:
        return "";
      case nsi.prizes.length + 1:
        return "Total prizes";
      case nsi.prizes.length + 2:
        return "Total value";
      case nsi.prizes.length + 4:
        return "Prize fund rate (implied)";
      case nsi.prizes.length + 5:
        return "Total bonds (implied)";
      default:
        return `£${numberWithCommas(nsi.prizes[row - 1].value)}`;
    }
  }

  return {
    addData(nsTemp) {
      const len = nsi.prizes.length;
      for (let i = 1; i <= len; i++) {
        addItem(i, numberWithCommas(nsTemp.prizes[i - 1].number));
      }
      addItem(len + 1, numberWithCommas(nsTemp.totalPrizes));
      addItem(len + 2, `£${numberWithCommas(nsTemp.totalPrizeValue)}`);
      addItem(len + 4, `${percent(12 * nsTemp.monthlyReturn, 2)} p.a.`);
      addItem(len + 5, `${numberWithCommas(nsTemp.bonds)}`);
    },

    clearData() {
      for (let i = 1; i <= nsi.prizes.length + 5; i++) {
        if (i !== nsi.prizes.length + 3) {
          addItem(i, "");
        }
      }
    },
  };
}

function numberWithCommas(x) {
  return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function numberRound(x, dp) {
  return Number.parseFloat(x).toFixed(dp);
}

function percent(x, dp) {
  return `${numberRound(100 * x, dp)}%`;
}
