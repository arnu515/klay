const sdk = require('node-appwrite')
const fs = require('fs')

/*
  'req' variable has:
    'headers' - object with request headers
    'payload' - object with request body data
    'env' - object with environment variables

  'res' variable has:
    'send(text, status)' - function to return text response. Status code defaults to 200
    'json(obj, status)' - function to return JSON response. Status code defaults to 200

  If an error is thrown, a response with code 500 will be returned.
*/

module.exports = async function (req, res) {
	if (req.env['APPWRITE_FUNCTION_TRIGGER'] !== 'event')
		throw new Error('Function can only be called by event')
	const client = new sdk.Client()
	const data = JSON.parse(req.env['APPWRITE_FUNCTION_EVENT_DATA'])
	const event = req.env['APPWRITE_FUNCTION_EVENT']
	const users = new sdk.Users(client)
	const db = new sdk.Database(client)
	const avatars = new sdk.Avatars(client)
	const storage = new sdk.Storage(client)

	if (!req.env['APPWRITE_FUNCTION_ENDPOINT'] || !req.env['APPWRITE_FUNCTION_API_KEY']) {
		throw new Error(
			'Environment variables are not set. Function cannot use Appwrite SDK.'
		)
	} else {
		client
			.setEndpoint(req.env['APPWRITE_FUNCTION_ENDPOINT'])
			.setProject(req.env['APPWRITE_FUNCTION_PROJECT_ID'])
			.setKey(req.env['APPWRITE_FUNCTION_API_KEY'])
			.setSelfSigned(true)
	}

	user = data
	let profile = {}
	if (event.includes('create')) {
		user = await users.get(data.$id)
		await users.updateVerification(user.$id, true)
		const avatar = await avatars.getInitials(user.name, 64, 64)
		fs.writeFileSync(__dirname + '/avatar.png', avatar, 'binary')
		const file = await storage.createFile(
			'avatars',
			user.$id,
			__dirname + '/avatar.png'
		)
		profile = await db.createDocument('profiles', user.$id, {
			avatar_url: `${req.env['APPWRITE_FUNCTION_ENDPOINT']}/storage/buckets/avatars/files/${user.$id}/view?project=${req.env['APPWRITE_FUNCTION_PROJECT_ID']}`,
			status: 'A Klay user'
		})
		profile = await db.createDocument('contacts', 'unique()', {
			userId1: user.$id,
			userId2: 'notetoself'
		}, [`user:${user.$id}`, `user:notetoself`])
	} else if (event.includes('delete')) {
		await storage.deleteFile('avatars', user.$id)
		await db.deleteDocument('profiles', user.$id)
	}

	res.json({
		user,
		profile,
		env: req.env
	})
}
