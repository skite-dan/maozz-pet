router.get('/post/:id', async (req, res, next) => {
  try {
    const post = await queryOne(
      `SELECT p.*, u.username, u.avatar, u.avatar_url as user_avatar_url
       FROM posts p JOIN users u ON p.user_id = u.id
       WHERE p.id = ? AND p.status = 'published' AND (p.review_status = 'approved' OR p.review_status IS NULL)`, [req.params.id]
    );
    if (!post) return res.status(404).render('index', { title: '帖子未找到 - 毛茸茸星球' });

    // 增加浏览量
    await query('UPDATE posts SET view_count = view_count + 1 WHERE id = ?', [req.params.id]);
    post.view_count++;

    const media = await query('SELECT * FROM post_media WHERE post_id = ? ORDER BY sort_order', [req.params.id]);
    const comments = await query(
      `SELECT c.*, u.username, u.avatar FROM comments c JOIN users u ON c.user_id = u.id
       WHERE c.post_id = ? AND c.status = 'normal' AND c.parent_id IS NULL ORDER BY c.created_at ASC`, [req.params.id]
    );
    for (const comment of comments) {
      comment.replies = await query(
        `SELECT c.*, u.username, u.avatar FROM comments c JOIN users u ON c.user_id = u.id WHERE c.parent_id = ? AND c.status = 'normal' ORDER BY c.created_at ASC`, [comment.id]
      );
    }

    // 相关帖子
    const relatedPosts = await query(
      `SELECT p.*, u.username, u.avatar FROM posts p JOIN users u ON p.user_id = u.id
       WHERE p.status = 'published' AND p.id != ? AND p.post_type = ? ORDER BY p.created_at DESC LIMIT 5`,
      [req.params.id, post.post_type]
    );

    // 为SEO生成结构化数据
    const structuredData = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "Article",
      "headline": post.title,
      "description": post.content ? post.content.replace(/<[^>]+>/g, '').substring(0, 150) : '',
      "author": { "@type": "Person", "name": post.username || '匿名' },
      "datePublished": post.created_at,
      "dateModified": post.updated_at,
      "image": media && media.length > 0 ? media[0].media_url : undefined
    });
    res.render('post', {
      title: (post.title || '帖子详情') + ' - 毛茸茸星球',
      metaDesc: (post.content ? post.content.replace(/<[^>]+>/g, '').substring(0, 150) : ''),
      metaKeywords: (post.tags ? post.tags : '宠物论坛,养宠攻略') + ',毛茸茸星球',
      canonicalUrl: (process.env.SITE_URL || 'http://localhost:3000') + '/post/' + post.id,
      ogType: 'article',
      ogImage: media && media.length > 0 ? media[0].media_url : undefined,
      structuredData: structuredData,
      post, media, comments, relatedPosts
    });
  } catch (err) { next(err); }
});