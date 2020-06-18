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
	const ctx = context.push(new ElementWriteContext(descriptor.namespaceURI, descriptor.tagName, descriptor.content))
	ctx.render()
	context.pop()
	return ctx.toString()
}

function escapeHTMLChars(inp: string | String) {
	return inp
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
}

function writeText(descriptor: TextDescriptor) {
	return escapeHTMLChars(descriptor.content)
}

function writeComment(descriptor: CommentDescriptor) {
	return `<!-- ${escapeHTMLChars(descriptor.content)} --!>`
}

class WriteContext implements Context {
	keys: Map<any, number>
	children: Record<number, string>
	readonly content: (ref: Element | null) => void
	constructor(content: (ref: Element | null) => void) {
		this.children = {}
		this.content = content
		this.keys = new Map()
	}
	get target() { return null }
	getDescriptorKey(descriptor: { key: any }) {
		return null == descriptor.key ? this.keys.size : descriptor.key
	}
	getKeyOrder(key: any) {
		if (!this.keys.has(key)) {
			this.keys.set(key, this.keys.size)
		}
		return this.keys.get(key)!
	}
	pushComment(descriptor: CommentDescriptor) {
		const key = this.getDescriptorKey(descriptor)
		const order = this.getKeyOrder(key)
		this.children[order] = writeComment(descriptor)
		return null
	}
	pushElement(descriptor: ElementDescriptor) {
		const key = this.getDescriptorKey(descriptor)
		const order = this.getKeyOrder(key)
		this.children[order] = writeElement(descriptor)
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
		const key = this.getDescriptorKey(descriptor)
		const order = this.getKeyOrder(key)
		this.children[order] = writeText(descriptor)
		return null
	}

	render() {
		this.content(null)
	}
	toString() {
		return Array.from(this.keys.values()).sort().map(order => this.children[order]).join('')
	}
}

function noop() { }

class ElementWriteContext extends WriteContext {
	attrs: Record<string, string | String>
	tagName: string
	namespaceURI: string | null
	innerHTML?: string | String
	constructor(namespaceURI: string | null, tagName: string, content: ((target: Element | null) => void) | string | String | null) {
		super(typeof content === 'function' ? content : noop)
		if (typeof content === 'string' || content instanceof String) {
			this.innerHTML = content
		}
		this.attrs = {}
		this.namespaceURI = namespaceURI
		this.tagName = tagName
	}
	render() {
		if (typeof this.innerHTML === 'undefined') {
			this.content(null)
			this.innerHTML = Array.from(this.keys.values()).sort().map(order => this.children[order]).join('')
		}
	}
	pushElementAttr(descriptor: AttrDescriptor) {
		this.attrs['http://www.w3.org/1999/xhtml' === this.namespaceURI || null == this.namespaceURI ? descriptor.name.toLowerCase() : descriptor.name] = descriptor.value
	}
	toString() {
		const innerHTML = this.innerHTML ? this.innerHTML : ''
		const a = writeElementAttrs(this.attrs)
		return innerHTML || !selfclose.has(this.tagName)
			? `<${this.tagName}${a.length ? ' ' + a : ''}>${innerHTML}</${this.tagName}>`
			: `<${this.tagName}${a.length ? ' ' + a : ''} />`
	}
}

export function write(content: (ref: Element | null) => void) {
	const ctx = context.push(new WriteContext(content))
	ctx.render()
	context.pop()
	return ctx.toString()
}
