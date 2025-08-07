// construction of main analysis table

const mainTablePercentRoundingDPs = 1;
const mainTableNumberRoundingSFs = 4;

function numberWithCommas(x) {
  return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function numberRound(x, dp) {
  return Number.parseFloat(x).toFixed(dp);
}

function percent(x, dp) {
  return `${numberRound(100 * x, dp)}%`;
}

function formatAnalysisTableNumber(x) {
  return numberWithCommas(
    parseFloat(x.toPrecision(mainTableNumberRoundingSFs))
  );
}

function generateAnalysisTable() {
  const tableContainer = document.querySelector("#table-container");
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
    const numDataRows = 1 + user.brackets.length + 1 + user.percentiles.length;
    const mergedRow = 1 + (1 + user.brackets.length);
    for (let i = 1; i < numDataRows + 1; i++) {
      const row = document.createElement("tr");

      switch (i) {
        case mergedRow:
          const mergedCell = document.createElement("th");
          mergedCell.colSpan = numDists + 1;
          mergedCell.id = `th${i}-0`;
          mergedCell.textContent = rowHeader(i);
          row.appendChild(mergedCell);
          break;
        default:
          const headerCell = document.createElement("th");
          headerCell.id = `th${i}-0`;
          headerCell.textContent = rowHeader(i);
          headerCell.style.textAlign = i > mergedRow ? "left" : "center";
          row.appendChild(headerCell);
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
    addItem(1, j, `${percent(dist.F(0) ?? 0, mainTablePercentRoundingDPs)}`);

    let rowOffset = 2;
    for (let i = 0; i < user.brackets.length; i++) {
      const p = dist.probAtLeast(user.brackets[i]);

      const s =
        p >= 0.01
          ? `${percent(p, mainTablePercentRoundingDPs)}`
          : `1 in ${formatAnalysisTableNumber(Math.round(1 / p))}`;
      addItem(i + rowOffset, j, s);
    }

    rowOffset = user.brackets.length + 3;
    for (let i = 0; i < user.percentiles.length; i++) {
      const v = dist.getPercentile(user.percentiles[i]);
      const s = v === 0 ? "-" : `£${numberWithCommas(v)}`;
      addItem(i + rowOffset, j, s);
    }
  }

  function addItem(i, j, item) {
    const cell = document.querySelector(`#td${i}-${j}`);
    cell.textContent = item;
  }

  function rowHeader(row) {
    switch (true) {
      case row === 1:
        return "£0 exactly";
      case row < user.brackets.length + 2:
        return `At least £${numberWithCommas(user.brackets[row - 2])}`;
      case row === user.brackets.length + 2:
        return `Outcome by percentile`;
      default:
        const index = row - user.brackets.length - 3;
        return `${user.percentiles[index]}% ${user.percentileDescriptions[index]}`;
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
