curl -g \
-X POST \
-H "Content-Type: application/json" \
-H "Origin: https://www.pgatour.com" \
-H "Referer: https://www.pgatour.com" \
-H "User-Agent: Mozilla/5.0 (Linux; Android 10; SM-G960U) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/87.0.4280.101 Mobile Safari/537.36" \
-H "x-api-key: da2-gsrx5bibzbb4njvhl7t37wqyl4" \
-d '{"operationName":"StatDetails","variables":{"tourCode":"R","statId":"186","year":2024,"eventQuery":null},"query":"query StatDetails($tourCode: TourCode!, $statId: String!, $year: Int, $eventQuery: StatDetailEventQuery) {\n  statDetails(\n    tourCode: $tourCode\n    statId: $statId\n    year: $year\n    eventQuery: $eventQuery\n  ) {\n    __typename\n    tourCode\n    year\n    displaySeason\n    statId\n    statType\n    tournamentPills {\n      tournamentId\n      displayName\n    }\n    yearPills {\n      year\n      displaySeason\n    }\n    statTitle\n    statDescription\n    tourAvg\n    lastProcessed\n    statHeaders\n    statCategories {\n      category\n      displayName\n      subCategories {\n        displayName\n        stats {\n          statId\n          statTitle\n        }\n      }\n    }\n    rows {\n      ... on StatDetailsPlayer {\n        __typename\n        playerId\n        playerName\n        country\n        countryFlag\n        rank\n        rankDiff\n        rankChangeTendency\n        stats {\n          statName\n          statValue\n          color\n        }\n      }\n      ... on StatDetailTourAvg {\n        __typename\n        displayName\n        value\n      }\n    }\n    sponsorLogo\n  }\n}"}' \
https://orchestrator.pgatour.com/graphql

