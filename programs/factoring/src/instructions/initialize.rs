use anchor_lang::prelude::*;
use crate::state::Config;
use crate::errors::FactoringError;

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(mut)]
    pub admin: Signer<'info>,

    #[account(
        init,
        payer = admin,
        space = Config::LEN,
        seeds = [b"config"],
        bump
    )]
    pub config: Account<'info, Config>,

    /// CHECK: Dirección pública del backend/oráculo encargado de firmar facturas válidas
    pub verifier: AccountInfo<'info>,

    /// CHECK: Cuenta destino (billetera o ATA) donde se recolectarán los fees de la plataforma
    pub treasury_usdc_ata: AccountInfo<'info>,

    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<Initialize>, fee_bps: u16) -> Result<()> {
    require!(fee_bps <= 10_000, FactoringError::InvalidFee);

    let config = &mut ctx.accounts.config;
    config.admin = ctx.accounts.admin.key();
    config.verifier = ctx.accounts.verifier.key();
    config.fee_bps = fee_bps;
    config.treasury_usdc_ata = ctx.accounts.treasury_usdc_ata.key();
    config.bump = ctx.bumps.config;

    Ok(())
}
