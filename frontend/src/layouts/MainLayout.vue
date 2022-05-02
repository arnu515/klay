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
				<q-item-label header> Essential Links </q-item-label>

				<EssentialLink v-for="link in essentialLinks" :key="link.title" v-bind="link" />
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
import EssentialLink from 'components/EssentialLink.vue'
// this is a vetur problem
import AuthPage from 'pages/AuthPage.vue'
import user, { loadUser } from '../stores/user'
import { useStore } from '@nanostores/vue'

const linksList = [
	{
		title: 'Docs',
		caption: 'quasar.dev',
		icon: 'school',
		link: 'https://quasar.dev'
	}
]

export default defineComponent({
	name: 'MainLayout',

	components: {
		EssentialLink,
		AuthPage
	},

	setup() {
		const leftDrawerOpen = ref(false)
		const u = useStore(user)
		const loading = ref(true)

		return {
			essentialLinks: linksList,
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
