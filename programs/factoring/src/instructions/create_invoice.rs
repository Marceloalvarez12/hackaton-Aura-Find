use anchor_lang::prelude::*;
use crate::state::*;
use crate::errors::FactoringError;
use crate::events::InvoiceCreated;

#[derive(Accounts)]
#[instruction(invoice_id: u64)]
pub struct CreateInvoice<'info> {
    #[account(mut)]
    pub issuer: Signer<'info>,

    #[account(
        init,
        payer = issuer,
        space = Invoice::LEN,
        seeds = [b"invoice", issuer.key().as_ref(), &invoice_id.to_le_bytes()],
        bump
    )]
    pub invoice: Account<'info, Invoice>,

    /// CHECK: Validado mediante lógica de negocio (Mint del RWA token creado vía Token-2022)
    pub rwa_mint: AccountInfo<'info>,

    pub system_program: Program<'info, System>,
}

pub fn handler(
    ctx: Context<CreateInvoice>,
    invoice_id: u64,
    amount: u64,
    due_date: i64,
    document_hash: [u8; 32],
    metadata_uri: String,
) -> Result<()> {
    require!(metadata_uri.len() <= 120, FactoringError::MetadataUriTooLong);
    require!(due_date > Clock::get()?.unix_timestamp, FactoringError::InvalidDueDate);

    let invoice = &mut ctx.accounts.invoice;
    invoice.issuer = ctx.accounts.issuer.key();
    invoice.invoice_id = invoice_id;
    invoice.mint = ctx.accounts.rwa_mint.key();
    invoice.amount = amount;
    invoice.document_hash = document_hash;
    invoice.metadata_uri = metadata_uri;
    invoice.due_date = due_date;
    invoice.status = InvoiceStatus::Listed;
    invoice.investor = None;
    invoice.is_verified = false;
    invoice.bump = ctx.bumps.invoice;

    emit!(InvoiceCreated {
        invoice: invoice.key(),
        issuer: ctx.accounts.issuer.key(),
        amount,
        document_hash,
    });

    Ok(())
}
