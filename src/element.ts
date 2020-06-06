import context, { ElementContentDescriptor } from './context'

export function element<T extends Element>(
	key: any,
	tag: string | [string, (string | null)?],
	content?: ElementContentDescriptor<T> | false | null | undefined,
): T | null

export function element(
	key: any,
	tag: string | [string, (string | null)?],
	content: ElementContentDescriptor<Element> | false | null | undefined = null,
) {
	const [tagName, namespaceURI] = Array.isArray(tag) ? tag : [tag]
	const ctx = context.peek()
	return ctx && ctx.pushElement({
		content: false === content || null == content ? null : content,
		key,
		tagName,
		namespaceURI: null == namespaceURI ? null : namespaceURI,
	})
}

export interface DefinedElement<T extends Element> {
	(
		key: any,
		content?: ElementContentDescriptor<T> | false | null | undefined,
	): T | null
}

export function defineElement<T extends Element>(
	tag: string | [string, (string | null)?],
): DefinedElement<T> {
	return (
		key,
		content = null,
	) => element(key, tag, content)
}
