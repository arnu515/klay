export function parseFastApiError(data: Record<string, any>): string {
	if (data.error) {
		return `${data.error}: ${data.error_description || data.error}`
	}
	if (Array.isArray(data.detail)) {
		let msg = ''
		for (const item of data.detail) {
			msg += `<strong>${(item.loc || ['field']).join('.')}:</strong> <code>${
				item.msg
			}</code><br/>`
		}
		return (
			msg ||
			'An error occured while trying to perform this action. You can press F12 to look at the error.'
		)
	}
	return 'An error occured while trying to perform this action. You can press F12 to look at the error.'
}
