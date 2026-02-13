// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract CivicGuardRegistry {
    struct Issuer {
        string issuerDID;
        string name;
        string domain;
        uint8 trustScore;
        bool isActive;
        bool isVerified;
        uint256 totalIssued;
        uint256 totalRevoked;
    }

    address public owner;
    mapping(string => Issuer) private issuers;

    event IssuerRegistered(string issuerDID, string name, string domain);
    event IssuerUpdated(string issuerDID, uint8 trustScore, bool isActive, bool isVerified);
    event CredentialIssued(string issuerDID, bytes32 credentialHash);
    event CredentialRevoked(string issuerDID, bytes32 credentialHash);

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    function registerIssuer(
        string calldata issuerDID,
        string calldata name,
        string calldata domain,
        uint8 trustScore,
        bool isVerified
    ) external onlyOwner {
        require(bytes(issuerDID).length > 0, "issuerDID required");
        Issuer storage issuer = issuers[issuerDID];
        issuer.issuerDID = issuerDID;
        issuer.name = name;
        issuer.domain = domain;
        issuer.trustScore = trustScore;
        issuer.isActive = true;
        issuer.isVerified = isVerified;

        emit IssuerRegistered(issuerDID, name, domain);
    }

    function updateIssuer(
        string calldata issuerDID,
        uint8 trustScore,
        bool isActive,
        bool isVerified
    ) external onlyOwner {
        Issuer storage issuer = issuers[issuerDID];
        require(bytes(issuer.issuerDID).length > 0, "Issuer not found");
        issuer.trustScore = trustScore;
        issuer.isActive = isActive;
        issuer.isVerified = isVerified;

        emit IssuerUpdated(issuerDID, trustScore, isActive, isVerified);
    }

    function markIssued(string calldata issuerDID, bytes32 credentialHash) external onlyOwner {
        Issuer storage issuer = issuers[issuerDID];
        require(bytes(issuer.issuerDID).length > 0, "Issuer not found");
        issuer.totalIssued += 1;
        emit CredentialIssued(issuerDID, credentialHash);
    }

    function markRevoked(string calldata issuerDID, bytes32 credentialHash) external onlyOwner {
        Issuer storage issuer = issuers[issuerDID];
        require(bytes(issuer.issuerDID).length > 0, "Issuer not found");
        issuer.totalRevoked += 1;
        emit CredentialRevoked(issuerDID, credentialHash);
    }

    function getIssuer(string calldata issuerDID)
        external
        view
        returns (
            string memory name,
            string memory domain,
            uint8 trustScore,
            bool isActive,
            bool isVerified,
            uint256 totalIssued,
            uint256 totalRevoked
        )
    {
        Issuer storage issuer = issuers[issuerDID];
        require(bytes(issuer.issuerDID).length > 0, "Issuer not found");
        return (
            issuer.name,
            issuer.domain,
            issuer.trustScore,
            issuer.isActive,
            issuer.isVerified,
            issuer.totalIssued,
            issuer.totalRevoked
        );
    }
}

