const Egg = (function () {
  let stack = {
    logs: [], line: 0, cache: {},
    get read () {
      return this.logs;
    },
    dLine () {
      this.line++;
    },
    write (item) {
      this.logs.push(item ? item : 'Error logging Thing.');
    },
    refresh () {
      this.cache.logs = this.logs;
      this.cache.line = this.line;
      this.logs = [];
      this.line = 0;
      console.log(`Egg stopped at line ${ this.cache.line }`);
    },
    toString () {
      return this.logs.map(l => `· ${ l }`).join("<br>");
    }
  };

  // 1. PARSER
  function skipSpace (text) {
    // '~' introduces a line comment
    let skippable = text.match(/^(\s|~.*)*/);
    if (/\n/.test(skippable[ 0 ])) stack.dLine();
    return text.slice(skippable[ 0 ].length);
  }

  function parseExpression (program) {
    program = skipSpace(program);
    let match, expr;
    // match for existing supported atomic elements
    if (match = /^"([^"]*)"/.exec(program)) {
      // strings
      expr = { type: "value", value: match[ 1 ] };
    } else if (match = /^\d+\b/.exec(program)) {
      // numbers
      expr = { type: "value", value: Number(match[ 0 ]) };
    } else if (match = /^[^\s(),~"]+/.exec(program)) {
      // words
      expr = { type: "word", name: match[ 0 ] };
    } else {
      throw new SyntaxError(`Unexpected syntax: ${ program }`);
    }
    return parseApply(expr, program.slice(match[ 0 ].length));
  }

  function parseApply (expr, program) {
    program = skipSpace(program);
    // if next char in program is not "(", then there is no application, returning expression given 
    if (program[ 0 ] !== "(") {
      return { expr, rest: program };
    }
    program = skipSpace(program.slice(1));
    expr = { type: "apply", operator: expr, args: [] };
    while (program[ 0 ] !== ")") {
      let arg = parseExpression(program);
      expr.args.push(arg.expr);
      program = skipSpace(arg.rest);
      if (program[ 0 ] === ",") {
        program = skipSpace(program.slice(1));
      } else if (program[ 0 ] !== ")") {
        throw new SyntaxError("Expected ',' or ')'");
      }
    }
    // need to check again (after parsing) since application expression can itself be applied
    return parseApply(expr, program.slice(1));
  }

  function parse (program) {
    console.log('original code:', program);
    let { expr, rest } = parseExpression(program);
    if (skipSpace(rest).length > 0) {
      throw new SyntaxError("Unexpected text after program");
    }
    return expr;
  }

  function evaluate (expr, scope) {
    if (expr.type === "value") {
      return expr.value;
    } else if (expr.type === "word") {
      // check whether binding is in scope
      if (expr.name in scope) {
        // if binding in scope, fetch binding value
        return scope[ expr.name ];
      } else {
        throw new ReferenceError(`Undefined binding: ${ expr.name }`);
      }
    } else if (expr.type === "apply") {
      let { operator, args } = expr;
      // if base form, don't evaluate and instead pass along argument expressions and scope to the function that handles the specific form
      if (operator.type === "word" &&
        operator.name in base) {
        return base[ operator.name ](expr.args, scope);
      } else {
        // otherwise we evaluate the operator, verify that its a function, and call it with the evaluated arguments
        let op = evaluate(operator, scope);
        if (typeof op === "function") {
          return op(...args.map(arg => evaluate(arg, scope)));
        } else {
          throw new TypeError("Applying a non-function!");
        }
      }
    }
  }

  // 2 (BASE) SPECIAL FORMS
  // reserved keywords/function names/to define special syntax
  // associates words with functions that evaluate such forms
  const base = Object.create(null);

  // IF-form, 3 args; if (condition, thenExpression, elseExpression)
  // args match JS ternary operator a ? b : c
  // necessary to define since arguments to all functions get evaluated before function call (not lazy!!), but if should ONLY evaluate the 2nd or 3rd argument
  base.if = (args, scope) => {
    if (args.length != 3) {
      throw new SyntaxError(
        "Wrong number of arguments provided to 'if (a, b, c)'"
      );
    } else if (evaluate(args[ 0 ], scope) !== false) {
      // the only falsy value is false
      return evaluate(args[ 1 ], scope);
    } else {
      return evaluate(args[ 2 ], scope);
    }
  };

  // WHILE-form, 2 args; while (condition, expression)
  // its value is arbitrarily false as we don't have undefined/void/etc 
  base.while = (args, scope) => {
    if (args.length != 2) {
      throw new SyntaxError(
        "Wrong number of arguments provided to 'while (a, b)'"
      );
    }
    while (evaluate(args[ 0 ], scope) !== false) {
      evaluate(args[ 1 ], scope);
    }
    return false;
  };

  // DO-form, N args; do (arg1, arg2, ...)
  // executed from top/first to bottom/last
  // its value is the value produced by the LAST arg
  // ? does it return false if no args provided?
  base.do = (args, scope) => {
    let value = false;
    for (let arg of args) {
      value = evaluate(arg, scope);
    }
    return value;
  };

  // LET-form, 2 args; let (word, expression)
  // assignment; binds the value produced by expression to word
  // its value is the value that was assigned to word
  base.let = (args, scope) => {
    if (args.length != 2 || args[ 0 ].type != "word") {
      throw new SyntaxError("Incorrect use of let");
    }
    let value = evaluate(args[ 1 ], scope);
    scope[ args[ 0 ].name ] = value;
    return value;
  };

  // SET-form, 2 args; set (word, expression) 
  // like LET, except it updates the value of the binding in the global
  // scope if the binding is not in the local scope
  base.set = (args, env) => {
    if (args.length != 2 || args[ 0 ].type != "word") {
      console.log('Incorrect use of set. Scope:\n', env);
      throw new SyntaxError("Incorrect use of set! Assignment only valid for variables.");
    }
    let varName = args[ 0 ].name;
    let value = evaluate(args[ 1 ], env);

    // traverse the prototype chain to find binding
    // updates binding in global scope if not in local scope
    for (let scope = env; scope; scope = Object.getPrototypeOf(scope)) {
      if (Object.prototype.hasOwnProperty.call(scope, varName)) {
        scope[ varName ] = value;
        return value;
      }
    }
    // if binding is not defined at all in any scopes
    throw new ReferenceError(`Cannot set value of undefined variable ${ varName }!`);
  };

  // LAMBDA-form, produces a function; :: (...args, body)
  // functions get their own local scope;
  // treats last argument as function body, and all args before as names of the function's parameters
  base[ "::" ] = (args, scope) => {
    if (!args.length) {
      throw new SyntaxError("Functions need a body!");
    }
    let body = args[ args.length - 1 ];
    let params = args.slice(0, args.length - 1).map(expr => {
      if (expr.type != "word") {
        throw new SyntaxError("Parameter names must be words!");
      }
      return expr.name;
    });
    return function () {
      if (arguments.length != params.length) {
        throw new TypeError("Wrong number of arguments!");
      }
      let locals = Object.create(scope);
      for (let i = 0; i < arguments.length; i++) {
        locals[ params[ i ] ] = arguments[ i ];
      }
      return evaluate(body, locals);
    };
  };

  // 3. ENVIRONMENT
  // global scope
  const globals = Object.create(null);

  // accessing booleans
  globals[ "true" ] = true;
  globals[ "false" ] = false;

  // basic arithmetic and relations operators 
  // using object prototype chain to represent nested scopes
  [ "+", "-", "*", "/", "==", "<", ">" ].forEach(op => {
    globals[ op ] = Function("a, b", `return a ${ op } b`);
  });

  // console.log wrapper
  globals[ "log" ] = value => {
    console.log(value);
    stack.write(value);
    return value;
  };

  // arrays
  globals[ "array" ] = (...values) => values;
  globals[ "length" ] = array => array.length;
  globals[ "element" ] = (array, i) => array[ i ];

  // interpreter; wrapper to parse a program and run it in a new scope
  // to preserve global scope, nested scopes are represented using obj prototype chains
  function run () {
    let scope = Object.create(globals);
    let program = Array.prototype.slice.call(arguments, 0).join("\n");
    return evaluate(parse(program), scope);
  }

  return {
    parse, evaluate, run, stack
  };
}());
