const multer = require("multer");

const storage = multer.memoryStorage({
  destination: (request, file, callback) => {
    callback(null, "./uploads");
  },
});

const upload = multer({
  storage,
  limit: {
    fileSize: 1024 * 1024 * 8,
  },
});

exports.upload = upload;
