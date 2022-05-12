<template>
	<q-chat-message
		:name="props.name"
		:text="props.text"
		title="Right click to edit"
		:sent="props.sent"
		:bg-color="!props.sent ? 'grey-4' : 'primary'"
		:text-color="!props.sent ? 'black' : 'white'"
		:stamp="props.hint"
		@contextmenu.prevent="$emit('rightclick', $event)"
	>
		<template v-slot:avatar>
			<q-avatar size="32px" style="margin: 0rem 0.5rem">
				<img :src="props.avatar" alt="Avatar" />
			</q-avatar>
		</template>
	</q-chat-message>
</template>

<script lang="ts" setup>
import { defineProps } from 'vue'

const props = defineProps({
	sent: Boolean,
	text: Array,
	name: String,
	hint: String,
	avatar: String
})
</script>
