/* ============================================================================
 * 10_custom_function.js — station 10: custom g(x₁,x₂)
 *
 * Flow:
 *   1. Parse the expression with recursive descent (no eval)
 *   2. Central differences for ∇g and H_x (used by SORM)
 *   3. Call MVFOSM, HLRF, SORM and MC from 03/05/06/07 in turn
 * Note: arbitrary functions have no "exact analytical value"; FORM/SORM are numerical approximations and MC is the reference.
 * ==========================================================================*/
'use strict';
const M = require('./shared/math');
const { P } = require('./shared/example');
const { mvfosm } = require('./03_mvfosm');
const { hlr } = require('./05_form_hlrf');
const { sorm } = require('./06_sorm');
const { runMC } = require('./07_monte_carlo');

/* ------------------------------ Parser -------------------------------- */
function parse(src) {
  let i = 0;
  const tk = [];
  while (i < src.length) {
    const c = src[i];
    if (/\s/.test(c)) { i++; continue; }
    if (/[0-9.]/.test(c)) {
      const m = /^(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?/.exec(src.slice(i));
      tk.push({ t: 'num', v: parseFloat(m[0]) }); i += m[0].length; continue;
    }
    if (/[A-Za-z_]/.test(c)) {
      const m = /^[A-Za-z_][A-Za-z0-9_]*/.exec(src.slice(i));
      tk.push({ t: 'id', v: m[0] }); i += m[0].length; continue;
    }
    if ('+-*/^(),'.indexOf(c) >= 0) { tk.push({ t: c }); i++; continue; }
    throw new Error('unrecognized character ' + c);
  }
  tk.push({ t: 'end' });
  let pos = 0;
  const peek = () => tk[pos];
  const take = (t) => { if (tk[pos].t !== t) throw new Error('missing ' + t); return tk[pos++]; };
  const FUNCS = {
    sin: [1, Math.sin], cos: [1, Math.cos], exp: [1, Math.exp], sqrt: [1, Math.sqrt],
    abs: [1, Math.abs], log: [1, Math.log], min: [-1, Math.min], max: [-1, Math.max],
    pow: [2, Math.pow],
  };
  function expr() {
    let n = term();
    while (peek().t === '+' || peek().t === '-') {
      const op = tk[pos++].t; n = { t: 'bin', op, a: n, b: term() };
    }
    return n;
  }
  function term() {
    let n = unary();
    while (peek().t === '*' || peek().t === '/') {
      const op = tk[pos++].t; n = { t: 'bin', op, a: n, b: unary() };
    }
    return n;
  }
  function unary() {
    if (peek().t === '+') { pos++; return unary(); }
    if (peek().t === '-') { pos++; return { t: 'neg', a: unary() }; }
    return power();
  }
  function power() {
    const a = primary();
    if (peek().t === '^') { pos++; return { t: 'bin', op: '^', a, b: unary() }; }
    return a;
  }
  function primary() {
    const t = tk[pos];
    if (t.t === 'num') { pos++; return { t: 'num', v: t.v }; }
    if (t.t === '(') { pos++; const n = expr(); take(')'); return n; }
    if (t.t === 'id') {
      pos++;
      if (peek().t === '(') {
        const fn = FUNCS[t.v];
        if (!fn) throw new Error('unknown function ' + t.v);
        pos++;
        const args = [];
        if (peek().t !== ')') {
          for (;;) {
            args.push(expr());
            if (peek().t === ',') { pos++; continue; }
            break;
          }
        }
        take(')');
        if (fn[0] >= 0 && args.length !== fn[0]) throw new Error(t.v + ': wrong number of arguments');
        return { t: 'fn', f: fn[1], args };
      }
      if (t.v === 'x1' || t.v === 'x2') return { t: 'var', v: t.v };
      if (t.v === 'pi') return { t: 'num', v: Math.PI };
      if (t.v === 'e') return { t: 'num', v: Math.E };
      throw new Error('unknown variable ' + t.v);
    }
    throw new Error('incomplete expression');
  }
  const ast = expr();
  if (peek().t !== 'end') throw new Error('trailing content');
  return ast;
}

function evalAst(n, x1, x2) {
  switch (n.t) {
    case 'num': return n.v;
    case 'var': return n.v === 'x1' ? x1 : x2;
    case 'neg': return -evalAst(n.a, x1, x2);
    case 'bin': {
      const a = evalAst(n.a, x1, x2), b = evalAst(n.b, x1, x2);
      return n.op === '+' ? a + b : n.op === '-' ? a - b : n.op === '*' ? a * b :
        n.op === '/' ? a / b : Math.pow(a, b);
    }
    case 'fn': return n.f(...n.args.map((a) => evalAst(a, x1, x2)));
  }
  return NaN;
}

function makeExample(g) {
  const grad = (x) => {
    const h1 = Math.max(1e-5, Math.abs(x[0]) * 1e-4);
    const h2 = Math.max(1e-5, Math.abs(x[1]) * 1e-4);
    return [
      (g([x[0] + h1, x[1]]) - g([x[0] - h1, x[1]])) / (2 * h1),
      (g([x[0], x[1] + h2]) - g([x[0], x[1] - h2])) / (2 * h2),
    ];
  };
  const hess = (x) => {
    const h1 = Math.max(1e-4, Math.abs(x[0]) * 2e-4);
    const h2 = Math.max(1e-4, Math.abs(x[1]) * 2e-4);
    const f = g(x);
    const fxx = (g([x[0] + h1, x[1]]) - 2 * f + g([x[0] - h1, x[1]])) / (h1 * h1);
    const fyy = (g([x[0], x[1] + h2]) - 2 * f + g([x[0], x[1] - h2])) / (h2 * h2);
    const fxy = (g([x[0] + h1, x[1] + h2]) - g([x[0] + h1, x[1] - h2]) -
      g([x[0] - h1, x[1] + h2]) + g([x[0] - h1, x[1] - h2])) / (4 * h1 * h2);
    return [[fxx, fxy], [fxy, fyy]];
  };
  return { g, grad, hess };
}

function computeCustom(expr, p = P, mcN = 100000) {
  const ast = parse(expr);
  const g = (x) => evalAst(ast, x[0], x[1]);
  const ex = makeExample(g);
  const mv = mvfosm(ex, p);
  const form = hlr(ex, p, 45, 1e-7);
  const s = sorm(ex, p, form);
  const mc = runMC(ex, p, mcN);
  return { expr, g, mv, form, sorm: s, mc };
}

const defaultDemo = computeCustom('x1^2 - 2*x2', P, 100000);

module.exports = { parse, evalAst, makeExample, computeCustom, defaultDemo };
