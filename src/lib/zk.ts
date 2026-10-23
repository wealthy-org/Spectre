import { buildPoseidon, type Poseidon } from "circomlibjs";

let poseidonInstance: Poseidon | null = null;

export async function getPoseidon(): Promise<Poseidon> {
  if (!poseidonInstance) {
    poseidonInstance = await buildPoseidon();
  }
  return poseidonInstance;
}

/**
 * Formats a BigInt or hex string to a field element string
 */
export function toField(val: string | bigint | number): string {
  return BigInt(val).toString();
}

/**
 * Computes Poseidon hash of an array of inputs
 */
export async function poseidonHash(inputs: (string | bigint | number)[]): Promise<bigint> {
  const poseidon = await getPoseidon();
  const fieldInputs = inputs.map((x) => BigInt(x));
  const res = poseidon(fieldInputs);
  return BigInt(poseidon.F.toString(res));
}

export interface ShieldedNote {
  asset: string;
  amount: bigint;
  nullifier: bigint;
  secret: bigint;
  commitment: bigint;
  nullifierHash: bigint;
}

/**
 * Creates a deterministic or random shielded note
 */
export async function createNote(
  asset: string,
  amount: bigint,
  nullifier?: bigint,
  secret?: bigint
): Promise<ShieldedNote> {
  // Generate random 248-bit numbers if not provided
  const randomBigInt = () => {
    const arr = new Uint8Array(31);
    crypto.getRandomValues(arr);
    return BigInt("0x" + Array.from(arr).map((b) => b.toString(16).padStart(2, "0")).join(""));
  };

  const n = nullifier ?? randomBigInt();
  const s = secret ?? randomBigInt();

  // Commitment = Poseidon(asset, amount, nullifier, secret)
  const commitment = await poseidonHash([asset, amount, n, s]);
  // NullifierHash = Poseidon(nullifier)
  const nullifierHash = await poseidonHash([n]);

  return {
    asset,
    amount,
    nullifier: n,
    secret: s,
    commitment,
    nullifierHash,
  };
}

export interface ZkProofCallData {
  a: [string, string];
  b: [[string, string], [string, string]];
  c: [string, string];
  input: string[];
}

/**
 * Generates a Groth16 ZK proof using snarkjs in the client/browser
 */
export async function generateWithdrawProof(params: {
  note: ShieldedNote;
  root: bigint;
  pathElements: bigint[];
  pathIndices: number[];
  recipient: string;
  relayer?: string;
  fee?: bigint;
}): Promise<ZkProofCallData> {
  // Dynamically import snarkjs in browser context
  // @ts-expect-error snarkjs is imported dynamically
  const snarkjs = await import("snarkjs");

  const recipientField = BigInt(params.recipient).toString();
  const relayerField = BigInt(params.relayer ?? "0x0").toString();
  const feeField = (params.fee ?? 0n).toString();
  const assetField = BigInt(params.note.asset).toString();

  // Pad pathElements to length 10
  const paddedElements = [...params.pathElements];
  const paddedIndices = [...params.pathIndices];
  while (paddedElements.length < 10) {
    paddedElements.push(0n);
    paddedIndices.push(0);
  }

  const circuitInputs = {
    root: params.root.toString(),
    nullifierHash: params.note.nullifierHash.toString(),
    recipient: recipientField,
    relayer: relayerField,
    fee: feeField,
    asset: assetField,
    nullifier: params.note.nullifier.toString(),
    secret: params.note.secret.toString(),
    amount: params.note.amount.toString(),
    pathElements: paddedElements.map((x) => x.toString()),
    pathIndices: paddedIndices.map((x) => x.toString()),
  };

  const wasmPath = "/circuits/withdraw.wasm";
  const zkeyPath = "/circuits/withdraw_final.zkey";

  const { proof, publicSignals } = await snarkjs.groth16.fullProve(
    circuitInputs,
    wasmPath,
    zkeyPath
  );

  return {
    a: [proof.pi_a[0], proof.pi_a[1]],
    b: [
      [proof.pi_b[0][1], proof.pi_b[0][0]],
      [proof.pi_b[1][1], proof.pi_b[1][0]],
    ],
    c: [proof.pi_c[0], proof.pi_c[1]],
    input: publicSignals,
  };
}
