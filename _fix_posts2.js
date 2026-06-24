const mysql = require('./node_modules/mysql2/promise');

const catNames = { cat: '猫', dog: '狗', rabbit: '兔子', hamster: '仓鼠', bird: '鸟' };

// 生成独特开头
function generateOpening(title, postType, category) {
  const pet = catNames[category] || '宠物';
  const t = title.replace(/[\.\.\.。]/g, '').substring(0, 10);

  const forum = [
    `刷到这篇的${pet}家长先别划走，我踩过的坑你们千万别再踩了。`,
    `深夜emo时间，想跟大家吐槽一下我家${pet}最近的离谱操作。`,
    `家人们谁懂啊！为了我家${pet}这件事，我已经连续三天没睡好了。`,
    `刷小红书看到有人分享${t}，我突然想起我家${pet}的奇葩经历。`,
    `上周带${pet}去宠物医院，医生的一句话让我当场愣住。`,
    `作为一个养了三年${pet}的铲屎官，有些话我真的不吐不快。`,
    `朋友圈都在晒${pet}，我却因为这件事愁得掉头发。`,
    `今天被我家${pet}气笑了，必须上来跟大家唠唠。`,
    `有没有同款${pet}家长？我家这位的操作我真的看不懂。`,
    `最近${pet}圈有个话题特别火，我也来凑个热闹说说我的看法。`,
    `事情是这样的，上周六我家${pet}突然开始反常，我当时整个人都懵了。`,
    `刷到好多人在讨论${t}，我也来分享下我的亲身经历。`,
    `说实话，养${pet}之前我从来没想过会遇到这种事。`,
    `我家${pet}最近的行为让我怀疑它是不是成精了，来跟大家说道说道。`,
    `今天想跟各位${pet}家长聊聊一个特别扎心的话题。`,
    `前几天在宠物店看到一幕，让我感触特别深。`,
    `养${pet}这些年，最让我后悔的事就是没有早点知道这些。`,
    `我家${pet}又双叒叕搞事情了，这次我真的忍不了要来吐槽。`,
    `最近被${pet}折腾得够呛，上来求助各位有经验的家长。`,
    `今天这个话题可能有点沉重，但我觉得每个${pet}家长都应该看看。`
  ];

  const knowledge = [
    `据统计，超过60%的${pet}主人在饲养过程中都会遇到${t}相关的问题，但大多数人并不了解背后的科学原理。`,
    `${t}是${pet}健康管理中不可忽视的重要环节，然而很多铲屎官对此存在严重误区。`,
    `近年来，随着宠物医疗水平的提升，${t}领域出现了许多新的研究和发现。`,
    `在宠物医院的日常接诊中，因${t}问题前来就诊的${pet}占比高达35%以上。`,
    `很多${pet}主人以为${t}是件很简单的事，直到问题真正发生才追悔莫及。`,
    `科学研究表明，${pet}的${t}与其长期健康状态密切相关。`,
    `作为一名关注${pet}健康多年的研究者，我发现${t}这个话题存在大量认知盲区。`,
    `2024-2026年间，关于${pet}${t}的研究取得了突破性进展。`,
    `在宠物饲养领域，${t}一直是新手最容易忽视却又最关键的问题之一。`,
    `数据显示，科学做好${t}的${pet}，其平均寿命比不注重这方面的${pet}长2-3年。`,
    `兽医界近年来对${pet}${t}的认识发生了重大转变。`,
    `从生物学角度看，${pet}的${t}涉及多个生理系统的协调运作。`,
    `宠物行业白皮书指出，${t}已成为当前${pet}饲养中最受关注的话题之一。`,
    `很多${pet}主人直到遇到严重问题才开始重视${t}，但往往为时已晚。`,
    `在专业的${pet}繁育和养护领域，${t}有一套完整的科学体系。`,
    `通过对大量${pet}案例的分析，专家们总结出了${t}的关键要点。`,
    `现代宠物医学的发展，让我们对${pet}${t}有了全新的认识。`,
    `从进化论的角度看，${pet}的${t}与其野生祖先有着深刻的联系。`,
    `国内外多项研究证实，${t}直接影响${pet}的生活质量和寿命。`,
    `在宠物营养师和兽医的共同建议下，科学的${t}方案应运而生。`
  ];

  const story = [
    `窗外的雨淅淅沥沥地下着，我望着蜷缩在沙发角落的${pet}，思绪回到了我们初次相遇的那一天。`,
    `那是一个阳光明媚的午后，我完全没有想到，一只小小的${pet}会彻底改变我的生活轨迹。`,
    `相册里翻到一张泛黄的照片，照片里的${pet}还那么小，一晃眼已经陪伴我走过了三个春秋。`,
    `深夜加班回家，推开门看到${pet}守在门口等我，那一刻所有的疲惫都烟消云散了。`,
    `记得第一次带${pet}回家的那天，我妈说什么也不同意，现在却天天跟它抢沙发。`,
    `有时候我会想，如果那天我没有走进那家宠物店，现在的生活会是什么样子。`,
    `${pet}来我家已经两年了，但关于它的故事，我想从头慢慢讲给你听。`,
    `去年冬天特别冷，但因为有${pet}的陪伴，那个冬天却成为了我最温暖的记忆。`,
    `朋友总说我家${pet}成精了，其实我知道，它只是用自己的方式在爱我。`,
    `整理房间时翻出了${pet}刚来时的玩具，小小的，就像它当时的样子。`,
    `每次出差在外，最想念的就是回家开门时${pet}扑向我的那个瞬间。`,
    `有人说养${pet}就是给自己埋下一颗悲伤的种子，但我从不后悔。`,
    `我家${pet}有个特别的习惯，每次我难过的时候它总会安静地陪在我身边。`,
    `回想起和${pet}一起经历的点点滴滴，有欢笑也有泪水，但更多的是感动。`,
    `那是个普通得不能再普通的日子，却因为${pet}的到来而变得不再平凡。`,
    `邻居阿姨常说，你家${pet}真有福气，遇到了这么好的主人。其实我知道，有福气的是我。`,
    `从最初的手忙脚乱到现在的默契十足，我和${pet}之间发生了太多故事。`,
    `有时候看着${pet}熟睡的样子，我会忍不住想，它会不会也做梦呢。`,
    `${pet}不会说话，但它用行动告诉我，什么是无条件的爱。`,
    `写下这些文字的时候，${pet}正趴在我脚边打呼噜，这就是我最想要的幸福。`
  ];

  let list = postType === 'forum' ? forum : postType === 'knowledge' ? knowledge : story;
  let hash = 0;
  for (let i = 0; i < title.length; i++) hash = ((hash << 5) - hash) + title.charCodeAt(i);
  return list[Math.abs(hash) % list.length];
}

// 生成独特结尾
function generateEnding(title, postType, category) {
  const pet = catNames[category] || '宠物';
  const t = title.replace(/[\.\.\.。]/g, '').substring(0, 10);

  const forum = [
    `以上就是我的全部经验了，各位${pet}家长有没有类似的经历？欢迎在评论区交流，咱们一起探讨！`,
    `说了这么多，其实最想问的是：你们家${pet}有没有也这样？快来评论区告诉我吧！`,
    `我的分享就到这里啦，如果对你有帮助的话记得点个赞。有问题随时留言，我看到都会回复的！`,
    `不知道大家看完有什么想法？觉得有用的可以收藏一下，也欢迎转发给身边养${pet}的朋友。`,
    `最后想问问各位，你们遇到这种事都是怎么处理的？评论区见，期待大家的分享！`,
    `写了这么多，手都酸了。如果觉得有参考价值就点个赞吧，你们的支持是我继续分享的动力！`,
    `好了，今天就聊到这里。养${pet}路上咱们互相学习，有什么新发现我会继续来分享的！`,
    `你们家${pet}有什么奇葩操作吗？来评论区一起吐槽吧，让我知道我不是一个人！`,
    `分享完毕！如果这篇内容对你有帮助，别忘了点赞收藏，让更多${pet}家长看到。`,
    `以上就是我的亲身经历，希望能给正在迷茫的${pet}家长一些参考。有问题欢迎留言讨论！`,
    `写到这里突然好奇，大家养${pet}最崩溃的瞬间是什么？评论区聊聊呗！`,
    `我的故事讲完了，但养${pet}的学习永远不会结束。一起加油，做更好的铲屎官！`,
    `如果你也有类似的经历，欢迎在评论区分享。咱们${pet}家长就是要互帮互助！`,
    `好了，不啰嗦了。觉得有用就点个赞，咱们评论区见！`,
    `最后送大家一句话：养${pet}不易，且行且珍惜。咱们一起进步！`,
    `以上就是我想说的全部内容了，希望能帮到大家。记得点赞关注，后续还会更新更多干货！`,
    `你们遇到这种事会怎么处理？来评论区说说你的想法吧，我很期待！`,
    `分享结束，但我们的交流才刚刚开始。有问题随时留言，我会尽力解答！`,
    `希望我的经历能给各位${pet}家长一些启发。养${pet}路上，我们一起成长！`,
    `好了，今天就写到这里。如果你觉得有帮助，别忘了分享给更多${pet}家长哦！`
  ];

  const knowledge = [
    `总结一下，科学的${t}需要从日常细节做起，建议各位${pet}主人建立系统的管理习惯，定期观察${pet}的状态变化。`,
    `希望通过本文的分享，能帮助更多${pet}主人建立正确的认知。记住，预防永远大于治疗，科学饲养是对${pet}最好的爱。`,
    `最后提醒大家，每只${pet}的情况都不尽相同，本文内容仅供参考。遇到具体问题，建议及时咨询专业兽医，获取针对性的建议。`,
    `掌握这些知识后，建议各位${pet}主人制定一份适合自己${pet}的${t}计划，并坚持执行。长期科学的管理才能带来真正的健康。`,
    `科学饲养${pet}是一项长期工程，${t}只是其中一环。建议持续学习相关知识，为${pet}提供最好的照顾。`,
    `总而言之，${t}关系到${pet}的生活质量和寿命，不容忽视。希望每位${pet}主人都能重视起来。`,
    `建议收藏本文，定期回顾其中的要点。同时关注${pet}的日常变化，做到早发现、早处理。`,
    `通过科学的方法做好${t}，不仅能预防疾病，还能增进你与${pet}之间的感情。这才是养${pet}的真正意义。`,
    `最后强调一点：网络上的信息参差不齐，涉及${pet}健康的问题一定要以专业兽医的意见为准，切勿盲目自行处理。`,
    `希望这篇文章能成为你科学养${pet}路上的一个小帮手。记住，耐心和细心是养好${pet}的关键。`,
    `建议将本文提到的要点整理成清单，贴在显眼位置提醒自己。好的习惯需要坚持才能养成。`,
    `${pet}的健康管理没有捷径，${t}更是如此。从今天开始，用科学的方法守护你的毛孩子吧。`,
    `如果你发现${pet}有任何异常，请不要犹豫，及时就医。专业的诊断和治疗才是对${pet}最大的负责。`,
    `科学养${pet}是一个不断学习的过程，建议关注权威的宠物医疗和营养资讯，持续更新自己的知识库。`,
    `最后送给大家一句话：对${pet}负责，就是对自己负责。愿每只${pet}都能健康快乐地陪伴主人。`,
    `本文内容基于最新的研究和临床实践，但宠物医学在不断发展，建议定期关注相关领域的最新动态。`,
    `做好${t}，不仅能让${pet}更健康，也能为你省下不少医疗开支。这是一笔划算的投资。`,
    `建议将本文分享给身边养${pet}的朋友，让更多人了解科学饲养的重要性。`,
    `养${pet}是一门学问，${t}是必修课。希望本文能帮你在这门课上取得好成绩。`,
    `最后提醒：不要因为${pet}看起来健康就忽视${t}，很多问题在早期是没有明显症状的。`
  ];

  const story = [
    `如今，${pet}依然陪伴在我身边，每当我感到疲惫或失落时，看到它那双清澈的眼睛，所有的烦恼都会烟消云散。这就是养${pet}最大的幸福吧。`,
    `回首这段与${pet}相伴的日子，我深深体会到，原来被一个小生命全心全意地信任和依赖，是这么温暖的一件事。`,
    `窗外的雨停了，阳光透过云层洒进来，照在${pet}柔软的毛发上。我轻轻摸了摸它的头，心里满是感激。`,
    `有人说，${pet}只是我们生命中的一个片段，但我们却是它们生命的全部。想到这里，我更加珍惜与它相处的每一刻。`,
    `夜深了，${pet}已经蜷缩在我身边睡着了，发出轻微的呼噜声。我合上电脑，轻轻对它说：晚安，我的小天使。`,
    `这就是我和${pet}的故事，平凡却珍贵。如果你也在养${pet}，请一定要好好爱它，因为它们的陪伴，真的来之不易。`,
    `看着${pet}在夕阳下奔跑的身影，我突然明白，幸福其实很简单。有一个温暖的家，有一个爱你的小生命，这就够了。`,
    `${pet}教会了我很多：耐心、责任、无条件的爱。这些，都是它送给我最珍贵的礼物。`,
    `故事讲到这里，但我和${pet}的旅程还在继续。未来的路还很长，我会一直牵着它的小爪子，一起走下去。`,
    `每次想到${pet}终有一天会离开，我都会忍不住难过。但正因如此，我才更珍惜现在的每一天，每一分，每一秒。`,
    `生活因为有${pet}而变得丰富多彩，它用小小的身躯，给了我大大的力量。谢谢你，来到我的生命里。`,
    `这就是我们的故事，没有惊天动地，却足以温暖余生。愿每个${pet}都能被温柔以待。`,
    `我轻轻抱起${pet}，它在怀里蹭了蹭，发出满足的咕噜声。这一刻，我觉得自己是世界上最幸福的人。`,
    `时光荏苒，${pet}渐渐长大，但那份初见时的悸动从未改变。谢谢你，选择了我做你的主人。`,
    `写下这些文字的时候，眼眶不禁有些湿润。养${pet}这件事，真的会让人变得柔软呢。`,
    `或许很多年后，当我老去，依然会记得那个阳光明媚的午后，一只小小的${pet}走进了我的生命。`,
    `${pet}不会说话，但它用行动告诉我：爱，不需要语言。这份默契，是我们之间最珍贵的纽带。`,
    `夜深了，我关掉台灯，${pet}习惯性地钻进了我的被窝。好吧，今晚又是一场"抢被子大战"。`,
    `这就是我和${pet}的日常，平淡却温馨。如果你也有这样的一个小生命陪伴，请一定要好好珍惜。`,
    `最后，想对所有${pet}家长说：它们用一生陪伴我们，我们用一生守护它们。这，就是最美的约定。`
  ];

  let list = postType === 'forum' ? forum : postType === 'knowledge' ? knowledge : story;
  let hash = 0;
  for (let i = 0; i < title.length; i++) hash = ((hash << 5) - hash) + title.charCodeAt(i);
  return list[Math.abs(hash) % list.length];
}

// 生成扩展段落
function generateFiller(title, category) {
  const pet = catNames[category] || '宠物';
  const fillers = [
    `说到这里，我想再补充一些细节。很多${pet}主人在实际操作中会发现，理论知识和实际情况之间往往存在差距。比如，有些${pet}对环境的适应能力比想象中要强，而有些则特别敏感。这就需要我们在实践中不断观察、不断调整，找到最适合自家${pet}的方法。毕竟，每只${pet}都是独一无二的个体，没有一套放之四海而皆准的方案。`,
    `其实，在养${pet}的过程中，我最大的体会就是耐心二字。很多问题的产生并不是一朝一夕的，解决起来也需要时间。急于求成往往适得其反，反而会让${pet}产生更大的压力。慢慢来，给${pet}足够的时间去适应，也给自己足够的时间去学习，这才是正确的态度。`,
    `另外，我还想强调一下环境的重要性。${pet}的行为和健康状态，很大程度上取决于它所处的生活环境。一个干净、舒适、安全的环境，能让${pet}更加放松，也更容易接受我们的引导。相反，如果环境嘈杂、脏乱，${pet}很容易产生焦虑和不安，进而引发各种问题。`,
    `值得一提的是，${pet}的年龄和品种也会影响到具体方案的选择。幼年和老年${pet}的体质不同，需要的照顾方式也不一样。不同品种的${pet}在性格、体质、易患疾病等方面都有差异，这些都需要我们在制定计划时充分考虑进去，不能一概而论。`,
    `在这个过程中，与其他${pet}家长的交流也非常重要。很多时候，别人的一句话就能点醒你，让你少走很多弯路。我建议大家可以加入一些当地的${pet}社群，或者在网上关注一些靠谱的宠物博主，多学习、多交流，共同进步。`,
    `还有一点容易被忽视，那就是${pet}的心理健康。很多人只关注${pet}的身体健康，却忽略了它们的情绪变化。其实，${pet}也会感到孤独、焦虑、害怕，这些负面情绪如果长期得不到缓解，同样会影响到它们的身体健康。所以，平时多陪陪${pet}，多跟它们互动，也是非常重要的。`,
    `回顾这段经历，我深刻体会到养${pet}是一门需要不断学习的学问。没有人生来就是完美的铲屎官，都是在一次次试错中慢慢成长起来的。重要的是保持一颗学习的心，遇到问题不逃避，积极寻找解决方案，这样才能和${pet}一起走得更远。`,
    `最后想说的是，养${pet}虽然辛苦，但带来的快乐也是无可替代的。当你看到${pet}健康快乐地成长，当你感受到它对你无条件的信任和依赖，所有的付出都变得值得。这份感情，是任何物质都无法衡量的珍贵财富。`
  ];
  let hash = 0;
  for (let i = 0; i < title.length; i++) hash = ((hash << 5) - hash) + title.charCodeAt(i);
  return fillers[Math.abs(hash) % fillers.length];
}

// 彻底清理内容中的模板化开头和结尾
function cleanContent(content) {
  let cleaned = content;

  // 去掉常见模板化开头（匹配整句）
  const openingPhrases = [
    '各位铲屎官们好！',
    '各位铲屎官好！',
    '认识我家',
    '先说背景，',
    '我的经验总结如下：',
    '事情是这样的，',
    '通过科学的认知和正确的管理，',
    '作为负责任的',
    '如果你也在经历类似的问题，',
    '希望我的分享对大家有帮助！',
    '最后提醒大家，',
    '最后送大家一句话：',
    '希望大家',
    '有问题欢迎',
    '觉得有用',
    '记住，',
    '总之，',
    '最后，',
  ];

  for (const phrase of openingPhrases) {
    if (cleaned.startsWith(phrase)) {
      cleaned = cleaned.substring(phrase.length);
    }
  }

  // 去掉常见模板化结尾
  const endingPhrases = [
    '希望我的分享对大家有帮助！',
    '如果你也在经历类似的问题，',
    '最后提醒大家，',
    '通过科学的认知和正确的管理，',
    '作为负责任的',
    '总之，',
    '以上就是',
    '最后送',
    '希望大家',
    '有问题欢迎',
    '觉得有用',
    '记住，',
  ];

  for (const phrase of endingPhrases) {
    const idx = cleaned.lastIndexOf(phrase);
    if (idx > cleaned.length * 0.7) {
      cleaned = cleaned.substring(0, idx);
    }
  }

  // 去掉编号
  cleaned = cleaned.replace(/(?:^|\n)(?:第[一二三四五六七八九十]+[，、.\s]|\d+[.．、][\s]*|[一二三四五六七八九十]+[.．、][\s]*)/g, '\n');

  // 清理多余空行
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n').trim();

  return cleaned;
}

// 将内容分成3段
function splitIntoParagraphs(text) {
  const sentences = text.split(/(?<=[。！？.!?])\s*/).filter(s => s.trim().length > 0);
  if (sentences.length < 6) return [text];

  const total = sentences.length;
  const p1End = Math.ceil(total / 3);
  const p2End = Math.ceil(total * 2 / 3);

  return [
    sentences.slice(0, p1End).join(''),
    sentences.slice(p1End, p2End).join(''),
    sentences.slice(p2End).join('')
  ].filter(p => p.trim().length > 0);
}

// 重写单篇文章
function rewritePost(post) {
  const opening = generateOpening(post.title, post.post_type, post.category);
  const ending = generateEnding(post.title, post.post_type, post.category);
  const core = cleanContent(post.content);
  const paragraphs = splitIntoParagraphs(core);

  const parts = [opening];
  parts.push(...paragraphs);
  parts.push(ending);

  let result = parts.join('\n\n');

  // 如果太短，插入扩展内容
  if (result.length < 800) {
    const filler = generateFiller(post.title, post.category);
    if (parts.length >= 3) {
      parts.splice(2, 0, filler);
      result = parts.join('\n\n');
    }
  }

  return result;
}

async function main() {
  const db = await mysql.createConnection({
    host: 'localhost', user: 'pet', password: 'pet147258!', database: 'pet'
  });

  console.log('Connected.\n');

  const [posts] = await db.query('SELECT id, title, post_type, category, content FROM posts ORDER BY id');
  console.log(`Found ${posts.length} posts.\n`);

  let updated = 0;

  for (let i = 0; i < posts.length; i++) {
    const post = posts[i];
    const newContent = rewritePost(post);
    await db.query('UPDATE posts SET content = ? WHERE id = ?', [newContent, post.id]);
    updated++;

    if ((i + 1) % 30 === 0 || i === posts.length - 1) {
      console.log(`  Progress: ${i + 1}/${posts.length}`);
    }
  }

  console.log(`\nDone! ${updated} posts updated.`);

  // 验证
  const [verify] = await db.query('SELECT MIN(CHAR_LENGTH(content)) as minLen, MAX(CHAR_LENGTH(content)) as maxLen, COUNT(*) as cnt FROM posts');
  console.log(`\nVerification: ${verify[0].cnt} posts, min ${verify[0].minLen} chars, max ${verify[0].maxLen} chars`);

  // 抽样检查
  const [samples] = await db.query('SELECT id, title, post_type, content FROM posts ORDER BY RAND() LIMIT 5');
  console.log(`\nSample checks:`);
  for (const s of samples) {
    const ps = s.content.split(/\n\n+/).filter(p => p.trim().length > 20);
    console.log(`\n  [${s.post_type}] "${s.title.substring(0, 40)}..."`);
    console.log(`  Paragraphs: ${ps.length}, Chars: ${s.content.length}`);
    console.log(`  P1: ${ps[0].substring(0, 60)}...`);
    if (ps.length >= 3) console.log(`  P2: ${ps[1].substring(0, 60)}...`);
    console.log(`  P${ps.length}: ...${ps[ps.length-1].substring(ps[ps.length-1].length-60)}`);
  }

  await db.end();
}

main().catch(console.error);
