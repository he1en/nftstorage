const Web3 = require('web3');
const ethProvider = 'https://cloudflare-eth.com';
const web3 = new Web3(ethProvider);

const ABI = [
    {
        "inputs": [],
        "name": "name",
        "outputs": [
            {
                "internalType": "string",
                "name": "",
                "type": "string"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "name": "tokenURI",
        "outputs": [
            {
                "internalType": "string",
                "name": "",
                "type": "string"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    }
];

// todo make these user input
const tokenID = 4277;
const contractAddress = '0xbCe3781ae7Ca1a5e050Bd9C4c77369867eBc307e'; //'0x34d85c9cdeb23fa97cb08333b511ac86e1c4e258'

function getURL(uri) {
    if (!uri.startsWith('ipfs://')) {
        return uri;
    }
    return `https://cloudflare-ipfs.com/ipfs/${uri.slice(7)}`;
}

async function getToken() {
    const contract = new web3.eth.Contract(ABI, contractAddress);

    const name = await contract.methods.name().call();
    console.log(`NFT Name: ${name}`);

    const tokenURI = await contract.methods.tokenURI(tokenID).call();
    const tokenURL = getURL(tokenURI);
    const response = await fetch(tokenURL);
    const tokenData = await response.json();
    console.log(tokenData);
    const imageURL = getURL(tokenData.image);
    console.log(imageURL);
    //const image = fetch()
}

getToken()