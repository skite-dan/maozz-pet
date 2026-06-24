require('dotenv').config();
const mysql = require('mysql2/promise');

const config = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'maozz_pet',
  charset: 'utf8mb4',
  timezone: '+08:00',
};

/**
 * 格式化帖子内容：
 * 1. 段与段之间没有空行（去除空段落）
 * 2. 每段首行缩进2个字符（添加 &emsp;&emsp;）
 */
function formatContent(content) {
  if (!content || typeof content !== 'string') return content;

  // 按行分割
  let lines = content.split('\n');

  // 步骤1：去除空行，合并段落
  // 将连续的非空行视为一个段落（保留换行），空行作为段落分隔
  let paragraphs = [];
  let currentPara = [];

  for (let line of lines) {
    let trimmed = line.trim();
    if (trimmed === '') {
      // 空行：结束当前段落
      if (currentPara.length > 0) {
        paragraphs.push(currentPara.join(''));
        currentPara = [];
      }
    } else {
      currentPara.push(line);
    }
  }
  // 处理最后一段
  if (currentPara.length > 0) {
    paragraphs.push(currentPara.join(''));
  }

  // 步骤2：每段首行缩进2个字符
  // 使用 &emsp;&emsp; 实现首行缩进2个字符
  let formatted = paragraphs.map(para => {
    let trimmed = para.trim();
    if (!trimmed) return '';
    // 如果段落已经有首行缩进，先去掉
    trimmed = trimmed.replace(/^(&emsp;|&ensp;|&nbsp;|\s)+/, '');
    // 添加2个全角空格缩进（&emsp; 表示一个全角空格）
    return '&emsp;&emsp;' + trimmed;
  });

  // 用 <p> 标签包裹每段，段间无空行
  return formatted.map(p => '<p>' + p + '</p>').join('');
}

async function main() {
  const pool = mysql.createPool(config);

  try {
    // 获取所有帖子
    const [posts] = await pool.query('SELECT id, title, content FROM posts ORDER BY id');
    console.log(`共找到 ${posts.length} 条帖子，开始格式化...\n`);

    let updated = 0;
    let skipped = 0;
    let errors = 0;

    for (const post of posts) {
      const original = post.content || '';

      // 如果已经是HTML格式（包含<p>标签），需要特殊处理
      let needsFormat = true;
      let formatted = original;

      if (original.includes('<p>') || original.includes('<br')) {
        // 已经是HTML，先提取文本内容再重新格式化
        // 去掉所有HTML标签，保留文本
        let textOnly = original
          .replace(/<p[^>]*>/gi, '')
          .replace(/<\/p>/gi, '\n')
          .replace(/<br\s*\/?>/gi, '\n')
          .replace(/<[^>]+>/g, ''); // 去掉其他标签

        // 解码HTML实体
        textOnly = textOnly
          .replace(/&emsp;/g, '　')
          .replace(/&ensp;/g, ' ')
          .replace(/&nbsp;/g, ' ')
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .replace(/&amp;/g, '&');

        formatted = formatContent(textOnly);
      } else {
        // 纯文本，直接格式化
        formatted = formatContent(original);
      }

      // 检查是否有变化
      if (formatted === original) {
        skipped++;
        console.log(`[#${post.id}] ${post.title.substring(0, 30)}... - 无需修改`);
        continue;
      }

      // 更新数据库
      try {
        await pool.query('UPDATE posts SET content = ? WHERE id = ?', [formatted, post.id]);
        updated++;
        console.log(`[#${post.id}] ${post.title.substring(0, 30)}... - 已更新`);
      } catch (err) {
        errors++;
        console.error(`[#${post.id}] 更新失败: ${err.message}`);
      }
    }

    console.log(`\n=== 格式化完成 ===`);
    console.log(`已更新: ${updated} 条`);
    console.log(`跳过: ${skipped} 条`);
    console.log(`失败: ${errors} 条`);

    // 验证几条结果
    console.log(`\n=== 验证样本 ===`);
    const [samples] = await pool.query('SELECT id, title, LEFT(content, 300) as content FROM posts ORDER BY id LIMIT 3');
    for (const post of samples) {
      console.log(`\n[#${post.id}] ${post.title}`);
      console.log(post.content);
    }

  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await pool.end();
  }
}

main();
