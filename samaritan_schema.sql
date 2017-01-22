DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS organizations CASCADE;
DROP TABLE IF EXISTS pledge CASCADE;
CREATE TABLE users(
	id SERIAL PRIMARY KEY,
	name VARCHAR(50),
	username VARCHAR(50),
	email VARCHAR(50) UNIQUE,
	password_digest VARCHAR(255)
);
CREATE TABLE organizations(
	id SERIAL PRIMARY KEY,
	emailid INTEGER REFERENCES users(id),
	orgid INTEGER,
	name VARCHAR(100),
	address1 VARCHAR(100),
	address2 VARCHAR(100),
	city VARCHAR(100),
	mission TEXT
);
CREATE TABLE pledge(
	id SERIAL PRIMARY KEY,
	organid INTEGER REFERENCES organizations(id),
	donation NUMERIC
);
