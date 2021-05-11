(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
    typeof define === 'function' && define.amd ? define(factory) :
      (global = global || self, global.Egg = factory());
}(this, (function (Egg) {
  'use strict';
  const logs = [];

  // 0. MODIFICATIONS
  // token types 
  const STR = 'str',
    INT = 'int',
    FLT = 'flt',
    VAR = 'var',
    APL = 'apl',
    FNC = 'fnc';
  
  const booleanRE = /^(true|false)\b/;
  const stringRE = /^"(?:\\["\\]|[^\n"\\])*"/;
  const floatRE = /^([0-9]+\.[0-9]+([eE][+-]?[0-9]+)?|[0-9]+[eE][+-]?[0-9]+)\b/;
  const integerRE = /^\-?\d+\b/;
  const hexRE = /(?<!\w|\$)0[xX]\h+\b/;
  const binaryRE = /(?<!\w|\$)0[bB]\h+\b/;
  const octalRE = /(?<!\w|\$)0[xX]\h+\b/;
  const operatorRE = /[+|-]/;



  // 1. PARSER
  function skipSpace (program) {
    // '~' introduces a line comment
    let skippable = program.match(/^(\s|~~.*)*/);
    return program.slice(skippable[ 0 ].length);
  }

  function parseExpression (program, state) {
    program = skipSpace(program);
    let match, expr;
    if (match = booleanRE.exec(program)) {
      expr = { type: BLN, value: match[ 0 ] };
    }
    else if (match = /^"(?:\\["\\]|[^\n"\\])*"/.exec(program)) {
      expr = { type: STR, value: match[ 1 ] };
    }
    else if (match = floatRE.exec(program)) {
      expr = { type: FLT, value: parseFloat(match[ 0 ]) }; 
    }
    else if (match = /^\d+\b/.exec(program)) {
      expr = { type: INT, value: Number(match[ 0 ]) };
    }
    else if (match = /^[^\s\(\)\{\},~"]+/.exec(program)) {
      expr = { type: VAR, name: match[ 0 ] };
    }
    else {
      throw new SyntaxError(`Expression parse error! Unexpected syntax: ${ program }`);
    }
    return parseApply(expr, program.slice(match[ 0 ].length));
  }

  function parseBrackets (expr, program) {
    program = skipSpace(program);
    if (program[ 0 ] != '[') {
      return { expr, rest: program };
    }
    program = skipSpace(program.slice(1));
    expr = { type: APL, operator: { type: VAR, name: '[]' }, args: [] };
    while (program[ 0 ] !== ']') {
      let arg = parseExpression(program);
      expr.args.push(arg.expr);
      program = skipSpace(arg.rest);
      if (program[ 0 ] === ',') {
        program = skipSpace(program.slice(1));
      } else if (program[0] !== ']') {
        throw new SyntaxError(
          `Expected ',' or ']', but instead got ${program[0]}`
        )
      }
    }
    return parseBrackets(expr, program.slice(1))
  }

  function parseApply (expr, program) {
    program = skipSpace(program);
    // if next char in program is not "(", then there is no application, returning expression given
    if (program[ 0 ] !== '(') {
      return { expr, rest: program };
    }
    program = skipSpace(program.slice(1));
    expr = { type: APL, operator: expr, args: [] };
    while (program[ 0 ] !== ')') {
      let arg = parseExpression(program);
      expr.args.push(arg.expr);
      program = skipSpace(arg.rest);
      if (program[ 0 ] === ',') {
        program = skipSpace(program.slice(1));
      } else if (program[ 0 ] !== ')') {
        throw new SyntaxError(
          `Expected ',' or ')', but instead got ${ program[0] }`
        );
      }
    }
    // need to check again (after parsing) since application expression can itself be applied
    return parseApply(expr, program.slice(1));
  }

  function parse (program) {
    let { expr, rest } = parseExpression(program);
    if (skipSpace(rest).length > 0) {

      throw new SyntaxError('Unexpected text after program');
    }
    return expr;
  }

  function evaluate (expr, scope) {
    if (expr.type === INT || expr.type === FLT || expr.type === STR) {
      return expr.value;
    } else if (expr.type === VAR) {
      // check whether binding is in scope
      if (expr.name in scope) {
        // if binding in scope, fetch binding value
        return scope[ expr.name ];
      } else {
        throw new ReferenceError(`Undefined binding: ${ expr.name }`);
      }
    } else if (expr.type === APL) {
      let { operator, args } = expr;
      // if base form, don't evaluate and instead pass along argument expressions and scope to the function that handles the specific form
      if (operator.type === VAR && operator.name in base) {
        return base[ operator.name ](expr.args, scope);
      } else {
        // otherwise we evaluate the operator, verify that its a function, and call it with the evaluated arguments
        let op = evaluate(operator, scope);
        if (typeof op === 'function') {
          return op(...args.map((arg) => evaluate(arg, scope)));
        } else {
          throw new TypeError('Applying a non-function!');
        }
      }
    }
  }

  // 2 (BASE) SPECIAL FORMS
  // reserved keywords/function names/to define special syntax
  // associates words with functions that evaluate such forms
  const base = Object.create(null);

  // IF-form, 3 args; if (condition, thenExpression, elseExpression)
  // necessary to define as ternary since arguments to all functions get evaluated before function call (not lazy!!), but if should ONLY evaluate the 2nd or 3rd argument
  base.if = (args, scope) => {
    if (args.length != 3) {
      throw new SyntaxError(
        "Wrong number of arguments provided to 'if (a, b, c)'",
      );
    } else if (evaluate(args[ 0 ], scope) !== false) {
      // the only falsy value is false
      return evaluate(args[ 1 ], scope);
    } else {
      return evaluate(args[ 2 ], scope);
    }
  };

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
  // returns last value of last expression
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
    if (args.length != 2 || args[ 0 ].type != VAR) {
      throw new SyntaxError('Incorrect use of let');
    }
    let value = evaluate(args[ 1 ], scope);
    scope[ args[ 0 ].name ] = value;
    return value;
  };

  // SET-form, 2 args; set (word, expression)
  // like LET, except it updates the value of the binding in the global
  // scope if the binding is not in the local scope
  base.set = (args, env) => {
    if (args.length != 2 || args[ 0 ].type != VAR) {
      console.log('Incorrect use of set. Scope:\n', env);
      throw new SyntaxError(
        'Incorrect use of set! Assignment only valid for variables.',
      );
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
    throw new ReferenceError(
      `Cannot set value of undefined variable ${ varName }!`,
    );
  };

  // LAMBDA-form, produces a function; :: (...args, body)
  // functions get their own local scope;
  // treats last argument as function body, and all args before as names of the function's parameters
  base[ '::' ] = (args, scope) => {
    if (!args.length) {
      throw new SyntaxError('Functions need a body!');
    }

    let body = args[ args.length - 1 ];
    let params = args.slice(0, args.length - 1).map((expr) => {
      if (expr.type != VAR) {
        throw new SyntaxError('Parameter names must be unassigned variables!');
      }
      return expr.name;
    });
    return function () {
      if (arguments.length != params.length) {
        throw new TypeError('Wrong number of arguments!');
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
  globals[ 'true' ] = true;
  globals[ 'false' ] = false;
  globals[ 'and' ] = (a, b) => a && b;
  globals[ 'or' ] = (a, b) => a || b;

  // basic arithmetic and relations operators
  // TODO: rewrite
  globals[ '+' ] = (a, b) => a + b;
  globals[ '-' ] = (a, b) => a - b;
  globals[ '*' ] = (a, b) => a * b;
  globals[ '/' ] = (a, b) => a / b;
  globals[ 'mod' ] = (a, b) => a % b;
  globals[ 'gcd' ] = (a, b) => {
    let t;
    while (b !== 0) {
      t = b;
      b = a % b;
      a = t;
    }
    return a;
  };

  globals[ 'lcm' ] = (a, b) => {
    if (typeof a !== 'number' || typeof b !== 'number')
      throw new TypeError(`Arguments to lcm(a, b) must be numbers!`);
    if (a === 0 && b === 0) return 0;
    const f = globals['gcd'](a, b);
    if (a === 0) return Math.abs(b);
    else if (b === 0) return Math.abs(a);
    else {
      return (Math.abs(a) / f) * Math.abs(b); 
    }
  };

  globals[ '<' ] = (a, b) => a < b;
  globals[ '>' ] = (a, b) => a > b;
  globals[ '==' ] = (a, b) => Object.is(a, b);

  // console.log wrapper
  globals[ 'show' ] = () => {
    value.forEach((v) => {
      console.log(v);
    });
    return value;
  };

  // arrays
  globals[ '[]' ] = (...values) => values;
  globals[ '#' ] = (array = []) => {
    if (!Array.isArray(array))
      throw new Error("Argument must be an array");
    return array.length;
  };

  // preprocessing; syntactic sugar??

  // interpreter; wrapper to parse a program and run it in a new scope
  // to preserve global scope, nested scopes are represented using obj prototype chains
  function run () {
    let scope = Object.create(globals);
    let program = Array.prototype.slice.call(arguments, 0).join('\n');
    let ast = parse(program, scope);
    return evaluate(parse(program), scope);
  }

  return {
    parse,
    evaluate,
    run,
    logs
  };
})));