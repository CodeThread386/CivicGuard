// @ts-ignore
export async function generateProof(rawPrivateKey: string) {
  const snarkjs = await import('snarkjs');
  const circomlibjs = await import('circomlibjs');
  
  const poseidon = await circomlibjs.buildPoseidon();
  
  // BN128 scalar field size
  const SNARK_FIELD_SIZE = BigInt("21888242871839275222246405745257275088548364400416034343698204186575808495617");
  
  // Format the secret to fit in the field
  const numericSecret = (BigInt(rawPrivateKey) % SNARK_FIELD_SIZE).toString(10);
  
  // specific hashing for the circuit input
  const hashBytes = poseidon([numericSecret]);
  const realPublicHash = poseidon.F.toString(hashBytes);

  console.log("Generating proof with:", { secret: numericSecret, publicHash: realPublicHash });

  const { proof, publicSignals } = await snarkjs.groth16.fullProve(
    { secret: numericSecret, publicHash: realPublicHash },
    "/zk/credential.wasm", 
    "/zk/credential_final.zkey"
  );
  
  return { proof, publicSignals };
}
