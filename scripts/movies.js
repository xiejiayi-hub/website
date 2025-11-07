// movies.js — render movies list from localStorage (mm_movies) and react to updates
(function(){
  const KEY = 'mm_movies';
  const SAMPLE = [
    { id: 'seven-samurai', title: '七武士', year: '1954', director: '黑泽明', description: '经典日式史诗，讲述农民与武士的故事。', poster: 'imgs/seven-samurai.jpg', rating: 9.2 },
    { id: 'oppenheimer', title: '奥本海默', year: '2023', director: '克里斯托弗·诺兰', description: '关于奥本海默与原子弹历史的传记片。', poster: 'imgs/oppenheimer.jpg', rating: 8.3 },
    { id: 'inception', title: '盗梦空间', year: '2010', director: '克里斯托弗·诺兰', description: '意识与梦境的边界故事。', poster: 'imgs/indie-film.jpg', rating: 8.8 }
  ];

  function _getMovies(){ try{ return JSON.parse(localStorage.getItem(KEY) || 'null') || null; }catch(e){ return null; } }
  function _saveMovies(arr){ localStorage.setItem(KEY, JSON.stringify(arr)); }

  function ensureMovies(){ let m = _getMovies(); if(!m){ m = SAMPLE.slice(); _saveMovies(m); } return m; }

  function render(){
    const container = document.getElementById('movies-grid');
    if(!container) return;
    const movies = ensureMovies();
    container.innerHTML = '';
    movies.forEach(m=>{
      const art = document.createElement('article'); art.className='movie-card';
      art.innerHTML = `
        <a class="poster-link" href="movie-detail.html?id=${encodeURIComponent(m.id)}">
          <img class="poster" src="${m.poster||'imgs/indie-film.jpg'}" alt="${escapeHtml(m.title||'')}">
        </a>
        <div class="movie-info">
          <h3 class="movie-title"><a href="movie-detail.html?id=${encodeURIComponent(m.id)}">${escapeHtml(m.title||'')}</a> <span class="year">(${escapeHtml(m.year||'')})</span></h3>
          <div class="movie-meta"><span class="rating">${m.rating==null? '—' : escapeHtml(String(m.rating))}</span></div>
        </div>
      `;
      container.appendChild(art);
    });
  }

  function escapeHtml(s){ return String(s||'').replace(/[&<>\"]/g, c=> ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])); }

  function init(){ render();
    // react to storage changes (other tabs)
    window.addEventListener('storage', function(e){ if(e.key === KEY || e.key === 'mm_movies_last_update' || e.key === null) render(); });
    // listen to BroadcastChannel for faster same-origin notifications
    try{
      if(typeof BroadcastChannel !== 'undefined'){
        const bc = new BroadcastChannel('mm_sync');
        bc.addEventListener('message', function(ev){
          try{ const d = ev.data || {}; if(d && (d.type === 'movies_updated' || d.type === 'movies_changed')) render(); }catch(e){}
        });
      }
    }catch(e){ /* ignore */ }
    // when navigating back to this page, ensure fresh render (some browsers may use bfcache)
    window.addEventListener('pageshow', function(ev){ render(); });
  }

  window.moviesList = { init, render };
  document.addEventListener('DOMContentLoaded', init);

})();
