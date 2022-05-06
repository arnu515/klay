<template>
	<main v-if="!isScanningQR">
		<div class="wrapper">
			<q-card flat bordered style="height: 100%" class="q-py-sm q-px-md">
				<h1 class="text-h4">Add a person</h1>
				<q-form @submit.prevent="addPerson">
					<h3 class="text-h6">Enter a person's ID to add them</h3>
					<q-input
						outlined
						bottom-slots
						v-model="personId"
						aria-label="Person ID"
						placeholder="Enter person's ID"
						clearable
					>
						<template v-slot:append v-if="showClipboardButton">
							<q-btn
								flat
								dense
								title="Paste from clipboard"
								aria-label="Paste from clipboard"
								@click="pasteFromClipboard"
							>
								<q-icon name="content_paste" />
							</q-btn>
						</template>
						<template v-slot:after v-if="showQRButton">
							<q-btn
								color="primary"
								title="Scan QR Code"
								aria-label="Scan QR Code"
								round
								@click="scanQRCode"
							>
								<q-icon name="qr_code_scanner" />
							</q-btn>
						</template>
					</q-input>
				</q-form>
			</q-card>
		</div>
	</main>
	<ScanQRCode
		v-else
		@close="
			() => {
				isScanningQR = false
				toolbarTitle.set('Add a person')
			}
		"
		@scan="res => (personId = res)"
	/>
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
}
</style>

<script lang="ts" setup>
import { Dialog, useQuasar } from 'quasar'
import { onMounted, ref } from 'vue'
import { Clipboard } from 'app/src-capacitor/node_modules/@capacitor/clipboard'
import ScanQRCode from 'components/ScanQRCode.vue'
import toolbarTitle from 'src/stores/toolbarTitle'

toolbarTitle.set('Add a person')
const personId = ref('')
const showClipboardButton = ref(true)
const showQRButton = ref(true)
const isScanningQR = ref(false)
const q = useQuasar()

onMounted(() => {
	if (
		!q.platform.is.capacitor &&
		(!('clipboard' in navigator) || typeof navigator.clipboard.readText !== 'function')
	) {
		showClipboardButton.value = false
	}
	if (!q.platform.is.capacitor) {
		if (!('mediaDevices' in navigator)) {
			showQRButton.value = false
			return
		}
		navigator.mediaDevices.enumerateDevices().then(d => {
			if (d.filter(d => d.kind === 'videoinput').length === 0) {
				showQRButton.value = false
			}
		})
	}
})

async function scanQRCode() {
	isScanningQR.value = true
}

function addPerson() {
	//
}

function pasteFromClipboard() {
	if (q.platform.is.capacitor) {
		console.log(Clipboard)
		Clipboard.read()
			.then(text => {
				console.log(text)
				personId.value = text.value
			})
			.catch(e => {
				Dialog.create({
					title: 'Error',
					message: "Couldn't paste text from your clipboard"
				})
				throw e
			})
	} else
		navigator.clipboard
			.readText()
			.then(text => {
				personId.value = text
			})
			.catch(() => {
				Dialog.create({
					title: 'Error',
					message: "Couldn't paste text from your clipboard"
				})
			})
}
</script>
