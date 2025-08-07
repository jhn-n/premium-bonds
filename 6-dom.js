// DOM manipulation and kick off

generateAnalysisTable();

// for changes in premium bond holdings

const holdingInput = document.querySelector("#holding");
const calculateButton = document.querySelector("#calculate-button");
const statementText = document.querySelector("#statement");

holdingInput.addEventListener("input", () => {
  const n = Number(holdingInput.value);
  if (n >= 25 && n <= 50000 && n === Math.floor(n) && n !== user.bonds) {
    calculateButton.classList.add("primed");
  } else {
    calculateButton.classList.remove("primed");
  }
});

calculateButton.addEventListener("click", () => {
  user.bonds = Number(holdingInput.value);
  statementText.innerText = "Calculating...";
  generateAnalysisTable();
  holdingInput.value = "";
  holdingInput.placeholder = user.bonds;
  calculateButton.classList.remove("primed");
});

// for changes in underlying prize draw

const updateButton = document.querySelector("#update-button");
const cancelButton = document.querySelector("#cancel-button");
const submitButton = document.querySelector("#submit-button");

const updateText = document.querySelector("#update-text");
const dialog = document.querySelector("#prizedraw");
const numberPrizesInput = document.querySelector("#number-prizes");
const prizeFundInput = document.querySelector("#prize-fund");
const oddsInput = document.querySelector("#odds");

let nsiTemp, prizeTable;

updateButton.addEventListener("click", () => {
  prizeTable = initPrizeTable();
  prizeTable.addData(nsi);
  oddsInput.placeholder = nsi.odds;
  numberPrizesInput.placeholder = nsi.totalPrizes;
  prizeFundInput.placeholder = nsi.totalPrizeValue;
  dialog.showModal();
});

submitButton.addEventListener("click", (event) => {
  dialog.close();
  statementText.innerText = "Calculating...";
  nsi = nsiTemp;
  generateAnalysisTable();
  submitButton.classList.remove("primed");
  document.getElementById("new-prizedraw").reset();
  updateText.innerText = "Based on user input prize draw data";
  event.preventDefault();
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
      return;
    }
  }
  submitButton.classList.remove("primed");
  prizeTable.clearData();
}
