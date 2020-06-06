export interface ElementDescriptor<T = Element> {
	__typename?: 'ElementDescriptor'
	tagName: string
	namespaceURI: string | null
	key: any
	content: ElementContentDescriptor<T> | null
}

export type ElementContentDescriptor<T = Element> =
	| ElementContentCallback<T>
	| string

export interface ElementContentCallback<T = Element> {
	__typename?: 'ElementContentCallback'
	(ref: T | null): void
}

export interface TextDescriptor {
	__typename?: 'TextDescriptor'
	key: any
	content: string
}

export interface CommentDescriptor {
	__typename?: 'CommentDescriptor'
	key: any
	content: string
}

export interface AttrDescriptor {
	__typename?: 'AttrDescriptor'
	name: string
	value: string
	namespaceURI: string | null
}

export interface ElementRemovedCallback<T = Element> {
	__typename?: 'ElementRemovedCallback'
	(target: T): void
}

export type OptionalElementRemovedCallback<T = Element> =
	| ElementRemovedCallback<T>
	| false
	| null
	| undefined
	| void

export type OptionalElementCleanupCallback<T = Element> =
	| ElementCleanupCallback<T>
	| false
	| null
	| undefined
	| void

export interface ElementCleanupCallback<T = Element> {
	__typename?: 'ElementCleanupCallback'
	(target: T): void
}

export interface ElementCreatedCallback<T = Element> {
	__typename?: 'ElementCreatedCallback'
	(target: T): OptionalElementRemovedCallback<T>
}

export interface ElementLinkingCallback<T = Element> {
	__typename?: 'ElementLinkingCallback'
	(target: T): OptionalElementCleanupCallback<T>
}

export interface ElementUpdatedCallback<T = Element> {
	__typename?: 'ElementUpdatedCallback'
	(target: T): OptionalElementCleanupCallback<T>
}

export interface Context {
	pushComment(descriptor: CommentDescriptor): Comment | null
	pushElement(descriptor: ElementDescriptor): Element | null
	pushElementAttr(descriptor: AttrDescriptor): void
	pushElementCleanupCallback(callback: ElementCleanupCallback): void
	pushElementCreatedCallback(callback: ElementCreatedCallback): void
	pushElementLinkingCallback(callback: ElementLinkingCallback): void
	pushElementRemovedCallback(callback: ElementRemovedCallback): void
	pushElementUpdatedCallback(callback: ElementUpdatedCallback): void
	pushText(descriptor: TextDescriptor): Text | null
}

const contexts: Context[] = []

export function peekContext() {
	if (contexts.length < 1) {
		return null
	}
	return contexts[contexts.length - 1]
}

const $$contexts = Symbol('contexts')

export interface IContextRegistry {
	push<T extends Context>(context: T): T
	pop(): void
	peek(): Context | null
}

class ContextRegistry implements IContextRegistry {
	private [$$contexts]: Context[]
	constructor() {
		this[$$contexts] = []
	}
	push<T extends Context>(context: T) {
		this[$$contexts].push(context)
		return context
	}
	pop(): void {
		const $contexts = this[$$contexts]
		if ($contexts.length > 0) {
			$contexts.pop()
		}
	}
	peek(): Context | null {
		const $contexts = this[$$contexts]
		return $contexts.length > 0 ? $contexts[$contexts.length - 1] : null
	}
}

export default new ContextRegistry()
