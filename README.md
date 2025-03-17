# TourData - PGA Tour Data API

This exposes an API which fetches PGA Tour Tournament data. Player rankings, Seasons, Tournaments. You can view the API in the running server by accessing the Swagger UI at (http://localhost:3001/explorer)

## Configuration

### Enviroment variables:

`NO_ARCHIVE`

- if set, the server will skip archiving data to S3 bucket. Can be useful for testing.

### Config file:

`server/config.local.json`:

Archived stats are stored in an S3 bucket. To access the bucket, you will need to provide the access key and secret key in the `config.local.json` file. The file should look like this:

```json
{
  "storageConfig": {
    "accessKeyId": "xxx",
    "secretAccessKey": "xxx"
  }
}
```

## Testing and test files

/tests/curl

- sample CURL commands against the pga tour api

/tests/pgatour

- stand alone test files that exercise the tourdata API which in turn calls the PGA Tour API

```

```
