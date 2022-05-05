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
						path: 'profile',
						component: () => import('pages/settings/ProfilePage.vue')
					},
					{ path: 'account', component: () => import('pages/settings/AccountPage.vue') }
				]
			}
		]
	},

	{
		path: '/:catchAll(.*)*',
		component: () => import('pages/ErrorNotFound.vue')
	}
]

export default routes
