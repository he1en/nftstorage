const Web3 = require('web3');
const ethProvider = 'https://cloudflare-eth.com';
const web3 = new Web3(ethProvider);

const ABI = [
    {
        "name": "name",
        "inputs": [],
        "outputs": [
            {
                "internalType": "string",
                "name": "",
                "type": "string"
            }
        ],
        "type": "function",
        "stateMutability": "view",
    },
    {
        "name": "tokenURI",
        "inputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "outputs": [
            {
                "internalType": "string",
                "name": "",
                "type": "string"
            }
        ],
        "type": "function",
        "stateMutability": "view",
    },
    {
        "name": "setBaseURI",
        "inputs": [
            {
                "internalType": "string",
                "name": "uri",
                "type": "string"
            }
        ],
        "outputs": [],
        "type": "function",
        "stateMutability":"nonpayable"
    }
];

// todo make these user input
const tokenID = 4277;
//const contractAddress = '0xbCe3781ae7Ca1a5e050Bd9C4c77369867eBc307e'; // globin
const contractAddress = '0x34d85c9cdeb23fa97cb08333b511ac86e1c4e258' // otherside

function getURL(uri) {
    if (!uri.startsWith('ipfs://')) {
        return uri;
    }
    return `https://cloudflare-ipfs.com/ipfs/${uri.slice(7)}`;
}

async function getToken() {
    web3.eth.handleRevert = true;
    const contract = new web3.eth.Contract(ABI, contractAddress);


    const name = await contract.methods.name().call()
    console.log(`NFT Name: ${name}`);


    contract.methods.setBaseURI('new_uri').estimateGas()
        .then(response => console.log('this cant happen'))
        .catch(err => {
            if (err.message.includes('Only operator can call this method')) {
                console.log('The owner of the contract for this NFT can change the above link at any time.')
            }
        });

    const tokenURI = await contract.methods.tokenURI(tokenID).call();
    const tokenURL = getURL(tokenURI);
    const response = await fetch(tokenURL);
    const tokenData = await response.json();
    console.log(tokenData);
    const imageURL = getURL(tokenData.image);
    console.log(imageURL);
    //const image = fetch()

    console.log(`You can read the source code for this NFT at https://etherscan.io/address/${contractAddress}#code`)
}

getToken()