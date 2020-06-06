import context, { ElementRemovedCallback } from './context'

export function removed<T extends Element>(
	elementRemovedCallback: ElementRemovedCallback<T>
): void

export function removed(
	elementRemovedCallback: ElementRemovedCallback
) {
	const ctx = context.peek()
	if (ctx) {
		ctx.pushElementRemovedCallback(elementRemovedCallback)
	}
}
