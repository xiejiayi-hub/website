// movie-detail.js — render and allow editing movie details stored in localStorage
(function(global){
  const KEY = 'mm_movies';
  function uid(n){ return (n||'m') + '-' + Date.now().toString(36) + '-' + Math.floor(Math.random()*1000).toString(36); }
  function getQueryParam(name){ const params = new URLSearchParams(window.location.search); return params.get(name); }
  function _getMovies(){ try{ return JSON.parse(localStorage.getItem(KEY) || 'null') || null; }catch(e){ return null; } }
  function _saveMovies(arr){ localStorage.setItem(KEY, JSON.stringify(arr)); }

  const SAMPLE = [
    { id: 'seven-samurai', title: '七武士', year: '1954', director: '黑泽明', description: '经典日式史诗，讲述农民与武士的故事。', poster: 'imgs/seven-samurai.jpg', rating: 9.2 },
    { id: 'oppenheimer', title: '奥本海默', year: '2023', director: '克里斯托弗·诺兰', description: '关于奥本海默与原子弹历史的传记片。', poster: 'imgs/oppenheimer.jpg', rating: 8.3 },
    { id: 'inception', title: '盗梦空间', year: '2010', director: '克里斯托弗·诺兰', description: '意识与梦境的边界故事。', poster: 'imgs/indie-film.jpg', rating: 8.8 }
  ];

  function ensureMovies(){ let m = _getMovies(); if(!m){ m = SAMPLE.slice(); _saveMovies(m); } return m; }

  function findMovie(id){ const movies = ensureMovies(); return movies.find(x=>x.id===id); }

  function renderMovie(movie){ if(!movie) return; document.getElementById('movie-poster').src = movie.poster || 'imgs/indie-film.jpg'; document.getElementById('movie-title').textContent = movie.title || '—'; document.getElementById('movie-director').textContent = movie.director || '—'; document.getElementById('movie-year').textContent = movie.year || '—'; document.getElementById('movie-desc').textContent = movie.description || '（暂无简介）'; document.getElementById('movie-rating').textContent = movie.rating==null? '—' : movie.rating; // edit form defaults
    document.getElementById('edit-poster-preview').src = movie.poster || 'imgs/indie-film.jpg';
    document.getElementById('edit-title').value = movie.title || '';
    document.getElementById('edit-director').value = movie.director || '';
    document.getElementById('edit-year').value = movie.year || '';
    document.getElementById('edit-desc').value = movie.description || '';
  }

  function enterEdit(){ document.getElementById('movie-edit').style.display='block'; document.getElementById('edit-title').focus(); }
  function exitEdit(){ document.getElementById('movie-edit').style.display='none'; }

  function wireEdit(movie){
    const btn = document.getElementById('edit-movie-btn'); if(!btn) return;
    btn.addEventListener('click', function(){ const cur = siteAuth.getCurrentUser && siteAuth.getCurrentUser(); if(!cur){ alert('请先登录以编辑电影信息'); window.location.href='login.html'; return; } enterEdit(); });
    const cancel = document.getElementById('cancel-edit'); cancel.addEventListener('click', exitEdit);
    const form = document.getElementById('movie-edit-form');
    form.addEventListener('submit', function(e){ e.preventDefault(); const title = document.getElementById('edit-title').value.trim(); const director = document.getElementById('edit-director').value.trim(); const year = document.getElementById('edit-year').value.trim(); const desc = document.getElementById('edit-desc').value.trim(); const fileInput = document.getElementById('edit-poster-file'); if(!title){ alert('片名不能为空'); return; }
      // update movie object
      const movies = ensureMovies(); const idx = movies.findIndex(x=>x.id===movie.id); if(idx===-1) return; const updated = Object.assign({}, movies[idx], { title, director, year, description: desc });
      function finalizeSave(posterUrl){
        if(posterUrl) updated.poster = posterUrl;
        movies[idx] = updated;
        _saveMovies(movies);
        // also write a small timestamp key to ensure storage events fire in some browsers
        try{ localStorage.setItem('mm_movies_last_update', Date.now().toString()); }catch(e){}
        // Broadcast update to other same-origin tabs/windows (faster than waiting for storage in some cases)
        try{
          if(typeof BroadcastChannel !== 'undefined'){
            const bc = new BroadcastChannel('mm_sync');
            bc.postMessage({ type: 'movies_updated', id: updated.id, time: Date.now() });
            bc.close();
          }
        }catch(e){ /* ignore */ }
        renderMovie(updated);
        exitEdit();
        alert('保存成功（本地演示）');
        // if this page was opened from the list page in another window, try to trigger a re-render there too
        try{
          if(window.opener && window.opener !== window && window.opener.moviesList && typeof window.opener.moviesList.render === 'function'){
            window.opener.moviesList.render();
          }
        }catch(e){ /* ignore cross-window errors */ }
      }
      // handle optional image
      if(fileInput && fileInput.files && fileInput.files[0]){
        const f = fileInput.files[0];
        if(typeof resizeImageFileToDataURL === 'function'){
          resizeImageFileToDataURL(f, 800, 'image/jpeg', 0.8).then(function(dataUrl){ finalizeSave(dataUrl); }).catch(function(){ const reader = new FileReader(); reader.onload = function(ev){ finalizeSave(ev.target.result); }; reader.readAsDataURL(f); });
        } else {
          const reader = new FileReader(); reader.onload = function(ev){ finalizeSave(ev.target.result); }; reader.readAsDataURL(f);
        }
      } else { finalizeSave(); }
    });

    // preview selected image
    const fileIn = document.getElementById('edit-poster-file'); fileIn.addEventListener('change', function(e){ if(fileIn.files && fileIn.files[0]){ const reader = new FileReader(); reader.onload = function(ev){ document.getElementById('edit-poster-preview').src = ev.target.result; }; reader.readAsDataURL(fileIn.files[0]); } });
  }

  function init(){ const id = getQueryParam('id') || 'seven-samurai'; const movie = findMovie(id); if(!movie){ document.getElementById('movie-detail').innerHTML = '<div class="box">未找到电影（id='+id+'）</div>'; return; } renderMovie(movie); wireEdit(movie); }

  global.movieDetail = { init };
})(window);
