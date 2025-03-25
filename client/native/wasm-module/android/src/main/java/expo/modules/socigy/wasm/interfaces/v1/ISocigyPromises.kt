package expo.modules.socigy.wasm

import expo.modules.kotlin.Promise
import android.webkit.JavascriptInterface

class EventHandler<T> {
    private val listeners = mutableListOf<(T) -> Unit>()

    fun addListener(listener: (T) -> Unit) {
        listeners.add(listener)
    }

    fun invokeEvent(event: T) {
        for (listener in listeners) {
            listener(event)
        }
    }
}

object PromiseWatcher {
    val Watchers = HashMap<String, EventHandler<Boolean>>(); 

    fun subscribe(promiseId: String, callback: (Boolean) -> Unit) {
        var handler = Watchers[promiseId];
        if (handler == null) {
            handler = EventHandler<Boolean>();
            Watchers[promiseId] = handler;
        }

        handler.addListener(callback);
    }

    fun invoke(promiseId: String, success: Boolean) {
        val handler = Watchers[promiseId];
        if (handler == null) {
            return;
        }

        handler.invokeEvent(success);
        Watchers.remove(promiseId)
    }
}

class ISocigyPromises(private val promiseHashMap: HashMap<String, Promise>) {
    @JavascriptInterface
    fun reject(id: String, error: String) {
        PromiseWatcher.invoke(id, false);
        
        promiseHashMap[id]?.reject("PLUGIN_EXEC_ERROR", error, null)
        promiseHashMap.remove(id)
    }

    @JavascriptInterface
    fun resolve(id: String, data: String?) {
        PromiseWatcher.invoke(id, true);

        promiseHashMap[id]?.resolve(data)
        promiseHashMap.remove(id)
    }
}