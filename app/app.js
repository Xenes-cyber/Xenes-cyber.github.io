'use strict';
const $ = s => document.querySelector(s);
const main = $('#main');
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const readStore = (k, fallback) => {try {return JSON.parse(localStorage.getItem(k)) ?? fallback;} catch {return fallback;}};
const save = (k,v) => {try {localStorage.setItem(k,JSON.stringify(v));} catch {}};
let catalog=[], report={}, epoch=0, currentBook=null, ready=false, activeReading=null;
let shelf=readStore('haxi-shelf',[]), history=readStore('haxi-history',{});
if(!Array.isArray(shelf))shelf=[];
if(!history||typeof history!=='object'||Array.isArray(history))history={};
const books = new Map();
const baseURL = new URL('./', location.href);
const topics=[['二十四史','esss.php.html','从史记到明史，读千年兴替'],['四库全书','siku.php.html','经史子集，文脉流长'],['金庸全集','jinyong.php.html','江湖辽阔，侠义长存'],['四大名著','sdmz.php.html','重读经典，常读常新'],['历史演义','tsyy.php','读蔡东藩笔下的历代风云'],['四十禁书','ssjs.php.html','原站珍藏专题'],['名家作品','zuozhe.php.html','按作者探索原站藏书'],['长篇作品','changpian.php.html','走进一个完整的故事'],['短篇作品','duanpian.php.html','短短一篇，余味悠长']];
function cover(b){return b.cover?`<img class="cover" loading="lazy" src="${esc(b.cover)}" alt="${esc(b.title)}封面" onerror="this.replaceWith(Object.assign(document.createElement('span'),{className:'cover cover-fallback',textContent:this.alt.replace('封面','')}))">`:`<span class="cover cover-fallback" aria-hidden="true">${esc(b.title.slice(0,8))}</span>`;}
function card(b){return `<a class="book-card" href="#/book/${b.id}">${cover(b)}<div><h3>${esc(b.title)}</h3><p>${esc(b.author)}</p><span class="tag">${esc(b.category)}</span><p>${b.available.toLocaleString()} 章可读</p></div></a>`;}
function activate(name){document.querySelectorAll('[data-nav]').forEach(a=>a.classList.toggle('active',a.dataset.nav===name));}
function setTheme(dark){document.body.classList.toggle('dark',dark);$('#theme').setAttribute('aria-pressed',String(dark));save('haxi-dark',dark);}
setTheme(readStore('haxi-dark',false));
$('#theme').onclick=()=>setTheme(!document.body.classList.contains('dark'));
$('#search-form').onsubmit=e=>{e.preventDefault();location.hash='/library?q='+encodeURIComponent($('#search').value.trim());};
function library(type, params){
 activate(type==='library'?'library':type);
 const query=params.get('q')||'', category=params.get('category')||'', sort=params.get('sort')||'default';
 $('#search').value=query;
 let list=catalog.filter(b=>(!query||(b.title+' '+b.author).toLowerCase().includes(query.toLowerCase()))&&(!category||b.category===category));
 if(type==='shelf') list=list.filter(b=>shelf.includes(b.id));
 if(type==='history') list=list.filter(b=>history[b.id]).sort((a,b)=>history[b.id].time-history[a.id].time);
 if(sort==='title')list.sort((a,b)=>a.title.localeCompare(b.title,'zh-CN'));
 if(sort==='chapters')list.sort((a,b)=>b.available-a.available);
 const pages=Math.max(1,Math.ceil(list.length/24));const page=Math.max(1,Math.min(pages,parseInt(params.get('page'))||1));
 const link=(key,value)=>{const p=new URLSearchParams(params);p.set(key,value);if(key!=='page')p.delete('page');return `#/${type}?${p}`;};
 const cats=[...new Set(catalog.map(b=>b.category))];
 const heading=type==='shelf'?'我的书架':type==='history'?'最近阅读':query?`搜索「${esc(query)}」`:'探索书库';
 main.innerHTML=`${type==='library'&&!query?`<section class="hero"><div><span class="eyebrow">THE JOY OF READING</span><h1>在文字里，<br>遇见另一种生活。</h1><p>让经典留存，让故事延续。找一本好书，慢慢读。</p><div class="stats"><span><strong>${catalog.length.toLocaleString()}</strong>部藏书</span><span><strong>${report.available.toLocaleString()}</strong>章可读</span><span>本地珍藏 · 自由阅读</span></div></div><div class="hero-art" aria-hidden="true"><div class="art-book one">人间词话</div><div class="art-book two">开卷有益</div></div></section>`:''}<div class="section-title"><h2>${heading}</h2><span>${list.length.toLocaleString()} 部作品</span></div><div class="filters"><a class="chip ${!category?'active':''}" href="${esc(link('category',''))}">全部分类</a>${cats.map(c=>`<a class="chip ${category===c?'active':''}" href="${esc(link('category',c))}">${esc(c)}</a>`).join('')}</div><div class="toolbar"><span>${type==='history'?'阅读进度保存在当前浏览器':type==='shelf'?'把喜欢的故事，留在身边':'每一次翻页，都是新的相逢'}</span><label>排序 <select id="sort"><option value="default">${type==='history'?'最近阅读':'默认顺序'}</option><option value="title">书名顺序</option><option value="chapters">可读章节最多</option></select></label></div>${list.length?`<div class="grid">${list.slice((page-1)*24,page*24).map(card).join('')}</div>`:`<div class="empty">${query||category?'没有找到匹配作品，请尝试其他书名、作者或分类。':type==='shelf'?'书架还是空的，在书籍详情中点击「加入书架」即可收藏。':'暂时没有阅读记录，去书库开启一段故事吧。'}</div>`}<div class="pagination">${page>1?`<a class="button" href="${esc(link('page',page-1))}">上一页</a>`:'<span class="button" aria-disabled="true">上一页</span>'}<span>${page} / ${pages}</span>${page<pages?`<a class="button" href="${esc(link('page',page+1))}">下一页</a>`:'<span class="button" aria-disabled="true">下一页</span>'}</div>`;
 $('#sort').value=sort;$('#sort').onchange=e=>location.hash=link('sort',e.target.value).slice(1);
}
async function getBook(id){if(!books.has(id)){const r=await fetch(`app/data/books/${encodeURIComponent(id)}.json`);if(!r.ok)throw Error('这部书的目录尚未收录。');books.set(id,await r.json());}return books.get(id);}
async function detail(id, token){const b=await getBook(id);if(token!==epoch)return;currentBook=b;
 const last=history[id], first=b.chapters.find(c=>c.available), resume=last&&b.chapters.find(c=>c.file===last.file&&c.available)||first;
 main.innerHTML=`<div class="breadcrumbs"><a href="#/">书库</a> / ${esc(b.category)} / ${esc(b.title)}</div><section class="book-detail">${cover(b)}<div><span class="tag">${esc(b.category)}</span><h1>${esc(b.title)}</h1><p>${esc(b.author)} 著 · ${b.count} 章目录 · ${b.available} 章已保存${b.status?' · '+esc(b.status):''}</p><div class="actions">${resume?`<a class="button primary" href="#/read/${id}/${resume.file}">${last?'继续阅读':'开始阅读'}</a>`:'<span class="muted">下载存档未包含可读章节</span>'}<button class="button" id="save-book">${shelf.includes(id)?'移出书架':'♡ 加入书架'}</button><a class="button" href="#/archive/${encodeURIComponent(b.source)}">原始资料</a></div></div></section><section class="panel"><h2>内容简介</h2><p class="intro">${esc(b.intro||'原始存档未提供简介。')}</p></section><section class="panel"><div class="section-title"><h2>全部目录</h2><span>${b.count} 章 · 按原书顺序</span></div>${b.count>b.available?`<p class="muted">${b.count-b.available} 章在原下载中缺失，目录仍完整保留。</p>`:''}<input id="chapter-search" aria-label="筛选章节" placeholder="查找章节…"><div id="chapters" class="chapter-grid"></div></section>`;
 $('#save-book').onclick=()=>{shelf=shelf.includes(id)?shelf.filter(x=>x!==id):[...shelf,id];save('haxi-shelf',shelf);$('#save-book').textContent=shelf.includes(id)?'移出书架':'♡ 加入书架';};
 const render=()=>{$('#chapters').innerHTML=b.chapters.filter(c=>c.title.includes($('#chapter-search').value)).map(c=>c.volume?`<h3 class="volume">${esc(c.title)}</h3>`:`<a class="${c.available?'':'missing'}" href="#/read/${id}/${c.file}">${esc(c.title)}${c.available?'':'（存档缺失）'}</a>`).join('')||'<p>未找到对应章节。</p>';};$('#chapter-search').oninput=render;render();
}
async function source(path){
 const local=new URL(path,baseURL);
 if(local.origin!==baseURL.origin||!local.pathname.startsWith(baseURL.pathname))throw Error('无效的本地路径。');
 const config=window.HAXI_CONFIG||{};
 const archived=Array.isArray(config.archiveBases)&&config.archiveBases.length&&!['archive-index.html','previous-site-index.html'].includes(path);
 const candidates=archived?config.archiveBases.map(base=>new URL(path,base)): [local];
 let r;
 for(const url of candidates){
  try{r=await fetch(url,{credentials:archived?'omit':'same-origin',signal:AbortSignal.timeout(20000)});if(r.ok)break;
   if(url.pathname.endsWith('.html')){const fallback=new URL(url);fallback.pathname=fallback.pathname.slice(0,-5);r=await fetch(fallback,{credentials:archived?'omit':'same-origin',signal:AbortSignal.timeout(20000)});if(r.ok)break;}
  }catch{r=null;}
 }
 if(!r?.ok)throw Error(archived?'无法读取 GitHub 原始存档，请检查网络连接后重试。':'原始下载中没有保存此页面。');
 const bytes=await r.arrayBuffer();let html,damaged=false;
 try{html=new TextDecoder('utf-8',{fatal:true}).decode(bytes);}catch{try{html=new TextDecoder('gb18030',{fatal:true}).decode(bytes);}catch{html=new TextDecoder('gb18030').decode(bytes);damaged=true;}}
 const doc=new DOMParser().parseFromString(html,'text/html');doc.documentElement.dataset.damaged=String(damaged);return doc;
}
function oldLink(href,path,label=''){
 const title=label.trim().replace(/《|》/g,'');
 const byTitle=()=>{const matches=catalog.filter(b=>b.title===title);return matches.length===1?'#/book/'+matches[0].id:null;};
 if(!href)return byTitle();
 if(href.startsWith('#'))return href;
 let u;try{u=new URL(href.trim(),new URL(path,baseURL));}catch{return byTitle();}
 if(!['http:','https:'].includes(u.protocol))return null;
 const local=u.origin===baseURL.origin||/^(www\.|m\.)?haxi(?:lu|88|99)\.com$/.test(u.hostname);
 if(!local)return byTitle()||u.href;
 let p=u.origin===baseURL.origin?(u.pathname.startsWith(baseURL.pathname)?u.pathname.slice(baseURL.pathname.length):u.pathname.replace(/^\//,'')):u.pathname.replace(/^\//,'');
 p=p.replace(/^(?:www\.haxilu\.com\/)+/,'');
 if(!p||p==='index.html')return '#/';
 const t=topics.find(t=>t[1].replace(/\.html$/,'')===p.replace(/\.html$/,''));
 if(t)return '#/topic/'+t[1].split('.')[0];
 let m=p.match(/files\/article\/(?:info|html)\/(?:\d+\/)+(\d+)(?:\.htm|\/index.html)$/);
 if(m)return catalog.some(b=>b.id===m[1])?'#/book/'+m[1]:byTitle()||'#/book/'+m[1];
 m=p.match(/files\/article\/html\/(?:\d+\/)+(\d+)\/(\d+\.html?)$/);if(m)return '#/read/'+m[1]+'/'+m[2];
 const q=new URLSearchParams(u.search);
 if(p.startsWith('modules/article/')){
  if(/articleinfo/.test(p)&&q.get('id'))return catalog.some(b=>b.id===q.get('id'))?'#/book/'+q.get('id'):byTitle()||'#/book/'+q.get('id');
  if(/authorarticle/.test(p)&&q.get('author'))return '#/library?q='+encodeURIComponent(q.get('author'));
  if(/reader/.test(p)&&q.get('aid'))return q.get('cid')?'#/read/'+q.get('aid')+'/'+q.get('cid')+'.html':'#/book/'+q.get('aid');
  if(u.search)p+='_'+u.search.slice(1)+'.html';
 }
 const categories={1:'玄幻魔法',2:'武侠修真',3:'都市言情',4:'历史军事',5:'侦探推理',6:'网游动漫',7:'科幻小说',8:'恐怖灵异',9:'文学名著',10:'其他类型',20:'肉文辣文'};
 m=p.match(/^xiaoshuo\/(\d+)(?:\/\d+)?\.htm$/);
 if(m&&categories[m[1]])return '#/library?category='+encodeURIComponent(categories[m[1]]);
 // Some original links contain a title entity instead of a URL.
 return byTitle()||'#/archive/'+encodeURIComponent(p);
}
function clean(node,path){
 const result=document.createElement('div');
 const allowed=new Set('P BR DIV SPAN B STRONG EM I U H1 H2 H3 H4 H5 H6 UL OL LI DL DT DD BLOCKQUOTE PRE CODE TABLE THEAD TBODY TR TD TH HR A IMG SUP SUB'.split(' '));
 function walk(n,parent){if(n.nodeType===3){parent.append(document.createTextNode(n.textContent));return;}if(n.nodeType!==1)return;if(['SCRIPT','STYLE','IFRAME','OBJECT','EMBED','LINK','META','SVG','MATH','TEMPLATE'].includes(n.tagName))return;
 if(!allowed.has(n.tagName)){for(const c of n.childNodes)walk(c,parent);return;}
 const el=document.createElement(n.tagName.toLowerCase());
 if(n.tagName==='A'){const link=oldLink(n.getAttribute('href'),path,n.textContent);if(link){el.setAttribute('href',link);if(!link.startsWith('#')){el.target='_blank';el.rel='noopener noreferrer';}}}
 if(['TD','TH'].includes(n.tagName)){for(const attr of ['colspan','rowspan']){const value=Number(n.getAttribute(attr));if(value>1&&value<=20)el.setAttribute(attr,String(value));}}
 if(n.tagName==='IMG'){const raw=n.getAttribute('src')||'';try{const u=new URL(raw,new URL(path,baseURL));const own=u.origin===baseURL.origin;const old=/^(www\.|m\.)?haxi(?:lu|88|99)\.com$/.test(u.hostname);if(own||old){el.src=own&&u.pathname.startsWith(baseURL.pathname)?u.href:new URL(u.pathname.replace(/^\//,''),baseURL).href;el.alt=n.getAttribute('alt')||'';el.loading='lazy';}}catch{}}
 for(const c of n.childNodes)walk(c,el);parent.append(el);}
 for(const c of node.childNodes)walk(c,result);return result;
}
function chapterNavigation(b,file){
 const chapters=b.chapters.filter(c=>c.file),i=chapters.findIndex(c=>c.file===file);
 const prev=chapters[i-1],next=chapters[i+1];
 return `<div class="pagination">${prev?`<a class="button" href="#/read/${b.id}/${prev.file}">← 上一章</a>`:'<span class="muted">已是第一章</span>'}<a class="button" href="#/book/${b.id}">全部目录</a>${next?`<a class="button" href="#/read/${b.id}/${next.file}">下一章 →</a>`:'<span class="muted">已是最后一章</span>'}</div>`;
}
async function reader(id,file,token){const b=await getBook(id);const chapter=b.chapters.find(c=>c.file===file);if(!chapter)throw Error('目录中没有这个章节。');if(token!==epoch)return;currentBook=b;
 if(!chapter.available){const nextSaved=b.chapters.slice(b.chapters.indexOf(chapter)+1).find(c=>c.available);main.innerHTML=`<div class="error"><h2>这一章没有下载到存档中</h2><p>《${esc(b.title)}》 · ${esc(chapter.title)}</p><p>原目录保留了章节名称，但原项目没有相应正文文件。</p><a class="button" href="#/book/${id}">返回目录</a> ${nextSaved?`<a class="button primary" href="#/read/${id}/${nextSaved.file}">跳至下一个已保存章节</a>`:''}</div>${chapterNavigation(b,file)}`;return;}
 const path=b.base+'/'+file, doc=await source(path);if(token!==epoch)return;
 const content=doc.querySelector('#BookText, #content, .read-content');
 if(!content){main.innerHTML=`<div class="error"><h2>原始章节结构异常</h2><p>以下保留原始页面中可恢复的全部文字。</p><a class="button" href="#/book/${id}">返回目录</a></div><section class="panel archive" id="recovered"></section>`;$('#recovered').append(clean(pruneLegacy(doc.body),path));return;}
 const actual=b.chapters.filter(c=>c.file),i=actual.findIndex(c=>c.file===file);
 const nav=()=>chapterNavigation(b,file);
 main.innerHTML=`<article class="reader"><div class="breadcrumbs"><a href="#/">书库</a> / <a href="#/book/${id}">${esc(b.title)}</a></div><div class="reader-tools"><a href="#/book/${id}">☷ 目录 · ${i+1}/${actual.length}</a><div><button class="button" id="font-down" aria-label="缩小字号">A−</button> <button class="button" id="font-up" aria-label="增大字号">A＋</button></div></div><h1>${esc(chapter.title)}</h1>${doc.documentElement.dataset.damaged==='true'?'<p class="error">原始文件有损坏字节，以下保留可恢复的文字。</p>':''}<div class="reader-text" id="reading-content"></div>${nav()}</article>`;
 $('#reading-content').append(clean(content,path));
 let size=Math.min(32,Math.max(16,Number(readStore('haxi-font',20))||20));const font=()=>{document.documentElement.style.setProperty('--reader-size',size+'px');save('haxi-font',size);};font();$('#font-down').onclick=()=>{size=Math.max(16,size-2);font();};$('#font-up').onclick=()=>{size=Math.min(32,size+2);font();};
 const position=history[id]?.file===file?history[id].position||0:0;
 history[id]={file,title:chapter.title,time:Date.now(),position};save('haxi-history',history);
 requestAnimationFrame(()=>{if(token!==epoch)return;if(position)window.scrollTo(0,position);activeReading={id,file};});
}
function pruneLegacy(node){
 const copy=node.cloneNode(true);
 copy.querySelectorAll('script,style,iframe,form,#header,#footer,#topbar,#subnav,#headbar,.m_head,.m_menu,.m_foot,#copyright,#bdshare,.bdshare_t,.share,.usercss,.bookset,.book-link,.crumbs,#head-plus,.pages,.pagelink').forEach(n=>n.remove());
 // Old templates sometimes put real book tables inside an advertising wrapper.
 copy.querySelectorAll('#adbottom').forEach(n=>{if(!n.querySelector('a[href]'))n.remove();});
 return copy;
}
function topicFor(path){return topics.find(t=>t[1].replace(/\.html$/,'')===path.replace(/\.html$/,''));}
async function topicPage(topic,token){
 const [name,path,description]=topic,doc=await source(path);if(token!==epoch)return;
 const original=doc.querySelector('#content');if(!original)throw Error('此专题的内容结构异常，请稍后重试。');
 const content=pruneLegacy(original),titleRow=content.querySelector('table.grid > tbody > tr, table.grid > tr');
 const originalTitle=titleRow?.querySelector('th')?.textContent.trim();
 if(originalTitle)titleRow.remove();
 main.innerHTML=`<div class="breadcrumbs"><a href="#/topics">经典专题</a> / ${esc(name)}</div><section class="collection-header"><span class="eyebrow">COLLECTION</span><h1>${esc(name)}</h1><p class="muted">${esc(description)}</p>${originalTitle&&originalTitle!==name?`<p class="muted">${esc(originalTitle)}</p>`:''}</section><section class="panel topic-content" id="topic-body"></section>`;
 const output=$('#topic-body');
 // Lift the original cells into responsive groups; keep every introduction and entry.
 const tables=[...content.querySelectorAll('table.acss')];
 for(const table of tables){
  const section=document.createElement('section');section.className='collection-sections';
  let grid=null;
  for(const row of table.querySelectorAll(':scope > tbody > tr, :scope > tr')){
   for(const cell of row.querySelectorAll(':scope > td, :scope > th')){
    if(!cell.textContent.trim()&&!cell.querySelector('img'))continue;
    const entry=cell.classList.contains('ccss');
    if(entry){if(!grid){grid=document.createElement('div');grid.className='collection-grid';section.append(grid);}const item=document.createElement('div');item.className='collection-entry';item.append(clean(cell,path));grid.append(item);}
    else{grid=null;const note=document.createElement(cell.textContent.trim().length<35&&!cell.querySelector('a')?'h2':'div');note.className='collection-note';note.append(clean(cell,path));section.append(note);}
   }
  }
  // Replace the old table before the final sanitization; presentation classes are applied below.
  table.replaceWith(section);
 }
 function appendPart(node,parent){
  if(node.nodeType===1&&!node.textContent.trim()&&!node.querySelector('img,.collection-sections'))return;
  if(node.nodeType===1&&['collection-sections','collection-grid','collection-entry','collection-note'].includes(node.className)){
   const el=document.createElement(node.tagName.toLowerCase());el.className=node.className;
   for(const child of node.childNodes)appendPart(child,el);parent.append(el);
  }else if(node.nodeType===1&&node.querySelector('.collection-sections')){
   // Discard the outer layout table while preserving other book metadata tables.
   for(const child of node.childNodes)appendPart(child,parent);
  }else if(node.nodeType===1){const wrapper=document.createElement('div');wrapper.append(node.cloneNode(true));parent.append(clean(wrapper,path));}
  else if(node.nodeType===3&&node.textContent.trim())parent.append(document.createTextNode(node.textContent));
 }
 for(const child of content.childNodes)appendPart(child,output);
 for(const entry of output.querySelectorAll('.collection-entry')){
  if(!entry.textContent.trim()){
   const img=entry.querySelector('img');const coverId=img?.src.match(/image\/\d+\/(\d+)\/\d+s\.jpg$/)?.[1];const book=catalog.find(b=>b.id===coverId);
   if(book){entry.querySelectorAll('a').forEach(a=>a.remove());const link=document.createElement('a');link.href='#/book/'+book.id;while(entry.firstChild)link.append(entry.firstChild);const title=document.createElement('span');title.textContent=book.title;link.append(title);entry.append(link);}
  }
  let link=entry.querySelector('a[href]');
  if(!link){const title=entry.textContent.trim();const matches=catalog.filter(b=>b.title===title);if(matches.length===1){link=document.createElement('a');link.href='#/book/'+matches[0].id;while(entry.firstChild)link.append(entry.firstChild);entry.append(link);}}
  const id=link?.getAttribute('href')?.match(/^#\/book\/(\d+)$/)?.[1];
  if(!link||(id&&!catalog.some(b=>b.id===id))){
   if(link){const title=link.textContent.trim();link.href='#/unavailable?title='+encodeURIComponent(title);}
   const note=document.createElement('span');note.className='collection-status';note.textContent=link?'原存档未收录':'原页未提供可用链接';entry.append(note);
  }
 }
 for(const table of output.querySelectorAll('table')){
  const headings=[...table.querySelectorAll('th')].map(n=>n.textContent.trim()).filter(Boolean);
  const rows=[...table.querySelectorAll('tr')].map(r=>[...r.children].filter(n=>n.tagName==='TD')).filter(cells=>cells.length===headings.length&&cells.length>1);
  if(!rows.length)continue;
  const list=document.createElement('div');list.className='collection-record-list';
  for(const cells of rows){const item=document.createElement('article');item.className='collection-record';const title=document.createElement('h2');while(cells[0].firstChild)title.append(cells[0].firstChild);item.append(title);const fields=document.createElement('dl');for(let i=1;i<cells.length;i++){const field=document.createElement('div');const label=document.createElement('dt');label.textContent=headings[i];const value=document.createElement('dd');while(cells[i].firstChild)value.append(cells[i].firstChild);field.append(label,value);fields.append(field);}item.append(fields);list.append(item);}
  table.replaceWith(list);
 }
 activate('topics');document.title=name+' · 哈西书库';
}
async function archive(path,token){
 path=decodeURIComponent(path);const topic=topicFor(path);if(topic)return topicPage(topic,token);
 const doc=await source(path);if(token!==epoch)return;
 main.innerHTML=`<div class="breadcrumbs"><a href="#/">书库</a> / 原站资料</div><h1>${esc(doc.title||'原站资料')}</h1><section class="panel archive" id="archive-body"></section>`;
 $('#archive-body').append(clean(pruneLegacy(doc.querySelector('#content')||doc.body),path));
}
function persistReading(){
 if(activeReading&&history[activeReading.id]?.file===activeReading.file){history[activeReading.id].position=window.scrollY;save('haxi-history',history);}
}

async function route(){if(!ready)return;persistReading();clearTimeout(scrollTimer);activeReading=null;const token=++epoch;currentBook=null;window.scrollTo(0,0);const raw=location.hash.slice(1)||'/';const [path,query]=raw.split('?');const parts=path.split('/').filter(Boolean);const type=parts[0]||'library';activate(type==='book'||type==='read'?'library':type==='topic'?'topics':type);main.innerHTML='<p class="muted">正在打开书页…</p>';
 try{if(['library','shelf','history'].includes(type))library(type,new URLSearchParams(query));else if(type==='book')await detail(parts[1],token);else if(type==='read')await reader(parts[1],parts[2],token);else if(type==='topics'){main.innerHTML=`<div class="section-title"><h2>经典专题</h2><span>保留原站编排与全部内容</span></div><div class="topic-grid">${topics.map(([name,path,desc])=>`<a class="topic" href="#/topic/${path.split('.')[0]}"><span class="eyebrow">COLLECTION</span><h2>${name} ↗</h2><p class="muted">${desc}</p></a>`).join('')}</div>`;}else if(type==='unavailable'){const title=new URLSearchParams(query).get('title')||'这部作品';main.innerHTML=`<div class="empty"><h1>${esc(title)}</h1><p>原专题保留了这部作品的名称，但现有书库中没有找到对应的存档。</p><a class="button" href="#/topics">返回经典专题</a> <a class="button primary" href="#/library?q=${encodeURIComponent(title)}">搜索相关作品</a></div>`;}else if(type==='topic'){const topic=topics.find(t=>t[1].split('.')[0]===parts[1]);if(!topic)throw Error('没有找到这个专题。');await topicPage(topic,token);}else if(type==='archive')await archive(parts.slice(1).join('/'),token);else throw Error('没有找到这个页面。');
 if(token===epoch&&type!=='topic'&&!(type==='archive'&&topicFor(decodeURIComponent(parts.slice(1).join('/')))))document.title=(currentBook?currentBook.title+' · ':'')+'哈西书库';
 }catch(e){if(token!==epoch)return;main.innerHTML=`<div class="error"><h2>暂时无法打开</h2><p>${esc(e.message)}</p><a class="button" href="#/">返回书库</a> <button class="button" id="retry">重新加载</button></div>`;$('#retry')?.addEventListener('click',route);}}
let scrollTimer;window.addEventListener('scroll',()=>{clearTimeout(scrollTimer);scrollTimer=setTimeout(persistReading,150);},{passive:true});
window.addEventListener('pagehide',persistReading);
window.addEventListener('hashchange',route);
async function initialize(){
 main.innerHTML='<p class="muted">正在打开书库…</p>';
 try{
  const results=await Promise.all(['catalog','report'].map(async name=>{const r=await fetch(`app/data/${name}.json`);if(!r.ok)throw Error('书库目录暂时无法读取。');return r.json();}));
  [catalog,report]=results;ready=true;await route();
 }catch{
  main.innerHTML='<div class="error"><h2>书库暂时无法加载</h2><p>请检查网络连接后重试。</p><button class="button" id="reload-library">重新加载</button></div>';
  $('#reload-library').onclick=initialize;
 }
}
initialize();
