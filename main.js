// ------------- DOM access ------------------
async function readNFT() {
    var input = document.getElementById("main-input").value;
    validateInput(input);
    const {contractAddress, tokenID} = parseMarketplaceLink(input);
    const nft = await getNFTInfo(contractAddress, tokenID);

    document.getElementById("nft-name").innerHTML = `Your ${nft.name} NFT`;
    document.getElementById("nft-location").innerHTML = `Its image is located at ${nft.imageURI}, not on the blockchain`;
    document.getElementById("nft-data").src = queryableURL(nft.tokenURI);
    if (nft.knownChangeable) {
        document.getElementById("nft-changeable").innerHTML = `Also, according to the source code for this NFT, someone can change the above link at any time.\n`;
    } else {
        document.getElementById("nft-changeable").hidden = false;
    }
    var sourceLink = document.getElementById("nft-source");
    sourceLink.innerHTML = "You can read the source code for this NFT here."
    sourceLink.href = `https://etherscan.io/address/${contractAddress}#code`;

    var image = document.getElementById("nft-image");
    image.src = queryableURL(nft.imageURI);
    image.hidden = false;
}

var input = document.getElementById("main-input");
input.addEventListener("keypress", function(event) {
    if (event.key === "Enter") {
        readNFT();
    }
});

var button = document.getElementById("main-button");
button.onclick = readNFT;



// ----- Just Javascript ---------

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


function validateInput(input) {
    if (input.startsWith('https://opensea.io/assets/ethereum') ||
        input.startsWith('https://looksrare.org/collections')) {
            return true;
    }
    return false;
}


function parseMarketplaceLink(marketplaceLink) {
    if (marketplaceLink.endsWith('/')) {
        marketplaceLink = marketplaceLink.substring(0, marketplaceLink.length - 1);
    }
    const URLparts = marketplaceLink.split('/');
    const tokenID = parseInt(URLparts[URLparts.length - 1]);
    const contractAddress = URLparts[URLparts.length - 2];
    return {tokenID, contractAddress};

}


function queryableURL(uri) {
    if (!uri.startsWith('ipfs://')) {
        return uri;
    }
    return `https://ipfs.io/ipfs/${uri.slice(7)}`;
}

class NFT {
    constructor(name, tokenURI, tokenData, imageURI, knownChangeable) {
        this.name = name;
        this.tokenURI = tokenURI;
        this.tokenData = tokenData;
        this.imageURI = imageURI;
        this.knownChangeable = knownChangeable;
    }
}

async function getNFTInfo(contractAddress, tokenID) {
    web3.eth.handleRevert = true;
    const contract = new web3.eth.Contract(ABI, contractAddress);


    const name = await contract.methods.name().call()
    console.log(`NFT Name: ${name}`);


    var isChangeable = false;
    await contract.methods.setBaseURI('new_uri').estimateGas()
        .then(response => {console.log(response); response.json().then(data=>console.log(data));})
        .catch(err => {
            console.log(err);
            if (err.message.includes('Only operator can call this method')) {
                isChangeable = true;
            }
        });

    const tokenURI = await contract.methods.tokenURI(tokenID).call();
    const response = await fetch(queryableURL(tokenURI));
    const tokenData = await response.json();
    const nft = new NFT(name, tokenURI, tokenData, tokenData.image, isChangeable);
    console.log(nft);
    return nft;
}


