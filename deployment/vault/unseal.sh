NAMESPACE="vault"
POD="vault-0"
KEYS_FILE="vault-keys.txt"

echo "✅ Vault is already initialized. Keys stored in $KEYS_FILE."

# Step 2: Extract the unseal keys and root token without jq
UNSEAL_KEYS=($(grep "Unseal Key" $KEYS_FILE | awk '{print $NF}'))
ROOT_TOKEN=$(grep "Initial Root Token" $KEYS_FILE | awk '{print $NF}')

echo "🛠 Unsealing Vault..."

# Step 3: Unseal Vault using the first 3 keys
for i in {0..2}; do
    kubectl exec -n $NAMESPACE $POD -- vault operator unseal "${UNSEAL_KEYS[$i]}"
done

echo "✅ Vault unsealed successfully!"
echo "🗝 Root Token: $ROOT_TOKEN (also stored in $KEYS_FILE)"

# Step 4: Verify Vault status
kubectl exec -n $NAMESPACE $POD -- vault status
