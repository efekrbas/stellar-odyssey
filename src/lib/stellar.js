import { requestAccess, setAllowed, getPublicKey, signTransaction, isConnected } from '@stellar/freighter-api';
import { rpc, TransactionBuilder, Networks, Contract, Address, nativeToScVal, Transaction } from '@stellar/stellar-sdk';

export const connectWallet = async () => {
  try {
    const connected = await isConnected();
    if (!connected) {
      alert("Freighter Wallet is not installed or not detected! Please install it from https://freighter.app/ to play.");
      return null;
    }

    const isAllowed = await setAllowed();
    if (isAllowed) {
      return await getPublicKey();
    }
    
    const access = await requestAccess();
    if (access) {
      return await getPublicKey();
    }
  } catch (error) {
    console.error("Wallet connection failed:", error);
    alert("Connection to Freighter failed or was rejected.");
    return null;
  }
};

const CONTRACT_ID = "CBIBAPAABHHJIJRLAGCANYFXI5PAEBHOYP4Q23B3MOKDEXS6TVQPNY47";
const rpcServer = new rpc.Server("https://soroban-testnet.stellar.org");

export async function saveScoreToBlockchain(score) {
  try {
    const pubKey = await getPublicKey();
    if (!pubKey) throw new Error("Wallet not connected");

    const account = await rpcServer.getAccount(pubKey);
    const contract = new Contract(CONTRACT_ID);
    
    const args = [
      new Address(pubKey).toScVal(),
      nativeToScVal(score, { type: "u32" })
    ];

    const tx = new TransactionBuilder(account, {
      fee: "100000",
      networkPassphrase: Networks.TESTNET,
    })
      .addOperation(contract.call("save_score", ...args))
      .setTimeout(30)
      .build();

    const preparedTx = await rpcServer.prepareTransaction(tx);
    const signedXdr = await signTransaction(preparedTx.toXDR(), { network: "TESTNET" });
    
    const signedTx = TransactionBuilder.fromXDR(signedXdr, Networks.TESTNET);
    await rpcServer.sendTransaction(signedTx);
    
    return true;
  } catch (error) {
    console.error("Failed to save score:", error);
    return false;
  }
}

export const simulateTrade = async (fromAsset, toAsset, amount) => {
  console.log(`Simulating trade: ${amount} ${fromAsset} for ${toAsset}`);
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(true); 
    }, 2000);
  });
};
