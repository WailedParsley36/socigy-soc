package expo.modules.socigy.wasm.structures.permissions

data class PermissionState(val name: String, val granted: Boolean, val canAskAgain: Boolean);

data class PermissionDeclaration(
    val description: String,
    val link: String?,
    val required: Boolean?,
    val componentIds: List<String>?
)