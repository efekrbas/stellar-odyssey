import { requestAccess, setAllowed, getAddress, signTransaction, isConnected } from '@stellar/freighter-api';
import { rpc, TransactionBuilder, Networks, Contract, Address, nativeToScVal, Transaction } from '@stellar/stellar-sdk';

export const connectWallet = async () => {
  try {
    const connectedRes = await isConnected();
    if (connectedRes.error || !connectedRes.isConnected) {
      alert("Freighter Wallet is not installed or not detected! Please install it from https://freighter.app/ to play.");
      return null;
    }

    const isAllowedRes = await setAllowed();
    if (isAllowedRes.error || !isAllowedRes.isAllowed) {
      const accessRes = await requestAccess();
      if (accessRes.error) {
        throw new Error(accessRes.error);
      }
      return accessRes.address;
    }
    
    const addressRes = await getAddress();
    if (addressRes.error) {
      throw new Error(addressRes.error);
    }
    return addressRes.address;
  } catch (error) {
    console.error("Wallet connection failed:", error);
    alert("Freighter error details: " + (error.message || String(error)));
    return null;
  }
};

const CONTRACT_ID = "CBIBAPAABHHJIJRLAGCANYFXI5PAEBHOYP4Q23B3MOKDEXS6TVQPNY47";
const rpcServer = new rpc.Server("https://soroban-testnet.stellar.org");

export async function saveScoreToBlockchain(score) {
  try {
    const pubKeyRes = await getAddress();
    if (pubKeyRes.error) throw new Error(pubKeyRes.error);
    const pubKey = pubKeyRes.address;

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
    
    const signedRes = await signTransaction(preparedTx.toXDR(), { networkPassphrase: Networks.TESTNET });
    if (signedRes.error) throw new Error(signedRes.error);
    
    const signedTx = TransactionBuilder.fromXDR(signedRes.signedTxXdr, Networks.TESTNET);
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
