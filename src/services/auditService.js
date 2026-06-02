export function recordAudit(state, { actor = 'System', action, target, severity = 'low' }) {
  const event = {
    id: `audit-${Date.now()}-${state.audit.length + 1}`,
    actor,
    action,
    target,
    severity,
    createdAt: new Date().toISOString()
  };
  state.audit.unshift(event);
  return event;
}

export function listAudit(state, limit = 10) {
  return state.audit.slice(0, limit);
}
