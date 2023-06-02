function generateFootballLeague(teams) {
  const Juventude = teams[0];
  const schedule = [];
  const rounds = teams.length - 1;
  const matchesPerRound = teams.length / 2;
  const teamCount = teams.length;

  // A primeira e ultima rodada tem que ser a mesma
  // No max duas em casa e duas

  for (let round = 0; round < rounds; round++) {
    const matches = [];

    for (let match = 0; match < 1; match++) {
      const homeTeamIndex = match;
      const awayTeamIndex = (teamCount - 1 - match + round) % (teamCount - 1);

      const homeTeam = Object.keys(teams[homeTeamIndex])[0];
      const awayTeam = Object.keys(teams[awayTeamIndex])[0];

      const homeTeamConnections = teams.find(
        team => Object.keys(team)[0] === homeTeam
      )[homeTeam];
      const awayTeamConnections = teams.find(
        team => Object.keys(team)[0] === awayTeam
      )[awayTeam];

      const connection = getBestConnection(
        homeTeam,
        awayTeam,
        homeTeamConnections ? homeTeamConnections : [],
        awayTeamConnections ? awayTeamConnections : []
      );

      const matchObj = {
        home: homeTeam,
        away: awayTeam,
        connection: connection,
      };

      matches.push(matchObj);
    }

    schedule.push({
      round: round + 1,
      matches: matches,
    });

    teams.splice(1, 0, teams.pop());
  }

  return schedule;
}

function getBestConnection(
  homeTeam,
  awayTeam,
  homeTeamConnections,
  awayTeamConnections
) {
  const commonConnections = homeTeamConnections.filter(connection =>
    awayTeamConnections.find(a => a.rival === connection.rival)
  );

  if (commonConnections.length > 0) {
    commonConnections.sort((a, b) => a.distanceTraveled - b.distanceTraveled);
    return commonConnections[0].connection;
  }

  return false;
}

const teams = [
  {
    Juventude: [
      {
        rival: "Palmeiras",
        distanceTraveled: 770.43,
        connection: "Corinthians",
      },
      {
        rival: "Corinthians",
        distanceTraveled: 802.11,
        connection: "Palmeiras",
      },
      { rival: "Atlético GO", distanceTraveled: 1402.94, connection: false },
      { rival: "Cuiabá", distanceTraveled: 1592.84, connection: false },
      { rival: "Internacional", distanceTraveled: 101.06, connection: false },
    ],
  },
  {
    Palmeiras: [
      {
        rival: "Juventude",
        distanceTraveled: 770.43,
        connection: "Internacional",
      },
      {
        rival: "Internacional",
        distanceTraveled: 956.5799999999999,
        connection: "Juventude",
      },
      { rival: "Atlético GO", distanceTraveled: 730.37, connection: false },
      { rival: "Cuiabá", distanceTraveled: 1327.34, connection: false },
      { rival: "Corinthians", distanceTraveled: 20.92, connection: false },
    ],
  },
  {
    "Atlético GO": [
      {
        rival: "Juventude",
        distanceTraveled: 1402.94,
        connection: "Internacional",
      },
      {
        rival: "Internacional",
        distanceTraveled: 1606.77,
        connection: "Juventude",
      },
      {
        rival: "Palmeiras",
        distanceTraveled: 730.37,
        connection: "Corinthians",
      },
      {
        rival: "Corinthians",
        distanceTraveled: 840.5899999999999,
        connection: "Palmeiras",
      },
      { rival: "Cuiabá", distanceTraveled: 739.67, connection: false },
    ],
  },
  {
    Cuiabá: [
      {
        rival: "Juventude",
        distanceTraveled: 1592.84,
        connection: "Internacional",
      },
      {
        rival: "Internacional",
        distanceTraveled: 1791.96,
        connection: "Juventude",
      },
      {
        rival: "Palmeiras",
        distanceTraveled: 1327.34,
        connection: "Corinthians",
      },
      {
        rival: "Corinthians",
        distanceTraveled: 1373.64,
        connection: "Palmeiras",
      },
      { rival: "Atlético GO", distanceTraveled: 739.67, connection: false },
    ],
  },
  {
    Internacional: [
      { rival: "Juventude", distanceTraveled: 101.06, connection: false },
      {
        rival: "Palmeiras",
        distanceTraveled: 855.52,
        connection: "Corinthians",
      },
      {
        rival: "Corinthians",
        distanceTraveled: 889.4399999999999,
        connection: "Palmeiras",
      },
      { rival: "Atlético GO", distanceTraveled: 1505.71, connection: false },
      { rival: "Cuiabá", distanceTraveled: 1690.9, connection: false },
    ],
  },
  {
    Corinthians: [
      {
        rival: "Juventude",
        distanceTraveled: 781.19,
        connection: "Internacional",
      },
      {
        rival: "Internacional",
        distanceTraveled: 969.5799999999999,
        connection: "Juventude",
      },
      { rival: "Palmeiras", distanceTraveled: 20.92, connection: false },
      { rival: "Atlético GO", distanceTraveled: 819.67, connection: false },
      { rival: "Cuiabá", distanceTraveled: 1352.72, connection: false },
    ],
  },
];

const schedule = generateFootballLeague(teams);

schedule.forEach(round => {
  console.log(`Round ${round.round}:`);
  round.matches.forEach(match => {
    console.log(
      `${match.home} vs ${match.away}, Connection: ${match.connection}`
    );
  });
  console.log();
});
