CREATE TABLE teams (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    short_name VARCHAR(5) NOT NULL UNIQUE
);

CREATE TABLE matches (
    id SERIAL PRIMARY KEY,
    home_team_id INT REFERENCES teams(id),
    away_team_id INT REFERENCES teams(id),
    status VARCHAR(20) DEFAULT 'LIVE',
    target INT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE live_score (
    match_id INT PRIMARY KEY REFERENCES matches(id),
    runs INT DEFAULT 0,
    wickets INT DEFAULT 0,
    balls INT DEFAULT 0,
    crr NUMERIC(4,2) DEFAULT 0.00,
    rrr NUMERIC(4,2) DEFAULT 0.00
);

CREATE TABLE players (
    id SERIAL PRIMARY KEY,
    team_id INT REFERENCES teams(id),
    name VARCHAR(100) NOT NULL,
    role VARCHAR(20)
);

CREATE TABLE current_match_stats (
    match_id INT REFERENCES matches(id),
    player_id INT REFERENCES players(id),
    runs_scored INT DEFAULT 0,
    balls_faced INT DEFAULT 0,
    fours INT DEFAULT 0,
    sixes INT DEFAULT 0,
    overs_bowled NUMERIC(3,1) DEFAULT 0.0,
    runs_conceded INT DEFAULT 0,
    wickets_taken INT DEFAULT 0,
    PRIMARY KEY (match_id, player_id)
);
