// search.js
// Universal header search handler and per-page simple filtering.
(function(){
  function parseQueryString(){
    const s = window.location.search || '';
    const params = new URLSearchParams(s);
    return { q: params.get('q') || '' };
  }

  function detectTargetAndTerm(raw){
    if(!raw) return { target: 'movies.html', term: '' };
    const t = raw.trim();
    // support prefixes: topic:, t:, 话题:, group:, g:, 小组:
    const mTopic = t.match(/^(?:topic:|t:|话题:)(.+)/i);
    if(mTopic) return { target: 'topics.html', term: mTopic[1].trim() };
    const mGroup = t.match(/^(?:group:|g:|小组:|社区:)(.+)/i);
    if(mGroup) return { target: 'community.html', term: mGroup[1].trim() };
    // heuristics: if contains 小组 or 讨论 or 社区 -> go community
    if(/小组|社区|讨论|发帖/.test(t)) return { target: 'community.html', term: t };
    // otherwise default to movies
    return { target: 'movies.html', term: t };
  }

  function onSubmit(e){
    e.preventDefault();
    const form = e.currentTarget;
    const input = form.querySelector('input[type=text], input[type=search]');
    if(!input) return;
    const raw = input.value.trim();
    if(!raw) return;
    const d = detectTargetAndTerm(raw);
    const url = d.target + '?q=' + encodeURIComponent(d.term);
    window.location.href = url;
  }

  function wireHeaderForms(){
    document.querySelectorAll('.search form').forEach(form=>{
      // avoid double-binding
      if(form.__search_wired) return; form.__search_wired = true;
      form.addEventListener('submit', onSubmit);
    });
  }

  // filtering helpers for pages that receive ?q=
  function filterMovies(term){
    const grid = document.querySelector('.movies-grid');
    if(!grid) return;
    const cards = Array.from(grid.querySelectorAll('.movie-card'));
    const low = term.toLowerCase();
    let shown = 0;
    cards.forEach(card=>{
      const titleEl = card.querySelector('.movie-title');
      const title = titleEl ? titleEl.textContent : (card.textContent || '');
      const alt = (card.querySelector('img')||{}).alt || '';
      const txt = (title + ' ' + alt).toLowerCase();
      if(low === '' || txt.indexOf(low) !== -1){ card.style.display = ''; shown++; }
      else { card.style.display = 'none'; }
    });
    showResultCount(shown);
  }

  function filterTopics(term){
    const container = document.getElementById('topic-cards') || document.querySelector('.topic-cards');
    if(!container) return;
    const low = term.toLowerCase();
    const cards = Array.from(container.querySelectorAll('.topic-card'));
    let shown = 0;
    cards.forEach(c=>{
      const name = (c.querySelector('.topic-name')||c).textContent || c.textContent || '';
      if(low === '' || name.toLowerCase().indexOf(low)!==-1){ c.style.display=''; shown++; } else c.style.display='none';
    });
    showResultCount(shown);
  }

  function filterGroups(term){
    const list = document.getElementById('groups-list');
    if(!list) return;
    const low = term.toLowerCase();
    const items = Array.from(list.querySelectorAll('.group-item'));
    let shown = 0;
    items.forEach(it=>{
      const name = (it.querySelector('.group-name')||it).textContent || it.textContent || '';
      if(low === '' || name.toLowerCase().indexOf(low)!==-1){ it.style.display=''; shown++; } else it.style.display='none';
    });
    showResultCount(shown);
  }

  function showResultCount(n){
    // simple status area: create or update an element with id search-result-count
    let el = document.getElementById('search-result-count');
    if(!el){ el = document.createElement('div'); el.id='search-result-count'; el.style.margin='8px 0'; const main = document.querySelector('main') || document.body; if(main) main.insertBefore(el, main.firstChild); }
    el.textContent = '共找到 ' + n + ' 条结果';
  }

  function applyQueryToPage(){
    const params = parseQueryString();
    if(!params.q) return;
    const q = params.q;
    // Determine page type
    if(document.querySelector('.movies-grid')){ filterMovies(q); }
    if(document.getElementById('topic-cards') || document.querySelector('.topic-cards')){ filterTopics(q); }
    if(document.getElementById('groups-list')){ filterGroups(q); }
  }

  function init(){
    wireHeaderForms();
    applyQueryToPage();
  }

  window.searchHandler = { init };
  document.addEventListener('DOMContentLoaded', init);

})();
