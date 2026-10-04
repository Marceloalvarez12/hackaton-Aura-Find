use anchor_lang::prelude::*;

#[error_code]
pub enum FactoringError {
    #[msg("La URI de metadata excede el límite permitido.")]
    MetadataUriTooLong,
    #[msg("La factura no está en estado Listed para poder fondearse.")]
    InvoiceNotFundable,
    #[msg("No autorizado para realizar esta acción.")]
    Unauthorized,
    #[msg("La fecha de vencimiento debe ser mayor al tiempo actual.")]
    InvalidDueDate,
    #[msg("El yield debe estar entre 1 y 10_000 bps.")]
    InvalidYield,
    #[msg("El mint del RWA debe tener 0 decimales y supply 0.")]
    InvalidRwaMint,
    #[msg("La mint authority del RWA debe ser el escrow PDA.")]
    InvalidMintAuthority,
    #[msg("La factura no está en estado Funded para ser repagada.")]
    InvoiceNotFunded,
    #[msg("La factura no está en estado Repaid para retirar fondos.")]
    InvoiceNotRepaid,
    #[msg("Overflow en el cálculo del repago.")]
    MathOverflow,
    #[msg("Transición de estado inválida para esta factura.")]
    InvalidStatusTransition,
    #[msg("La factura no ha sido verificada por el oráculo de cumplimiento del protocolo.")]
    InvoiceNotVerified,
    #[msg("El fee de la plataforma no puede exceder 10_000 bps.")]
    InvalidFee,
    #[msg("Todavía no venció el plazo de repago más el período de gracia.")]
    MaturityNotReached,
}
