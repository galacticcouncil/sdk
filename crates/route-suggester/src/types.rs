//! Core types for route suggestion.
//!
//! Pool routing types re-exported from `hydradx-traits` and `primitives`.

extern crate alloc;
use alloc::vec::Vec;

pub use hydradx_traits::router::{PoolType, Route, Trade, MAX_NUMBER_OF_TRADES};
pub use primitives::AssetId;

/// A pool instance with its tradeable assets.
///
/// Each entry represents one pool — the route suggester builds a graph
/// where every asset pair within a pool becomes a directed edge.
#[derive(Debug, Clone)]
pub struct PoolEdge {
    /// The pool type (used to construct `Trade` output).
    pub pool_type: PoolType<AssetId>,
    /// All assets tradeable within this pool instance.
    pub assets: Vec<AssetId>,
}

/// Provides the set of all active pools to the route suggester.
///
/// Implement this in the runtime by querying each AMM pallet
/// (Omnipool, XYK, Stableswap, LBP, Aave, HSM).
///
/// The `State` parameter mirrors the `AMMInterface::State` /
/// `SimulatorSet::State` snapshot so that pool discovery can use
/// the same on-chain state as the solver.
pub trait PoolProvider {
    type State: Clone;

    fn get_all_pools(state: &Self::State) -> Vec<PoolEdge>;
}
