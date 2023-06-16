require('dotenv').config()
const express = require('express')

const app = express()
const port = 5000

// CORS
const cors = require('cors')

app.use(
	cors({
		origin: 'http://localhost:3000',
		credentials: true,
	})
)

const handleUpload = require('./middleware/handleUpload')
const uploadController = require('./controller/uploadController')
app.post('/upload', handleUpload, uploadController)

app.listen(port, () => {
	console.log(`Server đang chạy ở port:${port}`)
})
