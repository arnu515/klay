# klay

Klay is an end-to-end encrypted chat app.

Works on the web, and as a mobile app.

## Dev.to Post

https://dev.to/arnu515/introducing-klay-an-end-to-end-encrypted-chat-application-6lp

## URL

Web: https://klay-arnu515.vercel.app/

Android: https://appwrite.arnu515.tk/v1/storage/buckets/files/files/klay.apk/download?project=klay

(You may get a Play Protect error while installing the app. You can ignore that error. It happens because the certificate is self signed).

## Compile the app on your own

1. Clone the repo
2. Make sure you have completed the [required environment setup](https://capacitorjs.com/docs/getting-started/environment-setup)
3. Run `yarn install` in the frontend directory, and `yarn install` in the `frontend/src-capacitor` directory.
4. Add an `.env` file with these contents in the frontend directory:
```toml
# Appwrite stuff
APPWRITE_ENDPOINT=https://appwrite.arnu515.tk
APPWRITE_PROJECT_ID=klay

# URL of the backend
BACKEND_URL=https://klay-backend-production-69e3.up.railway.app/
```
5. Run `npx quasar run -T capacitor -m android/ios` depending on your phone's operating system.
