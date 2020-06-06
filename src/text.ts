import context from './context'

export type TextNumberValue = number & {
	__typename?: 'TextNumberValue'
}
export type TextStringValue = string & {
	__typename?: 'TextStringValue'
}

export type TextValue =
	| TextNumberValue
	| TextStringValue

export type OptionalTextValue =
	| TextValue
	| false
	| null
	| undefined

export function text(
	key: any,
	value: OptionalTextValue,
) {
	if (null == value || false === value) return null
	const ctx = context.peek()
	if (typeof value === 'number' && isNaN(+value)) {
		console.warn('render text(%O, NaN)', key)
	}
	return ctx && ctx.pushText({
		key,
		content: String(value),
	})
}
