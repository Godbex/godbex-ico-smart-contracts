import ether from './helpers/ether';
import token from './helpers/token';
import {
  advanceBlock
} from './helpers/advanceToBlock';
import {
  increaseTimeTo
} from './helpers/increaseTime';
import EVMRevert from './helpers/EVMRevert';
import shared from "./shared";

const BigNumber = web3.BigNumber;

require('chai')
  .use(require('chai-as-promised'))
  .use(require('chai-bignumber')(BigNumber))
  .should();


contract('SampleCrowdsale: timed', function ([owner, investor, wallet, purchaser]) {
  const rate = new BigNumber(1);
  const value = ether(1);
  const goal = ether(3);
  const cap = ether(5);
  const minimumInvestment = ether(1);
  const capInvestor = cap;
  const capPurchaser = cap;
  const maxTokenAmount = token(100 * Math.pow(10, 6));

  before(async function () {
    // Advance to the next block to correctly read time in the solidity "now" function interpreted by ganache
    await advanceBlock();
  });

  beforeEach(async function () {
    await shared.setupEnvironment.call(this, owner, wallet, rate, cap, goal, minimumInvestment, maxTokenAmount);
    await this.crowdsale.addToWhitelist(investor);
    await this.crowdsale.addToWhitelist(purchaser);
  });

  it('should be ended only after end', async function () {
    let ended = await this.crowdsale.hasClosed();
    ended.should.equal(false);
    await increaseTimeTo(this.afterClosingTime);
    ended = await this.crowdsale.hasClosed();
    ended.should.equal(true);
  });

  describe('accepting payments', function () {
    it('should reject payments before start', async function () {
      await this.crowdsale.send(value).should.be.rejectedWith(EVMRevert);
      await this.crowdsale.buyTokens(investor, {
        from: purchaser,
        value: value
      }).should.be.rejectedWith(EVMRevert);
    });

    it('should accept payments after start', async function () {
      await increaseTimeTo(this.afterOpeningTime);
      await this.crowdsale.sendTransaction({
        value: value,
        from: investor
      }).should.be.fulfilled;

      await this.crowdsale.buyTokens(investor, {
        value: value,
        from: purchaser
      }).should.be.fulfilled;
    });

    it('should reject payments after end', async function () {
      await increaseTimeTo(this.afterClosingTime);
      await this.crowdsale.send(value).should.be.rejectedWith(EVMRevert);
      await this.crowdsale.buyTokens(investor, {
        value: value,
        from: purchaser
      }).should.be.rejectedWith(EVMRevert);
    });
  });
});