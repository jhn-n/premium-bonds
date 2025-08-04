const tableContainer = document.querySelector("#table-container");

function generateTableTemplate(pdPeriod) {
  tableContainer.innerHTML = "";
  let numDists = 1 + user.periods.length;
  const tbl = document.createElement("table");

  // create column headers
  const tblHeader = document.createElement("thead");

  const headerRow = document.createElement("tr");

  for (let j = 0; j <= numDists; j++) {
    const cell = document.createElement("th");
    cell.id = `th0-${j}`;
    cell.textContent = generateColumnHeader(j);
    headerRow.appendChild(cell);
  }

  tblHeader.appendChild(headerRow);
  tbl.appendChild(tblHeader);

  // create body
  const tblBody = document.createElement("tbody");
  for (let i = 1; i < user.brackets.length + 2; i++) {
    const row = document.createElement("tr");

    // create row headers
    const headerCell = document.createElement("th");
    headerCell.id = `th${i}-0`;
    headerCell.textContent = generateRowHeader(i);
    row.appendChild(headerCell);

    // create data
    for (let j = 1; j <= numDists; j++) {
      const cell = document.createElement("td");
      cell.id = `td${i}-${j}`;
      cell.textContent = `...`;
      row.appendChild(cell);
    }

    tblBody.appendChild(row);
  }
  tbl.appendChild(tblBody);

  tableContainer.appendChild(tbl);
}

function addDistColumn(j, pd) {
  addData(1, j, `${percent(pd.get(0), 1)}`);
  for (const [i, b] of user.brackets.entries()) {
    const p = pd.entries().reduce((p, e) => (e[0] >= b ? p + e[1] : p), 0);
    const s =
      p >= 0.01
        ? `${percent(p, 1)}`
        : `1 in ${numberWithCommas(Math.floor(1 / p))}`;
    addData(i + 2, j, s);
  }
}

function addData(i, j, item) {
  const cell = document.querySelector(`#td${i}-${j}`);
  cell.textContent = item;
}

function generateRowHeader(row) {
  if (row === 1) {
    return "£0 exactly";
  }
  return `At least £${numberWithCommas(user.brackets[row - 2])}`;
}

function generateColumnHeader(column) {
  switch (column) {
    case 0:
      return "WINNING PROBABILITIES";
    case 1:
      return "1 month";
    default:
      return `${user.periods[column - 2]} months`;
  }
}

function numberWithCommas(x) {
  return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function round(x, dp) {
  return Number.parseFloat(x).toFixed(dp);
}

function percent(x, dp) {
  return `${round(100 * x, dp)}%`;
}