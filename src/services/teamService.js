export function listTeams(state) {
  return state.teams.map((team) => ({
    ...team,
    fileCount: state.files.filter((file) => file.teamId === team.id && file.status !== 'deleted').length,
    usagePercent: Math.round((team.usedBytes / team.quotaBytes) * 100)
  }));
}

export function getTeam(state, teamId) {
  return listTeams(state).find((team) => team.id === teamId) ?? null;
}
