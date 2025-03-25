package expo.modules.socigy.wasm.cache
import expo.modules.socigy.wasm.structures.permissions.PermissionDeclaration

data class PluginConfiguration(
    val name: String,
    val version: String,
    val apiVersion: String,
    val authors: List<String>,
    val description: String,
    val language: String,
    val permissions: Map<String, PermissionDeclaration>,
)

public data class PluginModuleData(val binaries: ByteArray, val config: PluginConfiguration);