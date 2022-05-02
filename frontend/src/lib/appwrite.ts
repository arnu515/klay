import { Appwrite } from 'appwrite'

const appwrite = new Appwrite()

appwrite
	.setEndpoint(process.env.APPWRITE_ENDPOINT!)
	.setProject(process.env.APPWRITE_PROJECT_ID!)

export default appwrite
