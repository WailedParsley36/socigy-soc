package expo.modules.socigy.wasm

import android.webkit.WebView
import android.webkit.WebViewClient
import android.webkit.ValueCallback
import android.webkit.WebResourceResponse
import android.webkit.WebResourceRequest

import android.os.Handler
import android.os.Looper

import java.util.UUID
import java.net.URI
import java.io.ByteArrayInputStream

import expo.modules.kotlin.Promise
import android.content.Context

import expo.modules.socigy.wasm.ISocigyPromises
import expo.modules.socigy.wasm.cache.PluginModuleData

import expo.modules.socigy.wasm.SocigyWasmExceptions

import androidx.core.os.bundleOf

abstract class BasePluginHandler(
    private val appContext: Context,
    private val sendEvent: (String, Any?) -> Unit,
    private val uiHandler: Handler
) {
    private var _isInitialized: Boolean = false;
    protected var WebView: WebView? = null;
    protected val PromiseMap: HashMap<String, Promise> = HashMap<String, Promise>();
    protected val BigDataMap: HashMap<String, ByteArray> = HashMap<String, ByteArray>();

    init {
        requireNotNull(appContext) { "AppContext must not be null!" }

        sendEvent("onLog", bundleOf(
            "message" to "BasePluginHandler initializing"
        ));
        uiHandler.post {
            try {
                WebView = WebView(appContext)

                WebView!!.apply {
                    webViewClient = object : WebViewClient() {
                        override fun onPageFinished(view: WebView, url: String) {
                            _isInitialized = true;
                        }
                        override fun shouldInterceptRequest(view: WebView?, request: WebResourceRequest?): WebResourceResponse? {
                            val url = request?.url.toString()
                            sendEvent("onLog", bundleOf(
                                "message" to "Intercepted fetch request to ${url}"
                            ));

                            if (url.startsWith("https://plugins.socigy.com/plugins/")) {
                                val dataId = url.removePrefix("https://plugins.socigy.com/plugins/");
                                sendEvent("onLog", bundleOf(
                                    "message" to "Intercepted file request: ${dataId}"
                                ))
                                
                                val data = BigDataMap[dataId];
                                if (data == null) {
                                    sendEvent("onError", bundleOf(
                                        "message" to "Failed to load plugin data for: ${dataId}"
                                    ))
                                    return null
                                }
                                val inputStream = ByteArrayInputStream(data)
                                try {
                                    val headers = mapOf(
                                        "Access-Control-Allow-Origin" to "*",
                                        "Access-Control-Allow-Methods" to "GET, POST, PUT, DELETE, OPTIONS",
                                        "Access-Control-Allow-Headers" to "Content-Type"
                                    )
                                    val result = WebResourceResponse("application/wasm", "UTF-8", 200, "OK", headers, inputStream);
                                    BigDataMap.remove(dataId);
                                    return result;
                                } catch (e: Exception) {
                                    sendEvent("onError", bundleOf(
                                        "message" to "Failed to intercept plugin data request: ${e.toString()}"
                                    ))
                                }
                            }
                            
                            return super.shouldInterceptRequest(view, request)
                        }
                    }
                }
                WebView!!.settings.javaScriptEnabled = true;
                WebView!!.addJavascriptInterface(ISocigyPromises(PromiseMap), "SocigyPromises");
                configureJavascriptInterfaces();
            } catch (e: Exception) {
                sendEvent("onFatal", bundleOf(
                    "message" to "Socigy Plugins encountered an unexpected error"
                ))
            }
        }
    }

    protected abstract fun configureJavascriptInterfaces();
    protected abstract fun getInitializationScript(): String?;
    
    fun isInitialized() {
        _isInitialized
    }

    protected fun isValidUUID(uuid: String): Boolean {
        val regex = "^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$".toRegex()
        return uuid.matches(regex)
    }
    protected fun rawEvaluateJs(script: String, callback: ValueCallback<String>? = null) {
        WebView!!.evaluateJavascript("javascript:$script", callback);
    }
    protected fun evaluateJs(script: String, callback: ValueCallback<String>? = null) {
        uiHandler.post {
            rawEvaluateJs(script, callback);
        }
    }
    fun queuePromise(promise: Promise): String {
        val id = UUID.randomUUID().toString();
        
        PromiseMap[id] = promise;
        return id;
    }
    protected fun unqueuePromise(promiseId: String) {
        val promise = PromiseMap[promiseId];
        PromiseMap.remove(promiseId)
        promise?.reject("PLUGIN_EXEC_ERROR", "Unexpected error (promise timeout)", null);
    } 
    // https://plugins.socigy.com/plugins/eccb33a4-4295-40d2-a1b2-7f140c218881/963c8c46-4fcd-4232-b588-b679d474c5f3/module.wasm
    protected fun convertBytesToJs(id: String, data: ByteArray): String {
        BigDataMap[id] = data;
        return "await (await fetch('https://plugins.socigy.com/plugins/${id}')).arrayBuffer()";
    }

    protected open fun startUpEnvironmentInternal(callback: (Boolean) -> Unit) {
        // Specific implementation
        // ...
        callback(true)
    }
    fun startUpEnvironment(callback: (Boolean) -> Unit) {
        uiHandler.post {
            try {
                getInitializationScript()?.let { initializeScript ->
                    WebView!!.evaluateJavascript("javascript:$initializeScript", null);
                }
                startUpEnvironmentInternal(callback)
            } catch (e: Exception) {
                callback(false)
            }
        }
    }

    abstract fun removeUiEventListener(id: String, eventId: String);
    abstract fun invokeUiEvent(id: String, eventId: String, event: String);
    
    abstract fun loadPlugin(id: String, plugin: PluginModuleData, callback: (Boolean) -> Unit);
    abstract fun loadPluginAsync(promiseId: String, id: String, plugin: PluginModuleData): Boolean;
    fun loadPluginAsync(promise: Promise, id: String, plugin: PluginModuleData) {
        val promiseId = queuePromise(promise);
        if (!loadPluginAsync(promiseId, id, plugin)) {
            unqueuePromise(promiseId);
        }
    }
    
    abstract fun invokeJsCallbackAsync(promiseId: String, id: String, data: HashMap<String, *>, callbackId: String): Boolean;
    fun invokeJsCallbackAsync(promise: Promise, id: String, data: HashMap<String, *>, callbackId: String) {
        val promiseId = queuePromise(promise);
        if (!invokeJsCallbackAsync(promiseId, id, data, callbackId)) {
            unqueuePromise(promiseId)
        }
    }

    abstract fun unloadPlugin(id: String): Boolean;
    abstract fun unloadPluginAsync(promiseId: String, id: String): Boolean;
    fun unloadPluginAsync(promise: Promise, id: String) {
        val promiseId = queuePromise(promise);
        if (!unloadPluginAsync(promiseId, id)) {
            unqueuePromise(promiseId)
        }
    }

    abstract fun initializePlugin(id: String): Boolean;
    abstract fun initializePluginAsync(promiseId: String, id: String): Boolean;
    fun initializePluginAsync(promise: Promise, id: String) {
        val promiseId = queuePromise(promise);
        if (!initializePluginAsync(promiseId, id)) {
            unqueuePromise(promiseId)
        }
    }

    abstract fun renderComponent(pluginId: String, componentId: String, props: HashMap<String, *>?): Boolean;
}