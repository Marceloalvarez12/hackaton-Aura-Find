use anchor_lang::prelude::*;
use anchor_spl::associated_token::AssociatedToken;
use anchor_spl::token_interface::{close_account, transfer, CloseAccount, Mint, TokenAccount, TokenInterface, Transfer};

use crate::errors::FactoringError;
use crate::events::RepaymentWithdrawn;
use crate::state::*;

#[derive(Accounts)]
pub struct WithdrawRepayment<'info> {
    #[account(mut)]
    pub investor: Signer<'info>,

    #[account(
        seeds = [b"invoice", invoice.issuer.as_ref(), &invoice.invoice_id.to_le_bytes()],
        bump = invoice.bump,
    )]
    pub invoice: Account<'info, Invoice>,

    #[account(
        seeds = [b"escrow", invoice.key().as_ref()],
        bump = escrow.bump,
        has_one = investor @ FactoringError::Unauthorized,
    )]
    pub escrow: Account<'info, Escrow>,

    pub usdc_token_program: Interface<'info, TokenInterface>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,

    #[account(mint::token_program = usdc_token_program)]
    pub usdc_mint: InterfaceAccount<'info, Mint>,

    #[account(
        init_if_needed,
        payer = investor,
        associated_token::mint = usdc_mint,
        associated_token::authority = investor,
        associated_token::token_program = usdc_token_program,
    )]
    pub investor_usdc_ata: InterfaceAccount<'info, TokenAccount>,

    #[account(
        mut,
        associated_token::mint = usdc_mint,
        associated_token::authority = escrow,
        associated_token::token_program = usdc_token_program,
    )]
    pub escrow_usdc_vault: InterfaceAccount<'info, TokenAccount>,
}

pub fn handler(ctx: Context<WithdrawRepayment>) -> Result<()> {
    require!(
        ctx.accounts.invoice.status == InvoiceStatus::Repaid,
        FactoringError::InvoiceNotRepaid
    );

    let invoice_key = ctx.accounts.invoice.key();
    let amount = ctx.accounts.escrow_usdc_vault.amount;
    let signer_seeds: &[&[&[u8]]] = &[&[
        b"escrow",
        invoice_key.as_ref(),
        &[ctx.accounts.escrow.bump],
    ]];

    transfer(
        CpiContext::new_with_signer(
            ctx.accounts.usdc_token_program.to_account_info(),
            Transfer {
                from: ctx.accounts.escrow_usdc_vault.to_account_info(),
                to: ctx.accounts.investor_usdc_ata.to_account_info(),
                authority: ctx.accounts.escrow.to_account_info(),
            },
            signer_seeds,
        ),
        amount,
    )?;

    close_account(
        CpiContext::new_with_signer(
            ctx.accounts.usdc_token_program.to_account_info(),
            CloseAccount {
                account: ctx.accounts.escrow_usdc_vault.to_account_info(),
                destination: ctx.accounts.investor.to_account_info(),
                authority: ctx.accounts.escrow.to_account_info(),
            },
            signer_seeds,
        ),
    )?;

    emit!(RepaymentWithdrawn {
        invoice: invoice_key,
        investor: ctx.accounts.investor.key(),
        amount,
    });

    Ok(())
}
