// ------------- DOM access ------------------
async function readNFT() {
    resetAllHidden();

    // validate input
    var input = document.getElementById("main-input").value;
    const parsedInput = validateInput(input);
    if (parsedInput === null) {
        document.getElementById("error-output").hidden = false;
        return;
    }
    const {contractAddress, tokenID} = parsedInput.groups;

    // query nft data
    if (handleCryptoPunks(contractAddress)) {
        return;
    }
    const nft = await getNFTInfo(contractAddress, tokenID);

    // build dom
    document.getElementById("main-output").hidden = false;
    buildHeader(nft, tokenID);
    var traitsID;
    if (nft.onChain) {
        traitsID = "nft-on-chain-traits";
    } else {
        buildOnChainSection(nft, tokenID);
        buildOffChainSection(nft);
        traitsID = "nft-off-chain-traits";
    }
    document.getElementById(traitsID).innerHTML = formatTraits(nft.tokenData);
    document.getElementById(traitsID).hidden = false;
    buildExplanatorySection(nft, tokenID, contractAddress);
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
        buildSource(contractAddress, "CryptoPunks");
        document.getElementById("footer").hidden = false;
        return true;
    }
    return false;
}


function URItoLink(uri) {
    const url = queryableURL(uri, false);
    return `<a class="token-uri" href=${url} target="_blank"><b>${uri}</b></a>`
}

function buildHeader(nft, tokenID) {
    /* token name and image at top */
    document.getElementById("nft-name").innerHTML = `${nft.name} #${tokenID}`;

    var imgElem = document.getElementById("main-image");
    var imgContent;
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
    const ownerHTML = `<b>${nft.name} #${tokenID}</b> is owned by the account <b>${nft.ownerAddr}</b>.`
    document.getElementById("nft-owner").innerHTML = ownerHTML;

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
        tableHTML += `<tr><th>${key}</th><td>${JSON.stringify(content, undefined, 2).replace(/\"/g, "")}</td></tr>`;
    }
    var imgContent;
    if (image.startsWith("data:image/svg+xml;base64,")) {
        imgContent = image.slice(0, "data:image/svg+xml;base64,".length + 200) + "......";
    } else{
        imgContent = URItoLink(image);
    }
    tableHTML += `<tr><th>image</th><td>${imgContent}</td></tr>`
    return `<table><tbody>${tableHTML}</tbody></table>`
}


function buildOffChainSection(nft) {
    document.getElementById("off-chain").hidden = false;

    const headerTxt = `What's NOT stored on the blockchain, but instead at ${URItoLink(nft.tokenURI)}:`;
    document.getElementById("off-chain-heading").innerHTML = headerTxt;
}


function buildSource(contractAddress, name) {
    var sourceLink = document.getElementById("nft-source");
    sourceLink.hidden = false;
    sourceLink.innerHTML = `You can read the source code for ${name} here to see this for yourself.`;
    sourceLink.href = `https://etherscan.io/address/${contractAddress}#code`;
}


function buildExplanatorySection(nft, tokenID, contractAddress) {

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
        content on the Ethereum blockchain.`
        if (!(nft.tokenURI.includes('/ipfs/') || nft.tokenURI.includes('ipfs://'))) {
            explanationText += ` But it means that whoever owns the server behind ${URItoLink(nft.tokenURI)} can change the
            content stored there at any time. Everything above in the red box is subject to change without the NFT owner's
            permission.`
        }

        if (nft.knownChangeable) {
            explanationText += `<br><br>Further, according to the this NFT's contract's source code, someone can
            call the function <b>${nft.changeFn}</b> and replace the value ${URItoLink(nft.tokenURI)}
            on the blockchain with a different link. <b>Essentially, the owner of ${nft.name} #${tokenID}
            only owns a link that might change at any time</b>.`
        }
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
    const re = new RegExp('^(https://)?(opensea.io/assets/ethereum|looksrare.org/collections)/(?<contractAddress>.+)/(?<tokenID>[0-9]+)/?$');
    return input.match(re);
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
    constructor(name, tokenURI, tokenData, onChain, imageURI, ownerAddr, knownChangeable, changeFn) {
        this.name = name;
        this.tokenURI = tokenURI;
        this.tokenData = tokenData;
        this.onChain = onChain;
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
    var tokenData;
    var onChain;
    if (tokenURI.startsWith("data:application/json;base64,")) {
        tokenData = JSON.parse(atob(tokenURI.slice("data:application/json;base64,".length)));
        console.log(tokenData);
        onChain = true;
    } else {
        const tokenResponse = await fetch(queryableURL(tokenURI, true));
        tokenData = await tokenResponse.json();
        onChain = false;
    }
    const nft = new NFT(name, tokenURI, tokenData, onChain, tokenData.image, ownerAddr, isChangeable, 'setBaseURI');
    return nft;
}
