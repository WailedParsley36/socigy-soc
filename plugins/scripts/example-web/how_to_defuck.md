# How to redefine the Rust auto-gen script

## Group parts

### Top Part

Take the first part of the generated script until ```export``` is found then the Top Part ends...

### Mid Part

This is the exports the output should look like this:

**Input:**

```js
export function function_name() {
    // ...
}
```

**Output:**

```js
this.functionName = function function_name() {
    // ...
}
```

### Last Part

### End

```js
getScopedImports() {
    const imports = {
        ...this.imports
    }

    // TOP PART - Helper functions
    // MID PART - 'Exports'
    // LAST PART - Imports 

    return imports
}
```

## Replace things

```wasm.``` replace with ```Socigy.loaded[id].exports.``` </br>
```socigy.``` replace with ```imports.```