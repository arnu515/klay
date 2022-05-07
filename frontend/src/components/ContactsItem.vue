<template>
	<q-item clickable @click="onClick()" tag="a">
		<q-item-section avatar>
			<q-avatar size="32px">
				<img :src="avatar" alt="Avatar" />
			</q-avatar>
		</q-item-section>

		<q-item-section>
			<q-item-label>{{ name }}</q-item-label>
			<q-item-label caption>{{ lastMessage }}</q-item-label>
		</q-item-section>
	</q-item>
</template>

<script lang="ts">
import { defineComponent } from 'vue'

export default defineComponent({
	name: 'ContactsList',
	emits: ['click'],
	props: {
		id: String,
		name: String,
		lastMessage: String,
		avatar: String
	},
	methods: {
		onClick() {
			this.$emit('click', this.id)
		}
	}
})
</script>
