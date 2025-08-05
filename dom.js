const holdingInput = document.querySelector("#holding");
const calculateButton = document.querySelector("#calculate");

const statementText = document.querySelector("#statement");

const updateText = document.querySelector("#update-text");
const updateButton = document.querySelector("#updateButton");

const dialog = document.querySelector("#prizedraw");
const cancelButton = document.querySelector("#cancelButton");
const submitButton = document.querySelector("#submitButton");
const numberPrizes = document.querySelector("#numberPrizes");
const prizeFund = document.querySelector("#prizeFund");
const odds = document.querySelector("#odds");

let nsiTemp;

updateButton.addEventListener("click", () => {
  generatePrizedrawTable();
  addPrizesColumn(nsi);
  odds.placeholder = nsi.odds;
  numberPrizes.placeholder = nsi.totalPrizes;
  prizeFund.placeholder = nsi.totalPrizeValue;
  dialog.showModal();
});

submitButton.addEventListener("click", (event) => {
  setupNSIdata(numberPrizes.value, prizeFund.value, odds.value);
  event.preventDefault();
  document.getElementById("new-prizedraw").reset();
  dialog.close();
  nsi = nsiTemp;
  statementText.innerText = "Calculating...";
  generateTable();
  updateText.innerText = "Based on user input prize draw data"
});

cancelButton.addEventListener("click", () => {
  document.getElementById("new-prizedraw").reset();
  dialog.close();
});

numberPrizes.addEventListener("input", actionPrizedrawInputs);
prizeFund.addEventListener("input", actionPrizedrawInputs);
odds.addEventListener("input", actionPrizedrawInputs);

function actionPrizedrawInputs() {
  if (
    numberPrizes.checkValidity() &&
    prizeFund.checkValidity() &&
    odds.checkValidity()
  ) {
    nsiTemp = setupNSIdata(numberPrizes.value, prizeFund.value, odds.value);
    if (nsiTemp.prizes.every((p) => p.number >= 2)) {
      submitButton.classList.add("primed");
      addPrizesColumn(nsiTemp);
      return;
    }
  }
  submitButton.classList.remove("primed");
  clearPrizesColumn();
}

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
    generateTable();
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
