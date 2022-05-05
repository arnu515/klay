<template>
	<div style="padding: 1rem">
		<q-form @reset="status = profile.status" @submit.prevent="changeStatus">
			<h3 class="text-h6" id="status-heading">Currently set to:</h3>
			<q-input
				outlined
				label="Status"
				type="text"
				v-model="status"
				bottom-slots
				hint="Leave blank to clear the status"
				clearable
				:rules="[
					val => (val || '').length <= 500 || 'Status must be less than 500 characters'
				]"
			>
				<template v-slot:prepend>
					<q-icon name="badge" />
				</template>
			</q-input>
			<div class="submit">
				<q-btn type="reset" flat dense icon="replay" />
				<q-btn
					type="submit"
					:disable="status === profile.status"
					color="primary"
					:loading="loading"
					>Save</q-btn
				>
			</div>
		</q-form>
		<h5 class="text-h6" style="margin: 0; margin-bottom: 0.5rem">Select status:</h5>
		<q-list>
			<q-item
				clickable
				v-for="(item, index) in statuses"
				v-bind:key="index"
				@click="setStatus(item)"
			>
				<q-item-section>{{ item }}</q-item-section>
			</q-item>
		</q-list>
		<p class="text-callout" style="margin-top: 2.5rem; color: gray">
			Want to add a suggestion? You can
			<a
				style="color: gray"
				href="https://github.com/arnu515/klay/blob/master/src/pages/settings/StatusPage.vue#L70"
				>edit this file on GitHub</a
			>
		</p>
	</div>
</template>

<style lang="scss" scoped>
.submit {
	display: flex;
	align-items: center;
	justify-content: flex-end;
	gap: 0.5rem;
}
</style>

<script lang="ts" setup>
import toolbarTitle from 'src/stores/toolbarTitle'
import { ref } from 'vue'
import { profile as profileStore, loadUser } from 'src/stores/user'
import { useStore } from '@nanostores/vue'
import axios from 'src/lib/axios'
import { getJWT } from 'src/lib/jwt'
import { Dialog } from 'quasar'
import { parseFastApiError } from 'src/lib/util'

toolbarTitle.set('Status')

const profile = useStore(profileStore)
const status = ref(profile.value!.status || '')
const loading = ref(false)

const statuses = [
	'Available',
	'At School',
	'At work',
	'At the gym',
	'At the library',
	'Away',
	'Busy',
	"Can't answer you immediately",
	'Do not disturb',
	'In a meeting',
	'Low battery!',
	'My notifications are off',
	'No calls please!',
	'Urgent calls only!'
]

async function changeStatus() {
	loading.value = true

	const res = await axios.put(
		'/api/profile/me',
		{
			...profile.value,
			status: (status.value || '').trim()
		},
		{
			headers: {
				Authorization: 'Bearer ' + (await getJWT())
			}
		}
	)
	if (res.status === 200) {
		await loadUser()
		Dialog.create({
			title: 'Success',
			message: 'Your status has been changed'
		})
	} else {
		Dialog.create({
			title: 'Error',
			message: parseFastApiError(res.data),
			html: true
		})
	}

	loading.value = false
}

function setStatus(s: string) {
	status.value = s
	document.getElementById('status-heading')?.scrollIntoView({ behavior: 'smooth' })
}
</script>
