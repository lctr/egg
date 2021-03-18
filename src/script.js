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
  let [ L, R ] = [ '(', ')' ].map(p => countOf(p, input));
  if (input.trim().length > 0) {
    if (L > 0 && L === R) { // cheaply preventing running before done typing
      try {
        json.textContent = ast(input);
        results.textContent = Egg.run(input);
      } catch (e) {
        json.textContent = '';
        results.textContent = e;
      }
    }
  } else {
    json.textContent = '';
    results.textContent = '';
  }
});

function countOf (char, string) {
  let num = 0, len = string.length | 0;
  while (len--) { if (string[ len ] === char) num++; }
  return num;
}

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
    $.value = append("\t");
    this.selectionStart = this.selectionEnd = a + 1;
  } else if (e.code === 'Enter') {
    $.value = append("\n  ");
    this.selectionStart = this.selectionEnd = a + 3;
  }
  e.preventDefault();
});
