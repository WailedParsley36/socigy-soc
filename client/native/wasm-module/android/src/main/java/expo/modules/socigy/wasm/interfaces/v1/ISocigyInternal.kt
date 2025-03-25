package expo.modules.socigy.wasm

import android.webkit.JavascriptInterface
import androidx.core.os.bundleOf

class ISocigyInternal(
    private val sendEvent: (String, Any?) -> Unit
) {
    @JavascriptInterface
    fun onPluginLoaded(success: Boolean, id: String, error: String?) {
        sendEvent("onPluginLoaded", bundleOf(
            "pluginId" to id,
            "success" to success,
            "error" to error
        ));
    }

    @JavascriptInterface
    fun onPluginInitialized(success: Boolean, id: String, error: String?) {
        sendEvent("onPluginInitialized", bundleOf(
            "pluginId" to id,
            "success" to success,
            "error" to error
        ));
    }

    @JavascriptInterface
    fun onPluginUnloaded(success: Boolean, id: String, error: String?) {
        sendEvent("onPluginUnloaded", bundleOf(
            "pluginId" to id,
            "success" to success,
            "error" to error
        ));
    }
}