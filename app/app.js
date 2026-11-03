'use strict';
const $ = s => document.querySelector(s);
const main = $('#main');
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const readStore = (k, fallback) => {try {return JSON.parse(localStorage.getItem(k)) ?? fallback;} catch {return fallback;}};
const save = (k,v) => {try {localStorage.setItem(k,JSON.stringify(v));} catch {}};
let catalog=[], report={}, epoch=0, currentBook=null;
let shelf=readStore('haxi-shelf',[]), history=readStore('haxi-history',{});
const books = new Map();
const baseURL = new URL('./', location.href);
const topics=[['二十四史','esss.php.html','从史记到明史，读千年兴替'],['四库全书','siku.php.html','经史子集，文脉流长'],['金庸全集','jinyong.php.html','江湖辽阔，侠义长存'],['四大名著','sdmz.php.html','重读经典，常读常新'],['四十禁书','ssjs.php.html','原站珍藏专题'],['名家作品','zuozhe.php.html','按作者探索原站藏书'],['长篇作品','changpian.php.html','走进一个完整的故事'],['短篇作品','duanpian.php.html','短短一篇，余味悠长']];
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
 main.innerHTML=`${type==='library'&&!query?`<section class="hero"><div><span class="eyebrow">THE JOY OF READING</span><h1>在文字里，<br>遇见另一种生活。</h1><p>让经典留存，让故事延续。找一本好书，慢慢读。</p><div class="stats"><span><strong>${catalog.length.toLocaleString()}</strong>部藏书</span><span><strong>${report.available.toLocaleString()}</strong>章可读</span><span>本地珍藏 · 自由阅读</span></div></div><div class="hero-art" aria-hidden="true"><div class="art-book one">人间词话</div><div class="art-book two">开卷有益</div></div></section>`:''}<div class="section-title"><h2>${heading}</h2><span>${list.length.toLocaleString()} 部作品</span></div><div class="filters"><a class="chip ${!category?'active':''}" href="${esc(link('category',''))}">全部分类</a>${cats.map(c=>`<a class="chip ${category===c?'active':''}" href="${esc(link('category',c))}">${esc(c)}</a>`).join('')}</div><div class="toolbar"><span>${type==='history'?'阅读进度保存在当前浏览器':type==='shelf'?'把喜欢的故事，留在身边':'每一次翻页，都是新的相逢'}</span><label>排序 <select id="sort"><option value="default">${type==='history'?'最近阅读':'默认顺序'}</option><option value="title">书名顺序</option><option value="chapters">可读章节最多</option></select></label></div>${list.length?`<div class="grid">${list.slice((page-1)*24,page*24).map(card).join('')}</div>`:`<div class="empty">${query?'没有找到匹配作品，请尝试其他书名或作者。':type==='shelf'?'书架还是空的，在书籍详情中点击「加入书架」即可收藏。':'暂时没有阅读记录，去书库开启一段故事吧。'}</div>`}<div class="pagination"><a class="button" href="${esc(link('page',Math.max(1,page-1)))}">上一页</a><span>${page} / ${pages}</span><a class="button" href="${esc(link('page',Math.min(pages,page+1)))}">下一页</a></div>`;
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
  try{r=await fetch(url,{credentials:archived?'omit':'same-origin'});if(r.ok)break;
   if(url.pathname.endsWith('.html')){const fallback=new URL(url);fallback.pathname=fallback.pathname.slice(0,-5);r=await fetch(fallback,{credentials:archived?'omit':'same-origin'});if(r.ok)break;}
  }catch{r=null;}
 }
 if(!r?.ok)throw Error(archived?'无法读取 GitHub 原始存档，请检查网络连接后重试。':'原始下载中没有保存此页面。');
 const bytes=await r.arrayBuffer();let html,damaged=false;
 try{html=new TextDecoder('utf-8',{fatal:true}).decode(bytes);}catch{try{html=new TextDecoder('gb18030',{fatal:true}).decode(bytes);}catch{html=new TextDecoder('gb18030').decode(bytes);damaged=true;}}
 const doc=new DOMParser().parseFromString(html,'text/html');doc.documentElement.dataset.damaged=String(damaged);return doc;
}
function oldLink(href,path){
 if(!href||href.startsWith('#'))return null;
 let u;try{u=new URL(href.trim(),new URL(path,baseURL));}catch{return null;}
 if(!['http:','https:'].includes(u.protocol))return null;
 const local=u.origin===baseURL.origin||/^(www\.|m\.)?haxi(?:lu|88|99)\.com$/.test(u.hostname);
 if(!local)return u.href;
 let p=u.origin===baseURL.origin?(u.pathname.startsWith(baseURL.pathname)?u.pathname.slice(baseURL.pathname.length):u.pathname.replace(/^\//,'')):u.pathname.replace(/^\//,'');
 if(!p||p==='index.html')return '#/';
 let m=p.match(/files\/article\/(?:info|html)\/\d+\/(\d+)(?:\.htm|\/index.html)$/);
 if(m)return '#/book/'+m[1];
 m=p.match(/files\/article\/html\/\d+\/(\d+)\/(\d+\.html?)$/);if(m)return '#/read/'+m[1]+'/'+m[2];
 if(p.startsWith('modules/article/')&&u.search){const q=new URLSearchParams(u.search);if(/articleinfo/.test(p)&&q.get('id'))return '#/book/'+q.get('id');p+='_'+u.search.slice(1)+'.html';}
 return '#/archive/'+encodeURIComponent(p);
}
function clean(node,path){
 const result=document.createElement('div');
 const allowed=new Set('P BR DIV SPAN B STRONG EM I U H1 H2 H3 H4 H5 H6 UL OL LI DL DT DD BLOCKQUOTE PRE CODE TABLE THEAD TBODY TR TD TH HR A IMG SUP SUB'.split(' '));
 function walk(n,parent){if(n.nodeType===3){parent.append(document.createTextNode(n.textContent));return;}if(n.nodeType!==1)return;if(['SCRIPT','STYLE','IFRAME','OBJECT','EMBED','LINK','META','SVG','MATH','TEMPLATE'].includes(n.tagName))return;
 if(!allowed.has(n.tagName)){for(const c of n.childNodes)walk(c,parent);return;}
 const el=document.createElement(n.tagName.toLowerCase());
 if(n.tagName==='A'){const link=oldLink(n.getAttribute('href'),path);if(link){el.setAttribute('href',link);if(!link.startsWith('#')){el.target='_blank';el.rel='noopener noreferrer';}}}
 if(n.tagName==='IMG'){const raw=n.getAttribute('src')||'';try{const u=new URL(raw,new URL(path,baseURL));const own=u.origin===baseURL.origin;const old=/^(www\.|m\.)?haxi(?:lu|88|99)\.com$/.test(u.hostname);if(own||old){el.src=own&&u.pathname.startsWith(baseURL.pathname)?u.href:new URL(u.pathname.replace(/^\//,''),baseURL).href;el.alt=n.getAttribute('alt')||'';el.loading='lazy';}}catch{}}
 for(const c of n.childNodes)walk(c,el);parent.append(el);}
 for(const c of node.childNodes)walk(c,result);return result;
}
async function reader(id,file,token){const b=await getBook(id);const chapter=b.chapters.find(c=>c.file===file);if(!chapter)throw Error('目录中没有这个章节。');if(token!==epoch)return;currentBook=b;
 if(!chapter.available){main.innerHTML=`<div class="error"><h2>这一章没有下载到存档中</h2><p>《${esc(b.title)}》 · ${esc(chapter.title)}</p><p>原目录保留了章节名称，但原项目没有相应正文文件。</p><a class="button" href="#/book/${id}">返回目录</a></div>`;return;}
 const path=b.base+'/'+file, doc=await source(path);if(token!==epoch)return;
 const content=doc.querySelector('#BookText, #content, .read-content');
 if(!content){main.innerHTML=`<div class="error"><h2>原始章节结构异常</h2><p>以下保留原始页面中可恢复的全部文字。</p><a class="button" href="#/book/${id}">返回目录</a></div><section class="panel archive" id="recovered"></section>`;$('#recovered').append(clean(doc.body,path));return;}
 const actual=b.chapters.filter(c=>c.file),i=actual.findIndex(c=>c.file===file);
 const prev=actual[i-1],next=actual[i+1];
 const nav=()=>`<div class="pagination">${prev?`<a class="button" href="#/read/${id}/${prev.file}">← 上一章</a>`:'<span>已是第一章</span>'}<a class="button" href="#/book/${id}">全部目录</a>${next?`<a class="button" href="#/read/${id}/${next.file}">下一章 →</a>`:'<span>已是最后一章</span>'}</div>`;
 main.innerHTML=`<article class="reader"><div class="breadcrumbs"><a href="#/">书库</a> / <a href="#/book/${id}">${esc(b.title)}</a></div><div class="reader-tools"><a href="#/book/${id}">☷ 目录 · ${i+1}/${actual.length}</a><div><button class="button" id="font-down" aria-label="缩小字号">A−</button> <button class="button" id="font-up" aria-label="增大字号">A＋</button></div></div><h1>${esc(chapter.title)}</h1>${doc.documentElement.dataset.damaged==='true'?'<p class="error">原始文件有损坏字节，以下保留可恢复的文字。</p>':''}<div class="reader-text" id="reading-content"></div>${nav()}</article>`;
 $('#reading-content').append(clean(content,path));
 let size=Number(readStore('haxi-font',20));const font=()=>{document.documentElement.style.setProperty('--reader-size',size+'px');save('haxi-font',size);};font();$('#font-down').onclick=()=>{size=Math.max(16,size-2);font();};$('#font-up').onclick=()=>{size=Math.min(32,size+2);font();};
 const position=history[id]?.file===file?history[id].position||0:0;
 history[id]={file,title:chapter.title,time:Date.now(),position};save('haxi-history',history);
 if(position)requestAnimationFrame(()=>{if(token===epoch)window.scrollTo(0,position);});
}
async function archive(path,token){path=decodeURIComponent(path);const doc=await source(path);if(token!==epoch)return;main.innerHTML=`<div class="breadcrumbs"><a href="#/">书库</a> / 原站存档</div><h1>${esc(doc.title||'原站存档')}</h1><p class="muted">完整保留原页文字和链接。此处为历史静态资料，登录、投稿等原站服务不提供本地功能。</p><section class="panel archive" id="archive-body"></section>`;$('#archive-body').append(clean(doc.body,path));}
async function route(){const token=++epoch;currentBook=null;window.scrollTo(0,0);const raw=location.hash.slice(1)||'/';const [path,query]=raw.split('?');const parts=path.split('/').filter(Boolean);const type=parts[0]||'library';activate(type==='book'||type==='read'?'library':type);main.innerHTML='<p class="muted">正在打开书页…</p>';
 try{if(['library','shelf','history'].includes(type))library(type,new URLSearchParams(query));else if(type==='book')await detail(parts[1],token);else if(type==='read')await reader(parts[1],parts[2],token);else if(type==='topics'){main.innerHTML=`<div class="section-title"><h2>经典专题</h2><span>保留原站编排与全部内容</span></div><div class="topic-grid">${topics.map(([name,path,desc])=>`<a class="topic" href="#/archive/${encodeURIComponent(path)}"><span class="eyebrow">COLLECTION</span><h2>${name} ↗</h2><p class="muted">${desc}</p></a>`).join('')}</div>`;}else if(type==='archive')await archive(parts.slice(1).join('/'),token);else throw Error('没有找到这个页面。');
 if(token===epoch)document.title=(currentBook?currentBook.title+' · ':'')+'哈西书库';
 }catch(e){if(token===epoch)main.innerHTML=`<div class="error"><h2>暂时无法打开</h2><p>${esc(e.message)}</p><a class="button" href="#/">返回书库</a> <button class="button" id="retry">重新加载</button></div>`;$('#retry')?.addEventListener('click',route);}}
let scrollTimer;window.addEventListener('scroll',()=>{clearTimeout(scrollTimer);scrollTimer=setTimeout(()=>{const p=location.hash.match(/^#\/read\/(\d+)\/([^/?]+)/);if(p&&history[p[1]]?.file===p[2]){history[p[1]].position=window.scrollY;save('haxi-history',history);}},150);},{passive:true});
window.addEventListener('hashchange',route);
(async()=>{try{const results=await Promise.all(['catalog','report'].map(async name=>{const r=await fetch(`app/data/${name}.json`);if(!r.ok)throw Error('书库索引缺失，请先运行 python tools/build_catalog.py');return r.json();}));[catalog,report]=results;await route();}catch(e){main.innerHTML=`<div class="error">${esc(e.message)}。请通过本地 HTTP 服务访问，例如 python -m http.server 8000。</div>`;}})();
