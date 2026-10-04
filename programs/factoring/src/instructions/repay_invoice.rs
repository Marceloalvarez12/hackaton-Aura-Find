use anchor_lang::prelude::*;
use anchor_spl::token_interface::{transfer, Mint, TokenAccount, TokenInterface, Transfer};

use crate::errors::FactoringError;
use crate::events::InvoiceRepaid;
use crate::state::*;

#[derive(Accounts)]
pub struct RepayInvoice<'info> {
    #[account(
        mut,
        seeds = [b"invoice", invoice.issuer.as_ref(), &invoice.invoice_id.to_le_bytes()],
        bump = invoice.bump,
    )]
    pub invoice: Account<'info, Invoice>,

    #[account(address = invoice.issuer @ FactoringError::Unauthorized)]
    pub issuer: Signer<'info>,

    #[account(
        seeds = [b"escrow", invoice.key().as_ref()],
        bump = escrow.bump,
    )]
    pub escrow: Account<'info, Escrow>,

    pub usdc_token_program: Interface<'info, TokenInterface>,

    #[account(mint::token_program = usdc_token_program)]
    pub usdc_mint: InterfaceAccount<'info, Mint>,

    #[account(
        mut,
        associated_token::mint = usdc_mint,
        associated_token::authority = issuer,
        associated_token::token_program = usdc_token_program,
    )]
    pub issuer_usdc_ata: InterfaceAccount<'info, TokenAccount>,

    #[account(
        mut,
        associated_token::mint = usdc_mint,
        associated_token::authority = escrow,
        associated_token::token_program = usdc_token_program,
    )]
    pub escrow_usdc_vault: InterfaceAccount<'info, TokenAccount>,
}

pub fn handler(ctx: Context<RepayInvoice>) -> Result<()> {
    // Se acepta repago tardío: una factura en default todavía puede liquidarse.
    require!(
        matches!(
            ctx.accounts.invoice.status,
            InvoiceStatus::Funded | InvoiceStatus::Defaulted
        ),
        FactoringError::InvoiceNotFunded
    );

    let escrow = &ctx.accounts.escrow;
    let repayment: u64 = (escrow.principal as u128)
        .checked_mul(10_000u128 + escrow.yield_bps as u128)
        .and_then(|v| v.checked_div(10_000u128))
        .and_then(|v| u64::try_from(v).ok())
        .ok_or(FactoringError::MathOverflow)?;

    transfer(
        CpiContext::new(
            ctx.accounts.usdc_token_program.to_account_info(),
            Transfer {
                from: ctx.accounts.issuer_usdc_ata.to_account_info(),
                to: ctx.accounts.escrow_usdc_vault.to_account_info(),
                authority: ctx.accounts.issuer.to_account_info(),
            },
        ),
        repayment,
    )?;

    ctx.accounts.invoice.status = InvoiceStatus::Repaid;

    emit!(InvoiceRepaid {
        invoice: ctx.accounts.invoice.key(),
        issuer: ctx.accounts.issuer.key(),
        repaid_amount: repayment,
    });

    Ok(())
}
