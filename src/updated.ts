import context, { ElementUpdatedCallback } from './context'

export function updated<T extends Element>(
	elementUpdatedCallback: ElementUpdatedCallback<T>
): void

export function updated(
	elementUpdatedCallback: ElementUpdatedCallback
) {
	const ctx = context.peek()
	if (ctx) {
		ctx.pushElementUpdatedCallback(elementUpdatedCallback)
	}
}
