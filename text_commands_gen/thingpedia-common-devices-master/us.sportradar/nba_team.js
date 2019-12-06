"use strict";

const Tp = require("thingpedia");

const NBA_API_KEY = "uuha5uz669b2yrnwqccraywh";
const NBA_SCHEDULE_URL =
    "https://api.sportradar.us/nba/trial/v5/en/games/%d/%d/%d/schedule.json?api_key=" +
    NBA_API_KEY;
const NBA_BOXSCORE_URL =
    "https://api.sportradar.us/nba/trial/v5/en/games/%s/boxscore.json?api_key=" +
    NBA_API_KEY;
const NBA_RANKINGS_URL =
    "https://api.sportradar.us/nba/trial/v5/en/seasons/%s/REG/rankings.json?api_key=" +
    NBA_API_KEY;
const NBA_ROSTER_URL =
    "https://api.sportradar.us/nba/trial/v5/en/teams/%s/profile.json?api_key=" +
    NBA_API_KEY;
const NBA_JSON = require("./teams/nba.json");

module.exports = class NBASportRadarAPIDevice {
    constructor(platform) {
        this.platform = platform;
        this.name = "Sport Radar NBA Channel";
        this.description = "The NBA Channel for Sport Radar";
    }

    _updateUrl() {
        const now = new Date();
        this.schedule_url = NBA_SCHEDULE_URL.format(
            now.getFullYear(),
            now.getMonth() + 1,
            now.getDate()
        );
        this.rankings_url = NBA_RANKINGS_URL.format(now.getFullYear());
    }

    _createTpEntity(team) {
        return new Tp.Value.Entity(team.alias.toLowerCase(), team.name);
    }

    get_get_todays_games() {
        return Tp.Helpers.Http.get(this.schedule_url)
            .then((response) => {
                const parsed = JSON.parse(response);
                const game_statuses = [];

                const games = parsed.games;
                for (let i = 0; i < games.length; i++) {
                    const game_status = {
                        home_team: this._createTpEntity(games[i].home),
                        home_score: games[i].home_points,
                        away_team: this._createTpEntity(games[i].away),
                        away_score: games[i].away_points,
                        result: games[i].status,
                    };

                    game_statuses.push(game_status);
                }

                return game_statuses.map((game_status) => {
                    return game_status;
                });
            })
            .catch((e) => {
                throw new TypeError("No NBA Games Found");
            });
    }

    get_get_team(team) {
        return Tp.Helpers.Http.get(this.schedule_url)
            .then((response) => {
                const parsed = JSON.parse(response);
                const games = parsed.games;
                let gameStatus;
                let index = 0;
                const platform = this.platform;
                const team_name = team.team.value;
                const full_name = team.team.display;

                for (let i = 0; i < games.length; i++) {
                    if (
                        games[i].home.alias.toLowerCase() === team_name ||
                        games[i].away.alias.toLowerCase() === team_name
                    ) {
                        index = i;
                        gameStatus = games[i].status;
                    }
                }

                const scheduledTime = games[index].scheduled;
                const awayTeam = games[index].away.name;
                const homeTeam = games[index].home.name;
                const awayPoints = games[index].away_points;
                const homePoints = games[index].home_points;
                const dateTime = new Date(scheduledTime);
                let status_message;

                return new Promise((resolve, reject) => {
                    setTimeout(() => {
                        this.get_rankings(full_name).then((response) => {
                            const team_rankings = response;
                            switch (gameStatus) {
                                case undefined:
                                    status_message = "There is no %s game today. I can notify you when there is a game if you want?".format(
                                        full_name
                                    );
                                    resolve([
                                        {
                                            result: status_message,
                                            divisionPos: team_rankings.division,
                                            divisionName:
                                                team_rankings.divisionName,
                                            conferencePos:
                                                team_rankings.conference,
                                            conferenceName:
                                                team_rankings.conferenceName,
                                        },
                                    ]);

                                    return;

                                case "scheduled":
                                    status_message = "Next game %s @ %s at %s".format(
                                        awayTeam,
                                        homeTeam,
                                        dateTime.toLocaleString(
                                            platform.locale,
                                            {
                                                timeZone: platform.timezone,
                                            }
                                        )
                                    );
                                    resolve([
                                        {
                                            result: status_message,
                                            divisionPos: team_rankings.division,
                                            divisionName:
                                                team_rankings.divisionName,
                                            conferencePos:
                                                team_rankings.conference,
                                            conferenceName:
                                                team_rankings.conferenceName,
                                        },
                                    ]);

                                    return;
                                case "inprogress":
                                    status_message = "Game update for %s @ %s: %d - %d".format(
                                        awayTeam,
                                        homeTeam,
                                        awayPoints,
                                        homePoints
                                    );
                                    resolve([
                                        {
                                            result: status_message,
                                            divisionPos: team_rankings.division,
                                            divisionName:
                                                team_rankings.divisionName,
                                            conferencePos:
                                                team_rankings.conference,
                                            conferenceName:
                                                team_rankings.conferenceName,
                                        },
                                    ]);

                                    return;
                                case "halftime":
                                    status_message = "Half-time for %s @ %s: %d - %d".format(
                                        awayTeam,
                                        homeTeam,
                                        awayPoints,
                                        homePoints
                                    );
                                    resolve([
                                        {
                                            result: status_message,
                                            divisionPos: team_rankings.division,
                                            divisionName:
                                                team_rankings.divisionName,
                                            conferencePos:
                                                team_rankings.conference,
                                            conferenceName:
                                                team_rankings.conferenceName,
                                        },
                                    ]);

                                    return;
                                case "complete":
                                    status_message =
                                        "The game is complete and statistics are being reviewed";
                                    resolve([
                                        {
                                            result: status_message,
                                            divisionPos: team_rankings.division,
                                            divisionName:
                                                team_rankings.divisionName,
                                            conferencePos:
                                                team_rankings.conference,
                                            conferenceName:
                                                team_rankings.conferenceName,
                                        },
                                    ]);

                                    return;
                                case "closed":
                                    status_message = "Final score for %s @ %s: %d - %d".format(
                                        awayTeam,
                                        homeTeam,
                                        awayPoints,
                                        homePoints
                                    );
                                    resolve([
                                        {
                                            result: status_message,
                                            divisionPos: team_rankings.division,
                                            divisionName:
                                                team_rankings.divisionName,
                                            conferencePos:
                                                team_rankings.conference,
                                            conferenceName:
                                                team_rankings.conferenceName,
                                        },
                                    ]);

                                    return;
                            }

                            const status = this.statusConditions(gameStatus);
                            status[0].divisionPos = team_rankings.division;
                            status[0].divisionName = team_rankings.divisionName;
                            status[0].conferencePos = team_rankings.conference;
                            status[0].conferenceName =
                                team_rankings.conferenceName;

                            resolve(status);
                        });
                    }, 1000);
                });
            })
            .catch((e) => {
                throw new TypeError("No NBA Games Found");
            });
    }

    get_rankings(input_team) {
        this._updateUrl();

        return Tp.Helpers.Http.get(this.rankings_url)
            .then((response) => {
                const parsed = JSON.parse(response);
                const conferences = parsed.conferences;
                for (const conference of conferences) {
                    const divisions = conference.divisions;
                    for (const division of divisions) {
                        const teams = division.teams;
                        for (const team of teams) {
                            const team_name = `${team.market} ${team.name}`;

                            if (team_name === input_team) {
                                const rankingObj = team.rank;

                                rankingObj.divisionName = division.name;
                                rankingObj.conferenceName = conference.name;

                                return rankingObj;
                            }
                        }
                    }
                }
                throw new TypeError("Invalid Team Input");
            })
            .catch((e) => {
                throw new TypeError("Invalid Team Input");
            });
    }

    get_get_boxscore(team) {
        return Tp.Helpers.Http.get(this.schedule_url)
            .then((response) => {
                const parsed = JSON.parse(response);
                const games = parsed.games;
                const team_name = team.team.value;
                const full_name = team.team.display;

                let index = 0;
                let gameStatus;
                let gameId = "";
                const platform = this.platform;

                for (let i = 0; i < games.length; i++) {
                    if (
                        games[i].home.alias.toLowerCase() === team_name ||
                        games[i].away.alias.toLowerCase() === team_name
                    ) {
                        index = i;
                        gameStatus = games[i].status;
                        gameId = games[i].id;
                    }
                }

                const homeTeam = games[index].home;
                const awayTeam = games[index].away;
                const homeScore = games[index].home_points;
                const awayScore = games[index].away_points;
                const scheduledTime = games[index].scheduled;
                const dateTime = new Date(scheduledTime);

                switch (gameStatus) {
                    case undefined:
                        return [
                            {
                                status_message: "There is no %s game today. I can notify you when there is a game if you want?".format(
                                    full_name
                                ),
                            },
                        ];
                    case "scheduled":
                        return [
                            {
                                status_message: "Next game %s @ %s at %s".format(
                                    awayTeam.name,
                                    homeTeam.name,
                                    dateTime.toLocaleString(platform.locale, {
                                        timeZone: platform.timezone,
                                    })
                                ),
                            },
                        ];
                    case "closed":
                    case "halftime":
                    case "inprogress":
                        return new Promise((resolve, reject) => {
                            const url = NBA_BOXSCORE_URL.format(gameId);
                            setTimeout(() => {
                                Tp.Helpers.Http.get(url).then((response) => {
                                    const parsed = JSON.parse(response);
                                    const homeQuarters = [];
                                    const awayQuarters = [];
                                    let homeLeader = "";
                                    let awayLeader = "";
                                    for (let i = 0; i < 4; i++) {
                                        try {
                                            homeQuarters.push(
                                                parsed.home.scoring[i].points
                                            );
                                            awayQuarters.push(
                                                parsed.away.scoring[i].points
                                            );
                                        } catch (error) {
                                            homeQuarters.push(0);
                                            awayQuarters.push(0);
                                        }
                                    }
                                    try {
                                        homeLeader =
                                            parsed.home.leaders.points[0]
                                                .full_name;
                                        awayLeader =
                                            parsed.away.leaders.points[0]
                                                .full_name;
                                    } catch (error) {
                                        console.log(error);
                                    }

                                    const box_score = [
                                        {
                                            home_team: this._createTpEntity(
                                                homeTeam
                                            ),
                                            home_score: homeScore,
                                            home_quarter1: homeQuarters[0],
                                            home_quarter2: homeQuarters[1],
                                            home_quarter3: homeQuarters[2],
                                            home_quarter4: homeQuarters[3],
                                            home_leading_scorer: homeLeader,
                                            away_team: this._createTpEntity(
                                                awayTeam
                                            ),
                                            away_score: awayScore,
                                            away_quarter1: awayQuarters[0],
                                            away_quarter2: awayQuarters[1],
                                            away_quarter3: awayQuarters[2],
                                            away_quarter4: awayQuarters[3],
                                            away_leading_scorer: awayLeader,
                                            status_message:
                                                "Game Status: " + gameStatus,
                                        },
                                    ];

                                    resolve(box_score);
                                });
                            }, 1000);
                        });
                }
                return this.statusConditions(gameStatus);
            })
            .catch((e) => {
                throw new TypeError("No NBA Games Found");
            });
    }

    get_get_roster(team) {
        this._updateUrl();
        const team_name = team.team.value;
        const nba_info = NBA_JSON;
        const conferences = nba_info.conferences;
        for (const conference of conferences) {
            const divisions = conference.divisions;
            for (const division of divisions) {
                const teams = division.teams;
                for (const team of teams) {
                    const name = team.alias.toLowerCase();
                    if (name === team_name) {
                        return Tp.Helpers.Http.get(
                            NBA_ROSTER_URL.format(team.id)
                        ).then((response) => {
                            const parsed = JSON.parse(response);
                            const team_members = [];

                            const players = parsed.players;
                            const coaches = parsed.coaches;

                            for (const player of players) {
                                team_members.push({
                                    member:
                                        player.primary_position +
                                        ": " +
                                        player.full_name,
                                });
                            }

                            const sortedRoster = team_members.sort((a, b) => {
                                return a.member.localeCompare(b.member);
                            });
                            for (const coach of coaches) {
                                if (coach.position === "Head Coach") {
                                    const head_coach = coach.full_name;
                                    sortedRoster.push({
                                        member: "Head Coach: " + head_coach,
                                    });
                                }
                            }
                            return sortedRoster;
                        });
                    }
                }
            }
        }
        throw new TypeError("Invalid Team Input");
    }

    statusConditions(gameStatus) {
        let status_message;
        switch (gameStatus) {
            case "canceled":
                status_message = "The game has been canceled";
                return [
                    {
                        result: status_message,
                    },
                ];

            case "delayed":
                status_message = "The game has been delayed";
                return [
                    {
                        result: status_message,
                    },
                ];

            case "unnecessary":
                status_message =
                    "The game was scheduled to occur, but is now deemed unnecessary";
                return [
                    {
                        result: status_message,
                    },
                ];

            case "if_necessary":
                status_message = "The game will be scheduled if necessary";
                return [
                    {
                        result: status_message,
                    },
                ];

            case "postponed":
                status_message = "The game has been postponed";
                return [
                    {
                        result: status_message,
                    },
                ];

            case "time-tbd":
                status_message =
                    "The game has been scheduled but the time has yet to be announced";
                return [
                    {
                        result: status_message,
                    },
                ];

            case "created":
                status_message =
                    "The game has just began and information is being logged";
                return [
                    {
                        result: status_message,
                    },
                ];
        }

        return [];
    }
};
