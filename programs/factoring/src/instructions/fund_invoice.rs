use anchor_lang::prelude::*;
use anchor_lang::solana_program::program_option::COption;
use anchor_spl::associated_token::AssociatedToken;
use anchor_spl::token_interface::{transfer, mint_to, Mint, MintTo, TokenAccount, TokenInterface, Transfer};

use crate::errors::FactoringError;
use crate::events::InvoiceFunded;
use crate::state::*;

#[derive(Accounts)]
pub struct FundInvoice<'info> {
    #[account(mut)]
    pub investor: Signer<'info>,

    #[account(
        mut,
        seeds = [b"invoice", invoice.issuer.as_ref(), &invoice.invoice_id.to_le_bytes()],
        bump = invoice.bump,
    )]
    pub invoice: Account<'info, Invoice>,

    /// CHECK: receptor de los USDC; validado contra invoice.issuer
    #[account(address = invoice.issuer)]
    pub issuer: UncheckedAccount<'info>,

    #[account(
        init,
        payer = investor,
        space = Escrow::LEN,
        seeds = [b"escrow", invoice.key().as_ref()],
        bump
    )]
    pub escrow: Account<'info, Escrow>,

    pub usdc_token_program: Interface<'info, TokenInterface>,
    pub rwa_token_program: Interface<'info, TokenInterface>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,

    #[account(mint::token_program = usdc_token_program)]
    pub usdc_mint: InterfaceAccount<'info, Mint>,

    #[account(
        mut,
        address = invoice.mint,
        mint::token_program = rwa_token_program,
    )]
    pub rwa_mint: InterfaceAccount<'info, Mint>,

    #[account(
        mut,
        associated_token::mint = usdc_mint,
        associated_token::authority = investor,
        associated_token::token_program = usdc_token_program,
    )]
    pub investor_usdc_ata: InterfaceAccount<'info, TokenAccount>,

    #[account(
        mut,
        associated_token::mint = usdc_mint,
        associated_token::authority = issuer,
        associated_token::token_program = usdc_token_program,
    )]
    pub issuer_usdc_ata: InterfaceAccount<'info, TokenAccount>,

    #[account(
        init,
        payer = investor,
        associated_token::mint = usdc_mint,
        associated_token::authority = escrow,
        associated_token::token_program = usdc_token_program,
    )]
    pub escrow_usdc_vault: InterfaceAccount<'info, TokenAccount>,

    #[account(
        init,
        payer = investor,
        associated_token::mint = rwa_mint,
        associated_token::authority = investor,
        associated_token::token_program = rwa_token_program,
    )]
    pub investor_rwa_ata: InterfaceAccount<'info, TokenAccount>,
}

pub fn handler(ctx: Context<FundInvoice>, yield_bps: u16) -> Result<()> {
    let invoice = &ctx.accounts.invoice;

    require!(invoice.status == InvoiceStatus::Listed, FactoringError::InvoiceNotFundable);
    require!(invoice.is_verified, FactoringError::InvoiceNotVerified);
    require!(yield_bps > 0 && yield_bps <= 10_000, FactoringError::InvalidYield);
    require!(
        ctx.accounts.investor.key() != invoice.issuer,
        FactoringError::Unauthorized
    );
    require!(
        ctx.accounts.rwa_mint.decimals == 0 && ctx.accounts.rwa_mint.supply == 0,
        FactoringError::InvalidRwaMint
    );
    require!(
        ctx.accounts.rwa_mint.mint_authority == COption::Some(ctx.accounts.escrow.key()),
        FactoringError::InvalidMintAuthority
    );

    // USDC del inversor -> issuer (liquidez inmediata)
    transfer(
        CpiContext::new(
            ctx.accounts.usdc_token_program.to_account_info(),
            Transfer {
                from: ctx.accounts.investor_usdc_ata.to_account_info(),
                to: ctx.accounts.issuer_usdc_ata.to_account_info(),
                authority: ctx.accounts.investor.to_account_info(),
            },
        ),
        invoice.amount,
    )?;

    // Mint de 1 RWA -> inversor, firmado por el escrow PDA
    let invoice_key = ctx.accounts.invoice.key();
    let signer_seeds: &[&[&[u8]]] = &[&[
        b"escrow",
        invoice_key.as_ref(),
        &[ctx.bumps.escrow],
    ]];
    mint_to(
        CpiContext::new_with_signer(
            ctx.accounts.rwa_token_program.to_account_info(),
            MintTo {
                mint: ctx.accounts.rwa_mint.to_account_info(),
                to: ctx.accounts.investor_rwa_ata.to_account_info(),
                authority: ctx.accounts.escrow.to_account_info(),
            },
            signer_seeds,
        ),
        1,
    )?;

    let funded_amount = ctx.accounts.invoice.amount;
    let clock = Clock::get()?;

    let escrow = &mut ctx.accounts.escrow;
    escrow.invoice = invoice_key;
    escrow.investor = ctx.accounts.investor.key();
    escrow.principal = funded_amount;
    escrow.yield_bps = yield_bps;
    escrow.funded_at = clock.unix_timestamp;
    escrow.repayment_deadline = ctx.accounts.invoice.due_date;
    escrow.bump = ctx.bumps.escrow;

    let invoice = &mut ctx.accounts.invoice;
    invoice.status = InvoiceStatus::Funded;
    invoice.investor = Some(ctx.accounts.investor.key());

    emit!(InvoiceFunded {
        invoice: invoice_key,
        investor: ctx.accounts.investor.key(),
        funded_amount,
    });

    Ok(())
}
