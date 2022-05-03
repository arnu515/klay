<template>
	<q-layout view="lHh Lpr lFf">
		<q-header elevated>
			<q-toolbar>
				<q-btn
					flat
					dense
					round
					icon="menu"
					aria-label="Menu"
					@click="toggleLeftDrawer"
				/>

				<q-toolbar-title>Klay</q-toolbar-title>
			</q-toolbar>
		</q-header>

		<q-drawer v-model="leftDrawerOpen" show-if-above bordered>
			<q-list>
				<q-item-label header> Contacts </q-item-label>

				<ContactsItem
					v-for="contact in contacts"
					v-bind:key="contact.id"
					:name="contact.name"
					:avatar="contact.avatar"
					:lastMessage="contact.lastMessage"
				/>
			</q-list>
		</q-drawer>

		<q-page-container>
			<q-inner-loading v-if="loading" :showing="loading" color="primary" />
			<template v-else>
				<router-view v-if="u" />
				<AuthPage v-else />
			</template>
		</q-page-container>
	</q-layout>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue'
import ContactsItem from 'src/components/ContactsItem.vue'
// this is a vetur problem
import AuthPage from 'pages/AuthPage.vue'
import user, { loadUser } from '../stores/user'
import { useStore } from '@nanostores/vue'

const contacts = [
	{
		id: 1,
		name: 'A contact',
		lastMessage: 'You: Test',
		avatar: 'https://picsum.photos/64'
	},
	{
		id: 2,
		name: 'Another contact',
		lastMessage: 'Another contact: Hi',
		avatar: 'https://picsum.photos/64'
	},
	{
		id: 3,
		name: 'One more contact',
		lastMessage: 'You: Ok',
		avatar: 'https://picsum.photos/64'
	},
	{
		id: 4,
		name: 'Last contact',
		lastMessage: 'You: Hello',
		avatar: 'https://picsum.photos/64'
	}
]

export default defineComponent({
	name: 'MainLayout',

	components: {
		ContactsItem,
		AuthPage
	},

	setup() {
		const leftDrawerOpen = ref(false)
		const u = useStore(user)
		const loading = ref(true)

		return {
			contacts,
			leftDrawerOpen,
			u,
			toggleLeftDrawer() {
				leftDrawerOpen.value = !leftDrawerOpen.value
			},
			loading
		}
	},
	mounted() {
		loadUser().then(() => {
			this.loading = false
		})
	}
})
</script>
