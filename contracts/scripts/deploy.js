import hre from "hardhat";

async function main() {
  const Escrow = await hre.ethers.getContractFactory("ChogTipEscrow");
  const escrow = await Escrow.deploy();
  await escrow.waitForDeployment();
  console.log("CONTRACT_ADDRESS=" + await escrow.getAddress());
}
main().catch(console.error);
