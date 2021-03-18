const textarea = document.getElementById("code-editor");
const json = document.getElementById("json");
const results = document.getElementById("results");

const ast = (input) => {
  let tree = JSON.stringify(Egg.parse(input), null, 2);
  return tree;
};

textarea.focus();
textarea.addEventListener('input', function (e) {
  let input = this.value;
  const trimmed = input.trim();
  if (trimmed.length > 0 && trimmed[ trimmed.length - 1 ] === ";") {
    input = input.substring(0, trimmed.length - 1);
    try {
      json.textContent = ast(input);
      results.textContent = `
        > ${ Egg.run(input) }
      `;
      logs.innerHTML = `
        ${ Egg.logs.log.map(l => `· ${ l }`).join("<br>") }
      `;
    } catch (e) {
      json.textContent = '';
      results.textContent = e;
    }
  } else {
    json.textContent = '';
    results.textContent = '';
  }
  Egg.logs.refresh();
});

textarea.addEventListener('keydown', function (e) {
  if (e.code !== 'Tab' && e.code !== 'Enter') return false;
  let $ = e.target,
    a = this.selectionStart,
    b = this.selectionEnd,
    append = (char) => $.value.substring(0, a) +
      char + $.value.substring(b);
  console.log(e.code);
  console.log(this);
  if (e.code === 'Tab') {
    $.value = append("  ");
    this.selectionStart = this.selectionEnd = a + 1;
  } else if (e.code === 'Enter') {
    $.value = append("\n  ");
    this.selectionStart = this.selectionEnd = a + 3;
  }
  e.preventDefault();
});
