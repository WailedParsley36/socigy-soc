# Parsing CheatSheet

```js
<>
    <View>
    <Text className="text-foreground font-inter-regular">Ja jsem dalsi text</Text>
    </View>
    <External id="1234-1234" props={ myProp: 123, anotherProp: "StringProp" } />
    <Text>Jsem Text</Text>

    <TextInput onTextChange={move |e| {
        info!("The text changed {:#?}", e);
    }} />
</>
```

## Processed instructions

### Fragment

```rust
// Start
Punct { ch: '<', spacing: Joint }
Punct { ch: '>', spacing: Alone }

// End
Punct { ch: '<', spacing: Joint }
Punct { ch: '/', spacing: Joint }
Punct { ch: '>', spacing: Alone }
```

### JSX Element

Normal Closing elements `<View></View>`

```rust
// Start
Punct { ch: '<', spacing: Alone }
Ident { ident: "View" }
Punct { ch: '>', spacing: Alone }

// End
Punct { ch: '<', spacing: Joint }
Punct { ch: '/', spacing: Alone }
Ident { ident: "View" }
Punct { ch: '>', spacing: Alone }
```

Slef Closing elements `<View />`

```rust
// Start
Punct { ch: '<', spacing: Alone }
Ident { ident: "View" }

// #{attributes}

// End
Punct { ch: '/', spacing: Joint }
Punct { ch: '>', spacing: Alone }
```

Opening tag with attributes `<Text className="">`

```rust
// Opening
Punct { ch: '<', spacing: Alone }
Ident { ident: "Text" }

// First attribute
Ident { ident: "className" }
Punct { ch: '=', spacing: Alone }
Literal { kind: Str, symbol: "text-foreground font-inter-regular" }

// Another attribute with hashmap object
Ident { ident: "style" }
Punct { ch: '=', spacing: Alone }
Group { delimiter: Brace, stream:
    TokenStream [
        // One prop in the HashMap
        Ident { ident: "backgroundColor" }
        Punct { ch: ":", spacing: Alone }
        Literal { kind: Integer, symbol: "123" }

        // Delimiter
        Punct { ch: ",", spacing: Alone }

        // Another prop
        Ident { ident: "color" }
        Punct { ch: ":", spacing: Alone }
        Literal { kind: Str, symbol: "red" }
    ]
}

// End
Punct { ch: '>', spacing: Alone }
```

String value inside element `<Text>This is a String Value</Text>`

```rust
// Element start
...
Punct { ch: '>', spacing: Alone }

// Inner
Ident { ident: "This" }
Ident { ident: "is" }
Ident { ident: "a" }
Ident { ident: "String" }
Ident { ident: "Value" }

// Element End
Punct { ch: '<', spacing: Joint }
...
```

The string values inside can be mixed with JSX Element

```html
<Text>Hi <Text>I am bold text</Text></Text>
```

#### Event handlers

Input

```html
<TextInput onTextChange={move |e| { info!("The text changed {:#?}", e); }} />
```

Output

```rust
// Element start
...

// Attributes
Ident { ident: "onTextChange" }
Punct { ch: '=', spacing: Alone }
Group { delimiter: Brace, stream:
    TokenStream [
        Ident { ident: "move" }

        // Sugar
        ...

        Group { delimiter: Brace, stream:
            TokenStream [
                // Event method after `move |e| {`
                ...
            ]
            // End of the `move |e| {}`
        }

        // End of the whole passage
    ]
}

// Close opening tag
Punct { ch: '/', spacing: Joint }
Punct { ch: '>', spacing: Alone }
```

## Raw

```rust
[
    Punct {
        ch: '<',
        spacing: Joint,
        span: #0 bytes(2254..2255),
    },
    Punct {
        ch: '>',
        spacing: Alone,
        span: #0 bytes(2255..2256),
    },
    Punct {
        ch: '<',
        spacing: Alone,
        span: #0 bytes(2273..2274),
    },
    Ident {
        ident: "View",
        span: #0 bytes(2274..2278),
    },
    Punct {
        ch: '>',
        spacing: Alone,
        span: #0 bytes(2278..2279),
    },
    Punct {
        ch: '<',
        spacing: Alone,
        span: #0 bytes(2300..2301),
    },
    Ident {
        ident: "Text",
        span: #0 bytes(2301..2305),
    },
    Ident {
        ident: "className",
        span: #0 bytes(2306..2315),
    },
    Punct {
        ch: '=',
        spacing: Alone,
        span: #0 bytes(2315..2316),
    },
    Literal {
        kind: Str,
        symbol: "text-foreground font-inter-regular",
        suffix: None,
        span: #0 bytes(2316..2352),
    },
    Punct {
        ch: '>',
        spacing: Alone,
        span: #0 bytes(2352..2353),
    },
    Ident {
        ident: "Ja",
        span: #0 bytes(2353..2355),
    },
    Ident {
        ident: "jsem",
        span: #0 bytes(2356..2360),
    },
    Ident {
        ident: "dalsi",
        span: #0 bytes(2361..2366),
    },
    Ident {
        ident: "text",
        span: #0 bytes(2367..2371),
    },
    Punct {
        ch: '<',
        spacing: Joint,
        span: #0 bytes(2371..2372),
    },
    Punct {
        ch: '/',
        spacing: Alone,
        span: #0 bytes(2372..2373),
    },
    Ident {
        ident: "Text",
        span: #0 bytes(2373..2377),
    },
    Punct {
        ch: '>',
        spacing: Alone,
        span: #0 bytes(2377..2378),
    },
    Punct {
        ch: '<',
        spacing: Joint,
        span: #0 bytes(2395..2396),
    },
    Punct {
        ch: '/',
        spacing: Alone,
        span: #0 bytes(2396..2397),
    },
    Ident {
        ident: "View",
        span: #0 bytes(2397..2401),
    },
    Punct {
        ch: '>',
        spacing: Alone,
        span: #0 bytes(2401..2402),
    },
    Punct {
        ch: '<',
        spacing: Alone,
        span: #0 bytes(2436..2437),
    },
    Ident {
        ident: "External",
        span: #0 bytes(2437..2445),
    },
    Ident {
        ident: "id",
        span: #0 bytes(2446..2448),
    },
    Punct {
        ch: '=',
        spacing: Alone,
        span: #0 bytes(2448..2449),
    },
    Literal {
        kind: Str,
        symbol: "1234-1234",
        suffix: None,
        span: #0 bytes(2449..2460),
    },
    Ident {
        ident: "props",
        span: #0 bytes(2461..2466),
    },
    Punct {
        ch: '=',
        spacing: Alone,
        span: #0 bytes(2466..2467),
    },
    Group {
        delimiter: Brace,
        stream: TokenStream [
            Ident {
                ident: "myProp",
                span: #0 bytes(2469..2475),
            },
            Punct {
                ch: ':',
                spacing: Alone,
                span: #0 bytes(2475..2476),
            },
            Literal {
                kind: Integer,
                symbol: "123",
                suffix: None,
                span: #0 bytes(2477..2480),
            },
            Punct {
                ch: ',',
                spacing: Alone,
                span: #0 bytes(2480..2481),
            },
            Ident {
                ident: "anotherProp",
                span: #0 bytes(2482..2493),
            },
            Punct {
                ch: ':',
                spacing: Alone,
                span: #0 bytes(2493..2494),
            },
            Literal {
                kind: Str,
                symbol: "StringProp",
                suffix: None,
                span: #0 bytes(2495..2507),
            },
        ],
        span: #0 bytes(2467..2509),
    },
    Punct {
        ch: '/',
        spacing: Joint,
        span: #0 bytes(2510..2511),
    },
    Punct {
        ch: '>',
        spacing: Alone,
        span: #0 bytes(2511..2512),
    },
    Punct {
        ch: '<',
        spacing: Alone,
        span: #0 bytes(2546..2547),
    },
    Ident {
        ident: "Text",
        span: #0 bytes(2547..2551),
    },
    Punct {
        ch: '>',
        spacing: Alone,
        span: #0 bytes(2551..2552),
    },
    Ident {
        ident: "Jsem",
        span: #0 bytes(2552..2556),
    },
    Ident {
        ident: "Text",
        span: #0 bytes(2557..2561),
    },
    Punct {
        ch: '<',
        spacing: Joint,
        span: #0 bytes(2561..2562),
    },
    Punct {
        ch: '/',
        spacing: Alone,
        span: #0 bytes(2562..2563),
    },
    Ident {
        ident: "Text",
        span: #0 bytes(2563..2567),
    },
    Punct {
        ch: '>',
        spacing: Alone,
        span: #0 bytes(2567..2568),
    },
    Punct {
        ch: '<',
        spacing: Alone,
        span: #0 bytes(2586..2587),
    },
    Ident {
        ident: "TextInput",
        span: #0 bytes(2587..2596),
    },
    Ident {
        ident: "onTextChange",
        span: #0 bytes(2597..2609),
    },
    Punct {
        ch: '=',
        spacing: Alone,
        span: #0 bytes(2609..2610),
    },
    Group {
        delimiter: Brace,
        stream: TokenStream [
            Ident {
                ident: "move",
                span: #0 bytes(2611..2615),
            },
            Punct {
                ch: '|',
                spacing: Alone,
                span: #0 bytes(2616..2617),
            },
            Ident {
                ident: "e",
                span: #0 bytes(2617..2618),
            },
            Punct {
                ch: '|',
                spacing: Alone,
                span: #0 bytes(2618..2619),
            },
            Group {
                delimiter: Brace,
                stream: TokenStream [
                    Ident {
                        ident: "info",
                        span: #0 bytes(2642..2646),
                    },
                    Punct {
                        ch: '!',
                        spacing: Alone,
                        span: #0 bytes(2646..2647),
                    },
                    Group {
                        delimiter: Parenthesis,
                        stream: TokenStream [
                            Literal {
                                kind: Str,
                                symbol: "The text changed {:#?}",
                                suffix: None,
                                span: #0 bytes(2648..2672),
                            },
                            Punct {
                                ch: ',',
                                spacing: Alone,
                                span: #0 bytes(2672..2673),
                            },
                            Ident {
                                ident: "e",
                                span: #0 bytes(2674..2675),
                            },
                        ],
                        span: #0 bytes(2647..2676),
                    },
                    Punct {
                        ch: ';',
                        spacing: Alone,
                        span: #0 bytes(2676..2677),
                    },
                ],
                span: #0 bytes(2620..2695),
            },
        ],
        span: #0 bytes(2610..2696),
    },
    Punct {
        ch: '/',
        spacing: Joint,
        span: #0 bytes(2697..2698),
    },
    Punct {
        ch: '>',
        spacing: Alone,
        span: #0 bytes(2698..2699),
    },
    Punct {
        ch: '<',
        spacing: Joint,
        span: #0 bytes(2712..2713),
    },
    Punct {
        ch: '/',
        spacing: Joint,
        span: #0 bytes(2713..2714),
    },
    Punct {
        ch: '>',
        spacing: Alone,
        span: #0 bytes(2714..2715),
    },
]
```
