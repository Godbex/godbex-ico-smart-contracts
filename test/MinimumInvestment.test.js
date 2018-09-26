import ether from "./helpers/ether";
import token from './helpers/token';
import EVMRevert from "./helpers/EVMRevert";
import { advanceBlock } from "./helpers/advanceToBlock";
import { increaseTimeTo } from "./helpers/increaseTime";
import shared from "./shared";

const BigNumber = web3.BigNumber;

require('chai')
  .use(require('chai-as-promised'))
  .use(require('chai-bignumber')(BigNumber))
  .should();

contract('SampleCrowdsale: minimum investment', function ([owner, wallet, investor, purchaser]) {
  const rate = new BigNumber(1);
  const cap = ether(5);
  const goal = ether(3);
  const minimumInvestment = ether(1);
  const lessThanMinimumInvestment = ether(0.5);
  const maxTokenAmount = token(100 * Math.pow(10, 6));
  const capInvestor = cap;
  const capPurchaser = cap;

  before(async function () {
    // Advance to the next block to correctly read time in the solidity "now" function interpreted by ganache
    await advanceBlock();
  });

  beforeEach(async function () {
    await shared.setupEnvironment.call(this, owner, wallet, rate, cap, goal, minimumInvestment, maxTokenAmount);
    await increaseTimeTo(this.afterOpeningTime);
    await this.crowdsale.addToWhitelist(investor);
  });

  it('should deny payment if amount is lower than minimum investment value', async function () {
    await this.crowdsale.sendTransaction({
      from: investor,
      value: lessThanMinimumInvestment
    }).should.be.rejectedWith(EVMRevert);
  });

  it('should accept payment if amount is equal to minimum investment value', async function () {
    await this.crowdsale.sendTransaction({
      from: investor,
      value: minimumInvestment
    }).should.be.fulfilled;
  });

  it('should allow payment if amount is greater than minimum investment value', async function () {
    await this.crowdsale.sendTransaction({
      from: investor,
      value: minimumInvestment.add(1)
    }).should.be.fulfilled;
  });
});