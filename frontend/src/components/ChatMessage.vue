<template>
	<q-chat-message
		:name="props.name"
		:text="props.text"
		text-html
		:sent="props.sent"
		:bg-color="!props.sent ? 'grey-4' : 'primary'"
		:text-color="!props.sent ? 'black' : 'white'"
		:stamp="props.hint"
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
	text: [String],
	name: String,
	hint: String,
	avatar: String
})
</script>
