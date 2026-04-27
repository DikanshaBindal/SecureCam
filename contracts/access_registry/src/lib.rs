#![no_std]
use soroban_sdk::{contract, contractimpl, Env, Symbol, symbol_short, String, Vec};

#[contract]
pub struct SecureCamRegistry;

#[contractimpl]
impl SecureCamRegistry {
    /// Records an immutable forensic entry for a recording.
    /// Stores: Recording ID -> [File Hash, Timestamp]
    pub fn record_footage(env: Env, id: String, hash: String, timestamp: String) {
        let key = Symbol::new(&env, "logs");
        let mut logs: Vec<(String, String, String)> = env.storage().instance().get(&key).unwrap_or(Vec::new(&env));
        
        logs.push_back((id, hash, timestamp));
        
        env.storage().instance().set(&key, &logs);
    }

    /// Retrieves all forensic logs (for the Audit Tool).
    pub fn get_logs(env: Env) -> Vec<(String, String, String)> {
        let key = Symbol::new(&env, "logs");
        env.storage().instance().get(&key).unwrap_or(Vec::new(&env))
    }
}
