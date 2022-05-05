<template>
	<q-list>
		<q-item
			clickable
			v-for="(item, index) in settings"
			v-bind:key="index"
			@click="$router.push('/settings/' + item.path)"
		>
			<q-item-section avatar>
				<q-icon :name="item.icon" />
			</q-item-section>
			<q-item-section>{{ item.name }}</q-item-section>
		</q-item>
		<q-item clickable @click="logout" style="color: red">
			<q-item-section avatar>
				<q-icon name="logout" />
			</q-item-section>
			<q-item-section>Logout</q-item-section>
		</q-item>
	</q-list>
</template>

<script lang="ts" setup>
import { Dialog } from 'quasar'
import toolbarTitle from 'src/stores/toolbarTitle'
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

toolbarTitle.set('Settings')

const settings = ref([
	{
		name: 'Status',
		icon: 'emoji_emotions',
		path: 'status'
	},
	{
		name: 'Profile',
		icon: 'person',
		path: 'profile'
	},
	{
		name: 'Account',
		icon: 'badge',
		path: 'account'
	},
	{
		name: 'Privacy and Safety',
		icon: 'shield',
		path: 'privacy'
	}
])

function logout() {
	const d = Dialog.create({
		title: 'Are you sure?',
		message: 'Are you sure you want to logout?',
		focus: 'cancel',
		ok: {
			label: 'Ok',
			textColor: 'negative',
			flat: true
		},
		cancel: {
			label: 'Cancel',
			flat: true
		}
	})
	d.onOk(() => router.push('/settings/logout'))
}
</script>
