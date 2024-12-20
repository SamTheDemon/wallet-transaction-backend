# Wallet and Transaction Management System
proof of concept to evaluate development skills in building a full-stack application.

This project is wallet and transaction management system built with:
- Backend: NestJS SQL PostgreSQL, and MongoDB.
- Frontend: Vue.js

## Table of Contents
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Environment Variables](#environment-variables)
- [Features](#features)

## Prerequisites

### backend: 
- Node.js (v16+)
- npm
- MongoDB (v5+) and Mongoose 10.1.0
- Redis 4.7.0
- PostgreSQL 

#### Key Dependencies:
1. NestJS Core Packages: @nestjs/common, @nestjs/core, etc.
2. MongoDB: Managed using @nestjs/mongoose and mongoose.
3. Redis: Managed using ioredis.
4. JWT Authentication: @nestjs/jwt, passport, and related packages.
5. TypeORM (Optional): You still have typeorm and pg installed. Ensure these are not unused.
6. Other Utilities:
7. bcrypt: For password hashing.
8. date-fns: For date manipulation.
9. axios: For HTTP requests.
10. ESLint and Prettier: For linting and formatting.

## Installation
1. Clone the repository:
   ```bash
   git clone 

2. Back-end installation:
-  Go to the back-end directory in a new terminal keep the front-end terminal running: `cd .\wallet-transaction-backend\`
- Install dependencies: `npm install`
- Confirm environment variables `.env` file is located in: directory of  `\wallet-transaction-backend\` 
- Run the server: `npm run start`

Note to be able to test the endpoint you need to have the backend server and redis up and running


## environment-variables
In case if the `.env` file is not in the `\wallet-transaction-backend\` directory,
 you can create a new `.env` and set the following:
 - a `JWT_SECRET=YOUR_JWT_SECRET`. 
 - `DB_HOST=localhost`
- `DB_PORT=5432`
- `DB_USERNAME=YOUR_DB_USERNAME`
- `DB_PASSWORD=YOUR_DB_PASSWORD`
- `DB_NAME=wallet_transaction_db`
- `MONGO_URI= YOUR_MONGO_URL/wallet_system`

## features
- this allows User to:
1. signup
2. signin
3. create a new wallet, with different currrancies. 
4. send money to other wallets with real time currancy convertion rates.
5. View Incoming, and Outoging Transactions.
6. dashboard with the following features:
    - Calcaulate Available Balance of all wallets IN USD.
    - Calcaulate Incoming of this Month in USD.
    - Calcaulate Outgoing of this Month in USD.
    - an interactive financial graph shows the Incoming and Outgoing for the last 7 days.
    - a Quick look into recent Transactions.



