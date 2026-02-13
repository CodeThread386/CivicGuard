pragma circom 2.2.2;

// Poseidon is optimized for ZK-proofs and much faster than SHA256
include "../node_modules/circomlib/circuits/poseidon.circom";

template IdentityCheck() {
    // Private: The user's secret (kept on their phone)
    signal input secret; 
    
    // Public: The hashed ID (known to the NGO/Blockchain)
    signal input publicHash;

    // Component to hash the secret
    component hasher = Poseidon(1);
    hasher.inputs[0] <== secret;

    // The proof: The hash of the secret MUST match the publicHash
    publicHash === hasher.out;
}

// publicHash is public so the NGO can verify it against their records
component main {public [publicHash]} = IdentityCheck();