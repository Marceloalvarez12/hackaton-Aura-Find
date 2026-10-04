use anchor_lang::prelude::*;

#[account]
pub struct Escrow {
    pub invoice: Pubkey,
    pub investor: Pubkey,
    pub principal: u64,
    pub yield_bps: u16,            // Puntos básicos de rendimiento (ej: 500 = 5%)
    pub funded_at: i64,
    pub repayment_deadline: i64,
    pub bump: u8,
}

impl Escrow {
    pub const LEN: usize = 8 + 32 + 32 + 8 + 2 + 8 + 8 + 1;
}
