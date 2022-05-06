<template>
	<main>
		<div class="wrapper native-mobile-only">
			<ul class="btns">
				<li>
					<button @click="toggleFlashlight">
						<q-icon
							color="white"
							:name="isFlashlightOn ? 'flashlight_on' : 'flashlight_off'"
							size="36px"
						/>
						<span>Turn {{ isFlashlightOn ? 'off' : 'on' }} flash</span>
					</button>
				</li>
				<li>
					<button @click="close">
						<q-icon color="white" name="close" size="36px" />
						<span>Close</span>
					</button>
				</li>
			</ul>
		</div>
		<div class="qr-box native-mobile-only">
			Place QR Code in this frame
			<div class="a"></div>
			<div class="b"></div>
			<div class="c"></div>
			<div class="d"></div>
		</div>
		<div class="native-mobile-hide">
			<div id="web-scanner"></div>
			<br />
			<div class="wrapper web">
				<ul class="btns">
					<li>
						<button @click="toggleFlashlight">
							<q-icon color="white" name="cameraswitch" size="36px" />
							<span>Flip camera</span>
						</button>
					</li>
					<li>
						<button @click="close">
							<q-icon color="white" name="close" size="36px" />
							<span>Close</span>
						</button>
					</li>
				</ul>
			</div>
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
	background-color: rgba(0, 0, 0, 0.4);
	border: 1px black solid;
	border-radius: 0.5rem;
	padding: 1rem;
	&.web {
		position: fixed;
		bottom: 2rem;
		width: calc(100% - 2rem);
	}
}
.btns {
	list-style-type: none;
	display: flex;
	margin: 0;
	padding: 0;
	flex-direction: row;
	justify-content: space-between;
	align-items: center;
	button {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		background-color: inherit;
		outline: none;
		border: none;
		span {
			font-size: 14px;
			color: white;
			font-weight: bold;
		}
	}
}
.qr-box {
	top: 50%;
	left: 50%;
	position: fixed;
	transform: translate(-50%, -50%);
	width: 30vh;
	height: 30vh;
	max-width: 300px;
	max-height: 300px;
	background: rgba(0, 0, 0, 0.2);
	display: flex;
	align-items: center;
	justify-content: center;
	color: #ddd;
	font-size: 24px;
	text-align: center;
	.a {
		position: absolute;
		border-top: 3px white solid;
		border-left: 3px white solid;
		top: -5px;
		left: -5px;
		width: 35px;
		height: 35px;
	}
	.b {
		position: absolute;
		border-top: 3px white solid;
		border-right: 3px white solid;
		top: -5px;
		right: -5px;
		width: 35px;
		height: 35px;
	}
	.c {
		position: absolute;
		border-bottom: 3px white solid;
		border-left: 3px white solid;
		bottom: -5px;
		left: -5px;
		width: 35px;
		height: 35px;
	}
	.d {
		position: absolute;
		border-bottom: 3px white solid;
		border-right: 3px white solid;
		bottom: -5px;
		right: -5px;
		width: 35px;
		height: 35px;
	}
}
</style>

<script lang="ts">
import { Dialog } from 'quasar'
import { defineComponent } from 'vue'
import {
	BarcodeScanner,
	SupportedFormat
} from 'app/src-capacitor/node_modules/@capacitor-community/barcode-scanner'
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode'
import toolbarTitle from 'src/stores/toolbarTitle'

export default defineComponent({
	name: 'ScanQRCode',
	data() {
		return {
			isFlashlightOn: false,
			webScanner: undefined as Html5Qrcode | undefined
		}
	},
	props: {
		title: {
			type: String,
			default: 'Scan QR Code'
		}
	},
	emits: ['scan', 'close', 'toggleFlash'],
	async mounted() {
		toolbarTitle.set(this.title)
		const q = this.$q

		if (q.platform.is.capacitor) {
			function openSettingsDialog() {
				Dialog.create({
					title: 'Permission denied',
					message:
						'You have denied the permission to use the camera. Please allow it in your settings.',
					ok: {
						label: 'Open settings',
						flat: true,
						color: 'primary'
					},
					cancel: {
						label: 'Cancel',
						flat: true
					}
				}).onOk(() => BarcodeScanner.openAppSettings())
			}

			let perm = false
			const passiveResult = await BarcodeScanner.checkPermission({ force: false })
			// we already have the permission, great
			if (passiveResult.granted) perm = true
			// we will never have the permission, even if we ask using force
			if (passiveResult.denied || passiveResult.restricted) {
				openSettingsDialog()
				return
			}
			// we have never asked the permission
			if (passiveResult.neverAsked) {
				// for android only
				q.platform.is.android &&
					Dialog.create({
						title: 'Permission request',
						message:
							'Please grant us access to your camera in the next screen to scan the QR Code'
					})
			}
			if (!perm) {
				// ask permission
				const permResult = await BarcodeScanner.checkPermission({ force: true })
				if (permResult.granted) perm = true
			}
			if (!perm) {
				openSettingsDialog()
				return
			}
			BarcodeScanner.hideBackground()
			const res = await BarcodeScanner.startScan({
				targetedFormats: [SupportedFormat.QR_CODE]
			})
			this.$emit('scan', res)
			this.$emit('close')
		} else {
			function deniedCameraDialog() {
				Dialog.create({
					title: 'Permission denied',
					message:
						'You have denied the permission to use the camera. Please allow it and reload this webpage.',
					ok: {
						label: 'Instructions',
						flat: true,
						icon: 'launch',
						color: 'primary'
					},
					cancel: {
						label: 'Cancel',
						flat: true
					}
				}).onOk(() => {
					if (q.platform.is.firefox) {
						window.open(
							'https://support.mozilla.org/en-US/kb/how-manage-your-camera-and-microphone-permissions'
						)
					} else {
						window.open('https://support.google.com/chrome/answer/2693767')
					}
				})
			}
			const devices = await Html5Qrcode.getCameras()
				.then(d => d)
				.catch(e => {
					console.error(e)
					return null
				})
			if (!devices || !devices.length) {
				deniedCameraDialog()
				return
			}
			this.webScanner = new Html5Qrcode('web-scanner', {
				verbose: false,
				formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE]
			})
			this.webScanner
				.start(
					{ facingMode: 'environment' },
					{
						fps: 10,
						qrbox: { width: 200, height: 200 }
					},
					text => {
						this.$emit('scan', text)
						this.$emit('close')
					},
					() => {
						//
					}
				)
				.catch(console.error)
		}
	},

	methods: {
		async stopScan() {
			if (this.$q.platform.is.capacitor) {
				await BarcodeScanner.showBackground()
				await BarcodeScanner.stopScan()
			} else {
				if (this.webScanner) {
					await this.webScanner.stop()
					this.webScanner = undefined
				}
			}
		},
		async toggleFlashlight() {
			if (this.$q.platform.is.capacitor) {
				if (this.isFlashlightOn) {
					await BarcodeScanner.disableTorch()
				} else {
					await BarcodeScanner.enableTorch()
				}
			} else {
				// flip camera on web
				// if isFlashlightOn is true, it means the camera is facing front
				if (!this.webScanner) return
				this.webScanner.stop()
				this.webScanner
					.start(
						{ facingMode: this.isFlashlightOn ? 'environment' : 'user' },
						{
							fps: 10,
							qrbox: { width: 200, height: 200 }
						},
						text => {
							this.$emit('scan', { content: text })
							this.$emit('close')
						},
						() => {
							//
						}
					)
					.catch(console.error)
			}
			this.$emit('toggleFlash', !this.isFlashlightOn)
			this.isFlashlightOn = !this.isFlashlightOn
		},
		async close() {
			this.$emit('close')
		}
	},

	deactivated() {
		this.stopScan()
	},

	beforeUnmount() {
		this.stopScan()
	}
})
</script>
