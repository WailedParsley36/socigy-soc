package expo.modules.socigy.wasm

abstract class BaseInitializationScriptHandler {
    abstract fun getInitializationScript(): String?;
}