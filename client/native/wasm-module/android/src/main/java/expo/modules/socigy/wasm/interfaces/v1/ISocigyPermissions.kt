package expo.modules.socigy.wasm

import android.webkit.JavascriptInterface

import androidx.core.os.bundleOf

class ISocigyPermissions (
    private val sendEvent: (String, Any?) -> Unit
) {
    @JavascriptInterface
    fun getDeclaredPermissions(id: String, callbackId: String) {
        sendEvent("getDeclaredPermissions", bundleOf(
            "pluginId" to id,
            "callbackId" to callbackId
        ));
    }
    @JavascriptInterface
    fun getPermissions(id: String, callbackId: String) {
        sendEvent("getPermissions", bundleOf(
            "pluginId" to id,
            "callbackId" to callbackId
        ));
    }
    @JavascriptInterface
    fun getPermission(id: String, name: String, callbackId: String) {
        sendEvent("getPermission", bundleOf(
            "pluginId" to id,
            "name" to name,
            "callbackId" to callbackId
        ));
    }
    @JavascriptInterface
    fun requestPermissions(id: String, permissions: String, callbackId: String) {
        sendEvent("requestPermissions", bundleOf(
            "pluginId" to id,
            "permissions" to permissions,
            "callbackId" to callbackId
        ));
    }
}