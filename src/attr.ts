import context, { Context } from './context'

export type AttrNumberValue = number & {
	__typename?: 'AttrNumberValue'
}
export type AttrStringValue = string & {
	__typename?: 'AttrStringValue'
}

export type AttrValue =
	| AttrNumberValue
	| AttrStringValue


export type OptionalAttrValue =
	| AttrValue
	| false
	| null
	| undefined

export function attr(
	name: string,
	value: OptionalAttrValue,
	namespaceURI: string | null = null
) {
	if (null == value) return
	name = name.trim()
	if (!name) return
	const ctx = context.peek()
	return ctx && _pushElementAttr(ctx, name, value, namespaceURI)
}

export type AttrsMapEntry =
	| AttrValue
	| [OptionalAttrValue, (string | null)?]

export type OptionalAttrMapEntry =
	| AttrsMapEntry
	| false
	| null
	| undefined

export type AttrsMap = Record<string, OptionalAttrMapEntry>

function* yieldObjectEntries<K extends keyof any, V>(inp: Record<K, V>) {
	for (const key in inp) {
		yield [key, inp[key]] as [K, V]
	}
}

function _pushElementAttr(
	ctx: Context,
	name: string,
	value: string | number | false,
	namespaceURI: string | null = null
) {
	if (typeof value === 'number' && isNaN(+value)) {
		console.warn('render attr(%O, NaN)', name)
	}
	return ctx.pushElementAttr({
		name,
		value: typeof value === 'boolean' ? value : String(value),
		namespaceURI: null == namespaceURI ? null : String(namespaceURI)
	})
}

export function attrs<T extends AttrsMap>(inp: T) {
	const ctx = context.peek()
	if (ctx) for (const [key, entry] of yieldObjectEntries(inp)) {
		const name = key.trim()
		if (!name) continue
		const [value, namespaceURI] = Array.isArray(entry) ? entry : [entry]
		if (null == value) continue
		_pushElementAttr(ctx, name, value, namespaceURI)
	}
}
