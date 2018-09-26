import ether from './helpers/ether';
import token from './helpers/token';
import EVMRevert from './helpers/EVMRevert';
import shared from './shared';
import {
  advanceBlock
} from "./helpers/advanceToBlock";
import {
  increaseTimeTo
} from "./helpers/increaseTime";

const BigNumber = web3.BigNumber;

require('chai')
  .use(require('chai-as-promised'))
  .use(require('chai-bignumber')(BigNumber))
  .should();

const CappedCrowdsale = artifacts.require('SampleCrowdsale');

contract('SampleCrowdsale: capped', function ([owner, investor, wallet, purchaser]) {
  const rate = new BigNumber(1);
  const cap = ether(5);
  const goal = ether(3);
  const minimumInvestment = 1;
  const lessThanCap = ether(3);
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
    await this.crowdsale.addToWhitelist(purchaser);
  });

  describe('creating a valid crowdsale', function () {
    it('should fail with zero cap', async function () {
      await CappedCrowdsale.new(
        rate,
        wallet,
        0,
        goal,
        minimumInvestment,
        this.openingTime,
        this.closingTime,
        this.token.address
      ).should.be.rejectedWith(EVMRevert);
    });
  });

  describe('accepting payments', function () {
    it('should accept payments within cap', async function () {

      await this.crowdsale.sendTransaction({
        value: cap.minus(lessThanCap),
        from: investor
      }).should.be.fulfilled;

      await this.crowdsale.sendTransaction({
        value: lessThanCap,
        from: investor
      }).should.be.fulfilled;
    });

    it('should reject payments outside cap', async function () {
      await this.crowdsale.sendTransaction({
        value: cap,
        from: investor
      }).should.be.fulfilled;

      await this.crowdsale.sendTransaction({
        value: 1,
        from: investor
      }).should.be.rejectedWith(EVMRevert);
    
    });

    it('should reject payments that exceed cap', async function () {
      await this.crowdsale.sendTransaction({
        value: cap.plus(1),
        from: investor
      }).should.be.rejectedWith(EVMRevert);
    });
  });

  describe('ending', function () {
    it('should not reach cap if sent under cap', async function () {
      let capReached = await this.crowdsale.capReached();
      capReached.should.equal(false);
      
      await this.crowdsale.sendTransaction({
        value: cap.minus(lessThanCap),
        from: investor
      }).should.be.fulfilled;

      capReached = await this.crowdsale.capReached();
      capReached.should.equal(false);
    });

    it('should not reach cap if sent just under cap', async function () {
      await this.crowdsale.sendTransaction({
        value: cap.minus(1),
        from: investor
      }).should.be.fulfilled;

      let capReached = await this.crowdsale.capReached();
      capReached.should.equal(false);
    });

    it('should reach cap if cap sent', async function () {
      await this.crowdsale.sendTransaction({
        value: cap,
        from: investor
      }).should.be.fulfilled;

      let capReached = await this.crowdsale.capReached();
      capReached.should.equal(true);
    });
  });
});