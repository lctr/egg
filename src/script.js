var editor = CodeMirror.fromTextArea(document.getElementById("code-editor"), {
  tabSize: 2,
  theme: "egg",
  mode: "javascript", //"javascript",
  autofocus: true,
  lineNumbers: true,
  lineWrapping: true,
  matchBrackets: true,
  autoCloseBrackets: {
    pairs: "(){}''\"\"``",
    explode: "(){}"
  }
});

// Query the element
const resizer = document.getElementById('resize-x');
const leftSide = resizer.previousElementSibling;
const rightSide = resizer.nextElementSibling;
const bothSides = resizer.parentElement;

// The current position of mouse
let x = rightSide.clientLeft;
let y = 0;
let leftWidth = leftSide.style.width;

// Handle the mousedown event
// that's triggered when user drags the resizer
const onClick = function (e) {
  // Get the current mouse position
  x = e.clientX;
  y = e.clientY;
  leftWidth = leftSide.getBoundingClientRect().width;
  leftSide.style.width = leftWidth;

  // Remove default flex values
  leftSide.classList.remove('default-left');
  rightSide.classList.remove('default-right');

  // Attach the listeners to `document`
  document.addEventListener('mousemove', onDrag);
  document.addEventListener('mouseup', onRelease);
};

const onDrag = function (e) {
  // How far the mouse has been moved
  const dx = e.clientX - x;
  const dy = e.clientY - y;

  const newLeftWidth = (leftWidth + dx) * 100 / resizer.parentNode.getBoundingClientRect().width;
  leftSide.style.width = `${ newLeftWidth }%`;

  resizer.style.cursor = 'col-resize';
  document.body.style.cursor = 'col-resize';

  leftSide.style.userSelect = 'none';
  leftSide.style.pointerEvents = 'none';

  rightSide.style.userSelect = 'none';
  rightSide.style.pointerEvents = 'none';
};

const onRelease = function () {
  resizer.style.removeProperty('cursor');
  document.body.style.removeProperty('cursor');

  leftSide.style.removeProperty('user-select');
  leftSide.style.removeProperty('pointer-events');

  rightSide.style.removeProperty('user-select');
  rightSide.style.removeProperty('pointer-events');

  // Remove the handlers of `mousemove` and `mouseup`
  document.removeEventListener('mousemove', onDrag);
  document.removeEventListener('mouseup', onRelease);
};

// Attach the handler
resizer.addEventListener('mousedown', onClick);

const results = document.getElementById("results");
const stackLogs = document.getElementById("logs");
const json = document.getElementById("json");

const ast = (input) => {
  let html = ''
  let tree = JSON.stringify(Egg.parse(input), null, 1)
    .replaceAll('"', '')
    .replaceAll(': ', ' :: ')
    .replace(/\{\n\t+/g, '{ ')
    // .replaceAll('')
  console.log(tree);
  return tree;
};

function inputHandler (e) {
  results.textContent = ' · · · ';
  let code = editor.getValue().trim();
  if (code.length > 0) {
    // until ; is implemented in the language, remove it
    // code = code.substring(0, code.length - 1);
    try {
      json.textContent = ast(code);
      results.innerHTML = `
        <span style="color: #fefefe">ʃ>  </span>
        <span>${ Egg.run(code) }</span>`;
    } catch (e) {
      results.textContent = '';
      logs.textContent = e;
    }
    stackLogs.innerHTML = Egg.logs.join('\n');
  } else {
    results.textContent = logs.textContent = json.textContent = '';
  }
};

editor.on("change", inputHandler);

