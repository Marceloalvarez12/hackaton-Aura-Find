use anchor_lang::prelude::*;

#[account]
pub struct Config {
    pub admin: Pubkey,
    pub verifier: Pubkey,          // Wallet/Backend autorizada para validar KYC/facturas
    pub fee_bps: u16,              // Comisión de la plataforma
    pub treasury_usdc_ata: Pubkey, // Destino de los fees recogidos
    pub bump: u8,
}

impl Config {
    pub const LEN: usize = 8 + 32 + 32 + 2 + 32 + 1;
}
