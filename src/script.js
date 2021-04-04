var editor = CodeMirror.fromTextArea(document.getElementById("code-editor"), {
  lineNumbers: true,
  tabSize: 2,
  mode: "javascript",
  matchBrackets: true,
  theme: "monokai"
});

document.addEventListener('DOMContentLoaded', function () {
  // Query the element
  const resizer = document.getElementById('resize-x');
  const leftSide = resizer.previousElementSibling;
  const rightSide = resizer.nextElementSibling;

  // The current position of mouse
  let x = 0;
  let y = 0;
  let leftWidth = 0;

  // Handle the mousedown event
  // that's triggered when user drags the resizer
  const mouseDownHandler = function (e) {
    // Get the current mouse position
    x = e.clientX;
    y = e.clientY;
    leftWidth = leftSide.getBoundingClientRect().width;

    // Remove default flex values
    leftSide.classList.remove('default-left');
    rightSide.classList.remove('default-right');

    // Attach the listeners to `document`
    document.addEventListener('mousemove', mouseMoveHandler);
    document.addEventListener('mouseup', mouseUpHandler);
  };

  const mouseMoveHandler = function (e) {
    // How far the mouse has been moved
    const dx = e.clientX - x;
    // const dy = e.clientY - y;

    const newLeftWidth = (leftWidth + dx) * 100 / resizer.parentNode.getBoundingClientRect().width;
    leftSide.style.width = `${ newLeftWidth }%`;

    resizer.style.cursor = 'col-resize';
    document.body.style.cursor = 'col-resize';

    leftSide.style.userSelect = 'none';
    leftSide.style.pointerEvents = 'none';

    rightSide.style.userSelect = 'none';
    rightSide.style.pointerEvents = 'none';
  };

  const mouseUpHandler = function () {
    resizer.style.removeProperty('cursor');
    document.body.style.removeProperty('cursor');

    leftSide.style.removeProperty('user-select');
    leftSide.style.removeProperty('pointer-events');

    rightSide.style.removeProperty('user-select');
    rightSide.style.removeProperty('pointer-events');

    // Remove the handlers of `mousemove` and `mouseup`
    document.removeEventListener('mousemove', mouseMoveHandler);
    document.removeEventListener('mouseup', mouseUpHandler);
  };

  // Attach the handler
  resizer.addEventListener('mousedown', mouseDownHandler);

  const results = document.getElementById("results");
  const stackLogs = document.getElementById("logs");
  const json = document.getElementById("json");

  const ast = (input) => {
    let tree = JSON.stringify(Egg.parse(input), null, 2);
    return tree;
  };

  function inputHandler (e) {
    results.textContent = ' · · · ';
    let code = editor.getValue().trim();
    if (code.length > 0 && code[ code.length - 1 ] === ";") {
      // until ; is implemented in the language, remove it
      code = code.substring(0, code.length - 1);
      try {
        json.textContent = ast(code);
        results.innerHTML = `<span>${ Egg.run(code) }</span>`;
      } catch (e) {
        results.textContent = json.textContent = '';
        logs.textContent = e;
      }
      stackLogs.innerHTML = Egg.stack.logs.join('; ');
    } else {
      results.textContent = logs.textContent = json.textContent = '';
    }
    Egg.stack.refresh();
  };

  editor.on("change", inputHandler);

});
