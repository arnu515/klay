import { LocalStorageCache } from '.'
import { Profile, SafeUser } from '../types'
import { getProfileOfUser } from '../util'

export const profileCache = new LocalStorageCache('profile', '1 day')

export async function getProfile(
	userId: string
): Promise<{ user: SafeUser; profile: Profile }> {
	let profile = profileCache.get(userId)

	if (!profile) {
		profile = await getProfileOfUser(userId)
		profileCache.set(userId, profile)
	}

	return profile
}

export default profileCache
