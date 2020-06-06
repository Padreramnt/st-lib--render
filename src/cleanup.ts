import context, { ElementCleanupCallback } from './context'

export function cleanup<T extends Element>(
	elementCleanupCallback: ElementCleanupCallback<T>
): void

export function cleanup(
	cb: ElementCleanupCallback
) {
	const ctx = context.peek()
	if (ctx) {
		ctx.pushElementCleanupCallback(cb)
	}
}
