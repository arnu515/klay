import { Models, Query } from 'appwrite'
import { action, atom, onMount } from 'nanostores'
import { Notify } from 'quasar'
import appwrite from 'src/lib/appwrite'
import type { Contacts as C, Profile, SafeUser } from 'src/lib/types'
import { getProfileOfUser } from 'src/lib/util'
import user from './user'

interface Contacts extends C {
	profile1: Profile
	profile2: Profile
	user1: SafeUser
	user2: SafeUser
}

export const contacts = atom<Contacts[]>([])

onMount(contacts, () => {
	console.log('[c] Subscibed to store')
	let unsubscribeAw: (() => void) | undefined
	const unsubscribeUser = user.subscribe(i => {
		if (unsubscribeAw) return
		if (!i) return
		console.log('[c] Subscribed to appwrite')
		unsubscribeAw = appwrite.subscribe<C>(
			'collections.contacts.documents',
			async doc => {
				if (doc.event.includes('create')) {
					const u1 = await getProfileOfUser(doc.payload.userId1)
					const u2 = await getProfileOfUser(doc.payload.userId2)
					if (!u1 || !u2) {
						// invalid data, can't trust it
						return
					}
					const request: Contacts = {
						...doc.payload,
						profile1: u1.profile,
						profile2: u2.profile,
						user1: u1.user,
						user2: u2.user
					}
					contacts.set([...contacts.get(), request])
					Notify.create({
						message: `${request.user1.name} accepted your chat request`,
						color: 'white',
						textColor: 'black'
					})
				} else if (doc.event.includes('delete')) {
					// silently delete
					contacts.set(contacts.get().filter(i => i.$id !== doc.payload.$id))
				}
			}
		)
	})
	return () => {
		unsubscribeUser()
		console.log('[c] Unsubscribed from store')

		if (unsubscribeAw) {
			unsubscribeAw()
			console.log('[c] Unsubscribed from appwrite')
		}
	}
})

export const loadContacts = action(contacts, 'loadContacts', async () => {
	const u = user.get()
	if (!u) return
	const res1 = await appwrite.database.listDocuments<Models.Document & C>('contacts', [
		Query.equal('userId1', u.$id)
	])
	const res2 = await appwrite.database.listDocuments<Models.Document & C>('contacts', [
		Query.equal('userId2', u.$id)
	])
	const res = {
		total: res1.total + res2.total,
		documents: res1.documents.concat(res2.documents)
	}
	const requests = [] as Contacts[]
	for await (const doc of res.documents) {
		const u1 = await getProfileOfUser(doc.userId1)
		const u2 = await getProfileOfUser(doc.userId2)
		if (!u1 || !u2) {
			// invalid data, can't trust it
			return
		}
		const request: Contacts = {
			...doc,
			profile1: u1.profile,
			profile2: u2.profile,
			user1: u1.user,
			user2: u2.user
		}
		requests.push(request)
	}
	contacts.set(requests)
})

export default contacts
