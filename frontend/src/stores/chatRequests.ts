import { Models, Query } from 'appwrite'
import { action, atom, onMount } from 'nanostores'
import { Notify } from 'quasar'
import appwrite from 'src/lib/appwrite'
import type { ChatRequests as CR, Profile, SafeUser } from 'src/lib/types'
import { getProfileOfUser } from 'src/lib/util'
import user from './user'

interface ChatRequests extends CR {
	profile1: Profile
	profile2: Profile
	user1: SafeUser
	user2: SafeUser
}

export const chatRequests = atom<ChatRequests[]>([])

onMount(chatRequests, () => {
	console.log('Subscibed to store')
	let unsubscribeAw: (() => void) | undefined
	const unsubscribeUser = user.subscribe(i => {
		if (unsubscribeAw) return
		if (!i) {
			chatRequests.set([])
			return
		}
		console.log('Subscribed to appwrite')
		unsubscribeAw = appwrite.subscribe<CR>(
			'collections.chat_requests.documents',
			async doc => {
				console.log(doc)
				if (doc.payload.userId2 !== i.$id) return
				if (doc.event.includes('create')) {
					const u1 = await getProfileOfUser(doc.payload.userId1)
					const u2 = await getProfileOfUser(doc.payload.userId2)
					if (!u1 || !u2) {
						// invalid data, can't trust it
						return
					}
					const request: ChatRequests = {
						...doc.payload,
						profile1: u1.profile,
						profile2: u2.profile,
						user1: u1.user,
						user2: u2.user
					}
					chatRequests.set([...chatRequests.get(), request])
					Notify.create({
						message: `${request.user1.name} wants to chat with you`,
						color: 'white',
						textColor: 'black'
					})
				} else if (doc.event.includes('delete')) {
					// silently delete
					chatRequests.set(chatRequests.get().filter(i => i.$id !== doc.payload.$id))
				}
			}
		)
	})
	return () => {
		unsubscribeUser()
		console.log('Unsubscribed from store')

		if (unsubscribeAw) {
			unsubscribeAw()
			console.log('Unsubscribed from appwrite')
		}
	}
})

export const loadChatRequests = action(chatRequests, 'loadChatRequests', async () => {
	const u = user.get()
	if (!u) {
		chatRequests.set([])
		return
	}
	const res = await appwrite.database.listDocuments<Models.Document & CR>(
		'chat_requests',
		[Query.equal('userId2', u.$id)]
	)
	const requests = [] as ChatRequests[]
	for await (const doc of res.documents) {
		const u1 = await getProfileOfUser(doc.userId1)
		const u2 = await getProfileOfUser(doc.userId2)
		if (!u1 || !u2) {
			// invalid data, can't trust it
			return
		}
		const request: ChatRequests = {
			...doc,
			profile1: u1.profile,
			profile2: u2.profile,
			user1: u1.user,
			user2: u2.user
		}
		requests.push(request)
	}
	chatRequests.set(requests)
	if (res.total > 0) {
		Notify.create({
			message: 'You have new chat requests',
			color: 'white',
			textColor: 'black'
		})
	}
})

export default chatRequests
