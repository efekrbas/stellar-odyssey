#![no_std]
use soroban_sdk::{contract, contractimpl, contracttype, Address, Env};

#[contracttype]
pub enum DataKey {
    HighScore(Address),
}

#[contract]
pub struct LeaderboardContract;

#[contractimpl]
impl LeaderboardContract {
    pub fn save_score(env: Env, player: Address, score: u32) {
        player.require_auth();

        let key = DataKey::HighScore(player.clone());
        let current_score: u32 = env.storage().persistent().get(&key).unwrap_or(0);

        if score > current_score {
            env.storage().persistent().set(&key, &score);
        }
    }

    pub fn get_score(env: Env, player: Address) -> u32 {
        let key = DataKey::HighScore(player);
        env.storage().persistent().get(&key).unwrap_or(0)
    }
}
