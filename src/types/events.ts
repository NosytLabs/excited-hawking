export const WSEvents = {
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',
  CONNECT_ERROR: 'connect_error',
  PROMPT_NEW: 'prompt:new',
  PROMPT_COMPLETE: 'prompt:complete',
  QUEUE_UPDATE: 'queue:update',
  BALANCE_UPDATE: 'balance:update',
  TREASURY_UPDATE: 'treasury:update',
  TIER_CHANGE: 'tier:change',
  LOG_NEW: 'log:new',
  GOVERNANCE_PROPOSAL: 'governance:proposal',
  GOVERNANCE_PROPOSAL_NEW: 'governance:proposal:new',
  GOVERNANCE_PROPOSAL_UPDATE: 'governance:proposal:update',
  GOVERNANCE_VOTE: 'governance:vote',
  GOVERNANCE_CLOSE: 'governance:close',
  GOVERNANCE_UPDATE: 'governance:update',
  EMERGENCE_UPDATE: 'emergence:update'
} as const;

export type WSEvent = typeof WSEvents[keyof typeof WSEvents];