package expo.modules.passkeys

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.kotlin.Promise
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch

import CreatePasskeyRequest
import GetPasskeyRequest
import UserRecord
import RpRecord

import com.google.gson.Gson

import androidx.credentials.CreatePublicKeyCredentialRequest
import androidx.credentials.CredentialManager
import androidx.credentials.GetCredentialRequest
import androidx.credentials.GetPublicKeyCredentialOption
import androidx.credentials.exceptions.*
import androidx.credentials.exceptions.publickeycredential.CreatePublicKeyCredentialDomException
import androidx.credentials.exceptions.publickeycredential.GetPublicKeyCredentialDomException
import java.io.PrintWriter
import java.io.StringWriter

import android.util.Log

class ExpoPasskeysModule : Module() {
  private val minSDKApi = 28;
  private val mainScope = CoroutineScope(Dispatchers.Default)

  private fun newPasskeyCreationRequest(challenge: String, user: UserRecord, rp: RpRecord, timeout: Long): String {
    return Gson().toJson(
        CreatePasskeyRequest(
            challenge = challenge,
            rp = CreatePasskeyRequest.Rp(
                name = rp.name,
                id = rp.id
            ),
            user = CreatePasskeyRequest.User(
                id = user.id,
                name = user.name,
                displayName = user.displayName
            ),
            pubKeyCredParams = listOf(
                CreatePasskeyRequest.PubKeyCredParams(
                    type = "public-key",
                    alg = -7
                ),
                CreatePasskeyRequest.PubKeyCredParams(
                    type = "public-key",
                    alg = -257
                )
            ),
            timeout = timeout,
            attestation = "direct",
            excludeCredentials = emptyList(),
            authenticatorSelection = CreatePasskeyRequest.AuthenticatorSelection(
                authenticatorAttachment = "platform",
                requireResidentKey = false,
                residentKey = "required",
                userVerification = "required"
            )
        )
    )
  }

  private fun newPasskeySignInRequest(challenge: String, user: UserRecord, rp: RpRecord, timeout: Long): String {
    return Gson().toJson(
        GetPasskeyRequest(
            challenge = challenge,
            allowCredentials = listOf(),
            timeout = timeout,
            userVerification = "required", 
            rpId = rp.id
        )
    )
  }
  
  override fun definition() = ModuleDefinition {
    Name("ExpoPasskeys")
    
    Function("isSupported") {
      val currentApiLevel = android.os.Build.VERSION.SDK_INT

      return@Function currentApiLevel >= minSDKApi 
    }

    Function("isAutofillAvailable") {
      return@Function false;
    }

    AsyncFunction("createAsync") { challenge: String, user: UserRecord, rp: RpRecord, timeout: Long, promise: Promise ->
      mainScope.launch {
        val credentialManager = CredentialManager.create(appContext.reactContext?.applicationContext!!)
        val jsonRequest = newPasskeyCreationRequest(challenge, user, rp, timeout)
        val request = CreatePublicKeyCredentialRequest(jsonRequest)

        try {
          val newCred = (appContext.currentActivity?.let {
            credentialManager.createCredential(it, request);
          })?.data;
  
          val credJson = newCred?.getString("androidx.credentials.BUNDLE_KEY_REGISTRATION_RESPONSE_JSON")
          promise.resolve(credJson);
        }
        catch (e: CreateCredentialException) {
          val (errorCode, errorMessage) = handleCreationError(e)
          promise.reject(errorCode, errorMessage, e)
        }
      }
    }

    AsyncFunction("signInAsync") { challenge: String, user: UserRecord, rp: RpRecord, timeout: Long, promise: Promise ->
      mainScope.launch {
        val credentialManager = CredentialManager.create(appContext.reactContext?.applicationContext!!)
        val jsonRequest = newPasskeySignInRequest(challenge, user, rp, timeout)
        val request = GetCredentialRequest(listOf(GetPublicKeyCredentialOption(jsonRequest)))

        try {
            val cred = (appContext.currentActivity?.let {
              credentialManager.getCredential(it, request);
            })?.credential?.data;

            // Handle the response (returning JSON or other data)
            val responseJson = cred?.getString("androidx.credentials.BUNDLE_KEY_AUTHENTICATION_RESPONSE_JSON")

            // Resolve the promise with the authentication response
            promise.resolve(responseJson)
        } catch (e: GetCredentialException) {
            // Handle errors during the sign-in process
            val (errorCode, errorMessage) = handleAuthenticationError(e)
            promise.reject(errorCode, errorMessage, e)
        }
      }
    }
  }

  private fun handleCreationError(e: CreateCredentialException): Pair<String, String> {
    val stackTrace = StringWriter().apply {
        PrintWriter(this).use { pw ->
            e.printStackTrace(pw)
        }
    }.toString()

    return when (e) {
        is CreatePublicKeyCredentialDomException -> {
            // DOM errors according to WebAuthn spec; log the domError type for details
            "DOM_ERROR" to "${e.domError.toString()}\nStack Trace:\n$stackTrace"
        }
        is CreateCredentialCancellationException -> {
            // User canceled the operation
            "USER_CANCELLED" to "The user canceled the passkey creation.\nStack Trace:\n$stackTrace"
        }
        is CreateCredentialInterruptedException -> {
            // Retry-able error; log for inspection
            "INTERRUPTED_ERROR" to "Credential creation was interrupted: ${e.message}\nStack Trace:\n$stackTrace"
        }
        is CreateCredentialProviderConfigurationException -> {
            // Missing provider configuration dependency
            "CONFIGURATION_ERROR" to "App is missing provider configuration dependency.\nStack Trace:\n$stackTrace"
        }
        is CreateCredentialUnknownException -> {
            // Unknown error, logging cause for more info
            "UNKNOWN_ERROR" to "Unknown error occurred: ${e.message}, Cause: ${e.cause}\nStack Trace:\n$stackTrace"
        }
        else -> {
            // Catch-all for any other types
            "GENERAL_ERROR" to "An error occurred: ${e.localizedMessage ?: e.toString()}\nStack Trace:\n$stackTrace"
        }
    }
  }

  private fun handleAuthenticationError(e: GetCredentialException): Pair<String, String> {
    val stackTrace = StringWriter().apply {
      PrintWriter(this).use { pw ->
          e.printStackTrace(pw)
      }
    }.toString()

    return when (e) {
      is GetPublicKeyCredentialDomException -> {
        // DOM errors according to WebAuthn spec; log the domError type for details
        "DOM_ERROR" to "${e.domError.toString()}\nStack Trace:\n$stackTrace"
      }
      is GetCredentialCancellationException -> {
          // User canceled the operation
          "USER_CANCELLED" to "The user canceled the credential retrieval.\nStack Trace:\n$stackTrace"
      }
      is GetCredentialInterruptedException -> {
          // Retry-able error; log for inspection
          "INTERRUPTED_ERROR" to "Credential retrieval was interrupted: ${e.message}\nStack Trace:\n$stackTrace"
      }
      is GetCredentialProviderConfigurationException -> {
          // Missing provider configuration dependency
          "CONFIGURATION_ERROR" to "App is missing provider configuration dependency.\nStack Trace:\n$stackTrace"
      }
      is GetCredentialUnknownException -> {
          // Unknown error, logging cause for more info
          "UNKNOWN_ERROR" to "Unknown error occurred: ${e.message}, Cause: ${e.cause}\nStack Trace:\n$stackTrace"
      }
      is GetCredentialUnsupportedException -> {
          // Unsupported credential type or platform
          "NOT_SUPPORTED" to "The requested credential type is not supported.\nStack Trace:\n$stackTrace"
      }
      is NoCredentialException -> {
          // No credential available for sign-in
          "NO_CREDENTIALS" to "No credentials were found for sign-in.\nStack Trace:\n$stackTrace"
      }
      else -> {
          // Catch-all for any other types
          "GENERAL_ERROR" to "An error occurred: ${e.localizedMessage ?: e.toString()}\nStack Trace:\n$stackTrace"
      }
    }
  }
}
