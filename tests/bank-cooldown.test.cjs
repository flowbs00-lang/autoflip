const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const html = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');
const bank = html.match(/<script>\s*(\/\/ V7\.9 — AutoBank[\s\S]*?)<\/script>/)[1];
function game(saved) {
  let now = 450, output = '', persisted, tick;
  const ctx = {
    state: saved || { money: 100000, loan: 0 },
    getGameTotal: () => now,
    money: String, status: () => '', head: () => '',
    render: value => { output = value; },
    persist: () => { persisted = JSON.parse(JSON.stringify(ctx.state)); },
    alert: () => {}, setTimeout: fn => fn(),
    setInterval: fn => { tick = fn; },
    document: { querySelector: () => null }
  };
  ctx.window = ctx;
  vm.createContext(ctx);
  vm.runInContext(bank, ctx);
  return { ctx, time: n => { now = n; }, html: () => output, saved: () => persisted, tick: () => tick() };
}

test('first loan, successful repayment, all entry points blocked until exact 48-hour boundary', () => {
  const g = game(), c = g.ctx;
  c.bankIssueLoan(25000);
  assert.equal(c.state.loan, 27500);
  c.bankPayLoan();
  const balance = c.state.money;
  assert.equal(c.state.bankCustomer.nextLoanAt, 450 + 2880);
  assert.match(g.html(), /48 игровых часов/);
  assert.match(g.html(), /onclick="autoBankHome\(\)">Вернуться в банк/);
  c.autoBankHome();
  assert.match(g.html(), /Выдача временно недоступна/);
  c.bankCredits();
  assert.equal((g.html().match(/class="bank-credit-option [^"]*" disabled/g) || []).length, 5);
  for (const fn of ['bankLoanPreview', 'bankIssueLoan', 'takeLoan']) {
    c[fn](25000);
    assert.equal(c.state.loan, 0);
    assert.equal(c.state.money, balance);
  }
  const deadline = c.state.bankCustomer.nextLoanAt;
  c.payLoan(); // Repeated repayment must not extend the cooldown.
  assert.equal(c.state.bankCustomer.nextLoanAt, deadline);
  g.time(deadline - 1);
  c.bankIssueLoan(25000);
  assert.equal(c.state.loan, 0);
  assert.match(g.html(), /0 ч\. 01 мин\./);
  g.time(deadline);
  c.bankIssueLoan(25000);
  assert.equal(c.state.loan, 27500);
  assert.equal(c.state.money, balance + 25000);
});

test('cooldown survives saving and reloading', () => {
  const g = game();
  g.ctx.bankIssueLoan(25000);
  g.ctx.bankPayLoan();
  const restored = game(g.saved());
  restored.ctx.bankIssueLoan(25000);
  assert.equal(restored.ctx.state.loan, 0);
  assert.equal(restored.ctx.state.bankCustomer.nextLoanAt, 3330);
});

test('late repayment starts the same cooldown; insufficient funds do not start it', () => {
  const g = game(), c = g.ctx;
  c.bankIssueLoan(25000);
  c.state.money = 0;
  c.bankPayLoan();
  assert.equal(c.state.loan, 27500);
  assert.equal(c.state.bankCustomer.nextLoanAt, 0);
  g.time(c.state.bankCredit.dueAt + 60);
  c.state.money = 100000;
  c.bankPayLoan();
  assert.equal(c.state.loan, 0);
  assert.equal(c.state.bankCustomer.nextLoanAt, 450 + 10080 + 60 + 2880);
  c.bankIssueLoan(25000);
  assert.equal(c.state.loan, 0);
});

test('older saves migrate repayment history without blocking new players', () => {
  for (const type of ['paid', 'late-paid']) {
    const g = game({ money: 100000, loan: 0, bankCustomer: { history: [{type, at: 0}] } });
    assert.equal(g.ctx.state.bankCustomer.nextLoanAt, 2880);
    g.ctx.bankIssueLoan(25000);
    assert.equal(g.ctx.state.loan, 0);
    g.time(2880);
    g.ctx.bankIssueLoan(25000);
    assert.equal(g.ctx.state.loan, 27500);
  }
});

test('open credit list refreshes and unlocks when countdown expires', () => {
  const g = game(), c = g.ctx;
  c.bankIssueLoan(25000);
  c.bankPayLoan();
  c.bankCredits();
  const text = {};
  c.document.querySelector = () => ({ querySelector: () => text, getAttribute: () => 'credits' });
  g.time(3329);
  g.tick();
  assert.equal(text.textContent, '0 ч. 01 мин.');
  g.time(3330);
  g.tick();
  assert.match(g.html(), /onclick="bankLoanPreview\(25000\)"/);
  assert.doesNotMatch(g.html(), /data-bank-cooldown/);
});

test('bank clock uses the public live game-time bridge used by the browser', () => {
  assert.match(bank, /window\.getGameTotal/);
  const g = game(), c = g.ctx;
  c.bankIssueLoan(25000);
  c.bankPayLoan();
  c.bankCredits();
  const text = {};
  c.document.querySelector = () => ({ querySelector: () => text, getAttribute: () => 'credits' });
  g.time(510);
  g.tick();
  assert.equal(text.textContent, '47 ч. 00 мин.');
});
