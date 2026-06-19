export const connectWallet = async () => {
  try {
    const { requestAccess, setAllowed, getUserInfo, isConnected } = await import("@stellar/freighter-api");
    
    const connected = await isConnected();
    if (!connected) {
      if (window.confirm("Freighter Wallet is not installed or not detected! Do you want to play in Demo Mode instead? (Demo Modunda oynamak ister misin?)")) {
        return "GA_MOCK_WALLET_DEMO_ACCOUNT_FOR_HACKATHON";
      }
      return null;
    }

    const isAllowed = await setAllowed();
    if (isAllowed) {
      const userInfo = await getUserInfo();
      return userInfo.publicKey;
    }
    
    const access = await requestAccess();
    if (access) {
      const userInfo = await getUserInfo();
      return userInfo.publicKey;
    }
  } catch (error) {
    console.error("Wallet connection failed:", error);
    if (window.confirm("Connection to Freighter failed or was rejected. Do you want to play in Demo Mode instead? (Demo Modunda oynamak ister misin?)")) {
      return "GA_MOCK_WALLET_DEMO_ACCOUNT_FOR_HACKATHON";
    }
    return null;
  }
};

export const simulateTrade = async (fromAsset, toAsset, amount) => {
  console.log(`Simulating trade: ${amount} ${fromAsset} for ${toAsset}`);
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(true); 
    }, 2000);
  });
};
