import { COPY } from '../constants/copy.js';

export function negotiationLabel(state) {
  switch (state) {
    case 'interest':
      return COPY.stateInterest;
    case 'negotiating':
      return COPY.stateNegotiating;
    case 'agreed_buyer':
      return COPY.stateWaitingSeller;
    case 'pending_seller':
      return COPY.stateWaitingYou;
    case 'matched':
      return COPY.stateMatched;
    case 'closed':
      return COPY.stateClosed;
    default:
      return state || '';
  }
}

export function demandLabel(status) {
  switch (status) {
    case 'active':
      return COPY.stateDemandActive;
    case 'paused':
      return COPY.stateDemandPaused;
    case 'satisfied':
      return COPY.stateDemandSatisfied;
    case 'expired':
      return COPY.stateDemandExpired;
    default:
      return status || '';
  }
}
