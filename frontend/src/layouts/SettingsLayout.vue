<template>
	<h1 style="margin: 0; padding: 1rem" class="text-h4">{{ title }}</h1>
	<router-view />
</template>

<script lang="ts" setup>
import { useStore } from '@nanostores/vue'
import tt from '../stores/toolbarTitle'

const title = useStore(tt)
</script>
