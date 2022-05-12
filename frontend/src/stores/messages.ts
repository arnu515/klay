import { map } from 'nanostores'
import { Dialog, Notify } from 'quasar'
import axios from 'src/lib/axios'
import { getProfile } from 'src/lib/cache/profile'
import { Asymmetric } from 'src/lib/encryption'
import { getJWT } from 'src/lib/jwt'
import type { Message as Msg } from 'src/lib/types'
import { parseFastApiError } from 'src/lib/util'
import keyPair from './keyPair'
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

async function decryptMessage(enc: string) {
	try {
		const data = JSON.parse(atob(enc))
		const dec = await Asymmetric.decrypt(
			data,
			await Asymmetric.getKey(
				'private',
				Asymmetric.cleanKey(keyPair.get()!.privateKey, 'privateKey')
			)
		)
		console.log({ dec })
		return dec
	} catch (e) {
		console.error(e)
		return ''
	}
}

export async function getMessages() {
	const u = user.get()
	console.log('hi')
	if (!u) return console.log('bye')
	const res = await axios.get<{ messages: Msg[] }>('/api/chat_messages', {
		headers: {
			Authorization: 'Bearer ' + (await getJWT())
		}
	})
	if (res.status !== 200) {
		Dialog.create({
			title: 'Error',
			message: parseFastApiError(res.data)
		})
		return
	}
	const msgs: Record<string, MessageItem[]> = {}
	for await (const msg of res.data.messages) {
		if (msg.to === u.$id)
			msgs[msg.from] = [...(msgs[msg.from] || []), await Message(msg)]
		else msgs[msg.to] = [...(msgs[msg.to] || []), await Message(msg)]
	}

	console.log({ msgs })
	messages.set(msgs)
}

export class MessageMethods {
	static async create(userId: string, msg: Msg, showNotif = true) {
		console.log(userId, messages.get())
		const m = messages.get()[userId] || []
		console.log({ m })
		if (!m) return
		const message = await Message(msg)
		messages.set({
			...messages.get(),
			[userId]: [...m, message]
		})
		// messages.set(messages.get())
		console.log(userId, messages.get())

		if (showNotif) {
			Notify.create({
				message: 'New message from ' + message.name
			})
		}
	}

	static async update(userId: string, msg: Msg) {
		const m = messages.get()[userId] || []
		messages.setKey(
			userId,
			await Promise.all(m.map(async m => (m.id === msg._id ? await Message(msg) : m)))
		)
	}

	static async delete(userId: string, msgId: string) {
		const m = messages.get()[userId] || []
		messages.setKey(
			userId,
			m.filter(m => m.id !== msgId)
		)
	}

	static async get(msgId: string) {
		const res = await axios.get<{ message: Msg }>(
			'/api/chat_messages/message-' + msgId,
			{
				headers: {
					Authorization: 'Bearer ' + (await getJWT())
				}
			}
		)
		if (res.status !== 200) {
			Dialog.create({
				title: 'An error occured',
				message: parseFastApiError(res.data)
			})
			return null
		}
		return res.data.message
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
	if (message.from !== user.get()!.$id) {
		const profile = await getProfile(message.from)
		return {
			id: message._id,
			avatar: profile.profile.avatar_url,
			hint: dateString,
			name: profile.user.name,
			raw: { ...message },
			sent: false,
			text: [await decryptMessage(message.content)]
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
			text: [await decryptMessage(message.content)]
		}
	}
}

export default messages
