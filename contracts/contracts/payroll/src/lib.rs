#![no_std]
use soroban_sdk::{
    contract, contractimpl, contracttype, token, Address, Env, Vec,
};

#[contracttype]
pub struct PaymentEntry {
    pub recipient: Address,
    pub amount: i128,
}

#[contracttype]
pub enum DataKey {
    Admin,
    UsdcToken,
}

#[contract]
pub struct PayrollContract;

#[contractimpl]
impl PayrollContract {
    /// Initialize with admin and USDC token contract address.
    pub fn initialize(env: Env, admin: Address, usdc_token: Address) {
        admin.require_auth();
        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage().instance().set(&DataKey::UsdcToken, &usdc_token);
    }

    /// Disburse USDC to a list of recipients in a single transaction.
    /// Caller must have approved this contract to spend the total amount.
    pub fn disburse(env: Env, from: Address, payments: Vec<PaymentEntry>) {
        from.require_auth();

        let token_id: Address = env.storage().instance().get(&DataKey::UsdcToken).unwrap();
        let token = token::Client::new(&env, &token_id);

        let total: i128 = payments.iter().map(|p| p.amount).sum();
        // Transfer total from caller to contract first
        token.transfer(&from, &env.current_contract_address(), &total);

        // Distribute to each recipient
        for payment in payments.iter() {
            token.transfer(&env.current_contract_address(), &payment.recipient, &payment.amount);
        }
    }

    pub fn get_admin(env: Env) -> Address {
        env.storage().instance().get(&DataKey::Admin).unwrap()
    }

    pub fn get_token(env: Env) -> Address {
        env.storage().instance().get(&DataKey::UsdcToken).unwrap()
    }
}

#[cfg(test)]
mod test {
    use super::*;
    use soroban_sdk::{testutils::Address as _, vec, Env};

    #[test]
    fn test_disburse() {
        let env = Env::default();
        env.mock_all_auths();

        let admin = Address::generate(&env);
        let usdc_token_id = env.register_stellar_asset_contract_v2(admin.clone()).address();
        let contract_id = env.register(PayrollContract, ());
        let client = PayrollContractClient::new(&env, &contract_id);

        client.initialize(&admin, &usdc_token_id);

        let token = token::StellarAssetClient::new(&env, &usdc_token_id);
        let employer = Address::generate(&env);
        token.mint(&employer, &1000_0000000);

        let alice = Address::generate(&env);
        let bob = Address::generate(&env);

        let payments = vec![
            &env,
            PaymentEntry { recipient: alice.clone(), amount: 500_0000000 },
            PaymentEntry { recipient: bob.clone(), amount: 500_0000000 },
        ];

        client.disburse(&employer, &payments);

        let token_client = token::Client::new(&env, &usdc_token_id);
        assert_eq!(token_client.balance(&alice), 500_0000000);
        assert_eq!(token_client.balance(&bob), 500_0000000);
    }
}
