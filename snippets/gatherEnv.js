//Prereq
var c; SampleCrowdsale.deployed().then((instance) => {c = instance});
var t; SampleToken.deployed().then((instance) => {t = instance});
var investor = web3.eth.coinbase;