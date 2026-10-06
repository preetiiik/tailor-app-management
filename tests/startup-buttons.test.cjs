const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const sourceDir = process.argv[2] || path.resolve(__dirname, '..');
const listeners = {};
const elements = new Map();
const element = () => ({innerHTML:'',textContent:'',dataset:{},classList:{add(){},remove(){},toggle(){}},querySelectorAll(){return []},querySelector(){return null},setAttribute(){},focus(){},addEventListener(){}});
const get = selector => {
  if (selector === '.wizard-shell' || selector === '#paymentSummary') return null;
  if (!elements.has(selector)) elements.set(selector, element());
  return elements.get(selector);
};
const context = vm.createContext({
  console:{log(){},error(){}}, Date, Number, String, Object, Array, Set, JSON, Math, Blob, URL,
  setTimeout(){}, clearTimeout(){},
  fetch:async () => {throw new Error('Backend unavailable');},
  localStorage:{getItem(){return null;},setItem(){}},
  document:{documentElement:element(),body:element(),querySelector:get,querySelectorAll:()=>[],getElementById:get,
    addEventListener(type,fn){(listeners[type]??=[]).push(fn);}},
  window:{print(){},matchMedia:()=>({matches:true})}
});
for (const file of ['app.js','interactions.js','ui.js']) {
  vm.runInContext(fs.readFileSync(path.join(sourceDir,file),'utf8'),context,{filename:file});
}
const run = code => vm.runInContext(code,context);
async function click(dataset) {
  const button = {dataset};
  const target = {classList:{contains:()=>false},closest(selector){
    if (selector === '[data-view]' && dataset.view) return button;
    if (selector === '[data-action]' && dataset.action) return button;
    if (selector === '[data-action="new-order"]' && dataset.action === 'new-order') return button;
    return null;
  }};
  for (const handler of listeners.click || []) await handler({target});
}
async function verifyButtons() {
  for (const view of ['dashboard','orders','customers','measurements','production','products','staff','payments','reports','settings']) {
    await click({view});
    assert.equal(run('state.view'),view);
    assert.ok(get('#content').innerHTML.length > 100,`${view} renders without backend data`);
  }
  await click({action:'new-order'});
  assert.equal(run('state.view'),'wizard');
  assert.match(get('#content').innerHTML,/Select Customer/);
  await click({action:'add-customer'});
  assert.match(get('#modalRoot').innerHTML,/data-form="customer"/);
  await click({action:'close-dialog'});
  assert.equal(get('#modalRoot').innerHTML,'');
}
(async () => {
  await verifyButtons();
  await run('initialiseApp()');
  await verifyButtons();
  console.log('Passed: navigation, New Order, customer dialog and close buttons before loading and after backend failure.');
})().catch(error => {console.error(error);process.exitCode=1;});
