import ether from './helpers/ether';
import EVMRevert from './helpers/EVMRevert';
import token from './helpers/token';
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

contract('SampleCrowdsale: private investment', function (accounts) {
  const rate = new BigNumber(1);
  const cap = ether(5);
  const goal = ether(3);
  const value = ether(1);
  const lessThanCap = ether(3);
  const capInvestor = cap;
  const capPurchaser = cap;
  const weiAmount = ether(1);
  const tokenAmount = token(1.1);
  const maxTokenAmount = token(100 * Math.pow(10, 6));
  const minimumInvestment = ether(1);
  const lessThanMinimumInvestment = ether(0.5);


  const advisorsAmount = token(7 * Math.pow(10, 6));
  const companyAmount = token(19 * Math.pow(10, 6));
  const teamAmount = token(24 * Math.pow(10, 6));


  const owner = accounts[0];
  const investor = accounts[1];
  const wallet = accounts[2];
  const purchaser = accounts[3];
  const notOwner = accounts[4];
  const unauthorized = accounts[5];
  const advisorsWallet = accounts[7];
  const companyWallet = accounts[8];
  const teamWallet = accounts[9];


  before(async function () {
    // Advance to the next block to correctly read time in the solidity "now" function interpreted by ganache
    await advanceBlock();
  });

  beforeEach(async function () {
    await shared.setupEnvironment.call(this, owner, wallet, rate, cap, goal, minimumInvestment, maxTokenAmount);
  });


  describe('push private investment', function () {
    it('should allow only owner to push private investments', async function () {
      await this.crowdsale.pushPrivateInvestment(weiAmount, tokenAmount, investor, {
        from: owner
      }).should.be.fulfilled;
    });

    it('should not allow not owner to push private investments', async function () {
      await this.crowdsale.pushPrivateInvestment(weiAmount, tokenAmount, investor, {
        from: notOwner
      }).should.be.rejectedWith(EVMRevert);
    });

    it('should not allow benefactor address to be null', async function () {
      await this.crowdsale.pushPrivateInvestment(weiAmount, tokenAmount, 0, {
        from: owner
      }).should.be.rejectedWith(EVMRevert);
    });

    it('should be able to push multiple private investments for the same beneficiary', async function () {
      await this.crowdsale.pushPrivateInvestment(weiAmount, tokenAmount, investor, {
        from: owner
      }).should.be.fulfilled;
      await this.crowdsale.pushPrivateInvestment(weiAmount, tokenAmount, investor, {
        from: owner
      }).should.be.fulfilled;
    });

    it('should increase wei raised after multiple private investments for the same beneficiary', async function () {
      await this.crowdsale.pushPrivateInvestment(weiAmount, tokenAmount, investor, {
        from: owner
      });
      await this.crowdsale.pushPrivateInvestment(weiAmount, tokenAmount, investor, {
        from: owner
      });

      const weiRaised = await this.crowdsale.weiRaised.call();
      weiRaised.should.be.bignumber.equal(weiAmount.add(weiAmount));
    });
  });

  describe('CappedCrowdsale', function () {

    it('should increase weiRaised after invocation', async function () {

      const pre = await this.crowdsale.weiRaised();
      await this.crowdsale.pushPrivateInvestment(minimumInvestment, tokenAmount, investor, {
        from: owner
      }).should.be.fulfilled;
      const post = await this.crowdsale.weiRaised();
      post.minus(pre).should.be.bignumber.equal(minimumInvestment);
    });

    it('should not reach cap if sent under cap', async function () {
      const value = ether(1);
      await this.crowdsale.pushPrivateInvestment(value, tokenAmount, investor, {
        from: owner
      }).should.be.fulfilled;

      const capReached = await this.crowdsale.capReached();
      capReached.should.be.equal(false);
    });

    it('should not reach cap if sent just under cap', async function () {

      await this.crowdsale.pushPrivateInvestment(cap.minus(1), tokenAmount, investor, {
        from: owner
      }).should.be.fulfilled;

      const capReached = await this.crowdsale.capReached();
      capReached.should.be.equal(false);
    });

    it('should reach cap if cap sent', async function () {
      await this.crowdsale.pushPrivateInvestment(cap, tokenAmount, investor, {
        from: owner
      }).should.be.fulfilled;

      const capReached = await this.crowdsale.capReached();
      capReached.should.be.equal(true);
    });

    it('should not be able to exceed hard cap via private sale in a single payment', async function () {
      await this.crowdsale.pushPrivateInvestment(cap.plus(1), tokenAmount, investor, {
        from: owner
      }).should.be.rejectedWith(EVMRevert);

      await increaseTimeTo(this.afterClosingTime);

      const investorBalance = await this.token.balanceOf(investor);
      const capReached = await this.crowdsale.capReached();
      const weiRaised = await this.crowdsale.weiRaised();

      capReached.should.be.equal(false);
      weiRaised.should.be.bignumber.equal(0);
      investorBalance.should.be.bignumber.equal(0);
    });

    it('should not be able to exceed hard cap via private sale in multiple payments', async function () {
      await this.crowdsale.pushPrivateInvestment(cap, tokenAmount, investor, {
        from: owner
      }).should.be.fulfilled;

      await this.crowdsale.pushPrivateInvestment(1, tokenAmount, investor, {
        from: owner
      }).should.be.rejectedWith(EVMRevert);
    });
  });

  //EcosystemAllocation satisfied

  describe('FinalizableCrowdsale', function () {
    it('should not allow to push private investment after finalization', async function () {
      await increaseTimeTo(this.afterClosingTime);
      await this.crowdsale.finalize({
        from: owner
      });

      await this.crowdsale.pushPrivateInvestment(cap, tokenAmount, investor, {
        from: owner
      }).should.be.rejectedWith(EVMRevert);
    });
  });

  describe('MaxTokenAmount', function () {
    it('should successfully buy tokens if token amount is less than maximum token amount', async function () {
      await this.crowdsale.pushPrivateInvestment(minimumInvestment, 1, investor, {
        from: owner
      }).should.be.fulfilled;
    });

    it('should successfully buy tokens until maximum token amount is reached', async function () {
      const supply = await this.token.totalSupply();
      const availableTokens = maxTokenAmount.minus(supply);

      await this.crowdsale.pushPrivateInvestment(minimumInvestment, 1, investor, {
        from: owner
      }).should.be.fulfilled;

      await this.crowdsale.pushPrivateInvestment(minimumInvestment, availableTokens.minus(1), investor, {
        from: owner
      }).should.be.fulfilled;
    });

    it('should fail to buy tokens if more than maximum token amount is requested', async function () {
      await this.crowdsale.pushPrivateInvestment(weiAmount, maxTokenAmount.plus(1), investor, {
        from: owner
      }).should.be.rejectedWith(EVMRevert);
    });

    it('should fail to buy tokens if maximum token amount is exceeded', async function () {
      const supply = await this.token.totalSupply();
      const availableTokens = maxTokenAmount.minus(supply);

      await this.crowdsale.pushPrivateInvestment(weiAmount, availableTokens, investor, {
        from: owner
      }).should.be.fulfilled;

      await this.crowdsale.pushPrivateInvestment(weiAmount, 1, investor, {
        from: owner
      }).should.be.rejectedWith(EVMRevert);
    });
  });

  describe('MinimumInvestment', function () {
    beforeEach(async function () {
      await shared.setupEnvironment.call(this, owner, wallet, rate, cap, goal, minimumInvestment, maxTokenAmount);
      await increaseTimeTo(this.afterOpeningTime);
    });

    it('should deny payment if amount is lower than minimum investment value', async function () {
      await this.crowdsale.pushPrivateInvestment(lessThanMinimumInvestment, tokenAmount, investor, {
        from: owner
      }).should.be.rejectedWith(EVMRevert);
    });

    it('should accept payment if amount is equal to minimum investment value', async function () {
      await this.crowdsale.pushPrivateInvestment(minimumInvestment, tokenAmount, investor, {
        from: owner
      }).should.be.fulfilled;
    });

    it('should allow payment if amount is greater than minimum investment value', async function () {
      await this.crowdsale.pushPrivateInvestment(minimumInvestment.add(1), tokenAmount, investor, {
        from: owner
      }).should.be.fulfilled;
    });
  });

  describe('MintedCrowdsale', function () {
    it('should log private investment purchase', async function () {
      const {
        logs
      } = await this.crowdsale.pushPrivateInvestment(weiAmount, tokenAmount, investor, {
        from: owner
      });

      const event = logs.find(e => e.event === 'TokenPurchase');
      event.should.exist;
      event.args.purchaser.should.equal(owner);
      event.args.beneficiary.should.equal(investor);
      event.args.value.should.be.bignumber.equal(weiAmount);
      event.args.amount.should.be.bignumber.equal(tokenAmount);
    });

    it('should assign the promised amount of tokens', async function () {
      let investorBalance = await this.token.balanceOf(investor);
      investorBalance.should.be.bignumber.equal(0);

      await this.crowdsale.pushPrivateInvestment(weiAmount, tokenAmount, investor, {
        from: owner
      }).should.be.fulfilled;

      investorBalance = await this.token.balanceOf(investor);
      investorBalance.should.be.bignumber.equal(tokenAmount);
    });
  });

  describe('RefundableCrowdsale', function () {
    it('should be able to reach soft cap via private sale', async function () {
      await this.crowdsale.pushPrivateInvestment(goal, tokenAmount, investor, {
        from: owner
      }).should.be.fulfilled;

      const goalReached = await this.crowdsale.goalReached();
      goalReached.should.be.equal(true);
    });

    it('should deny refunds before end', async function () {
      await this.crowdsale.pushPrivateInvestment(goal, tokenAmount, investor, {
        from: owner
      }).should.be.fulfilled;

      await this.crowdsale.claimRefund({
        from: investor
      }).should.be.rejectedWith(EVMRevert);
    });

    it('should deny refunds after end if goal was reached', async function () {
      await this.crowdsale.pushPrivateInvestment(goal, tokenAmount, investor, {
        from: owner
      }).should.be.fulfilled;

      await increaseTimeTo(this.afterClosingTime);
      await this.crowdsale.finalize({
        from: owner
      });

      await this.crowdsale.claimRefund({
        from: investor
      }).should.be.rejectedWith(EVMRevert);
    });

    it('should allow refunds after end if goal was not reached and refund 0 wei', async function () {
      await this.crowdsale.pushPrivateInvestment(goal.minus(1), tokenAmount, investor, {
        from: owner
      }).should.be.fulfilled;

      const pre = web3.eth.getBalance(investor);

      await increaseTimeTo(this.afterClosingTime);
      await this.crowdsale.finalize({
        from: owner
      });

      // gasPrice is set to 0 to avoid transaction costs in balance
      await this.crowdsale.claimRefund({
        from: investor,
        gasPrice: 0
      }).should.be.fulfilled;

      const post = web3.eth.getBalance(investor);
      post.minus(pre).should.be.bignumber.equal(0);
    });

  });

  describe('TimedCrowdsale', function () {
    it('should allow owner to push private investments before public sale', async function () {
      await this.crowdsale.pushPrivateInvestment(weiAmount, tokenAmount, investor, {
        from: owner
      }).should.be.fulfilled;
    });

    it('should allow owner to push private investments during public sale', async function () {
      await increaseTimeTo(this.afterOpeningTime);
      await this.crowdsale.pushPrivateInvestment(weiAmount, tokenAmount, investor, {
        from: owner
      }).should.be.fulfilled;
    });

    it('should not allow owner to push private investments after end', async function () {
      await increaseTimeTo(this.afterClosingTime);
      await this.crowdsale.pushPrivateInvestment(weiAmount, tokenAmount, investor, {
        from: owner
      }).should.be.rejectedWith(EVMRevert);
    });
  });

  describe('WhitelistedCrowdsale', function () {
    it('should automatically whitelist private investors for public sale', async function () {
      await this.crowdsale.pushPrivateInvestment(cap, tokenAmount, investor, {
        from: owner
      }).should.be.fulfilled;

      const whitelisted = await this.crowdsale.whitelist(investor);

      whitelisted.should.be.equal(true);
    });

    it('should allow investors whitelisted in private sale to participate in public sale', async function () {
      const aboveMinimumInvestment = minimumInvestment.add(1);
      await this.crowdsale.pushPrivateInvestment(minimumInvestment, tokenAmount, investor, {
        from: owner
      }).should.be.fulfilled;

      await increaseTimeTo(this.afterOpeningTime);

      await this.crowdsale.buyTokens(investor, {
        value: aboveMinimumInvestment,
        from: investor
      }).should.be.fulfilled;

      await this.crowdsale.buyTokens(investor, {
        value: value,
        from: unauthorized
      }).should.be.fulfilled;

    });
  });
});