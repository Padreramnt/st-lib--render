import context, { ElementDescriptor, CommentDescriptor, TextDescriptor, Context, AttrDescriptor, ElementContentDescriptor, } from './context'

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
	const ctx = context.push(new ElementWriteContext(descriptor.namespaceURI, descriptor.tagName, descriptor.options))
	ctx.render(descriptor.content)
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
	return `<!-- ${escapeHTMLChars(descriptor.content)} -->`
}

class WriteContext implements Context {
	keys: Map<any, number>
	children: Record<number, string>
	constructor() {
		this.children = {}
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

	render(content: (ref: Element | null) => void) {
		content(null)
	}
	toString() {
		return Array.from(this.keys.values()).sort().map(order => this.children[order]).join('')
	}
}

class ElementWriteContext extends WriteContext {
	attrs: Record<string, string | String>
	tagName: string
	namespaceURI: string | null
	innerHTML?: string | String
	options: ElementCreationOptions | null
	constructor(
		namespaceURI: string | null,
		tagName: string,
		options: ElementCreationOptions | null
	) {
		super()
		this.attrs = {}
		this.namespaceURI = namespaceURI
		this.tagName = tagName
		this.options = options
	}
	render(content: ElementContentDescriptor<any> | null) {
		if (typeof content === 'function') {
			content(null)
			this.innerHTML = Array.from(this.keys.values()).sort().map(order => this.children[order]).join('')
		} else {
			this.innerHTML = null != content ? content : ''
		}
	}
	pushElementAttr(descriptor: AttrDescriptor) {
		const trimmed = descriptor.name.trim()
		const normalized = trimmed.toLowerCase()
		if ('is' === normalized) return
		const key = 'http://www.w3.org/1999/xhtml' === this.namespaceURI || null == this.namespaceURI ? normalized : trimmed
		if (false === descriptor.value) {
			delete this.attrs[key]
		} else {
			this.attrs[key] = descriptor.value
		}
	}
	toString() {
		const is = this.options && this.options.is ? ` is="${escapeHTMLChars(this.options.is)}"` : ''
		const a = writeElementAttrs(this.attrs)
		return this.innerHTML || !selfclose.has(this.tagName)
			? `<${this.tagName}${is}${a.length ? ' ' + a : ''}>${this.innerHTML}</${this.tagName}>`
			: `<${this.tagName}${is}${a.length ? ' ' + a : ''} />`
	}
}

export function write(content: (ref: Element | null) => void) {
	const ctx = context.push(new WriteContext())
	ctx.render(content)
	context.pop()
	return ctx.toString()
}
