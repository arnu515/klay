<template>
	<div style="padding: 1rem">
		<h1 class="text-h4">{{ title }}</h1>
	</div>
	<router-view />
</template>

<script lang="ts" setup>
import { useStore } from '@nanostores/vue'
import tt from '../stores/toolbarTitle'

const title = useStore(tt)
</script>
