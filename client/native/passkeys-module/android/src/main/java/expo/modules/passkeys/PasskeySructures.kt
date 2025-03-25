import com.google.gson.annotations.SerializedName
import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record

data class CreatePasskeyRequest(
    val challenge: String,
    val rp: Rp,
    val user: User,
    val pubKeyCredParams: List<PubKeyCredParams>,
    val timeout: Long,
    val attestation: String,
    val excludeCredentials: List<Any>,
    val authenticatorSelection: AuthenticatorSelection
) {
    data class Rp(
        val name: String,
        val id: String
    )

    data class User(
        val id: String,
        val name: String,
        val displayName: String
    )

    data class PubKeyCredParams(
        val type: String,
        val alg: Int
    )

    data class AuthenticatorSelection(
        val authenticatorAttachment: String,
        val requireResidentKey: Boolean,
        val residentKey: String,
        val userVerification: String
    )
}

data class GetPasskeyRequest(
    val challenge: String,
    val allowCredentials: List<AllowCredentials>,
    val timeout: Long,
    val userVerification: String,
    val rpId: String
) {
    data class AllowCredentials(
        val id: String,
        val transports: List<String>,
        val type: String
    )
}

class UserRecord : Record {
    @Field
    var id: String = ""

    @Field
    var name: String = ""

    @Field
    var displayName: String = ""
}

class RpRecord : Record {
    @Field
    var id: String = ""

    @Field
    var name: String = ""
}