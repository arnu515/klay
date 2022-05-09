// https://voracious.dev/a-practical-guide-to-the-web-cryptography-api
// https://jsfiddle.net/w2ueqbnm/

export interface KeyPair {
	publicKey: string
	privateKey: string
}

export interface Encrypted {
	cipher: string
	iv: string
}

export function pack(buffer: ArrayBuffer) {
	return btoa(String.fromCharCode.apply(null, new Uint8Array(buffer) as any))
}

export function unpack(packed: string) {
	const str = atob(packed)
	const buffer = new Uint8Array(new ArrayBuffer(str.length))
	for (let i = 0; i < str.length; i++) {
		buffer[i] = str.charCodeAt(i)
	}
	return buffer
}

export function generateIv() {
	return crypto.getRandomValues(new Uint8Array(16))
}

export function encode(str: string) {
	const encoder = new TextEncoder()
	return encoder.encode(str)
}
export function decode(buffer: ArrayBuffer) {
	const decoder = new TextDecoder('utf-8')
	return decoder.decode(buffer)
}

export class Asymetric {
	static async generateKeys(): Promise<KeyPair> {
		const keys = await crypto.subtle.generateKey(
			{
				name: 'RSA-OAEP',
				modulusLength: 4096,
				publicExponent: new Uint8Array([0x01, 0x00, 0x01]),
				hash: { name: 'SHA-256' }
			},
			true,
			['encrypt', 'decrypt']
		)
		const pubKeyBuffer = await crypto.subtle.exportKey('spki', keys.publicKey!)
		const privKeyBuffer = await crypto.subtle.exportKey('pkcs8', keys.privateKey!)
		const pubKeyB64 = pack(pubKeyBuffer)
		const privKeyB64 = pack(privKeyBuffer)
		const publicKey = `-----BEGIN PUBLIC KEY-----\n${pubKeyB64}\n-----END PUBLIC KEY-----`
		const privateKey = `-----BEGIN PRIVATE KEY-----\n${privKeyB64}\n-----END PRIVATE KEY-----`
		console.log('Generated', { publicKey, privateKey })
		return { publicKey, privateKey }
	}

	static cleanKeys(keyPair: KeyPair): KeyPair {
		const publicKey = keyPair.publicKey
			.replace('-----BEGIN PUBLIC KEY-----', '')
			.replace('-----END PUBLIC KEY-----', '')
			.trim()
		const privateKey = keyPair.privateKey
			.replace('-----BEGIN PRIVATE KEY-----', '')
			.replace('-----END PRIVATE KEY-----', '')
			.trim()
		console.log('Cleaned', { publicKey, privateKey })
		return { publicKey, privateKey }
	}

	static async getKeys(keys: KeyPair): Promise<CryptoKeyPair> {
		const keyPair = Asymetric.cleanKeys(keys)
		const publicKey = await Asymetric.getKey('public', keyPair.publicKey)
		const privateKey = await Asymetric.getKey('private', keyPair.privateKey)
		return {
			publicKey,
			privateKey
		}
	}

	static async getKey(type: 'public' | 'private', key: string): Promise<CryptoKey> {
		if (type === 'public') {
			const publicKey = await crypto.subtle.importKey(
				'spki',
				unpack(key),
				{
					name: 'RSA-OAEP',
					hash: { name: 'SHA-256' }
				},
				true,
				['encrypt']
			)
			console.log(publicKey)
			return publicKey
		} else {
			const privateKey = await crypto.subtle.importKey(
				'pkcs8',
				unpack(key),
				{
					name: 'RSA-OAEP',
					hash: { name: 'SHA-256' }
				},
				true,
				['decrypt']
			)
			console.log(privateKey)
			return privateKey
		}
	}

	static async encrypt(data: string, pubKey: CryptoKey): Promise<Encrypted> {
		const enc = new TextEncoder().encode(data)
		const iv = generateIv()
		const cipher = await crypto.subtle.encrypt(
			{
				name: 'RSA-OAEP',
				iv: iv
			},
			pubKey,
			enc
		)

		return {
			cipher: pack(cipher),
			iv: pack(iv)
		}
	}

	static async decrypt(data: Encrypted, privKey: CryptoKey) {
		const cipher = unpack(data.cipher)
		const encoded = await crypto.subtle.decrypt(
			{
				name: 'RSA-OAEP',
				iv: unpack(data.iv)
			},
			privKey,
			cipher
		)
		return new TextDecoder().decode(encoded)
	}
}

// symmetric encryption
export class Symmetric {
	static async getKeyFromPw(pw: string) {
		const imported = await window.crypto.subtle.importKey(
			'raw',
			encode(pw),
			{ name: 'PBKDF2' },
			false,
			['deriveKey']
		)
		const key = await window.crypto.subtle.deriveKey(
			{
				name: 'PBKDF2',
				salt: encode('the salt is this random string'),
				iterations: 100000,
				hash: 'SHA-256'
			},
			imported,
			{
				name: 'AES-GCM',
				length: 128
			},
			false,
			['encrypt', 'decrypt']
		)
		return key
	}

	static async encryptSymmetric(text: string, pw: string) {
		const key = await Symmetric.getKeyFromPw(pw)
		const iv = generateIv()
		const result = await window.crypto.subtle.encrypt(
			{ name: 'AES-GCM', iv: iv },
			key,
			encode(text)
		)
		const encrypted_data = new Uint8Array(result)
		return { data: pack(encrypted_data), iv: pack(iv) }
	}

	static async decryptSymmetric(payload: { data: string; iv: string }, pw: string) {
		const data = unpack(payload.data)
		const iv = unpack(payload.iv)
		const key = await Symmetric.getKeyFromPw(pw)
		const result = await window.crypto.subtle.decrypt(
			{ name: 'AES-GCM', iv: iv },
			key,
			data
		)
		const decrypted = new Uint8Array(result)
		return decode(decrypted)
	}
}
