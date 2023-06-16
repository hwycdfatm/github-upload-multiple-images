async function uploadController(req, res) {
	try {
		if (!req.files || Object.keys(req.files).length === 0)
			return res.status(400).json({ message: 'Vui lòng chọn hình ảnh' })
		const files = req.files

		// create blob and tree
		const blobs = await Promise.all(
			files.map((file) => {
				const base64 = file.buffer.toString('base64')
				const data = {
					content: base64,
					encoding: 'base64',
				}
				return fetch(
					`https://api.github.com/repos/${process.env.GITHUB_REPO}/git/blobs`,
					{
						method: 'POST',
						headers: {
							Authorization: `Token ${process.env.TOKEN_GITHUB_UPLOAD_IMAGES}`,
							'Content-type': 'application/vnd.github+json',
						},
						body: JSON.stringify(data),
					}
				)
			})
		)

		const blobsData = await Promise.all(blobs.map((blob) => blob.json()))

		const blobsSHA = blobsData.map((blob) => blob.sha)

		const treeSHA = await fetch(
			`https://api.github.com/repos/${process.env.GITHUB_REPO}/git/trees/main`,
			{
				method: 'GET',
				headers: {
					Authorization: `Token ${process.env.TOKEN_GITHUB_UPLOAD_IMAGES}`,
					'Content-type': 'application/vnd.github+json',
				},
			}
		)

		const treeSHAData = await treeSHA.json()

		const treeSHADataSHA = treeSHAData.sha

		const treeArray = blobsSHA.map((sha, index) => ({
			path: Date.now() + files[index].originalname,
			mode: '100644',
			type: 'blob',
			sha,
		}))
		const treeData = await fetch(
			`https://api.github.com/repos/${process.env.GITHUB_REPO}/git/trees`,
			{
				method: 'POST',
				headers: {
					Authorization: `Token ${process.env.TOKEN_GITHUB_UPLOAD_IMAGES}`,
					'Content-type': 'application/vnd.github+json',
				},
				body: JSON.stringify({
					base_tree: treeSHADataSHA,
					tree: treeArray,
				}),
			}
		)

		const treeDataData = await treeData.json()

		const treeDataDataSHA = treeDataData.sha

		// create commit
		const commit = await fetch(
			`https://api.github.com/repos/${process.env.GITHUB_REPO}/git/commits`,
			{
				method: 'POST',
				headers: {
					Authorization: `Token ${process.env.TOKEN_GITHUB_UPLOAD_IMAGES}`,
					'Content-type': 'application/vnd.github+json',
				},
				body: JSON.stringify({
					message: 'upload image',
					tree: treeDataDataSHA,
					parents: [treeSHADataSHA],
				}),
			}
		)

		const commitData = await commit.json()

		const commitDataSHA = commitData.sha

		// update reference
		await fetch(
			`https://api.github.com/repos/${process.env.GITHUB_REPO}/git/refs/heads/main`,
			{
				method: 'PATCH',
				headers: {
					Authorization: `Token ${process.env.TOKEN_GITHUB_UPLOAD_IMAGES}`,
					'Content-type': 'application/vnd.github+json',
				},
				body: JSON.stringify({
					sha: commitDataSHA,
					force: true,
				}),
			}
		)

		// get image url
		const imageUrls = treeArray.map((item) => {
			return {
				public_name: item.path,
				url: `https://raw.githubusercontent.com/${process.env.GITHUB_REPO}/main/${item.path}`,
			}
		})

		return res.status(200).json({ message: 'Upload ảnh thành công', imageUrls })
	} catch (error) {
		return res.status(500).json({ message: 'Có lỗi xảy ra ' + error.message })
	}
}

module.exports = uploadController
