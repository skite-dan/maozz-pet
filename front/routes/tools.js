const express = require('express');
const { success, error } = require('../../shared/utils/response');

const router = express.Router();

// 宠物年龄计算
router.get('/pet-age', (req, res) => {
  try {
    const { type = 'cat', age } = req.query;
    const a = parseFloat(age);
    if (isNaN(a) || a < 0) return error(res, 400, '请输入有效的年龄');

    let humanAge = 0;
    if (type === 'cat') {
      if (a <= 1) humanAge = a * 15;
      else if (a <= 2) humanAge = 15 + (a - 1) * 9;
      else humanAge = 24 + (a - 2) * 4;
    } else if (type === 'dog-small') {
      if (a <= 1) humanAge = a * 15;
      else if (a <= 2) humanAge = 15 + (a - 1) * 9;
      else humanAge = 24 + (a - 2) * 5;
    } else if (type === 'dog-medium') {
      if (a <= 1) humanAge = a * 15;
      else if (a <= 2) humanAge = 15 + (a - 1) * 9;
      else humanAge = 24 + (a - 2) * 6;
    } else {
      if (a <= 1) humanAge = a * 12;
      else if (a <= 2) humanAge = 12 + (a - 1) * 9;
      else humanAge = 21 + (a - 2) * 7;
    }

    const stage = humanAge < 18 ? '青少年' : humanAge < 50 ? '成年' : '中老年';
    success(res, { type, petAge: a, humanAge: Math.round(humanAge), stage });
  } catch (err) {
    return error(res, 500, err.message);
  }
});

module.exports = router;
