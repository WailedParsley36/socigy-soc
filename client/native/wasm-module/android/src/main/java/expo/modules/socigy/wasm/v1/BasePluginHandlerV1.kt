package expo.modules.socigy.wasm.v1

import android.webkit.WebView
import android.webkit.WebViewClient
import android.webkit.ValueCallback

import android.os.Handler
import android.os.Looper

import java.util.UUID
import java.net.URI

import expo.modules.kotlin.Promise
import android.content.Context

import com.google.gson.Gson

import expo.modules.socigy.wasm.ISocigyInternal
import expo.modules.socigy.wasm.ISocigyLogging
import expo.modules.socigy.wasm.ISocigyUtils
import expo.modules.socigy.wasm.ISocigyPermissions
import expo.modules.socigy.wasm.ISocigyUI
import expo.modules.socigy.wasm.BasePluginHandler
import expo.modules.socigy.wasm.cache.PluginModuleData

import expo.modules.socigy.wasm.PromiseWatcher
import androidx.core.os.bundleOf

abstract class BasePluginHandler(
    private val appContext: Context,
    private val sendEvent: (String, Any?) -> Unit,
    private val uiHandler: Handler
): BasePluginHandler(appContext, sendEvent, uiHandler) {
    override fun configureJavascriptInterfaces() {
        WebView!!.addJavascriptInterface(ISocigyLogging(sendEvent), "SocigyLogging");
        WebView!!.addJavascriptInterface(ISocigyInternal(sendEvent), "SocigyInternal");
        WebView!!.addJavascriptInterface(ISocigyUtils(sendEvent), "SocigyUtils");
        WebView!!.addJavascriptInterface(ISocigyPermissions(sendEvent), "SocigyPermissions");
        WebView!!.addJavascriptInterface(ISocigyUI(sendEvent), "SocigyUI");
    }

    override fun loadPlugin(id: String, plugin: PluginModuleData, callback: (Boolean) -> Unit) {
        // The ids are invalid
        if (!isValidUUID(id)) {
            callback(false)
            return;
        }
           
        evaluateJs("""
            (async function() {
                try {
                    const id = '${id}';
                    const instance = new globalThis.Socigy.Instance(id);
                    globalThis.Socigy.loaded[id] = instance;

                    await instance.loadFromBytes(${convertBytesToJs(id, plugin.binaries)});
                } catch (e) {
                    SocigyInternal.onPluginLoaded(false, id, JSON.stringify({
                        message: "Failed to load plugin(${id}): " + e.toString()
                    })) 
                }
            })()
        """, ValueCallback<String> { result ->
            callback(true);
        });
    }
    override fun loadPluginAsync(promiseId: String, id: String, plugin: PluginModuleData): Boolean {
        // The ids are invalid
        if (!isValidUUID(id)) {
            return false;
        }

        PromiseWatcher.subscribe(promiseId) { result -> 
            if (result) {
                sendEvent("onLog", bundleOf(
                    "message" to "Plugin was really loaded! :)" 
                ))
            } else {
                sendEvent("onError", bundleOf(
                    "message" to "Plugin was NOT loaded! :(" 
                ))
            }
        }

        uiHandler.post {
            evaluateJs("""
                (async function() {
                    try {
                        const id = '${id}';
                        const instance = new globalThis.Socigy.Instance(id);
                        globalThis.Socigy.loaded[id] = instance;
    
                        const pluginData = ${convertBytesToJs(id, plugin.binaries)};
                        SocigyLogging.log(id, 'Data loaded successfully');

                        instance.loadFromBytesAsync('${promiseId}', pluginData);
                        SocigyLogging.log(id, 'Loaded successfully');
                    } catch (e) {
                        SocigyPromises.reject('${promiseId}', JSON.stringify({
                            message: "Failed to load plugin: " + e.toString()
                        })) 
                    }
                })()
            """);
        }

        return true;
    }

    override fun unloadPlugin(id: String): Boolean {
        // The ids are invalid
        if (!isValidUUID(id)) {
            return false;
        }
                
        uiHandler.post {
            evaluateJs("""
                (function() { 
                    try {
                        delete globalThis.Socigy.loaded['${id}'];
                        SocigyInternal.onPluginUnloaded(true, '${id}', null)
                    } catch (e) {
                        SocigyInternal.onPluginUnloaded(false, '${id}', JSON.stringify({
                            message: "Failed to initialize plugin(${id}): " + e.toString()
                        }))
                    }
                })()
            """);
        }

        return true;
    }
    override fun unloadPluginAsync(promiseId: String, id: String): Boolean {
        // The ids are invalid
        if (!isValidUUID(id)) {
            return false;
        }
        
        uiHandler.post {
            evaluateJs("""
                (function() { 
                    try {
                        delete globalThis.Socigy.loaded['${id}'];
                        SocigyInternal.onPluginUnloaded(true, '${id}', null)
                        SocigyPromises.resolve('${promiseId}', null);
                    } catch (e) {
                        SocigyPromises.reject('${promiseId}', JSON.stringify({
                            message: "Failed to unload plugin: " + e.toString()
                        })) 
                    }
                })()
            """);
        }

        return true;
    }

    override fun renderComponent(id: String, componentId: String, props: HashMap<String, *>?): Boolean {
         // The ids are invalid
         if (!isValidUUID(id) || !isValidUUID(componentId)) {
            return false;
        }

        var parsedData: String;
        if (props == null) {
            parsedData = ""
        } else {
            val gson = Gson();
            parsedData = gson.toJson(props);
        }

        uiHandler.post {
            // TODO: SEC -> Test if including ' in the data can break the JS passing down the value 
            evaluateJs("""
                (function() { 
                    try {
                        globalThis.Socigy.loaded['${id}'].renderComponent('${componentId}', '${parsedData}')
                    } catch (e) {
                        SocigyUI.onComponentRender('${id}', '${componentId}', null, 'Failed to render component: ' + e.toString()) 
                    }
                })()
            """);
        }

        return true;
    }

    override fun invokeJsCallbackAsync(promiseId: String, id: String, data: HashMap<String, *>, callbackId: String): Boolean {        
        // The ids are invalid
        if (!isValidUUID(id) || !isValidUUID(callbackId)) {
            return false;
        }
        
        val gson = Gson();
        val parsedData = gson.toJson(data);

        uiHandler.post {
            // TODO: SEC -> Test if including ' in the data can break the JS passing down the value 
            evaluateJs("""
                (function() { 
                    try {
                        globalThis.Socigy.loaded['${id}'].invokeCallbackAsync('${promiseId}', '${callbackId}', ${parsedData})
                    } catch (e) {
                        SocigyPromises.reject('${promiseId}', JSON.stringify({
                            message: "Failed to invoke callback in plugin: " + e.toString()
                        })) 
                    }
                })()
            """);
        }

        return true;
    }

    override fun initializePlugin(id: String): Boolean {
        // The ids are invalid
        if (!isValidUUID(id)) {
            return false;
        }
        
        uiHandler.post {
            evaluateJs("""
                (function() { 
                    try {
                        globalThis.Socigy.loaded['${id}'].initialize();
                    } catch (e) {
                        SocigyInternal.onPluginInitialized(false, JSON.stringify({
                            message: "Failed to initialize plugin(${id}): " + e.toString()
                        }))
                    }
                })()
            """);
        }

        return true;
    }
    override fun initializePluginAsync(promiseId: String, id: String): Boolean {
        // The ids are invalid
        if (!isValidUUID(id)) {
            return false;
        }

        uiHandler.post {
            evaluateJs("""
                (function() { 
                    try {
                        globalThis.Socigy.loaded['${id}'].initializeAsync('${promiseId}');
                    } catch (e) {
                        SocigyPromises.reject('${promiseId}', JSON.stringify({
                            message: "Failed to initialize plugin(${id}): " + e.toString()
                        }))
                    }
                })()
            """);
        }

        return true;
    }

    override fun removeUiEventListener(id: String, eventId: String) {
        // The ids are invalid
        if (!isValidUUID(id) || !isValidUUID(eventId)) {
            return;
        }

        uiHandler.post {
            evaluateJs("""
                (function() { 
                    try {
                        globalThis.Socigy.loaded['${id}'].removeUiEventListener('${eventId}');
                    } catch (e) {
                        SocigyLogging.error('${id}', "Failed to remove event listener ${eventId}" + e.toString(), false, 0);
                    }
                })()
            """);
        }
    }
    override fun invokeUiEvent(id: String, eventId: String, event: String) {
        // The ids are invalid
        if (!isValidUUID(id) || !isValidUUID(eventId)) {
            return;
        }

        val gson = Gson();
        val deserialized = gson.fromJson(event, HashMap::class.java);

        uiHandler.post {
            evaluateJs("""
                (function() { 
                    try {
                        globalThis.Socigy.loaded['${id}'].invokeUiEvent('${eventId}', '${event}');
                    } catch (e) {
                        SocigyLogging.error('${id}', "Failed to invoke event ${eventId}" + e.toString(), false, 0);
                    }
                })()
            """);
        }
    }
}