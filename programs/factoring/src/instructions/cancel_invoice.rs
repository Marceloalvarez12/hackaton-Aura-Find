use anchor_lang::prelude::*;

use crate::errors::FactoringError;
use crate::events::InvoiceCancelled;
use crate::state::*;

#[derive(Accounts)]
pub struct CancelInvoice<'info> {
    #[account(
        mut,
        seeds = [b"invoice", invoice.issuer.as_ref(), &invoice.invoice_id.to_le_bytes()],
        bump = invoice.bump,
        constraint = invoice.status == InvoiceStatus::Listed @ FactoringError::InvalidStatusTransition
    )]
    pub invoice: Account<'info, Invoice>,

    #[account(address = invoice.issuer @ FactoringError::Unauthorized)]
    pub issuer: Signer<'info>,
}

pub fn handler(ctx: Context<CancelInvoice>) -> Result<()> {
    ctx.accounts.invoice.status = InvoiceStatus::Cancelled;

    emit!(InvoiceCancelled {
        invoice: ctx.accounts.invoice.key(),
        issuer: ctx.accounts.issuer.key(),
    });

    Ok(())
}
