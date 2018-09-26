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

const RefundableCrowdsale = artifacts.require('SampleCrowdsale');

contract('SampleCrowdsale: refunding', function ([owner, wallet, investor, purchaser]) {
  const rate = new BigNumber(1);
  const cap = ether(5);
  const goal = ether(3);
  const minimumInvestment = ether(1);
  const lessThanGoal = ether(2);
  const maxTokenAmount = token(100 * Math.pow(10, 6));
  const capInvestor = cap;
  const capPurchaser = cap;

  before(async function () {
    // Advance to the next block to correctly read time in the solidity "now" function interpreted by ganache
    await advanceBlock();
  });

  beforeEach(async function () {
    await shared.setupEnvironment.call(this, owner, wallet, rate, cap, goal, minimumInvestment, maxTokenAmount);
    await this.crowdsale.addToWhitelist(investor);
  });

  describe('creating a valid crowdsale', function () {
    it('should fail with zero goal', async function () {
      await RefundableCrowdsale.new(
        rate, wallet, cap, 0, minimumInvestment, this.openingTime, this.closingTime, this.token.address, {
          from: owner
        }
      ).should.be.rejectedWith(EVMRevert);
    });
  });

  it('should deny refunds before end', async function () {
    await this.crowdsale.claimRefund({
      from: investor
    }).should.be.rejectedWith(EVMRevert);
    await increaseTimeTo(this.afterOpeningTime);
    await this.crowdsale.claimRefund({
      from: investor
    }).should.be.rejectedWith(EVMRevert);
  });

  it('should deny refunds after end if goal was reached', async function () {
    await increaseTimeTo(this.afterOpeningTime);
    await this.crowdsale.sendTransaction({
      value: goal,
      from: investor
    });
    await increaseTimeTo(this.afterClosingTime);
    await this.crowdsale.claimRefund({
      from: investor
    }).should.be.rejectedWith(EVMRevert);
  });

  it('should allow refunds after end if goal was not reached', async function () {
    await increaseTimeTo(this.afterOpeningTime);
    await this.crowdsale.sendTransaction({
      value: lessThanGoal,
      from: investor
    });
    await increaseTimeTo(this.afterClosingTime);
    await this.crowdsale.finalize({
      from: owner
    });
    const pre = web3.eth.getBalance(investor);
    await this.crowdsale.claimRefund({
        from: investor,
        gasPrice: 0
      })
      .should.be.fulfilled;
    const post = web3.eth.getBalance(investor);
    post.minus(pre).should.be.bignumber.equal(lessThanGoal);
  });

  it('should forward funds to wallet after end if goal was reached', async function () {
    await increaseTimeTo(this.afterOpeningTime);
    await this.crowdsale.sendTransaction({
      value: goal,
      from: investor
    });
    await increaseTimeTo(this.afterClosingTime);
    const pre = web3.eth.getBalance(wallet);
    await this.crowdsale.finalize({
      from: owner
    });
    const post = web3.eth.getBalance(wallet);
    post.minus(pre).should.be.bignumber.equal(goal);
  });
});