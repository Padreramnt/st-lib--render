import context, { ElementDescriptor, TextDescriptor, CommentDescriptor, AttrDescriptor, ElementRemovedCallback, ElementCleanupCallback, ElementCreatedCallback, ElementUpdatedCallback, Context, ElementLinkingCallback, } from './context'


interface ElementCleanupCallbacksSet extends Set<ElementCleanupCallback<Node>> {
	__typename?: 'ElementCleanupCallbacksSet'
}
interface ElementRemovedCallbacksSet extends Set<ElementRemovedCallback<Node>> {
	__typename?: 'ElementRemovedCallbacksSet'
}
interface ElementCreatedCallbacksSet extends Set<ElementCreatedCallback<Node>> {
	__typename?: 'ElementCreatedCallbacksSet'
}
interface ElementUpdatedCallbacksSet extends Set<ElementUpdatedCallback<Node>> {
	__typename?: 'ElementUpdatedCallbacksSet'
}
interface ElementLinkingCallbacksSet extends Set<ElementLinkingCallback<Node>> {
	__typename?: 'ElementLinkingCallbacksSet'
}

const nodesKeyMap = new WeakMap<object, any>()
const elementsCleanupCallbacksSetMap = new WeakMap<object, ElementCleanupCallbacksSet>()
const elementsRemovedCallbacksSetMap = new WeakMap<object, ElementRemovedCallbacksSet>()

function getElementCleanupCallbacksSet(target: object) {
	if (!elementsCleanupCallbacksSetMap.has(target)) {
		elementsCleanupCallbacksSetMap.set(target, new Set())
	}
	return elementsCleanupCallbacksSetMap.get(target)!
}

function runElementCleanupCallbacks(target: Node, elementCleanupCallbacksSet: ElementCleanupCallbacksSet) {
	for (const callback of Array.from(elementCleanupCallbacksSet)) {
		try {
			callback(target)
		} catch (e) {
			console.error(e)
		}
		elementCleanupCallbacksSet.delete(callback)
	}
}

function runElementCreatedCallbacks(target: Element, elementCreatedCallbacksSet: ElementCreatedCallbacksSet) {
	const elementRemovedCallbacksSet: ElementRemovedCallbacksSet = new Set()
	for (const callback of Array.from(elementCreatedCallbacksSet)) {
		const removedCallback = callback(target)
		if (typeof removedCallback === 'function') elementRemovedCallbacksSet.add(removedCallback)
	}
	return elementRemovedCallbacksSet
}

function cleanup(target: Node) {
	const elementCleanupCallbacksSet = elementsCleanupCallbacksSetMap.get(target)
	if (elementCleanupCallbacksSet) runElementCleanupCallbacks(target, elementCleanupCallbacksSet)
}

export interface Renderer {
	createElement(tagName: string, options?: ElementCreationOptions): Element
	createElementNS(namespaceURI: string | null, tagName: string, options?: ElementCreationOptions): Element
	createTextNode(data: string): Text
	createComment(data: string): Comment
	createAttribute(localName: string): Attr
	createAttributeNS(namespace: string | null, qualifiedName: string): Attr
}

function updateText(
	target: Element,
	order: number,
	descriptor: TextDescriptor,
	node: Text,
) {
	if (node.textContent !== descriptor.content) {
		node.textContent = descriptor.content
	}
	if (target.childNodes[order] !== node) {
		target.insertBefore(node, target.childNodes[order])
	}
	return node
}

function updateComment(
	target: Element,
	order: number,
	descriptor: CommentDescriptor,
	node: Comment,
) {
	if (node.textContent !== descriptor.content) {
		node.textContent = descriptor.content
	}
	if (target.childNodes[order] !== node) {
		target.insertBefore(node, target.childNodes[order])
	}
	return node
}

function createComment(
	target: Element,
	order: number,
	descriptor: CommentDescriptor,
	key: any,
	renderer: Renderer,
) {
	const node = renderer.createComment(descriptor.content)
	target.insertBefore(node, target.childNodes[order])
	nodesKeyMap.set(node, key)
	return node
}

function createText(
	target: Element,
	order: number,
	descriptor: TextDescriptor,
	key: any,
	renderer: Renderer,
) {
	const node = renderer.createTextNode(descriptor.content)
	target.insertBefore(node, target.childNodes[order])
	nodesKeyMap.set(node, key)
	return node
}

function renderContent(node: Element, content: ((ref: any) => (() => void) | void) | string | String | false | null | undefined, renderer: Renderer) {
	if (typeof content === 'function') {
		render(node, node => {
			const unref = content(node)
			if (typeof unref === 'function') {
				getElementCleanupCallbacksSet(node).add(unref)
			}
		}, renderer)
	} else if (typeof content === 'string' || content instanceof String) {
		node.innerHTML = String(content)
	}
}

function createElement(
	target: Element,
	order: number,
	descriptor: ElementDescriptor<any>,
	key: any,
	renderer: Renderer,
) {
	const node = descriptor.namespaceURI ? renderer.createElementNS(descriptor.namespaceURI, descriptor.tagName) : renderer.createElement(descriptor.tagName)
	renderContent(node, descriptor.content, renderer)
	target.insertBefore(node, target.childNodes[order])
	nodesKeyMap.set(node, key)
	return node
}

function replaceElement(
	target: Element,
	order: number,
	oldNode: Element,
	descriptor: ElementDescriptor<any>,
	key: any,
	renderer: Renderer,
) {
	removeNode(oldNode)
	const newNode = descriptor.namespaceURI ? renderer.createElementNS(descriptor.namespaceURI, descriptor.tagName) : renderer.createElement(descriptor.tagName)
	renderContent(newNode, descriptor.content, renderer)
	if (target.childNodes[order] === oldNode) {
		target.replaceChild(newNode, oldNode)
	} else {
		target.removeChild(oldNode)
		target.insertBefore(newNode, target.childNodes[order])
	}
	nodesKeyMap.set(newNode, key)
	return newNode
}

function updateElement(
	target: Element,
	order: number,
	descriptor: ElementDescriptor<any>,
	node: Element,
	renderer: Renderer,
) {
	cleanup(node)
	const { content } = descriptor
	renderContent(node, content, renderer)
	if (target.childNodes[order] !== node) {
		target.insertBefore(node, target.childNodes[order])
	}
	return node
}

function runElementRemovedCallbacks(target: Node, elementRemovedCallbacksSet: ElementRemovedCallbacksSet) {
	for (const callback of Array.from(elementRemovedCallbacksSet)) {
		try {
			callback(target)
		} catch (e) {
			console.error(e)
		}
	}
}

function runElementUpdatedCallbacks(target: Element, elementUpdatedCallbacksSet: ElementUpdatedCallbacksSet) {
	const elementCleanupCallbacksSet: ElementCleanupCallbacksSet = new Set()
	for (const callback of Array.from(elementUpdatedCallbacksSet)) {
		try {
			const elementCleanupCallback = callback(target)
			if (typeof elementCleanupCallback === 'function') elementCleanupCallbacksSet.add(elementCleanupCallback)
		} catch (e) {
			console.error(e)
		}
	}
	return elementCleanupCallbacksSet
}

function removeNode(target: Node) {
	nodesKeyMap.delete(target)
	cleanup(target)
	const elementRemovedCallbacksSet = elementsRemovedCallbacksSetMap.get(target)
	if (elementRemovedCallbacksSet) {
		runElementRemovedCallbacks(target, elementRemovedCallbacksSet)
		elementsRemovedCallbacksSetMap.delete(target)
	}
	for (const subChildNode of target.childNodes) {
		removeNode(subChildNode)
	}
}

function removeChildNode(target: Node, childNode: ChildNode) {
	removeNode(childNode)
	target.removeChild(childNode)
}

function findNode<T>(
	list: ArrayLike<ChildNode>,
	key: any,
	typeOf: (it: unknown) => it is T,
	offset: number = 0,
) {
	let fallback: T | null = null
	for (let i = 0; i < list.length; i++) {
		const it = list[(offset + i) % list.length]
		if (typeOf(it)) {
			if (nodesKeyMap.get(it) === key) {
				return it
			} else if (!nodesKeyMap.has(it) && !fallback) {
				fallback = it
				nodesKeyMap.set(it, key)
			}
		}
	}
	return fallback
}

function isComment(it: unknown): it is Comment {
	return it instanceof Comment
}

function isText(it: unknown): it is Text {
	return it instanceof Text
}

function isElement(it: unknown): it is Element {
	return it instanceof Element
}

class RenderContext implements Context {
	isUpdated: boolean
	elementCleanupCallbacksSet: ElementCleanupCallbacksSet
	elementCreatedCallbacksSet: ElementCreatedCallbacksSet
	elementUpdatedCallbacksSet: ElementUpdatedCallbacksSet
	elementLinkingCallbacksSet: ElementLinkingCallbacksSet
	willDeleteAttributes: Set<string>
	keys: Map<any, number>
	target: Element
	renderer: Renderer
	readonly content: (target: Element | null) => void
	constructor(target: Element, content: (target: Element | null) => void, renderer: Renderer) {
		this.target = target
		this.content = content
		this.renderer = renderer
		this.isUpdated = elementsRemovedCallbacksSetMap.has(target)
		this.elementCleanupCallbacksSet = getElementCleanupCallbacksSet(target)
		this.elementCreatedCallbacksSet = new Set()
		this.elementUpdatedCallbacksSet = new Set()
		this.elementLinkingCallbacksSet = new Set()
		this.willDeleteAttributes = new Set(target.getAttributeNames())
		this.keys = new Map()
		runElementCleanupCallbacks(target, this.elementCleanupCallbacksSet)
	}
	getDescriptorKey(descriptor: { key: any }) {
		return null == descriptor.key ? this.keys.size : descriptor.key
	}
	getKeyOrder(key: any) {
		if (!this.keys.has(key)) {
			this.keys.set(key, this.keys.size)
		}
		return this.keys.get(key)!
	}
	pushComment(descriptor: CommentDescriptor): Comment | null {
		if (!descriptor.content) return null
		const key = this.getDescriptorKey(descriptor)
		const order = this.getKeyOrder(key)
		const node = findNode(
			this.target.childNodes,
			key,
			isComment,
			order,
		)
		const o = node
			? updateComment(this.target, order, descriptor, node)
			: createComment(this.target, order, descriptor, key, this.renderer)
		return o
	}
	pushElement(descriptor: ElementDescriptor<Element>): Element | null {
		const key = this.getDescriptorKey(descriptor)
		const order = this.getKeyOrder(key)
		const tagName = null == descriptor.namespaceURI || 'http://www.w3.org/1999/xhtml' === descriptor.namespaceURI
			? descriptor.tagName.toUpperCase()
			: descriptor.tagName
		const node = findNode(
			this.target.childNodes,
			key,
			isElement,
			order,
		)
		const o = node
			? tagName === node.tagName
				? updateElement(this.target, order, descriptor, node, this.renderer)
				: replaceElement(this.target, order, node, descriptor, key, this.renderer)
			: createElement(this.target, order, descriptor, key, this.renderer)
		return o
	}
	pushElementAttr(descriptor: AttrDescriptor) {
		const attrName = 'http://www.w3.org/1999/xhtml' === this.target.namespaceURI || null == this.target.namespaceURI ? descriptor.name.toLowerCase() : descriptor.name
		this.willDeleteAttributes.delete(attrName)
		const value = this.target.getAttributeNS(descriptor.namespaceURI, attrName)
		if (value !== descriptor.value) {
			this.target.setAttributeNS(descriptor.namespaceURI, attrName, descriptor.value)
		}
	}
	pushElementCleanupCallback(callback: ElementCleanupCallback<Node>): void {
		this.elementCleanupCallbacksSet.add(callback)
	}
	pushElementCreatedCallback(callback: ElementCreatedCallback<Node>): void {
		this.elementCreatedCallbacksSet.add(callback)
	}
	pushElementLinkingCallback(callback: ElementLinkingCallback<Node>): void {
		if (this.elementLinkingCallbacksSet.has(callback)) return
		this.elementLinkingCallbacksSet.add(callback)
		const cleanup = callback(this.target)
		if (typeof cleanup === 'function') this.elementCleanupCallbacksSet.add(cleanup)
	}
	pushElementRemovedCallback(callback: ElementRemovedCallback<Node>): void {
		this.pushElementCreatedCallback(() => callback)
	}
	pushElementUpdatedCallback(callback: ElementUpdatedCallback<Node>): void {
		this.elementUpdatedCallbacksSet.add(callback)
	}
	pushText(descriptor: TextDescriptor): Text | null {
		if (!descriptor.content) return null
		const key = this.getDescriptorKey(descriptor)
		const order = this.getKeyOrder(key)
		const node = findNode(this.target.childNodes, key, isText, order)
		const o = node
			? updateText(this.target, order, descriptor, node)
			: createText(this.target, order, descriptor, key, this.renderer)
		return o
	}
	updateAttributes() {
		for (const name of this.willDeleteAttributes) {
			this.target.removeAttribute(name)
		}
	}
	updateChildNodes() {
		while (this.keys.size < this.target.childNodes.length) {
			removeChildNode(this.target, this.target.childNodes[this.keys.size])
		}
	}
	updateCallbacks() {
		if (this.isUpdated) {
			for (const elementCleanupCallback of runElementUpdatedCallbacks(this.target, this.elementUpdatedCallbacksSet)) {
				this.elementCleanupCallbacksSet.add(elementCleanupCallback)
			}
		} else {
			elementsRemovedCallbacksSetMap.set(this.target, runElementCreatedCallbacks(this.target, this.elementCreatedCallbacksSet))
		}
	}
	render() {
		this.content(this.target)
		this.updateAttributes()
		this.updateChildNodes()
		this.updateCallbacks()
	}
}

export function render<T extends Element>(
	target: T | null,
	content: (ref: T) => void,
	renderer?: Renderer,
): void
export function render(
	target: Element | null,
	content: (ref: Element | null) => void,
	renderer: Renderer = document,
) {
	if (null == target) return
	context.push(new RenderContext(target, content, renderer)).render()
	context.pop()
}
