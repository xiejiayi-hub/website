// Simple client-side auth and small feed using localStorage for demo purposes
// Keys used in localStorage:
//  - mm_users : array of user objects {username,email,password}
//  - mm_currentUser : current logged-in user object
//  - mm_posts : array of post objects {username, text, time}

function _getUsers(){
  return JSON.parse(localStorage.getItem('mm_users') || '[]');
}
function _saveUsers(u){
  localStorage.setItem('mm_users', JSON.stringify(u));
}
function _getPosts(){
  return JSON.parse(localStorage.getItem('mm_posts') || '[]');
}
function _savePosts(p){
  localStorage.setItem('mm_posts', JSON.stringify(p));
}

function registerSubmit(evt){
  evt.preventDefault();
  const form = evt.target;
  const username = form.username.value.trim();
  const email = form.email.value.trim();
  const password = form.password.value;
  if(!username || !email || !password){ alert('请完整填写所有字段'); return; }
  const users = _getUsers();
  if(users.find(u=>u.username===username)){ alert('用户名已存在'); return; }
  if(users.find(u=>u.email===email)){ alert('邮箱已被注册'); return; }
  users.push({username,email,password});
  _saveUsers(users);
  alert('注册成功，请登录');
  window.location.href = 'login.html';
}

function loginSubmit(evt){
  evt.preventDefault();
  const form = evt.target;
  const who = form.who.value.trim();
  const password = form.password.value;
  if(!who || !password){ alert('请输入用户名或邮箱与密码'); return; }
  const users = _getUsers();
  const user = users.find(u=> (u.username===who || u.email===who) && u.password===password );
  if(!user){ alert('用户名/邮箱或密码错误'); return; }
  localStorage.setItem('mm_currentUser', JSON.stringify(user));
  // redirect to profile (include ?user= so profile page can be opened directly)
  window.location.href = 'profile.html?user=' + encodeURIComponent(user.username);
}

function logout(){
  localStorage.removeItem('mm_currentUser');
  window.location.href = 'index.html';
}

function getCurrentUser(){
  return JSON.parse(localStorage.getItem('mm_currentUser') || 'null');
}

function requireAuth(){
  const u = getCurrentUser();
  if(!u){ window.location.href = 'login.html'; return null; }
  return u;
}

// Profile page helpers
function renderProfile(){
  // renderProfile can be called with an optional username to view someone else's profile
  const target = arguments.length>0 ? arguments[0] : null;
  let user = null;
  if(target){
    // find user by username
    const users = _getUsers();
    user = users.find(u=>u.username === target);
    if(!user){
      // user not found -> show basic message and return
      const elName = document.getElementById('profile-name'); if(elName) elName.textContent = target + '（用户未注册或不存在）';
      // clear composer & feed
      const composeForm = document.getElementById('compose-form'); if(composeForm) composeForm.style.display = 'none';
      renderFeed(target);
      return;
    }
  } else {
    user = requireAuth();
    if(!user) return;
  }

  const elName = document.getElementById('profile-name');
  if(elName) elName.textContent = user.displayName || user.username;

  const displayEl = document.getElementById('profile-display-name'); if(displayEl) displayEl.textContent = user.displayName || user.username;
  const bioEl = document.getElementById('profile-bio-display'); if(bioEl) bioEl.textContent = user.bio || '（未填写个人简介）';
  const avatarImg = document.getElementById('profile-avatar'); if(avatarImg) avatarImg.src = user.avatar || avatarImg.src;

  const isOwn = !target || (getCurrentUser() && getCurrentUser().username === user.username);

  const composeForm = document.getElementById('compose-form');
  if(composeForm){
    // show composer only when viewing own profile
    composeForm.style.display = isOwn ? 'block' : 'none';
    if(isOwn){
      // ensure submit handler set once
      if(!composeForm.__wired){
        composeForm.addEventListener('submit', function(e){
          e.preventDefault();
          const t = document.getElementById('compose-text');
          const text = t.value.trim();
          if(!text){ return; }
          const posts = _getPosts();
          posts.unshift({username:user.username, text, time: new Date().toISOString()});
          _savePosts(posts);
          t.value = '';
          renderFeed(user.username);
        });
        composeForm.__wired = true;
      }
    }
  }

  // render feed only for this user when on profile
  renderFeed(user.username);
  // update follower/following/posts counts and actions
  try{
    const followers = getFollowers(user.username);
    const following = getFollowing(user.username);
    const posts = _getPosts().filter(p=>p.username===user.username);
    const fcountEl = document.getElementById('profile-followers-count'); if(fcountEl) fcountEl.textContent = followers.length;
    const fgcountEl = document.getElementById('profile-following-count'); if(fgcountEl) fgcountEl.textContent = following.length;
    const postsCountEl = document.getElementById('profile-posts-count'); if(postsCountEl) postsCountEl.textContent = posts.length;

    const actionsEl = document.getElementById('profile-actions');
    if(actionsEl){
      actionsEl.innerHTML = '';
      if(isOwn){
        // show edit button so user can open edit form
        const editDiv = document.createElement('div');
        const editBtn = document.createElement('button');
        editBtn.id = 'edit-profile-btn';
        editBtn.className = 'btn';
        editBtn.textContent = '编辑资料';
        editDiv.appendChild(editBtn);
        actionsEl.appendChild(editDiv);
      } else {
        const cur = getCurrentUser();
  const btn = document.createElement('button'); btn.className = 'btn';
  // determine label
  if(cur && isFollowing(cur.username, user.username)) { btn.textContent = '已关注'; }
  else { btn.textContent = '关注'; }
        btn.addEventListener('click', function(){
          if(!cur){ alert('请先登录'); window.location.href='login.html'; return; }
          if(isFollowing(cur.username, user.username)) { unfollowUser(cur.username, user.username); btn.textContent='关注'; }
          else { followUser(cur.username, user.username); btn.textContent='已关注'; }
          // update counts
          const f = getFollowers(user.username); if(fcountEl) fcountEl.textContent = f.length;
        });
        actionsEl.appendChild(btn);

        const msgBtn = document.createElement('button'); msgBtn.className='btn'; msgBtn.style.marginLeft='8px'; msgBtn.textContent='私信';
        msgBtn.addEventListener('click', function(){
          const cur = getCurrentUser();
          if(!cur){ alert('请先登录'); window.location.href='login.html'; return; }
          const box = document.getElementById('profile-message-box'); if(!box) return;
          box.style.display = box.style.display==='none' ? 'block' : 'none';
        });
        actionsEl.appendChild(msgBtn);
      }
    }
    // wire send message form
    const msgForm = document.getElementById('profile-message-form');
    if(msgForm){
      msgForm.addEventListener('submit', function(e){
        e.preventDefault();
        const cur = getCurrentUser(); if(!cur){ alert('请先登录'); window.location.href='login.html'; return; }
        const toUser = user.username;
        const text = document.getElementById('profile-message-text').value.trim();
        if(!text){ alert('请输入消息内容'); return; }
        sendMessage(cur.username, toUser, text);
        alert('消息已发送（仅本地演示）');
        document.getElementById('profile-message-text').value='';
        const box = document.getElementById('profile-message-box'); if(box) box.style.display='none';
      });
    }
  }catch(e){ console.error(e); }
}

// --- follower/following helpers (demo via localStorage) ---
function _getFollows(){
  return JSON.parse(localStorage.getItem('mm_follows') || '[]');
}
function _saveFollows(arr){
  localStorage.setItem('mm_follows', JSON.stringify(arr));
}
function followUser(from, to){
  if(!from || !to || from===to) return false;
  const arr = _getFollows();
  if(arr.find(x=>x.from===from && x.to===to)) return true;
  arr.push({from,to}); _saveFollows(arr); return true;
}
function unfollowUser(from, to){
  const arr = _getFollows().filter(x=>!(x.from===from && x.to===to));
  _saveFollows(arr);
}
function isFollowing(from, to){
  return _getFollows().some(x=>x.from===from && x.to===to);
}
function getFollowers(username){
  return _getFollows().filter(x=>x.to===username).map(x=>x.from);
}
function getFollowing(username){
  return _getFollows().filter(x=>x.from===username).map(x=>x.to);
}

// --- simple demo messaging (localStorage-backed) ---
function _getMessages(){
  return JSON.parse(localStorage.getItem('mm_messages') || '[]');
}
function _saveMessages(m){ localStorage.setItem('mm_messages', JSON.stringify(m)); }
function sendMessage(from, to, text){
  if(!from || !to || !text) return false;
  const msgs = _getMessages();
  msgs.push({from,to,text,time:new Date().toISOString()});
  _saveMessages(msgs);
  return true;
}
function getInbox(username){
  return _getMessages().filter(m=>m.to===username).sort((a,b)=>new Date(b.time)-new Date(a.time));
}

// --- avatar resize & size guard ---
const AVATAR_MAX_BYTES = 150 * 1024; // 150KB
const AVATAR_MAX_DIM = 320; // px
function resizeImageFileToDataURL(file, maxDim, mimeType, quality){
  mimeType = mimeType || 'image/jpeg';
  quality = typeof quality === 'number' ? quality : 0.8;
  maxDim = maxDim || AVATAR_MAX_DIM;
  return new Promise((resolve, reject)=>{
    const fr = new FileReader();
    fr.onload = function(){
      const img = new Image();
      img.onload = function(){
        let w = img.width, h = img.height;
        if(w>maxDim || h>maxDim){
          if(w>h){ h = Math.round(h * (maxDim/w)); w = maxDim; } else { w = Math.round(w * (maxDim/h)); h = maxDim; }
        }
        const canvas = document.createElement('canvas');
        canvas.width = w; canvas.height = h;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#fff'; ctx.fillRect(0,0,w,h);
        ctx.drawImage(img,0,0,w,h);
        try{
          const dataUrl = canvas.toDataURL(mimeType, quality);
          resolve(dataUrl);
        }catch(err){ reject(err); }
      };
      img.onerror = function(e){ reject(e); };
      img.src = fr.result;
    };
    fr.onerror = function(e){ reject(e); };
    fr.readAsDataURL(file);
  });
}


function renderFeed(filterAuthor){
  const posts = _getPosts();
  const feed = document.getElementById('feed');
  if(!feed) return;
  feed.innerHTML = '';
  const users = _getUsers();
  const list = filterAuthor ? posts.filter(p=>p.username===filterAuthor) : posts;
  // pagination support: read page param from data attribute or default to 1
  const pageSize = 5;
  let page = 1;
  const pageAttr = feed.getAttribute('data-page');
  if(pageAttr) page = parseInt(pageAttr,10) || 1;
  const start = (page-1)*pageSize;
  const pageItems = list.slice(start, start+pageSize);
  pageItems.forEach(p=>{
    const item = document.createElement('div');
    item.className = 'post';
    const time = new Date(p.time).toLocaleString();
    // try to use the author's avatar if available
    const author = users.find(u=>u.username===p.username);
    const avatarSrc = (author && author.avatar) ? author.avatar : 'imgs/kurosawa.jpg';
    item.innerHTML = `
      <div class="post-left"><img src="${avatarSrc}" alt="avatar" class="avatar"></div>
      <div class="post-body">
        <div class="post-meta"><strong><a href="profile.html?user=${encodeURIComponent(p.username)}">${escapeHtml(p.username)}</a></strong> · <span class="time">${time}</span></div>
        <div class="post-text">${escapeHtml(p.text)}</div>
      </div>
      <div style="clear:both"></div>
    `;
    feed.appendChild(item);
  });

  // pagination UI
  const pagination = document.createElement('div');
  pagination.className = 'feed-pagination';
  const total = list.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const prev = document.createElement('button'); prev.textContent='上一页'; prev.disabled = page<=1;
  prev.addEventListener('click', function(){ feed.setAttribute('data-page', page-1); renderFeed(filterAuthor); });
  const next = document.createElement('button'); next.textContent='下一页'; next.disabled = page>=totalPages;
  next.addEventListener('click', function(){ feed.setAttribute('data-page', page+1); renderFeed(filterAuthor); });
  const info = document.createElement('div'); info.textContent = page + ' / ' + totalPages;
  pagination.appendChild(prev); pagination.appendChild(info); pagination.appendChild(next);
  if(totalPages>1) feed.appendChild(pagination);
}

// Profile editing: save profile fields (displayName, bio, avatar (dataURL))
function saveProfileChanges(changes){
  const cur = getCurrentUser();
  if(!cur) return;
  const users = _getUsers();
  const idx = users.findIndex(u=>u.username===cur.username);
  if(idx===-1) return;
  // apply changes onto user record
  const user = Object.assign({}, users[idx], changes);
  users[idx] = user;
  _saveUsers(users);
  // update currentUser stored session
  localStorage.setItem('mm_currentUser', JSON.stringify(user));
  // re-render header/profile UI if present
  renderHeader();
  // ensure header DOM updates (some pages may have cached header elements)
  try{
    const headerName = document.querySelector('.header-username');
    if(headerName) headerName.textContent = user.displayName ? user.displayName : user.username;
    const headerAvatar = document.querySelector('.header-avatar');
    if(headerAvatar && user.avatar) headerAvatar.src = user.avatar;
  }catch(e){/* ignore */}
  const nameEl = document.getElementById('profile-name'); if(nameEl) nameEl.textContent = user.username;
  const avatarEl = document.getElementById('profile-avatar'); if(avatarEl && user.avatar) avatarEl.src = user.avatar;
  const displayEl = document.getElementById('profile-display-name'); if(displayEl) displayEl.textContent = user.displayName || user.username;
  const bioEl = document.getElementById('profile-bio-display'); if(bioEl) bioEl.textContent = user.bio || '（未填写个人简介）';

  // Broadcast change to other tabs/windows (same-origin) so other logged-in users in this browser can see updated data
  try{
    if(typeof BroadcastChannel !== 'undefined'){
      const bc = new BroadcastChannel('mm_sync');
      bc.postMessage({ type: 'users_updated', username: user.username, time: Date.now() });
      bc.close();
    } else {
      // fallback: write a timestamp key to localStorage to trigger storage events
      localStorage.setItem('mm_users_last_update', Date.now().toString());
    }
  }catch(e){ /* ignore */ }
}

// Helper to wire profile edit form behavior on profile page
function wireProfileEditor(){
  const editBtn = document.getElementById('edit-profile-btn');
  const form = document.getElementById('profile-edit-form');
  if(!form) return;
  // populate current values
  const cur = getCurrentUser();
  if(cur){
    const display = document.getElementById('profile-display');
    const bio = document.getElementById('profile-bio');
    const avatarImg = document.getElementById('profile-avatar');
    if(display) display.value = cur.displayName || cur.username || '';
    if(bio) bio.value = cur.bio || '';
    if(avatarImg && cur.avatar) avatarImg.src = cur.avatar;
  }

  form.addEventListener('submit', function(e){
    e.preventDefault();
    const display = document.getElementById('profile-display').value.trim();
    const bio = document.getElementById('profile-bio').value.trim();
    const fileInput = document.getElementById('profile-avatar-file');
    if(fileInput && fileInput.files && fileInput.files[0]){
      const f = fileInput.files[0];
      // quick pre-check
      if(f.size > (AVATAR_MAX_BYTES * 10)){
        alert('图片太大，请选取更小的图片（>1.5MB）'); return;
      }
      // attempt to resize/compress
      resizeImageFileToDataURL(f, AVATAR_MAX_DIM, 'image/jpeg', 0.8).then(function(dataUrl){
        // if still too large, try lower quality
        if(dataUrl.length > AVATAR_MAX_BYTES * 1.5){
          return resizeImageFileToDataURL(f, AVATAR_MAX_DIM, 'image/jpeg', 0.6);
        }
        return dataUrl;
      }).then(function(finalDataUrl){
        // final size guard
        const approxBytes = Math.ceil((finalDataUrl.length - finalDataUrl.indexOf(',')-1) * 3/4);
        if(approxBytes > AVATAR_MAX_BYTES){
          alert('处理后图片仍然较大，请选择更小或更低分辨率的图片（目标 < 150KB）');
          return;
        }
        saveProfileChanges({ displayName: display, bio: bio, avatar: finalDataUrl });
        alert('资料已保存');
      }).catch(function(err){
        console.error('avatar resize error', err);
        // fallback: try reader
        const reader = new FileReader();
        reader.onload = function(ev){ saveProfileChanges({ displayName: display, bio: bio, avatar: ev.target.result }); alert('资料已保存（未压缩）'); };
        reader.readAsDataURL(f);
      });
    } else {
      saveProfileChanges({ displayName: display, bio: bio });
      alert('资料已保存');
    }
  });

  if(editBtn) editBtn.addEventListener('click', function(){
    const box = document.getElementById('profile-edit-box');
    if(box) box.style.display = box.style.display==='none' ? 'block' : 'none';
  });
}

// (wireProfileEditor will be exported later as part of siteAuth)

function escapeHtml(s){ return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

// Small helper to populate sample posts if none exist
function ensureSamplePosts(){
  const posts = _getPosts();
  if(posts.length===0){
    const sample = [
      {username:'林朝夕', text:'二见钟情 While You Were Sleeping (1995) — 推荐理由：节奏轻快，表演出色。', time: new Date().toISOString()},
      {username:'影评人A', text:'IT 狂人 第二季 The IT Crowd Season 2 — 喜欢这种荒诞喜剧。', time: new Date(Date.now()-3600*1000).toISOString()}
    ];
    _savePosts(sample);
  }
}

// Expose for inline use
window.siteAuth = {
  registerSubmit, loginSubmit, logout, getCurrentUser, requireAuth, renderProfile, ensureSamplePosts, wireProfileEditor,
  // social & messaging (demo/local)
  followUser, unfollowUser, isFollowing, getFollowers, getFollowing, sendMessage, getInbox
};

// Render header user area: show login/register when not logged, else avatar + name + logout
function renderHeader(){
  const container = document.getElementById('header-user');
  if(!container) return;
  const user = getCurrentUser();
  if(user){
    const avatarSrc = user.avatar ? user.avatar : 'imgs/kurosawa.jpg';
    const display = user.displayName ? user.displayName : user.username;
    // link to own profile with ?user=... so that profile page can show that user's public view
    container.innerHTML = `<div class="header-logged"><a href="profile.html?user=${encodeURIComponent(user.username)}"><img src="${avatarSrc}" alt="avatar" class="header-avatar"></a> <a href="profile.html?user=${encodeURIComponent(user.username)}" class="header-username">${escapeHtml(display)}</a> <a href="#" id="header-logout">登出</a></div>`;
    const out = document.getElementById('header-logout');
    if(out) out.addEventListener('click', function(e){ e.preventDefault(); logout(); });
  } else {
    container.innerHTML = `<a href="login.html" class="menu-item">登录</a> <a href="register.html" class="menu-item btn">注册</a>`;
  }
}

window.siteAuth.renderHeader = renderHeader;
