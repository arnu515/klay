/**
 * Function for creating an appwrite JWT.
 * Returns the same JWT if 15 minutes haven't passed since creation of the previous JWT.
 */

import appwrite from './appwrite'

export async function getJWT() {
	try {
		let jwt = localStorage.getItem('jwt')
		let jwtCreatedAt = parseInt(localStorage.getItem('jwtCreatedAt') || '0')
		if (jwt && jwtCreatedAt + 15 * 60 * 1000 > Date.now()) {
			return jwt
		}
		jwt = (await appwrite.account.createJWT()).jwt
		jwtCreatedAt = Date.now()
		localStorage.setItem('jwt', jwt)
		localStorage.setItem('jwtCreatedAt', jwtCreatedAt.toString())
		return jwt
	} catch {
		return ''
	}
}
