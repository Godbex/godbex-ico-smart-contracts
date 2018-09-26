import {
  advanceBlock
} from './helpers/advanceToBlock';
import {
  increaseTimeTo
} from './helpers/increaseTime';
import token from './helpers/token';
import EVMRevert from './helpers/EVMRevert';
import ether from "./helpers/ether";
import shared from "./shared";

const BigNumber = web3.BigNumber;

const should = require('chai')
  .use(require('chai-as-promised'))
  .use(require('chai-bignumber')(BigNumber))
  .should();

contract('SampleCrowdsale: finalizable', function ([owner, investor, wallet, purchaser, thirdparty]) {
  const rate = new BigNumber(1);
  const cap = ether(5);
  const goal = ether(3);
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
  });

  it('cannot be finalized before ending', async function () {
    await this.crowdsale.finalize({
      from: owner
    }).should.be.rejectedWith(EVMRevert);
  });

  it('cannot be finalized by third party after ending', async function () {
    await increaseTimeTo(this.afterClosingTime);
    await this.crowdsale.finalize({
      from: thirdparty
    }).should.be.rejectedWith(EVMRevert);
  });

  it('can be finalized by owner after ending', async function () {
    await increaseTimeTo(this.afterClosingTime);
    await this.crowdsale.finalize({
      from: owner
    }).should.be.fulfilled;
  });

  it('cannot be finalized twice', async function () {
    await increaseTimeTo(this.afterClosingTime);
    await this.crowdsale.finalize({
      from: owner
    });
    await this.crowdsale.finalize({
      from: owner
    }).should.be.rejectedWith(EVMRevert);
  });

  it('logs finalized', async function () {
    await increaseTimeTo(this.afterClosingTime);
    const {
      logs
    } = await this.crowdsale.finalize({
      from: owner
    });
    const event = logs.find(e => e.event === 'Finalized');
    should.exist(event);
  });
});