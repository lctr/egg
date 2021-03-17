// const Egg = require('./egg');

const textarea = document.getElementById("code-editor");
const json = document.getElementById("json");
const results = document.getElementById("results");

const ast = (input) => JSON.stringify(parse(input), null, 2);

textarea.focus();
textarea.addEventListener('input', function (e) {
  try {
    json.textContent = ast(this.value);
  } catch (e) {
    json.textContent = e;
  }
});