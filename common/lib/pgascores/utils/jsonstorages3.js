/**
 * read and write JSON data object to Amazon S3
 */

const AWS = require("aws-sdk");

/**
 * Encapsulates interacting with Object storage for listing, storing
 * and retrieving JSON data
 *
 * @param {Object} serviceCredentials object consisting of:
 *      accessKeyId: key from Amazon
 *      secretAccessKey: secret key from Amazon
 *
 * @param {String} bucket the name of the bucket to access
 */
const JsonStorageS3 = function (serviceCredentials, bucket) {
  const s3 = new AWS.S3(serviceCredentials);

  this.keys = function () {
    return new Promise((resolve, reject) => {
      console.log(`listing keys in bucket ${bucket}`);

      // Set up S3 parameters
      const params = {
        Bucket: bucket,
      };

      // get all object names in the bucket
      s3.listObjects(params, function (err, data) {
        if (err) {
          console.log("Storage.put: ERROR! ", e);
          reject(err);
          return;
        }

        const result = [];

        if (data != null && data.Contents != null) {
          console.log(
            `Storage.keys: ${data.Contents.length} items retrieved successfully.`
          );

          for (var i = 0; i < data.Contents.length; i++) {
            var itemKey = data.Contents[i].Key;
            var itemSize = data.Contents[i].Size;

            result.push({ name: itemKey, size: itemSize });
          }
        } else {
          consolel.log(`ERROR: no data from listObjects!`);
        }

        resolve(result);
      });
    });
  };

  /**
   * see if the key exists in the bucket
   *
   * @param {String} key object to query
   * @returns true if key exists in bucket, false otherwise
   */
  this.exists = function (key) {
    return new Promise((resolve) => {
      // Set up S3 parameters
      const params = {
        Bucket: bucket,
        Key: key,
      };

      // see if the object exists
      s3.headObject(params, function (err) {
        console.log("s3 result ", err);
        if (err) {
          // we eat any errors and assume the key doesn't exist
          console.log(`Could not find object with key ${key}. `, err.code);
          resolve(false);
          return;
        }

        // any good result means we found the key.
        console.log(`Found key ${key} in bucket ${bucket}`);
        resolve(true);
      });
    });
  };

  /**
   * return the contents of this key.  note that we assume that a
   * valid JSON object is stored and that's what we retrieve
   *
   * @param {String} key bucket to retrieve
   * @returns JSON object with resulting key data
   */
  this.get = function (key) {
    return new Promise((resolve, reject) => {
      console.log(`Retrieving item from bucket: ${bucket}, key: ${key}`);

      // Set up S3 parameters
      const params = {
        Bucket: bucket,
        Key: key,
      };

      s3.getObject(params, function (err, data) {
        if (err) {
          console.log("Storage.put: ERROR! ", e);
          reject(err);
          return;
        }

        if (data != null) {
          var str = Buffer.from(data.Body).toString();
          console.log(`Storaget.get: retrived ${str.length} bytes.`);

          // we assume that the object stored is a JSON object
          // this will fail for other document types
          result = JSON.parse(str);
        }

        resolve(result);
      });
    });
  };

  /**
   * store the contents of this key.  note that we assume a
   * javascript object as input that we serialize to a string
   *
   * @param {String} key bucket to retrieve
   * @param {Object} data Javascript object to store
   * @returns the content that was stored
   */
  this.put = function (key, data) {
    return new Promise((resolve, reject) => {
      var str = JSON.stringify(data);

      console.log(
        `Storing item from bucket: ${bucket}, key: ${key}, ${str.length} bytes`
      );

      // Set up S3 parameters
      const params = {
        Bucket: bucket,
        Key: key,
        Body: str,
        ContentType: "application/json",
      };

      // Uploading to the bucket
      s3.upload(params, function (err, data) {
        if (err) {
          console.log("Storage.put: ERROR! ", e);
          reject(err);
        }
        console.log(`Storage.put: item stored successfully. ${data.Location}`);
        resolve(str); // return the content we just stored
      });
    });
  };
};

module.exports = JsonStorageS3;
