import { atom, action } from 'nanostores'
import type { Models } from 'appwrite'
import appwrite from '../lib/appwrite'

// using atom instead of map because map doesn't allow null
// and only the whole object gets changed at a time
export const user = atom<Models.User<Models.Preferences> | null>(null)

export const loadUser = action(user, 'loadUser', async () => {
	let u = null
	try {
		u = await appwrite.account.get()
	} catch {}
	user.set(u)
})

export default user
