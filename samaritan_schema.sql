DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS organizations CASCADE;
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
	name VARCHAR(100),
	donation NUMERIC
);
