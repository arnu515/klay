/**
 * Function for creating an appwrite JWT.
 * Returns the same JWT if 15 minutes haven't passed since creation of the previous JWT.
 */

import appwrite from './appwrite'

export let jwt = ''
export let jwtCreatedAt = 0

export async function getJWT() {
	try {
		if (jwt && jwtCreatedAt + 15 * 60 * 1000 > Date.now()) {
			return jwt
		}
		jwt = (await appwrite.account.createJWT()).jwt
		jwtCreatedAt = Date.now()
		return jwt
	} catch {
		return ''
	}
}
