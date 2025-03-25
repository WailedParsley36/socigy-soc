package expo.modules.socigy.wasm

import android.webkit.JavascriptInterface
import androidx.core.os.bundleOf

class ISocigyUI(
    private val sendEvent: (String, Any?) -> Unit
) {
    @JavascriptInterface
    fun onComponentChange(pluginId: String, id: String, changes: String) {
        sendEvent("onComponentChange", bundleOf(
            "pluginId" to pluginId,
            "componentId" to id,
            "changes" to changes
        ))
    }
    @JavascriptInterface
    fun onComponentRender(pluginId: String, id: String, result: String?, error: String?) {
        sendEvent("onComponentRender", bundleOf(
            "pluginId" to pluginId,
            "componentId" to id,
            "result" to result,
            "error" to error
        ))
    }
    
    @JavascriptInterface
    fun removeComponent(pluginId: String, id: String) {
        sendEvent("removeComponent", bundleOf(
            "pluginId" to pluginId,
            "componentId" to id
        ))
    }
    @JavascriptInterface
    fun registerComponent(pluginId: String, id: String) {
        sendEvent("registerComponent", bundleOf(
            "pluginId" to pluginId,
            "componentId" to id
        ))
    }

    @JavascriptInterface
    fun onAppWindowChange(pluginId: String, id: String, changes: String) {
        sendEvent("onAppWindowChange", bundleOf(
            "pluginId" to pluginId,
            "appWindowId" to id,
            "changes" to changes
        ))
    }
}