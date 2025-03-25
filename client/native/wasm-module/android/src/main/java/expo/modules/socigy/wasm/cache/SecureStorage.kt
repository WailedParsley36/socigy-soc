package expo.modules.socigy.wasm.cache

import android.content.Context
import android.content.SharedPreferences

import androidx.security.crypto.EncryptedSharedPreferences
import androidx.security.crypto.MasterKeys

class SecureStorage(context: Context, preferenceName: String) {
    private val sharedPreferences: SharedPreferences

    init {
        try {
            val masterKeyAlias = MasterKeys.getOrCreate(MasterKeys.AES256_GCM_SPEC)

            sharedPreferences = EncryptedSharedPreferences.create(
                preferenceName, 
                masterKeyAlias,           
                context,                 
                EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV, 
                EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM
            )
        } catch (e: Exception) {
            e.printStackTrace()
            throw e
        }
    }

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