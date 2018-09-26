const SampleToken = artifacts.require("./SampleToken.sol");


//TODO
function token(amount, decimals = 18) {
  const _amount = new web3.BigNumber(amount);
  const _multiplier = new web3.BigNumber(Math.pow(10, decimals));

  const tokens = _amount.times(_multiplier);

  return tokens;
}

module.exports = function (deployer, network, accounts) {
  this.maxTokenAmount = token(100 * Math.pow(10, 6));
  deployer.deploy(SampleToken, this.maxTokenAmount, {
    from: accounts[0]
  });
};