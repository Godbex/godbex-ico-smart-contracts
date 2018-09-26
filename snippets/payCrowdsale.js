var c; SampleCrowdsale.deployed().then((instance) => {c = instance});
c.sendTransaction({ from: web3.eth.accounts[7], value: web3.toWei(1, "ether")});