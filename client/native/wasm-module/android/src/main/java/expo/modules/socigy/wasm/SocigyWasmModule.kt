package expo.modules.socigy.wasm

import expo.modules.socigy.wasm.BasePluginHandler;

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import java.net.URL

import android.content.Context
import android.content.pm.PackageManager
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import androidx.core.os.bundleOf

import expo.modules.kotlin.Promise

import com.google.gson.Gson
import com.google.gson.reflect.TypeToken

import expo.modules.socigy.wasm.cache.PluginCacheManager
import kotlinx.coroutines.CoroutineExceptionHandler
import android.util.Log
import kotlinx.coroutines.flow.MutableStateFlow

import android.webkit.WebView

object SocigyWasmExceptions {
  private val sendEventFlow = MutableStateFlow<((String, Any?) -> Unit)?>(null)

  fun setSendEvent(callback: (String, Any?) -> Unit) {
    sendEventFlow.value = callback
    Thread.setDefaultUncaughtExceptionHandler { _, throwable ->
      sendEventFlow.value?.invoke("onError", bundleOf(
        "message" to "Unhandled exception: ${throwable.message}",
        "showUI" to false,
        "uiDelay" to null
      )) ?: Log.e("SocigyWasmModule", "sendEvent is null, cannot send event")
      
      Log.e("SocigyWasmModule", "Exception: ${throwable.message}", throwable)
      throw throwable
    }
  }

  val handler = CoroutineExceptionHandler { _, throwable ->
    sendEventFlow.value?.invoke("onError", bundleOf(
      "message" to "Unhandled exception: ${throwable.message}",
      "showUI" to false,
      "uiDelay" to null
    )) ?: Log.e("SocigyWasmModule", "sendEvent is null, cannot send event")

    Log.e("SocigyWasmModule", "Exception - Coroutine: ${throwable.message}", throwable)
  }
}

class SocigyWasmModule : Module() {
  private final var PluginCacheManager: PluginCacheManager? = null;

  fun isWebViewSupported(context: Context): Boolean {
    return try {
        WebView(context)
        context.packageManager.hasSystemFeature(PackageManager.FEATURE_WEBVIEW)
    } catch (e: Exception) {
        false
    }
  }

  fun getContext(): Context {
    return appContext.reactContext?.applicationContext ?: throw IllegalStateException("ReactContext is null. Cannot access application context.")
  }

  fun sendEventWrapper(eventName: String, body: Any?) {
    when (body) {
      is Bundle -> sendEvent(eventName, body)
      null -> sendEvent(eventName, null as Bundle?)
      else -> throw IllegalArgumentException("Unsupported event data type")
    }
  }

  override fun definition() = ModuleDefinition {
    
    // Sets the name of the module that JavaScript code will use to refer to the module. Takes a string as an argument.
    // Can be inferred from module's class name, but it's recommended to set it explicitly for clarity.
    // The module will be accessible from `requireNativeModule('SocigyWasm')` in JavaScript.
    Name("SocigyWasm")
    
    OnCreate() {
      SocigyWasmExceptions.setSendEvent(::sendEventWrapper);

      // Initialize cache and load cached plugins
      try {
        PluginCacheManager = PluginCacheManager(getContext(), ::sendEventWrapper);
      } catch (e: Exception) {
        sendEvent("onFatal", bundleOf(
          "message" to "FATAL_ERR - " + e.toString(),
          "uiDelay" to 0
        ));
      }
    }

    Events(
      "onLog", "onError", "onFatal",
      "onPluginLoaded", "onPluginInitialized", "onPluginUnloaded",
      "getPermissions", "getPermission", "requestPermissions", "getDeclaredPermissions",
      "onComponentChange", "removeComponent", "registerComponent", "onAppWindowChange", "onComponentRender"
    )

    Property("isSupported") {
      isWebViewSupported(getContext())
    }

    Function("getLoadedLanguages") {
      PluginCacheManager?.let {
        return@Function it.getLoadedLanguages().toList()
      }
    }

    Function("getLoadedVersionsForLanguage") { language: String ->
      PluginCacheManager?.let {
        return@Function it.getLoadedVersionsForLanguage(language)?.toList()
      }
    }

    Function("getLoadedPluginsForLanguageVersion") { language: String, version: String ->
      PluginCacheManager?.let {
        return@Function it.getLoadedPluginsForLanguageVersion(language, version)?.toList()
      }
    }

    Function("getLoadedPlugins") {
      PluginCacheManager?.let {
        return@Function it.getLoadedPlugins().toList()
      }
    }

    AsyncFunction("loadPluginAsync") { pluginId: String, promise: Promise -> 
      PluginCacheManager?.let {
        it.loadPluginAsync(promise, pluginId);
        return@AsyncFunction
      }

      promise.reject("PLUGIN_CACHE_ERR", "Plugin cache manager is not initialized", null);
    }

    Function("invokeUiEvent") { pluginId: String, eventId: String, event: String -> 
      PluginCacheManager?.let {
        it.invokeUiEvent(pluginId, eventId, event);
      }
    }
    Function("removeUiEventListener") { pluginId: String, eventId: String -> 
      PluginCacheManager?.let {
        it.removeUiEventListener(pluginId, eventId);
      }
    }

    AsyncFunction("initializePluginAsync") { pluginId: String, promise: Promise -> 
      PluginCacheManager?.let {
        it.initializePluginAsync(promise, pluginId);
        return@AsyncFunction
      }

      promise.reject("PLUGIN_CACHE_ERR", "Plugin cache manager is not initialized", null);
    }

    Function("renderComponent") { pluginId: String, componentId: String, props: String? ->
      PluginCacheManager?.let {
        val handler = it.getPluginHandler<BasePluginHandler>(pluginId);
        if (handler == null){
          return@Function bundleOf(
            "error" to "PLUGIN_HANDLER_ERR",
            "message" to "Plugin handler was not found"
          )
        }

        if (props == null) {
          return@Function handler.renderComponent(pluginId, componentId, null);        
        }

        val gson = Gson();
        val type = object : TypeToken<HashMap<String, *>>() {}.type
        val parsedData: HashMap<String, *> = gson.fromJson(props, type)

        return@Function handler.renderComponent(pluginId, componentId, parsedData);        
      }
    }

    AsyncFunction("unloadPluginAsync") { pluginId: String, promise: Promise ->
      PluginCacheManager?.let {
        it.unloadPluginAsync(promise, pluginId)
        return@AsyncFunction
      }
      
      promise.reject("PLUGIN_CACHE_ERR", "Plugin cache manager is not initialized", null);
    }

    AsyncFunction("invokeJsCallbackAsync") { pluginId: String, data: String, callbackId: String, promise: Promise ->
      sendEvent("onLog", bundleOf(
        "message" to "Invoking callback for: ${pluginId} / ${callbackId}"
      ))
      
      PluginCacheManager?.let {
        it.invokeJsCallbackAsync(pluginId, data, callbackId, promise)
        return@AsyncFunction
      }
      
      promise.reject("PLUGIN_CACHE_ERR", "Plugin cache manager is not initialized", null);
    }
  }
}