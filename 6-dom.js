// kick off and DOM manipulation

generateAnalysisTable();

// for "about" info

const aboutButton = document.querySelector("#about-button");
const closeAboutButton = document.querySelector("#cancel-about-button");
const aboutDialog = document.querySelector("#about");

aboutButton.addEventListener("click", () => aboutDialog.showModal());
closeAboutButton.addEventListener("click", () => aboutDialog.close());


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
  generateAnalysisTable();
  holdingInput.value = "";
  holdingInput.placeholder = user.bonds;
  calculateButton.classList.remove("primed");
});


// for changes in underlying prize draw

const updateButton = document.querySelector("#update-button");
const cancelUpdateButton = document.querySelector("#cancel-update-button");
const submitUpdateButton = document.querySelector("#submit-update-button");

const updateText = document.querySelector("#update-text");
const prizedrawDialog = document.querySelector("#prizedraw");
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
  prizedrawDialog.showModal();
});

submitUpdateButton.addEventListener("click", (event) => {
  prizedrawDialog.close();
  nsi = nsiTemp;
  generateAnalysisTable();
  submitUpdateButton.classList.remove("primed");
  document.getElementById("new-prizedraw").reset();
  updateText.innerText = "Based on user input prize draw data";
  event.preventDefault();
});

cancelUpdateButton.addEventListener("click", () => {
  document.getElementById("new-prizedraw").reset();
  prizedrawDialog.close();
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
      submitUpdateButton.classList.add("primed");
      prizeTable.addData(nsiTemp);
      return;
    }
  }
  submitUpdateButton.classList.remove("primed");
  prizeTable.clearData();
}
