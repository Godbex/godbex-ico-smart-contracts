import ether from './helpers/ether';
import token from './helpers/token';
import shared from './shared';
import { increaseTimeTo } from "./helpers/increaseTime";
import { advanceBlock } from "./helpers/advanceToBlock";


const BigNumber = web3.BigNumber;

const should = require('chai')
  .use(require('chai-as-promised'))
  .use(require('chai-bignumber')(BigNumber))
  .should();


contract('SampleCrowdsale: minted', function ([owner, investor, wallet, purchaser]) {
  const rate = new BigNumber(1);
  const cap = ether(100);
  const goal = ether(3);
  const value = ether(1);
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
    await increaseTimeTo(this.afterOpeningTime);
    await this.crowdsale.addToWhitelist(investor);
    await this.crowdsale.addToWhitelist(purchaser);
  });

  const expectedTokenAmount = rate.mul(value);

  describe('accepting payments', function () {
    it('should be token owner', async function () {
      const owner = await this.token.owner();
      owner.should.equal(this.crowdsale.address);
    });

    it('should accept payments', async function () {
      await this.crowdsale.sendTransaction({
        value: value,
        from: investor
      }).should.be.fulfilled;

      await this.crowdsale.buyTokens(investor, {
        value: value,
        from: purchaser
      }).should.be.fulfilled;
    });
  });

  describe('high-level purchase', function () {
    it('should log purchase', async function () {
      const {
        logs
      } = await this.crowdsale.sendTransaction({
        value: value,
        from: investor
      });
      const event = logs.find(e => e.event === 'TokenPurchase');
      should.exist(event);
      event.args.purchaser.should.equal(investor);
      event.args.beneficiary.should.equal(investor);
      event.args.value.should.be.bignumber.equal(value);
      event.args.amount.should.be.bignumber.equal(expectedTokenAmount);
    });

    it('should assign tokens to sender', async function () {
      await this.crowdsale.sendTransaction({
        value: value,
        from: investor
      });

      let balance = await this.token.balanceOf(investor);
      balance.should.be.bignumber.equal(expectedTokenAmount);
    });

    it('should forward funds to wallet', async function () {
      const pre = web3.eth.getBalance(wallet);
      await this.crowdsale.sendTransaction({
        value: goal,
        from: investor
      });

      await increaseTimeTo(this.afterClosingTime);
      await this.crowdsale.finalize({from: owner});

      const post = web3.eth.getBalance(wallet);
      post.minus(pre).should.be.bignumber.equal(goal);
    });
  });
});