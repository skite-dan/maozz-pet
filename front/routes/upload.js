const express = require('express');
const path = require('path');
const { uploadImages, uploadVideos, uploadMedia } = require('../../shared/middlewares/upload');
const { success, error } = require('../../shared/utils/response');

const router = express.Router();

// 上传图片
router.post('/images', uploadImages, (req, res) => {
  try {
    if (!req.files || req.files.length === 0) return error(res, 400, '请选择要上传的图片');
    const files = req.files.map(f => ({
      url: `/uploads/images/${f.filename}`,
      filename: f.filename,
      size: f.size,
      mimetype: f.mimetype,
    }));
    success(res, files, '图片上传成功');
  } catch (err) {
    return error(res, 500, '图片上传失败: ' + err.message);
  }
});

// 上传视频
router.post('/videos', uploadVideos, (req, res) => {
  try {
    if (!req.files || req.files.length === 0) return error(res, 400, '请选择要上传的视频');
    const files = req.files.map(f => ({
      url: `/uploads/videos/${f.filename}`,
      filename: f.filename,
      size: f.size,
      mimetype: f.mimetype,
    }));
    success(res, files, '视频上传成功');
  } catch (err) {
    return error(res, 500, '视频上传失败: ' + err.message);
  }
});

// 上传媒体（图片+视频混合）
router.post('/media', uploadMedia, (req, res) => {
  try {
    const images = (req.files.images || []).map(f => ({
      type: 'image', url: `/uploads/images/${f.filename}`, filename: f.filename, size: f.size, mimetype: f.mimetype,
    }));
    const videos = (req.files.videos || []).map(f => ({
      type: 'video', url: `/uploads/videos/${f.filename}`, filename: f.filename, size: f.size, mimetype: f.mimetype,
    }));
    success(res, { images, videos }, '媒体上传成功');
  } catch (err) {
    return error(res, 500, '媒体上传失败: ' + err.message);
  }
});

module.exports = router;
