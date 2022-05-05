<template>
	<main>
		<div class="wrapper">
			<q-card flat bordered style="height: 100%" class="message-box">
				<q-card-section class="header">
					<q-avatar size="40px">
						<img
							src="https://picsum.photos/64"
							alt="Avatar"
							style="border: 1px black solid"
						/>
					</q-avatar>

					<div class="name-wrapper">
						<span class="name">Name of user</span>
						<span class="status">Status of user</span>
					</div>
				</q-card-section>
				<q-separator />
				<q-card-section id="messages" class="messages">
					<div v-for="message of messages" v-bind:key="message.id">
						<chat-message
							:avatar="message.avatar"
							:name="message.name"
							:text="message.text"
							:sent="message.sent"
							:hint="message.hint"
						/>
					</div>
				</q-card-section>
				<div class="message-input-wrapper">
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
import { defineComponent, ref } from 'vue'
import ChatMessage from 'components/ChatMessage.vue'
import toolbarTitle from 'src/stores/toolbarTitle'

export default defineComponent({
	name: 'IndexPage',
	components: { ChatMessage },
	setup() {
		const text = ref('')
		const messages = ref([
			{
				id: 1,
				sent: true,
				text: ['Message text with <strong>HTML Parsing</strong>'],
				name: 'You',
				hint: '',
				avatar: 'https://picsum.photos/64'
			},
			{
				id: 2,
				sent: false,
				text: [
					'More text with <strong>more</strong> <em>HTML</em> <u>parsing</u>',
					'Some more text!',
					'Even more!',
					'But only upto',
					'A limit of',
					'Six'
				],
				name: 'Other user',
				hint: '',
				avatar: 'https://picsum.photos/64'
			},
			{
				id: 3,
				sent: false,
				text: ['Separate message'],
				name: 'Other user',
				hint: '3 seconds ago',
				avatar: 'https://picsum.photos/64'
			},
			{
				id: 4,
				sent: true,
				text: ['Keep adding text', 'For scroll'],
				name: 'Other user',
				hint: '3 seconds ago',
				avatar: 'https://picsum.photos/64'
			},
			{
				id: 5,
				sent: false,
				text: ['Keep adding text', 'For scroll'],
				name: 'Other user',
				hint: '3 seconds ago',
				avatar: 'https://picsum.photos/64'
			},
			{
				id: 6,
				sent: true,
				text: ['Keep adding text', 'For scroll'],
				name: 'Other user',
				hint: '3 seconds ago',
				avatar: 'https://picsum.photos/64'
			},
			{
				id: 7,
				sent: false,
				text: ['Keep adding text', 'For scroll'],
				name: 'Other user',
				hint: '3 seconds ago',
				avatar: 'https://picsum.photos/64'
			}
		])
		return { text, messages }
	},
	mounted() {
		const messages = document.getElementById('messages') as HTMLDivElement
		if (messages) {
			// scroll to bottom
			messages.scrollTop = messages.scrollHeight
		}
		toolbarTitle.set('Chat')
	}
})
</script>
