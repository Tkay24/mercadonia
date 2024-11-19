const express = require('express');
const Web3 = require('web3');
require('dotenv').config(); // Load environment variables
const cors = require('cors');
const path = require('path');
const axios = require('axios');

const app = express();

// Initialize Web3 with Infura (or any other Ethereum node provider)
const web3 = new Web3(`https://mainnet.infura.io/v3/${process.env.bac4fd0de2d64406acacd1a07364d860}`);

// WTHETA Token contract address and ABI (replace with the actual ABI)
const WTHETA_ADDRESS = '0x3883f5e181fccaF8410FA61e12b59BAd963fb645'; // Address of Wrapped THETA (WTHETA) token
const WTHETA_ABI = [
  // Minimal ABI, just enough for balanceOf and transfer
  {
    "constant": true,
    "inputs": [
      { "name": "account", "type": "address" }
    ],
    "name": "balanceOf",
    "outputs": [
      { "name": "", "type": "uint256" }
    ],
    "payable": false,
    "stateMutability": "view",
    "type": "function"
  },
  {
    "constant": false,
    "inputs": [
      { "name": "recipient", "type": "address" },
      { "name": "amount", "type": "uint256" }
    ],
    "name": "transfer",
    "outputs": [
      { "name": "", "type": "bool" }
    ],
    "payable": false,
    "stateMutability": "nonpayable",
    "type": "function"
  }
];

// Create contract instance
const wthetaContract = new web3.eth.Contract(WTHETA_ABI, WTHETA_ADDRESS);

// Route to get the WTHETA balance of a specific address
app.get('/api/wtheta/balance/:address', async (req, res) => {
  const { address } = req.params;
  
  try {
    const balance = await wthetaContract.methods.balanceOf(address).call();
    const balanceInEther = web3.utils.fromWei(balance, 'ether'); // Convert from wei to ether (if WTHETA uses standard ERC-20 decimals)
    res.status(200).json({ balance: balanceInEther });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching balance', error: error.message });
  }
});

// Route to transfer WTHETA from one address to another
app.post('/api/wtheta/transfer', async (req, res) => {
  const { fromAddress, privateKey, toAddress, amount } = req.body;
  
  try {
    const valueInWei = web3.utils.toWei(amount.toString(), 'ether'); // Convert amount to Wei (or the token's smallest unit)

    // Create transaction data
    const txData = wthetaContract.methods.transfer(toAddress, valueInWei).encodeABI();

    // Estimate gas
    const gasEstimate = await web3.eth.estimateGas({
      from: fromAddress,
      to: WTHETA_ADDRESS,
      data: txData
    });

    // Build the transaction
    const tx = {
      from: fromAddress,
      to: WTHETA_ADDRESS,
      data: txData,
      gas: gasEstimate
    };

    // Sign the transaction
    const signedTx = await web3.eth.accounts.signTransaction(tx, privateKey);

    // Send the signed transaction
    const receipt = await web3.eth.sendSignedTransaction(signedTx.rawTransaction);

    res.status(200).json({ message: 'Transaction successful!', receipt });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error transferring tokens', error: error.message });
  }
});

// Other Routes
app.use('/api', require('./routes/api/index'));
app.use('/api/history', require('./routes/api/history'));
app.use('/api/config', require('./routes/api/config'));
app.use('/api/users', require('./routes/api/users'));
app.use('/api/auth', require('./routes/api/auth'));
app.use('/api/profile', require('./routes/api/profile'));
app.use('/api/posts', require('./routes/api/posts'));
app.use('/api/tokens', require('./routes/api/tokens'));
app.use('/api/token-pairs', require('./routes/api/tokenPairs'));

// Serve static assets in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static('client/build'));
  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, 'client', 'build', 'index.html'));
  });
}

const PORT = process.env.PORT || 2001;

// Start the server
app.listen(PORT, () => console.log(`Server started on port ${PORT}`));

