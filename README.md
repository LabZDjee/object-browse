# Object Browse and Make Sub Object

Purpose of this ECMAScript library is to deeply examine an object through processor  (exported function `objectBrowse`) which calls a custom generator at each breakdown step of this object. Purpose of this library is also to provide a function which internally uses such a generator to make/build a sub-object from an object (done by exported function `makeSubObjectFrom`). This sub-object clones all sub-objects it is directed to copy

Making a sub-object with `makeSubObjectFrom` is indeed the main drive for this library. However, `objectBrowse` processor is exposed for possible purposes where it could help in deep-examination of an object

# `objectBrowse ` 

Prototype: `objectBrowse (object, processor, initialValue)`with:

- `object`: the object (or array) to deeply examine extracting its non-inherited properties and those of sub-objects it contains and feeds  a generator function with each step of this process
- `processor`: a [*generator* function](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/function*) which receives information at *each step* through its `yield` result and should itself return a result in the `yield` call which will be eventually passed in the `objectBrowse` result. What this generator gets at every stage is an object with the following properties:
  - `prop`: the examined property, a string or a number (or `null` at level 0, see details below)
  - `value`: value corresponding to `prop` in the examined object. This value is a *reference* to the sub-object is case this sub-object is an array or an object
  - `type`: an integer, which is 0 if value a terminal value, 1 if it is a sub-object, 2 if it is an array
  - `level`: an integer which starts from 0 and increases when process goes deeper into sub-objects and arrays. At level 0, prop is always null and `type` can only be 2 or 1, meaning associated `value` is an array or not
- `initialValue`: an initial parameter which will passed to `processor`

What `processor` is supposed to do, is to provide an object literal through `yield` with the following properties:

- `result`: connected to what `objectBrowse` is supposed to finally return
- `stopAtThisLevel`: if and only if  `tr`ue will instruct `objectBrowse` to stop nesting any deeper from the current `prop`

Returned  value by `objectBrowse` is a literal with the following properties:

- `result`: what the processor returned in its last `yield` as prop `result`
- `completed`: `true` generally or `false` if the processor generator function called a `return` instead of a `yield` what of course aborts the entire examination

When  processor function calls a `return`, it does not have to provide a literal (as it is for `yield`): what is returns will be directly copied in the `result` property of the returned value of `objectBrowse`

## Example

As the description above is a little bit terse, a small example could help clarify things. Suppose we have:

```javascript
const object = {
  level1_a: "starting...",
  level1_b: { level2_a: 21, level2_b: 22 },
  level1_c: [NaN, 1 / 0, 42, { pi: Math.PI, doublePi: Math.PI * 2 }],
  level1_d: "...finished",
};
```

And a plain generator function as `processor`:

```javascript
reflectInArray = function* () {
  const result = [];
  while (true) {
    result.push(yield { result });
  }
};
```

which piles every information passed to it into an array. Then calling:

```javascript
const r = objectBrowse(object, reflectInArray);
```

will produce a result equivalent to this:

```javascript
{ completed: true,
  result; [
  { prop: null, value: object, type: 1, level: 0 },
  { prop: "level1_a", value: "starting...", type: 0, level: 1 },
  { prop: "level1_b", value: object.level1_b, type: 1, level: 1 },
  { prop: "level2_a", value: 21, type: 0, level: 2 },
  { prop: "level2_b", value: 22, type: 0, level: 2 },
  { prop: "level1_c", value: object.level1_c, type: 2, level: 1 },
  { prop: 0, value: NaN, type: 0, level: 2 },
  { prop: 1, value: Infinity, type: 0, level: 2 },
  { prop: 2, value: 42, type: 0, level: 2 },
  { prop: 3, value: object.level1_c[3], type: 1, level: 2 },
  { prop: "pi", value: 3.141592653589793, type: 0, level: 3 },
  { prop: "doublePi", value: 6.283185307179586, type: 0, level: 3 },
  { prop: "level1_d", value: "...finished", type: 0, level: 1 }, 
 ];
}
```



# `makeSubObjectFrom`

Prototype: `makeSubObjectFrom(pattern, source)` with:

- `pattern`: an object literal whose properties, sub arrays, and sub-objects serve as a *pattern* to define which sub-structure of the object to copy by cloning we are interested in. Values of this pattern are ignored
- `source`: the source object from which values will be copied

Values from source cover [every JSON type](https://en.wikipedia.org/wiki/JSON#Data_types_and_syntax) and more. In this it supersedes it with regular expressions, functions, etc. However test better be made for special types as described in the [Structured Clone Algorithm](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Structured_clone_algorithm) 

If some property in `pattern` is not found in `source`, the function with throw a generic error with a message explicating what property was missing

## Example

```javascript
const pattern = {
  a: null,
  b: { bb: null, bc: null, bd: { bde: null, bdf: null } },
  c: [null, { c1d: null, c1e: null }],
  d: null,
};

const source = {
  a: "a",
  b: { bb: "bb", bc: NaN, bd: { bde: "bde", bdf: "bdf", ignore: 0 }, ignore: 0 },
  c: [3, { c1d: 31, c1e: 32, ignore1: 33, ignore2: 34 }],
  d: "d",
  ignore: "e",
};

const result = makeSubObjectFrom(pattern, source);
```

will produce the following result:

```javascript
{ completed: true, 
  result: {
   a: "a",
   b: { bb: "bb", bc: NaN, bd: { bde: "bde", bdf: "bdf" } },
   c: [3, { c1d: 31, c1e: 32 }],
   d: "d",
  }
}
```

