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
						:rules="[
              val => val.length > 0 || 'Person ID is required',
              val => val.trim() !== user!.$id || 'You can\'t add yourself'
            ]"
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
					<div class="flex justify-end">
						<q-btn color="primary" :loading="loading" type="submit">Add person</q-btn>
					</div>
				</q-form>
				<br />
				<h3 class="text-h6">Your ID</h3>
				<q-field filled>
					<template v-slot:control>
						<div class="self-center full-width no-outline" tabindex="0">
							{{ user!.$id }}
						</div>
					</template>
					<template v-slot:after>
						<q-btn
							color="primary"
							title="Copy"
							aria-label="Copy ID"
							round
							@click="copyID"
						>
							<q-icon name="content_copy" />
						</q-btn>
					</template>
				</q-field>
				<div class="qr-img">
					<q-img
						:src="userIdQrImage"
						alt="QR Code"
						style="width: 165px; height: 165px; border: 1px black solid"
					/>
				</div>
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
	overflow: auto;
	scrollbar-color: $primary white;
	scrollbar-width: thin;

	&::-webkit-scrollbar-thumb {
		background-color: $primary;
	}

	&::-webkit-scrollbar {
		width: 5px;
		background-color: inherit;
	}
}

.qr-img {
	display: flex;
	align-items: center;
	justify-content: center;
	margin-top: 1rem;
}
</style>

<script lang="ts" setup>
import { Dialog, useQuasar } from 'quasar'
import { computed, onMounted, ref } from 'vue'
import { Clipboard } from 'app/src-capacitor/node_modules/@capacitor/clipboard'
import ScanQRCode from 'components/ScanQRCode.vue'
import toolbarTitle from 'src/stores/toolbarTitle'
import userStore from 'src/stores/user'
import { useStore } from '@nanostores/vue'
import appwrite from 'src/lib/appwrite'
import axios from 'src/lib/axios'
import { getJWT } from 'src/lib/jwt'
import { getProfileOfUser, parseFastApiError } from 'src/lib/util'

toolbarTitle.set('Add a person')
const personId = ref('')
const loading = ref(false)
const showClipboardButton = ref(true)
const showQRButton = ref(true)
const isScanningQR = ref(false)
const q = useQuasar()
const user = useStore(userStore)
const userIdQrImage = computed(() => {
	return appwrite.avatars.getQR(user.value?.$id || 'loading', 256, 2).toString()
})

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

async function addPerson() {
	if (!personId.value.trim()) return
	if (loading.value) return
	loading.value = true
	const res = await axios.post(
		'/api/chat_requests/' + personId.value.trim(),
		undefined,
		{
			headers: {
				Authorization: 'Bearer ' + (await getJWT())
			}
		}
	)
	if (res.status === 200) {
		const profile = await getProfileOfUser(personId.value.trim())
		Dialog.create({
			title: 'Success',
			message: `Sent a chat request to ${profile?.user?.name || personId}!`
		})
	} else {
		Dialog.create({
			title: 'Error',
			message: parseFastApiError(res.data)
		})
	}
	personId.value = ''
	loading.value = false
}

function pasteFromClipboard() {
	if (q.platform.is.capacitor) {
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

function copyID() {
	function d() {
		Dialog.create({
			title: 'Copied to clipboard',
			message: 'Copied your ID to your clipboard'
		})
	}
	if (q.platform.is.capacitor) {
		Clipboard.write({
			string: user.value!.$id,
			label: q.platform.is.android ? 'Your Klay ID' : undefined
		}).then(d)
	} else {
		if (
			'clipboard' in navigator &&
			typeof navigator.clipboard.writeText === 'function'
		) {
			navigator.clipboard.writeText(user.value!.$id)
		} else {
			// use old method
			const textarea = document.createElement('textarea')
			textarea.value = user.value!.$id
			document.body.appendChild(textarea)
			textarea.select()
			document.execCommand('copy')
			document.body.removeChild(textarea)
		}
		d()
	}
}
</script>
