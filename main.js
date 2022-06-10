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

const othersideContractAddress = '0x34d85c9cdeb23fa97cb08333b511ac86e1c4e258';
const contract = new web3.eth.Contract(ABI, othersideContractAddress);
const tokenID = 65995;
contract.methods.name().call((err, result) => { console.log(result) });
contract.methods.tokenURI(tokenID).call((err, result) => { console.log(result) });