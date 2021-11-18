# be

Koa.js backend for Dyon exchange. Uses MongoDB database.

## High Level Overview - Entire Architecture

The intent of this section is to offer a high level overview of the functioning of the Dyon wine orderbook exchange application.

There are notes included in this section to guide future devs in easily transitioning to work on this project.
​
## General Purchase Flow
​
                                                                                 user +
                                                 ┌──────────────────────────┐ 4. order status updated
                                                 │                          │    in db
                                                 │                      ┌───┴──┐
                                                 │   ┌─────────────────►│      │
                                                 ▼   │                  │      │
┌─────────┐                                     ┌────┴──────────────┐   │      │
│         │         1. user places order        │                   ├──►│  db  │
│  front  │            from front end           │                   │   │      │
│         ├────────────────────────────────────►│                   │   │      │
│   end   │                                     │    node server    │   │      │
│         │◄────────────────────────────────────┤                   │◄──┤      │
└─────────┘         5. user is provided with    │                   │   └──────┘
                       a response on their      │                   │   2. order stored in db
                       order status             │                   │
                                                │                   │
                                                │                   │
                                                │                   │
                                                └───────────────┬───┘
                                                         ▲      │
                                                         │      │ 3. node server passes
                                                         │      │    request to go orderbook
                                                         │      │    the orderbook server will
                                                         │      │    process all transactions
                                                         │      │    possible and return relevant
                                                         │      │    data
                                                         │      │
  note: the productIdentifier                            │      │3a. Unfilled orders are eventually
  corresponds to ids of these tokens.                    │      │    filled by an order on the other
  users making these orders will have                    │      ▼    side of the trade
  ownership details stored in their               ┌──────┴─────────┐
  document in users collection.                   │                │
  ┌───────────────────┐                           │                │
  │                   │                           │                │
  │                   │                           │    orderbook   │
  │                   │                           │                │
  │       dyon        │                           │                │
  │  smart contract   │                           │                │
  │                   │                           │                │
  │                   │                           └────────────────┘
  │                   │
  │                   │
  │                   │
  └───────────────────┘
​
The above diagram illustrates general purchase flow. The orderbook server currently runs in memory, meaning that in the event of 
a crash all pending orders will be lost. Running the server in memory ensures minimum latency in processing transactions, which scale significantly with increased exchange use. To mitigate the problems associated with losing data, new developers should consider:
​
- Writing and maintaining a script to reconstruct the state of the orderbook from the mongodb entries written by the node server
- Adding a persistent redis in-memory cache the go server can interact with to ensure persistence in case of crash, making the reconstruct script a last resort. More information is available here: https://redis.io/topics/persistence
- Devops in the production environment should be implemented with careful attention to memory management and redundancy - even with persistence, if memory needs are not serviced appropriately the container of the application may fail to meet demands.
​
## Updating Market Prices
​
Market prices are currently calculated via a google cloud cron job pinging the orderbook server. In a move to a production environment, the future development team may consider switching from a http to a websocket implementation.
​
The cron job is available for local development in app.ts of the back end repository, currently commented out. The future development team may consider extracting this out to its own small app housed in a backend subdirectory.

### Running Locally

Of course, first run `npm install`, etc. 

Ensure all of your environmental variables on your front and back end are pointed to local instances of your orderbook server, node app, and mongodb database - if you are not familiar with or prefer not to use the mongod server via command line interface, mongodb compass is a useful GUI.

Go into your dyon-contracts folder, and run the command `npx hardhat node` - this will run a local instance of the blockchain on `http:localhost:8545`. Then run the command `npx hardhat --network localhost deploy` - this will deploy an instance of the contract to this local environment.

Then you must start the orderbook server locally - go to your orderbook folder and run the command `go run main.go`. If you see the console log statement, `Orderbook server is listening on port 5341` you have succeeded.

Return to your node backend folder. Run the following script: `npx ts-node scripts/populateDb.ts prod` - this will populate your local database with the appropriate dummy data. Then run `npm run dev` which will start your local development server. Ensure your orderbook has been running for this entire process.

Lastly run your front end with the `npm start` command. You should be abe to develop locally now.

### Custom NPM package

The smart contract API is exposed as a custom NPM [package](https://gitlab.com/winebit/dyon-contracts) to allow for code separation.

### Scripts

In the `/scripts` directory there is some scripts used for populating the DB with data quickly so it is possible to get back to a known good state ready to test the platform.

### Cron Jobs

2 cron jobs are used for updating the market prices and updating the change percentage over the past 24 hours for all assets.

On App Engine the instance will scale down to zero if it is not handling any requests so you cannot run normal cron jobs on App Engine. App Engine has it's own configuration for cron jobs, which is in `cron.yaml`. There is a job in the CI that updates this if it has changed. App Engine sends requests to the routes you define in the yaml file.
