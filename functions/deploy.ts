#!/usr/bin/env -S deno run -A

/**
 * Deno Script to deploy appwrite functions.
 */

import * as sdk from 'https://deno.land/x/appwrite@3.1.0/mod.ts'
import { config } from 'https://deno.land/x/dotenv@v3.2.0/mod.ts'
import { join } from 'https://deno.land/std@0.135.0/path/mod.ts'

const env = config()
const REQUIRED_ENV_VARS = [
	'APPWRITE_ENDPOINT',
	'APPWRITE_PROJECT_ID',
	'APPWRITE_SECRET'
]
REQUIRED_ENV_VARS.forEach(i => {
	if (typeof env[i] === 'undefined') throw new Error('Missing env var: ' + i)
})

const client = new sdk.Client()
	.setEndpoint(env.APPWRITE_ENDPOINT)
	.setProject(env.APPWRITE_PROJECT_ID)
	.setKey(env.APPWRITE_SECRET)
const functions = new sdk.Functions(client)

interface AppwriteFunction {
	id: string
	name: string
	path: string
	execute: string[]
	entrypoint: string
	runtime: string
	timeout?: number
	events?: string[]
	schedule?: string
	vars?: Record<string, string>
}

// Get a list of all directories in the current directory and register them as funcFromPkgJsontions.
for (const dir of Deno.readDirSync('.')) {
	if (!dir.isDirectory) continue
	// deno-lint-ignore no-explicit-any
	let funcFromPkgJson: Record<string, any> = {}
	try {
		funcFromPkgJson = JSON.parse(
			new TextDecoder().decode(Deno.readFileSync(join('./', dir.name, 'package.json')))
		).appwriteFunction
		if (!funcFromPkgJson) throw new Error()
	} catch (e) {
		console.log(e)
		continue
	}

	const appwritefunction: AppwriteFunction = {
		id: funcFromPkgJson.id || dir.name,
		name: funcFromPkgJson.name || dir.name,
		path: join('./', dir.name),
		entrypoint: funcFromPkgJson.entrypoint || 'index.ts',
		runtime: funcFromPkgJson.runtime || 'node-16.0',
		execute: funcFromPkgJson.execute || [],
		vars: {
			APPWRITE_FUNCTION_ENDPOINT: env.APPWRITE_ENDPOINT,
			APPWRITE_FUNCTION_API_KEY: env.APPWRITE_SECRET,
			...(funcFromPkgJson.vars || {})
		},
		events: funcFromPkgJson.events || undefined,
		schedule: funcFromPkgJson.schedule || undefined,
		timeout: funcFromPkgJson.timeout || 60
	}

	try {
		// create / get the function
		let func = await functions
			.get(appwritefunction.id)
			.then(a => a)
			.catch(() => null)
		if (!func) {
			func = await functions.create(
				appwritefunction.id,
				appwritefunction.name,
				appwritefunction.execute,
				appwritefunction.runtime,
				appwritefunction.vars,
				appwritefunction.events,
				appwritefunction.schedule,
				appwritefunction.timeout
			)
		}

		// Create a zip file of the folder
		const compressCommandProcess = Deno.run({
			cmd: ['tar', '-czf', '../' + appwritefunction.id + '.tar.gz', '.'],
			cwd: appwritefunction.path
		})
		const status = await compressCommandProcess.status()
		if (!status.success) Deno.exit(status.code)
		Deno.close(compressCommandProcess.rid)

		// deploy the function
		await functions.createDeployment(
			appwritefunction.id,
			appwritefunction.entrypoint,
			join('./', appwritefunction.id + '.tar.gz'),
			true
		)

		// delete the tar file
		Deno.removeSync(join('./', appwritefunction.id + '.tar.gz'))

		console.log(`Function ${appwritefunction.id} deployed.`)
	} catch (e) {
		console.error(e)
	}
}
