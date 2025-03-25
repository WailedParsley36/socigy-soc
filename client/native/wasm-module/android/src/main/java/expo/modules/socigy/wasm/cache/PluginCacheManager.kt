package expo.modules.socigy.wasm.cache
import expo.modules.socigy.wasm.PromiseWatcher

import com.google.gson.Gson
import com.google.gson.reflect.TypeToken

import androidx.core.os.bundleOf
import android.content.Context
import android.webkit.WebView
import android.webkit.ValueCallback

import javax.crypto.Cipher
import javax.crypto.KeyGenerator
import javax.crypto.spec.SecretKeySpec
import java.util.Base64
import java.net.URL
import java.util.UUID;
import java.io.File

import expo.modules.kotlin.Promise
import expo.modules.socigy.wasm.cache.SecureStorage
import expo.modules.socigy.wasm.cache.AsyncStorage
import expo.modules.socigy.wasm.cache.FileSystem
import expo.modules.socigy.wasm.cache.PluginModuleData
import expo.modules.socigy.wasm.cache.PluginConfiguration
import expo.modules.socigy.wasm.BasePluginHandler
import expo.modules.socigy.wasm.handlers.rust.v1.RustPluginHandler

import android.os.Handler
import android.os.Looper

import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch

import androidx.core.os.bundleOf

import java.security.SecureRandom

import com.vdurmont.semver4j.Semver

private const val ALGORITHM = "AES/CBC/PKCS5Padding"
private const val SECRET_KEY_ALGORITHM = "PBKDF2WithHmacSHA256"

class PluginCacheManager(
    private final val context: Context, 
    private val sendEvent: (String, Any?) -> Unit
) {
    private val SecureStorage = SecureStorage(context, "socigy-secure")
    private val AsyncStorage = AsyncStorage(context, "socigy-async")
    private val FileSystem = FileSystem(context)
    private val UiHandler: Handler;

    private final val FileDirectory = context.filesDir;

    // Language<Version<Handler>>
    private val PluginHandlers: HashMap<String, HashMap<String, BasePluginHandler>> = HashMap();
    // PluginId<Handler>
    private val PluginMappings: HashMap<String, BasePluginHandler> = HashMap(); 

    // Load cached plugins
    init {
        UiHandler = Handler(Looper.myLooper()!!)
        
        val gson = Gson()
        
        // Load plugin ids from cache
        val cachedPluginsRaw = SecureStorage.getItem("cached-plugins");
        if (cachedPluginsRaw != null) {
            val cachedPlugins: List<String> = gson.fromJson(cachedPluginsRaw, Array<String>::class.java).toList()
            
            // Go through plugin ids
            for (pluginId in cachedPlugins) {
                loadPluginFromCache(pluginId) { result -> 
                    // True -> all good
                    // False -> download from web, corrupted data
                    // Null -> Unuspported version/language
                    when (result) {
                        false -> {
                            // Asynchronously downloading the plugin again
                            loadPlugin(pluginId) { success ->
                                if (success) {
                                    sendEvent("onPluginLoaded", bundleOf(
                                        "pluginId" to pluginId,
                                        "success" to true
                                    ));
                                } else {
                                    sendEvent("onPluginLoaded", bundleOf(
                                        "pluginId" to pluginId,
                                        "success" to false,
                                        "error" to "Failed to load plugin from cache and from web..."
                                    ));
                                    removeCachedPlugin(pluginId);
                                }
                            };
                        }
                        true -> sendEvent("onPluginLoaded", bundleOf(
                            "pluginId" to pluginId,
                            "success" to true
                        ))
                        null -> {
                            sendEvent("onPluginLoaded", bundleOf(
                                "pluginId" to pluginId,
                                "success" to false,
                                "error" to "Unsupported API language version"
                            ))
                            removeCachedPlugin(pluginId);
                        }
                    }
                }
            }
        }        
    }

    fun getLoadedLanguages(): MutableSet<String> {
        return PluginHandlers.keys
    }
    fun getLoadedPlugins(): MutableSet<String> {
        return PluginMappings.keys
    }
    fun getLoadedVersionsForLanguage(language: String): MutableSet<String>? {
        return PluginHandlers[language]?.keys
    }
    fun getLoadedPluginsForLanguageVersion(language: String, version: String): MutableSet<String>? {
        val languageMap: HashMap<String, BasePluginHandler> = PluginHandlers[language] ?: return null;

        return languageMap.keys
    }


    fun loadPlugin(id: String, callback: (Boolean) -> Unit) {
        try {
            fetchPluginFromId(id) { data -> 
                if (data == null) {
                    sendEvent("onError", bundleOf(
                        "message" to "Failed to fetch plugin..."
                    ))
                    callback(false)
                    return@fetchPluginFromId
                } 

                instantiatePlugin(id, data, callback)
            }
        } catch (e: Exception) {
            sendEvent("onError", bundleOf(
                "message" to "Failed to load plugin - ${e.toString()}"
            ))
            callback(false)
        }
    }
    fun loadPluginAsync(promise: Promise, id: String) {
        try {
            fetchPluginFromId(id) { data -> 
                if (data == null) {
                    promise.reject("PLUGIN_LOAD_ERR", "Failed to fetch plugin", null)
                    return@fetchPluginFromId
                } 

                instantiatePluginAsync(promise, id, data)
            }
        } catch (e: Exception) {
            promise.reject("PLUGIN_LOAD_ERRR", "Failed to load plugin - " + e.toString(), e);
        }
    }

    fun initializePluginAsync(promise: Promise, id: String) {
        try {
            val handler = PluginMappings[id];
            if (handler == null) {
                promise.reject("PLUGIN_INIT_ERRR", "Plugin is not loaded", null);
                return;
            }

            handler.initializePluginAsync(promise, id);
        } catch (e: Exception) {
            promise.reject("PLUGIN_INIT_ERRR", "Failed to initialize plugin - " + e.toString(), e);
        }
    }

    fun invokeJsCallbackAsync(pluginId: String, data: String, callbackId: String, promise: Promise) {
        val foundHandler = PluginMappings[pluginId];
        if (foundHandler == null) {
            promise.reject("PLUGIN_EXEC_ERROR", "Requested plugin is not instantiated", null);
            return
        }

        val gson = Gson();
        val type = object : TypeToken<HashMap<String, *>>() {}.type
        val parsedData: HashMap<String, *> = gson.fromJson(data, type)

        foundHandler.invokeJsCallbackAsync(promise, pluginId, parsedData, callbackId);
    }

    fun unloadPlugin(id: String) {
        val handler = PluginMappings[id];
        if (handler == null) {
            return;
        }

        handler.unloadPlugin(id);
        PluginMappings.remove(id);
    }
    fun unloadPluginAsync(promise: Promise, id: String) {
        val handler = PluginMappings[id];
        if (handler == null) {
            return;
        }

        removeCachedPlugin(id);
        removePluginCacheData(id);
        handler.unloadPluginAsync(promise, id);
        PluginMappings.remove(id);

        // TODO: OPTIMALIZATION - Remove handler when no plugin is running on it
    }

    fun <T> getPluginHandler(id: String): T? 
        where T : BasePluginHandler {
        return PluginMappings[id] as? T
    }

    fun removeUiEventListener(id: String, eventId: String) {
        val handler = PluginMappings[id];
        if (handler == null) {
            return;
        }

        handler.removeUiEventListener(id, eventId);
    }

    fun invokeUiEvent(id: String, eventId: String, event: String) {
        val handler = PluginMappings[id];
        if (handler == null) {
            return;
        }

        handler.invokeUiEvent(id, eventId, event);
    }

    private fun instantiatePlugin(id: String, data: PluginModuleData, callback: (Boolean) -> Unit) {
        UiHandler.post {
            setupPluginHandlerFor(data.config.language, data.config.apiVersion) { handler -> 
                if (handler == null) {
                    // Cleaning old files, that will be overriden
                    removePluginCacheData(id);
                    
                    sendEvent("onError", bundleOf(
                        "message" to "Unable to initialize Handler for ${data.config.language} v${data.config.apiVersion}",
                        "showUI" to false
                    ))                  
                    callback(false)
                    return@setupPluginHandlerFor
                } 
                
                // Register plugin id with the appropriate handler
                PluginMappings[id] = handler;
        
                // Instantiate plugin
                val promiseId = java.util.UUID.randomUUID().toString();
                PromiseWatcher.subscribe(promiseId) { result: Boolean ->
                    callback(result)
                }
                handler.loadPluginAsync(promiseId, id, data);
            }
        }
    }
    private fun instantiatePluginAsync(promise: Promise, id: String, data: PluginModuleData) {
        UiHandler.post {
            setupPluginHandlerFor(data.config.language, data.config.apiVersion) { handler -> 
                if (handler == null) {
                    // Cleaning old files, that will be overriden
                    removePluginCacheData(id);
                    
                    promise.reject("PLUGIN_LOAD_ERR", "Unable to initialize Handler for ${data.config.language} v${data.config.apiVersion}", null);
                    return@setupPluginHandlerFor
                } 
                
                // Register plugin id with the appropriate handler
                PluginMappings[id] = handler;
        
                // Instantiate plugin
                val promiseId = handler.queuePromise(promise);
                // Handles the Load result
                PromiseWatcher.subscribe(promiseId) { result: Boolean ->
                    // If failed then return
                    if (!result) {
                        return@subscribe;
                    }

                    // Cache successfully loaded plugin
                    cachePlugin(id, data);
                }
                handler.loadPluginAsync(promiseId, id, data);
            }
        }
    }

    private fun generateRandomAESKey(): String {
        val keyBytes = ByteArray(32)
        SecureRandom().nextBytes(keyBytes)
        return Base64.getEncoder().encodeToString(keyBytes)
    }
    private fun combinePaths(path: String): String {
        return File(FileDirectory, path).absolutePath
    }

    private fun setupPluginHandlerFor(language: String, apiVersion: String, callback: (BasePluginHandler?) -> Unit) {
        var pluginLanguageHandlers = PluginHandlers[language];
        if (pluginLanguageHandlers == null) {
            val newHashMap = HashMap<String, BasePluginHandler>()
            PluginHandlers[language] = newHashMap;
            pluginLanguageHandlers = newHashMap;
        }

        var pluginVersionHandler = pluginLanguageHandlers[apiVersion]
        if (pluginVersionHandler == null) {
            val handler = getHandlerForLanguageVersion(language, apiVersion)
            if (handler == null) {
                println("Unable to initialize Handler for ${language} v${apiVersion}")
                callback(null)
                return
            }

            pluginLanguageHandlers[apiVersion] = handler;
            pluginVersionHandler = handler;
        }

        pluginVersionHandler.startUpEnvironment() { result -> 
            if (result) {
                callback(pluginVersionHandler)
            } else {
                callback(null)
            }
        }
    }
    private fun removePluginCacheData(id: String) {
        SecureStorage.removeItemAsync("${id}-key");
        SecureStorage.removeItemAsync("${id}-cfg-checksum");
        SecureStorage.removeItemAsync("${id}-bin-checksum");

        FileSystem.deleteFile(combinePaths("${id}.cfg"));
        FileSystem.deleteFile(combinePaths("${id}.plug"));
    }
    private fun getHandlerForLanguageVersion(language: String, version: String): BasePluginHandler? {
        try {
            return when (language) {
                "rust" -> {
                    val availableVersions = listOf("1.0.0")
                    sendEvent("onLog", bundleOf(
                        "message" to "Resolving RUST handler for version v${version}"
                    ));
                    
                    val resolvedVersion = resolveBestVersion(version, availableVersions)

                    sendEvent("onLog", bundleOf(
                        "message" to "Best version ${resolvedVersion}"
                    ));
                    
                    when (resolvedVersion) {
                        "1.0.0" -> {
                            RustPluginHandler(context, sendEvent, UiHandler)
                        }
                        else -> null
                    }
                }
                else -> {
                    null
                }
            }
        } catch (e: Exception) {
            sendEvent("onError", bundleOf(
                "message" to "Failed to resolve handler for language version... - " + e.message
            ));
            return null
        }
    }

    private fun resolveBestVersion(requestedVersion: String, availableVersions: List<String>): String? {
        val baseVersion = if (requestedVersion.startsWith("^")) {
            requestedVersion.substring(1)
        } else {
            requestedVersion
        }
    
        val requestedSemver = Semver(baseVersion, Semver.SemverType.NPM)
    
        val rangeStart = requestedSemver
        val rangeEnd = Semver("${requestedSemver.major + 1}.0.0", Semver.SemverType.NPM)
    
        return availableVersions
            .map { Semver(it, Semver.SemverType.NPM) }
            .filter { it.compareTo(rangeStart) >= 0 && it.compareTo(rangeEnd) < 0 }
            .maxByOrNull { it }
            ?.toString()
    }

    private fun fetchPluginConfiguration(url: String, callback: (PluginConfiguration?) -> Unit) {
        CoroutineScope(Dispatchers.IO).launch {
            val result = runCatching {
                URL(url).openStream().use { stream ->
                    Gson().fromJson(stream.reader(), PluginConfiguration::class.java)
                }
            }.getOrNull()
            
            UiHandler.post {
                callback(result)
            }
        }
    }
    
    private fun downloadPluginBinaries(url: String, callback: (ByteArray?) -> Unit) {
        CoroutineScope(Dispatchers.IO).launch {
            val result = runCatching {
                java.net.URL(url).openStream().use { it.readBytes() }
            }.getOrNull()
            // Ensure callback is called on the main thread if necessary
            UiHandler.post {
                callback(result)
            }
        }
    }
    
    private fun fetchPluginFromId(id: String, callback: (PluginModuleData?) -> Unit) {
        val base64Id = encodeToBase64(id)
    
        downloadPluginBinaries("https://cinema-simple.onrender.com/socigy/plugins/${base64Id}.wasm") { binaries ->
            if (binaries == null) {
                callback(null)
                return@downloadPluginBinaries
            }
    
            fetchPluginConfiguration("https://cinema-simple.onrender.com/socigy/plugins/${base64Id}.json") { configuration ->
                if (configuration == null) {
                    callback(null)
                    return@fetchPluginConfiguration
                }
    
                callback(PluginModuleData(binaries, configuration))
            }
        }
    }

    private fun encodeToBase64(input: String): String {
        return Base64.getEncoder().encodeToString(input.toByteArray(Charsets.UTF_8))
    }
    private fun loadPluginFromCache(id: String, callback: (Boolean?) -> Unit) {
        CoroutineScope(Dispatchers.IO).launch {
            val encryptionKey = SecureStorage.getItem("${id}-key");
            val configChecksum = SecureStorage.getItem("${id}-cfg-checksum");
            val binariesChecksum = SecureStorage.getItem("${id}-bin-checksum");
            if (encryptionKey == null || configChecksum == null || binariesChecksum == null) {
                // Cleaning old daata, that will be overriden
                removePluginCacheData(id);
                println("Encryption key is missing || Config checksum is missing || Binaries checksum is missing")
                
                sendEvent("onError", bundleOf(
                    "message" to "Encryption key is missing || Config checksum is missing || Binaries checksum is missing"
                    ))
                    callback(false);
                    return@launch;
            }
                
            // Get plugin configuration -> "apiVersion" + "language"
            val pluginConfig = FileSystem.readEncryptedJsonAtPath<PluginConfiguration>(combinePaths("${id}.cfg"), configChecksum, ALGORITHM, SECRET_KEY_ALGORITHM, encryptionKey);
            if (pluginConfig == null) {
                // Cleaning old files, that will be overriden
                removePluginCacheData(id);
                println("Plugin configuration is missing")
                
                callback(false);
                return@launch;
            }
            
            // Get plugin binaries
            val pluginBinaries = FileSystem.readEncryptedPluginBinaries(combinePaths("${id}.plug"), binariesChecksum, ALGORITHM, SECRET_KEY_ALGORITHM, encryptionKey);
            if (pluginBinaries == null) {
                // Cleaning old files, that will be overriden
                removePluginCacheData(id);
                println("Plugin binaries are missing, or were corrupted")
                
                callback(false);
                return@launch;
            }
            
            val pluginData = PluginModuleData(pluginBinaries, pluginConfig);
            UiHandler.post {
                instantiatePlugin(id, pluginData) { result: Boolean ->
                    if(result) {
                        callback(true)
                    } else {
                        callback(null);
                    }
                }
            }
        }
    }
    
    private fun getCachedPlugins(): MutableSet<String>? {
        val cachedPluginsRaw = SecureStorage.getItem("cached-plugins");
        if (cachedPluginsRaw == null) {
            return null;
        }

        val gson = Gson();
        val type = object : TypeToken<MutableSet<String>>() {}.type
        val pluginIds = gson.fromJson<MutableSet<String>>(cachedPluginsRaw, type);
        return pluginIds;
    }
    private fun saveCachedPlugins(data: MutableSet<String>) {
        val gson = Gson();
        val parsedids = gson.toJson(data);
        SecureStorage.setItemAsync("cached-plugins", parsedids);
    }
    private fun appendCachedPlugin(id: String) {
        val pluginIds = getCachedPlugins();
        if (pluginIds == null) {
            SecureStorage.setItemAsync("cached-plugins", "[${id}]");
            return;
        }

        pluginIds.add(id)
        saveCachedPlugins(pluginIds);
    }
    private fun removeCachedPlugin(id: String) {
        val pluginIds = getCachedPlugins();
        if (pluginIds == null) {
            return;
        }
        
        pluginIds.remove(id)
        saveCachedPlugins(pluginIds);
    }
    
    private fun cachePlugin(id: String, data: PluginModuleData) {
        CoroutineScope(Dispatchers.IO).launch {
            val encryptionKey = generateRandomAESKey();
            SecureStorage.setItemAsync("${id}-key", encryptionKey);

            val configChecksum = FileSystem.saveEncryptedObjectTo(combinePaths("${id}.cfg"), data.config, ALGORITHM, SECRET_KEY_ALGORITHM, encryptionKey);
            if (configChecksum == null) {
                removePluginCacheData(id);

                sendEvent("onError", bundleOf(
                    "message" to "Failed to cache plugin ${id}. CFG"
                ));
                return@launch;
            }
            SecureStorage.setItemAsync("${id}-cfg-checksum", configChecksum);

            val dataChecksum = FileSystem.saveEncryptedPluginBinaries(data.binaries, combinePaths("${id}.plug"), encryptionKey, ALGORITHM, SECRET_KEY_ALGORITHM);
            if (dataChecksum == null) {
                removePluginCacheData(id);

                sendEvent("onError", bundleOf(
                    "message" to "Failed to cache plugin ${id}. BINARIES"
                ));
                return@launch;
            }
            SecureStorage.setItemAsync("${id}-bin-checksum", dataChecksum);

            appendCachedPlugin(id);
        }
    }
}