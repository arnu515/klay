<template>
	<div style="padding: 5rem 1rem">
		<q-card style="max-width: 600px; margin: 1rem auto">
			<h1 style="text-align: center; font-size: 3rem; font-weight: bold">
				{{ mode === 'login' ? 'Log In' : 'Sign Up' }}
			</h1>
			<q-form @submit.prevent="submit" style="padding: 1rem">
				<q-input
					outlined
					label="Email"
					type="email"
					v-model="email"
					required
					bottom-slots
					:rules="[val => v.isEmail(val) || 'Invalid email']"
				>
					<template v-slot:prepend>
						<q-icon name="email" />
					</template>
				</q-input>
				<br />
				<q-input
					required
					outlined
					label="Password"
					v-model="pw"
					:type="isPasswordShown ? 'text' : 'password'"
					bottom-slots
					:rules="[
						val => val.length >= 8 || 'Password must be 8 or more characters long'
					]"
				>
					<template v-slot:prepend>
						<q-icon name="lock" />
					</template>
					<template v-slot:append>
						<button class="show-pw-button" @click="isPasswordShown = !isPasswordShown">
							<q-icon :name="isPasswordShown ? 'visibility' : 'visibility_off'" />
						</button>
					</template>
				</q-input>
				<br />
				<q-input
					v-if="mode === 'signup'"
					outlined
					label="Name"
					type="text"
					v-model="name"
					required
					bottom-slots
					:rules="[
						val => val.length >= 4 || 'Name must be 4 or more characters long',
						val => val.length <= 64 || 'Name must have less than 64 characters'
					]"
				>
					<template v-slot:prepend>
						<q-icon name="badge" />
					</template>
				</q-input>
				<br />
				<div class="flex column items-center justify-center" style="gap: 1rem">
					<q-btn
						type="submit"
						color="primary"
						:label="mode === 'login' ? 'Log In' : 'Create account'"
						size="lg"
					/>
					<q-btn
						@click="mode = mode === 'signup' ? 'login' : 'signup'"
						type="button"
						flat
						color="primary"
						:label="mode === 'login' ? 'Create an account' : 'Log In Instead'"
					/>
				</div>
			</q-form>
		</q-card>
	</div>
</template>

<style lang="scss" scoped>
.show-pw-button {
	background-color: white;
	outline: none;
	border: 1px solid transparent;
	border-radius: 9999px;
	padding: 0.25rem;
	display: flex;
	justify-content: center;
	align-items: center;
	transition: all 500ms ease-in-out;
	cursor: pointer;
	&:hover {
		filter: brightness(0.9);
		border-color: gray;
	}
	&:focus {
		border-color: $primary;
	}
}
</style>

<script lang="ts" setup>
import { ref } from 'vue'
import v from 'validator'
import appwrite from '../lib/appwrite'
import { useQuasar } from 'quasar'
import { loadUser } from 'src/stores/user'

const mode = ref<'login' | 'signup'>('login')
const isPasswordShown = ref(false)
const q = useQuasar()

const email = ref(''),
	pw = ref(''),
	name = ref('')

function err(msg: string) {
	q.dialog({
		title: 'An error occured',
		message: msg,
		color: 'negative'
	})
}

async function submit() {
	try {
		if (mode.value === 'signup') {
			await appwrite.account.create(
				'unique()',
				email.value.trim(),
				pw.value.trim(),
				name.value.trim()
			)
			await appwrite.account.createSession(email.value.trim(), pw.value.trim())
		} else {
			await appwrite.account.createSession(email.value.trim(), pw.value.trim())
		}
		await loadUser()
	} catch (e) {
		err((e as any).message)
	}
}
</script>
