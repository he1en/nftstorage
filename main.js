// ------------- DOM access ------------------
async function readNFT() {
    var input = document.getElementById("main-input").value;
    validateInput(input);
    const {contractAddress, tokenID} = parseMarketplaceLink(input);
    const nft = await getNFTInfo(contractAddress, tokenID);

    document.getElementById("main-output").hidden = false;

    // upper
    document.getElementById("nft-name").innerHTML = `${nft.name} #${tokenID}`;
    document.getElementById("nft-owner").innerHTML = `That this NFT is owned by the account ${nft.ownerAddr}`;
    var nftLocUpper = document.getElementById("nft-location-upper");
    nftLocUpper.innerHTML = nft.tokenURI;
    nftLocUpper.href = queryableURL(nft.tokenURI);

    // lower
    document.getElementById("nft-traits").innerHTML = JSON.stringify(nft.tokenData, null, 4);
    var nftLocLower = document.getElementById("nft-location-lower");
    nftLocLower.innerHTML = nft.tokenURI;
    nftLocLower.href = queryableURL(nft.tokenURI);
    document.getElementById("nft-image-link").href = queryableURL(nft.imageURI);
    document.getElementById("nft-image").src = queryableURL(nft.imageURI);

    if (nft.knownChangeable) {
        const text = `Further, according to the this NFT's contract's source code, someone can change the
        URI for this NFT at any time by calling the function ${nft.changeFn}.
        This means that on the Ethereum blockchain, the value ${nft.tokenURI} could be replaced with something
        completely different without the NFT owner's permission, and all the information in the red section
        could be completely replaced.`
        document.getElementById("nft-changeable").innerHTML = text;
    } else {
        document.getElementById("nft-changeable").hidden = true;
    }

    // extras
    var sourceLink = document.getElementById("nft-source");
    sourceLink.innerHTML = "You can read the source code for this NFT here to see this all for yourself."
    sourceLink.href = `https://etherscan.io/address/${contractAddress}#code`;


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
        "name":"ownerOf",
        "inputs": [
            {
            "internalType": "uint256",
            "name": "tokenId",
            "type": "uint256"
            }
        ],
        "outputs": [
            {
                "internalType": "address",
                "name": "",
                "type": "address"
            }
        ],
        "type":"function",
        "stateMutability": "view"
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
    /*
    Turns URIs into URLs that we can send GET requests to.

    ifps:// URIs need to be wrapped with an IPFS gateway. I chose ipfs.io.

    Many URLs with NFT metadata and images do not return friendly CORS response headers, so
    I need to request them server side, from a simple CORS proxy I set up. ipfs.io returns
    good cors response headers so no need to wrap with proxy.
    */
    if (uri.startsWith('ipfs://')) {
        // ipfs.io returns good cors response headers so no need to wrap with proxy
        return `https://ipfs.io/ipfs/${uri.slice(7)}`;
    }
    return `https://corsproxy.he1en.workers.dev/?${uri}`;
}

class NFT {
    constructor(name, tokenURI, tokenData, imageURI, ownerAddr, knownChangeable, changeFn) {
        this.name = name;
        this.tokenURI = tokenURI;
        this.tokenData = tokenData;
        this.imageURI = imageURI;
        this.ownerAddr = ownerAddr;
        this.knownChangeable = knownChangeable;
        this.changeFn = changeFn;
    }
}

async function getNFTInfo(contractAddress, tokenID) {
    web3.eth.handleRevert = true;
    const contract = new web3.eth.Contract(ABI, contractAddress);

    const ownerAddr = await contract.methods.ownerOf(tokenID).call()
    const name = await contract.methods.name().call()
    // contract owner as well?

    var isChangeable = false;
    await contract.methods.setBaseURI('new_uri').estimateGas()
        .then(response => {console.log(response); response.json().then(data=>console.log(data));})
        .catch(err => {
            console.log(err);
            if (
                err.message.includes('Only operator can call this method') ||
                err.message.includes('Ownable: caller is not the owner')
                ) {
                isChangeable = true;
            }
        });

    const tokenURI = await contract.methods.tokenURI(tokenID).call();
    const response = await fetch(queryableURL(tokenURI));
    const tokenData = await response.json();
    const nft = new NFT(name, tokenURI, tokenData, tokenData.image, ownerAddr, isChangeable, 'setBaseURI');
    console.log(nft);
    return nft;
}


