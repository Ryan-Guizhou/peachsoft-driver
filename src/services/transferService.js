export function listTransfers(state) {
  return state.transfers.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
}

export function getTransferHealth(state) {
  const transfers = listTransfers(state);
  return {
    active: transfers.filter((task) => task.status === 'running' || task.status === 'retrying').length,
    retrying: transfers.filter((task) => task.status === 'retrying').length,
    completedToday: transfers.filter((task) => task.status === 'completed').length
  };
}
