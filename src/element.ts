import context, { ElementContentDescriptor } from './context'


export function element<T extends Element>(
	key: any,
	tag: string | [string, (string | null)?, (ElementCreationOptions | null)?],
	content?: ElementContentDescriptor<T> | false | null | undefined,
): T | null

export function element(
	key: any,
	tag: string | [string, (string | null)?, (ElementCreationOptions | null)?],
	content: ElementContentDescriptor<Element> | false | null | undefined = null,
) {
	const [tagName, namespaceURI, options] = Array.isArray(tag) ? tag : [tag]
	const ctx = context.peek()
	return ctx && ctx.pushElement({
		content: false === content || null == content ? null : content,
		options: false === options || null == options ? null : options,
		key,
		tagName,
		namespaceURI: null == namespaceURI ? null : namespaceURI,
	})
}

export interface DefinedElement<T extends Element> {
	(
		key: any,
		content?: ElementContentDescriptor<T> | false | null | undefined,
		is?: string | false | null | undefined,
	): T | null
}

export function defineElement<T extends Element>(
	tag: string | [string, (string | null)?, (ElementCreationOptions | null)?],
): DefinedElement<T> {
	return (
		key,
		content = null,
	) => element(key, tag, content)
}
