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
	</q-list>
</template>

<script lang="ts" setup>
import toolbarTitle from 'src/stores/toolbarTitle'
import { ref } from 'vue'

toolbarTitle.set('Settings')

const settings = ref([
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
</script>
