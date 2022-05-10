import { Dialog } from 'quasar'
import { InMemoryCache } from '.'
import axios from '../axios'
import { getJWT } from '../jwt'
import { Message } from '../types'
import { parseFastApiError } from '../util'

export const messagesCache = new InMemoryCache('messages', '1 minute')

export async function loadMessages(userId: string): Promise<Message[]> {
	let messages = messagesCache.get(userId)

	if (messages) return messages

	const res = await axios.get('/api/chat_messages/' + userId, {
		headers: {
			Authorization: 'Bearer ' + (await getJWT())
		}
	})

	if (res.status !== 200) {
		console.error(res.data)
		Dialog.create({
			title: 'Error',
			message: 'Could not load messages\n' + parseFastApiError(res.data)
		})
		return []
	} else {
		messages = res.data.messages
		messagesCache.set(userId, messages)
		return messages
	}
}

export default messagesCache
