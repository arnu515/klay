<template>
	<div style="padding: 1rem">
		<q-form @reset="email.reset" @submit.prevent="changeEmail">
			<h3 class="text-h6">Email</h3>
			<q-input
				outlined
				label="Email"
				type="email"
				v-model="email.email"
				required
				style="margin-top: 1rem"
				bottom-slots
				:rules="[val => v.isEmail(val) || 'Invalid email']"
			>
				<template v-slot:prepend>
					<q-icon name="email" />
				</template>
			</q-input>
			<br />
			<q-input
				outlined
				label="Password"
				:type="email.pv ? 'text' : 'password'"
				v-model="email.password"
				required
				bottom-slots
				hint="Enter your password to change your email"
			>
				<template v-slot:prepend>
					<q-icon name="lock" />
				</template>
				<template v-slot:append>
					<button class="show-pw-button" @click="email.pv = !email.pv">
						<q-icon :name="email.pv ? 'visibility' : 'visibility_off'" />
					</button>
				</template>
			</q-input>
			<div class="submit">
				<q-btn type="reset" flat dense icon="replay" />
				<q-btn
					type="submit"
					:disable="!email.email || !email.password"
					color="primary"
					:loading="loading.email"
					>Save</q-btn
				>
			</div>
		</q-form>
		<q-form @reset="password.reset" @submit.prevent="changePassword">
			<h3 class="text-h6">Password</h3>
			<q-input
				outlined
				label="Current Password"
				:type="password.ov ? 'text' : 'password'"
				v-model="password.o"
				bottom-slots
				required
			>
				<template v-slot:prepend>
					<q-icon name="lock" />
				</template>
				<template v-slot:append>
					<button class="show-pw-button" @click="password.ov = !password.ov">
						<q-icon :name="password.ov ? 'visibility' : 'visibility_off'" />
					</button>
				</template>
			</q-input>
			<br />
			<q-input
				outlined
				label="New Password"
				:type="password.nv ? 'text' : 'password'"
				v-model="password.n"
				required
				bottom-slots
				:rules="[
					val => val.length >= 8 || 'Password must be 8 or more characters long'
				]"
			>
				<template v-slot:prepend>
					<q-icon name="lock" />
				</template>
				<template v-slot:append>
					<button class="show-pw-button" @click="password.nv = !password.nv">
						<q-icon :name="password.nv ? 'visibility' : 'visibility_off'" />
					</button>
				</template>
			</q-input>
			<br />
			<q-input
				outlined
				label="Confirm Password"
				:type="password.cv ? 'text' : 'password'"
				v-model="password.c"
				required
				bottom-slots
				:rules="[val => val === password.n || 'Passwords do not match']"
			>
				<template v-slot:prepend>
					<q-icon name="lock" />
				</template>
				<template v-slot:append>
					<button class="show-pw-button" @click="password.cv = !password.cv">
						<q-icon :name="password.cv ? 'visibility' : 'visibility_off'" />
					</button>
				</template>
			</q-input>
			<div class="submit">
				<q-btn type="reset" flat dense icon="replay" />
				<q-btn
					type="submit"
					:disable="!password.o || !password.n || password.c !== password.n"
					color="primary"
					:loading="loading.password"
					>Save</q-btn
				>
			</div>
		</q-form>
	</div>
</template>

<style lang="scss" scoped>
.submit {
	display: flex;
	align-items: center;
	justify-content: flex-end;
	gap: 0.5rem;
}
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
import toolbarTitle from 'src/stores/toolbarTitle'
import { ref } from 'vue'
import userStore, { loadUser } from 'src/stores/user'
import { useStore } from '@nanostores/vue'
import appwrite from 'src/lib/appwrite'
import { Dialog } from 'quasar'
import v from 'validator'

toolbarTitle.set('Account')

const user = useStore(userStore)

const loading = ref({ email: false, password: false })

const email = ref({
	email: user.value!.email,
	password: '',
	pv: false,
	reset() {
		email.value = { ...email.value, email: user.value!.email, password: '' }
	}
})
const password = ref({
	o: '',
	ov: false,
	n: '',
	nv: false,
	c: '',
	cv: false,
	reset() {
		password.value = { ...password.value, o: '', n: '', c: '' }
	}
})

async function changeEmail() {
	loading.value.email = true

	try {
		await appwrite.account.updateEmail(email.value.email.trim(), email.value.password)
		await loadUser()
		Dialog.create({
			title: 'Success',
			message: 'Your email has been changed'
		})
	} catch (e) {
		Dialog.create({
			title: 'Error',
			message: (e as any).message
		})
	}

	loading.value.email = false
	email.value.reset()
}

async function changePassword() {
	if (password.value.n !== password.value.c) {
		Dialog.create({
			title: 'Error',
			message: "Passwords don't match"
		})
	}

	loading.value.password = true

	try {
		await appwrite.account.updatePassword(password.value.n, password.value.o)
		await loadUser()
		Dialog.create({
			title: 'Success',
			message: 'Your password has been changed'
		})
	} catch (e) {
		Dialog.create({
			title: 'Error',
			message: (e as any).message
		})
	}

	loading.value.password = false
	password.value.reset()
}
</script>
