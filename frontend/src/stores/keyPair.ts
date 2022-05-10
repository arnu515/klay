import { Models } from 'appwrite'
import { atom, onMount } from 'nanostores'
import appwrite from 'src/lib/appwrite'
import * as e from '../lib/encryption'
import { loadKey } from './publicKeys'
import user from './user'

type PrivateKeyEncrypted = { iv: string; data: string }

type KeyPair = { privateKey: string; publicKey: string }

export const keyPair = atom<KeyPair | null>(null)

onMount(keyPair, async () => {
	keyPair.set(await checkKeys())
	return () => keyPair.set(null)
})

export async function checkKeys(): Promise<KeyPair | null> {
	const u = user.get()
	if (!u) return null
	const prkey = localStorage.getItem('privateKey')
	const pukey = localStorage.getItem('publicKey')
	if (!prkey || !pukey) return null
	// validate public key
	const keyFromDb = await loadKey(u.$id)
	if (keyFromDb !== pukey) {
		localStorage.removeItem('publicKey')
		localStorage.removeItem('privateKey')
		return null
	}
	return {
		privateKey: prkey,
		publicKey: pukey
	}
}

export async function getKeys(pw: string): Promise<KeyPair | null> {
	const u = user.get()
	if (!u) return null

	const keys = await appwrite.database.getDocument<
		Models.Document & { private: string; public: string }
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
		const privateKey = await e.Symmetric.decryptSymmetric(privateKeyJson, pw)
		await e.Asymetric.getKey(
			'private',
			e.Asymetric.cleanKeys({ publicKey: '', privateKey: privateKey }).privateKey
		)
		localStorage.setItem('privateKey', privateKey)
		localStorage.setItem('publicKey', keys.public)
		return {
			publicKey: keys.public,
			privateKey
		}
	} catch (e) {
		console.log(e)
		return null
	}
}

export default keyPair
