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
