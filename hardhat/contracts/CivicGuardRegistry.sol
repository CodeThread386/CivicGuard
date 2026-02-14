// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract CivicGuardRegistry {
    // Mapping: PublicHash -> List of Roles (e.g., "DOCTOR", "DRIVER")
    mapping(uint256 => string[]) public volunteerRoles;
    
    // The Government/NGO Admin
    address public admin;

    event RoleAssigned(uint256 indexed publicHash, string role);

    constructor() {
        admin = msg.sender;
    }

    modifier onlyAdmin() {
        require(msg.sender == admin, "Only Admin can assign roles");
        _;
    }

    // 1. Assign a Role (e.g., "DOCTOR") to a Volunteer's Public Hash
    function addRole(uint256 publicHash, string memory role) external onlyAdmin {
        volunteerRoles[publicHash].push(role);
        emit RoleAssigned(publicHash, role);
    }

    // 2. Fetch ALL roles for verification (Karan uses this)
    function getRoles(uint256 publicHash) external view returns (string[] memory) {
        return volunteerRoles[publicHash];
    }
}