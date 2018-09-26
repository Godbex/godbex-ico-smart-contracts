import ether from './helpers/ether';
import token from './helpers/token';
import shared from './shared';
import {
  increaseTimeTo
} from "./helpers/increaseTime";
import {
  advanceBlock
} from "./helpers/advanceToBlock";

const BigNumber = web3.BigNumber;

require('chai')
  .use(require('chai-as-promised'))
  .should();


contract('WhitelistedCrowdsale', function ([owner, wallet, authorized, unauthorized, anotherAuthorized]) {
  const rate = 1;
  const value = ether(1);
  const tokenSupply = new BigNumber('1e22');
  const cap = ether(10);
  const goal = ether(5);
  const minimumInvestment = ether(1);
  const capAuthorized = cap;
  const capAnotherAuthorized = cap;
  const maxTokenAmount = token(100 * Math.pow(10, 6));

  before(async function () {
    // Advance to the next block to correctly read time in the solidity "now" function interpreted by ganache
    await advanceBlock();
  });


  describe('single user whitelisting', function () {
    beforeEach(async function () {
      await shared.setupEnvironment.call(this, owner, wallet, rate, cap, goal, minimumInvestment, maxTokenAmount);
      await increaseTimeTo(this.afterOpeningTime);
      await this.crowdsale.addToWhitelist(authorized);
    });

    describe('accepting payments', function () {
      it('should accept payments to whitelisted (from whichever buyers)', async function () {
        await this.crowdsale.buyTokens(authorized, {
          value: value,
          from: authorized
        }).should.be.fulfilled;

        await this.crowdsale.buyTokens(authorized, {
          value: value,
          from: unauthorized
        }).should.be.fulfilled;
      });

      it('should reject payments to not whitelisted (from whichever buyers)', async function () {
        await this.crowdsale.sendTransaction({
          value: value,
          from: unauthorized
        }).should.be.rejected;

        await this.crowdsale.buyTokens(unauthorized, {
          value: value,
          from: unauthorized
        }).should.be.rejected;
        await this.crowdsale.buyTokens(unauthorized, {
          value: value,
          from: authorized
        }).should.be.rejected;
      });

      it('should reject payments to addresses removed from whitelist', async function () {
        await this.crowdsale.removeFromWhitelist(authorized);
        await this.crowdsale.buyTokens(authorized, {
          value: value,
          from: authorized
        }).should.be.rejected;
      });
    });

    describe('reporting whitelisted', function () {
      it('should correctly report whitelisted addresses', async function () {
        let isAuthorized = await this.crowdsale.whitelist(authorized);
        isAuthorized.should.equal(true);
        let isntAuthorized = await this.crowdsale.whitelist(unauthorized);
        isntAuthorized.should.equal(false);
      });
    });
  });

  describe('many user whitelisting', function () {
    beforeEach(async function () {
      await shared.setupEnvironment.call(this, owner, wallet, rate, cap, goal, minimumInvestment, maxTokenAmount);
      await increaseTimeTo(this.afterOpeningTime);
      await this.crowdsale.addManyToWhitelist([authorized, anotherAuthorized]);

    });

    describe('accepting payments', function () {
      it('should accept payments to whitelisted (from whichever buyers)', async function () {
        await this.crowdsale.buyTokens(authorized, {
          value: value,
          from: authorized
        }).should.be.fulfilled;
        await this.crowdsale.buyTokens(authorized, {
          value: value,
          from: unauthorized
        }).should.be.fulfilled;
        await this.crowdsale.buyTokens(anotherAuthorized, {
          value: value,
          from: authorized
        }).should.be.fulfilled;
        await this.crowdsale.buyTokens(anotherAuthorized, {
          value: value,
          from: unauthorized
        }).should.be.fulfilled;
      });

      it('should reject payments to not whitelisted (with whichever buyers)', async function () {
        await this.crowdsale.send(value).should.be.rejected;
        await this.crowdsale.buyTokens(unauthorized, {
          value: value,
          from: unauthorized
        }).should.be.rejected;
        await this.crowdsale.buyTokens(unauthorized, {
          value: value,
          from: authorized
        }).should.be.rejected;
      });

      it('should reject payments to addresses removed from whitelist', async function () {
        await this.crowdsale.removeFromWhitelist(anotherAuthorized);
        await this.crowdsale.buyTokens(authorized, {
          value: value,
          from: authorized
        }).should.be.fulfilled;
        await this.crowdsale.buyTokens(anotherAuthorized, {
          value: value,
          from: authorized
        }).should.be.rejected;
      });
    });

    describe('reporting whitelisted', function () {
      it('should correctly report whitelisted addresses', async function () {
        let isAuthorized = await this.crowdsale.whitelist(authorized);
        isAuthorized.should.equal(true);
        let isAnotherAuthorized = await this.crowdsale.whitelist(anotherAuthorized);
        isAnotherAuthorized.should.equal(true);
        let isntAuthorized = await this.crowdsale.whitelist(unauthorized);
        isntAuthorized.should.equal(false);
      });
    });
  });
});