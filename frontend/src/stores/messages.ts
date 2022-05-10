import { loadMessages } from 'src/lib/cache/messages'
import { getProfile } from 'src/lib/cache/profile'
import type { Message as Msg } from 'src/lib/types'
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

export async function getMessages(userId: string) {
	const messages = await loadMessages(userId)
	if (!messages.length) return []

	const items: MessageItem[] = []
	for await (const msg of messages) {
		const m = await Message(msg)
		console.log({ m, msg })
		items.push(m)
	}

	return items
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
