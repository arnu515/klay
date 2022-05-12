<template>
	<q-chat-message
		:name="props.name"
		:text="props.text"
		:title="$q.platform.is.mobile ? 'Long-press to edit' : 'Right click to edit'"
		:sent="props.sent"
		:bg-color="!props.sent ? 'grey-4' : 'primary'"
		:text-color="!props.sent ? 'black' : 'white'"
		:stamp="props.hint"
		@contextmenu.prevent="$emit('rightclick', $event)"
		@mousedown="handleDown"
		@mouseup="handleUp"
		@touchstart="handleTouchDown"
		@touchend="handleUp"
	>
		<template v-slot:avatar>
			<q-avatar size="32px" style="margin: 0rem 0.5rem">
				<img :src="props.avatar" alt="Avatar" />
			</q-avatar>
		</template>
	</q-chat-message>
</template>

<script lang="ts" setup>
import { defineProps, ref, defineEmits } from 'vue'

const pressDownTimeout = ref<NodeJS.Timeout | null>(null)

function handleDown(e: MouseEvent) {
	if (e.button !== 0) return
	handleTouchDown()
}

function handleTouchDown() {
	pressDownTimeout.value = setTimeout(() => {
		emit('rightclick')
		pressDownTimeout.value && clearTimeout(pressDownTimeout.value)
		pressDownTimeout.value = null
	}, 300)
}

function handleUp() {
	pressDownTimeout.value && clearTimeout(pressDownTimeout.value)
	pressDownTimeout.value = null
}

const props = defineProps({
	sent: Boolean,
	text: Array,
	name: String,
	hint: String,
	avatar: String
})

const emit = defineEmits(['rightclick'])
</script>
