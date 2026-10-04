use anchor_lang::prelude::*;
use crate::state::{Config, Invoice, InvoiceStatus};
use crate::errors::FactoringError;
use crate::events::InvoiceVerified;

#[derive(Accounts)]
pub struct VerifyInvoice<'info> {
    pub verifier: Signer<'info>,

    #[account(
        seeds = [b"config"],
        bump = config.bump,
        has_one = verifier @ FactoringError::Unauthorized
    )]
    pub config: Account<'info, Config>,

    #[account(
        mut,
        seeds = [b"invoice", invoice.issuer.as_ref(), &invoice.invoice_id.to_le_bytes()],
        bump = invoice.bump,
        constraint = invoice.status == InvoiceStatus::Listed @ FactoringError::InvalidStatusTransition
    )]
    pub invoice: Account<'info, Invoice>,
}

pub fn handler(ctx: Context<VerifyInvoice>) -> Result<()> {
    let invoice = &mut ctx.accounts.invoice;
    invoice.is_verified = true;

    emit!(InvoiceVerified {
        invoice: invoice.key(),
        verifier: ctx.accounts.verifier.key(),
    });

    Ok(())
}
