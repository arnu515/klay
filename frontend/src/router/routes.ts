import { RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
	{
		path: '/',
		component: () => import('layouts/MainLayout.vue'),
		children: [
			{ path: '', component: () => import('pages/IndexPage.vue') },
			{
				path: 'settings',
				component: () => import('layouts/SettingsLayout.vue'),
				children: [
					{ path: '', component: () => import('pages/SettingsPage.vue') },
					{
						path: 'status',
						component: () => import('pages/settings/StatusPage.vue')
					},
					{
						path: 'profile',
						component: () => import('pages/settings/ProfilePage.vue')
					},
					{
						path: 'account',
						component: () => import('pages/settings/AccountPage.vue')
					},
					{ path: 'logout', component: () => import('pages/settings/LogoutPage.vue') }
				]
			},
			{
				path: 'add',
				component: () => import('src/pages/AddPersonPage.vue')
			},
			{
				path: 'requests',
				component: () => import('src/pages/RequestsPage.vue')
			}
		]
	},

	{
		path: '/:catchAll(.*)*',
		component: () => import('pages/ErrorNotFound.vue')
	}
]

export default routes
