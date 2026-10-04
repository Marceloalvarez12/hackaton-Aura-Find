use anchor_lang::prelude::*;

#[event]
pub struct InvoiceCreated {
    pub invoice: Pubkey,
    pub issuer: Pubkey,
    pub amount: u64,
    pub document_hash: [u8; 32],
}

#[event]
pub struct InvoiceFunded {
    pub invoice: Pubkey,
    pub investor: Pubkey,
    pub funded_amount: u64,
}

#[event]
pub struct InvoiceRepaid {
    pub invoice: Pubkey,
    pub issuer: Pubkey,
    pub repaid_amount: u64,
}

#[event]
pub struct RepaymentWithdrawn {
    pub invoice: Pubkey,
    pub investor: Pubkey,
    pub amount: u64,
}

#[event]
pub struct InvoiceVerified {
    pub invoice: Pubkey,
    pub verifier: Pubkey,
}

#[event]
pub struct InvoiceCancelled {
    pub invoice: Pubkey,
    pub issuer: Pubkey,
}

#[event]
pub struct InvoiceDefaulted {
    pub invoice: Pubkey,
    pub investor: Pubkey,
    pub principal: u64,
}
