const SampleToken = artifacts.require("./SampleToken.sol");
const SampleCrowdsale = artifacts.require("./SampleCrowdsale.sol");

function latestTime() {
  return web3.eth.getBlock('latest').timestamp;
}

const duration = {
  seconds: function (val) {
    return val
  },
  minutes: function (val) {
    return val * this.seconds(60)
  },
  hours: function (val) {
    return val * this.minutes(60)
  },
  days: function (val) {
    return val * this.hours(24)
  },
  weeks: function (val) {
    return val * this.days(7)
  },
  years: function (val) {
    return val * this.days(365)
  }
};

module.exports = function (deployer, network, accounts) {
  const openingTime = latestTime() + duration.minutes(2);
  const closingTime = openingTime + duration.minutes(3);
  const publicSaleTime = openingTime + duration.minutes(2);

  const wallet = web3.eth.accounts[0];
  const goal = 25 * (10 ** 18);
  const cap = 100 * (10 ** 18);
  const rate = 1000;
  const minimumInvestment = 1 * (10 ** 18);

  console.log('Deploying token and crowdsale with parameters:');
  console.log(`Opening time: ${new Date(openingTime * 1000)}`);
  console.log(`Public sale time: ${new Date(publicSaleTime * 1000)}`);
  console.log(`Closing time: ${new Date(closingTime * 1000)}`);

  console.log(`Params: ${rate}, ${wallet}, ${cap}, ${goal}, ${minimumInvestment}, ${openingTime}, ${closingTime}, ${SampleToken.address}`);

  return deployer
    .then(() => {
      return SampleToken.deployed();
    })
    .then(() => {
      return deployer.deploy(
        SampleCrowdsale,
        rate, wallet, cap, goal, minimumInvestment, openingTime, closingTime, SampleToken.address, {
          from: accounts[0]
        });
    })
    .then(() => {
      return Promise.all([
        SampleToken.deployed(),
        SampleCrowdsale.deployed()
      ]);
    })
    .then((instances) => {
      const tokenInstance = instances[0];
      const crowdsaleInstance = instances[1];

      console.log('Transfering ownership of token to crowdsale contract');
      tokenInstance.transferOwnership(crowdsaleInstance.address);
    });
};