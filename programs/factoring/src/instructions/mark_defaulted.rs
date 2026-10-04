use anchor_lang::prelude::*;

use crate::errors::FactoringError;
use crate::events::InvoiceDefaulted;
use crate::state::*;

/// Período de gracia después del vencimiento antes de poder declarar default.
pub const GRACE_PERIOD_SECS: i64 = 3 * 24 * 60 * 60;

#[derive(Accounts)]
pub struct MarkDefaulted<'info> {
    #[account(
        mut,
        seeds = [b"invoice", invoice.issuer.as_ref(), &invoice.invoice_id.to_le_bytes()],
        bump = invoice.bump,
        constraint = invoice.status == InvoiceStatus::Funded @ FactoringError::InvoiceNotFunded
    )]
    pub invoice: Account<'info, Invoice>,

    #[account(
        seeds = [b"escrow", invoice.key().as_ref()],
        bump = escrow.bump,
        has_one = investor @ FactoringError::Unauthorized,
    )]
    pub escrow: Account<'info, Escrow>,

    pub investor: Signer<'info>,
}

pub fn handler(ctx: Context<MarkDefaulted>) -> Result<()> {
    let deadline = ctx
        .accounts
        .escrow
        .repayment_deadline
        .checked_add(GRACE_PERIOD_SECS)
        .ok_or(FactoringError::MathOverflow)?;
    require!(
        Clock::get()?.unix_timestamp > deadline,
        FactoringError::MaturityNotReached
    );

    ctx.accounts.invoice.status = InvoiceStatus::Defaulted;

    emit!(InvoiceDefaulted {
        invoice: ctx.accounts.invoice.key(),
        investor: ctx.accounts.investor.key(),
        principal: ctx.accounts.escrow.principal,
    });

    Ok(())
}
