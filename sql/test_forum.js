
  var body = '';

  body += '<div class="breadcrumb">';
  body += '  <a href="/">首页</a> <span class="sep">/</span>';
  body += '  <span class="current">宠物论坛</span>';
  body += '</div>';

  body += '<div class="page-layout">';
  body += '  <div class="content-area">';

  // 板块分类Tab
  body += '  <div style="margin-bottom:20px;">';
  body += '    <div class="template-selector" id="categoryTabs">';
  var tabs = [
    { key: '', label: '🔥 全部' },
    { key: 'cat-feed', label: '🐱 猫咪饲养' },
    { key: 'dog-feed', label: '🐶 狗狗饲养' },
    { key: 'cat-disease', label: '🏥 猫咪疾病' },
    { key: 'dog-disease', label: '🏥 狗狗疾病' },
    { key: 'city-adoption', label: '📍 同城领养' },
    { key: 'daily-show', label: '📸 萌宠晒图' },
    { key: 'secondhand', label: '🛒 闲置交易' },
    { key: 'behavior-help', label: '🆘 求助避雷' }
  ];
  for (var t = 0; t < tabs.length; t++) {
    body += '      <button class="template-btn" data-category="' + tabs[t].key + '" onclick="switchCategory('' + tabs[t].key + '')">' + tabs[t].label + '</button>';
  }
  body += '    </div>';
  body += '  </div>';

  // 发帖按钮 + 版规提示
  body += '  <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:24px;flex-wrap:wrap;gap:12px;">';
  body += '    <h2 class="section-title" style="margin-bottom:0;" id="forumTitle"><span class="icon">💬</span> 全部帖子</h2>';
  body += '    <div style="display:flex;gap:10px;align-items:center;">';
  body += '      <span style="font-size:0.8rem;color:var(--muted);">💡 活体/交易帖需审核</span>';
  body += '      <button class="btn btn-primary btn-sm" onclick="requireLoginThen(function(){ openModal(\'postModal\'); })">✏️ 发布新帖</button>';
  body += '    </div>';
  body += '  </div>';

  // 我的帖子
  body += '  <section id="userPostsSection" style="display:none;margin-bottom:30px;">';
  body += '    <h3 class="section-title" style="font-size:1.15rem;"><span class="icon">👤</span> 我的帖子</h3>';
  body += '    <div class="post-list" id="userPostsArea"></div>';
  body += '  </section>';

  // 帖子列表
  body += '  <section>';
  body += '    <div class="post-list" id="forumPostsArea">';
  body += '      <div class="loading"><div class="spinner"></div>加载中...</div>';
  body += '    </div>';
  body += '    <div id="forumPagination"></div>';
  body += '  </section>';

  body += '  </div>';

  // Sidebar
  body += '  <aside class="sidebar">';
  body += '    <div class="widget">';
  body += '      <h3 class="widget-title">🏷️ 热门标签</h3>';
  body += '      <div class="tag-cloud">';
  var forumTags = ['养宠求助','日常分享','好物推荐','宠物健康','行为训练','喂养经验','宠物医院','品种讨论','新手养宠','宠物美容','猫咪软便','幼犬饲养','平价猫粮','同城领养'];
  for (var i = 0; i < forumTags.length; i++) {
    body += '        <a href="/search?keyword=' + encodeURIComponent(forumTags[i]) + '" class="tag">' + forumTags[i] + '</a>';
  }
  body += '      </div>';
  body += '    </div>';
  body += '    <div class="widget">';
  body += '      <h3 class="widget-title">📊 论坛统计</h3>';
  body += '      <div style="font-size:0.88rem;color:var(--muted);line-height:2;">';
  body += '        <p>📢 今日新帖：<strong style="color:var(--accent);">加载中...</strong></p>';
  body += '        <p>👥 活跃用户：<strong style="color:var(--green);">加载中...</strong></p>';
  body += '        <p>💬 总帖数：<strong style="color:var(--pink);">加载中...</strong></p>';
  body += '      </div>';
  body += '    </div>';
  body += '    <div class="widget">';
  body += '      <h3 class="widget-title">👑 版主招募</h3>';
  body += '      <p style="font-size:0.88rem;color:var(--muted);line-height:1.7;">招募各城市、各宠物品种版主，负责审核帖子、回复新手提问。成为版主可获得专属标识与管理权限。</p>';
  body += '      <a href="/contact" class="btn btn-outline btn-sm" style="margin-top:12px;">申请成为版主</a>';
  body += '    </div>';
  body += '  </aside>';
  body += '</div>';

  var pageScript = '';
  pageScript += '<script>';
  pageScript += '(function() {';
  pageScript += '  let forumPage = 1;';
  pageScript += '  const forumLimit = 10;';
  pageScript += '  let currentCategory = "";';

  // 从URL解析category
  pageScript += '  const urlParams = new URLSearchParams(window.location.search);';
  pageScript += '  currentCategory = urlParams.get("category") || "";';

  // 板块标题映射
  pageScript += '  const categoryTitles = {';
  pageScript += '    "cat-feed": "🐱 猫咪饲养",';
  pageScript += '    "dog-feed": "🐶 狗狗饲养",';
  pageScript += '    "exotic-pet": "🦎 小众宠物",';
  pageScript += '    "food-review": "🍖 粮食测评",';
  pageScript += '    "product-review": "🛍️ 用品测评",';
  pageScript += '    "cat-disease": "🏥 猫咪疾病",';
  pageScript += '    "dog-disease": "🏥 狗狗疾病",';
  pageScript += '    "daily-care": "🧴 日常护理",';
  pageScript += '    "medical-help": "🏥 就医求助",';
  pageScript += '    "city-adoption": "📍 同城无偿领养",';
  pageScript += '    "city-breed": "💕 同城配种",';
  pageScript += '    "lost-found": "🔍 寻宠启事",';
  pageScript += '    "city-walk": "🚶 同城遛宠聚会",';
  pageScript += '    "daily-show": "📸 萌宠日常",';
  pageScript += '    "pet-contest": "🏆 萌宠评选大赛",';
  pageScript += '    "fun-topic": "🎉 趣味养宠话题",';
  pageScript += '    "secondhand": "🛍️ 宠物用品闲置",';
  pageScript += '    "pet-transfer": "🏠 家养宠物转让",';
  pageScript += '    "service": "🛁 上门寄养/洗护预约",';
  pageScript += '    "behavior-help": "🙋 养宠行为求助",';
  pageScript += '    "blacklist": "⚠️ 宠物店/粮品避雷",';
  pageScript += '    "rescue": "🐾 流浪宠物救助"';
  pageScript += '  };';

  // 更新标题和Tab状态
  pageScript += '  function updateCategoryUI() {';
  pageScript += '    const title = categoryTitles[currentCategory] || "💬 全部帖子";';
  pageScript += '    document.getElementById("forumTitle").innerHTML = '<span class="icon">' + title.split(" ")[0] + '</span> ' + title.split(" ").slice(1).join(" ");';
  pageScript += '    document.querySelectorAll("#categoryTabs .template-btn").forEach(function(btn) {';
  pageScript += '      btn.classList.toggle("active", btn.dataset.category === currentCategory);';
  pageScript += '    });';
  pageScript += '    if (currentCategory) {';
  pageScript += '      document.querySelector(".breadcrumb .current").textContent = title.split(" ").slice(1).join(" ");';
  pageScript += '    }';
  pageScript += '  }';

  pageScript += '  window.switchCategory = function(cat) {';
  pageScript += '    currentCategory = cat;';
  pageScript += '    forumPage = 1;';
  pageScript += '    updateCategoryUI();';
  pageScript += '    loadForumPosts(1);';
  pageScript += '    if (history.replaceState) {';
  pageScript += '      const url = cat ? ("/forum?category=" + encodeURIComponent(cat)) : "/forum";';
  pageScript += '      history.replaceState(null, "", url);';
  pageScript += '    }';
  pageScript += '  };';

  pageScript += '  async function loadForumPosts(page) {';
  pageScript += '    forumPage = page;';
  pageScript += '    try {';
  pageScript += '      let url = "/api/posts?sort=latest&page=" + page + "&limit=" + forumLimit;';
  pageScript += '      if (currentCategory) url += "&category=" + encodeURIComponent(currentCategory);';
  pageScript += '      const res = await fetch(url);';
  pageScript += '      const data = await res.json();';
  pageScript += '      if (data.code === 200) {';
  pageScript += '        const area = document.getElementById("forumPostsArea");';
  pageScript += '        if (data.data.posts.length > 0) {';
  pageScript += '          area.innerHTML = data.data.posts.map(p => renderPostItem(p)).join("");';
  pageScript += '          document.getElementById("forumPagination").innerHTML = renderPagination(data.data.total, page, forumLimit, "loadForumPosts");';
  pageScript += '        } else { area.innerHTML = '<div class="empty-state"><div class="empty-icon">📭</div><p>该板块暂无帖子，快来发布第一条吧！</p></div>'; document.getElementById("forumPagination").innerHTML = ''; }';
  pageScript += '      }';
  pageScript += '    } catch(e) { console.error(e); }';
  pageScript += '  }';

  pageScript += '  async function loadUserPosts() {';
  pageScript += '    const token = localStorage.getItem("token");';
  pageScript += '    if (!token) return;';
  pageScript += '    try {';
  pageScript += '      const res = await authFetch("/api/auth/me");';
  pageScript += '      const data = await res.json();';
  pageScript += '      if (data.code === 200) {';
  pageScript += '        const userId = data.data.user.id;';
  pageScript += '        const postsRes = await fetch("/api/posts?limit=50");';
  pageScript += '        const postsData = await postsRes.json();';
  pageScript += '        if (postsData.code === 200) {';
  pageScript += '          const userPosts = postsData.data.posts.filter(p => p.user_id === userId);';
  pageScript += '          if (userPosts.length > 0) {';
  pageScript += '            document.getElementById("userPostsSection").style.display = "block";';
  pageScript += '            document.getElementById("userPostsArea").innerHTML = userPosts.map(p => renderPostItem(p)).join("");';
  pageScript += '          }';
  pageScript += '        }';
  pageScript += '      }';
  pageScript += '    } catch(e) { console.error(e); }';
  pageScript += '  }';

  pageScript += '  function requireLoginThen(callback) {';
  pageScript += '    if (!localStorage.getItem("token")) { openModal("loginModal"); return; }';
  pageScript += '    callback();';
  pageScript += '  }';

  pageScript += '  window.loadForumPosts = loadForumPosts;';
  pageScript += '  updateCategoryUI();';
  pageScript += '  loadForumPosts(1);';
  pageScript += '  loadUserPosts();';
  pageScript += '})();';
  pageScript += '</script>';
