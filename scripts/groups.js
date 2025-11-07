// groups.js — simple client-side groups & posts demo using localStorage
// Keys used: mm_groups, mm_group_posts

(function(global){
  function _getGroups(){ return JSON.parse(localStorage.getItem('mm_groups')||'[]'); }
  function _saveGroups(g){ localStorage.setItem('mm_groups', JSON.stringify(g)); }
  function _getPosts(){ return JSON.parse(localStorage.getItem('mm_group_posts')||'[]'); }
  function _savePosts(p){ localStorage.setItem('mm_group_posts', JSON.stringify(p)); }

  function uid(prefix){ return (prefix||'id') + '-' + Date.now().toString(36) + '-' + Math.floor(Math.random()*1000).toString(36); }

  function escapeHtml(s){ return (s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/\"/g,'&quot;'); }

  function renderGroupsList(){
    const listEl = document.getElementById('groups-list');
    const myEl = document.getElementById('my-groups');
    if(!listEl) return;
    const groups = _getGroups().slice().reverse();
    if(groups.length===0){ listEl.innerHTML='目前没有小组，成为第一个创建者吧！'; myEl.innerHTML='暂无'; return; }
    listEl.innerHTML='';
    groups.forEach(g=>{
      const a = document.createElement('a'); a.href='#'; a.textContent = g.name + (g.desc?(' — '+g.desc):'');
      a.dataset.gid = g.id;
      a.addEventListener('click', function(e){ e.preventDefault(); selectGroup(g.id); });
      listEl.appendChild(a);
    });
    // my groups (groups created by current user)
    const cur = siteAuth.getCurrentUser();
    if(cur){
      const mine = groups.filter(x=>x.creator===cur.username);
      if(mine.length>0){ myEl.innerHTML=''; mine.forEach(g=>{
        const a = document.createElement('a'); a.href='#'; a.textContent = g.name; a.dataset.gid=g.id;
        a.addEventListener('click', function(e){ e.preventDefault(); selectGroup(g.id); });
        myEl.appendChild(a);
      });
      } else { myEl.innerHTML='（尚未加入或创建小组）'; }
    } else { myEl.innerHTML='（请登录以创建/加入小组）'; }
  }

  function renderGroupHeader(group){
    const header = document.getElementById('group-header');
    if(!header) return;
    if(!group){ header.textContent = '请选择一个小组以查看讨论'; return; }
    header.innerHTML = `<strong>${escapeHtml(group.name)}</strong> <span class="meta">${group.desc?escapeHtml(group.desc):''}</span> <div style="color:#888; font-size:13px; margin-top:6px">创建者：${escapeHtml(group.creator)} · ${new Date(group.createdAt).toLocaleString()}</div>`;
  }

  function renderPostsFor(groupId){
    const container = document.getElementById('group-posts');
    const composeBox = document.getElementById('group-compose');
    if(!container) return;
    container.innerHTML='';
    if(!groupId){ renderGroupHeader(null); if(composeBox) composeBox.style.display='none'; return; }
    const groups = _getGroups();
    const group = groups.find(g=>g.id===groupId);
    renderGroupHeader(group);
    const posts = _getPosts().filter(p=>p.groupId===groupId).sort((a,b)=>new Date(b.time)-new Date(a.time));
    if(posts.length===0){ container.innerHTML = '<div class="box">暂无讨论，成为第一个发帖的人吧！</div>'; }
    else {
      posts.forEach(p=>{
        const div = document.createElement('div'); div.className='post';
        div.innerHTML = `<div class="post-meta"><strong><a href="profile.html?user=${encodeURIComponent(p.author)}">${escapeHtml(p.author)}</a></strong> · <span class="time">${new Date(p.time).toLocaleString()}</span></div><div class="post-text">${escapeHtml(p.title)}</div><div style="margin-top:8px;color:#444">${escapeHtml(p.content)}</div>`;
        container.appendChild(div);
      });
    }
    // show compose if logged-in
    const cur = siteAuth.getCurrentUser();
    if(cur){ if(composeBox) composeBox.style.display='block'; }
    else { if(composeBox) composeBox.style.display='none'; }
  }

  // currently selected group id
  let currentGroupId = null;
  function selectGroup(gid){ currentGroupId = gid; renderPostsFor(gid); }

  function wireCreateGroup(){
    const form = document.getElementById('create-group-form'); if(!form) return;
    form.addEventListener('submit', function(e){ e.preventDefault();
      const cur = siteAuth.getCurrentUser(); if(!cur){ alert('请先登录以创建小组'); window.location.href='login.html'; return; }
      const name = document.getElementById('group-name').value.trim();
      const desc = document.getElementById('group-desc').value.trim();
      if(!name){ alert('请输入小组名称'); return; }
      const groups = _getGroups();
      const newG = { id: uid('g'), name, desc, creator: cur.username, createdAt: new Date().toISOString() };
      groups.push(newG); _saveGroups(groups);
      document.getElementById('group-name').value=''; document.getElementById('group-desc').value='';
      renderGroupsList();
      // auto-select new group
      selectGroup(newG.id);
    });
  }

  function wirePostForm(){
    const form = document.getElementById('post-form'); if(!form) return;
    form.addEventListener('submit', function(e){ e.preventDefault();
      const cur = siteAuth.getCurrentUser(); if(!cur){ alert('请先登录以发帖'); window.location.href='login.html'; return; }
      if(!currentGroupId){ alert('请先选择一个小组'); return; }
      const title = document.getElementById('post-title').value.trim();
      const content = document.getElementById('post-content').value.trim();
      if(!title || !content){ alert('标题和内容不能为空'); return; }
      const posts = _getPosts();
      posts.push({ id: uid('p'), groupId: currentGroupId, author: cur.username, title, content, time: new Date().toISOString() });
      _savePosts(posts);
      document.getElementById('post-title').value=''; document.getElementById('post-content').value='';
      renderPostsFor(currentGroupId);
    });
  }

  function init(){
    // ensure some demo groups exist (if none)
    if(_getGroups().length===0){
      _saveGroups([
        { id: 'g-sample-1', name: '黑泽明影迷', desc: '讨论黑泽明的作品与风格', creator: 'system', createdAt: new Date().toISOString() },
        { id: 'g-sample-2', name: '诺兰狂热者', desc: '分享诺兰电影与解析', creator: 'system', createdAt: new Date().toISOString() }
      ]);
    }
    renderGroupsList();
    wireCreateGroup();
    wirePostForm();
    // if hash contains group id, try selecting
    const hash = location.hash && location.hash.slice(1);
    if(hash){ const g = _getGroups().find(x=>x.id===hash); if(g) selectGroup(hash); }
  }

  // expose
  global.groups = { init, selectGroup };
})(window);
