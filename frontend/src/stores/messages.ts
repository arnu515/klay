import { map, onMount } from 'nanostores'
import { Dialog, Notify } from 'quasar'
import appwrite from 'src/lib/appwrite'
import axios from 'src/lib/axios'
import { loadMessages } from 'src/lib/cache/messages'
import { getProfile } from 'src/lib/cache/profile'
import type { ChatEvent, Message as Msg } from 'src/lib/types'
import { parseFastApiError } from 'src/lib/util'
import user from './user'

export interface MessageItem {
	id: string
	sent: boolean
	name: string
	hint: string
	avatar: string
	text: string[]
	raw: Msg
}

export const messages = map<Record<string, MessageItem[]>>({})

onMount(messages, () => {
	console.log('[s] subscribed to store')
	const unsub = appwrite.subscribe<ChatEvent>(
		'collections.chat_events.documents',
		async doc => {
			console.log(doc)
			const u = user.get()
			if (!u) return
			if (doc.payload.userId2 !== u.$id) return
			const data = doc.payload
			if (!doc.event.includes('create')) return

			switch (data.type) {
				case 'create': {
					const res = await axios.get<{ message: Msg }>(
						'/api/chat_messages/message-' + data.messageId
					)
					if (res.status !== 200) {
						Dialog.create({
							title: 'An error occured',
							message: parseFastApiError(res.data)
						})
						return
					}
					await MessageMethods.create(doc.payload.userId1, res.data.message)
				}
				case 'update': {
					const res = await axios.get<{ message: Msg }>(
						'/api/chat_messages/message-' + data.messageId
					)
					if (res.status !== 200) {
						Dialog.create({
							title: 'An error occured',
							message: parseFastApiError(res.data)
						})
						return
					}
					await MessageMethods.update(doc.payload.userId1, res.data.message)
				}
				case 'delete': {
					await MessageMethods.delete(doc.payload.userId1, data.messageId)
				}
			}
		}
	)

	return () => {
		console.log('[s] unsubscribed from store')
		unsub()
	}
})

export async function getMessages(userId: string) {
	const msgs = await loadMessages(userId)
	if (!msgs.length) return []

	const items: MessageItem[] = []
	for await (const msg of msgs) {
		const m = await Message(msg)
		console.log({ m, msg })
		items.push(m)
	}

	messages.setKey(userId, items)
	return items
}

export class MessageMethods {
	static async create(userId: string, msg: Msg, showNotif = true) {
		const m = messages.get()[userId]
		console.log({ m })
		if (!m) return
		const message = await Message(msg)
		messages.setKey(userId, [...m, message])

		if (showNotif) {
			Notify.create({
				message: 'New message from ' + message.name
			})
		}
	}

	static async update(userId: string, msg: Msg) {
		const m = messages.get()[userId]
		console.log({ m })
		if (!m) return
		messages.setKey(
			userId,
			await Promise.all(m.map(async m => (m.id === msg._id ? await Message(msg) : m)))
		)
	}

	static async delete(userId: string, msgId: string) {
		const m = messages.get()[userId]
		console.log({ m })
		if (!m) return
		messages.setKey(
			userId,
			m.filter(m => m.id !== msgId)
		)
	}
}

export async function Message(message: Msg) {
	const msgDate = new Date(parseInt(message.created_at + '000'))
	function dd(num: number) {
		return num < 10 ? `0${num}` : num
	}
	const today = new Date()
	let dateString = ''
	// check if the date of msg and today are same
	if (
		msgDate.getDate() === today.getDate() &&
		msgDate.getMonth() === today.getMonth() &&
		msgDate.getFullYear() === today.getFullYear()
	) {
		dateString = `${dd(msgDate.getHours())}:${dd(msgDate.getMinutes())}`
	} else {
		dateString = `${dd(msgDate.getFullYear())}-${dd(msgDate.getMonth())}-${dd(
			msgDate.getDate()
		)} ${msgDate.getHours()}:${msgDate.getMinutes()}`
	}
	if (message.to === user.get()!.$id) {
		const profile = await getProfile(message.to)
		return {
			id: message._id,
			avatar: profile.profile.avatar_url,
			hint: dateString,
			name: profile.user.name,
			raw: { ...message },
			sent: false,
			text: [message.content]
		}
	} else {
		const profile = await getProfile(user.get()!.$id)
		return {
			id: message._id,
			avatar: profile.profile.avatar_url,
			hint: dateString,
			name: profile.user.name,
			raw: { ...message },
			sent: true,
			text: [message.content]
		}
	}
}

export default messages
