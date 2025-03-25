# Plugin Cache

## General

Plugins vary in **Language** and **API Version** and thus the caching mechanism needs to be vary of these parameters

**Plugin binaries**

> https://plugins.socigy.com/uuid-base-64.wasm

**Plugin Configuration**

> https://plugins.socigy.com/uuid-base-64.json

```rust
// Module initialization
OnCreate() {
    // Load plugin ids from cache
    // Go through plugin ids
        // Get plugin configuration -> "apiVersion" + "language"
            // If missing report error, continue with another
        // Validate checksum of plugin configuration
        // Get plugin binaries
            // If missing, download them
        // Decrypt the plugin binaries
        // Validate checksum of plugin binaries
        // Instantiate plugin
            // If handler exists just loadBytes
            // else create appropriate handler and loadBytes

        // Initialize plugin
            // Call initiailze_async()
            // Call main()
}
```

## Android implementation

SharedPreferences / EncryptedSharedPreferences
