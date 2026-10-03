const vm=require('node:vm');
const fs=require('node:fs');
const assert=require('node:assert/strict');
const listeners={};
const elements={};
function element(){return {innerHTML:'',textContent:'',dataset:{},classList:{add(){},remove(){},toggle(){}},querySelector(){return {focus(){}}},querySelectorAll(){return []},focus(){}};}
const storage=new Map();
function context(){return vm.createContext({console,Date,Number,String,Object,Array,Set,JSON,Math,Blob,URL,setTimeout:()=>0,clearTimeout(){},localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)},document:{activeElement:null,body:element(),querySelector(s){if(s==='#paymentSummary')return null;return elements[s]??=element();},querySelectorAll(){return []},addEventListener(type,fn){(listeners[type]??=[]).push(fn);},getElementById(){return null}},window:{print(){}},FormData:class{constructor(form){return Object.entries(form.values);}}});}
const c=context();
for(const file of ['app.js','interactions.js'])vm.runInContext(fs.readFileSync(file,'utf8'),c,{filename:file});
function run(code){return vm.runInContext(code,c);}
for(const view of ['dashboard','orders','customers','measurements','production','products','staff','reports','settings']){
 run(`state.view='${view}';render()`);
 assert.ok(elements['#content'].innerHTML.length>100,view+' renders');
}
run(`openWizard();state.orderDraft.customer=state.customers[0];state.orderDraft.garment='Shirt';state.orderDraft.qty=2;state.orderDraft.price=1800;state.orderDraft.discount=100;state.orderDraft.advance=800;state.orderDraft.measurements={Chest:41};state.orderDraft.delivery='2026-12-20';state.orderDraft.trial='2026-12-18';state.wizardStep=6;nextWizard()`);
assert.equal(run('state.orders[0].total'),3500);
assert.equal(run('state.orders[0].deliveryDate'),'2026-12-20');
assert.equal(run('state.orders[0].measurements.Chest'),41);
assert.equal(run('state.wizardStep'),7);
const first=run('state.orders[0].no');
run(`state.wizardStep=6;nextWizard()`);
assert.notEqual(run('state.orders[0].no'),first,'unique order numbers');
run(`state.wizardStep=5;state.orderDraft.advance=10000;nextWizard()`);
assert.equal(run('state.wizardStep'),5,'reject overpayment');
run(`state.wizardStep=4;state.orderDraft.trial='2026-12-25';nextWizard()`);
assert.equal(run('state.wizardStep'),4,'reject reversed dates');
run(`state.products[0].name='<img src=x onerror=alert(1)>';state.view='products';render()`);
assert.ok(!elements['#content'].innerHTML.includes('<img src=x'),'escape saved values');
function submit(kind,id,values){const err={textContent:''};const form={dataset:{form:kind,id},values,reportValidity:()=>true,querySelector:()=>err};for(const fn of listeners.submit)fn({target:form,preventDefault(){}});return err.textContent;}
run(`state.view='customers'`);
assert.equal(submit('customer','',{name:'Test Customer',phone:'9123456789',city:'Pune',alternate:'',address:'Test Address'}),'');
assert.equal(run("state.customers.find(c=>c.phone==='9123456789').address"),'Test Address');
assert.match(submit('customer','',{name:'Duplicate',phone:'9123456789',city:'Pune'}),/already/);
assert.equal(submit('product','',{name:'Waistcoat',type:'Top',price:'2400',styles:'Fit: Slim, Regular'}),'');
assert.equal(run("state.products.find(p=>p.name==='Waistcoat').price"),2400);
assert.match(submit('product','',{name:'Bad',type:'Top',price:'10',styles:'Invalid style text'}),/groups/);
assert.equal(submit('staff','',{name:'New Tailor',role:'Tailor',phone:'9234567890'}),'');
assert.ok(run("state.staff.some(s=>s.name==='New Tailor')"));
assert.equal(submit('measurement','',{customerId:'1',garment:'Pant',profile:'Test Fit',notes:'Saved note',measure_Waist:'34',measure_Seat:'40',measure_Thigh:'24',measure_Knee:'18',measure_Bottom:'16',measure_Outseam:'40',measure_Inseam:'30'}),'');
assert.equal(run("state.measurements.find(m=>m.profile==='Test Fit').values.Waist"),34);
assert.equal(submit('settings','',{name:'Test Store',phone:'9876543210',prefix:'mt',days:'7',address:'Pune'}),'');
assert.equal(run('state.settings.prefix'),'MT');
const snapshot=JSON.parse(storage.get('malani-tailor-v1'));
assert.equal(run("followUpDate(1,'2026-12-31')"),'2027-01-01');
assert.equal(run("followUpDate(1,'2026-02-28')"),'2026-03-01');
run(`state.orders=[
 {no:'F1',customer:'Today Customer',items:'Shirt',staff:'Tailor',status:'Trial',trial:'2026-10-02',deliveryDate:'2026-10-03',total:100,advance:20},
 {no:'F2',customer:'Delivered Customer',items:'Pant',staff:'Tailor',status:'Delivered',trial:'2026-10-02',deliveryDate:'2026-10-02',total:100,advance:100},
 {no:'F3',customer:'Ready Customer',items:'Suit',staff:'Tailor',status:'Ready',trial:'2026-10-02',deliveryDate:'2026-10-02',total:100,advance:0}
];`);
assert.equal(run("followUpsFor('2026-10-02').length"),2);
assert.equal(run("followUpsFor('2026-10-03')[0].type"),'Delivery');
assert.ok(run("followUpPanel('Today', '2026-10-02').includes('Reschedule')"));
assert.ok(run("followUpPanel('Tomorrow', '2026-10-04').includes('No follow-ups scheduled')"));
console.log('Passed: follow-up dates, year/month rollover, trial and delivery grouping, delivered exclusion, rescheduling actions and empty states.');
assert.ok(snapshot.customers.some(c=>c.phone==='9123456789'));
const reload=context();for(const file of ['app.js','interactions.js'])vm.runInContext(fs.readFileSync(file,'utf8'),reload);
assert.equal(vm.runInContext('state.settings.name',reload),'Test Store');
assert.ok(vm.runInContext("state.products.some(p=>p.name==='Waistcoat')",reload));
console.log('Passed: all screens, customer/product/staff/measurement/settings forms, validation, order totals, dates, unique IDs, escaping, persistence and reload.');
