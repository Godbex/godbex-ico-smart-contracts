// Returns token amount multiplied by decimal places
export default function token(amount, decimals = 18) {
  const _amount = new web3.BigNumber(amount);
  const _multiplier = new web3.BigNumber(Math.pow(10, decimals));

  const tokens = _amount.times(_multiplier);
  
  return tokens;
}