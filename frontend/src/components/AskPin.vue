<template>
	<div class="wrapper">
		<q-card
			style="
				max-width: 600px;
				margin: 1rem auto;
				width: 50%;
				min-width: 200px;
				padding: 1rem 2rem;
			"
		>
			<h1 class="text-center text-h4" style="margin-top: 1rem">Enter your pin</h1>
			<q-form @submit.prevent="submit">
				<div style="display: flex; justify-content: center">
					<q-input
						outlined
						placeholder="XXXX"
						aria-label="Pin"
						stack-label
						v-model="pin"
						mask="####"
						input-style="text-align: center; width: 100%"
						bottom-slots
						:rules="[
							val => val.length === 4 || 'Pin must be 4 characters long',
							val => /^\d+$/.test(val) || 'Pin must be a number'
						]"
					/>
				</div>
				<p class="text-callout text-center" style="margin-top: 1rem">
					Your pin is required to restore your messages
				</p>
				<div
					class="flex column items-center justify-center"
					style="gap: 1rem; padding-bottom: 1rem"
				>
					<q-btn
						type="submit"
						color="primary"
						label="Restore messages"
						size="lg"
						:loading="loading"
						:disable="loading || pin.length !== 4"
					/>
					<q-btn
						type="button"
						flat
						color="negative"
						label="Forgot PIN"
						:disable="loading"
					/>
				</div>
			</q-form>
		</q-card>
	</div>
</template>

<style lang="scss" scoped>
.wrapper {
	position: fixed;
	display: grid;
	place-items: center;
	top: 0;
	left: 0;
	width: 100%;
	height: 100%;
}
</style>

<script lang="ts" setup>
import { ref } from 'vue'
import privateKey, { getKey } from 'src/stores/privateKey'
import { Dialog } from 'quasar'

const pin = ref('')
const loading = ref(false)

async function submit() {
	if (!pin.value) return
	if (pin.value.length !== 4) return

	const key = await getKey(pin.value)
	if (key === null) {
		Dialog.create({
			title: 'Invalid PIN',
			message: 'Your PIN is invalid. Please check it and try again.'
		})
		return
	}

	privateKey.set(key.key)
}
</script>
