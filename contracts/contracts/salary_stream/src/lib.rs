#![no_std]
use soroban_sdk::{contract, contractimpl, contracttype, token, Address, Env};

/// A salary stream: employer locks funds, employee withdraws accrued amount over time.
#[contracttype]
pub struct Stream {
    pub employer: Address,
    pub employee: Address,
    pub token: Address,
    pub rate_per_second: i128, // stroops per second
    pub start_time: u64,
    pub end_time: u64,
    pub withdrawn: i128,
}

#[contracttype]
pub enum DataKey {
    Stream(u64), // stream_id -> Stream
    NextId,
}

#[contract]
pub struct SalaryStreamContract;

#[contractimpl]
impl SalaryStreamContract {
    /// Create a new salary stream. Employer deposits total amount upfront.
    pub fn create_stream(
        env: Env,
        employer: Address,
        employee: Address,
        token: Address,
        total_amount: i128,
        duration_secs: u64,
    ) -> u64 {
        employer.require_auth();

        let start = env.ledger().timestamp();
        let end = start + duration_secs;
        let rate = total_amount / duration_secs as i128;

        // Lock funds in contract
        let token_client = token::Client::new(&env, &token);
        token_client.transfer(&employer, &env.current_contract_address(), &total_amount);

        let id: u64 = env.storage().instance().get(&DataKey::NextId).unwrap_or(0);
        env.storage().instance().set(
            &DataKey::Stream(id),
            &Stream { employer, employee, token, rate_per_second: rate, start_time: start, end_time: end, withdrawn: 0 },
        );
        env.storage().instance().set(&DataKey::NextId, &(id + 1));
        id
    }

    /// Employee withdraws accrued salary.
    pub fn withdraw(env: Env, stream_id: u64) -> i128 {
        let mut stream: Stream = env.storage().instance().get(&DataKey::Stream(stream_id)).unwrap();
        stream.employee.require_auth();

        let now = env.ledger().timestamp().min(stream.end_time);
        let elapsed = now.saturating_sub(stream.start_time) as i128;
        let accrued = elapsed * stream.rate_per_second;
        let claimable = accrued - stream.withdrawn;

        if claimable <= 0 {
            return 0;
        }

        stream.withdrawn += claimable;
        env.storage().instance().set(&DataKey::Stream(stream_id), &stream);

        let token_client = token::Client::new(&env, &stream.token);
        token_client.transfer(&env.current_contract_address(), &stream.employee, &claimable);
        claimable
    }

    /// View accrued but unclaimed amount.
    pub fn claimable(env: Env, stream_id: u64) -> i128 {
        let stream: Stream = env.storage().instance().get(&DataKey::Stream(stream_id)).unwrap();
        let now = env.ledger().timestamp().min(stream.end_time);
        let elapsed = now.saturating_sub(stream.start_time) as i128;
        (elapsed * stream.rate_per_second) - stream.withdrawn
    }
}

#[cfg(test)]
mod test {
    use super::*;
    use soroban_sdk::{testutils::Address as _, testutils::Ledger, Env};

    #[test]
    fn test_stream_and_withdraw() {
        let env = Env::default();
        env.mock_all_auths();

        let employer = Address::generate(&env);
        let employee = Address::generate(&env);
        let token_id = env.register_stellar_asset_contract_v2(employer.clone()).address();
        let token = token::StellarAssetClient::new(&env, &token_id);
        token.mint(&employer, &3600_0000000); // 1 hour worth

        let contract_id = env.register(SalaryStreamContract, ());
        let client = SalaryStreamContractClient::new(&env, &contract_id);

        let stream_id = client.create_stream(&employer, &employee, &token_id, &3600_0000000, &3600);

        // Advance time by 1800 seconds (half the stream)
        env.ledger().with_mut(|l| l.timestamp += 1800);

        let claimed = client.withdraw(&stream_id);
        assert_eq!(claimed, 1800_0000000);
    }
}
