package expo.modules.socigy.wasm

import android.webkit.JavascriptInterface

class ISocigyUtils(
    private val sendEvent: (String, Any?) -> Unit
) {
    @JavascriptInterface
    fun randomUUID(): String {
        return java.util.UUID.randomUUID().toString();
    }
}