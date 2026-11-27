'use strict';

/* ════════════════════════════════
   RECURSIVE DESCENT PARSER
   No eval / new Function — safe for Manifest V3 CSP
════════════════════════════════ */
function tokenize(src) {
  src = src
    .replace(/π/g,  'pi')
    .replace(/√/g,  'sqrt')
    .replace(/÷/g,  '/')
    .replace(/×/g,  '*')
    .replace(/−/g,  '-')
    .replace(/\s+/g, '');
  // Scientific E notation: 1.5E3 → (1.5*10^3)
  src = src.replace(/(\d+\.?\d*)E([+-]?\d+)/g, '($1*10^$2)');

  const tokens = [];
  let i = 0;
  while (i < src.length) {
    if (/[\d.]/.test(src[i])) {
      let num = '';
      while (i < src.length && /[\d.]/.test(src[i])) num += src[i++];
      tokens.push({ type: 'NUM', val: parseFloat(num) });
      continue;
    }
    if (/[a-zA-Z]/.test(src[i])) {
      let word = '';
      while (i < src.length && /[a-zA-Z0-9]/.test(src[i])) word += src[i++];
      tokens.push({ type: 'ID', val: word });
      continue;
    }
    tokens.push({ type: src[i], val: src[i] });
    i++;
  }
  tokens.push({ type: 'EOF' });
  return tokens;
}

function parse(src) {
  const tokens = tokenize(src);
  let pos = 0;
  const peek = () => tokens[pos];
  const eat  = (t) => { if (tokens[pos].type === t) return tokens[pos++]; throw new Error('Expected ' + t); };

  function parseExpr() {
    let left = parseTerm();
    while (peek().type === '+' || peek().type === '-') {
      const op = tokens[pos++].type;
      left = op === '+' ? left + parseTerm() : left - parseTerm();
    }
    return left;
  }
  function parseTerm() {
    let left = parseUnary();
    while (peek().type === '*' || peek().type === '/') {
      const op = tokens[pos++].type;
      left = op === '*' ? left * parseUnary() : left / parseUnary();
    }
    return left;
  }
  function parseUnary() {
    if (peek().type === '-') { pos++; return -parseUnary(); }
    if (peek().type === '+') { pos++; return  parseUnary(); }
    return parsePower();
  }
  function parsePower() {
    const base = parsePostfix();
    if (peek().type === '^') { pos++; return Math.pow(base, parseUnary()); }
    return base;
  }
  function parsePostfix() {
    let val = parsePrimary();
    while (true) {
      if (peek().type === '!')  { pos++; val = factorial(val); continue; }
      if (peek().type === '%')  { pos++; val = val / 100;      continue; }
      if (peek().type === 'ID' && peek().val === 'C') {
        pos++; val = nCr(val, parsePrimary()); continue;
      }
      break;
    }
    return val;
  }
  function parsePrimary() {
    const tok = peek();
    if (tok.type === '(') {
      pos++;
      const val = parseExpr();
      if (peek().type === ')') pos++;
      return val;
    }
    if (tok.type === 'NUM') { pos++; return tok.val; }
    if (tok.type === 'ID') {
      const name = tok.val;
      if (name === 'pi') { pos++; return Math.PI; }
      if (name === 'e')  { pos++; return Math.E;  }
      const funcs = {
        sin:     x => Math.sin(toRad(x)),
        cos:     x => Math.cos(toRad(x)),
        tan:     x => Math.tan(toRad(x)),
        arcsin:  x => fromRad(Math.asin(x)),
        arccos:  x => fromRad(Math.acos(x)),
        arctan:  x => fromRad(Math.atan(x)),
        sinh:    x => Math.sinh(x),
        cosh:    x => Math.cosh(x),
        tanh:    x => Math.tanh(x),
        arcsinh: x => Math.asinh(x),
        arccosh: x => Math.acosh(x),
        arctanh: x => Math.atanh(x),
        sqrt:    x => Math.sqrt(x),
        log:     x => Math.log10(x),
        ln:      x => Math.log(x),
        abs:     x => Math.abs(x),
      };
      if (funcs[name]) {
        pos++; eat('(');
        const arg = parseExpr();
        if (peek().type === ')') pos++;
        return funcs[name](arg);
      }
      throw new Error('Unknown: ' + name);
    }
    throw new Error('Unexpected token: ' + JSON.stringify(tok));
  }

  const val = parseExpr();
  while (peek().type === ')') pos++; // absorb auto-close parens
  return val;
}

/* ── Helpers ── */
let mode = 'deg';
function toRad(x)   { return mode === 'deg' ? x * Math.PI / 180 : x; }
function fromRad(x) { return mode === 'deg' ? x * 180 / Math.PI : x; }
function factorial(n) {
  n = Math.round(n);
  if (n < 0 || n > 170) return NaN;
  let r = 1; for (let i = 2; i <= n; i++) r *= i; return r;
}
function nCr(n, r) {
  n = Math.round(n); r = Math.round(r);
  if (r < 0 || r > n) return NaN;
  return factorial(n) / (factorial(r) * factorial(n - r));
}
function fmt(n) {
  if (typeof n !== 'number' || isNaN(n)) return 'Error';
  if (!isFinite(n)) return n > 0 ? 'Infinity' : '-Infinity';
  if (Math.abs(n) >= 1e12 || (Math.abs(n) < 1e-9 && n !== 0)) return n.toExponential(6);
  return parseFloat(n.toPrecision(12)).toString();
}

/* ════════════════════════════════
   TAB SWITCHING
════════════════════════════════ */
document.querySelectorAll('.tab').forEach(btn => {
  btn.addEventListener('click', () => {
    const t = btn.dataset.tab;
    document.querySelectorAll('.tab').forEach(b => b.classList.toggle('active', b.dataset.tab === t));
    document.querySelectorAll('.pane').forEach(p => p.classList.remove('active'));
    document.getElementById('pane-' + t).classList.add('active');
  });
});

/* ════════════════════════════════
   SCIENTIFIC CALCULATOR
════════════════════════════════ */
let expr = '', result = '0', inv = false, hyp = false, justEvaled = false;

function getFnLabel(fn) {
  if (inv && hyp) return { sin: 'arcsinh', cos: 'arccosh', tan: 'arctanh' }[fn] || fn;
  if (hyp)        return { sin: 'sinh',    cos: 'cosh',    tan: 'tanh'    }[fn] || fn;
  if (inv)        return { sin: 'arcsin',  cos: 'arccos',  tan: 'arctan'  }[fn] || fn;
  return fn;
}

function buildButtons() {
  const grid = document.getElementById('btn-grid');
  grid.innerHTML = '';
  const flat = [
    { l: getFnLabel('sin'),     v: 'sin',    c: 'fn' },
    { l: getFnLabel('cos'),     v: 'cos',    c: 'fn' },
    { l: getFnLabel('tan'),     v: 'tan',    c: 'fn' },
    { l: inv ? '10^x' : 'log', v: inv ? '10pow' : 'log', c: 'fn' },
    { l: inv ? 'eˣ'   : 'ln',  v: inv ? 'epow'  : 'ln',  c: 'fn' },
    { l: '√',   v: 'sqrt', c: 'fn' }, { l: 'x²',  v: 'sq',   c: 'fn' },
    { l: 'xʸ',  v: 'pow',  c: 'fn op' }, { l: 'EXP', v: 'exp',  c: 'fn' },
    { l: 'nCr', v: 'ncr',  c: 'fn' },
    { l: 'π',   v: 'pi',   c: 'fn' }, { l: 'e',   v: 'ec',   c: 'fn' },
    { l: '!',   v: 'fact', c: 'fn' }, { l: '(',   v: '(',    c: 'op' },
    { l: ')',   v: ')',    c: 'op' },
    { l: '7',   v: '7',    c: 'num' }, { l: '8',  v: '8',   c: 'num' },
    { l: '9',   v: '9',    c: 'num' }, { l: '÷',  v: '/',   c: 'op'  },
    { l: 'AC',  v: 'clear', c: 'clr' },
    { l: '4',   v: '4',    c: 'num' }, { l: '5',  v: '5',   c: 'num' },
    { l: '6',   v: '6',    c: 'num' }, { l: '×',  v: '*',   c: 'op'  },
    { l: '⌫',   v: 'back', c: 'clr' },
    { l: '1',   v: '1',    c: 'num' }, { l: '2',  v: '2',   c: 'num' },
    { l: '3',   v: '3',    c: 'num' }, { l: '−',  v: '-',   c: 'op'  },
    { l: '±',   v: 'neg',  c: 'fn'  },
    { l: '%',   v: '%',    c: 'op'  }, { l: '0',  v: '0',   c: 'num' },
    { l: '.',   v: '.',    c: 'num' }, { l: '+',  v: '+',   c: 'op'  },
    { l: '=',   v: 'eq',   c: 'eq'  },
  ];
  flat.forEach(b => {
    const btn = document.createElement('button');
    btn.className = 'btn ' + b.c;
    btn.textContent = b.l;
    if (b.l.length > 5) btn.classList.add('long');
    btn.addEventListener('click', () => handleBtn(b.v));
    grid.appendChild(btn);
  });
}

// DEG / RAD buttons
document.querySelectorAll('[data-mode]').forEach(btn => {
  btn.addEventListener('click', () => {
    mode = btn.dataset.mode;
    document.getElementById('deg-btn').classList.toggle('active', mode === 'deg');
    document.getElementById('rad-btn').classList.toggle('active', mode === 'rad');
  });
});

// INV button
document.getElementById('inv-btn').addEventListener('click', () => {
  inv = !inv;
  document.getElementById('inv-btn').classList.toggle('active', inv);
  buildButtons();
});

// HYP button
document.getElementById('hyp-btn').addEventListener('click', () => {
  hyp = !hyp;
  document.getElementById('hyp-btn').classList.toggle('active', hyp);
  buildButtons();
});

function handleBtn(val) {
  const disp   = document.getElementById('result');
  const exprEl = document.getElementById('expr');

  if (val === 'clear') {
    expr = ''; result = '0'; justEvaled = false;
  } else if (val === 'back') {
    if (justEvaled) { expr = ''; result = '0'; justEvaled = false; }
    else { expr = expr.slice(0, -1); if (!expr) result = '0'; }
  } else if (val === 'eq') {
    exprEl.textContent = expr;
    try { result = fmt(parse(expr)); } catch (e) { result = 'Error'; }
    justEvaled = true;
  } else {
    if (justEvaled && '0123456789.'.includes(val[0])) expr = '';
    justEvaled = false;
    if      (val === 'pi')    expr += 'π';
    else if (val === 'ec')    expr += 'e';
    else if (val === 'sq')    expr += '^2';
    else if (val === 'pow')   expr += '^(';
    else if (val === 'sqrt')  expr += '√(';
    else if (val === 'fact')  expr += '!';
    else if (val === 'ncr')   expr += 'C';
    else if (val === 'exp')   expr += 'E';
    else if (val === 'neg')   { if (expr) expr = '(-(' + expr + '))'; }
    else if (val === '10pow') expr += '10^(';
    else if (val === 'epow')  expr += 'e^(';
    else if (['sin','cos','tan','log','ln'].includes(val)) expr += getFnLabel(val) + '(';
    else expr += val;
    try { const v = parse(expr); if (isFinite(v) && !isNaN(v)) result = fmt(v); } catch (e) {}
  }

  disp.className = 'res' + (result === 'Error' ? ' err' : '');
  disp.textContent = result;
  exprEl.textContent = expr;
}

// Keyboard support (scientific pane only)
document.addEventListener('keydown', e => {
  if (!document.getElementById('pane-sci').classList.contains('active')) return;
  if (e.target.tagName === 'INPUT') return;
  if (e.key >= '0' && e.key <= '9') handleBtn(e.key);
  else if ('.,+-*/()%'.includes(e.key)) handleBtn(e.key);
  else if (e.key === 'Enter' || e.key === '=') handleBtn('eq');
  else if (e.key === 'Backspace') handleBtn('back');
  else if (e.key === 'Escape')    handleBtn('clear');
  else if (e.key === '^')         handleBtn('pow');
});

/* ════════════════════════════════
   COMPLEX CALCULATOR
════════════════════════════════ */
function parseCplx(s) {
  if (!s.trim()) return null;
  s = s.replace(/\s/g, '').replace(/−/g, '-');
  const m = s.match(/^([+-]?[\d.]+)?([+-][\d.]*i|[+-]?[\d.]*i)?$/i);
  if (!m) return null;
  let re = 0, im = 0;
  const rp = m[1], ip = m[2];
  if (rp && !ip) {
    if (/i$/i.test(rp)) { im = parseFloat(rp) || 1; re = 0; }
    else re = parseFloat(rp) || 0;
  } else {
    if (rp) re = parseFloat(rp) || 0;
    if (ip) { const iv = ip.replace(/i$/i, ''); im = iv === '' || iv === '+' ? 1 : iv === '-' ? -1 : parseFloat(iv) || 0; }
  }
  return { re, im };
}
function fmtC(z, prec = 6) {
  const r = +z.re.toPrecision(prec), i = +z.im.toPrecision(prec);
  if (i === 0) return String(r);
  if (r === 0) return (i === 1 ? '' : i === -1 ? '-' : String(i)) + 'i';
  return r + (i >= 0 ? '+' : '') + (i === 1 ? '' : i === -1 ? '-' : String(i)) + 'i';
}
const cAdd  = (a,b) => ({ re: a.re+b.re, im: a.im+b.im });
const cSub  = (a,b) => ({ re: a.re-b.re, im: a.im-b.im });
const cMul  = (a,b) => ({ re: a.re*b.re - a.im*b.im, im: a.re*b.im + a.im*b.re });
const cDiv  = (a,b) => { const d = b.re*b.re+b.im*b.im; if (!d) return null; return { re:(a.re*b.re+a.im*b.im)/d, im:(a.im*b.re-a.re*b.im)/d }; };
const cAbs  = z => Math.sqrt(z.re*z.re+z.im*z.im);
const cArg  = z => Math.atan2(z.im, z.re);
const cExp  = z => { const e = Math.exp(z.re); return { re: e*Math.cos(z.im), im: e*Math.sin(z.im) }; };
const cLn   = z => ({ re: Math.log(cAbs(z)), im: cArg(z) });
const cSqrt = z => { const r=cAbs(z), th=cArg(z), sr=Math.sqrt(r); return { re: sr*Math.cos(th/2), im: sr*Math.sin(th/2) }; };
const cPow  = (z,n) => { const r=cAbs(z), th=cArg(z); const rn=Math.pow(r,n.re)*Math.exp(-n.im*th); const ang=n.re*th+n.im*Math.log(r||1e-300); return { re: rn*Math.cos(ang), im: rn*Math.sin(ang) }; };
const cSin  = z => ({ re: Math.sin(z.re)*Math.cosh(z.im), im: Math.cos(z.re)*Math.sinh(z.im) });
const cCos  = z => ({ re: Math.cos(z.re)*Math.cosh(z.im), im: -Math.sin(z.re)*Math.sinh(z.im) });
const cTan  = z => { const c=cCos(z); return (c.re||c.im) ? cDiv(cSin(z),c) : null; };

let cplxOp = '+', activeCplxOpBtn = null;

// Initialise + as active op
(function () {
  const firstOp = document.querySelector('[data-cplx-op="+"]');
  if (firstOp) { firstOp.classList.add('active-op'); activeCplxOpBtn = firstOp; }
})();

document.getElementById('cplx-op-row').addEventListener('click', e => {
  const btn = e.target.closest('[data-cplx-op]');
  if (!btn) return;
  cplxOp = btn.dataset.cplxOp;
  if (activeCplxOpBtn) activeCplxOpBtn.classList.remove('active-op');
  btn.classList.add('active-op');
  activeCplxOpBtn = btn;
  cplxCalc();
});

document.getElementById('cplx-unary-row').addEventListener('click', e => {
  const btn = e.target.closest('[data-cplx-unary]');
  if (!btn) return;
  cplxUnary(btn.dataset.cplxUnary);
});

document.getElementById('cplx-clear').addEventListener('click', clearCplx);
document.getElementById('ca').addEventListener('input', cplxCalc);
document.getElementById('cb').addEventListener('input', cplxCalc);

function cplxCalc() {
  const a = parseCplx(document.getElementById('ca').value);
  const b = parseCplx(document.getElementById('cb').value);
  if (!a) { document.getElementById('cplx-disp').textContent = '—'; document.getElementById('cplx-result').style.display = 'none'; return; }
  let res = null;
  if (b) {
    if      (cplxOp === '+')   res = cAdd(a, b);
    else if (cplxOp === '-')   res = cSub(a, b);
    else if (cplxOp === '*')   res = cMul(a, b);
    else if (cplxOp === '/')   res = cDiv(a, b);
    else if (cplxOp === 'pow') res = cPow(a, b);
  }
  if (res) showCplxResult(res);
}

function cplxUnary(op) {
  const a = parseCplx(document.getElementById('ca').value);
  if (!a) return;
  let res = null;
  if      (op === 'conj') res = { re: a.re, im: -a.im };
  else if (op === 'abs' || op === 'arg') { showCplxMeta(a); return; }
  else if (op === 'sqrt') res = cSqrt(a);
  else if (op === 'sq')   res = cMul(a, a);
  else if (op === 'inv')  res = cDiv({ re: 1, im: 0 }, a);
  else if (op === 'exp')  res = cExp(a);
  else if (op === 'ln')   res = cLn(a);
  else if (op === 'sin')  res = cSin(a);
  else if (op === 'cos')  res = cCos(a);
  else if (op === 'tan')  res = cTan(a);
  if (res) showCplxResult(res);
}

function cRow(label, val) {
  return `<div class="cplx-row"><span class="cplx-lbl">${label}</span><span class="cplx-val">${val}</span></div>`;
}
function showCplxResult(z) {
  const abs = cAbs(z), arg = cArg(z);
  document.getElementById('cplx-disp').textContent = fmtC(z);
  const r = document.getElementById('cplx-result');
  r.style.display = 'block';
  r.innerHTML = cRow('Rectangular', fmtC(z))
    + cRow('Modulus |z|',    +abs.toPrecision(8))
    + cRow('Argument (rad)', +arg.toPrecision(8))
    + cRow('Argument (deg)', +(arg * 180 / Math.PI).toPrecision(8) + '°')
    + cRow('Polar',          +abs.toPrecision(6) + ' ∠ ' + +(arg * 180 / Math.PI).toPrecision(6) + '°');
}
function showCplxMeta(z) {
  const abs = cAbs(z), arg = cArg(z);
  document.getElementById('cplx-disp').textContent = '|z| = ' + +abs.toPrecision(6);
  const r = document.getElementById('cplx-result');
  r.style.display = 'block';
  r.innerHTML = cRow('Modulus |z|',    +abs.toPrecision(8))
    + cRow('Argument (rad)', +arg.toPrecision(8))
    + cRow('Argument (deg)', +(arg * 180 / Math.PI).toPrecision(8) + '°');
}
function clearCplx() {
  document.getElementById('ca').value = '';
  document.getElementById('cb').value = '';
  document.getElementById('cplx-disp').textContent = '—';
  document.getElementById('cplx-result').style.display = 'none';
}

/* ════════════════════════════════
   BASE CONVERSION
════════════════════════════════ */
function buildBasePad() {
  const hexPad = document.getElementById('hex-pad');
  hexPad.innerHTML = '';
  ['A','B','C','D','E','F'].forEach(h => {
    const b = document.createElement('button');
    b.className = 'btn fn'; b.textContent = h; b.id = 'hbtn-' + h;
    b.addEventListener('click', () => {
      document.getElementById('base-input').value += h;
      baseConvert();
    });
    hexPad.appendChild(b);
  });

  const numpad = document.getElementById('base-numpad');
  numpad.innerHTML = '';
  ['7','8','9','AC','4','5','6','⌫','1','2','3','0'].forEach(k => {
    const b = document.createElement('button');
    b.className = 'btn ' + (k === 'AC' || k === '⌫' ? 'clr' : 'num');
    b.textContent = k;
    b.addEventListener('click', () => {
      const inp = document.getElementById('base-input');
      if      (k === 'AC') { inp.value = ''; document.getElementById('base-result').style.display = 'none'; document.getElementById('base-disp').textContent = '—'; }
      else if (k === '⌫')  { inp.value = inp.value.slice(0, -1); baseConvert(); }
      else                 { inp.value += k; baseConvert(); }
    });
    numpad.appendChild(b);
  });
  updateHexButtons();
}

function updateHexButtons() {
  const fb = parseInt(document.getElementById('from-base').value);
  ['A','B','C','D','E','F'].forEach(h => {
    const b = document.getElementById('hbtn-' + h);
    if (b) b.disabled = fb < 16;
  });
  document.querySelectorAll('#base-numpad .btn.num').forEach(b => {
    b.disabled = +b.textContent >= fb;
  });
}

function baseConvert() {
  const raw = document.getElementById('base-input').value.trim().toUpperCase();
  const fb  = parseInt(document.getElementById('from-base').value);
  if (!raw) { document.getElementById('base-result').style.display = 'none'; document.getElementById('base-disp').textContent = '—'; return; }
  const dec = parseInt(raw, fb);
  if (isNaN(dec)) { document.getElementById('base-disp').textContent = 'Invalid'; return; }
  document.getElementById('base-disp').textContent = raw + '  (base ' + fb + ')';
  const r = document.getElementById('base-result');
  r.style.display = 'block';
  r.innerHTML = [
    { b: 2,  l: 'Binary (2)'   },
    { b: 8,  l: 'Octal (8)'    },
    { b: 10, l: 'Decimal (10)' },
    { b: 16, l: 'Hex (16)'     },
  ].map(({ b, l }) =>
    `<div class="conv-row"><span class="conv-base">${l}</span><span class="conv-val">${dec.toString(b).toUpperCase()}</span></div>`
  ).join('');
}

document.getElementById('base-input').addEventListener('input', baseConvert);
document.getElementById('from-base').addEventListener('change', () => { updateHexButtons(); baseConvert(); });

/* ── Init ── */
buildButtons();
buildBasePad();


/* ── Theme toggle ── */
(function () {
  const root = document.documentElement;
  const btn  = document.getElementById('theme-btn');
  const meta = document.getElementById('theme-color');
  const mq   = window.matchMedia('(prefers-color-scheme: dark)');
  const isDark = () => root.getAttribute('data-theme')
    ? root.getAttribute('data-theme') === 'dark' : mq.matches;
  function paint() {
    btn.textContent = isDark() ? '☀' : '☾';
    if (meta) meta.setAttribute('content', isDark() ? '#1e1e1c' : '#ffffff');
  }
  btn.addEventListener('click', () => {
    const next = isDark() ? 'light' : 'dark';
    root.setAttribute('data-theme', next);
    try { localStorage.setItem('theme', next); } catch (e) {}
    paint();
  });
  mq.addEventListener('change', paint);
  paint();
})();

/* ── PWA: service worker ── */
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  });
}
