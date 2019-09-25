//
// read and write data to backend cloud storage
//

// store the data in IBM Cloud Object Storage - an AWS S3 equivalent
var COS = require('ibm-cos-sdk');
var Config = require('./config.js');


var getStorageConfig = function () {
    var config = new Config();
    var storageConfig = config.get('storageConfig');

    if (!storageConfig) {
        console.log("ERROR! no storage configuration found!");
    } else {
        console.log("Found storage config: " + storageConfig.serviceInstanceId);
    }

    return storageConfig;
};

var cos = new COS.S3(getStorageConfig());

var Storage = function (bucket) {

    // see if the key exists in the bucket
    this.exists = function (key) {
        return new Promise((resolve, reject) => {
            console.log(`Looking for key ${key} in bucket ${bucket}`);

            return cos.listObjects({
                    Bucket: bucket
                }).promise()
                .then((data) => {
                    var result = false;

                    if (data != null && data.Contents != null) {
                        for (var i = 0; i < data.Contents.length; i++) {
                            var itemKey = data.Contents[i].Key;
                            var itemSize = data.Contents[i].Size;

                            if (itemKey === key) {
                                console.log(`Found Item: ${itemKey} (${itemSize} bytes).`);
                                result = true;
                                break;
                            }
                        }
                    }

                    resolve(result);
                })
                .catch((e) => {
                    console.error(`ERROR: ${e.code} - ${e.message}\n`);
                    reject(e);
                });
        });
    };

    // return the contents of this key.  note that we assume that a 
    // valid JSON object is stored and that's what we retrieve
    this.get = function (key) {
        return new Promise((resolve, reject) => {
            console.log(`Retrieving item from bucket: ${bucket}, key: ${key}`);

            return cos.getObject({
                    Bucket: bucket,
                    Key: key
                }).promise()
                .then((data) => {
                    var result = null;

                    if (data != null) {
                        var str = Buffer.from(data.Body).toString();
                        console.log('Found : ' + str.length + ' bytes.');

                        result = JSON.parse(str);
                    }

                    resolve(result);
                })
                .catch((e) => {
                    console.error(`ERROR: ${e.code} - ${e.message}\n`);
                    reject(e);
                });
        });
    };

    // return the contents of this key.  note that we assume a
    // javascript object as input that we serialize to a string
    this.put = function (key, data) {
        return new Promise((resolve, reject) => {
            var str = JSON.stringify(data);

            console.log(`Storing item from bucket: ${bucket}, key: ${key}, ${str.length} bytes`);

            return cos.putObject({
                    Bucket: bucket,
                    Key: key,
                    Body: str
                }).promise()
                .then(() => {
                    console.log("Storage.put: item stored!");
                    resolve(str); // return the content we actually stored
                })
                .catch((e) => {
                    console.error(`Storage.put: ERROR! ${e.code} - ${e.message}\n`);
                    reject(e);
                });
        });
    };
};

module.exports = Storage;