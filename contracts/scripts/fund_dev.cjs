const { ethers } = require("ethers");

async function main() {
  const provider = new ethers.JsonRpcProvider("https://testnet-rpc.monad.xyz");
  const wallet = new ethers.Wallet(process.env.BOT_WALLET_PRIVATE_KEY, provider);
  const devAddr = "0xa1e109bACa7d4edBa018cdDe561451Cd6cf06235";
  
  const tx = await wallet.sendTransaction({
    to: devAddr,
    value: ethers.parseEther("0.5"),
  });
  console.log("Funded:", tx.hash);
}
main().catch(console.error);
