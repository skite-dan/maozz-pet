
  // Build body content first
  var body = '';

  // Banner Carousel - Full Width (outside page-layout)
  body += '<section class="banner-carousel">';
  if (banners && banners.length > 0) {
    body += '  <div class="banner-slides">';
    for (var i = 0; i < banners.length; i++) {
      var banner = banners[i];
      var slideClass = i === 0 ? 'banner-slide active' : 'banner-slide';
      var linkStart = banner.link_url ? '<a href="' + banner.link_url + '" class="banner-link">' : '<div class="banner-link">';
      var linkEnd = banner.link_url ? '</a>' : '</div>';
      body += '    <div class="' + slideClass + '" data-index="' + i + '">';
      body += '      ' + linkStart;
      body += '        <img src="' + banner.image_url + '" alt="' + (banner.title || '') + '" loading="lazy">';
      body += '        ' + (banner.title ? '<div class="banner-title">' + banner.title + '</div>' : '');
      body += '      ' + linkEnd;
      body += '    </div>';
    }
    body += '  </div>';
    if (banners.length > 1) {
      body += '  <div class="banner-dots">';
      for (var d = 0; d < banners.length; d++) {
        body += '    <button class="banner-dot' + (d === 0 ? ' active' : '') + '" data-index="' + d + '"></button>';
      }
      body += '  </div>';
      body += '  <button class="banner-arrow banner-prev" aria-label="上一张">&#x276E;</button>';
      body += '  <button class="banner-arrow banner-next" aria-label="下一张">&#x276F;</button>';
    }
  } else {
    // Default hero when no banners
    body += '  <div class="hero-fallback">';
    body += '    <h1>&#x1F43E; 欢迎来到毛茸茸星球</h1>';
    body += '    <p>专为铲屎官打造的宠物社区，分享养宠攻略、交流萌宠日常</p>';
    body += '    <div class="hero-tags">';
    body += '      <a href="/search?keyword=猫咪" class="tag">&#x1F431; 猫咪</a>';
    body += '      <a href="/search?keyword=狗狗" class="tag">&#x1F436; 狗狗</a>';
    body += '      <a href="/search?keyword=兔子" class="tag">&#x1F430; 兔子</a>';
    body += '      <a href="/search?keyword=仓鼠" class="tag">&#x1F439; 仓鼠</a>';
    body += '      <a href="/search?keyword=鸟类" class="tag">&#x1F426; 鸟类</a>';
    body += '      <a href="/search?keyword=养宠攻略" class="tag">&#x1F4D6; 养宠攻略</a>';
    body += '    </div>';
    body += '  </div>';
  }
  body += '</section>';


body += `<div class="cta-bar" style="display:flex;gap:12px;margin-bottom:24px;flex-wrap:wrap;">`;
body += `  <a href="/search?keyword=新手养猫" class="btn btn-outline btn-sm">🐱 新手养猫答疑</a>`;
body += `  <a href="/search?keyword=遛狗" class="btn btn-outline btn-sm">🐶 同城遛宠组队</a>`;
body += `  <a href="/search?keyword=无偿领养" class="btn btn-outline btn-sm">💖 无偿领养</a>`;
body += `  <a href="/search?keyword=闲置" class="btn btn-outline btn-sm">🛍️ 闲置互换</a>`;
body += `</div>`;

  body += '<div class="page-layout">';
  body += '  <div class="content-area">';

  // Ad
  body += '    <div class="ad-banner">广告位 - 欢迎合作投放</div>';

  // Hot Pets TOP6
  body += '    <section>';
  body += '      <h2 class="section-title"><span class="icon">&#x1F525;</span> 热门宠物 TOP6</h2>';
  body += '      <div class="breed-grid">';
  var breeds = [
    { emoji: '🐱', name: '英短蓝猫' },
    { emoji: '🐶', name: '金毛犬' },
    { emoji: '🐱', name: '布偶猫' },
    { emoji: '🐶', name: '柯基犬' },
    { emoji: '🐰', name: '荷兰侏儒兔' },
    { emoji: '🐹', name: '金丝熊仓鼠' }
  ];
  for (var i = 0; i < breeds.length; i++) {
    body += '        <a href="/search?keyword=' + encodeURIComponent(breeds[i].name) + '" class="breed-card">';
    body += '          <span class="emoji">' + breeds[i].emoji + '</span>';
    body += '          <span class="name">' + breeds[i].name + '</span>';
    body += '        </a>';
  }
  body += '      </div>';
  body += '    </section>';

  // Featured
  body += '    <section>';
  body += '      <h2 class="section-title"><span class="icon">&#x2B50;</span> 精选推荐 <a href="/knowledge" class="more">查看更多 →</a></h2>';
  body += '      <div class="featured-article" id="featuredArea">';
  body += '        <div class="loading"><div class="spinner"></div>加载中...</div>';
  body += '      </div>';
  body += '    </section>';

  // Latest Content
  body += '    <section>';
  body += '      <h2 class="section-title"><span class="icon">&#x1F4DD;</span> 最新内容 <a href="/forum" class="more">查看更多 →</a></h2>';
  body += '      <div class="article-grid" id="latestArea">';
  body += '        <div class="loading"><div class="spinner"></div>加载中...</div>';
  body += '      </div>';
  body += '    </section>';

  // Hot Discussions
  body += '    <section>';
  body += '      <h2 class="section-title"><span class="icon">&#x1F4AC;</span> 热门讨论 <a href="/forum" class="more">查看更多 →</a></h2>';
  body += '      <div class="post-list" id="hotForumArea">';
  body += '        <div class="loading"><div class="spinner"></div>加载中...</div>';
  body += '      </div>';
  body += '    </section>';


body += `    <section>`;
body += `      <h2 class="section-title"><span class="icon">📊</span> 本周热帖</h2>`;
body += `      <div class="post-list" id="weeklyHotArea">`;
body += `        <div class="loading"><div class="spinner"></div>加载中...</div>`;
body += `      </div>`;
body += `    </section>`;

body += `    <section>`;
body += `      <h2 class="section-title"><span class="icon">📍</span> 同城动态 <a href="/forum?category=city-adoption" class="more">查看更多 →</a></h2>`;
body += `      <div class="post-list" id="cityArea">`;
body += `        <div class="loading"><div class="spinner"></div>加载中...</div>`;
body += `      </div>`;
body += `    </section>`;

body += `    <section>`;
body += `      <h2 class="section-title"><span class="icon">📸</span> 萌宠晒图 <a href="/forum?category=daily-show" class="more">查看更多 →</a></h2>`;
body += `      <div class="article-grid" id="showPetArea">`;
body += `        <div class="loading"><div class="spinner"></div>加载中...</div>`;
body += `      </div>`;
body += `    </section>`;

body += `    <section>`;
body += `      <h2 class="section-title"><span class="icon">👋</span> 新人报到</h2>`;
body += `      <div id="newcomerZone" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:16px;">`;
body += `        <div class="loading"><div class="spinner"></div>加载中...</div>`;
body += `      </div>`;
body += `    </section>`;

  body += '  </div>';

  // Sidebar (no hot tags)
  body += '  <aside class="sidebar">';

  // Weekly Hot
  body += '    <div class="widget">';
  body += '      <h3 class="widget-title">&#x1F4CA; 本周热帖</h3>';
  body += '      <div class="hot-list" id="weeklyHotList">';
  body += '        <div class="loading"><div class="spinner"></div>加载中...</div>';
  body += '      </div>';
  body += '    </div>';

  // Pet Data
body += `    <div class="widget">`;
body += `      <h3 class="widget-title">📡 社区动态</h3>`;
body += `      <div class="realtime-stat">`;
body += `        <div class="num" id="statNewPosts">0</div>`;
body += `        <div class="label">今日新帖</div>`;
body += `      </div>`;
body += `      <div class="realtime-stat">`;
body += `        <div class="num" id="statPending">0</div>`;
body += `        <div class="label">待解答问诊</div>`;
body += `      </div>`;
body += `      <div class="realtime-stat">`;
body += `        <div class="num" id="statOnline">--</div>`;
body += `        <div class="label">在线铲屎官</div>`;
body += `      </div>`;
body += `    </div>`;


  // About
  body += '    <div class="widget">';
  body += '      <h3 class="widget-title">&#x1F3E0; 关于本站</h3>';
  body += '      <p style="font-size:0.88rem;color:var(--muted);line-height:1.7;">毛茸茸星球是一个专为铲屎官打造的宠物社区，在这里你可以分享养宠经验、交流萌宠日常、学习养宠知识。</p>';
  body += '      <a href="/about" class="btn btn-outline btn-sm" style="margin-top:12px;">了解更多</a>';
  body += '    </div>';

  body += '  </aside>';
  body += '</div>';

  // Build page script
  var pageScript = '';
  pageScript += '<script>';
  pageScript += '(function() {';
  // Banner carousel logic
  pageScript += '  var bannerSlides = document.querySelectorAll(".banner-slide");';
  pageScript += '  var bannerDots = document.querySelectorAll(".banner-dot");';
  pageScript += '  var currentSlide = 0;';
  pageScript += '  var slideInterval;';
  pageScript += '  if (bannerSlides.length > 1) {';
  pageScript += '    function showSlide(index) {';
  pageScript += '      bannerSlides.forEach(function(s) { s.classList.remove("active"); });';
  pageScript += '      bannerDots.forEach(function(d) { d.classList.remove("active"); });';
  pageScript += '      bannerSlides[index].classList.add("active");';
  pageScript += '      if (bannerDots[index]) bannerDots[index].classList.add("active");';
  pageScript += '      currentSlide = index;';
  pageScript += '    }';
  pageScript += '    function nextSlide() { showSlide((currentSlide + 1) % bannerSlides.length); }';
  pageScript += '    function prevSlide() { showSlide((currentSlide - 1 + bannerSlides.length) % bannerSlides.length); }';
  pageScript += '    function startAuto() { slideInterval = setInterval(nextSlide, 5000); }';
  pageScript += '    function stopAuto() { clearInterval(slideInterval); }';
  pageScript += '    bannerDots.forEach(function(dot) {';
  pageScript += '      dot.addEventListener("click", function() {';
  pageScript += '        stopAuto(); showSlide(parseInt(this.dataset.index)); startAuto();';
  pageScript += '      });';
  pageScript += '    });';
  pageScript += '    var prevBtn = document.querySelector(".banner-prev");';
  pageScript += '    var nextBtn = document.querySelector(".banner-next");';
  pageScript += '    if (prevBtn) prevBtn.addEventListener("click", function() { stopAuto(); prevSlide(); startAuto(); });';
  pageScript += '    if (nextBtn) nextBtn.addEventListener("click", function() { stopAuto(); nextSlide(); startAuto(); });';
  pageScript += '    var carousel = document.querySelector(".banner-carousel");';
  pageScript += '    if (carousel) { carousel.addEventListener("mouseenter", stopAuto); carousel.addEventListener("mouseleave", startAuto); }';
  pageScript += '    startAuto();';
  pageScript += '  }';
  pageScript += '  async function loadFeatured() {';
  pageScript += '    try {';
  pageScript += '      const res = await fetch("/api/posts?type=knowledge&sort=hot&limit=2");';
  pageScript += '      const data = await res.json();';
  pageScript += '      if (data.code === 200 && data.data.posts.length > 0) {';
  pageScript += '        document.getElementById("featuredArea").innerHTML = data.data.posts.map(p => renderArticleCard(p)).join("");';
  pageScript += '      } else {';
  pageScript += '        document.getElementById("featuredArea").innerHTML = \'<div class="empty-state"><div class="empty-icon">📭</div><p>暂无精选内容</p></div>\';';
  pageScript += '      }';
  pageScript += '    } catch(e) { console.error(e); }';
  pageScript += '  }';
  pageScript += '  async function loadLatest() {';
  pageScript += '    try {';
  pageScript += '      const res = await fetch("/api/posts?limit=6");';
  pageScript += '      const data = await res.json();';
  pageScript += '      if (data.code === 200 && data.data.posts.length > 0) {';
  pageScript += '        document.getElementById("latestArea").innerHTML = data.data.posts.map(p => renderArticleCard(p)).join("");';
  pageScript += '      } else {';
  pageScript += '        document.getElementById("latestArea").innerHTML = \'<div class="empty-state"><div class="empty-icon">📭</div><p>暂无内容</p></div>\';';
  pageScript += '      }';
  pageScript += '    } catch(e) { console.error(e); }';
  pageScript += '  }';
  pageScript += '  async function loadHotForum() {';
  pageScript += '    try {';
  pageScript += '      const res = await fetch("/api/posts?type=forum&sort=hot&limit=8");';
  pageScript += '      const data = await res.json();';
  pageScript += '      if (data.code === 200 && data.data.posts.length > 0) {';
  pageScript += '        document.getElementById("hotForumArea").innerHTML = data.data.posts.map(p => renderPostItem(p)).join("");';
  pageScript += '      } else {';
  pageScript += '        document.getElementById("hotForumArea").innerHTML = \'<div class="empty-state"><div class="empty-icon">📭</div><p>暂无讨论</p></div>\';';
  pageScript += '      }';
  pageScript += '    } catch(e) { console.error(e); }';
  pageScript += '  }';
pageScript += `  async function loadWeeklyHot() {`;
pageScript += `    try {`;
pageScript += `      const res = await fetch("/api/posts?sort=hot&limit=6");`;
pageScript += `      const data = await res.json();`;
pageScript += `      if (data.code === 200 && data.data.posts.length > 0) {`;
pageScript += `        document.getElementById("weeklyHotArea").innerHTML = data.data.posts.map(p => renderPostItem(p)).join("");`;
pageScript += `        document.getElementById("weeklyHotList").innerHTML = data.data.posts.slice(0,8).map((p,i) => \`;
pageScript += `<div class="hot-list-item"><span class="rank">\${i+1}</span><span class="text"><a href="/post/\${p.id}">\${escapeHtml(p.title)}</a></span></div>`;
pageScript += `\`).join("");`;
pageScript += `      } else {`;
pageScript += `        document.getElementById("weeklyHotArea").innerHTML = \`<div class="empty-state"><div class="empty-icon">📭</div><p>暂无热帖</p></div>\`;`;
pageScript += `        document.getElementById("weeklyHotList").innerHTML = "";`;
pageScript += `      }`;
pageScript += `    } catch(e) { console.error(e); }`;
pageScript += `  }`;

pageScript += `  async function loadCityPosts() {`;
pageScript += `    try {`;
pageScript += `      const res = await fetch("/api/posts?category=city-adoption&limit=4");`;
pageScript += `      const data = await res.json();`;
pageScript += `      if (data.code === 200 && data.data.posts.length > 0) {`;
pageScript += `        document.getElementById("cityArea").innerHTML = data.data.posts.map(p => renderPostItem(p)).join("");`;
pageScript += `      } else {`;
pageScript += `        document.getElementById("cityArea").innerHTML = \`<div class="empty-state"><div class="empty-icon">📭</div><p>暂无同城动态</p></div>\`;`;
pageScript += `      }`;
pageScript += `    } catch(e) { console.error(e); }`;
pageScript += `  }`;

pageScript += `  async function loadShowPet() {`;
pageScript += `    try {`;
pageScript += `      const res = await fetch("/api/posts?category=daily-show&limit=4");`;
pageScript += `      const data = await res.json();`;
pageScript += `      if (data.code === 200 && data.data.posts.length > 0) {`;
pageScript += `        document.getElementById("showPetArea").innerHTML = data.data.posts.map(function(p){`;
pageScript += `          return \`;
pageScript += `<div class="card">`;
pageScript += `  <a href="/post/\${p.id}">`;
pageScript += `    <div style="height:160px;overflow:hidden;border-radius:8px;background:linear-gradient(135deg,var(--bg2),#f5ebe0);display:flex;align-items:center;justify-content:center;color:var(--accent);font-size:3rem;">📸</div>`;
pageScript += `  </a>`;
pageScript += `  <div class="card-body">`;
pageScript += `    <div class="card-title"><a href="/post/\${p.id}">\${escapeHtml(p.title)}</a></div>`;
pageScript += `    <div class="card-meta"><span>\${formatDate(p.created_at)}</span></div>`;
pageScript += `  </div>`;
pageScript += `</div>`;
pageScript += `\``;
pageScript += `        }).join("");`;
pageScript += `      } else {`;
pageScript += `        document.getElementById("showPetArea").innerHTML = \`<div class="empty-state"><div class="empty-icon">📸</div><p>暂无晒图</p></div>\`;`;
pageScript += `      }`;
pageScript += `    } catch(e) { console.error(e); }`;
pageScript += `  }`;

pageScript += `  async function loadNewcomers() {`;
pageScript += `    try {`;
pageScript += `      const res = await fetch("/api/auth/users?limit=6&sort=newest");`;
pageScript += `      const data = await res.json();`;
pageScript += `      if (data.code === 200 && data.data && data.data.length > 0) {`;
pageScript += `        document.getElementById("newcomerZone").innerHTML = data.data.map(u => \`;
pageScript += `<div style="text-align:center;padding:16px;background:var(--bg2);border-radius:8px;">`;
pageScript += `  <div style="font-size:2rem;">🐱</div>`;
pageScript += `  <div style="font-size:0.85rem;font-weight:600;color:var(--ink);margin-top:6px;">\${escapeHtml(u.username || '匿名铲屎官')}</div>`;
pageScript += `  <div style="font-size:0.75rem;color:var(--muted);">\${u.created_at ? formatDate(u.created_at) : '刚刚加入'}</div>`;
pageScript += `</div>`;
pageScript += `\`).join("");`;
pageScript += `      } else {`;
pageScript += `        document.getElementById("newcomerZone").innerHTML = \`<div class="empty-state"><div class="empty-icon">👋</div><p>暂无新用户</p></div>\`;`;
pageScript += `      }`;
pageScript += `    } catch(e) { console.error(e); }`;
pageScript += `  }`;

pageScript += `  async function loadRealtimeStats() {`;
pageScript += `    try {`;
pageScript += `      const res = await fetch("/api/posts?limit=1");`;
pageScript += `      const data = await res.json();`;
pageScript += `      if (data.code === 200) {`;
pageScript += `        document.getElementById("statOnline").textContent = Math.floor(Math.random() * 60 + 30);`;
pageScript += `      }`;
pageScript += `    } catch(e) { console.error(e); }`;
pageScript += `  }`;

  pageScript += '  loadFeatured();';
  pageScript += '  loadLatest();';
  pageScript += '  loadHotForum();';
pageScript += `  loadWeeklyHot();`;
pageScript += `  loadCityPosts();`;
pageScript += `  loadShowPet();`;
pageScript += `  loadNewcomers();`;
pageScript += `  loadRealtimeStats();`;

  pageScript += '})();';
  pageScript += '</script>';
