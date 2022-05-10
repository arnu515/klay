export interface Profile {
	$id: string
	bio?: string
	status: string
	avatar_url: string
}

export interface ChatRequests {
	$id: string
	userId1: string
	userId2: string
}

export interface Contacts {
	$id: string
	userId1: string
	userId2: string
}

export interface SafeUser {
	$id: string
	email: string
	name: string
}

export interface Attachment {
	type: string
	url: string
}

export interface Message {
	_id: string
	content: string
	to: string
	attachments: Attachment[]
	created_at: string
}
