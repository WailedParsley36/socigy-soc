package expo.modules.socigy.wasm.handlers.rust.v1

import expo.modules.socigy.wasm.v1.BasePluginHandler
import expo.modules.socigy.wasm.handlers.rust.v1.InitializationScriptHolder

import expo.modules.kotlin.Promise
import android.content.Context

import android.os.Handler
import android.os.Looper

class RustPluginHandler(
    private val appContext: Context,
    private val sendEvent: (String, Any?) -> Unit,
    private val uiHandler: Handler
) : BasePluginHandler(appContext, sendEvent, uiHandler) {
    override fun getInitializationScript(): String? {
        return InitializationScriptHolder().getInitializationScript();
    }
}  