// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

// Lesson 13 pattern: server-signed claims
// Server verifies X handle ownership, signs claim, contract verifies signer
contract ChogTipEscrow {
    address public owner;
    address public authorizedSigner;

    mapping(string => uint256) public pending;
    mapping(string => address) public claimedBy;
    mapping(address => uint256) public withdrawn;

    event TipReceived(address indexed tipper, string indexed xHandle, bytes32 tweetId, uint256 amount);
    event Claimed(address indexed creator, string xHandle, uint256 amount);
    event SignerUpdated(address oldSigner, address newSigner);

    constructor(address _signer) {
        owner = msg.sender;
        authorizedSigner = _signer;
    }

    function tip(string calldata xHandle, bytes32 tweetId) external payable {
        require(msg.value > 0, "Tip must be > 0");
        require(bytes(xHandle).length > 0, "Handle required");
        pending[xHandle] += msg.value;
        emit TipReceived(msg.sender, xHandle, tweetId, msg.value);
    }

    // Lesson 13 pattern: claim requires a server-signed authorization
    // Server verifies X handle → signs (creator, xHandle) → creator submits
    function claim(string calldata xHandle, bytes calldata signature) external {
        require(claimedBy[xHandle] == address(0) || claimedBy[xHandle] == msg.sender, "Handle claimed by another");

        bytes32 messageHash = keccak256(abi.encodePacked(msg.sender, xHandle));
        bytes32 ethSignedHash = keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", messageHash));
        address recovered = recoverSigner(ethSignedHash, signature);
        require(recovered == authorizedSigner, "Invalid signature");

        uint256 amount = pending[xHandle];
        require(amount > 0, "No pending tips");

        pending[xHandle] = 0;
        claimedBy[xHandle] = msg.sender;
        (bool ok, ) = payable(msg.sender).call{value: amount}("");
        require(ok, "Transfer failed");
        withdrawn[msg.sender] += amount;
        emit Claimed(msg.sender, xHandle, amount);
    }

    function setSigner(address _signer) external {
        require(msg.sender == owner, "Only owner");
        emit SignerUpdated(authorizedSigner, _signer);
        authorizedSigner = _signer;
    }

    function recoverSigner(bytes32 hash, bytes memory sig) internal pure returns (address) {
        require(sig.length == 65, "Invalid sig length");
        bytes32 r; bytes32 s; uint8 v;
        assembly {
            r := mload(add(sig, 32))
            s := mload(add(sig, 64))
            v := byte(0, mload(add(sig, 96)))
        }
        if (v < 27) v += 27;
        require(v == 27 || v == 28, "Invalid v");
        return ecrecover(hash, v, r, s);
    }
}
