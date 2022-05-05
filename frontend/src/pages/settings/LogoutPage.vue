<template>
	<p>Logging you out...</p>
</template>

<script lang="ts">
import appwrite from 'src/lib/appwrite'
import { loadUser } from 'src/stores/user'
import { defineComponent } from 'vue'

export default defineComponent({
	name: 'LogoutPage',
	async mounted() {
		await appwrite.account.deleteSession('current')
		await loadUser()
		this.$router.replace('/')
	}
})
</script>
