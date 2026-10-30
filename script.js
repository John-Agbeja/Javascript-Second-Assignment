'use strict';

// Standard-calculator arithmetic is evaluated from left to right.
let entry = '0';
let stored = null;
let operator = null;
let freshEntry = true;
let expression = '';
let memory = null;
let lastOperator = null;
let lastOperand = null;
const calculations = [];
const $ = (selector) => document.querySelector(selector);

function render() {
  $('#result').textContent = entry;
  $('#expression').textContent = expression || '\u00a0';
  $('[data-action="mc"]').disabled = memory === null;
  $('[data-action="mr"]').disabled = memory === null;
  $('#memory-value').textContent = memory === null ? 'Memory is empty.' : `Memory: ${memory}`;
}
function reset() {
  entry = '0'; stored = null; operator = null; expression = '';
  freshEntry = true; lastOperator = null; lastOperand = null;
}
function format(value) {
  if (!Number.isFinite(value)) throw new Error('Cannot divide by zero or use this value');
  return String(Number(value.toPrecision(12)));
}
function calculate(a, op, b) {
  if (op === '+') return a + b;
  if (op === '−') return a - b;
  if (op === '×') return a * b;
  if (op === '÷') return a / b;
  return b;
}
function inputNumber(value) {
  if (entry === 'Error') reset();
  if (freshEntry) {
    entry = value === '.' ? '0.' : value;
    freshEntry = false;
    if (!operator) { expression = ''; lastOperator = null; lastOperand = null; }
    return;
  }
  if (value === '.' && entry.includes('.')) return;
  if (entry.replace(/[-.]/g, '').length >= 12) return;
  entry = entry === '0' && value !== '.' ? value : entry + value;
}
function chooseOperator(next) {
  if (entry === 'Error') return;
  if (operator && !freshEntry) entry = format(calculate(stored, operator, Number(entry)));
  stored = Number(entry); operator = next;
  expression = `${entry} ${next}`; freshEntry = true;
  lastOperator = null;
}
function equals() {
  if (entry === 'Error') return;
  const op = operator || lastOperator;
  if (!op) return;
  const a = operator ? stored : Number(entry);
  const b = operator ? Number(entry) : lastOperand;
  entry = format(calculate(a, op, b));
  expression = `${a} ${op} ${b} =`;
  calculations.unshift(`${expression} ${entry}`);
  calculations.splice(50);
  showHistory();
  lastOperator = op; lastOperand = b;
  operator = null; stored = null; freshEntry = true;
}
function showHistory() {
  const list = $('#history-list');
  list.replaceChildren();
  for (const calculation of calculations.length ? calculations : ['No calculations yet.']) {
    const item = document.createElement('li');
    item.textContent = calculation;
    list.append(item);
  }
}
function action(name) {
  // Window controls affect this calculator card, not the browser window.
  if (name === 'minimize') { $('.body').hidden = !$('.body').hidden; return; }
  if (name === 'maximize') { $('.calculator').classList.toggle('large'); return; }
  if (name === 'close') { $('.calculator').hidden = true; $('#reopen').hidden = false; return; }
  const panels = { help: '#help', history: '#history', memory: '#memory-value' };
  if (panels[name]) { const panel = $(panels[name]); panel.hidden = !panel.hidden; return; }
  if (name === 'clear-history') { calculations.length = 0; showHistory(); return; }
  if (name === 'clear') { reset(); return; }
  if (name === 'ce') { entry = '0'; freshEntry = true; if (!operator) expression = ''; return; }
  if (name === 'mc') { memory = null; return; }
  if (name === 'mr' && memory !== null) { entry = String(memory); freshEntry = true; if (!operator) expression = ''; return; }
  if (entry === 'Error') return;
  const value = Number(entry);
  if (name === 'equals') { equals(); return; }
  if (name === 'backspace' && !freshEntry) { entry = entry.slice(0, -1); if (!entry || entry === '-') entry = '0'; }
  if (name === 'sign' && value !== 0) entry = entry.startsWith('-') ? entry.slice(1) : '-' + entry;
  if (name === 'ms') memory = value;
  if (name === 'mplus') memory = Number(format((memory ?? 0) + value));
  if (name === 'mminus') memory = Number(format((memory ?? 0) - value));
  if (['square', 'sqrt', 'reciprocal', 'percent'].includes(name)) {
    let result;
    if (name === 'square') result = value * value;
    if (name === 'sqrt') result = Math.sqrt(value);
    if (name === 'reciprocal') result = 1 / value;
    if (name === 'percent') result = operator === '+' || operator === '−' ? stored * value / 100 : value / 100;
    entry = format(result);
    if (!operator) expression = { square: `sqr(${value})`, sqrt: `√(${value})`, reciprocal: `1/(${value})`, percent: `${value}%` }[name];
    freshEntry = true;
  }
}
function run(callback) {
  try { callback(); }
  catch (error) { reset(); entry = 'Error'; expression = error.message; }
  render();
}
document.addEventListener('click', (event) => {
  const button = event.target.closest('button');
  if (!button || button.disabled) return;
  run(() => {
    if (button.dataset.number !== undefined) inputNumber(button.dataset.number);
    else if (button.dataset.operator) chooseOperator(button.dataset.operator);
    else if (button.dataset.action) action(button.dataset.action);
  });
});
$('#reopen').addEventListener('click', () => {
  $('.calculator').hidden = false; $('.body').hidden = false; $('#reopen').hidden = true;
});
document.addEventListener('keydown', (event) => {
  if (event.ctrlKey || event.metaKey || event.altKey || $('.calculator').hidden || $('.body').hidden) return;
  // Let Enter activate a focused button normally.
  if (event.key === 'Enter' && event.target.tagName === 'BUTTON') return;
  const operators = { '+': '+', '-': '−', '*': '×', '/': '÷' };
  const actions = { Enter: 'equals', '=': 'equals', Escape: 'clear', Delete: 'ce', Backspace: 'backspace', '%': 'percent' };
  if (/^[0-9.]$/.test(event.key)) { event.preventDefault(); run(() => inputNumber(event.key)); }
  else if (operators[event.key]) { event.preventDefault(); run(() => chooseOperator(operators[event.key])); }
  else if (actions[event.key]) { event.preventDefault(); run(() => action(actions[event.key])); }
});
render();
