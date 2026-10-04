use anchor_lang::prelude::*;

pub mod errors;
pub mod events;
pub mod instructions;
pub mod state;

use instructions::*;

declare_id!("716BXEQFnUrsyJkXtYXMa2YkEbYYPban2tj9WsLdfZzn");

#[program]
pub mod factoring {
    use super::*;

    pub fn create_invoice(
        ctx: Context<CreateInvoice>,
        invoice_id: u64,
        amount: u64,
        due_date: i64,
        document_hash: [u8; 32],
        metadata_uri: String,
    ) -> Result<()> {
        instructions::create_invoice::handler(
            ctx,
            invoice_id,
            amount,
            due_date,
            document_hash,
            metadata_uri,
        )
    }

    pub fn fund_invoice(ctx: Context<FundInvoice>, yield_bps: u16) -> Result<()> {
        instructions::fund_invoice::handler(ctx, yield_bps)
    }

    pub fn repay_invoice(ctx: Context<RepayInvoice>) -> Result<()> {
        instructions::repay_invoice::handler(ctx)
    }

    pub fn withdraw_repayment(ctx: Context<WithdrawRepayment>) -> Result<()> {
        instructions::withdraw_repayment::handler(ctx)
    }

    pub fn initialize(ctx: Context<Initialize>, fee_bps: u16) -> Result<()> {
        instructions::initialize::handler(ctx, fee_bps)
    }

    pub fn verify_invoice(ctx: Context<VerifyInvoice>) -> Result<()> {
        instructions::verify_invoice::handler(ctx)
    }

    pub fn cancel_invoice(ctx: Context<CancelInvoice>) -> Result<()> {
        instructions::cancel_invoice::handler(ctx)
    }

    pub fn mark_defaulted(ctx: Context<MarkDefaulted>) -> Result<()> {
        instructions::mark_defaulted::handler(ctx)
    }
}
