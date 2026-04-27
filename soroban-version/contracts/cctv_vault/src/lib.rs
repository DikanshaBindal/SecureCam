#![no_std]
use soroban_sdk::{
    contract, contractimpl, contracttype, symbol_short, Address, Env, String, Symbol, Vec,
};

// Access Registry Client for inter-contract calls
mod access_registry {
    soroban_sdk::contractimport!(
        file = "../access_registry/target/wasm32-unknown-unknown/release/access_registry.wasm"
    );
}

// Token Interface
mod token {
    soroban_sdk::contractimport!(file = "../../token/soroban_token_contract.wasm");
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct FootageRecord {
    pub footage_id: u64,
    pub uploader: Address,
    pub footage_hash: String,
    pub label: String,
    pub timestamp: u64,
}

const REGISTRY_ID: Symbol = symbol_short!("REG_ID");
const FOOTAGE_COUNT: Symbol = symbol_short!("COUNT");
const VAULT_TOKEN_ID: Symbol = symbol_short!("TKN_ID");
const VAULT_THRESHOLD: i128 = 10_0000000; // 10 tokens assuming 7 decimals

#[contract]
pub struct CCTVVault;

#[contractimpl]
impl CCTVVault {
    pub fn init(env: Env, registry_id: Address, token_id: Address) {
        if env.storage().instance().has(&REGISTRY_ID) {
            panic!("Already initialized");
        }
        env.storage().instance().set(&REGISTRY_ID, &registry_id);
        env.storage().instance().set(&VAULT_TOKEN_ID, &token_id);
        env.storage().instance().set(&FOOTAGE_COUNT, &0u64);
    }

    pub fn register_footage(
        env: Env,
        uploader: Address,
        footage_hash: String,
        label: String,
        timestamp: u64,
    ) -> u64 {
        uploader.require_auth();

        // Check if verified via inter-contract call
        let registry_id: Address = env.storage().instance().get(&REGISTRY_ID).unwrap();
        let registry_client = access_registry::Client::new(&env, &registry_id);
        if !registry_client.is_verified(&uploader) {
            panic!("Unauthorized: User not verified");
        }

        // Check token balance ($VAULT)
        let token_id: Address = env.storage().instance().get(&VAULT_TOKEN_ID).unwrap();
        let token_client = token::Client::new(&env, &token_id);
        let balance = token_client.balance(&uploader);
        if balance < VAULT_THRESHOLD {
            panic!("Insufficient $VAULT balance: Need 10");
        }

        let mut count: u64 = env.storage().instance().get(&FOOTAGE_COUNT).unwrap();
        count += 1;

        let record = FootageRecord {
            footage_id: count,
            uploader: uploader.clone(),
            footage_hash,
            label,
            timestamp,
        };

        env.storage().persistent().set(&count, &record);
        env.storage().instance().set(&FOOTAGE_COUNT, &count);

        count
    }

    pub fn get_footage(env: Env, requester: Address, footage_id: u64) -> FootageRecord {
        requester.require_auth();

        // Check verification
        let registry_id: Address = env.storage().instance().get(&REGISTRY_ID).unwrap();
        let registry_client = access_registry::Client::new(&env, &registry_id);
        if !registry_client.is_verified(&requester) {
            panic!("Unauthorized: Access Denied");
        }

        env.storage()
            .persistent()
            .get(&footage_id)
            .expect("FootageNotFound: Invalid footage_id")
    }

    pub fn get_all_footage_ids(env: Env) -> Vec<u64> {
        let count: u64 = env.storage().instance().get(&FOOTAGE_COUNT).unwrap();
        let mut ids = Vec::new(&env);
        for i in 1..=count {
            ids.push_back(i);
        }
        ids
    }
}
