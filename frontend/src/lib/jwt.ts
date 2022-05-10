/**
 * Function for creating an appwrite JWT.
 * Returns the same JWT if 15 minutes haven't passed since creation of the previous JWT.
 */

import appwrite from './appwrite'
import { LocalStorageCache } from 'src/lib/cache'

const jwtCache = new LocalStorageCache('jwt', '13 minutes')

export async function getJWT() {
	try {
		let jwt = jwtCache.get('jwt')
		let jwtAt = jwtCache.get('jwtAt')
		if (
			typeof jwt === 'string' &&
			typeof jwtAt === 'number' &&
			jwtAt + 15 * 60 * 1000 < Date.now()
		) {
			return jwt
		}
		jwt = (await appwrite.account.createJWT()).jwt
		jwtAt = Date.now()
		jwtCache.set('jwt', jwt)
		jwtCache.set('jwtAt', jwtAt)
		return jwt
	} catch {
		return ''
	}
}
