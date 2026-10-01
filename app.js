import*as DB from './storage.js';
import{makeZip,readZip}from './zip.js';
const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const uid=()=>Math.random().toString(36).slice(2,9)+Date.now().toString(36);
const ago=t=>{const m=(Date.now()-t)/6e4;return m<1?'just now':m<60?~~m+' min ago':m<1440?~~(m/60)+' h ago':new Date(t).toLocaleDateString()};
const enc=new TextEncoder(),dec=new TextDecoder('utf-8',{fatal:true}),TXT=/\.(html?|css|js|mjs|json|md|txt|svg|xml|webmanifest|keep)$/i,ext=p=>p.split('.').pop().toLowerCase();
const S={view:'home',tab:'files',projects:[],files:[],pid:null,fid:null,dev:'phone',q:'',pq:'',dirty:false,cfg:{theme:'dark',font:14,tab:2,auto:true,wrap:false,lines:true,prev:'phone'}};
const D={phone:[390,844],tablet:[768,1024],desktop:[1280,800]};
const P={home:'M3 11l9-8 9 8M5 10v10h5v-6h4v6h5V10',folder:'M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z',plus:'M12 5v14M5 12h14',eye:'M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12zM12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6',cog:'M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8zM12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M5 19l2-2M17 7l2-2',code:'M8 7l-5 5 5 5M16 7l5 5-5 5',search:'M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14zM21 21l-5-5',more:'M5 12h.01M12 12h.01M19 12h.01',back:'M15 5l-7 7 7 7',dl:'M12 4v11M7 11l5 5 5-5M5 20h14'};
const ic=k=>`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${k==='more'?3:2}" stroke-linecap="round" stroke-linejoin="round"><path d="${P[k]}"/></svg>`;
const LOGO='<svg viewBox="0 0 512 512"><rect width="512" height="512" rx="112" fill="#0d0f13"/><rect x="104" y="120" width="304" height="272" rx="30" fill="none" stroke="#ff7a1a" stroke-width="28"/><path d="M118 194h276" stroke="#ff7a1a" stroke-width="20"/><path d="M256 236L274 292 256 348 238 292ZM200 292L256 274 312 292 256 310Z" fill="#ff7a1a"/></svg>';
const T={blank:['Blank','📄'],html:['HTML','🧱'],css:['HTML + CSS','🎨'],js:['HTML + CSS + JS','⚡'],landing:['Landing Page','🚀'],portfolio:['Portfolio','🌐'],app:['Web App','📱'],pwa:['PWA','📲']};
const hasCss=k=>k!=='blank'&&k!=='html',hasJs=k=>!['blank','html','css'].includes(k);
const tags=k=>k==='blank'?'Blank':'HTML'+(hasCss(k)?' • CSS':'')+(hasJs(k)?' • JS':'');
const cur=()=>S.files.find(f=>f.id===S.fid),proj=()=>S.projects.find(p=>p.id===S.pid),wide=()=>innerWidth>=900;
const toast=m=>{const t=$('#toast');t.textContent=m;t.classList.add('on');clearTimeout(toast.t);toast.t=setTimeout(()=>t.classList.remove('on'),2400)};
const safe=async(fn,msg)=>{try{return await fn()}catch(e){if(e&&e.name==='AbortError')return;console.error(e);toast(e&&e.name==='QuotaExceededError'?'Storage is full. Delete a project and try again.':msg)}};
const sheet=h=>{const s=$('#sheet');s.innerHTML=`<div class="bd" data-a="x"></div><div class="pn">${h}</div>`;s.hidden=false},closeSheet=()=>{$('#sheet').hidden=true};
const ask=(t,v='',ok='Save')=>new Promise(r=>{sheet(`<h3>${t}</h3><input id="ai" value="${esc(v)}" autocapitalize="off"><div class="row"><button class="btn" id="no">Cancel</button><button class="btn pri" id="ok">${ok}</button></div>`);const i=$('#ai');i.focus();i.select();const d=x=>{closeSheet();r(x)};$('#ok').onclick=()=>d(i.value.trim()||null);$('#no').onclick=()=>d(null);i.onkeydown=e=>e.key==='Enter'&&$('#ok').click()});
const sure=(t,m,ok,c='danger')=>new Promise(r=>{sheet(`<h3>${t}</h3><p class="mut">${m}</p><div class="row"><button class="btn" id="no">Cancel</button><button class="btn ${c}" id="ok">${ok}</button></div>`);$('#no').onclick=()=>{closeSheet();r(false)};$('#ok').onclick=()=>{closeSheet();r(true)}});
const clean=p=>p.trim().replace(/\\/g,'/').replace(/^\/+/,'').replace(/\.\.+\//g,'');
/* ---------- templates ---------- */
function starter(k,n){
 const hd=`<h1>${n}</h1>`,b='<p><button id="go">Get Started</button></p>',card=(a,c)=>`<div class="card"><h2>${a}</h2><p>${c}</p></div>`;
 const B={blank:'',html:`  ${hd}\n  <p>Hello World</p>`,css:`  ${hd}\n  <p>Hello World</p>`,js:`  ${hd}\n  <p>Hello World</p>\n  ${b}`,landing:`  ${hd}\n  <p>Launch your idea today.</p>\n  ${b}\n  ${card('Fast','Built in minutes.')}\n  ${card('Responsive','Great on any screen.')}`,portfolio:`  ${hd}\n  <p>Developer &amp; designer.</p>\n  ${card('Project One','Short description.')}\n  ${card('Project Two','Short description.')}\n  ${b}`,app:`  ${hd}\n  <p><input id="t" placeholder="New task"> <button id="go">Add</button></p>\n  <ul id="l"></ul>`,pwa:`  ${hd}\n  <p>Installable &amp; offline-ready.</p>\n  ${b}`};
 const F={};
 F['index.html']=`<!DOCTYPE html>\n<html lang="en">\n<head>\n  <meta charset="UTF-8">\n  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n  <title>${n}</title>\n${hasCss(k)?'  <link rel="stylesheet" href="style.css">\n':''}${k==='pwa'?'  <link rel="manifest" href="manifest.json">\n':''}</head>\n<body>\n${B[k]}\n${hasJs(k)?'  <script src="script.js"></script>\n':''}</body>\n</html>\n`;
 if(hasCss(k))F['style.css']=`*{box-sizing:border-box}\nbody{font-family:system-ui,sans-serif;background:#0f1115;color:#e8eaf0;line-height:1.6;padding:24px;margin:0}\nh1{margin:0 0 8px}\nbutton{background:#ff7a1a;color:#111;border:0;padding:12px 20px;border-radius:12px;font-weight:600;font-size:1rem}\ninput{padding:12px;border-radius:12px;border:1px solid #2a2f3a;background:#181b22;color:inherit;font-size:1rem}\n.card{background:#181b22;border:1px solid #2a2f3a;border-radius:16px;padding:16px;margin-top:12px}\n`;
 if(hasJs(k))F['script.js']=k==='app'?`const t=document.getElementById('t'),l=document.getElementById('l');\ndocument.getElementById('go').onclick=()=>{\n  if(!t.value.trim())return;\n  const li=document.createElement('li');\n  li.textContent=t.value;\n  li.onclick=()=>li.remove();\n  l.append(li);\n  t.value='';\n};\n`:`document.getElementById('go').onclick=()=>alert('Hello from ${n}!');\n${k==='pwa'?"try{navigator.serviceWorker.register('sw.js').catch(()=>{})}catch{}\n":''}`;
 if(k==='pwa'){F['manifest.json']=JSON.stringify({name:n,short_name:n,start_url:'.',display:'standalone',background_color:'#0f1115',theme_color:'#0f1115',icons:[]},null,2)+'\n';F['sw.js']=`self.oninstall=()=>self.skipWaiting();\nself.onfetch=e=>e.respondWith(fetch(e.request).catch(()=>caches.match(e.request)));\n`}
 return F}
/* ---------- highlighter ---------- */
const R={html:/(&lt;!--[\s\S]*?-->)|(&lt;\/?[\w-]+)|("[^"\n]*"|'[^'\n]*')|(\s[\w-]+)(?==)/g,css:/(\/\*[\s\S]*?\*\/)|("[^"\n]*"|'[^'\n]*')|([.#]?[\w-]+)(?=\s*:(?!:))|(#[\da-f]{3,8}\b|\b\d[\w.%]*)/gi,js:/(\/\/.*|\/\*[\s\S]*?\*\/)|("[^"\n]*"|'[^'\n]*'|`[^`]*`)|\b(const|let|var|function|return|if|else|for|while|import|export|from|new|class|async|await|try|catch|true|false|null)\b|(\b\d+\.?\d*\b)/g},M={html:['c','k','s','a'],css:['c','s','a','n'],js:['c','s','k','n']};
const hlt=(s,e)=>{s=s.replace(/&/g,'&amp;').replace(/</g,'&lt;');e=e==='htm'?'html':e==='mjs'?'js':e;const r=R[e];return(r?s.replace(r,(m,...g)=>`<i class="${M[e][g.findIndex(x=>x!==undefined)]}">${m}</i>`):s)+'\n'};
/* ---------- data ---------- */
async function load(){S.projects=(await DB.all('projects')).sort((a,b)=>b.edited-a.edited);const c=await DB.get('settings','cfg');if(c)Object.assign(S.cfg,c);S.dev=S.cfg.prev}
const sortP=()=>S.projects.sort((a,b)=>b.edited-a.edited);
async function openP(id,tab='files'){S.pid=id;S.files=await DB.filesOf(id);S.fid=null;S.tab=tab;S.view='project';S.q='';render()}
async function touch(){const p=proj();if(!p)return;p.edited=Date.now();await DB.put('projects',p);sortP()}
async function addFile(pid,path,text,bin){const f={id:uid(),pid,path,edited:Date.now()};if(bin)f.bin=bin;else f.text=text;await DB.put('files',f);return f}
async function create(name,kind){const p={id:uid(),name,kind,created:Date.now(),edited:Date.now()};await DB.put('projects',p);for(const[k,v]of Object.entries(starter(kind,esc(name))))await addFile(p.id,k,v);S.projects.unshift(p);return p}
const bytes=f=>f.bin||enc.encode(f.text||'');
const zipOf=async(pid,name)=>makeZip((await DB.filesOf(pid)).map(f=>({path:`${name}/${f.path}`,data:bytes(f)})));
const dl=(b,n)=>{const a=document.createElement('a');a.href=URL.createObjectURL(b);a.download=n;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),4e3)};
const exportP=p=>safe(async()=>{dl(await zipOf(p.id,p.name),p.name+'.zip');toast('ZIP exported')},'Export failed. Please try again.');
const shareP=p=>safe(async()=>{const b=await zipOf(p.id,p.name),f=new File([b],p.name+'.zip',{type:'application/zip'});if(navigator.canShare?.({files:[f]}))await navigator.share({files:[f],title:p.name});else{dl(b,p.name+'.zip');toast('Sharing isn’t supported here. ZIP downloaded instead.')}},'Could not share this project.');
async function dup(p){const n=await ask('Duplicate as',p.name+' v2','Duplicate');if(!n)return;await safe(async()=>{const q={...p,id:uid(),name:n,created:Date.now(),edited:Date.now()};await DB.put('projects',q);for(const f of await DB.filesOf(p.id))await DB.put('files',{...f,id:uid(),pid:q.id});S.projects.unshift(q);render();toast('Project duplicated')},'Could not duplicate.')}
async function importFiles(list){await safe(async()=>{
 let ents=[],name='Imported',zip=false;
 for(const f of list){
  if(/\.zip$/i.test(f.name)){zip=true;name=f.name.replace(/\.zip$/i,'');try{ents=await readZip(await f.arrayBuffer())}catch{return toast('This ZIP is invalid or damaged.')}
   ents=ents.filter(e=>!e.path.startsWith('__MACOSX')&&!/(^|\/)\.DS_Store$/.test(e.path));
   if(ents.length&&ents.every(e=>e.path.includes('/'))&&new Set(ents.map(e=>e.path.split('/')[0])).size===1)ents.forEach(e=>e.path=e.path.split('/').slice(1).join('/'))}
  else if(/\.(html?|css|js)$/i.test(f.name))ents.push({path:f.name,data:new Uint8Array(await f.arrayBuffer())});
  else return toast('Unsupported file: '+f.name)}
 if(!ents.length)return toast('Nothing to import.');
 const into=S.view==='project'&&!zip;
 if(zip&&!await sure('Import Project',`${esc(name)}.zip<br>${ents.length} files`,'Import','pri'))return;
 let p=into?proj():null;
 if(!p){if(!zip)name=list[0].name.replace(/\.\w+$/,'');p={id:uid(),name,kind:'js',created:Date.now(),edited:Date.now()};await DB.put('projects',p);S.projects.unshift(p)}
 for(const e of ents){let t;try{if(!TXT.test(e.path))throw 0;t=dec.decode(e.data)}catch{t=undefined}
  const f=await addFile(p.id,e.path,t,t===undefined?e.data:undefined);if(into)S.files.push(f)}
 await DB.put('projects',p);toast(`Imported ${ents.length} file${ents.length>1?'s':''}`);into?render():openP(p.id)},'Import failed. Please try another file.')}
/* ---------- views ---------- */
const card=p=>`<div class="card"><div class="ct"><span class="em">${T[p.kind]?.[1]||'📁'}</span><div><b>${esc(p.name)}</b><small>${tags(p.kind)}</small><small>Edited ${ago(p.edited)}</small></div></div><div class="row2"><button class="btn pri" data-a="op" data-id="${p.id}">Open</button><button class="ib" data-a="pm" data-id="${p.id}" aria-label="Project menu">${ic('more')}</button></div></div>`;
const empty=()=>`<div class="empty"><b>No projects yet</b><p>Create your first web project<br>directly from your phone.</p><button class="btn pri" data-a="new">+ New Project</button></div>`;
const inst=()=>S.inst&&!localStorage.getItem('pf-x')?`<div class="inst"><div><b>Install ProjectForge</b><br><small>Build websites directly from your phone.</small></div><button class="btn pri" data-a="inst">Install</button><button class="ib" data-a="hide" aria-label="Dismiss">✕</button></div>`:'';
const vHome=()=>{const h=new Date().getHours();return`<div class="pad"><h1>Good ${h<12?'morning':h<18?'afternoon':'evening'} 👋</h1><p class="mut">What are you building today?</p>${inst()}<div class="row"><button class="btn pri grow" data-a="new">+ New Project</button><button class="btn" data-a="imp">Import</button></div><h4>Recent Projects</h4>${S.projects.length?S.projects.slice(0,5).map(card).join(''):empty()}</div>`};
const plist=()=>{const q=S.pq.toLowerCase(),l=S.projects.filter(p=>!q||(p.name+' '+tags(p.kind)+' '+(T[p.kind]?.[0]||'')).toLowerCase().includes(q));return l.length?l.map(card).join(''):empty()};
const vProjects=()=>`<div class="pad"><input id="pq" type="search" placeholder="Search projects..." value="${esc(S.pq)}"><div id="pl">${plist()}</div></div>`;
const sr=(l,c)=>`<label class="sr"><span>${l}</span>${c}</label>`,sel=(k,o)=>`<select data-cfg="${k}">${o.map(v=>`<option${S.cfg[k]==v?' selected':''}>${v}</option>`).join('')}</select>`,tog=k=>`<input type="checkbox" data-cfg="${k}"${S.cfg[k]?' checked':''}>`;
const vSettings=()=>`<div class="pad"><h3>Settings</h3>${sr('Theme',sel('theme',['dark','light','system']))}${sr('Editor font size',sel('font',[12,13,14,16,18]))}${sr('Editor tab size',sel('tab',[2,4]))}${sr('Auto-save',tog('auto'))}${sr('Word wrap',tog('wrap'))}${sr('Show line numbers',tog('lines'))}${sr('Default preview',sel('prev',['phone','tablet','desktop']))}<div class="row"><button class="btn" data-a="ea">Export all projects</button><button class="btn" data-a="cl" style="color:var(--bad)">Clear project data</button></div><h4>Help &amp; limitations</h4><ul class="help"><li>Everything is stored on this device in IndexedDB. Nothing is uploaded.</li><li>Previews run in a sandbox: they can't read ProjectForge data, and service workers and storage are blocked inside them.</li><li>Folders are kept as file paths (for example <code>assets/logo.svg</code>).</li><li>Sharing uses your browser's share sheet when available. Otherwise the ZIP is downloaded.</li><li>Offline install needs https or localhost, not file://.</li></ul></div>`;
const filesTab=()=>{const fs=[...S.files].sort((a,b)=>a.path.localeCompare(b.path)),rec=[...S.files].filter(f=>!f.path.endsWith('/.keep')).sort((a,b)=>b.edited-a.edited).slice(0,3);return`<div class="pad"><div class="row" style="margin-top:0"><button class="btn pri" data-a="nf">+ File</button><button class="btn" data-a="nd">+ Folder</button></div><h4>Files</h4><div class="list">${fs.map(f=>{const k=f.path.endsWith('/.keep');return`<div class="fr"><button class="fb" data-a="${k?'fo':'of'}" data-id="${f.id}"><span>${k?'📁':'📄'}</span><span>${esc(k?f.path.slice(0,-5):f.path)}</span></button><button class="ib" data-a="fm" data-id="${f.id}" aria-label="File menu">${ic('more')}</button></div>`}).join('')||'<p class="mut" style="padding:14px">No files yet.</p>'}</div><h4>Recently edited</h4>${rec.map(f=>`<div class="ri"><span>${esc(f.path)}</span><small>${ago(f.edited)}</small></div>`).join('')}</div>`};
const QK=[['↶','undo'],['↷','redo'],['Find','find'],['All','all'],['Copy','copy'],['Paste','paste'],['Save','save'],['<>','<>',1],['{}','{}',1],['""','""',1],['()','()',1],['[]','[]',1],['=','='],[';',';'],['Tab','Tab']];
function codeTab(){
 const fs=S.files.filter(f=>f.text!==undefined&&!f.path.endsWith('/.keep'));
 if(!cur()||cur().text===undefined)S.fid=(fs.find(f=>f.path==='index.html')||fs[0])?.id;
 const f=cur();if(!f)return'<div class="empty"><b>No files yet</b><p>Add a file from the Files tab.</p></div>';
 const ed=`<div class="code"><div class="bar"><select id="fs" aria-label="Switch file">${fs.map(x=>`<option value="${x.id}"${x.id===f.id?' selected':''}>${esc(x.path)}</option>`).join('')}</select></div><div class="tools">${QK.map((q,i)=>`<button data-a="q" data-i="${i}">${q[0]}</button>`).join('')}</div><div class="fbar" id="fb" hidden><input id="fq" placeholder="Find" autocapitalize="off"><input id="rq" placeholder="Replace" autocapitalize="off"><button class="btn" data-a="fn">Find next</button><div class="row2" style="display:flex;gap:6px"><button class="btn grow" data-a="rp">Replace</button><button class="btn grow" data-a="ra">All</button></div></div><div class="ed"><div class="gut" id="gut"></div><div class="cw" id="cw"><pre id="hl"></pre><textarea id="ta" spellcheck="false" autocapitalize="off" autocomplete="off" autocorrect="off" aria-label="Code editor"></textarea></div></div></div>`;
 return wide()?`<div class="split">${ed}<div class="prev">${pvHtml()}</div></div>`:ed}
const pvHtml=()=>`<div class="pvb"><div class="seg">${Object.keys(D).map(k=>`<button class="${k===S.dev?'on':''}" data-a="dev" data-k="${k}">${k}</button>`).join('')}</div><span class="mut" id="dlb">${D[S.dev][0]} × ${D[S.dev][1]}</span><button class="ib" data-a="rf" aria-label="Refresh">↻</button><button class="ib" data-a="fs" aria-label="Fullscreen">⛶</button></div><div class="pv" id="pv"><button class="ib xb" data-a="fs" aria-label="Close fullscreen">✕</button><div id="sc"><iframe id="fr" sandbox="allow-scripts allow-forms allow-modals allow-popups" title="Preview"></iframe></div></div><div class="st" id="ps"></div>`;
const searchTab=()=>`<div class="pad"><input id="sq" type="search" placeholder="Search in project..." value="${esc(S.q)}"><div id="sres">${results()}</div></div>`;
const results=()=>{if(!S.q)return'<p class="mut" style="margin-top:12px">Search every file for text such as button, fetch or background.</p>';const r=[],q=S.q.toLowerCase();for(const f of S.files)if(f.text!==undefined)f.text.split('\n').forEach((l,i)=>{if(r.length<200&&l.toLowerCase().includes(q))r.push({f,i,l})});return`<p class="mut" style="margin:12px 0 0">${r.length} result${r.length==1?'':'s'}</p>`+r.map(x=>`<button class="res" data-a="gl" data-id="${x.f.id}" data-l="${x.i}"><b>${esc(x.f.path)}</b><small>Line ${x.i+1}</small><code>${esc(x.l.trim().slice(0,90))}</code></button>`).join('')};
/* ---------- render ---------- */
function applyTheme(){const t=S.cfg.theme,d=t==='system'?(matchMedia('(prefers-color-scheme:light)').matches?'light':'dark'):t;document.documentElement.dataset.theme=d;document.documentElement.style.setProperty('--fs',S.cfg.font+'px')}
const setSt=()=>{const e=$('#st');if(e){e.textContent=S.dirty?'● Unsaved changes':'● Saved';e.className='st'+(S.dirty?' u':'')}};
function render(){
 applyTheme();const pv=S.view==='project',p=pv&&proj();
 $('#hd').innerHTML=pv?`<button class="ib" data-a="back" aria-label="Back">${ic('back')}</button><div class="ti"><b>${esc(p.name)}</b><small id="st"></small></div><button class="ib" data-a="exp" aria-label="Export ZIP">${ic('dl')}</button>`:`<div class="brand">${LOGO}<div class="ti"><b>ProjectForge</b><small>Build. Preview. Export.</small></div></div><button class="ib" data-a="nav" data-v="settings" aria-label="Settings">${ic('cog')}</button>`;
 const N=pv?[['files','Files','folder'],['code','Code','code'],['preview','Preview','eye'],['search','Search','search'],['more','More','more']]:[['home','Home','home'],['projects','Projects','folder'],['new','','plus'],['pv','Preview','eye'],['settings','Settings','cog']];
 $('#nav').innerHTML=N.map(([k,l,i])=>`<button class="${k==='new'?'fab':(pv?S.tab:S.view)===k?'on':''}" data-a="${pv?'tab':'nav'}" data-v="${k}" aria-label="${l||'New project'}">${ic(i)}<span>${l}</span></button>`).join('');
 $('#main').innerHTML=pv?{files:filesTab,code:codeTab,preview:()=>`<div class="prev">${pvHtml()}</div>`,search:searchTab}[S.tab]():{home:vHome,projects:vProjects,settings:vSettings}[S.view]();
 if(pv){setSt();if(S.tab==='code')mountEd();if(S.tab==='preview'||S.tab==='code'&&wide())mountPv()}}
/* ---------- editor ---------- */
const ta=()=>$('#ta'),tab=()=>' '.repeat(S.cfg.tab);
function paint(){const t=ta(),f=cur();$('#hl').innerHTML=hlt(t.value,ext(f.path));$('#gut').textContent=Array.from({length:t.value.split('\n').length},(_,i)=>i+1).join('\n');sync()}
const sync=()=>{const t=ta();$('#hl').scrollTop=t.scrollTop;$('#hl').scrollLeft=t.scrollLeft;$('#gut').scrollTop=t.scrollTop};
const ins=(x,back=0)=>{const t=ta();t.focus();if(!document.execCommand('insertText',false,x)){t.setRangeText(x,t.selectionStart,t.selectionEnd,'end');t.dispatchEvent(new Event('input'))}if(back)t.setSelectionRange(t.selectionStart-back,t.selectionStart-back)};
function reveal(i){const t=ta(),l=t.value.slice(0,i).split('\n').length-1,h=S.cfg.font*1.5,y=l*h;if(y<t.scrollTop||y>t.scrollTop+t.clientHeight-2*h)t.scrollTop=Math.max(0,y-t.clientHeight/3);sync()}
function mountEd(){const f=cur(),t=ta();if(!t)return;t.value=f.text;t.style.tabSize=S.cfg.tab;$('#cw').classList.toggle('wrap',S.cfg.wrap);$('#gut').hidden=S.cfg.wrap||!S.cfg.lines;paint();
 t.oninput=()=>{paint();S.dirty=true;setSt();clearTimeout(mountEd.t);if(S.cfg.auto)mountEd.t=setTimeout(()=>save(),600)};t.onscroll=sync;
 t.onkeydown=e=>{if(e.key==='Enter'){const s=t.selectionStart,ln=t.value.lastIndexOf('\n',s-1)+1,ind=t.value.slice(ln,s).match(/^\s*/)[0];e.preventDefault();ins('\n'+ind+('{(['.includes(t.value[s-1])?tab():''))}else if(e.key==='Tab'){e.preventDefault();ins(tab())}};
 $('.tools').onpointerdown=e=>e.preventDefault();
 if(S.goto!=null){const l=S.goto.split('\n'),n=+S.goto;S.goto=null;const L=t.value.split('\n'),a=L.slice(0,n).join('\n').length+(n?1:0);t.focus();t.setSelectionRange(a,a+(L[n]||'').length);reveal(a)}}
async function save(manual){const f=cur(),t=ta();if(!f||!t||!S.dirty&&!manual)return;clearTimeout(mountEd.t);await safe(async()=>{f.text=t.value;f.edited=Date.now();await DB.put('files',f);await touch();S.dirty=false;setSt();if($('#fr'))mountPv(1);if(manual)toast('Saved')},'Could not save. Your storage may be full.')}
const FN={undo:()=>{ta().focus();document.execCommand('undo')},redo:()=>{ta().focus();document.execCommand('redo')},find:()=>{$('#fb').toggleAttribute('hidden');$('#fq').focus()},all:()=>{ta().focus();ta().select()},copy:()=>{const t=ta(),s=t.value.slice(t.selectionStart,t.selectionEnd)||t.value;navigator.clipboard?.writeText(s).then(()=>toast('Copied'),()=>toast('Copy isn’t allowed here.'))},paste:()=>navigator.clipboard?.readText().then(x=>ins(x),()=>toast('Long-press in the editor to paste.')),save:()=>save(1)};
function findNext(){const q=$('#fq').value,t=ta();if(!q)return;const v=t.value.toLowerCase();let i=v.indexOf(q.toLowerCase(),t.selectionEnd);if(i<0)i=v.indexOf(q.toLowerCase());if(i<0)return toast('No matches');t.focus();t.setSelectionRange(i,i+q.length);reveal(i)}
/* ---------- preview ---------- */
async function build(){
 const fs=S.files,by=p=>fs.find(f=>f.path===p),idx=by('index.html')||fs.find(f=>/\.html?$/i.test(f.path));
 if(!idx||idx.text===undefined)return'<p style="font:16px system-ui;padding:24px">No HTML file yet. Add an <b>index.html</b> to see a preview.</p>';
 const dir=idx.path.replace(/[^/]*$/,''),res=p=>by(dir+p.replace(/^\.?\//,'')),urls={};
 for(const f of fs)if(f.bin)urls[f.path]=URL.createObjectURL(new Blob([f.bin]));
 return idx.text.replace(/<link[^>]*href=["']([^"']+)["'][^>]*>/gi,(m,p)=>{const f=res(p);return f&&f.text!==undefined&&/\.css$/i.test(p)?`<style>${f.text}</style>`:m})
  .replace(/<script([^>]*?)src=["']([^"']+)["']([^>]*)><\/script>/gi,(m,a,p,b)=>{const f=res(p);return f&&f.text!==undefined?`<script${a}${b}>${f.text.replace(/<\/script/gi,'<\\/script')}<\/script>`:m})
  .replace(/(src|href)=["']([^"':#]+)["']/gi,(m,a,p)=>{const f=res(p);return f&&f.bin?`${a}="${urls[f.path]}"`:m})}
function fit(){const fr=$('#fr'),b=$('#pv');if(!fr||!b)return;const[w,h]=D[S.dev],s=Math.min(1,(b.clientWidth-16)/w);$('#sc').style.cssText=`width:${w*s}px;height:${h*s}px`;fr.style.cssText=`width:${w}px;height:${h}px;transform:scale(${s})`;$('#dlb').textContent=`${w} × ${h}`}
async function mountPv(u){const fr=$('#fr');if(!fr)return;try{fr.srcdoc=await build()}catch{return toast('The preview couldn’t be built.')}fit();if(u)$('#ps').textContent='● Preview updated'}
/* ---------- sheets ---------- */
function newSheet(){let k='js';sheet(`<h3>Create Project</h3><input id="pn" placeholder="My Portfolio" maxlength="40"><div class="tpl">${Object.entries(T).map(([i,[l,e]])=>`<button class="tc${i===k?' on':''}" data-k="${i}"><span>${e}</span>${l}</button>`).join('')}</div><button class="btn pri wide" id="mk">Create</button>`);
 $$('.tc').forEach(b=>b.onclick=()=>{k=b.dataset.k;$$('.tc').forEach(x=>x.classList.toggle('on',x===b))});
 $('#mk').onclick=()=>safe(async()=>{const n=$('#pn').value.trim()||'My Project';closeSheet();const p=await create(n,k);await openP(p.id)},'Could not create the project.')}
const menu=(items,t)=>sheet((t?`<h3>${esc(t)}</h3>`:'')+items.map(([l,a,id,d])=>`<button class="mi${d?' d':''}" data-a="${a}" data-id="${id||''}">${l}</button>`).join(''));
function info(){const p=proj(),sz=S.files.reduce((a,f)=>a+bytes(f).length,0),d=t=>new Date(t).toLocaleDateString(undefined,{month:'short',day:'numeric',year:'numeric'});sheet(`<h3>Project Info</h3><div class="sr"><span>Name</span><b>${esc(p.name)}</b></div><div class="sr"><span>Files</span><b>${S.files.filter(f=>!f.path.endsWith('/.keep')).length}</b></div><div class="sr"><span>Size</span><b>${sz<1024?sz+' B':(sz/1024).toFixed(1)+' KB'}</b></div><div class="sr"><span>Created</span><b>${d(p.created)}</b></div><div class="sr"><span>Last edited</span><b>${ago(p.edited)}</b></div>`)}
const byId=id=>S.projects.find(p=>p.id===id),fById=id=>S.files.find(f=>f.id===id);
/* ---------- events ---------- */
document.addEventListener('click',async e=>{
 const el=e.target.closest('[data-a]');if(!el)return;const{a,v,id}=el.dataset;
 if(['tab','nav','back','op','gl'].includes(a)&&S.view==='project')await save();
 switch(a){
  case'x':closeSheet();break;
  case'new':newSheet();break;
  case'imp':$('#imp').click();break;
  case'nav':if(v==='new')newSheet();else if(v==='pv'){const p=byId(S.pid)||S.projects[0];p?openP(p.id,'preview'):toast('Open a project first.')}else{S.view=v;render()}break;
  case'back':S.view='projects';render();break;
  case'tab':if(v==='more')menu([['Project info','pi'],['Export ZIP','pe'],['Share project','ps'],['Import files','imp'],['Duplicate project','pd'],['Rename project','pr']],'More');else{S.tab=v;render()}break;
  case'op':closeSheet();openP(id);break;
  case'exp':exportP(proj());break;
  case'pm':menu([['Open','op',id],['Rename','pr',id],['Duplicate','pd',id],['Export ZIP','pe',id],['Share','ps',id],['Delete','px',id,1]],byId(id).name);break;
  case'pi':info();break;
  case'pe':closeSheet();exportP(byId(id)||proj());break;
  case'ps':closeSheet();shareP(byId(id)||proj());break;
  case'pd':closeSheet();dup(byId(id)||proj());break;
  case'pr':{closeSheet();const p=byId(id)||proj(),n=await ask('Rename project',p.name);if(n)await safe(async()=>{p.name=n;await DB.put('projects',p);render()},'Could not rename.');break}
  case'px':{closeSheet();const p=byId(id);if(await sure(`Delete “${esc(p.name)}”?`,'This project will be removed from this device.','Delete'))await safe(async()=>{await DB.delFiles(p.id);await DB.del('projects',p.id);S.projects=S.projects.filter(x=>x!==p);render();toast('Project deleted')},'Could not delete.');break}
  case'nf':{const n=await ask('New file','script.js','Create');if(!n)break;const p=clean(n);if(S.files.some(f=>f.path===p))return toast('That file already exists.');await safe(async()=>{const f=await addFile(S.pid,p,'');S.files.push(f);S.fid=f.id;S.tab='code';await touch();render()},'Could not create the file.');break}
  case'nd':{const n=await ask('New folder','assets','Create');if(!n)break;await safe(async()=>{S.files.push(await addFile(S.pid,clean(n).replace(/\/$/,'')+'/.keep',''));render()},'Could not create the folder.');break}
  case'fo':toast('Add files here with “+ File”, e.g. '+fById(id).path.replace('.keep','logo.svg'));break;
  case'of':{const f=fById(id);if(f.text===undefined)return toast('Binary files can’t be edited here.');S.fid=id;S.tab='code';render();break}
  case'fm':menu([['Rename','fr',id],['Duplicate','fd',id],['Download','fdl',id],['Delete','fx',id,1]],fById(id).path);break;
  case'fr':{closeSheet();const f=fById(id),n=await ask('Rename file',f.path);if(n)await safe(async()=>{f.path=clean(n);await DB.put('files',f);render()},'Could not rename.');break}
  case'fd':closeSheet();await safe(async()=>{const f=fById(id),n=f.path.replace(/(\.\w+)?$/,m=>'-copy'+m),c=await addFile(S.pid,n,f.text,f.bin);S.files.push(c);render()},'Could not duplicate.');break;
  case'fdl':{closeSheet();const f=fById(id);dl(new Blob([bytes(f)]),f.path.split('/').pop());break}
  case'fx':{closeSheet();const f=fById(id);if(await sure(`Delete “${esc(f.path)}”?`,'This file will be removed from the project.','Delete'))await safe(async()=>{await DB.del('files',id);S.files=S.files.filter(x=>x!==f);await touch();render()},'Could not delete.');break}
  case'q':{const q=QK[+el.dataset.i];FN[q[1]]?FN[q[1]]():ins(q[1]==='Tab'?tab():q[1],q[2]);break}
  case'fn':findNext();break;
  case'rp':{const t=ta(),q=$('#fq').value;if(q&&t.value.slice(t.selectionStart,t.selectionEnd).toLowerCase()===q.toLowerCase())ins($('#rq').value);findNext();break}
  case'ra':{const q=$('#fq').value,t=ta();if(!q)break;const n=t.value.split(q).length-1;t.focus();t.select();ins(t.value.split(q).join($('#rq').value));toast(n+' replaced');break}
  case'dev':S.dev=el.dataset.k;$$('.seg button').forEach(b=>b.classList.toggle('on',b===el));fit();break;
  case'rf':mountPv(1);break;
  case'fs':{const b=$('#pv'),f=b.classList.toggle('full');if(f&&b.requestFullscreen)b.requestFullscreen().catch(()=>{});else if(document.fullscreenElement)document.exitFullscreen();setTimeout(fit,50);break}
  case'gl':S.fid=id;S.tab='code';S.goto=el.dataset.l;render();break;
  case'ea':await safe(async()=>{const parts=[];for(const p of S.projects)for(const f of await DB.filesOf(p.id))parts.push({path:`${p.name}/${f.path}`,data:bytes(f)});if(!parts.length)return toast('No projects to export.');dl(makeZip(parts),'ProjectForge-all.zip')},'Export failed.');break;
  case'cl':if(await sure('Clear all project data?','Every project on this device will be permanently removed.','Clear everything'))await safe(async()=>{await DB.clear('projects');await DB.clear('files');S.projects=[];S.pid=null;render();toast('All project data cleared')},'Could not clear data.');break;
  case'inst':S.inst.prompt();S.inst=null;render();break;
  case'hide':localStorage.setItem('pf-x','1');render();break}});
let dt;const deb=(f)=>{clearTimeout(dt);dt=setTimeout(f,120)};
document.addEventListener('input',e=>{const i=e.target.id;if(i==='pq'){S.pq=e.target.value;deb(()=>$('#pl').innerHTML=plist())}if(i==='sq'){S.q=e.target.value;deb(()=>$('#sres').innerHTML=results())}});
document.addEventListener('change',async e=>{const t=e.target;if(t.id==='fs'){await save();S.fid=t.value;render();return}const k=t.dataset.cfg;if(!k)return;S.cfg[k]=t.type==='checkbox'?t.checked:isNaN(t.value)?t.value:+t.value;if(k==='prev')S.dev=t.value;await safe(()=>DB.put('settings',S.cfg,'cfg'),'Could not save settings.');applyTheme()});
$('#imp').onchange=e=>{const l=[...e.target.files];e.target.value='';l.length&&importFiles(l)};
addEventListener('resize',()=>fit());
addEventListener('beforeinstallprompt',e=>{e.preventDefault();S.inst=e;if(S.view==='home')render()});
addEventListener('pagehide',()=>save());
document.addEventListener('visibilitychange',()=>document.hidden&&save());
if('serviceWorker'in navigator&&/^https?:/.test(location.protocol))navigator.serviceWorker.register('service-worker.js').catch(()=>{});
safe(load,'Storage isn’t available in this browser.').then(render);
