const STAGES = [
  { id: 'lead', label: 'New inquiry' },
  { id: 'qualified', label: 'In conversation' },
  { id: 'proposal', label: 'Proposal sent' },
  { id: 'won', label: 'Confirmed' }
];

const seedDeals = [
  {id:1,title:'Brand site refresh',company:'Morrow House',contact:'Lena Ortiz',email:'lena@morrowhouse.co',value:12500,stage:'lead',category:'Website',date:'2026-11-04',notes:'Boutique hospitality group opening a second location.'},
  {id:2,title:'Membership platform',company:'Common Ground',contact:'Alex Chen',email:'alex@commonground.studio',value:28000,stage:'lead',category:'Platform',date:'2026-11-12',notes:'Member portal, events and recurring payments.'},
  {id:3,title:'Editorial storefront',company:'Atelier Sol',contact:'Nora Patel',email:'nora@ateliersol.com',value:16400,stage:'lead',category:'E-commerce',date:'2026-11-09',notes:'A considered shopping experience for independent objects.'},
  {id:4,title:'Client portal',company:'Tide & Table',contact:'Maya Brooks',email:'maya@tideandtable.com',value:21500,stage:'qualified',category:'Platform',date:'2026-10-29',notes:'Proposal workshop scheduled with operations team.'},
  {id:5,title:'Digital flagship',company:'Forma Objects',contact:'Theo Kim',email:'theo@formaobjects.co',value:34200,stage:'qualified',category:'Website',date:'2026-11-18',notes:'Architecture led web presence and project archive.'},
  {id:6,title:'Product landing suite',company:'Leeward',contact:'Amir Haddad',email:'amir@leeward.io',value:9800,stage:'qualified',category:'Website',date:'2026-11-02',notes:'Three campaign pages with a shared component system.'},
  {id:7,title:'Operations dashboard',company:'Walnut Works',contact:'Ella Reed',email:'ella@walnutworks.com',value:41000,stage:'proposal',category:'CRM',date:'2026-10-31',notes:'Internal workflow to track vendors and deliverables.'},
  {id:8,title:'Online collection',company:'Soft Geometry',contact:'Iris Laurent',email:'iris@softgeometry.com',value:18700,stage:'proposal',category:'E-commerce',date:'2026-11-07',notes:'Scope and timeline sent. Waiting on stakeholder review.'},
  {id:9,title:'Booking experience',company:'The Still Room',contact:'Sam Okafor',email:'sam@stillroom.com',value:14800,stage:'proposal',category:'Platform',date:'2026-11-15',notes:'Service flow, availability and payments.'},
  {id:10,title:'Studio website',company:'Pastel Office',contact:'Riley Park',email:'riley@pasteloffice.com',value:15200,stage:'won',category:'Website',date:'2026-10-24',notes:'Kickoff booked. Discovery documents shared.'},
  {id:11,title:'Sales workspace',company:'Good People Co.',contact:'Jordan Bell',email:'jordan@goodpeople.co',value:36700,stage:'won',category:'CRM',date:'2026-10-28',notes:'Build begins after onboarding.'},
  {id:12,title:'Collection archive',company:'Oblique Studio',contact:'Ada Novak',email:'ada@obliquestudio.com',value:11700,stage:'won',category:'Website',date:'2026-11-03',notes:'Content handoff in progress.'}
];

const els = {
  view: document.querySelector('#view'), breadcrumb: document.querySelector('#breadcrumb'),
  overlay: document.querySelector('#overlay'), drawer: document.querySelector('#drawer'),
  modal: document.querySelector('#modal'), toast: document.querySelector('#toast')
};
const load = (key, fallback) => { try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; } };
let deals = load('northline-deals-v1', seedDeals);
let activities = load('northline-activities-v1', [
  { text:'Pastel Office moved to Confirmed', time:'Today, 9:24 AM', type:'move' },
  { text:'Proposal sent to Walnut Works', time:'Yesterday, 3:42 PM', type:'proposal' },
  { text:'New inquiry from Morrow House', time:'Yesterday, 11:08 AM', type:'new' },
  { text:'Call with Forma Objects completed', time:'Oct 18, 2:15 PM', type:'call' },
  { text:'Good People Co. moved to Confirmed', time:'Oct 17, 4:30 PM', type:'move' },
  { text:'New inquiry from Common Ground', time:'Oct 16, 10:11 AM', type:'new' }
]);
let view = 'overview';
let query = '';
let category = 'all';
let activeDeal = null;
let backendMode = false;
const money = n => '$' + Number(n || 0).toLocaleString('en-US');
const esc = str => String(str ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const stageName = id => STAGES.find(s => s.id === id)?.label || id;
const initials = name => String(name).split(/\s+/).slice(0,2).map(v => v[0]).join('').toUpperCase();
const formatDate = iso => { if (!iso) return 'No date'; const [y,m,d] = iso.split('-').map(Number); return new Date(y,m-1,d).toLocaleDateString('en-US',{month:'short',day:'numeric'}); };
const stamp = () => new Date().toLocaleString('en-US',{month:'short',day:'numeric',hour:'numeric',minute:'2-digit'});
function save(){localStorage.setItem('northline-deals-v1',JSON.stringify(deals));localStorage.setItem('northline-activities-v1',JSON.stringify(activities));}
function log(text,type='move'){activities.unshift({text,time:stamp(),type});activities=activities.slice(0,24);save();}
async function api(path, method='GET', body){
  const response=await fetch(path,{method,headers:body?{'Content-Type':'application/json'}:{},body:body?JSON.stringify(body):undefined,cache:'no-store'});
  const result=await response.json();
  if(!response.ok)throw new Error(result.error||'Request failed');
  return result;
}
async function connectBackend(){
  if(!location.protocol.startsWith('http'))return;
  try{
    const remote=await api('/api/opportunities');
    if(!Array.isArray(remote))return;
    backendMode=true;
    deals=remote;
    save();
    render();
  }catch{/* A standalone static page keeps using the local demo. */}
}
async function createDeal(data){
  const created=backendMode?await api('/api/opportunities','POST',data):{id:Math.max(0,...deals.map(d=>d.id))+1,...data};
  deals.unshift(created);
  log(`New inquiry from ${created.company}`,'new');
  closePanels();render();toast('Opportunity added');
}
async function updateDeal(id,data){
  const existing=deals.find(d=>d.id===id);
  if(!existing)return;
  const oldStage=existing.stage;
  const updated=backendMode?await api(`/api/opportunities/${id}`,'PUT',data):{...existing,...data};
  Object.assign(existing,updated);
  log(oldStage!==existing.stage?`${existing.company} moved to ${stageName(existing.stage)}`:`${existing.company} opportunity updated`,oldStage!==existing.stage?'move':'proposal');
  closePanels();render();toast('Changes saved');
}
async function deleteDeal(id){
  const existing=deals.find(d=>d.id===id);
  if(!existing)return;
  if(backendMode)await api(`/api/opportunities/${id}`,'DELETE');
  deals=deals.filter(d=>d.id!==id);
  log(`${existing.company} opportunity deleted`,'move');
  closePanels();render();toast('Opportunity deleted');
}
async function moveDeal(id,stage){
  const existing=deals.find(d=>d.id===id);
  if(!existing||existing.stage===stage)return;
  const updated=backendMode?await api(`/api/opportunities/${id}`,'PUT',{...existing,stage}):{...existing,stage};
  Object.assign(existing,updated);
  log(`${existing.company} moved to ${stageName(stage)}`);
  render();toast(`Moved to ${stageName(stage)}`);
}
function saveError(error){toast(error.message||'Could not save. Try again.');}
function toast(text){els.toast.textContent=text;els.toast.classList.add('show');clearTimeout(toast.timer);toast.timer=setTimeout(()=>els.toast.classList.remove('show'),2900);}
function icon(name){return `<svg class="icon"><use href="#i-${name}"/></svg>`;}
function metrics(){let active=deals.filter(d=>d.stage!=='won');let won=deals.filter(d=>d.stage==='won');return [
  ['Open opportunities',String(active.length),'Across the pipeline','kanban'],
  ['Potential revenue',money(active.reduce((a,d)=>a+d.value,0)),'From active projects','arrow'],
  ['Confirmed projects',String(won.length),'Ready for delivery','grid'],
  ['Average project value',money(Math.round(deals.reduce((a,d)=>a+d.value,0)/(deals.length||1))),'Across all projects','users']
];}
function header(kicker,title,subtitle,action=true){return `<div class="page-heading"><div><p class="eyebrow">${kicker}</p><h1>${title}</h1><p class="subline">${subtitle}</p></div>${action?`<button class="button button-primary" data-action="new">${icon('plus')} New opportunity</button>`:''}</div>`;}
function renderOverview(){
  const m=metrics();const recent=deals.slice(-5).reverse();
  const today=new Date().toLocaleDateString('en-US',{weekday:'long',month:'long',day:'numeric'});
  return `${header(today, 'A clear view of what’s next.', 'Keep your conversations moving and your best work in sight.')}
  <div class="metric-grid">${m.map(x=>`<article class="metric"><span class="metric-label">${x[0]}</span><span class="metric-icon">${icon(x[3])}</span><div class="metric-value">${x[1]}</div><div class="metric-detail">${x[2]}</div></article>`).join('')}</div>
  <div class="overview-grid"><section class="panel"><div class="panel-head"><h2 class="panel-title">Pipeline rhythm</h2><button class="text-link" data-view="pipeline">Explore pipeline ${icon('arrow')}</button></div><div class="chart-meta"><strong>${money(deals.reduce((a,d)=>a+d.value,0))}</strong><span>total project value</span></div><div class="chart">${[38,54,43,70,58,77,93].map((n,i)=>`<div class="chart-col"><div class="chart-bar" style="--h:${n}%"></div><span>${['Apr','May','Jun','Jul','Aug','Sep','Oct'][i]}</span></div>`).join('')}</div><div class="chart-footer"><span><i class="legend-dot"></i> This month</span><span><i class="legend-dot pale"></i> Previous months</span></div></section>
  <section class="panel"><div class="panel-head"><h2 class="panel-title">Recent opportunities</h2><button class="text-link" data-view="pipeline">See all ${icon('arrow')}</button></div><div class="list">${recent.map((d,i)=>`<div class="list-row"><span class="initials ${['coral','mint','yellow',''][i%4]}">${esc(initials(d.company))}</span><span class="list-row-main"><strong>${esc(d.company)}</strong><small>${esc(d.title)}</small></span><span class="list-row-value">${money(d.value)}</span></div>`).join('')}</div></section></div>
  <section class="panel section-space"><div class="panel-head"><h2 class="panel-title">Latest activity</h2><button class="text-link" data-view="activity">View timeline ${icon('arrow')}</button></div><div class="list">${activities.slice(0,3).map(activityItem).join('')}</div></section>`;
}
function activityItem(a){return `<div class="activity-entry"><span class="activity-mark">${a.type==='new'?'✦':a.type==='proposal'?'↗':'✓'}</span><span class="activity-body"><strong>${esc(a.text)}</strong><time>${esc(a.time)}</time></span></div>`;}
function filtered(){return deals.filter(d=>(category==='all'||d.category===category)&&`${d.title} ${d.company} ${d.contact}`.toLowerCase().includes(query.toLowerCase()));}
function renderPipeline(){
  const matches=filtered();
  return `${header('Relationship pipeline','Opportunities in motion.','Drag a card between stages or open it to update the details.')}
  <div class="toolbar"><label class="search-box">${icon('search')}<input id="dealSearch" placeholder="Search opportunities" value="${esc(query)}" aria-label="Search opportunities"></label><select id="categoryFilter" aria-label="Filter by service"><option value="all">All services</option>${['Website','Platform','E-commerce','CRM'].map(c=>`<option value="${c}" ${category===c?'selected':''}>${c}</option>`).join('')}</select><span class="toolbar-spacer"></span><button class="button button-light" data-action="export">${icon('download')} Export CSV</button></div>
  <div class="pipeline-board">${STAGES.map(s=>{let group=matches.filter(d=>d.stage===s.id);return `<section class="column" data-stage="${s.id}"><div class="column-header"><span class="status-dot ${s.id}"></span><strong>${s.label}</strong><span class="column-count">${group.length}</span></div><div class="column-total">${money(group.reduce((a,d)=>a+d.value,0))} total</div>${group.length?group.map(dealCard).join(''):'<div class="empty-column">No opportunities in this stage.</div>'}</section>`}).join('')}</div>`;
}
function dealCard(d){return `<article class="deal-card" draggable="true" data-id="${d.id}" tabindex="0" role="button" aria-label="Open ${esc(d.company)} opportunity"><div class="deal-card-top"><span class="deal-category">${esc(d.category)}</span><span class="mini-avatar" title="${esc(d.contact)}">${esc(initials(d.contact))}</span></div><h3>${esc(d.title)}</h3><p>${esc(d.company)}</p><div class="deal-bottom"><strong>${money(d.value)}</strong><span class="due">${formatDate(d.date)}</span></div></article>`;}
function renderContacts(){let unique=deals.filter((d,i,a)=>a.findIndex(x=>x.email===d.email)===i).filter(d=>`${d.contact} ${d.company} ${d.email}`.toLowerCase().includes(query.toLowerCase()));return `${header('Your network','People behind the projects.','A shared record of the relationships that make your work possible.')}
<div class="toolbar"><label class="search-box">${icon('search')}<input id="dealSearch" placeholder="Search contacts" value="${esc(query)}" aria-label="Search contacts"></label><span class="toolbar-spacer"></span><button class="button button-light" data-action="export">${icon('download')} Export CSV</button></div>
<div class="table-wrap"><table class="contacts-table"><thead><tr><th>Name</th><th>Company</th><th>Email</th><th>Opportunity</th><th>Status</th></tr></thead><tbody>${unique.map((d,i)=>`<tr data-open="${d.id}" tabindex="0"><td><span class="contact-name"><span class="initials ${['coral','mint','yellow',''][i%4]}">${esc(initials(d.contact))}</span><strong>${esc(d.contact)}</strong></span></td><td>${esc(d.company)}</td><td>${esc(d.email)}</td><td>${esc(d.title)}</td><td><span class="status-pill ${d.stage}">${stageName(d.stage)}</span></td></tr>`).join('')}</tbody></table>${unique.length?'':'<div class="empty-state"><strong>No contacts found</strong>Try another search.</div>'}</div>`;}
function renderActivity(){return `<div class="activity-page">${header('Every step, in context','Activity timeline.','A simple record of the conversations and decisions that move work forward.',false)}<div class="list">${activities.map(activityItem).join('')}</div></div>`;}
function render(){document.querySelectorAll('.nav-item').forEach(b=>b.classList.toggle('active',b.dataset.view===view));document.querySelector('#navDealCount').textContent=deals.length;els.breadcrumb.innerHTML=`Workspace <span>/</span> ${view[0].toUpperCase()+view.slice(1)}`;els.view.innerHTML=({overview:renderOverview,pipeline:renderPipeline,contacts:renderContacts,activity:renderActivity})[view]();}
function setView(next){view=next;query='';category='all';closePanels();render();window.scrollTo({top:0,behavior:'smooth'});history.replaceState(null,'',`#${next}`);}
function openOverlay(){els.overlay.hidden=false;document.body.style.overflow='hidden';}
function closePanels(){els.overlay.hidden=true;els.drawer.hidden=true;els.modal.hidden=true;document.body.style.overflow='';activeDeal=null;}
function fields(d={}){return `<div class="form-grid"><div class="field"><label for="f-title">Project name</label><input id="f-title" name="title" value="${esc(d.title||'')}" required maxlength="80" placeholder="e.g. New website"></div><div class="field"><label for="f-company">Company</label><input id="f-company" name="company" value="${esc(d.company||'')}" required maxlength="80" placeholder="Company name"></div><div class="field"><label for="f-contact">Contact</label><input id="f-contact" name="contact" value="${esc(d.contact||'')}" required maxlength="80" placeholder="Full name"></div><div class="field"><label for="f-email">Email</label><input id="f-email" name="email" type="email" value="${esc(d.email||'')}" required placeholder="name@company.com"></div><div class="field"><label for="f-value">Project value (USD)</label><input id="f-value" name="value" type="number" min="0" step="100" value="${d.value??''}" required placeholder="15000"></div><div class="field"><label for="f-stage">Stage</label><select id="f-stage" name="stage">${STAGES.map(s=>`<option value="${s.id}" ${d.stage===s.id?'selected':''}>${s.label}</option>`).join('')}</select></div><div class="field"><label for="f-category">Service</label><select id="f-category" name="category">${['Website','Platform','E-commerce','CRM'].map(c=>`<option ${d.category===c?'selected':''}>${c}</option>`).join('')}</select></div><div class="field"><label for="f-date">Next date</label><input id="f-date" name="date" type="date" value="${esc(d.date||'')}"></div><div class="field"><label for="f-notes">Notes</label><textarea id="f-notes" name="notes" placeholder="What's important to remember?">${esc(d.notes||'')}</textarea></div></div>`;}
function openNew(){openOverlay();els.modal.hidden=false;els.modal.innerHTML=`<div class="modal-head"><div><h2>New opportunity</h2><p>Add a conversation to your pipeline.</p></div><button class="icon-button" data-action="close" aria-label="Close">${icon('close')}</button></div><form id="newForm">${fields({stage:'lead'})}<div class="form-actions"><span></span><button class="button button-primary" type="submit">Add opportunity</button></div></form>`;els.modal.querySelector('input')?.focus();}
function openDeal(id){let d=deals.find(x=>x.id===Number(id));if(!d)return;activeDeal=d.id;openOverlay();els.drawer.hidden=false;els.drawer.innerHTML=`<div class="drawer-head"><div><span class="drawer-kicker">OPPORTUNITY DETAILS</span><h2>${esc(d.title)}</h2></div><button class="icon-button" data-action="close" aria-label="Close">${icon('close')}</button></div><p class="detail-company">${esc(d.company)} · ${esc(d.contact)}</p><div class="detail-stat"><span>Project value</span><strong>${money(d.value)}</strong></div><form id="editForm">${fields(d)}<div class="form-actions"><button class="danger-button" type="button" data-action="delete">Delete opportunity</button><button class="button button-primary" type="submit">Save changes</button></div></form>`;els.drawer.querySelector('input')?.focus();}
function formData(form){let x=Object.fromEntries(new FormData(form));return {...x,title:x.title.trim(),company:x.company.trim(),contact:x.contact.trim(),email:x.email.trim(),value:Number(x.value),notes:x.notes.trim()};}
function exportCsv(){let cols=['Project','Company','Contact','Email','Value (USD)','Stage','Service','Next date','Notes'];let rows=deals.map(d=>[d.title,d.company,d.contact,d.email,d.value,stageName(d.stage),d.category,d.date,d.notes]);let csv=[cols,...rows].map(r=>r.map(v=>'"'+String(v??'').replaceAll('"','""')+'"').join(',')).join('\r\n');let blob=new Blob([csv],{type:'text/csv;charset=utf-8'});let url=URL.createObjectURL(blob);let a=document.createElement('a');a.href=url;a.download='northline-opportunities.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);toast('CSV exported');}
document.addEventListener('click',async e=>{
  let nav=e.target.closest('[data-view]');
  if(nav){setView(nav.dataset.view);return;}
  let action=e.target.closest('[data-action]');
  if(action){
    switch(action.dataset.action){
      case 'new':openNew();break;
      case 'close':closePanels();break;
      case 'export':exportCsv();break;
      case 'delete':
        if(activeDeal!==null&&confirm('Delete this opportunity?')){
          try{await deleteDeal(activeDeal);}catch(error){saveError(error);}
        }
        break;
    }
    return;
  }
  let card=e.target.closest('[data-id]');
  if(card){openDeal(card.dataset.id);return;}
  let row=e.target.closest('[data-open]');
  if(row)openDeal(row.dataset.open);
});
document.addEventListener('submit',async e=>{
  if(e.target.id==='newForm'){
    e.preventDefault();
    try{await createDeal(formData(e.target));}catch(error){saveError(error);}
  }
  if(e.target.id==='editForm'){
    e.preventDefault();
    try{await updateDeal(activeDeal,formData(e.target));}catch(error){saveError(error);}
  }
});
document.addEventListener('input',e=>{if(e.target.id==='dealSearch'){let cursor=e.target.selectionStart;query=e.target.value;render();let input=document.querySelector('#dealSearch');input?.focus();input?.setSelectionRange(cursor,cursor);}});
document.addEventListener('change',e=>{if(e.target.id==='categoryFilter'){category=e.target.value;render();}});
document.addEventListener('dragstart',e=>{let card=e.target.closest('.deal-card');if(!card)return;e.dataTransfer.setData('text/plain',card.dataset.id);e.dataTransfer.effectAllowed='move';requestAnimationFrame(()=>card.classList.add('dragging'));});
document.addEventListener('dragend',e=>{e.target.closest('.deal-card')?.classList.remove('dragging');document.querySelectorAll('.column').forEach(c=>c.classList.remove('drag-over'));});
document.addEventListener('dragover',e=>{let col=e.target.closest('.column');if(!col)return;e.preventDefault();document.querySelectorAll('.column').forEach(c=>c.classList.toggle('drag-over',c===col));});
document.addEventListener('drop',async e=>{
  let col=e.target.closest('.column');
  if(!col)return;
  e.preventDefault();
  document.querySelectorAll('.column').forEach(c=>c.classList.remove('drag-over'));
  try{await moveDeal(Number(e.dataTransfer.getData('text/plain')),col.dataset.stage);}catch(error){saveError(error);}
});
document.addEventListener('keydown',e=>{if(e.key==='Escape')closePanels();if((e.key==='Enter'||e.key===' ')&&e.target.matches('.deal-card,[data-open]')){e.preventDefault();openDeal(e.target.dataset.id||e.target.dataset.open);}});
els.overlay.addEventListener('click',closePanels);
document.querySelector('#profileButton').addEventListener('click',()=>toast('Jamie Dawson · Workspace owner'));
const hash=location.hash.slice(1);if(['overview','pipeline','contacts','activity'].includes(hash))view=hash;
render();
connectBackend();
