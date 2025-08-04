const holdingInput = document.querySelector("#holding");
const calculateButton = document.querySelector("#calculate");
const updateButton = document.querySelector("#update");
const updateText = document.querySelector("#update-text");
const cancelButton = document.querySelector("#cancelButton");
const statementText = document.querySelector("#statement");
const dialog = document.querySelector("dialog");
const numberPrizes = document.querySelector("#numberPrizes");
const prizeFund = document.querySelector("#prizeFund");
const odds = document.querySelector("#odds");

updateButton.addEventListener("click", () => {
  console.log("Here");
  tableContainer.innerHTML = "";
  statementText.innerText = "";
  updateButton.classList.add("active");
  updateText.classList.add("active");
  dialog.show();
});

submitButton.addEventListener("click", (event) => {
  setupNSIdata(numberPrizes.value, prizeFund.value, odds.value);
  event.preventDefault();
  document.getElementById("new-prizedraw").reset();
  updateButton.classList.remove("active");
  updateText.classList.remove("active");
  dialog.close();

  ifValidHoldingInput((number) => {
    calculateButton.classList.remove("primed");
    user.bonds = number;
  });
  statementText.innerText = "Calculating...";
  generateTable();
});

cancelButton.addEventListener("click", () => {
  document.getElementById("new-prizedraw").reset();
  holdingInput.value = "";
  updateButton.classList.remove("active");
  updateText.classList.remove("active");
  dialog.close();
  generateTable();
});

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

