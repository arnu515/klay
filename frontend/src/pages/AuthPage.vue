<template>
	<div style="padding: 5rem 1rem">
		<q-card style="max-width: 600px; margin: 1rem auto">
			<h1 style="text-align: center; font-size: 3rem; font-weight: bold">
				{{ mode === 'login' ? 'Log In' : 'Sign Up' }}
			</h1>
			<q-form
				@submit.prevent="submit"
				v-if="mode !== 'signup-pin'"
				style="padding: 1rem"
			>
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
						:loading="loading"
						:disable="loading"
					/>
					<q-btn
						@click="mode = mode === 'signup' ? 'login' : 'signup'"
						type="button"
						flat
						color="primary"
						:label="mode === 'login' ? 'Create an account' : 'Log In Instead'"
						:disable="loading"
					/>
				</div>
			</q-form>
			<template v-else>
				<h3 class="text-h5 text-center">One last step</h3>
				<p class="text-h6 text-center">
					Enter a 4 digit PIN to restore messages later.
				</p>
				<q-form @submit.prevent="signup">
					<div style="display: flex; justify-content: center">
						<q-input
							outlined
							placeholder="XXXX"
							aria-label="Pin"
							stack-label
							v-model="pin"
							mask="####"
							input-style="text-align: center; width: 100%"
							bottom-slots
							:rules="[
								val => val.length === 4 || 'Pin must be 4 characters long',
								val => /^\d+$/.test(val) || 'Pin must be a number'
							]"
						/>
					</div>
					<p class="text-callout text-center text-negative" style="margin-top: 1rem">
						If you lose your PIN, you will lose your messages.<br />
						You will still be able to sign in to your account.
					</p>
					<p class="text-callout text-center" style="margin-top: 1rem">
						Your PIN will be used to restore messages when you login to another device.
					</p>
					<div
						class="flex column items-center justify-center"
						style="gap: 1rem; padding-bottom: 1rem"
					>
						<q-btn
							type="submit"
							color="primary"
							label="Create Account"
							size="lg"
							:loading="loading"
							:disable="loading || pin.length !== 4"
						/>
						<q-btn
							@click="mode = 'signup'"
							type="button"
							flat
							color="primary"
							label="Go back"
							:disable="loading"
						/>
					</div>
				</q-form>
			</template>
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
import * as e from 'src/lib/encryption'

const mode = ref<'login' | 'signup' | 'signup-pin'>('login')
const isPasswordShown = ref(false)
const loading = ref(false)
const q = useQuasar()

const email = ref(''),
	pw = ref(''),
	name = ref(''),
	pin = ref('')

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
			mode.value = 'signup-pin'
		} else {
			loading.value = true
			await appwrite.account.createSession(email.value.trim(), pw.value.trim())
			await loadUser()
		}
		loading.value = false
	} catch (e) {
		loading.value = false
		err((e as any).message)
	}
}

async function signup() {
	console.log('ok')
	try {
		loading.value = true

		const keyPair = await e.Asymetric.generateKeys()
		const encryptedPrivateKey = await e.Symmetric.encryptSymmetric(
			keyPair.privateKey,
			pin.value
		)

		await appwrite.account.create(
			'unique()',
			email.value.trim(),
			pw.value.trim(),
			name.value.trim()
		)

		// temporarily log in the user to save keys in db
		const currentUser = await appwrite.account.createSession(
			email.value.trim(),
			pw.value.trim()
		)

		await appwrite.database.createDocument(
			'chat_keys',
			currentUser.userId,
			{
				public: keyPair.publicKey,
				private: JSON.stringify(encryptedPrivateKey)
			},
			['role:all'],
			[`user:${currentUser.userId}`]
		)

		await appwrite.account.deleteSession('current')

		email.value = ''
		pw.value = ''
		name.value = ''
		mode.value = 'login'
		q.dialog({
			title: 'Success',
			message: 'Account created. Please log in'
		})
	} catch (e) {
		await appwrite.account.deleteSession('current')
		err((e as any).message)
	}
	loading.value = false
}
</script>
