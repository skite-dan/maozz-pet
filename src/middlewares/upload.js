const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const mime = require('mime-types');
const config = require('../../config');
const fs = require('fs');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = file.mimetype.startsWith('video/') ? config.upload.dir + '/videos' : config.upload.dir + '/images';
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '.' + mime.extension(file.mimetype);
    const name = `${Date.now()}_${uuidv4().slice(0, 8)}${ext}`;
    cb(null, name);
  },
});

const fileFilter = (req, file, cb) => {
  const allowed = [...config.upload.allowedImageTypes, ...config.upload.allowedVideoTypes];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`不支持的文件类型: ${file.mimetype}`), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
});

const uploadImages = upload.array('images', 9);
const uploadVideos = upload.array('videos', 3);
const uploadMedia = upload.fields([
  { name: 'images', maxCount: 9 },
  { name: 'videos', maxCount: 3 },
]);

module.exports = { upload, uploadImages, uploadVideos, uploadMedia };
