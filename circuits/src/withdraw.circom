pragma circom 2.0.0;

include "../../node_modules/circomlib/circuits/poseidon.circom";
include "../../node_modules/circomlib/circuits/bitify.circom";

// Computes Poseidon(left, right)
template HashLeftRight() {
    signal input left;
    signal input right;
    signal output hash;

    component hasher = Poseidon(2);
    hasher.inputs[0] <== left;
    hasher.inputs[1] <== right;
    hash <== hasher.out;
}

// Selects (left, right) based on direction bit:
// if s == 0: out[0] = in[0], out[1] = in[1]
// if s == 1: out[0] = in[1], out[1] = in[0]
template DualMux() {
    signal input in[2];
    signal input s;
    signal output out[2];

    s * (1 - s) === 0; // s must be boolean (0 or 1)
    out[0] <== (in[1] - in[0]) * s + in[0];
    out[1] <== (in[0] - in[1]) * s + in[1];
}

// Verifies that a leaf exists in a Merkle Tree with given root
template MerkleTreeChecker(levels) {
    signal input leaf;
    signal input root;
    signal input pathElements[levels];
    signal input pathIndices[levels];

    component mux[levels];
    component hashers[levels];

    signal current[levels + 1];
    current[0] <== leaf;

    for (var i = 0; i < levels; i++) {
        mux[i] = DualMux();
        mux[i].in[0] <== current[i];
        mux[i].in[1] <== pathElements[i];
        mux[i].s <== pathIndices[i];

        hashers[i] = HashLeftRight();
        hashers[i].left <== mux[i].out[0];
        hashers[i].right <== mux[i].out[1];

        current[i + 1] <== hashers[i].hash;
    }

    // Constraint: calculated root must equal public root
    root === current[levels];
}

// Spectre Shielded Withdraw Circuit
// levels = depth of Merkle Tree (e.g. 10 levels = up to 1024 commitments in testnet)
template Withdraw(levels) {
    // --- Public Inputs ---
    signal input root;
    signal input nullifierHash;
    signal input recipient; // Public recipient address to prevent frontrunning
    signal input relayer;   // Public relayer address (or 0)
    signal input fee;       // Relayer fee
    signal input asset;     // ERC20 token address or address(0) for ETH

    // --- Private Inputs ---
    signal input nullifier; // Secret nullifier scalar
    signal input secret;    // Secret note blinding factor
    signal input amount;    // Amount shielded
    signal input pathElements[levels];
    signal input pathIndices[levels];

    // 1. Calculate Commitment = Poseidon(asset, amount, nullifier, secret)
    component commitmentHasher = Poseidon(4);
    commitmentHasher.inputs[0] <== asset;
    commitmentHasher.inputs[1] <== amount;
    commitmentHasher.inputs[2] <== nullifier;
    commitmentHasher.inputs[3] <== secret;
    signal leaf <== commitmentHasher.out;

    // 2. Calculate NullifierHash = Poseidon(nullifier)
    component nullifierHasher = Poseidon(1);
    nullifierHasher.inputs[0] <== nullifier;
    nullifierHash === nullifierHasher.out;

    // 3. Verify Merkle Membership against Root
    component treeChecker = MerkleTreeChecker(levels);
    treeChecker.leaf <== leaf;
    treeChecker.root <== root;
    for (var i = 0; i < levels; i++) {
        treeChecker.pathElements[i] <== pathElements[i];
        treeChecker.pathIndices[i] <== pathIndices[i];
    }

    // 4. Dummy constraints to bind recipient, relayer, fee, and asset to the proof
    // Prevents tampering of transaction arguments by public mempool frontrunners
    signal recipientSquare;
    recipientSquare <== recipient * recipient;
    signal feeSquare;
    feeSquare <== fee * fee;
    signal relayerSquare;
    relayerSquare <== relayer * relayer;
}

component main {public [root, nullifierHash, recipient, relayer, fee, asset]} = Withdraw(10);
