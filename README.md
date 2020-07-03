# Lightweight HTML rendering library.

> ESNext module, please use [webpack](https://webpack.js.org/) / [rollup](https://rollupjs.org/guide/en/) / [parcel](https://parceljs.org/) / etc.


## Additional materials

1. [@st-lib/render-html](https://www.npmjs.com/package/@st-lib/render-html),
2. [@st-lib/render-svg](https://www.npmjs.com/package/@st-lib/render-svg),
3. [@st-lib/render-mathml](https://www.npmjs.com/package/@st-lib/render-mathml),
4. [@st-lib/render-events](https://www.npmjs.com/package/@st-lib/render-events),
4. [@st-lib/render-with-state](https://www.npmjs.com/package/@st-lib/render-with-state).

## Concepts.

1. The library uses a context-oriented approach to describing the structure of HTML.
2. The purpose of the library is NOT to work with the state of the application, use third-party libraries for this.
3. The library does not create intermediate representations of the document structure (Virtual DOM), but instead updates the document directly.

## Basic usage.

Use `render` function for render to document.

```ts
export interface Renderer {
    createElement(tagName: string, options?: ElementCreationOptions): Element;
    createElementNS(namespaceURI: string | null, tagName: string, options?: ElementCreationOptions): Element;
    createTextNode(data: string): Text;
    createComment(data: string): Comment;
    createAttribute(localName: string): Attr;
    createAttributeNS(namespace: string | null, qualifiedName: string): Attr;
}
export declare function render<T extends Element>(target: T | null, content: (ref: T) => void, renderer?: Renderer): void;
```

### Element

Create element node with specified key, tag name, namespace URI, creation options and content rendering function or raw HTML string

> UPDATE: added customized built-in elements support.

```ts
export declare function element<T extends Element>(key: any, tag: string | [string, (string | null)?, (ElementCreationOptions | null)?], content?: ElementContentDescriptor<T> | false | null | undefined): T | null;
```

___Key___: accepts any type: `number`, `string`, `symbol` or `object`. Passing `null` or `undefined` as key will be replaced with current key order.

___Tag___: accepts `tagName: string` or turple` [tagName: string, namespaceURI?: string | null, options?: ElementCreationOptions | null] `

___Content___: content rendering function `(ref: T extends Element) => void` or raw HTML string

Returns the created element node or `null` if the node is not created.

#### Example:

```ts
import { render, element } from '@st-lib/render'

window.onload = () => {
	render(document.body, () => {
		element(null, 'header')
		element(null, 'main', () => {
			element(null, 'article')
			element(null, 'article')
			element(null, 'article')
			element(null, 'article')
			// svg support
			element(null, ['svg', 'http://www.w3.org/2000/svg'], () => {
				element(null, ['a', 'http://www.w3.org/2000/svg'])
			})
			// custom element
			element(null, 'custom-element')
			// cusomized built-in
			element(null, ['form', null, { is: 'custom-form' }])
		})
		element(null, 'footer')
		//
	})
}

/*
<body>
	<header></header>
	<main>
		<article></article>
		<article></article>
		<article></article>
		<article></article>
		<svg>
			<a />
		</svg>
		<custom-element></custom-element>
		<form is='custom-form'></form>
	</main>
	<footer></footer>
</body>
*/
```

### Attributes

Update current rendering element attributes

```ts
// Setting single attribute
export declare function attr(name: string, value: OptionalAttrValue, namespaceURI?: string | null): void | null;
```

```ts
// Setting several attributes in one operation
export declare type AttrsMapEntry = AttrValue | [OptionalAttrValue, (string | null)?];
export declare type OptionalAttrMapEntry = AttrsMapEntry | false | null | undefined;
export declare type AttrsMap = Record<string, OptionalAttrMapEntry>;
export declare function attrs<T extends AttrsMap>(inp: T): void;
```

> Setting several attributes in one operation has corresponding optimizations.

#### Example:

```ts
import { render, element, text, attr, attrs } from '@st-lib/render'

window.onload = () => {
	render(document.body, () => {
		element(null, 'form', () => {
			// set all attributes with one operation
			attrs({
				action: '/some/url',
				method: 'post',
				enctype: 'multipart/form-data',
			})
			element(null, 'input', () => {
				// make input required
				attr('required', '') // only string, number and "falselike types" allowed
			})
			element(null, 'button', () => {
				text(null, 'submit')
			})
		})
	})
}

/*
<body>
	<form action="/some/url" method="post" enctype="multipart/form-data">
		<input required />
		<button>submit</button>
	</form>
</body>
*/
```

### Text

Create text node with specified key and string or number value.

```ts
export declare function text(key: any, value: OptionalTextValue): Text | null;
```

___Key___: accepts any type: `number`, `string`, `symbol` or `object`. Passing `null` or `undefined` as key will be replaced with current call order.

___Value___: accepts `string` or `number`. Passing `false`, `null` or `undefined` does not emit text node.

Returns the created text node or `null` if the node is not created.

> Passing `NaN` as value will emit console warning.

#### Example:

```ts
import { render, element, text } from '@st-lib/render'

window.onload = () => {
	render(document.body, () => {
		element(null, 'header')
		element(null, 'main', () => {
			element(null, 'article', () => {
				text(null, 'Lorem ipsum dolor sit amet.')
			})
			element(null, 'article', () => {
				text(null, 'Lorem ipsum dolor sit amet.')
			})
			element(null, 'article', () => {
				text(null, 'Lorem ipsum dolor sit amet.')
			})
			element(null, 'article', () => {
				text(null, 'Lorem ipsum dolor sit amet.')
			})
		})
		element(null, 'footer')
	})
}

/*
<body>
	<header></header>
	<main>
		<article>Lorem ipsum dolor sit amet.</article>
		<article>Lorem ipsum dolor sit amet.</article>
		<article>Lorem ipsum dolor sit amet.</article>
		<article>Lorem ipsum dolor sit amet.</article>
	</main>
	<footer></footer>
</body>
*/
```

> Normalization of text nodes is not supported! Use string interpolation.

```ts
import { render, text } from '@st-lib/render'

window.onload = () => {
	render(document.body, () => {
		// SSR invalid
		const t1 = text(null, 'Lorem ipsum dolor sit amet,')
		const t2 = text(null, ' consectetur adipiscing elit. Vivamus ac.')
		console.log(t1 !== t2) // true
		console.log(t1.textContent === 'Lorem ipsum dolor sit amet,') // true
		console.log(t2.textContent === ' consectetur adipiscing elit. Vivamus ac.') // true
	})
}

/*
<body>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vivamus ac.</body>
*/
```

### Comment

Create comment node with specified key and string or number value.

```ts
export declare function comment(key: any, value: OptionalCommentValue): Comment | null | undefined;
```

___Key___: accepts any type: `number`, `string`, `symbol` or `object`. Passing `null` or `undefined` as key will be replaced with current call order.

___Value___: accepts `string` or `number`. Passing `false`, `null` or `undefined` does not emit comment node.

Returns the created comment node or `null` if the node is not created.

> Passing `NaN` as value will emit console warning.

#### Example:
```ts
import { render, comment } from '@st-lib/render'

window.onload = () => {
	render(document.body, () => {
		// <!-- creates comment node --!>
		comment(null, 'creates comment node')
	})
}
```

## Lifecycle hooks

> All lifecycle hooks work in client side rendering, after render stage.

### Created

Called after new element created or used existing sililar element (with same tag name and namespase URI).

```ts
export declare function created<T extends Element>(elementCreatedCallback: ElementCreatedCallback<T>): void;
```

Returned function used as `elementRemovedCallback`.

#### Example:

```ts
import { render, element, created } from '@st-lib/render'
window.onload = () => {
	render(document.body, () => {
		element(null, 'div', divElement => {
			created(createdElement => {
				console.log('element "div" created', createdElement)
				return removedElement => {
					console.log('element "div" removed', removedElement, divElement === createdElement && divElement === removedElement /* true */)
				}
			})
		})
	})
}
```

### Updated

Called when an element is rendered again.

```ts
export declare function updated<T extends Element>(elementUpdatedCallback: ElementUpdatedCallback<T>): void;
```

Returned function used as `elementCleanupCallback`

#### Example:

```ts
import { render, element, updated } from '@st-lib/render'

function App() {
	element(null, 'div', divElement => {
		updated(updatedElement => {
			console.log('element has beed updated', updatedElement)
			return cleanupElement => {
				console.log('cleanup', cleanupElement, divElement === updatedElement && divElement === cleanupElement /* true */)
			}
		})
	})
}

window.onload = () => {
	// no console output
	render(document.body, App)
	setTimeout(() => {
		// emits console output
		render(document.body, App)
	})
}
```

### Removed

Called before an element will be removed from document. See `created`

```ts
export declare function removed<T extends Element>(elementRemovedCallback: ElementRemovedCallback<T>): void;
```

#### Example:

```ts
import { render, element, removed } from '@st-lib/render'

function elementRemovedCallback() {
	console.log('removed')
}

window.onload = () => {
	render(document.body, () => {
		element(0, 'div', divElement => {
			removed(elementRemovedCallback) // same as created(() => elementRemovedCallback)
		})
		element(0, 'span') // replace element <0.div> with <0.span>
	})
}
```

```ts
import { render, element, created, removed } from '@st-lib/render'

function elementRemovedCallback() {
	console.log('will be called once')
}

window.onload = () => {
	render(document.body, () => {
		element(null, 'div', divElement => {
			created(() => elementRemovedCallback)
			removed(elementRemovedCallback)
		})
	})
}
```

## Render stage hooks

### Linking

Called instantly during rendering.

Returned function used as `elementCleanupCallback`.

```ts
export declare function linking<T extends Element>(elementReferenceCallback: ElementLinkCallback<T>): void;
```

#### Example:

```ts
import { render, element, linking } from '@st-lib/render'

window.onload = () => {
	render(document.body, () => {
		element(null, 'button', () => {
			linking(buttonElement => {
				function onClickListener(e) {
					console.log('click', e)
				}
				buttonElement.addEventListener('click', onClickListener, true)
				return () => {
					buttonElement.removeEventListener('click', onClickListener, true)
				}
			})
		})
	})
}
```

### Cleanup

Called every time before rendering. See `linking` or `update`.

```ts
export declare function cleanup<T extends Element>(elementCleanupCallback: ElementCleanupCallback<T>): void;
```


## SSR (Server Side Rendering)

Use `write` function for render to string.

```ts
export declare function write(content: (ref: null) => void): string;
```

#### Example:

```ts
// App.js
import { element, text } from '@st-lib/render'

function onClickListener(e) {
	console.log('click', e)
}

export default function App() {
	element(null, 'header')
	element(null, 'main', () => {
		element(null, 'article', () => {
			text(null, 'Lorem ipsum dolor sit amet.')
		})
		element(null, 'article', () => {
			text(null, 'Lorem ipsum dolor sit amet.')
		})
		element(null, 'article', () => {
			text(null, 'Lorem ipsum dolor sit amet.')
		})
		element(null, 'article', () => {
			text(null, 'Lorem ipsum dolor sit amet.')
		})
		element(null, 'button', () => {
			linking(btn => {
				btn.addEventListener('click', onClickListener, true)
				return () => btn.removeEventListener('click', onClickListener, true)
			})
		})
	})
	element(null, 'footer')
}
```

```ts
// client.js
import { render } from '@st-lib/render'
import App from './App'

window.onload = () => {
	render(document.body, App)
}
```

```ts
// server.js
import { write } from '@st-lib/render'
import { createServer } from 'http'
import App from './App'

const server = createServer((_, res) => {
	res.setHeader('Content-Type', 'text/html')
	res.write(`
<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>@st-lib/render SSR example</title>
</head>
<body>${write(App)}<script src="/client.js"></script></body>
</html>`)
	res.end()
})

server.listen(3000)
```
