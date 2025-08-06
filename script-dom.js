generateAnalysisTable();

const holdingInput = document.querySelector("#holding");
const calculateButton = document.querySelector("#calculate");
const statementText = document.querySelector("#statement");

holdingInput.addEventListener("input", () => {
  ifValidHoldingInput(
    () => calculateButton.classList.add("primed"),
    () => calculateButton.classList.remove("primed")
  );
});

calculateButton.addEventListener("click", () => {
  ifValidHoldingInput((number) => {
    calculateButton.classList.remove("primed");
    user.bonds = number;
    holdingInput.value = "";
    statementText.innerText = "Calculating...";
    generateAnalysisTable();
  });
});

function ifValidHoldingInput(yesFun, noFun) {
  const number = Number(holdingInput.value);
  if (
    number >= 25 &&
    number <= 50000 &&
    number === Math.floor(number) &&
    number !== user.bonds
  ) {
    yesFun(number);
  } else if (noFun) {
    noFun(number);
  }
}

const updateButton = document.querySelector("#updateButton");
const cancelButton = document.querySelector("#cancelButton");
const submitButton = document.querySelector("#submitButton");

const updateText = document.querySelector("#update-text");
const dialog = document.querySelector("#prizedraw");
const numberPrizesInput = document.querySelector("#numberPrizes");
const prizeFundInput = document.querySelector("#prizeFund");
const oddsInput = document.querySelector("#odds");

let nsiTemp, prizeTable;

updateButton.addEventListener("click", () => {
  prizeTable = initPrizeTable();
  prizeTable.addData(nsi);
  // makePrizedrawTableTemplate();
  // addColumnPrizedrawTable(nsi);
  oddsInput.placeholder = nsi.odds;
  numberPrizesInput.placeholder = nsi.totalPrizes;
  prizeFundInput.placeholder = nsi.totalPrizeValue;
  dialog.showModal();
});

submitButton.addEventListener("click", (event) => {
  setupNSIdata(numberPrizesInput.value, prizeFundInput.value, oddsInput.value);
  event.preventDefault();
  document.getElementById("new-prizedraw").reset();
  dialog.close();
  nsi = nsiTemp;
  statementText.innerText = "Calculating...";
  generateAnalysisTable();
  updateText.innerText = "Based on user input prize draw data";
});

cancelButton.addEventListener("click", () => {
  document.getElementById("new-prizedraw").reset();
  dialog.close();
});

numberPrizesInput.addEventListener("input", actionPrizedrawInputs);
prizeFundInput.addEventListener("input", actionPrizedrawInputs);
oddsInput.addEventListener("input", actionPrizedrawInputs);

function actionPrizedrawInputs() {
  if (
    numberPrizesInput.checkValidity() &&
    prizeFundInput.checkValidity() &&
    oddsInput.checkValidity()
  ) {
    nsiTemp = setupNSIdata(
      numberPrizesInput.value,
      prizeFundInput.value,
      oddsInput.value
    );
    if (nsiTemp.prizes.every((p) => p.number >= 2)) {
      submitButton.classList.add("primed");
      prizeTable.addData(nsiTemp);
      // addColumnPrizedrawTable(nsiTemp);
      return;
    }
  }
  submitButton.classList.remove("primed");
  prizeTable.clearData();
  // clearColumnPrizedrawTable();
}
