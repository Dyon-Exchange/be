# be

Koa.js backend for Dyon exchange. Uses MongoDB database.

### Custom NPM package

The smart contract API is exposed as a custom NPM [package](https://gitlab.com/winebit/dyon-contracts) to allow for code separation.

### Scripts

In the `/scripts` directory there is some scripts used for populating the DB with data quickly so it is possible to get back to a known good state ready to test the platform.

### Cron Jobs

2 cron jobs are used for updating the market prices and updating the change percentage over the past 24 hours for all assets.

On App Engine the instance will scale down to zero if it is not handling any requests so you cannot run normal cron jobs on App Engine. App Engine has it's own configuration for cron jobs, which is in `cron.yaml`. There is a job in the CI that updates this if it has changed. App Engine sends requests to the routes you define in the yaml file.
