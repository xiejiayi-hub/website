// ===== 完善创建话题功能的 topics.js =====
(function(){
  // 1. 数据
  const SAMPLE = [
    {id:'t-1', name:'关于秋冬的治愈瞬间', desc:'', img:''},
    {id:'t-2', name:'我的精神防寒套装', desc:'', img:''},
    {id:'t-3', name:'秋冬治愈系好味', desc:'', img:''},
    {id:'t-4', name:'一代人有一代人的那修省钱法', desc:'', img:''},
    {id:'t-5', name:'提名那些“买了就后悔”的冤大头单品', desc:'', img:''},
    {id:'t-6', name:'从JK到AIP的记忆小震撼', desc:'', img:''}
  ];

  // 2. 渲染卡片
  function renderTopicCards(){
    const box = document.getElementById('topic-cards');
    if (!box) return;
    box.innerHTML = SAMPLE.map(t => `
      <div class="topic-card">
        ${t.img ? `<img class="topic-thumb" src="${t.img}" alt="">` : ''}
        <h4>${t.name}</h4>
        <div style="min-height:28px;color:#666;margin-bottom:8px">${t.desc}</div>
        <a class="topic-join" href="topic-detail.html?id=${t.id}">参与话题</a>
      </div>`).join('');
  }

  // 3. 渲染热榜
  function renderHotList(){
    const box = document.getElementById('hot-topics');
    if (!box) return;
    box.innerHTML = SAMPLE.map((t, i) => `
      <li>
        <span class="title">${i + 1}. <a href="topic-detail.html?id=${t.id}">${t.name}</a></span>
        <span class="count">${(10000 + Math.random() * 50000 | 0) / 10000}万</span>
      </li>`).join('');
  }

  // 4. 洗牌功能
  document.getElementById('shuffle-topics')?.addEventListener('click', e => {
    e.preventDefault();
    SAMPLE.sort(() => Math.random() - 0.5);
    renderTopicCards();
  });

  // 5. 新增：创建话题表单交互
  function initCreateTopic() {
    const openBtn = document.getElementById('open-create-topic');
    const formContainer = document.getElementById('create-topic');
    const form = document.getElementById('create-topic-form');

    if (!openBtn || !formContainer || !form) return;

    // 打开表单
    openBtn.addEventListener('click', e => {
      e.preventDefault();
      formContainer.style.display = 'block';
    });

    // 提交表单
    form.addEventListener('submit', e => {
      e.preventDefault();
      
      const nameInput = document.getElementById('new-topic-name');
      const descInput = document.getElementById('new-topic-desc');
      const imageInput = document.getElementById('new-topic-image');

      // 简单验证
      if (!nameInput.value.trim()) {
        alert('请输入话题名称');
        return;
      }

      // 创建新话题对象
      const newTopic = {
        id: `t-${Date.now()}`, // 用时间戳生成唯一ID
        name: nameInput.value.trim(),
        desc: descInput.value.trim(),
        img: imageInput.files[0] ? URL.createObjectURL(imageInput.files[0]) : ''
      };

      // 添加到话题列表并重新渲染
      SAMPLE.unshift(newTopic); // 新增话题放在最前面
      renderTopicCards();
      renderHotList();

      // 重置表单并隐藏
      form.reset();
      formContainer.style.display = 'none';
      alert('话题创建成功！');
    });
  }

  // 6. 启动所有功能
  renderTopicCards();
  renderHotList();
  initCreateTopic(); // 初始化创建话题功能
})();