// table of current prizes used in analysis
// for prize draw update modal dialog (pop up)
// sets up table and returns an object allowing modification of data

function initPrizeTable() {
  const prizesContainer = document.querySelector("#prizes-container");
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
      case nsi.prizes.length + 1:
        return "Total prizes";
      case nsi.prizes.length + 2:
        return "Total value";
      case nsi.prizes.length + 3:
        return "";
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
