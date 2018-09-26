pragma solidity ^0.4.23;

import "openzeppelin-solidity/contracts/token/ERC20/CappedToken.sol";


/*
 * @title SampleToken
 * @dev Mintable ERC20 compliant token.
 */
contract SampleToken is CappedToken {

  string public constant name = "GBE Token"; // solium-disable-line uppercase
  string public constant symbol = "GBE"; // solium-disable-line uppercase
  uint8 public constant decimals = 18; // solium-disable-line uppercase

  // 7 * (10 ** 6) * (10 ** 18) 7M tokens
  uint256 public constant advisorsAmount = 7000000000000000000000000; // solium-disable-line uppercase
  // 19 * (10 ** 6) * (10 ** 18) 19M tokens
  uint256 public constant companyAmount = 19000000000000000000000000; // solium-disable-line uppercase
  // 24 * (10 ** 6) * (10 ** 18) 24M tokens
  uint256 public constant teamAmount = 24000000000000000000000000; // solium-disable-line uppercase

  address public constant advisorsWallet = 0x0F4F2Ac550A1b4e2280d04c21cEa7EBD822934b5; // solium-disable-line uppercase
  address public constant companyWallet = 0x6330A553Fc93768F612722BB8c2eC78aC90B3bbc; // solium-disable-line uppercase
  address public constant teamWallet = 0x5AEDA56215b167893e80B4fE645BA6d5Bab767DE; // solium-disable-line uppercase

  constructor(uint256 _cap) public CappedToken(_cap){
    super.mint(advisorsWallet, advisorsAmount);
    super.mint(companyWallet, companyAmount);
    super.mint(teamWallet, teamAmount);
  }
}
