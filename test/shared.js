import latestTime from "./helpers/latestTime";
import {
  duration,
  increaseTimeTo
} from "./helpers/increaseTime";
import token from './helpers/token';


const SampleCrowdsale = artifacts.require('SampleCrowdsale');
const SampleToken = artifacts.require('SampleToken');

exports.setupEnvironment = async function (owner, wallet, rate, cap, goal, minimumInvestment, maxTokenAmount) {
  this.openingTime = latestTime() + duration.days(1);
  this.afterOpeningTime = this.openingTime + duration.minutes(5);
  this.closingTime = this.openingTime + duration.days(5);
  this.beforeClosingTime = this.closingTime - duration.minutes(5);
  this.afterClosingTime = this.closingTime + duration.minutes(1);

  this.token = await SampleToken.new(maxTokenAmount, {
    from: owner
  });

  this.crowdsale = await SampleCrowdsale.new(
    rate,
    wallet,
    cap,
    goal,
    minimumInvestment,
    this.openingTime,
    this.closingTime,
    this.token.address, {
      from: owner
    }
  );
  await this.token.transferOwnership(this.crowdsale.address, {
    from: owner
  });
};