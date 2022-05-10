<template>
	<main>
		<div class="wrapper">
			<q-card flat bordered style="height: 100%" class="message-box">
				<q-card-section class="header">
					<q-avatar v-if="ready" size="40px">
						<img
							:src="otherUser.profile.avatar_url"
							alt="Avatar"
							style="border: 1px black solid"
						/>
					</q-avatar>
					<q-skeleton v-else type="QAvatar" size="40px" />

					<div class="name-wrapper">
						<span v-if="ready" class="name">{{ otherUser.user.name }}</span>
						<q-skeleton type="text" v-else width="200px" />
						<span v-if="ready" class="status">{{ otherUser.profile.status }}</span>
						<q-skeleton type="text" v-else width="200px" />
					</div>
				</q-card-section>
				<q-separator />
				<q-card-section v-if="ready" id="messages" class="messages">
					<div v-for="message of messages" v-bind:key="message.id">
						<chat-message
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
				<div v-if="ready" class="message-input-wrapper">
					<q-input
						outlined
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
								flat
								icon="send"
								title="Send message"
								aria-label="Send message"
							/>
						</template>
					</q-input>
				</div>
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
import messagesStore, { MessageItem } from 'src/stores/messages'
import { getMessages } from 'src/stores/messages'

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
		const messages = ref<MessageItem[] | null>(
			otherUser.value.user ? messagesStore.get()[otherUser.value.user.$id] : null
		)
		console.log({ messages: messagesStore.get() })
		const ready = computed(
			() =>
				contact &&
				otherUser &&
				otherUser.value.user &&
				otherUser.value.profile &&
				messages.value
		)

		async function updateUser(u: any) {
			console.log({ u })
			if (!u.user) return
			messages.value = []
			await getMessages(u.user.$id)
			int && clearInterval(int)
			int = null
			console.log(messagesStore.get())
			messages.value = messagesStore.get()[u.user.$id] || []
			const mel = document.getElementById('messages') as HTMLDivElement
			console.log({ mel })
			if (mel) {
				// scroll to bottom
				mel.scrollTop = mel.scrollHeight
			}
		}

		watch(otherUser, updateUser)

		let timesTried = 0
		let int: NodeJS.Timeout | null = setInterval(() => {
			updateUser(otherUser.value)
			timesTried += 1
			if (timesTried > 10) {
				int && clearInterval(int)
				int = null
			}
		}, 2000)

		return { text, messages, contact, otherUser, ready }
	},
	mounted() {
		toolbarTitle.set('Chat')
	}
})
</script>
