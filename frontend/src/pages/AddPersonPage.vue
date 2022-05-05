<template>
	<main>
		<div class="wrapper">
			<q-card flat bordered style="height: 100%" class="message-box">
				<h1 class="text-h4 q-px-md">Add a person</h1>
			</q-card>
		</div>
	</main>
</template>

<style lang="scss" scoped>
main {
	position: fixed;
	top: 0;
	left: 0;
	width: 100%;
	height: 100%;
	padding: 1rem;
	padding-top: 3.5rem;
}
.wrapper {
	max-width: map-get($sizes, 'md');
	margin: 1rem auto;
	padding-bottom: 1rem;
	height: 100%;
}
</style>
