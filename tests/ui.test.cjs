const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const elements = new Map();
const storage = new Map();
const capturedListeners = {};
const element = () => ({innerHTML:'',textContent:'',dataset:{},classList:{add(){},remove(){},toggle(){}},querySelectorAll(){return []},querySelector(){return {focus(){}}},setAttribute(key,value){this[key]=value},addEventListener(type,fn){this[type]=fn}});
const get = key => {if (!elements.has(key)) elements.set(key,element());return elements.get(key)};
const context = vm.createContext({console,Date,Number,String,Object,Array,Set,JSON,Math,Blob,URL,setTimeout:()=>0,clearTimeout(){},localStorage:{getItem:key=>storage.get(key),setItem:(key,value)=>storage.set(key,value)},document:{documentElement:element(),body:element(),querySelector:get,querySelectorAll:()=>[],getElementById:get,addEventListener(type,fn,capture){if(capture)(capturedListeners[type]??=[]).push(fn)}},window:{print(){}}});
for (const file of ['app.js','interactions.js','ui.js']) {
  vm.runInContext(fs.readFileSync(file,'utf8').replace(/initialiseApp\(\);\s*$/, ''),context,{filename:file});
}
const run = source => vm.runInContext(source,context);
for (const view of ['dashboard','orders','customers','measurements','production','products','staff','payments','reports','settings']) {
  run(`state.view='${view}';render()`);
  assert.ok(get('#content').innerHTML.length > 100, `${view} renders`);
}
assert.equal(run('document.documentElement.dataset.theme'),'light');
get('themeToggle').click();
assert.equal(run('document.documentElement.dataset.theme'),'dark');
assert.equal(storage.get('tailor-ui-theme'),'dark');
get('themeToggle').click();
assert.equal(run('document.documentElement.dataset.theme'),'light');
assert.match(run('dashboard()'), /aria-label="Cutting: 0, Stitching: 0, Trial: 0, Ready: 0, Delivered: 0"/);
run(`state.orders=[{id:1,no:'T1',status:'Ready',customer:'A',items:'Shirt',total:1000,advance:300,deliveryDate:todayISO()}]`);
const html = run('dashboard()');
assert.match(html,/Ready: 1/);
assert.ok(html.includes(run('money(300)')),'collection total');
assert.ok(html.includes(run('money(700)')),'outstanding balance');
assert.match(html,/class="activity-column"><span>1<\/span>/,'current delivery month');
assert.match(html,/Recent Orders/,'existing dashboard remains');
assert.match(html,/Today's/,'follow-up workflow remains');
assert.equal(run('state.orders.length'),1,'presentation does not alter orders');
function select(optionCount, attributes = {}) {
  return {size:0,options:Array(optionCount).fill({}),value:'original',classList:{add(){},remove(){}},closest(){return this},focus(){this.focused=true},getAttribute(key){return attributes[key]??null},setAttribute(key,value){attributes[key]=value;if(key==='size')this.size=Number(value)},removeAttribute(key){delete attributes[key];if(key==='size')this.size=0}};
}
function fire(type, target, key) {
  const event={target,key,preventDefault(){this.prevented=true}};
  for(const listener of capturedListeners[type]||[])listener(event);
  return event;
}
const garment=select(2);
assert.ok(fire('pointerdown',garment).prevented,'native popup suppressed');
assert.equal(garment.size,2,'two options expand in layout');
assert.ok(garment.focused);
garment.value='Pant';
fire('change',garment);
assert.equal(garment.size,0,'selection closes list');
assert.equal(garment.value,'Pant','chosen value preserved for application change handlers');
fire('keydown',garment,'Enter');
assert.equal(garment.size,2,'keyboard opens list');
fire('keydown',garment,'Escape');
assert.equal(garment.size,0,'escape closes list');
const staff=select(20,{size:'1'});
staff.size=1;
fire('pointerdown',staff);
assert.equal(staff.size,8,'large lists bounded');
fire('pointerdown',garment);
assert.equal(staff.size,1,'switching controls restores original size');
fire('pointerdown',{closest:()=>null});
assert.equal(garment.size,0,'outside click closes');
fire('pointerdown',garment);
fire('focusout',garment);
assert.equal(garment.size,0,'leaving field closes');
garment.disabled=true;
assert.ok(!fire('pointerdown',garment).prevented,'disabled fields remain disabled');
assert.equal(garment.size,0);
console.log('Passed: views, themes, chart totals, workflows, in-flow dropdown selection, keyboard, outside click, focus and disabled controls.');
