// ------------- DOM access ------------------
async function readNFT() {

    // reset in case of errors
    document.getElementById("main-output").hidden = true;

    // validate input
    var input = document.getElementById("main-input").value;
    if (!validateInput(input)) {
        document.getElementById("error-output").hidden = false;
        return;
    } else {
        document.getElementById("error-output").hidden = true;
    }

    // query nft data
    const {contractAddress, tokenID} = parseMarketplaceLink(input);
    if (handleCryptoPunks(contractAddress)) {
        return;
    }
    const nft = await getNFTInfo(contractAddress, tokenID);

    // build dom
    document.getElementById("main-output").hidden = false;
    buildOnChainSection(nft, tokenID);
    buildOffChainSection(nft);
    buildExplanatorySection(nft, tokenID, contractAddress);
    document.getElementById("footer").hidden = false;
}

function handleCryptoPunks(contractAddress) {
    /*
    Feels weird to have such an edge case, but they really are a crazy
    edge case that the marketplaces have to handle differently too. There's
    nothing to query from the blockchain
    */
   if (contractAddress === "0xb47e3cd837ddf8e4c57f05d70ab865de6e193bbb") {
        document.getElementById("cryptopunks-output").hidden = false;
        buildSource(contractAddress, "CryptoPunks");
        document.getElementById("footer").hidden = false;
        return true;
    } else {
        document.getElementById("cryptopunks-output").hidden = true;
        return false;
    }
}


function URItoLink(uri) {
    const url = queryableURL(uri, false);
    return `<a class="token-uri" href=${url} target="_blank"><b>${uri}</b></a>`
}


function buildOnChainSection(nft, tokenID) {
    document.getElementById("nft-name").innerHTML = `${nft.name} #${tokenID}`;
    document.getElementById("main-image").src = queryableURL(nft.imageURI, true);

    const ownerHTML = `<b>${nft.name} #${tokenID}</b> is owned by the account <b>${nft.ownerAddr}</b>.`
    document.getElementById("nft-owner").innerHTML = ownerHTML;

    const locHTML = `The URI for <b>${nft.name} #${tokenID}</b> is ${URItoLink(nft.tokenURI)}.`;
    document.getElementById("nft-location-upper").innerHTML = locHTML;
}


function formatTraits(tokenDataJSON) {
    /*
    Turn the NFT traits metadata json into a table.
    Force the image element to the bottom for emphasis.
    */

    const {image, ...rest} = tokenDataJSON;
    var result = ""
    for(var key of Object.keys(rest)) {
        const content = rest[key];
        result += `<tr><th>${key}</th><td>${JSON.stringify(content, undefined, 2).replace(/\"/g, "")}</td></tr>`
    }
    result += `<tr><th>image</th><td>${URItoLink(image)}</td></tr>`
    return `<table><tbody>${result}</tbody></table>`
}


function buildOffChainSection(nft) {
    const headerTxt = `What's NOT stored on the blockchain, but instead at ${URItoLink(nft.tokenURI)}:`;
    document.getElementById("off-chain-heading").innerHTML = headerTxt;

    const traits = formatTraits(nft.tokenData);
    document.getElementById("nft-traits").innerHTML = traits;
}


function buildSource(contractAddress, name) {
    var sourceLink = document.getElementById("nft-source");
    sourceLink.innerHTML = `You can read the source code for ${name} here to see this for yourself.`;
    sourceLink.href = `https://etherscan.io/address/${contractAddress}#code`;
}


function buildExplanatorySection(nft, tokenID, contractAddress) {

    var explanationText = `Why is it stored like this? It is the <a target="_blank" href="https://eips.ethereum.org/EIPS/eip-721">
    accepted standard</a> that the representation of an NFT on the blockchain is just a pointer to another URL which
    stores the information about the NFT, including its image.`
    if (!(nft.tokenURI.includes('/ipfs/') || nft.tokenURI.includes('ipfs://'))) {
        explanationText += ` Whoever owns the server behind ${URItoLink(nft.tokenURI)} can change the content
        stored there at any time. Everything above in the red box is subject to change without the NFT owner's
        permission.`
    }

    if (nft.knownChangeable) {
        explanationText += `<br><br>Further, according to the this NFT's contract's source code, someone can
        call the function <b>${nft.changeFn}</b> and replace the value ${URItoLink(nft.tokenURI)}
        on the blockchain with a different link. <b>Essentially, the owner of ${nft.name} #${tokenID}
        only owns a link that might change at any time</b>.`
    }
    document.getElementById("explanation").innerHTML = explanationText;

    buildSource(contractAddress, nft.name);
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
    // TODO: goblins, secureBaseUri, setBaseTokenURI, updateProjectBaseURI, setMetadataURI contracts with many NFTs
];


function validateInput(input) {
    // todo improve
    if (input.startsWith('https://opensea.io/assets/ethereum') ||
        input.startsWith('https://looksrare.org/collections')) {
            return true;
    }
    return false;
}


function parseMarketplaceLink(marketplaceLink) {
    // todo improve
    if (marketplaceLink.endsWith('/')) {
        marketplaceLink = marketplaceLink.substring(0, marketplaceLink.length - 1);
    }
    const URLparts = marketplaceLink.split('/');
    const tokenID = parseInt(URLparts[URLparts.length - 1]);
    const contractAddress = URLparts[URLparts.length - 2];
    return {tokenID, contractAddress};
}


function queryableURL(uri, shouldProxy) {
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
    if (shouldProxy) {
        return `https://corsproxy.he1en.workers.dev/?${uri}`;
    }
    return uri;
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

    var isChangeable = false;
    await contract.methods.setBaseURI('new_uri').estimateGas()
        .then(response => {console.log(response); response.json().then(data=>console.log(data));})
        .catch(err => {
            //console.log(err);
            if (
                err.message.includes('Only operator can call this method') ||
                err.message.includes('Ownable: caller is not the owner') ||
                err.message.includes('AccessControl')
                ) {
                isChangeable = true;
            }
        });

    const tokenURI = await contract.methods.tokenURI(tokenID).call();
    // todo handle application/json token URIs
    const response = await fetch(queryableURL(tokenURI, true));
    const tokenData = await response.json();
    const nft = new NFT(name, tokenURI, tokenData, tokenData.image, ownerAddr, isChangeable, 'setBaseURI');
    //console.log(nft);
    return nft;
}


