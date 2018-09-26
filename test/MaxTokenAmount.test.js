import {
  advanceBlock
} from './helpers/advanceToBlock';
import {
  increaseTimeTo
} from './helpers/increaseTime';
import EVMRevert from './helpers/EVMRevert';
import token from './helpers/token';
import ether from './helpers/ether';
import shared from "./shared";

const BigNumber = web3.BigNumber;

require('chai')
  .use(require('chai-as-promised'))
  .use(require('chai-bignumber')(BigNumber))
  .should();

contract('SampleCrowdsale: max token amount', function ([owner, investor, wallet, purchaser]) {
  const rate = new BigNumber(100000);
  const cap = ether(500);
  const goal = ether(3);
  const minimumInvestment = 1;
  const lessThanMaxValue = ether(100);
  //(cap- ecosystem allocation)/rate
  //(100M-50M)/rate
  const maxValue = ether(500);
  const capInvestor = cap;
  const capPurchaser = cap;
  const maxTokenAmount = token(100 * Math.pow(10, 6));

  before(async function () {
    // Advance to the next block to correctly read time in the solidity "now" function interpreted by ganache
    await advanceBlock();
  });

  beforeEach(async function () {
    await shared.setupEnvironment.call(this, owner, wallet, rate, cap, goal, minimumInvestment, maxTokenAmount);
    await increaseTimeTo(this.afterOpeningTime);
    await this.crowdsale.addToWhitelist(investor);
  });

  it('should successfully buy tokens if token amount is less than maximum token amount', async function () {
    await this.crowdsale.buyTokens(investor, {
      value: lessThanMaxValue,
      from: purchaser
    }).should.be.fulfilled;
  });

  it('should successfully buy tokens until maximum token amount is reached', async function () {
    await this.crowdsale.buyTokens(investor, {
      value: lessThanMaxValue,
      from: purchaser
    }).should.be.fulfilled;
    await this.crowdsale.buyTokens(investor, {
      value: maxValue.minus(lessThanMaxValue),
      from: purchaser
    }).should.be.fulfilled;
  });

  it('should fail to buy tokens if more than maximum token amount is requested', async function () {
    await this.crowdsale.buyTokens(investor, {
      value: maxValue.plus(1),
      from: purchaser
    }).should.be.rejectedWith(EVMRevert);
  });

  it('should fail to buy tokens if maximum token amount is exceeded', async function () {
    await this.crowdsale.buyTokens(investor, {
      value: maxValue,
      from: purchaser
    }).should.be.fulfilled;
    await this.crowdsale.buyTokens(investor, {
      value: 1,
      from: purchaser
    }).should.be.rejectedWith(EVMRevert);
  });
});