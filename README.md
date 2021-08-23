# be

Koa.js backend for Dyon exchange. Uses MongoDB database.

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
