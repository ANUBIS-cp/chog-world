const hre = require("hardhat");
async function main() {
  const signer = process.env.SIGNER_ADDRESS;
  if (!signer) throw new Error("SIGNER_ADDRESS not set");
  console.log("Signer:", signer);
  
  const Escrow = await hre.ethers.getContractFactory("ChogTipEscrow");
  const escrow = await Escrow.deploy(signer);
  await escrow.waitForDeployment();
  console.log("CONTRACT_ADDRESS=" + await escrow.getAddress());
}
main().catch(console.error);
