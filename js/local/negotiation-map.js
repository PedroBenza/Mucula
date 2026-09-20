/**
 * Mapa estável web ↔ backend (Etapa 2).
 * A UI usa copy angolana; estes códigos internos não se renomeiam em massa.
 */
export var WEB_TO_BACKEND = {
  interest: 'em_curso',
  negotiating: 'em_curso',
  agreed_buyer: 'em_curso',
  pending_seller: 'precisa_aprovacao',
  matched: 'acordado',
  closed: 'recusado_ou_expirado',
};

/** Texto curto para o Fluxo (vendedor / comprador). */
export function fluxHintForNegotiation(n, role) {
  if (!n) return 'A acompanhar';
  if (n.state === 'matched') return 'O acordo foi confirmado';
  if (n.state === 'closed') {
    if (n.closedReason === 'listing_sold') return 'Outro comprador ficou com isto';
    if (n.closedReason === 'timeout') return 'Encerrou: passaram 48 horas sem acordo';
    if (n.closedReason === 'rejected') return 'Proposta recusada';
    return 'Esta conversa encerrou';
  }
  var price =
    n.proposedPrice != null && Number.isFinite(Number(n.proposedPrice))
      ? Number(n.proposedPrice)
      : null;

  if (role === 'seller') {
    if (n.belowFloor && price != null) {
      return 'Oferta de ' + price + ' Kz — abaixo do teu mínimo. Só avança se aceitares.';
    }
    if (n.needsSellerDecision || n.state === 'pending_seller') {
      return price != null
        ? 'Proposta de ' + price + ' Kz — precisa do teu ok.'
        : 'Há interesse — precisa do teu ok.';
    }
    if (n.state === 'interest' || n.state === 'negotiating') {
      return price != null
        ? 'Alguém ofereceu ' + price + ' Kz. O Minguito está a tratar.'
        : 'Há uma pessoa interessada. O Minguito trata do preço.';
    }
    return 'Oportunidade de negócio';
  }

  /* buyer */
  if (n.belowFloor) {
    return 'A tua oferta ficou abaixo do mínimo. O vendedor decide no Fluxo.';
  }
  if (n.needsSellerDecision || n.state === 'pending_seller') {
    return 'À espera do vendedor confirmar o valor.';
  }
  if (n.state === 'negotiating' && price != null) {
    return 'Oferta registada. Segue com o Minguito se quiseres ajustar.';
  }
  if (n.state === 'interest') {
    return 'O teu interesse está registado.';
  }
  return 'Segue no Minguito';
}
