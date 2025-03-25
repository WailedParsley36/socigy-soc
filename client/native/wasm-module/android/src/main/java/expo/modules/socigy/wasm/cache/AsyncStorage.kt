package expo.modules.socigy.wasm.cache

import android.content.Context
import android.content.SharedPreferences

class AsyncStorage(context: Context, preferenceName: String) {
    private val sharedPreferences: SharedPreferences = context.getSharedPreferences(preferenceName, Context.MODE_PRIVATE);

    fun setItemAsync(key: String, value: String) {
        sharedPreferences.edit().apply {
            putString(key, value)
            apply()
        }
    }

    fun getItem(key: String): String? {
        return sharedPreferences.getString(key, null)
    }

    fun removeItemAsync(key: String) {
        sharedPreferences.edit().apply {
            remove(key)
            apply()
        }
    }
}