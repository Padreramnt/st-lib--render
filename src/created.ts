import context, { ElementCreatedCallback } from './context'

export function created<T extends Element>(
	elementCreatedCallback: ElementCreatedCallback<T>
): void

export function created(
	elementCreatedCallback: ElementCreatedCallback
) {
	const ctx = context.peek()
	if (ctx) {
		ctx.pushElementCreatedCallback(elementCreatedCallback)
	}
}
