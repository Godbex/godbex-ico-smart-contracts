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

contract('SampleCrowdsale: change rate', function ([owner, wallet, notOwner]) {
  const rate = new BigNumber(1);
  const cap = ether(5);
  const goal = ether(3);
  const minimumInvestment = ether(1);
  const maxTokenAmount = token(100 * Math.pow(10, 6));
  const lessThanInitialRate = new BigNumber(0.5);
  const moreThanInitialRate = new BigNumber(2);

  before(async function () {
    // Advance to the next block to correctly read time in the solidity "now" function interpreted by ganache
    await advanceBlock();
  });

  beforeEach(async function () {
    await shared.setupEnvironment.call(this, owner, wallet, rate, cap, goal, minimumInvestment, maxTokenAmount);
    await increaseTimeTo(this.afterOpeningTime);
  });

  it('should only allow owner to change rate', async function () {
    await this.crowdsale.changeRate(moreThanInitialRate, {
      from: notOwner
    }).should.be.rejectedWith(EVMRevert);

    await this.crowdsale.changeRate(moreThanInitialRate, {
      from: owner
    }).should.be.fulfilled;
  });

  it('it should set rate to the assigned value', async function () {
    await this.crowdsale.changeRate(moreThanInitialRate, {
      from: owner
    }).should.be.fulfilled;

    const newRate = await this.crowdsale.rate();
    newRate.should.be.bignumber.equal(moreThanInitialRate);
  });

  it('should allow changing rate before closing time', async function () {
    await this.crowdsale.changeRate(moreThanInitialRate, {
      from: owner
    }).should.be.fulfilled;
  });

  it('should deny changing rate after closing time', async function () {
    await increaseTimeTo(this.afterClosingTime);
    await this.crowdsale.changeRate(moreThanInitialRate, {
      from: owner
    }).should.be.rejectedWith(EVMRevert);
  });

  it('should allow changing rate if new rate is greater than current rate', async function () {
    const initialRate = await this.crowdsale.rate();
    initialRate.should.be.bignumber.equal(rate);

    await this.crowdsale.changeRate(moreThanInitialRate, {
      from: owner
    }).should.be.fulfilled;

    const newRate = await this.crowdsale.rate();
    newRate.should.be.bignumber.equal(moreThanInitialRate);
  });

  it('should allow changing rate if new rate is lower than current rate and greater or equal to intial rate', async function () {
    const initialRate = await this.crowdsale.rate();
    initialRate.should.be.bignumber.equal(rate);

    await this.crowdsale.changeRate(moreThanInitialRate, {
      from: owner
    }).should.be.fulfilled;

    const newRate = await this.crowdsale.rate();
    newRate.should.be.bignumber.equal(moreThanInitialRate);

    await this.crowdsale.changeRate(initialRate, {
      from: owner
    }).should.be.fulfilled;
  });

  it('should deny changing rate if new rate is lower than initial rate', async function () {
    const initialRate = await this.crowdsale.rate();
    initialRate.should.be.bignumber.equal(rate);

    await this.crowdsale.changeRate(initialRate.minus(1), {
      from: owner
    }).should.be.rejectedWith(EVMRevert);

    const newRate = await this.crowdsale.rate();
    newRate.should.be.bignumber.equal(rate);
  });

  it('should properly set initial rate', async function () {
    const initialRate = await this.crowdsale.initialRate();
    initialRate.should.be.bignumber.equal(rate);
  });
});