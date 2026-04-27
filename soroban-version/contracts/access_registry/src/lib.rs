#![no_std]
use soroban_sdk::{contract, contractimpl, Address, Env, Symbol, symbol_short};

const ADMIN: Symbol = symbol_short!("ADMIN");
const VERIFIED: Symbol = symbol_short!("VERIFIED");

#[contract]
pub struct AccessRegistry;

#[contractimpl]
impl AccessRegistry {
    pub fn init(env: Env, admin: Address) {
        if env.storage().instance().has(&ADMIN) {
            panic!("Already initialized");
        }
        env.storage().instance().set(&ADMIN, &admin);
    }

    pub fn add_verified_user(env: Env, admin: Address, user: Address) {
        admin.require_auth();
        let current_admin: Address = env.storage().instance().get(&ADMIN).unwrap();
        if admin != current_admin {
            panic!("Unauthorized: Not admin");
        }
        env.storage().persistent().set(&user, &true);
    }

    pub fn remove_verified_user(env: Env, admin: Address, user: Address) {
        admin.require_auth();
        let current_admin: Address = env.storage().instance().get(&ADMIN).unwrap();
        if admin != current_admin {
            panic!("Unauthorized: Not admin");
        }
        env.storage().persistent().remove(&user);
    }

    pub fn is_verified(env: Env, user: Address) -> bool {
        env.storage().persistent().get(&user).unwrap_or(false)
    }
}

#[cfg(test)]
mod test {
    use super::*;
    use soroban_sdk::testutils::Address_ as _;

    #[test]
    fn test_verification_flow() {
        let env = Env::default();
        let contract_id = env.register_contract(None, AccessRegistry);
        let client = AccessRegistryClient::new(&env, &contract_id);

        let admin = Address::generate(&env);
        let user = Address::generate(&env);

        client.init(&admin);
        
        assert!(!client.is_verified(&user));
        
        client.add_verified_user(&admin, &user);
        assert!(client.is_verified(&user));
        
        client.remove_verified_user(&admin, &user);
        assert!(!client.is_verified(&user));
    }
}
