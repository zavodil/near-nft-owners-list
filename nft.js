import * as nearAPI from "near-api-js";

const CONTRACT_ID = "x.paras.near";

async function connect () {
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
            viewMethods: ["nft_token"], // view methods do not change state but usually return a value
            changeMethods: [], // change methods modify state
            sender: account, // account object to initialize and sign transactions.
        }
    );

    return contract;
}

let contract = await connect();

let tokens = [
    // QUIZ
    "362285",

    // Burrow AMA
    "335642",

    // Moni Talks
    // "252851:1", => rucommunity.near
    "252851",

    // Contest Winner
    "436550"
];

let owners = [];
for (let t=0; t<tokens.length; t++){
    for (let i=1; i< 1000; i++){
        const full_token_id = `${tokens[t]}:${i}`;

        let token = await contract.nft_token({token_id: full_token_id});

        if (token && token.hasOwnProperty("owner_id")){
            if(token.owner_id !== "rucommunity.near") {
                owners.push(token.owner_id);
            }
        }
        else {
            break;
        }
    }
};

console.log({
        timestamp: new Date().toLocaleString(),
        owners
    });


