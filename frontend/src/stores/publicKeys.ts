import { Models } from 'appwrite'
import { map } from 'nanostores'
import appwrite from 'src/lib/appwrite'

export const keys = map<Record<string, string>>({})

export async function loadKey(userId: string) {
	const { public: publicKey } = await appwrite.database.getDocument<
		Models.Document & { public: string }
	>('chat_keys', userId)
	keys.setKey(userId, publicKey)
	return publicKey
}

export default keys
