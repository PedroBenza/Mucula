/**
 * Copy Fluxo — Minguito é o intermediário; nunca contacto directo.
 */
export var WEB_TO_BACKEND = {
  interest: 'em_curso',
  negotiating: 'em_curso',
  agreed_buyer: 'em_curso',
  pending_seller: 'precisa_aprovacao',
  matched: 'acordado',
  closed: 'recusado_ou_expirado',
};

export function fluxHintForNegotiation(n, role) {
  if (!n) return 'A acompanhar';
  if (n.state === 'matched') return 'Acordo confirmado (mediado pelo Minguito)';
  if (n.state === 'closed') {
    if (n.closedReason === 'listing_sold') return 'Outro comprador ficou com isto';
    if (n.closedReason === 'timeout' || n.closedReason === 'expired')
      return 'Encerrou: 48 horas sem acordo';
    if (n.closedReason === 'rejected') return 'Proposta recusada';
    return 'Negociação encerrada';
  }
  var price =
    n.proposedPrice != null && Number.isFinite(Number(n.proposedPrice))
      ? Number(n.proposedPrice)
      : null;

  if (role === 'seller') {
    if (n.belowFloor && price != null) {
      return 'Minguito trouxe ' + price + ' Kz (abaixo do mínimo). Aceita ou recusa.';
    }
    if (n.needsSellerDecision || n.state === 'pending_seller') {
      return price != null
        ? 'Minguito enviou proposta de ' + price + ' Kz — confirma ou recusa.'
        : 'Há interesse. À espera que o Minguito traga um valor.';
    }
    if (n.state === 'interest' || n.state === 'negotiating') {
      return price != null
        ? 'Proposta de ' + price + ' Kz em curso com o Minguito.'
        : 'Interessado a negociar com o Minguito — ainda sem proposta formal.';
    }
    return 'Oportunidade de negócio';
  }

  if (n.belowFloor) {
    return 'O Minguito avisou: oferta abaixo do mínimo. O vendedor decide no Fluxo.';
  }
  if (n.needsSellerDecision || n.state === 'pending_seller') {
    return price != null
      ? 'Minguito enviou ' + price + ' Kz. À espera do vendedor.'
      : 'À espera da confirmação do vendedor.';
  }
  if (n.state === 'negotiating' && price != null) {
    return 'Em conversa com o Minguito (proposta ' + price + ' Kz).';
  }
  if (n.state === 'interest') {
    return 'Em conversa com o Minguito — ainda sem proposta formal.';
  }
  return 'O Minguito está a mediar — sem contacto com o vendedor.';
}
