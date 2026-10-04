use anchor_lang::prelude::*;

#[account]
pub struct Invoice {
    pub issuer: Pubkey,
    pub invoice_id: u64,
    pub mint: Pubkey,              // Mint del RWA Token-2022
    pub amount: u64,               // Valor nominal en USDC (6 decimales)
    pub document_hash: [u8; 32],   // SHA-256 del PDF/XML fiscal off-chain
    pub metadata_uri: String,      // URI de IPFS/Arweave pública (max 120 chars)
    pub due_date: i64,             // Timestamp de vencimiento
    pub status: InvoiceStatus,
    pub investor: Option<Pubkey>,
    pub is_verified: bool,         // Firma del oráculo/verificador
    pub bump: u8,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq)]
pub enum InvoiceStatus {
    Listed,
    Funded,
    Repaid,
    Defaulted,
    Cancelled,
}

impl Invoice {
    // Discriminator (8) + issuer (32) + invoice_id (8) + mint (32) + amount (8)
    // + hash (32) + String (4 + 120) + due_date (8) + status (1)
    // + Option<Pubkey> (1 + 32) + bool (1) + bump (1)
    pub const LEN: usize = 8 + 32 + 8 + 32 + 8 + 32 + (4 + 120) + 8 + 1 + 33 + 1 + 1;
}
