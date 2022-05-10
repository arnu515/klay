import { Models, Query } from 'appwrite'
import { action, atom, onMount } from 'nanostores'
import { Notify } from 'quasar'
import appwrite from 'src/lib/appwrite'
import type { Contacts as C, Profile, SafeUser } from 'src/lib/types'
import user from './user'
import { getMessages } from 'src/stores/messages'
import type { MessageItem } from 'src/stores/messages'
import { getProfile } from 'src/lib/cache/profile'

interface Contacts extends C {
	profile1: Profile
	profile2: Profile
	user1: SafeUser
	user2: SafeUser
}

type ContactsItem = Contacts & { messages: MessageItem[] }

export const contacts = atom<ContactsItem[]>([])

onMount(contacts, () => {
	console.log('[c] Subscibed to store')
	let unsubscribeAw: (() => void) | undefined
	const unsubscribeUser = user.subscribe(i => {
		if (unsubscribeAw) return
		if (!i) {
			contacts.set([])
			currentContact.set(null)
			return
		}
		console.log('[c] Subscribed to appwrite')
		unsubscribeAw = appwrite.subscribe<C>(
			'collections.contacts.documents',
			async doc => {
				if (doc.event.includes('create')) {
					const u1 = await getProfile(doc.payload.userId1)
					const u2 = await getProfile(doc.payload.userId2)
					if (!u1 || !u2) {
						// invalid data, can't trust it
						return
					}
					const otherUserId =
						u1.user.$id !== user.get()!.$id ? u1.user.$id : u2.user.$id
					const request: ContactsItem = {
						...doc.payload,
						profile1: u1.profile,
						profile2: u2.profile,
						user1: u1.user,
						user2: u2.user,
						messages: await getMessages(otherUserId)
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
	if (!u) {
		contacts.set([])
		currentContact.set(null)
		return
	}
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
	const requests = [] as ContactsItem[]
	for await (const doc of res.documents) {
		const u1 = await getProfile(doc.userId1)
		const u2 = await getProfile(doc.userId2)
		if (!u1 || !u2) {
			// invalid data, can't trust it
			return
		}
		const otherUserId = u1.user.$id !== user.get()!.$id ? u1.user.$id : u2.user.$id
		const request: ContactsItem = {
			...doc,
			profile1: u1.profile,
			profile2: u2.profile,
			user1: u1.user,
			user2: u2.user,
			messages: await getMessages(otherUserId)
		}
		console.log('req.messages', request.messages)
		requests.push(request)
	}
	contacts.set(requests)
	currentContact.set({ ...requests[0] })
})

export const currentContact = atom<ContactsItem | null>(null)

export default contacts
