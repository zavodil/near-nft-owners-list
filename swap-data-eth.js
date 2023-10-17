import * as nearAPI from "near-api-js";
import * as cg from "coingecko-api-v3";

const DEFAULT_NETWORK_ID = "ethereum";
const CONTRACT_ID = "social.near";
const ETHEREUM_NETWORK_ID = "ethereum";
const FETCH_TIMEOUT = 7000;

async function connect() {
    const config = {
        networkId: "mainnet",
        keyStore: new nearAPI.keyStores.InMemoryKeyStore(),
        nodeUrl: "https://rpc.mainnet.near.org",
        walletUrl: "https://wallet.mainnet.near.org",
        helperUrl: "https://helper.mainnet.near.org",
        explorerUrl: "https://explorer.mainnet.near.org",
    };
    const near = await nearAPI.connect(config);
    const account = await near.account(CONTRACT_ID);

    const contract = new nearAPI.Contract(
        account, // the account object that is connecting
        CONTRACT_ID,
        {
            // name of contract you're connecting to
            viewMethods: ["get"], // view methods do not change state but usually return a value
            changeMethods: [], // change methods modify state
            sender: account, // account object to initialize and sign transactions.
        }
    );

    return contract;
}

let contract = await connect();


const data = await contract.get({keys: ["zavodil.near/dexlist/chains/**"]});

const chains = data["zavodil.near"]["dexlist"]["chains"];
const result = {};

const client = new cg.CoinGeckoClient({
    timeout: 5000,
    autoRetry: false,
});


let res = {};
for (let i = 0; i < Object.keys(chains).length; i++) {
    const chainId = Object.keys(chains)[i];

    if (chainId !== "1") {
        continue;
    }

    const loadedAssets = [];
    const dexes = chains[chainId];
    for (let j = 0; j < Object.keys(dexes).length; j++) {
        const dexName = Object.keys(dexes)[j];

        if (dexes[dexName]?.["coingecko_token_ids"] === '[]') {
            dexes[dexName]["coingecko_token_ids"] = null;
        }

        const assets = JSON.parse(dexes[dexName]["assets"]);
        const coingeckoTokenIds = dexes[dexName]?.["coingecko_token_ids"] ?? {};

        for (let n = 0; n < assets.length; n++) {
            let assetId = assets[n].toLowerCase();
            if (!loadedAssets.includes(assetId)) {
                let networkId
                if (Object.keys(coingeckoTokenIds).includes(assetId)) {
                    networkId = ETHEREUM_NETWORK_ID;
                    assetId = coingeckoTokenIds[assetId].toLowerCase();
                } else {
                    networkId = DEFAULT_NETWORK_ID;
                }
                // console.log("loading", assetId, "from", networkId);

                try {
                    const data = await client.contract({id: networkId, contract_address: assetId});
                    //console.log("data", data)
                    const tokenData = {
                        metadata: {
                            name: data['name'],
                            symbol: data['symbol'],
                            icon: data["image"]?.["thumb"],
                            decimals: data["detail_platforms"]?.[networkId ?? "ethereum"]?.["decimal_place"]
                        },
                        price: data["market_data"]?.["current_price"]?.["usd"]
                    };
                    loadedAssets.push(assetId);
                    res[assetId] = tokenData;

                    await new Promise((resolve) => {
                        setTimeout(resolve, FETCH_TIMEOUT); // Wait for 1 second (1000 milliseconds)
                    });

                } catch (ex) {
                    //console.log(assetId, ex)
                }
            } else {
                //console.log("Already loaded", assetId)
            }

        }
    }
}

console.log(JSON.stringify({
    timestamp: Date.now(),
    data: res
}));


