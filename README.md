# Dyon Backend

Koa.js backend for Dyon exchange. Uses MongoDB database.

## Set up

Install dependencies with: `npm install`

Run the dev server with: `npm run dev`

### Smart Contracts Import

This project relies on the [Dyon Smart Contracts package](https://gitlab.com/labrysio/winebit/dyon-contracts), this package is hosted on GitLab's package registry. The `.npmrc` is set up with a valid pull auth token to be able to pull the package. If the smart contracts repo is moved to another namespace, or a different provider, or it is hosted on a different private npm registry, then this will need to be set up again. 

See the following links for more details:
- [Publish a package](https://docs.gitlab.com/ee/user/packages/npm_registry/index.html#publish-an-npm-package)
- [Install a package](https://docs.gitlab.com/ee/user/packages/npm_registry/index.html#install-a-package)

### Environment Variables

This project expects a number of environment variables, see `.env.example` for an example of the format. The current (production) values for these variables can be found in the CI/CD -> Variables section of the repo's settings (https://gitlab.com/labrysio/winebit/be/-/settings/ci_cd).


## Deployment

This repo is set up with GitLab's CI/CD to automatically deploy to GCP. See `.gitlab-ci.yml` to see how this deployment works. It is deployed to Google App Engine, and makes use of its [cron.yaml](https://cloud.google.com/appengine/docs/flexible/nodejs/scheduling-jobs-with-cron-yaml) support to set up a cron job. The `npx gae-ayaml-env` command takes the CI/CD environment variables that start with `APP_` and insert them into the Google App Engine `app.yaml` file.
