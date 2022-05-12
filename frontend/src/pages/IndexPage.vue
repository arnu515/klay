<template>
	<main>
		<div class="wrapper">
			<q-card flat bordered style="height: 100%" class="message-box">
				<q-card-section class="header">
					<q-avatar v-if="ready" size="40px">
						<img
							:src="otherUser.profile!.avatar_url"
							alt="Avatar"
							style="border: 1px black solid"
						/>
					</q-avatar>
					<q-skeleton v-else type="QAvatar" size="40px" />

					<div class="name-wrapper">
						<span v-if="ready" class="name">{{ otherUser.user!.name }}</span>
						<q-skeleton type="text" v-else width="200px" />
						<span v-if="ready" class="status">{{ otherUser.profile!.status }}</span>
						<q-skeleton type="text" v-else width="200px" />
					</div>
				</q-card-section>
				<q-separator />
				<q-card-section v-if="ready" id="messages" class="messages">
					<div
						v-for="message of allMessages[otherUser.user!.$id]"
						v-bind:key="message.id"
					>
						<chat-message
							@rightclick="() => onRightClickMessage(message.id)"
							:avatar="message.avatar"
							:name="message.name"
							:text="[...message.text]"
							:sent="message.sent"
							:hint="message.hint"
						/>
					</div>
				</q-card-section>
				<q-card-section v-else id="messages" class="messages">
					<div style="display: flex; margin-top: 2rem; justify-content: center">
						<q-spinner size="32px" color="primary" />
					</div>
				</q-card-section>
				<q-form
					@submit.prevent="sendMessage"
					v-if="ready"
					class="message-input-wrapper"
				>
					<q-input
						:outlined="!sendingMessage"
						:filled="sendingMessage"
						:readonly="sendingMessage"
						v-model="text"
						aria-label="Message"
						dense
						placeholder="Enter your message"
					>
						<template v-slot:before>
							<q-btn
								round
								color="primary"
								icon="add"
								dense
								title="Add attachment"
								aria-label="Attach file"
							/>
						</template>
						<template v-slot:append>
							<q-icon
								v-if="text"
								@click="text = ''"
								name="close"
								style="cursor: pointer"
								role="button"
								tabindex="0"
							/>
						</template>
						<template v-slot:after>
							<q-btn
								round
								:color="text ? 'primary' : 'gray-5'"
								:disable="!text"
								type="submit"
								flat
								icon="send"
								title="Send message"
								aria-label="Send message"
							/>
						</template>
					</q-input>
				</q-form>
			</q-card>
		</div>
	</main>
</template>

<style lang="scss" scoped>
main {
	position: fixed;
	top: 0;
	left: 0;
	width: 100%;
	height: 100%;
	padding: 1rem;
	padding-top: 3.5rem;
}
.wrapper {
	max-width: map-get($sizes, 'md');
	margin: 1rem auto;
	padding-bottom: 1rem;
	height: 100%;

	.message-box {
		display: flex;
		flex-direction: column;
	}

	.messages {
		overflow-y: scroll;
		scrollbar-color: $primary white;
		flex: 1;
		scrollbar-width: thin;
		&::-webkit-scrollbar-thumb {
			background-color: $primary;
		}
		&::-webkit-scrollbar {
			width: 5px;
			background-color: inherit;
		}
	}

	.message-input-wrapper {
		margin: 0.5rem;
	}

	.header {
		display: flex;
		align-items: center;
		gap: 1rem;
		.name-wrapper {
			display: flex;
			flex-direction: column;
			justify-content: center;
			span.name {
				font-weight: 500;
				font-size: 16px;
			}
			span.status {
				color: $grey-8;
				font-size: 12px;
			}
		}
	}
}
</style>

<script lang="ts">
import { computed, defineComponent, ref, watch } from 'vue'
import ChatMessage from 'components/ChatMessage.vue'
import toolbarTitle from 'src/stores/toolbarTitle'
import { currentContact } from 'src/stores/contacts'
import { useStore } from '@nanostores/vue'
import user from 'src/stores/user'
import messagesStore, { MessageMethods } from 'src/stores/messages'
import { getMessages } from 'src/stores/messages'
import axios from 'src/lib/axios'
import { BottomSheet, Dialog } from 'quasar'
import { parseFastApiError } from 'src/lib/util'
import { getJWT } from 'src/lib/jwt'
import appwrite from 'src/lib/appwrite'
import { ChatEvent } from 'src/lib/types'
import UpdateMessageDialog from 'src/components/UpdateMessageDialog.vue'

export default defineComponent({
	name: 'IndexPage',
	components: { ChatMessage },
	setup() {
		const text = ref('')
		const contact = useStore(currentContact)
		const otherUser = computed(() =>
			contact.value?.user1?.$id !== user.get()!.$id
				? {
						user: contact.value?.user1 || null,
						profile: contact.value?.profile1 || null
				  }
				: {
						user: contact.value?.user2 || null,
						profile: contact.value?.profile2 || null
				  }
		)
		const allMessages = useStore(messagesStore)
		// const messages = computed<MessageItem[]>(() =>
		// 	otherUser.value.user ? (allMessages.value[otherUser.value.user.$id] as any) : null
		// )
		const ready = computed(
			() => contact && otherUser && otherUser.value.user && otherUser.value.profile
		)
		const sendingMessage = ref(false)

		async function updateUser(u: any) {
			console.log({ u })
			if (!u.user) return
			// messages.value = []
			int && clearInterval(int)
			int = null
			// messages.value = (allMessages.value[u.user.$id] || []) as any
			const mel = document.getElementById('messages') as HTMLDivElement
			console.log({ mel })
			if (mel) {
				// scroll to bottom
				mel.scrollTop = mel.scrollHeight
			}
		}

		const unsub = ref<null | (() => void)>(null)

		watch(otherUser, updateUser)
		watch(allMessages, () => {
			console.log({ allMessages: allMessages.value, messages: messagesStore.get() })
			setTimeout(() => {
				const mel = document.getElementById('messages') as HTMLDivElement
				if (mel) {
					mel.scrollTop = mel.scrollHeight
				}
			}, 50)
		})

		let timesTried = 0
		let int: NodeJS.Timeout | null = setInterval(() => {
			updateUser(otherUser.value)
			timesTried += 1
			if (timesTried > 10) {
				int && clearInterval(int)
				int = null
			}
		}, 2000)

		return {
			text,
			allMessages,
			contact,
			otherUser,
			ready,
			sendingMessage,
			unsub
		}
	},
	async mounted() {
		toolbarTitle.set('Chat')
		await getMessages()
		if (!this.unsub) {
			this.unsub = appwrite.subscribe<ChatEvent>(
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
							const m = await MessageMethods.get(data.messageId)
							if (!m) return
							console.log('created', m)
							await MessageMethods.create(doc.payload.userId1, m)
							break
						}
						case 'update': {
							const m = await MessageMethods.get(data.messageId)
							if (!m) return
							await MessageMethods.update(doc.payload.userId1, m)
							break
						}
						case 'delete': {
							await MessageMethods.delete(doc.payload.userId1, data.messageId)
							break
						}
					}
				}
			)
		}
	},
	unmounted() {
		if (this.unsub) this.unsub()
	},
	methods: {
		async sendMessage() {
			if (!this.ready) return
			if (!this.text.trim()) return
			if (this.sendingMessage) return
			this.sendingMessage = true
			const res = await axios.post(
				'/api/chat_messages/' + this.otherUser.user!.$id,
				{
					content1: this.text.trim(),
					content2: this.text.trim()
				},
				{
					headers: {
						Authorization: 'Bearer ' + (await getJWT())
					}
				}
			)
			if (res.status !== 200) {
				Dialog.create({
					title: 'Error',
					message: parseFastApiError(res.data)
				})
				return
			}
			const msg = await MessageMethods.get(res.data.messageId)
			console.log({ msg })
			if (!msg) return
			await MessageMethods.create(this.otherUser.user!.$id, msg, false)
			this.sendingMessage = false
			this.text = ''
		},
		onRightClickMessage(msgId: string) {
			const messages = this.allMessages[this.otherUser.user!.$id]
			if (!messages) return
			const message = messages.find(m => m.id === msgId)
			if (!message) return
			if (!message.sent) return

			BottomSheet.create({
				title: 'Message Options',
				actions: [
					{
						id: 'update',
						icon: 'edit',
						label: 'Edit message'
					},
					{
						id: 'delete',
						icon: 'delete',
						classes: 'text-negative',
						label: 'Delete message'
					}
				]
			}).onOk(a => {
				switch (a.id) {
					case 'update':
						this.updateMessage(message.id)
						break
					case 'delete':
						this.deleteMessage(message.id)
						break
				}
			})
		},
		async updateMessage(msgId: string) {
			const messages = this.allMessages[this.otherUser.user!.$id]
			if (!messages) return
			const message = messages.find(m => m.id === msgId)
			if (!message) return

			Dialog.create({
				component: UpdateMessageDialog,
				componentProps: {
					id: message.id,
					text: message.text.join('\n')
				}
			}).onOk(async text => {
				const res = await axios.put(
					'/api/chat_messages/' + this.otherUser.user!.$id,
					{
						content1: text,
						content2: text,
						message_id: msgId
					},
					{
						headers: {
							Authorization: 'Bearer ' + (await getJWT())
						}
					}
				)

				if (res.status !== 200) {
					Dialog.create({
						title: 'Error',
						message: parseFastApiError(res.data)
					})
					return
				} else {
					const msg = await MessageMethods.get(message.id)
					if (!msg) return
					await MessageMethods.update(this.otherUser.user!.$id, msg)
				}
			})
		},
		async deleteMessage(msgId: string) {
			const messages = this.allMessages[this.otherUser.user!.$id]
			if (!messages) return
			const message = messages.find(m => m.id === msgId)
			if (!message) return

			const res = await axios.delete(
				'/api/chat_messages/' + this.otherUser.user!.$id + '/' + msgId,
				{
					headers: {
						Authorization: 'Bearer ' + (await getJWT())
					}
				}
			)

			if (res.status !== 200) {
				Dialog.create({
					title: 'Error',
					message: parseFastApiError(res.data)
				})
				return
			} else {
				await MessageMethods.delete(this.otherUser.user!.$id, message.id)
			}
		}
	}
})
</script>
