// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract PaymentProcessor {
    IERC20 public wtheta;

    // Use the actual WTHETA contract address
    constructor() {
        wtheta = IERC20(0x3883f5e181fccaF8410FA61e12b59BAd963fb645);
    }

    function processPayment(address from, uint256 amount) external {
        require(wtheta.transferFrom(from, address(this), amount), "Transfer failed");
    }

    function getBalance(address account) external view returns (uint256) {
        return wtheta.balanceOf(account);
    }
}

