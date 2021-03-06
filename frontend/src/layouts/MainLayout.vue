<template>
	<AskPin v-if="u && !privateKey" />
	<q-layout view="lHh Lpr lFf" v-else>
		<q-header elevated>
			<q-toolbar>
				<q-btn
					v-if="path === '/'"
					flat
					dense
					round
					icon="menu"
					aria-label="Menu"
					@click="u && toggleLeftDrawer()"
				/>
				<q-btn
					v-else
					flat
					dense
					round
					icon="arrow_back"
					aria-label="Go back"
					@click="$router.back()"
				/>

				<q-toolbar-title> {{ title }} </q-toolbar-title>

				<q-btn-dropdown
					v-if="u"
					flat
					dense
					no-caps
					no-icon-animation
					dropdown-icon="more_vert"
					auto-close
				>
					<template v-slot:label v-if="!!dropdownBadges">
						<q-badge floating round color="red" />
					</template>
					<ul class="dropdown">
						<li v-for="(s, i) in moreItems" :key="i">
							<button v-ripple @click="$router.push(s.to)">
								<q-icon size="24px" :name="s.icon" />
								<span>{{ s.title }}</span>
								<div style="margin-left: auto">
									<q-badge v-if="!!s.badge" color="red">{{ s.badge }}</q-badge>
									<span v-else style="padding-left: 1rem">&nbsp;</span>
								</div>
							</button>
						</li>
					</ul>
				</q-btn-dropdown>
			</q-toolbar>
		</q-header>

		<q-drawer v-if="u" v-model="leftDrawerOpen" show-if-above bordered>
			<q-list>
				<q-item-label header> Contacts </q-item-label>

				<ContactsItem
					v-for="contact in contacts"
					v-bind:key="contact.$id"
					@click="setContact"
					:id="contact.$id"
					:name="
						contact.profile1.$id !== u.$id ? contact.user1.name : contact.user2.name
					"
					:avatar="
						contact.profile1.$id !== u.$id
							? contact.profile1.avatar_url
							: contact.profile2.avatar_url
					"
					:lastMessage="
						contact.profile1.$id === u.$id
							? contact.profile2.status
							: contact.profile1.status
					"
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

<style lang="scss" scoped>
.dropdown {
	list-style-type: none;
	margin: 0;
	padding: 0;
	box-sizing: border-box;
	background-color: white;
	min-width: 100px;
	li button {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		cursor: pointer;
		width: 100%;
		background-color: white;
		border: 1px solid transparent;
		outline: none;
		padding: 0.5rem 1rem;
		transition: all 500ms ease;
		&:focus {
			border-color: gray;
		}
		&:hover {
			filter: brightness(0.9);
		}
	}
}
</style>

<script lang="ts">
import { defineComponent, ref, computed } from 'vue'
import ContactsItem from 'src/components/ContactsItem.vue'
import AuthPage from 'pages/AuthPage.vue'
import user, { loadUser } from '../stores/user'
import toolbarTitle from '../stores/toolbarTitle'
import { useStore } from '@nanostores/vue'
import { useRoute } from 'vue-router'
import { chatRequests } from '../stores/chatRequests'
import contactsStore, { currentContact } from 'src/stores/contacts'
import keyPairStore from 'src/stores/keyPair'
import AskPin from 'src/components/AskPin.vue'

export default defineComponent({
	name: 'MainLayout',

	components: {
		ContactsItem,
		AuthPage,
		AskPin
	},

	setup() {
		const leftDrawerOpen = ref(false)
		const u = useStore(user)
		const loading = ref(true)
		const path = computed(() => useRoute().path)
		const title = useStore(toolbarTitle)
		const dropdownBadges = computed(() => {
			let badges = 0
			moreItems.value.forEach(i => (badges += i.badge))
			return badges
		})
		const requests = useStore(chatRequests)
		const moreItems = computed(() => [
			{
				title: 'Add a person',
				icon: 'person_add',
				to: '/add',
				badge: 0
			},
			{
				title: 'Contact requests',
				icon: 'people',
				to: '/requests',
				badge: requests.value.length
			},
			{
				title: 'Settings',
				icon: 'settings',
				to: '/settings',
				badge: 0
			}
		])
		const contacts = useStore(contactsStore)
		const keys = useStore(keyPairStore)

		function setContact(id: string) {
			const contact = contacts.value.find(c => c.$id === id)
			if (!contact) return
			currentContact.set(contact as any)
			leftDrawerOpen.value = false
		}

		return {
			contacts,
			setContact,
			requests,
			moreItems,
			leftDrawerOpen,
			u,
			dropdownBadges,
			path,
			title,
			toggleLeftDrawer() {
				leftDrawerOpen.value = !leftDrawerOpen.value
			},
			loading,
			privateKey: keys
		}
	},
	mounted() {
		loadUser().then(async () => {
			this.loading = false
		})
	}
})
</script>
