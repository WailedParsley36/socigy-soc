package expo.modules.socigy.wasm

import android.webkit.JavascriptInterface
import androidx.core.os.bundleOf

class ISocigyLogging(
    private val sendEvent: (String, Any?) -> Unit
) {
    @JavascriptInterface
    fun log(pluginId: String, message: String) {
        sendEvent("onLog", bundleOf(
            "pluginId" to pluginId,
            "message" to message,
        ));
    }

    @JavascriptInterface
    fun error(pluginId: String, message: String, showUI: Boolean, uiDelay: Int) {
        sendEvent("onError", bundleOf(
            "pluginId" to pluginId,
            "message" to message,
            "showUI" to showUI,
            "uiDelay" to uiDelay
        ));
    }

    @JavascriptInterface
    fun fatal(pluginId: String, message: String, uiDelay: Int) {
        sendEvent("onFatal", bundleOf(
            "pluginId" to pluginId,
            "message" to message,
            "uiDelay" to uiDelay
        ));
    }
}