const fs = require('fs');
const mysql = require('mysql2/promise');
(async () => {
  const conn = await mysql.createConnection({host:'localhost',user:'pet',password:'pet147258!',database:'pet'});
  const [posts] = await conn.execute('SELECT id, updated_at FROM posts WHERE status=? ORDER BY id', ['published']);
  const now = new Date().toISOString().split('T')[0];
  let sitemap = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
  [['/','daily','1.0'],['/forum','daily','0.9'],['/knowledge','weekly','0.8'],['/stories','weekly','0.8'],['/tools','monthly','0.7'],['/about','monthly','0.6'],['/contact','monthly','0.6'],['/privacy','monthly','0.5'],['/terms','monthly','0.5'],['/msgboard','weekly','0.6']].forEach(([u,f,p]) => { sitemap += '  <url><loc>https://www.maozz.online'+u+'</loc><lastmod>'+now+'</lastmod><changefreq>'+f+'</changefreq><priority>'+p+'</priority></url>\n'; });
  posts.forEach(post => { const d = post.updated_at ? post.updated_at.toISOString().split('T')[0] : now; sitemap += '  <url><loc>https://www.maozz.online/post/'+post.id+'</loc><lastmod>'+d+'</lastmod><changefreq>weekly</changefreq><priority>0.7</priority></url>\n'; });
  sitemap += '</urlset>';
  fs.writeFileSync('D:\\workspace\\trae\\google_adv\\maozz-pet\\src\\public\\sitemap.xml', sitemap, 'utf8');
  console.log('sitemap OK, posts:', posts.length);

  const lastIds = posts.slice(-7).map(p=>p.id);
  const contents = [
    '<p>大家好，我是user29。网购宠物用品多年，踩过不少坑。今天来曝光四个最容易买到假货的品类。</p><p><strong>一、进口猫粮</strong></p><p>这是假货重灾区。我曾在一个价格明显偏低的店铺买到假渴望猫粮，包装几乎以假乱真，但开袋后味道不对，猫咪吃了还拉稀。建议大家认准官方旗舰店或授权经销商。</p><p><strong>二、驱虫药</strong></p><p>网购驱虫药假货极多。我买过两次便宜的大宠爱，用了之后跳蚤依然活跃。后来去宠物医院买了正品，才知道网购的所谓"行货"根本没有防伪码。</p><p><strong>三、宠物营养品</strong></p><p>鱼油、益生菌、化毛膏这些品类造假成本低，利润高。建议购买有防伪追溯系统的产品，并扫码验证。</p><p><strong>四、宠物零食</strong></p><p>冻干、肉干等零食假货也很多。有的用劣质肉源，有的过期改标。建议选择有生产许可证编号的产品。</p><p>以上就是我的血泪教训。希望毛茸茸星球的家长们都能擦亮眼睛！</p>',
    '<p>如果我家柯基"豆豆"会说话，我觉得它最想对我说的五句话大概是：</p><p><strong>第一句："能不能多陪陪我？"</strong></p><p>每天我下班回家，豆豆都会冲过来疯狂摇尾巴。但如果我回家就玩手机不理它，它会默默趴在我脚边叹气。对它来说，陪伴比零食更重要。</p><p><strong>第二句："那个快递箱是我的！"</strong></p><p>每次拆快递，豆豆都会第一时间冲过来霸占纸箱。在它眼里，纸箱就是全世界最好的玩具。</p><p><strong>第三句："能不能不要逼我洗澡？"</strong></p><p>每次洗澡，豆豆都会露出"狗生绝望"的表情。洗完之后它还会疯狂打滚，试图把自己重新弄脏。</p><p><strong>第四句："你做的饭太难吃了！"</strong></p><p>有一次我按照网上的食谱给豆豆做自制粮，结果它闻了闻就走开了。从那以后，我还是乖乖买商业粮吧。</p><p><strong>第五句："谢谢你，我爱你。"</strong></p><p>虽然豆豆不会说话，但它看我的眼神，充满了无条件的信任和依赖。你家毛孩子如果能说话，最想对你说什么？</p>',
    '<p>Hello各位铲屎官，我是user31，一个从"云吸猫"进化到"真养猫"的新手。今天来分享一下我这三个月的心路历程。</p><p><strong>一、从云吸猫到真养猫的转变</strong></p><p>以前我只是在网上看猫咪视频，觉得养猫应该很简单：给点粮、铲个屎、撸一撸就好了。直到真正养了英短"汤圆"，才发现养猫是一门学问。</p><p><strong>二、三个月来的困惑</strong></p><p>第一个月最大的困惑是：它为什么总是在凌晨三点跑酷？为什么明明有猫砂盆还要抓地板？为什么对我买的昂贵玩具不屑一顾，却痴迷于塑料袋？</p><p>第二个月最大的困惑是：它到底吃饱了没有？为什么有时候吃很多，有时候又挑食？</p><p>第三个月最大的困惑是：我到底有没有能力把它养好？</p><p><strong>三、我找到的解决方法</strong></p><p>加入毛茸茸星球是我做的最正确的决定。在这里，我学到了很多实用的知识。</p><p><strong>四、给新手铲屎官的建议</strong></p><p>1. 不要追求完美；2. 多学习，但不要焦虑；3. 相信你的毛孩子；4. 有问题就来毛茸茸星球问。</p><p>希望我的分享能帮到正在犹豫要不要养猫的你。养猫确实不容易，但绝对值得！</p>',
    '<p>大家好，我是user32。家里金毛犬"大黄"刚产下一窝幼犬，现在为小家伙们寻找靠谱的新主人。</p><p><strong>幼犬基本信息</strong></p><p>出生日期：2026年5月15日（目前一个半月大）</p><p>数量：4只（2公2母）</p><p>健康状况：已做第一次驱虫（拜宠清），活泼健康，无任何疾病</p><p>父母情况：狗爸是双血统金毛，狗妈是普通家养金毛，性格都非常温顺亲人</p><p><strong>为什么转让？</strong></p><p>说实话，留一只都舍不得。但家里空间有限，大黄也需要更多精力照顾，实在无法同时养5只金毛。希望能为每只幼犬找到真正爱它们的家庭。</p><p><strong>对新主人的要求</strong></p><p>1. 有稳定的居住环境；2. 有足够的时间和精力陪伴幼犬成长；3. 承诺不离不弃；4. 接受不定期的回访或照片分享</p><p><strong>转让方式</strong></p><p>小偿领养（仅收取疫苗和驱虫成本），主要是想筛选出真正有责任心的家长。上海市内可上门看狗，外地不考虑。</p><p>如果你对金毛幼犬感兴趣，请私信联系我，谢谢！</p>',
    '<p>大家好，我是user01。家里有一些闲置的宠物用品，想换几件大号狗狗衣服。欢迎有需要的家长来交流！</p><p><strong>我有（可互换）：</strong></p><p>1. 九成新猫咪自动喂食器（小佩品牌，使用3个月，功能完好）</p><p>2. 猫咪饮水机滤芯5片（未拆封）</p><p>3. 小号宠物航空箱（适合10斤以内猫咪）</p><p>4. 宠物指甲剪套装（用过几次，九成新）</p><p><strong>我想换：</strong></p><p>1. 大号狗狗衣服（适合20-30斤中型犬）</p><p>2. 狗狗慢食盆</p><p>3. 宠物推车（可补差价）</p><p>交换方式：上海同城面交优先，异地可快递（各付各的运费）。诚信交换，非诚勿扰！</p>',
    '<p>大家好，我是user02。最近搬家，清理了一批猫咪用品囤货，低价转让给有需要的家长。</p><p><strong>转让清单：</strong></p><p>1. 开放式猫砂盆2个（使用半年，清洗干净，¥15/个）</p><p>2. 豆腐猫砂8袋（未拆封，原味和绿茶味各4袋，¥20/袋，打包¥140）</p><p>3. 瓦楞纸猫抓板5块（全新未拆封，¥8/块）</p><p>4. 猫咪逗猫棒套装（全新，¥10）</p><p>5. 宠物湿巾3包（未拆封，¥5/包）</p><p>所有物品均保证干净、可用。猫砂和猫抓板都是搬家带不走的囤货，低价出给需要的家长。</p><p>交易方式：上海浦东自提优先，不包邮。如需快递，运费自理。有意者请留言或私信，先到先得！</p>',
    '<p>大家好，我是user03。作为一个经常出差的铲屎官，我对宠物寄养有比较深的体会。今天来分享一下家庭式寄养和宠物店寄养的真实对比。</p><p><strong>一、宠物店寄养体验</strong></p><p>我第一次出差是把猫咪"汤圆"送到连锁宠物店寄养。环境干净整洁，有监控，每天发照片。但汤圆回来后精神萎靡了两天，而且明显变瘦了。后来了解到，宠物店的寄养密度高，猫咪整天关在笼子里，活动空间非常有限，对性格敏感的猫咪来说压力很大。</p><p><strong>二、家庭式寄养体验</strong></p><p>第二次出差我尝试了家庭式寄养。对方家里只有两只原住民猫，汤圆可以自由活动，有沙发、猫爬架，还有窗边看风景的位置。寄养期间对方每天发视频，汤圆看起来状态很好。回来后精神和食欲都没有受到影响。</p><p><strong>三、两种方式对比总结</strong></p><p>宠物店寄养：笼子为主空间小、陪伴少、压力大、50-100元/天、有监控较规范。</p><p>家庭式寄养：家庭环境自由活动、陪伴多互动多、压力小、30-80元/天、依赖寄养家庭素质。</p><p><strong>四、我的建议</strong></p><p>如果你的毛孩子性格敏感、胆小型，优先选择家庭式寄养；如果需要长期寄养（超过一周），也建议选择家庭式。选择时一定要实地考察环境。</p><p>希望这个对比能帮到有寄养需求的家长！</p>'
  ];
  for(let i=0;i<lastIds.length&&i<contents.length;i++) { if(lastIds[i]) await conn.execute('UPDATE posts SET content = ? WHERE id = ?', [contents[i], lastIds[i]]); }
  console.log('posts updated');
  await conn.end();
})();
