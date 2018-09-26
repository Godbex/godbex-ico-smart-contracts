pragma solidity ^0.4.23;

import "openzeppelin-solidity/contracts/crowdsale/emission/MintedCrowdsale.sol";
import "openzeppelin-solidity/contracts/crowdsale/validation/CappedCrowdsale.sol";
import "openzeppelin-solidity/contracts/crowdsale/validation/WhitelistedCrowdsale.sol";
import "openzeppelin-solidity/contracts/crowdsale/validation/IndividuallyCappedCrowdsale.sol";
import "openzeppelin-solidity/contracts/crowdsale/distribution/RefundableCrowdsale.sol";
import "openzeppelin-solidity/contracts/crowdsale/distribution/PostDeliveryCrowdsale.sol";


/*
 * @title SampleCrowdsale
 * @dev The crowdsale that will gain ownership and distrubute
 * the token
 * @param _rate Rate in the public sale
 * @param _wallet The address to which the funds will be forwarded to after the crowdsale ends
 * @param _cap The hard cap
 * @param _goal The soft cap
 * @param _minimumInvestment Minimum investment allowed in public sale
 * @param _openingTime The opening time as a unix timestamp
 * @param _closingTime The closing time as a unix timestamp
 * @param _token The address of the mintable token to be deployed
 */
contract SampleCrowdsale is CappedCrowdsale, RefundableCrowdsale, MintedCrowdsale, WhitelistedCrowdsale { // solium-disable-line max-len

  uint256 public minimumInvestment;
  uint256 public initialRate;

  constructor(
    uint256 _rate,
    address _wallet,
    uint256 _cap,
    uint256 _goal,
    uint256 _minimumInvestment,
    uint256 _openingTime,
    uint256 _closingTime,
    MintableToken _token
  )
    public
    Crowdsale(_rate, _wallet, _token)
    CappedCrowdsale(_cap)
    TimedCrowdsale(_openingTime, _closingTime)
    RefundableCrowdsale(_goal)
  {
    minimumInvestment = _minimumInvestment;
    initialRate = _rate;
  }

/*
 * @title pushPrivateInvestment
 * @dev The function tracks a private investment made in currencies other than ETH.
 * For a _weiAmount calculated based on the ETH value of some other currency, a _tokenAmount
 * amount of tokens will be minted post crowdsale for the _beneficiary
 * @param _weiAmount The value in wei calculated based on the value of the external currency
 * @param _tokenAmount The amount to be minted
 * @param _beneficiary The beneficiary of the tokens
 */

  function pushPrivateInvestment(uint256 _weiAmount, uint256 _tokenAmount, address _beneficiary) external onlyOwner {
    // solium-disable-next-line security/no-block-members
    require(block.timestamp <= closingTime);
    require(_weiAmount >= minimumInvestment, "Wei amount lower than minimum investment");

    require(_beneficiary != address(0));
    require(weiRaised.add(_weiAmount) <= cap);

    _deliverTokens(_beneficiary, _tokenAmount);

    // Wei added based on external value 
    weiRaised = weiRaised.add(_weiAmount);

    // Every user that participated in private investments is whitelisted
    _addToWhitelist(_beneficiary);

    emit TokenPurchase(
      msg.sender,
      _beneficiary,
      _weiAmount,
      _tokenAmount
    );
  }

/*
 * @title changeRate
 * @dev The function sets the rate for exchanging ETH for tokens
 * Rate can be changed only if new rate value is greater than the old rate value
 * @param _newRate new rate value
 */
  function changeRate(uint256 _newRate) external onlyOwner {
    // solium-disable-next-line security/no-block-members
    require(block.timestamp <= closingTime);
    require(_newRate >= initialRate, "New rate must be greater than initial rate");

    rate = _newRate;
  }

  // -----------------------------------------
  // Internal interface (extensible)
  // -----------------------------------------

  /*
   * @dev Validation of an incoming purchase. Use require statements 
   * to revert state when conditions are not met. Use super to concatenate validations.
   * @param _beneficiary Address performing the token purchase
   * @param _weiAmount Value in wei involved in the purchase
   */
  function _preValidatePurchase(address _beneficiary, uint256 _weiAmount) internal {
    require(_weiAmount != 0);
    require(_weiAmount >= minimumInvestment, "Wei amount lower than minimum investment");
    super._preValidatePurchase(_beneficiary, _weiAmount);
  }

  /*
   * @dev Add the beneficiary to the whitelist. Used internally for private
   * investors since every private investor is automatically whitelisted.
   * minted and can be claimed post crowdsale
   * @param _beneficiary The address that will be whitelisted
   */
  function _addToWhitelist(address _beneficiary) private {
    whitelist[_beneficiary] = true;
  }
}