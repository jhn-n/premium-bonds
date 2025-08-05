const prizesContainer = document.querySelector("#prizes-container");

function makePrizedrawTableTemplate() {
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
    const row = document.createElement("tr");

    // create row headers
    const headerCell = document.createElement("td");
    headerCell.textContent = generatePrizesRowHeader(i);
    row.appendChild(headerCell);

    // create data
    const cell = document.createElement("td");
    cell.id = `td${i}`;
    cell.textContent = ``;
    row.appendChild(cell);

    tblBody.appendChild(row);
  }
  tbl.appendChild(tblBody);
  prizesContainer.appendChild(tbl);
}

function addColumnPrizedrawTable(nsTemp) {
  const len = nsi.prizes.length;
  for (let i = 1; i <= len; i++) {
    addPrizeData(i, numberWithCommas(nsTemp.prizes[i - 1].number));
  }
  addPrizeData(len + 1, numberWithCommas(nsTemp.totalPrizes));
  addPrizeData(len + 2, `£${numberWithCommas(nsTemp.totalPrizeValue)}`);
  addPrizeData(len + 4, `${percent(12 * nsTemp.monthlyReturn, 2)}`);
  addPrizeData(len + 5, `${numberWithCommas(nsTemp.bonds)}`);
}

function clearColumnPrizedrawTable() {
  for (let i = 1; i <= nsi.prizes.length + 5; i++) {
    addPrizeData(i, "");
  }
}

function addPrizeData(i, item) {
  const cell = document.querySelector(`#td${i}`);
  cell.textContent = item;
}

function generatePrizesRowHeader(row) {
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
      return "Annual prize fund rate";
    case nsi.prizes.length + 5:
      return "Total bonds (estimated)";
    default:
      return `£${numberWithCommas(nsi.prizes[row - 1].value)}`;
  }
}
