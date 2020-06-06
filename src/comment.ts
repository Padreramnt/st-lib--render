import context from './context'

export type CommentNumberValue = number & {
	__typename?: 'CommentNumberValue'
}
export type CommentStringValue = string & {
	__typename?: 'CommentStringValue'
}

export type CommentValue =
	| CommentNumberValue
	| CommentStringValue

export type OptionalCommentValue =
	| CommentValue
	| false
	| null
	| undefined

export function comment(
	key: any,
	value: OptionalCommentValue,
) {
	if (null == value || false === value) return
	const ctx = context.peek()
	if (typeof value === 'number' && isNaN(+value)) {
		console.warn('render comment(%O, NaN)', key)
	}
	return ctx && ctx.pushComment({
		key,
		content: String(value),
	})
}
