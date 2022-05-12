<template>
	<q-dialog ref="dialogRef" @hide="onDialogHide">
		<q-card class="q-dialog-plugin">
			<q-form @submit.prevent="submit" @reset="reset">
				<q-card-section>
					<h3 class="text-h6" style="margin: 0">Edit message</h3>
					<br />
					<q-input
						ref="input"
						v-model="text"
						label="Message"
						type="text"
						lazy-rules="ondemand"
						outlined
						:rules="[
							v => v.trim().length > 0 || 'Message is required',
							v => v.trim() !== props.text || 'Message should be different'
						]"
						bottom-slots
					/>
				</q-card-section>
				<q-card-actions class="flex justify-between">
					<q-btn flat label="Cancel" @click="onDialogCancel" />
					<div class="flex" style="gap: 0.5rem; align-items: center">
						<q-btn icon="replay" flat dense type="reset"></q-btn>
						<q-btn color="primary" label="Edit" type="submit" />
					</div>
				</q-card-actions>
			</q-form>
		</q-card>
	</q-dialog>
</template>

<script lang="ts" setup>
import { useDialogPluginComponent } from 'quasar'
import { ref, defineEmits, defineProps } from 'vue'

const props = defineProps({
	id: {
		type: String,
		required: true
	},
	text: {
		type: String,
		required: true
	}
})

defineEmits(useDialogPluginComponent.emits)

const { dialogRef, onDialogHide, onDialogOK, onDialogCancel } =
	useDialogPluginComponent()

const text = ref(props.text)
const input = ref<any>()

function submit() {
	input.value.validate()
	if (input.value.hasError) return

	if (!text.value.trim()) return
	if (text.value.trim() === props.text) return

	onDialogOK(text.value.trim())
}

function reset() {
	text.value = props.text
}
</script>
