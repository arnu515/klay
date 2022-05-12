import { InMemoryCache } from '.'
import { Models } from 'appwrite'
import appwrite from 'src/lib/appwrite'

export const keys = new InMemoryCache('keys', '1 hour')

export async function loadKey(userId: string, force = false) {
	if (!force && keys.get(userId)) return keys.get(userId)
	const { public: publicKey } = await appwrite.database.getDocument<
		Models.Document & { public: string }
	>('chat_keys', userId)
	keys.set(userId, publicKey)
	return publicKey
}

export default keys
