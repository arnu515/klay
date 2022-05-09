import { Models } from 'appwrite'
import { atom, onMount } from 'nanostores'
import appwrite from 'src/lib/appwrite'
import * as e from '../lib/encryption'
import user from './user'

type PrivateKeyEncrypted = { iv: string; data: string }

export const privateKey = atom<string | null>(null)

onMount(privateKey, () => {
	privateKey.set(checkPrivateKey())
	return () => privateKey.set(null)
})

export function checkPrivateKey(): string | null {
	const key = localStorage.getItem('privateKey')
	if (!key) return null
	return key
}

export async function getKey(
	pw: string
): Promise<{ key: string; privateKey: CryptoKey } | null> {
	const u = user.get()
	if (!u) return null

	const keys = await appwrite.database.getDocument<
		Models.Document & { private: string }
	>('chat_keys', u.$id)
	const privateKeyJson = (await new Promise(x => {
		try {
			x(JSON.parse(keys.private))
		} catch {
			x(null)
		}
	})) as PrivateKeyEncrypted | null
	if (!privateKeyJson) return null
	if (typeof privateKeyJson.data !== 'string' || typeof privateKeyJson.iv !== 'string')
		return null

	try {
		const key = await e.Symmetric.decryptSymmetric(privateKeyJson, pw)
		const privateKey = await e.Asymetric.getKey(
			'private',
			e.Asymetric.cleanKeys({ publicKey: '', privateKey: key }).privateKey
		)
		localStorage.setItem('privateKey', key)
		return { key, privateKey }
	} catch (e) {
		console.log(e)
		return null
	}
}

export default privateKey
