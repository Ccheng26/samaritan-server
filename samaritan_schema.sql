DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS organizations CASCADE;
DROP TABLE IF EXISTS pledges CASCADE;
CREATE TABLE users(
	id SERIAL PRIMARY KEY,
	name VARCHAR(50),
	username VARCHAR(50),
	email VARCHAR(50) UNIQUE,
	password_digest VARCHAR(255)
);
CREATE TABLE organizations(
	orgid INTEGER PRIMARY KEY,
	emailid INTEGER REFERENCES users(id),
	name VARCHAR(100),
	address1 VARCHAR(100),
	address2 VARCHAR(100),
	city VARCHAR(100),
	mission TEXT,
	programs TEXT
);
CREATE TABLE pledges(
	id SERIAL PRIMARY KEY,
	organid INTEGER REFERENCES organizations(orgid),
	pledge NUMERIC,
	pdate varchar(10) default (CURRENT_DATE)
);
