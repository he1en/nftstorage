// ------------- DOM access ------------------
async function readNFT() {
    resetAllHidden();

    // validate input
    var rawInput = document.getElementById("main-input").value;
    const input = validateInput(rawInput);
    if (input === null) {
        displayError(null);
        return;
    }

    // query nft data
    if (handleCryptoPunks(input.contractAddress)) {
        return;
    }
    document.getElementById("loading").innerHTML = `Querying the ${input.chain} Blockchain...`;
    let nft;
    try {
        nft = await getNFTInfo(input.contractAddress, input.tokenID, input.chain);
    } catch {
        displayError(input.contractAddress, input.chain);
        document.getElementById("loading").innerHTML = "";
        return;
    }

    // build dom
    document.getElementById("loading").innerHTML = "";
    document.getElementById("main-output").hidden = false;
    document.getElementById("on-chain-heading").innerHTML = `What's stored on the ${input.chain} Blockchain`;
    buildHeader(nft, input.tokenID);
    let traitsID;
    if (nft.onChain) {
        traitsID = "nft-on-chain-traits";
    } else {
        buildOnChainSection(nft, input.tokenID);
        buildOffChainSection(nft);
        traitsID = "nft-off-chain-traits";
    }
    document.getElementById(traitsID).innerHTML = formatTraits(nft.tokenData);
    document.getElementById(traitsID).hidden = false;
    buildExplanatorySection(nft, input.tokenID, input.contractAddress, input.chain);
    document.getElementById("footer").hidden = false;
}

function resetAllHidden() {
    const elemIDs = [
        "main-output",
        "error-output",
        "off-chain-nft-location",
        "nft-on-chain-traits",
        "off-chain",
        "thats-it",
        "footer",
        "cryptopunks-output",
        "nft-source"
    ];
    for (var elemId of elemIDs) {
        document.getElementById(elemId).hidden = true;
    }
}

function handleCryptoPunks(contractAddress) {
    /*
    Feels weird to have such an edge case, but they really are a crazy
    edge case that the marketplaces have to handle differently too. There's
    nothing to query from the blockchain
    */
   if (contractAddress === "0xb47e3cd837ddf8e4c57f05d70ab865de6e193bbb") {
        document.getElementById("cryptopunks-output").hidden = false;
        buildSource(contractAddress, "CryptoPunks", "Ethereum");
        document.getElementById("footer").hidden = false;
        return true;
    }
    return false;
}


function URItoLink(uri) {
    const url = queryableURL(uri, false);
    return `<a class="breakable" href=${url} target="_blank"><b>${uri}</b></a>`
}

function buildHeader(nft, tokenID) {
    /* token name and image at top */
    document.getElementById("nft-name").innerHTML = `${nft.name} #${tokenID}`;

    var imgElem = document.getElementById("main-image");
    let imgContent;
    if (nft.imageURI.startsWith("data:image/svg+xml;base64,")) {
        const content = atob(nft.imageURI.slice("data:image/svg+xml;base64,".length))
        imgElem.style.height = "100%";
        imgElem.style.width = "100%";
        imgContent = content;
    } else {
        imgContent = `<img class="nft-image" src=${queryableURL(nft.imageURI, true)}></img>`;
    }
    imgElem.innerHTML = imgContent;

}

function buildOnChainSection(nft, tokenID) {
    if (!(nft.ownerAddr === null)) {
        const ownerHTML = `<b>${nft.name} #${tokenID}</b> is owned by the account <b class="breakable">${nft.ownerAddr}</b>.`
        document.getElementById("nft-owner").innerHTML = ownerHTML;
    }

    const locHTML = `The URI for <b>${nft.name} #${tokenID}</b> is ${URItoLink(nft.tokenURI)}.`;
    document.getElementById("off-chain-nft-location").innerHTML = locHTML;
    document.getElementById("off-chain-nft-location").hidden = false;
    document.getElementById("thats-it").hidden = false;
}


function formatTraits(tokenDataJSON) {
    /*
    Turn the NFT traits metadata json into a table.
    Force the image element to the bottom for emphasis.
    */
    const {image, ...rest} = tokenDataJSON;
    var tableHTML = "";
    for(var key of Object.keys(rest)) {
        const content = rest[key];
        tableHTML += `<tr><th>${key}</th><td class="breakable">${JSON.stringify(content, undefined, 2).replace(/\"/g, "")}</td></tr>`;
    }
    let imgContent;
    if (image.startsWith("data:image/svg+xml;base64,")) {
        imgContent = image.slice(0, "data:image/svg+xml;base64,".length + 200) + "......";
    } else{
        imgContent = URItoLink(image);
    }
    tableHTML += `<tr><th>image</th><td class="breakable">${imgContent}</td></tr>`
    return `<table><tbody>${tableHTML}</tbody></table>`
}


function buildOffChainSection(nft) {
    document.getElementById("off-chain").hidden = false;

    const headerTxt = `What's NOT stored on the blockchain, but instead at ${URItoLink(nft.tokenURI)}:`;
    document.getElementById("off-chain-heading").innerHTML = headerTxt;
}


function buildSource(contractAddress, name, chain) {
    var sourceLink = document.getElementById("nft-source");
    sourceLink.hidden = false;
    sourceLink.innerHTML = `You can read the source code for ${name} here to see this for yourself.`;
    if (chain === "Ethereum") {
        sourceLink.href = `https://etherscan.io/address/${contractAddress}#code`;
    } else {
        sourceLink.href = `https://polygonscan.com/address/${contractAddress}#code`;
    }
}


function buildExplanatorySection(nft, tokenID, contractAddress, chain) {

    var explanationText;
    if (nft.onChain) {
        explanationText = `The ${nft.name} NFTs do a great job, unlike many NFTs, of keeping their data on-chain and immutable.
        The above traits, which includes the NFT's image, are base64 encoded and stored on the blockchain. The content after
        "image" above is truncated because it is a long base64 encoded blob that when decoded, produces the image above. `;
        if (nft.tokenData.animation_url) {
           explanationText += `If the NFT looks like its moving when you've seen it on a marketplace but doesn't here, it's because the
           marketplace is using the content stored at the animation_url above, not using the image content stored on the blockchain.`;
        }

    } else {
        explanationText = `Why is the NFT stored like this? It is the <a target="_blank" href="https://eips.ethereum.org/EIPS/eip-721">
        accepted standard</a> that the representation of an NFT on the blockchain is just a URL which points to where the
        information about the NFT, including its image, is stored. One reason for this is that it is incredibly expensive to store
        content on blockchains, especially the Ethereum blockchain.`
        if (!(nft.tokenURI.includes('/ipfs/') || nft.tokenURI.includes('ipfs://'))) {
            explanationText += ` But it means that whoever owns the server behind ${URItoLink(nft.tokenURI)} can change the
            content stored there at any time. Everything above in the red box is subject to change without the NFT owner's
            permission.`
        }

        if (nft.setURIFn) {
            explanationText += `<br><br>Further, according to the this NFT's contract's source code, someone can
            call the function <b>${nft.setURIFn}</b> and replace the value ${URItoLink(nft.tokenURI)}
            on the blockchain with a different link. <b>Essentially, the owner of ${nft.name} #${tokenID}
            only owns a link that might change at any time</b>.`
        }
    }

    document.getElementById("explanation").innerHTML = explanationText;

    buildSource(contractAddress, nft.name, chain);
}

function displayError(contractAddress, chain) {
    var errorHTML;
    if (contractAddress === null) {
        // input error
        errorHTML = "Please enter a valid OpenSea or LooksRare URL to an Ethereum or Polygon NFT, including the token ID at the end.";
    } else {
        buildSource(contractAddress, "this NFT", chain);
        errorHTML = "Sorry, we couldn't get data about that NFT. It might not conform the accepted NFT ERC-721 or ERC-1155 standard."
    }

    errorHTML += " To find a valid NFT, you can click the links above to browse the most valuable NFTs."

    var errorElem = document.getElementById("error-output");
    errorElem.hidden = false;
    errorElem.innerHTML = errorHTML;
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
class parsedInput {
    constructor(chain, contractAddress, tokenID) {
        this.chain = chain;
        this.contractAddress = contractAddress;
        this.tokenID = tokenID;
    }
}


class NFT {
    constructor(name, tokenURI, tokenData, onChain, imageURI, ownerAddr, setURIFn) {
        this.name = name;
        this.tokenURI = tokenURI;
        this.tokenData = tokenData;
        this.onChain = onChain;
        this.imageURI = imageURI;
        this.ownerAddr = ownerAddr;
        this.setURIFn = setURIFn;
    }
}


function validateInput(input) {
    const re = new RegExp('^(https://)?(?<chain>opensea.io/assets/ethereum|opensea.io/assets/matic|looksrare.org/collections)/(?<contractAddress>.+)/(?<tokenID>[0-9]+)/?$');
    const match = input.match(re);
    if (match === null) {
        return null;
    }
    let chain;
    if (match.groups.chain === "opensea.io/assets/matic") {
        chain = "Polygon";
    } else {
        chain = "Ethereum";
    }
    return new parsedInput(chain, match.groups.contractAddress, match.groups.tokenID);

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


function getProvider(chain) {
    if (chain === "Ethereum") {
        return "https://cloudflare-eth.com";
    } else if (chain === "Polygon") {
        return "https://polygon-rpc.com";
    } else {
        assert(false, "Only Ethereum and Polygon supported");
    }
}


async function getURIChangeFn(contract) {
    /*
    Query all known possibilities for a URI change function in parallel, and if
    the error message reflects that the function exists but can only be called
    by a privileged account, return it
    */

    const knownChangeURIFns = [
        "setBaseURI",
        "setBaseUri",
        "setBaseTokenURI",
        "setTokenBaseURI",
        "setTokenURI",
        "setURI",
        "setURIs",
        "secureBaseUri",
        "setMetadataURI",
        "makegobblinhaveparts",
        "makeSNAKhaveparts",
        "setRevealedBaseURI"
    ];
    const fnPromises = knownChangeURIFns.map(async function(fnName) {
        await contract.methods[fnName]('new_uri').estimateGas();
    });
    const responses = await Promise.allSettled(fnPromises);
    for (var i = 0; i <knownChangeURIFns.length; i++) {
        const res = responses[i];
        if (res.status === 'rejected' && (
                res.reason.message.includes('Only operator') ||
                res.reason.message.includes('Ownable: caller is not the owner') ||
                res.reason.message.includes('AccessControl') ||
                res.reason.message.includes('Only Admin') ||
                res.reason.message.includes('unauthorized')
            )
        ) {
            return knownChangeURIFns[i];  // promise.allSettled retains order
        }
    }
    return null;
}

async function getNFTInfo(contractAddress, tokenID, chain) {
    const web3 = new Web3(getProvider(chain));
    web3.eth.handleRevert = true;
    const contract = new web3.eth.Contract(partialABI, contractAddress);

    let name, tokenURI, ownerAddr, tokenData, onChain;
    try {
        name = await contract.methods.name().call();
    } catch {
        name = "Unnamed NFT";
    }
    try {
        // erc 721
        tokenURI = await contract.methods.tokenURI(tokenID).call();
        ownerAddr = await contract.methods.ownerOf(tokenID).call();
        name = await contract.methods.name().call();
    } catch {
        // erc 1155
        const templatetokenURI = await contract.methods.uri(tokenID).call();
        tokenURI = templatetokenURI.replace("{id}", tokenID);
        ownerAddr = null;  // ERC 1155 has no getOwner call
    }
    const setURIFn = await getURIChangeFn(contract);

    if (tokenURI.startsWith("data:application/json;base64,")) {
        tokenData = JSON.parse(atob(tokenURI.slice("data:application/json;base64,".length)));
        onChain = true;
    } else {
        const tokenResponse = await fetch(queryableURL(tokenURI, true));
        tokenData = await tokenResponse.json();
        onChain = false;
    }

    return new NFT(name, tokenURI, tokenData, onChain, tokenData.image, ownerAddr, setURIFn);
}


// ------- All ABI below here ---------
const partialABI = [
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
        "name": "uri", // ERC-1155 tokens
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
    // possible functions to set the base uri -- only one will be on the contract
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
    },
    {
        "name": "setBaseTokenURI",
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
    },
    {
        "name": "setURIs",
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
    },
    {
        "name": "secureBaseUri",
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
    },
    {
        "name": "setMetadataURI",
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
    },
    {
        "name": "setURI",
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
    },
    {
        "name": "setTokenBaseURI",
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
    },
    {
        "name": "makegobblinhaveparts",
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
    },
    {
        "name": "makeSNAKhaveparts",
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
    },
    {
        "name": "setTemplateURI",
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
    },
    {
        "name": "setBaseUri",
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
    },
    {
        "name": "setRevealedBaseURI",
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
    },
    {
        "name": "setTokenURI",
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
    },
    {
        "name": "updateProjectBaseURI",  //0xa7d8d9ef8d8ce8992df33d8b8cf4aebabd5bd270
        "inputs": [
            {
                "internalType": "string",
                "name": "uri",
                "type": "string"
            },
            {
                "internalType": "uint256",
                "name": "projectid",
                "type": "uint256"
            }
        ],
        "outputs": [],
        "type": "function",
        "stateMutability":"nonpayable"
    }
];
