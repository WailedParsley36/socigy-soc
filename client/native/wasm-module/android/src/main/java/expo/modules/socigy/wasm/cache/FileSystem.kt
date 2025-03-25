package expo.modules.socigy.wasm.cache

import com.google.gson.Gson
import com.google.gson.JsonSyntaxException

import java.io.File
import java.io.FileReader
import java.io.IOException
import java.nio.charset.Charset
import java.nio.file.attribute.BasicFileAttributes
import java.nio.file.Files
import java.nio.file.Paths
import java.nio.file.Path
import java.nio.file.StandardOpenOption

import java.security.spec.KeySpec
import java.security.MessageDigest

import javax.crypto.Cipher
import javax.crypto.SecretKeyFactory
import javax.crypto.spec.PBEKeySpec
import javax.crypto.spec.SecretKeySpec
import javax.crypto.spec.IvParameterSpec

import java.util.Base64
import java.security.SecureRandom

import android.content.Context

class FileSystem(context: Context) {
    fun deleteFile(filePath: String) {
        val path = Paths.get(filePath)
        try {
            Files.delete(path)
        } catch (e: IOException) {
            println("Error deleting file: ${e.message}")
        }
    }
    fun createFile(filePath: String): Path {
        val path = Paths.get(filePath)
        return try {
            if (!Files.exists(path)) {
                Files.createFile(path)
            } else {
                println("File already exists.")
                path
            }
        } catch (e: IOException) {
            println("Error creating file: ${e.message}")
            throw e
        }
    }

    fun listFilesInDirectory(directoryPath: String): List<String> {
        val path = Paths.get(directoryPath)
        return try {
            if (Files.isDirectory(path)) {
                Files.walk(path).filter { Files.isRegularFile(it) }
                    .map { it.toString() }
                    .toList()
            } else {
                println("Provided path is not a directory.")
                emptyList()
            }
        } catch (e: IOException) {
            println("Error listing files: ${e.message}")
            emptyList()
        }
    }
    fun fileExists(filePath: String): Boolean {
        val path = Paths.get(filePath)
        return Files.exists(path)
    }

    inline fun <reified T> readEncryptedJsonAtPath(path: String, checksum: String, algorithm: String, keyAlgorithm: String, encryptionKey: String): T? {
        return try {
            val encryptedContent = readBytesFrom(path) ?: return null;
            val decryptedBytes = decryptAES(checksum, algorithm, keyAlgorithm, encryptedContent, encryptionKey) ?: return null
            val decryptedJson = String(decryptedBytes, Charsets.UTF_8);

            Gson().fromJson(decryptedJson, T::class.java)
        } catch (e: IOException) {
            println("Error reading JSON data from file: ${e.message}")
            null
        } catch (e: JsonSyntaxException) {
            println("Error parsing JSON data: ${e.message}")
            null
        }
    }
    fun readEncryptedPluginBinaries(filePath: String, checksum: String, encryptionKey: String, algorithm: String, keyAlgorithm: String): ByteArray? {
        return try {
            val encryptedContent = readBytesFrom(filePath) ?: return null;
            val decryptedBytes = decryptAES(checksum, algorithm, keyAlgorithm, encryptedContent, encryptionKey) ?: return null

            decryptedBytes
        } catch (e: IOException) {
            println("Error reading binary data from file: ${e.message}")
            null
        }
    }

    fun <T> saveEncryptedObjectTo(filePath: String, data: T, algorithm: String, keyAlgorithm: String, encryptionKey: String): String? {
        val gson = Gson()
        val jsonData = gson.toJson(data)
        val (encryptedData, checksum) = encryptAES(algorithm, keyAlgorithm, jsonData.toByteArray(Charsets.UTF_8), encryptionKey)

        if (!writeBytesTo(filePath, encryptedData)) {
            return null
        }
        
        return checksum
    }
    fun saveEncryptedPluginBinaries(data: ByteArray, filePath: String, encryptionKey: String, algorithm: String, keyAlgorithm: String): String? {
        val (encryptedData, checksum) = encryptAES(algorithm, keyAlgorithm, data, encryptionKey)

        if (!writeBytesTo(filePath, encryptedData)) {
            return null
        }
        
        return checksum
    }

    private fun writeBytesTo(filePath: String, data: ByteArray): Boolean {
        val path = Paths.get(filePath)
        try {
            Files.write(path, data, StandardOpenOption.CREATE, StandardOpenOption.WRITE)
            return true
        } catch (e: IOException) {
            println("Error writing binary data to file: ${e.message}")
            return false
        }
    }
    fun readBytesFrom(filePath: String): ByteArray? {
        val path = Paths.get(filePath)
        return try {
            Files.readAllBytes(path) 
        } catch (e: IOException) {
            println("Error reading binary data from file: ${e.message}")
            null
        }
    }

    private fun generateAESKey(keyAlgorithm: String, encryptionKey: String): SecretKeySpec {
        // TODO: SEC - Generate salt and pass it down here
        val salt = "someFixedSaltValue".toByteArray() 
        val factory = SecretKeyFactory.getInstance(keyAlgorithm)
        val spec: KeySpec = PBEKeySpec(encryptionKey.toCharArray(), salt, 65536, 256)
        val secretKey = factory.generateSecret(spec)
        return SecretKeySpec(secretKey.encoded, "AES")
    }

    fun decryptAES(expectedChecksum: String, algorithm: String, keyAlgorithm: String, decodedBytes: ByteArray, encryptionKey: String): ByteArray? {
        return try {
            val checksum = computeChecksum(decodedBytes);
            if (checksum != expectedChecksum) {
                println("Error: Checksum mismatch! The data may have been corrupted or tampered with.")
                return null
            }
    
            val iv = decodedBytes.copyOfRange(0, 16)
            val encryptedBytes = decodedBytes.copyOfRange(16, decodedBytes.size)
    
            val cipher = Cipher.getInstance(algorithm)
            val secretKeySpec = generateAESKey(keyAlgorithm, encryptionKey)
            val ivSpec = IvParameterSpec(iv)
    
            cipher.init(Cipher.DECRYPT_MODE, secretKeySpec, ivSpec)
            val decryptedBytes = cipher.doFinal(encryptedBytes)
    
            decryptedBytes
        } catch (e: Exception) {
            println("Decryption failed: ${e.message}")
            null
        }
    }

    private fun encryptAES(algorithm: String, keyAlgorithm: String, data: ByteArray, encryptionKey: String): Pair<ByteArray, String> {
        val cipher = Cipher.getInstance(algorithm)
        val secretKeySpec = generateAESKey(keyAlgorithm, encryptionKey)
    
        val iv = ByteArray(16)
        SecureRandom().nextBytes(iv) // Generate a random IV
        val ivSpec = IvParameterSpec(iv)
    
        cipher.init(Cipher.ENCRYPT_MODE, secretKeySpec, ivSpec)
        val encryptedBytes = cipher.doFinal(data)
        
        val allBytes = iv + encryptedBytes;
        return Pair(allBytes, computeChecksum(allBytes)) // Prepend IV
    }

    private fun computeChecksum(data: ByteArray): String {
        val sha256 = MessageDigest.getInstance("SHA-256")
        val checksum = sha256.digest(data)

        return Base64.getEncoder().encodeToString(checksum)
    }
}