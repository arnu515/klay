import { atom, action } from 'nanostores'
import type { Models } from 'appwrite'
import appwrite from '../lib/appwrite'
import keyPair, { checkKeys } from './keyPair'
import { loadChatRequests } from './chatRequests'
import { loadContacts } from './contacts'
import { getMessages } from './messages'

// using atom instead of map because map doesn't allow null
// and only the whole object gets changed at a time
export const user = atom<Models.User<Models.Preferences> | null>(null)

interface Profile {
	$id: string
	avatar_url: string
	bio: string | null
	status: string
}

export const profile = atom<Profile | null>(null)

export const loadUser = action(user, 'loadUser', async () => {
	let u = null
	try {
		u = await appwrite.account.get()
	} catch {}
	user.set(u)

	localStorage.removeItem('jwt')
	localStorage.removeItem('jwtCreatedAt')

	if (u) {
		// load profile
		const p = await appwrite.database.getDocument('profiles', u.$id)
		profile.set(p as any)

		// load contacts and chats
		await loadChatRequests()
		await loadContacts()
		await getMessages()
	} else profile.set(null)

	keyPair.set(await checkKeys())
})

export default user
