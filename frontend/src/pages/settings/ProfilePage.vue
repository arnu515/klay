<template>
	<div style="padding: 1rem">
		<q-form @reset="name = user.name" @submit.prevent="changeName">
			<h3 class="text-h6">Name</h3>
			<q-input
				outlined
				label="Name"
				type="text"
				v-model="name"
				required
				bottom-slots
				:rules="[
					val => val.trim().length >= 4 || 'Name must be 4 or more characters long',
					val => val.trim().length <= 64 || 'Name must have less than 64 characters'
				]"
			>
				<template v-slot:prepend>
					<q-icon name="badge" />
				</template>
			</q-input>
			<div class="submit">
				<q-btn type="reset" flat dense icon="replay" />
				<q-btn
					type="submit"
					:disable="name === user.name"
					color="primary"
					:loading="loading.name"
					>Save</q-btn
				>
			</div>
		</q-form>
		<q-form @reset="about = profile.bio" @submit.prevent="changeAbout">
			<h3 class="text-h6">About</h3>
			<q-input
				outlined
				label="About You"
				type="text"
				v-model="about"
				required
				autogrow
				bottom-slots
				:rules="[
					val => val.trim().length <= 2000 || 'Bio must be less than 2000 characters'
				]"
			>
				<template v-slot:prepend>
					<q-icon name="badge" />
				</template>
			</q-input>
			<div class="submit">
				<q-btn type="reset" flat dense icon="replay" />
				<q-btn
					type="submit"
					:disable="about === profile.bio"
					color="primary"
					:loading="loading.name"
					>Save</q-btn
				>
			</div>
		</q-form>
		<form @submit.prevent="changeAvatar" @reset.prevent="resetAvatar">
			<h3 class="text-h6">Avatar</h3>
			<div class="avatar">
				<div class="btns">
					<q-btn
						type="button"
						color="primary"
						@click="chooseAvatarFile"
						:disable="loading.avatar"
						>Select new image</q-btn
					>
					<q-btn type="button" @click="useDefaultAvatar" :disable="loading.avatar"
						>Use default avatar</q-btn
					>
				</div>
				<img :src="profile.avatar_url" ref="avatarImg" alt="Avatar" />
			</div>
			<div class="submit">
				<q-btn type="reset" flat dense icon="replay" />
				<q-btn
					type="submit"
					:disable="avatarImgType === 'file' && avatarFile === null"
					color="primary"
					:loading="loading.avatar"
					>Save</q-btn
				>
			</div>
		</form>
	</div>
</template>

<style lang="scss" scoped>
.submit {
	display: flex;
	align-items: center;
	justify-content: flex-end;
	gap: 0.5rem;
}
.avatar {
	display: flex;
	align-items: center;
	justify-content: space-between;
	margin-bottom: 1rem;
	.btns {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}
	img {
		width: 96px;
		height: 96px;
		border: 1px black solid;
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
import { profile as profileStore } from 'src/stores/user'
import axios from 'src/lib/axios'
import { parseFastApiError } from 'src/lib/util'
import { getJWT } from 'src/lib/jwt'

toolbarTitle.set('Profile')

const user = useStore(userStore)
const profile = useStore(profileStore)

const loading = ref({ name: false, about: false, avatar: false })

const name = ref(user.value!.name)
const about = ref(profile.value!.bio || '')

const avatarFile = ref<File | null>(null)
const avatarImg = ref<HTMLImageElement>()
const avatarImgType = ref<'file' | 'default'>('file')

async function changeName() {
	loading.value.name = true

	await appwrite.account.updateName(name.value.trim())
	await loadUser()
	Dialog.create({
		title: 'Success',
		message: 'Your name has been changed'
	})

	loading.value.name = false
}

async function changeAbout() {
	loading.value.about = true

	const res = await axios.put(
		'/api/profile/me',
		{
			...profile.value,
			bio: about.value.trim()
		},
		{
			headers: {
				Authorization: 'Bearer ' + (await getJWT())
			}
		}
	)
	if (res.status === 200) {
		await loadUser()
		Dialog.create({
			title: 'Success',
			message: 'Your about has been changed'
		})
	} else {
		Dialog.create({
			title: 'Error',
			message: parseFastApiError(res.data),
			html: true
		})
	}

	loading.value.about = false
}

async function changeAvatar() {
	if (!avatarFile.value) return
	const fd = new FormData()
	fd.append('file', avatarFile.value)

	loading.value.avatar = true
	const res = await axios.put('/api/profile/me/avatar', fd, {
		headers: {
			Authorization: 'Bearer ' + (await getJWT())
		}
	})

	if (res.status === 200) {
		await loadUser()
		Dialog.create({
			title: 'Success',
			message: 'Your avatar has been changed'
		})
	} else {
		Dialog.create({
			title: 'Error',
			message: parseFastApiError(res.data),
			html: true
		})
	}

	loading.value.avatar = false
}

async function chooseAvatarFile() {
	const input = document.createElement('input')
	input.type = 'file'
	input.accept = 'image/png,image/jpeg'
	input.click()
	input.onchange = async () => {
		const file = input.files?.[0]
		if (!file) return

		// file must be less than 3 MiB
		if (file.size > 3145728) {
			Dialog.create({
				title: 'Error',
				message: 'File size must be less than 3 MiB'
			})
			return
		}
		// file must be a png or jpeg
		if (!file.type.match(/image\/(png|jpeg)/)) {
			Dialog.create({
				title: 'Error',
				message: 'File must be a png or jpeg'
			})
			return
		}

		// set image src to file base64
		const reader = new FileReader()
		reader.onload = () => {
			avatarImg.value!.src = reader.result as string
			avatarFile.value = file
			avatarImgType.value = 'file'
		}
		reader.readAsDataURL(file)
	}
}

function useDefaultAvatar() {
	const url = appwrite.avatars.getInitials(user.value!.name, 64, 64).toString()
	avatarImg.value!.src = url.toString()
	avatarFile.value = null
	avatarImgType.value = 'default'
}

async function resetAvatar() {
	avatarImg.value!.src = profile.value!.avatar_url
	avatarFile.value = null
	avatarImgType.value = 'file'
}
</script>
