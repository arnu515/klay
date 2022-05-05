import { Appwrite } from 'appwrite'

const appwrite = new Appwrite()

appwrite
	.setEndpoint(process.env.APPWRITE_ENDPOINT!)
	.setProject(process.env.APPWRITE_PROJECT_ID!)

if (process.env.NODE_ENV === 'development') (window as any)['appwrite'] = appwrite

export default appwrite
