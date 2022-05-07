<template>
	<main>
		<div class="wrapper">
			<q-card flat bordered style="min-height: 100%" class="q-py-sm q-px-md">
				<h1 class="text-h4">Chat Requests</h1>
				<q-tabs v-model="tab" align="justify" class="bg-white shadow-2">
					<q-tab name="received">Received requests</q-tab>
					<q-tab name="sent">Sent requests</q-tab>
				</q-tabs>
				<h3 class="text-h6">
					{{ tab === 'received' ? 'Received Requests' : 'Sent Requests' }}
				</h3>
				<q-list v-if="tab === 'received'">
					<q-item v-for="item in received" :key="item.$id">
						<q-item-section avatar>
							<q-avatar size="32px">
								<img :src="item.profile1.avatar_url" style="border: 1px black solid" />
							</q-avatar>
						</q-item-section>
						<q-item-section>
							<span class="text-subtitle1">{{ item.user1.name }}</span>
						</q-item-section>
						<q-item-section side>
							<q-btn
								flat
								color="positive"
								@click="acceptRequest(item.$id)"
								title="Accept"
								aria-label="Accept request"
								round
								dense
								icon="done"
							/>
						</q-item-section>
						<q-item-section side>
							<q-btn
								flat
								color="negative"
								@click="rejectRequest(item.$id)"
								title="Reject"
								aria-label="Reject request"
								round
								dense
								icon="close"
							/>
						</q-item-section>
					</q-item>
				</q-list>
				<q-list v-if="tab === 'sent'">
					<q-item v-for="item in sent" :key="item.$id">
						<q-item-section avatar>
							<q-avatar size="32px">
								<img :src="item.profile2.avatar_url" style="border: 1px black solid" />
							</q-avatar>
						</q-item-section>
						<q-item-section>
							<span class="text-subtitle1">{{ item.user2.name }}</span>
						</q-item-section>
						<q-item-section side>
							<q-btn
								flat
								color="negative"
								@click="cancelRequest(item.$id)"
								title="Cancel"
								aria-label="Cancel request"
								round
								dense
								icon="close"
							/>
						</q-item-section>
					</q-item>
				</q-list>
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
	overflow: auto;
	scrollbar-color: $primary white;
	scrollbar-width: thin;

	&::-webkit-scrollbar-thumb {
		background-color: $primary;
	}

	&::-webkit-scrollbar {
		width: 5px;
		background-color: inherit;
	}
}
</style>

<script lang="ts" setup>
import { useStore } from '@nanostores/vue'
import { Models, Query } from 'appwrite'
import { Dialog } from 'quasar'
import appwrite from 'src/lib/appwrite'
import axios from 'src/lib/axios'
import { getJWT } from 'src/lib/jwt'
import { ChatRequests } from 'src/lib/types'
import { getProfileOfUser, parseFastApiError } from 'src/lib/util'
import chatRequests from 'src/stores/chatRequests'
import user from 'src/stores/user'
import { onMounted, ref } from 'vue'

const tab = ref('received')
const received = useStore(chatRequests)
const sent = ref<any[]>([])

async function loadSentRequests() {
	const res = await appwrite.database.listDocuments<Models.Document & ChatRequests>(
		'chat_requests',
		[Query.equal('userId1', user.get()!.$id)]
	)
	console.log(res)
	const requests = [] as any[]
	for await (const doc of res.documents) {
		const u1 = await getProfileOfUser(doc.userId1)
		const u2 = await getProfileOfUser(doc.userId2)
		if (!u1 || !u2) {
			// invalid data, can't trust it
			return
		}
		const request = {
			...doc,
			profile1: u1.profile,
			profile2: u2.profile,
			user1: u1.user,
			user2: u2.user
		}
		console.log({ request })
		requests.push(request)
	}
	sent.value = [...requests]
}

async function updateRequest(action: 'accept' | 'reject', id: string) {
	try {
		await new Promise<void>((res, rej) => {
			const d = Dialog.create({
				title: 'Are you sure?',
				message: `Are you sure you want to ${action} this request?`,
				ok: {
					label: 'Yes',
					color: 'Positive',
					flat: true
				},
				cancel: {
					label: 'No',
					color: 'Negative',
					flat: true
				}
			})
			d.onOk(() => res())
			d.onCancel(() => rej())
		})

		const res = await axios.patch(`/api/chat_requests/${id}/${action}`, undefined, {
			headers: {
				Authorization: 'Bearer ' + (await getJWT())
			}
		})

		Dialog.create({
			title: res.status === 200 ? 'Success' : 'Error',
			message:
				res.status === 200
					? `Successfully ${action}ed chat request`
					: parseFastApiError(res.data)
		})
	} catch {}
}

async function cancelRequest(id: string) {
	try {
		await new Promise<void>((res, rej) => {
			const d = Dialog.create({
				title: 'Are you sure?',
				message: 'Are you sure you want to unsend this request?',
				ok: {
					label: 'Yes',
					color: 'Positive',
					flat: true
				},
				cancel: {
					label: 'No',
					color: 'Negative',
					flat: true
				}
			})
			d.onOk(() => res())
			d.onCancel(() => rej())
		})

		const res = await axios.delete(`/api/chat_requests/${id}`, {
			headers: {
				Authorization: 'Bearer ' + (await getJWT())
			}
		})

		Dialog.create({
			title: res.status === 200 ? 'Success' : 'Error',
			message: res.status === 200 ? 'Deleted chat request' : parseFastApiError(res.data)
		})

		await loadSentRequests()
	} catch {}
}

const acceptRequest = (id: string) => updateRequest('accept', id)
const rejectRequest = (id: string) => updateRequest('reject', id)

onMounted(() => {
	loadSentRequests()
})
</script>
