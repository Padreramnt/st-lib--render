import context, { ElementLinkingCallback } from './context'

export function linking<T extends Element>(
	elementLinkingCallback: ElementLinkingCallback<T>
): void

export function linking(
	elementLinkingCallback: ElementLinkingCallback
) {
	const ctx = context.peek()
	if (ctx) {
		ctx.pushElementLinkingCallback(elementLinkingCallback)
	}
}
