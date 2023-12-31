// Multer
const multer = require('multer')
const handleUpload = (req, res, next) => {
	const maxSize = 1024 * 1024 * 3
	const upload = multer({
		limits: { fileSize: maxSize },
		fileFilter: (req, file, cb) => {
			if (file.mimetype !== 'image/png' && file.mimetype !== 'image/jpeg') {
				return cb(null, false)
			}
			cb(null, true)
		},
	}).array('images', 5)

	upload(req, res, function (err) {
		if (err) {
			return res.status(400).json({
				message: 'Có lỗi xảy ra' + err.message,
			})
		}
		next()
	})
}

module.exports = handleUpload
