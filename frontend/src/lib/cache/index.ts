import ms from 'ms'

interface Cache {
	readonly name: string
	expires: Date
	get(key: string): any
	set(key: string, value: any): void
	remove(key: string): void
}

export class LocalStorageCache implements Cache {
	readonly name: string
	expires: Date

	private setCache(value: any) {
		localStorage.setItem(this.name, JSON.stringify(value))
	}

	private getCache() {
		// check if cache expired
		if (this.expires < new Date()) {
			localStorage.removeItem(this.name)
			this.setCache({})
			return {}
		}
		const item = localStorage.getItem(this.name)
		try {
			if (!item) throw new Error()
			return JSON.parse(item)
		} catch {
			this.setCache({})
			return {}
		}
	}

	constructor(name: string, ttl: string) {
		this.name = name
		this.expires = new Date(Date.now() + ms(ttl))
	}

	get(key: string) {
		return this.getCache()[key]
	}

	set(key: string, value: any) {
		const cache = this.getCache()
		cache[key] = value
		this.setCache(cache)
	}

	remove(key: string) {
		const cache = this.getCache()
		delete cache[key]
		this.setCache(cache)
	}
}

export class InMemoryCache implements Cache {
	readonly name: string
	expires: Date

	private cache: Record<string, any> = {}

	private setCache(value: any) {
		this.cache = value
	}

	private getCache() {
		// check if cache expired
		if (this.expires < new Date()) {
			this.cache = {}
			return {}
		}
		return this.cache
	}

	constructor(name: string, ttl: string) {
		this.name = name
		this.expires = new Date(Date.now() + ms(ttl))
	}

	get(key: string) {
		return this.getCache()[key]
	}

	set(key: string, value: any) {
		const cache = this.getCache()
		cache[key] = value
		this.setCache(cache)
	}

	remove(key: string) {
		const cache = this.getCache()
		delete cache[key]
		this.setCache(cache)
	}
}
