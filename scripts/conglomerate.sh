#!/bin/zsh
rm -rf build \
&& truffle-flattener contracts/SampleCrowdsale.sol contracts/SampleToken.sol  >> contracts/SampleConglomerate.sol \
&&  find contracts -not -name 'Migrations.sol' -not -name 'SampleConglomerate.sol' -not -name 'contracts' -delete \
&& truffle compile