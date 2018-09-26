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

contract('SampleCrowdsale: ecosystem allocation', function (accounts) {
  const rate = new BigNumber(1);
  const cap = ether(5);
  const goal = ether(3);
  const minimumInvestment = 1;

  const advisorsAmount = token(7 * Math.pow(10, 6));
  const companyAmount = token(19 * Math.pow(10, 6));
  const teamAmount = token(24 * Math.pow(10, 6));
  const maxTokenAmount = token(100 * Math.pow(10, 6));

  const owner = accounts[0];
  const investor = accounts[1];
  const wallet = accounts[2];
  const purchaser = accounts[3];
  const notOwner = accounts[4];
  const advisorsWallet = accounts[7];
  const companyWallet = accounts[8];
  const teamWallet = accounts[9];

  before(async function () {
    // Advance to the next block to correctly read time in the solidity "now" function interpreted by ganache
    await advanceBlock();
  });

  beforeEach(async function () {
    await shared.setupEnvironment.call(this, owner, wallet, rate, cap, goal, minimumInvestment, maxTokenAmount);
    await increaseTimeTo(this.afterOpeningTime);
  });

  it('should allocate tokens to ecosystem immediately after token deployment', async function () {
    let advisorsBalance = await this.token.balanceOf(advisorsWallet);
    let companyBalance = await this.token.balanceOf(companyWallet);
    let teamBalance = await this.token.balanceOf(teamWallet);

    advisorsBalance.should.be.bignumber.equal(advisorsAmount);
    companyBalance.should.be.bignumber.equal(companyAmount);
    teamBalance.should.be.bignumber.equal(teamAmount);
  });

  it('should update total supply after token deployment', async function () {
    const advisorsBalance = await this.token.balanceOf(advisorsWallet);
    const companyBalance = await this.token.balanceOf(companyWallet);
    const teamBalance = await this.token.balanceOf(teamWallet);

    const totalTokenSupply = await this.token.totalSupply();
    totalTokenSupply.should.be.bignumber.equal(advisorsBalance.add(companyBalance).add(teamBalance));
  });
});