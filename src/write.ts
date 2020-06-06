import context, { ElementDescriptor, CommentDescriptor, TextDescriptor, Context, AttrDescriptor, } from './context'

const selfclose = new Set([
	'area',
	'base',
	'br',
	'col',
	'command',
	'embed',
	'hr',
	'img',
	'input',
	'keygen',
	'link',
	'menuitem',
	'meta',
	'param',
	'source',
	'track',
	'wbr',
])

function writeElementAttrs(attrs: Record<string, string | String>) {
	const o = []
	for (const name in attrs) {
		const value = attrs[name]
		o.push(value ? `${name}="${escapeHTMLChars(value)}"` : name)
	}
	return o.join(' ')
}

function writeElement(descriptor: ElementDescriptor<any>) {
	const ctx = context.push(new ElementWriteContext(descriptor.tagName))
	ctx.render(descriptor.content)
	context.pop()
	return ctx.toString()
}

function escapeHTMLChars(inp: string | String) {
	return inp.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/&/g, '&amp;')
}

function writeText(descriptor: TextDescriptor) {
	return escapeHTMLChars(descriptor.content)
}

function writeComment(descriptor: CommentDescriptor) {
	return `<!-- ${escapeHTMLChars(descriptor.content)} --!>`
}

interface Child {
	key: any
	html: string
}

function getKey(descriptor: { key: any }, order: number) {
	return null === descriptor.key ? order : descriptor.key
}

function findIndex<T>(inp: ArrayLike<T>, cb: (it: T, idx: number, self: typeof inp) => any, offset = 0) {
	for (let i = offset; i < inp.length; i++) {
		if (cb(inp[i], i, inp)) return i
	}
	return -1
}

function updateElement(children: Child[], order: number, child: Child, descriptor: ElementDescriptor<any>) {
	child.html = writeElement(descriptor)
	if (child !== children[order]) {
		children.splice(order, 0, child)
	}
}

function createElement(children: Child[], order: number, key: any, descriptor: ElementDescriptor<any>) {
	const child: Child = {
		key,
		html: writeElement(descriptor),
	}
	children.splice(order, 0, child)
}

function updateComment(children: Child[], order: number, child: Child, descriptor: CommentDescriptor) {
	child.html = writeComment(descriptor)
	if (child !== children[order]) {
		children.splice(order, 0, child)
	}
}

function createComment(children: Child[], order: number, key: any, descriptor: CommentDescriptor) {
	const child: Child = {
		key,
		html: writeComment(descriptor),
	}
	children.splice(order, 0, child)
}


function updateText(children: Child[], order: number, child: Child, descriptor: TextDescriptor) {
	child.html = writeText(descriptor)
	if (child !== children[order]) {
		children.splice(order, 0, child)
	}
}

function createText(children: Child[], order: number, key: any, descriptor: TextDescriptor) {
	const child: Child = {
		key,
		html: writeText(descriptor),
	}
	children.splice(order, 0, child)
}


class WriteContext implements Context {
	order: number
	children: Child[]
	constructor() {
		this.order = 0
		this.children = []
	}
	pushComment(descriptor: CommentDescriptor) {
		const key = getKey(descriptor, this.order)
		const idx = findIndex(this.children, it => it.key === key, this.order)
		const child = ~idx ? this.children[idx] : null
		if (child) {
			updateComment(this.children, this.order, child, descriptor)
		} else {
			createComment(this.children, this.order, key, descriptor)
		}
		this.order++
		return null
	}
	pushElement(descriptor: ElementDescriptor) {
		const key = getKey(descriptor, this.order)
		const idx = findIndex(this.children, it => it.key === key, this.order)
		const child = ~idx ? this.children[idx] : null
		if (child) {
			updateElement(this.children, this.order, child, descriptor)
		} else {
			createElement(this.children, this.order, key, descriptor)
		}
		this.order++
		return null
	}
	pushElementAttr(descriptor: AttrDescriptor): void
	pushElementAttr() { }
	pushElementCreatedCallback() { }
	pushElementLinkingCallback() { }
	pushElementRemovedCallback() { }
	pushElementUpdatedCallback() { }
	pushElementCleanupCallback() { }
	pushText(descriptor: TextDescriptor) {
		const key = getKey(descriptor, this.order)
		const idx = findIndex(this.children, it => it.key === key, this.order)
		const child = ~idx ? this.children[idx] : null
		if (child) {
			updateText(this.children, this.order, child, descriptor)
		} else {
			createText(this.children, this.order, key, descriptor)
		}
		this.order++
		return null
	}

	render(content: (target: null) => void) {
		content(null)
	}
	toString() {
		return this.children.map(it => it.html).join('')
	}
}

class ElementWriteContext extends WriteContext {
	attrs: Record<string, string | String>
	tagName: string
	innerHTML?: string | String
	constructor(tagName: string) {
		super()
		this.attrs = {}
		this.tagName = tagName
	}
	render(content: ((target: null) => void) | string | String | null) {
		if (typeof content === 'function') {
			content(null)
		} else if (typeof content === 'string' || content instanceof String) {
			this.innerHTML = content
		}
	}
	pushElementAttr(descriptor: AttrDescriptor) {
		this.attrs[descriptor.name as string] = descriptor.value
	}
	toString() {
		const innerHTML = this.innerHTML ? this.innerHTML : this.children.map(it => it.html).join('')
		const a = writeElementAttrs(this.attrs)
		return innerHTML && !selfclose.has(this.tagName)
			? `<${this.tagName}${a.length ? ' ' + a : ''}>${innerHTML}</${this.tagName}>`
			: `<${this.tagName}${a.length ? ' ' + a : ''} />`
	}
}

export function write(content: (ref: null) => void) {
	const ctx = context.push(new WriteContext())
	ctx.render(content)
	context.pop()
	return ctx.toString()
}
