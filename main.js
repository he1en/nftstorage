// ------------- DOM access ------------------
async function readNFT() {

    // query nft data
    var input = document.getElementById("main-input").value;
    validateInput(input);
    const {contractAddress, tokenID} = parseMarketplaceLink(input);
    const nft = await getNFTInfo(contractAddress, tokenID);

    // build dom
    document.getElementById("main-output").hidden = false;
    buildOnChainSection(nft, tokenID);
    buildOffChainSection(nft);
    buildExplanatorySection(nft, tokenID, contractAddress);

}

function URItoLink(uri) {
    const url = queryableURL(uri, false);
    return `<a href=${url} target="_blank"><b>${uri}</b></a>`
}


function buildOnChainSection(nft, tokenID) {
    document.getElementById("nft-name").innerHTML = `${nft.name} #${tokenID}`;
    document.getElementById("nft-image").src = queryableURL(nft.imageURI, true);

    const ownerHTML = `<b>${nft.name} #${tokenID}</b> is owned by the account <b>${nft.ownerAddr}</b>.`
    document.getElementById("nft-owner").innerHTML = ownerHTML;

    const locHTML = `The URI for <b>${nft.name} #${tokenID}</b> is ${URItoLink(nft.tokenURI)}.`;
    document.getElementById("nft-location-upper").innerHTML = locHTML;
}

function formatTraits(tokenDataJSON) {
    // force image element to the bottom for emphasis
    // const imageElem = tokenDataJSON["image"];
    // delete tokenDataJSON.image;

    const {image, ...rest} = tokenDataJSON;

    var result = ""
    for(var key of Object.keys(rest)) {
        const content = rest[key];
        result += `<tr><th>${key}</th><td>${JSON.stringify(content, undefined, 2)}</td></tr>`
    }
    result += `<tr><th>image</th><td>${URItoLink(image)}</td></tr>`

    // var traits = JSON.stringify(tokenDataJSON, null, 4);
    // traits = traits.replace(/\"/g, "");
    // traits = traits.slice(1, traits.length - 1);  // cut off surrounding {} to look better

    // traits = traits.slice(0, traits.length - 1) + ',' + '\n' + "    image: " + ;
    // return traits;


    return `<table><tbody>${result}</tbody></table>`
}

function buildOffChainSection(nft) {
    const headerTxt = `What's NOT stored on the blockchain, but instead at ${URItoLink(nft.tokenURI)}:`;
    document.getElementById("off-chain-heading").innerHTML = headerTxt;

    const traits = formatTraits(nft.tokenData);
    document.getElementById("nft-traits").innerHTML = traits;

    const imageInfo = `The purple URL after "image" determines the NFT's image.
    We used it to retrieve the image at the top of the page.`
    document.getElementById("nft-image-info").innerHTML = imageInfo;
}

function buildExplanatorySection(nft, tokenID, contractAddress) {

    var explanationText = `It is the <a target="_blank" href="https://eips.ethereum.org/EIPS/eip-721" t>accepted standard</a>
    that the representation of an NFT on the blockchain is just a pointer to another URL which
    stores the information about the NFT, including its image.`
    if (!nft.tokenURI.includes('ipfs/')) {
        explanationText += ` Whoever owns the server behind ${URItoLink(nft.tokenURI)} can change the content
        stored there at any time. Everything above in the red box is subject to change without the NFT owner's
        permission.`
    }
    document.getElementById("explanation").innerHTML = explanationText;

    if (nft.knownChangeable) {
        const changeText = `<br>Further, according to the this NFT's contract's source code, someone can
        call the function <b>${nft.changeFn}</b> and replace the value ${URItoLink(nft.tokenURI)}
        on the blockchain with something different. <b>Essentially, the owner of ${nft.name} #${tokenID}
        only owns a link that could change at any time</b>.`
        document.getElementById("nft-changeable").innerHTML = changeText;
        document.getElementById("nft-changeable").hidden = false;
    } else {
        document.getElementById("nft-changeable").hidden = true;
    }

    // extras
    var sourceLink = document.getElementById("nft-source");
    sourceLink.innerHTML = "You can read the source code for this NFT here to see this for yourself."
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
    // TODO: goblins, secureBaseUri, setBaseTokenURI, cryptopunks, updateProjectBaseURI, setMetadataURI contracts with many NFTs
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
    // contract owner as well?

    var isChangeable = false;
    await contract.methods.setBaseURI('new_uri').estimateGas()
        .then(response => {console.log(response); response.json().then(data=>console.log(data));})
        .catch(err => {
            console.log(err);
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
    console.log(nft);
    return nft;
}


