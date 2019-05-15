//
// read and write data to backend cloud storage
//

// store the data in IBM Cloud Object Storage - an AWS S3 equivalent
var COS = require('ibm-cos-sdk');

var config = {
    endpoint: 's3.us-east.cloud-object-storage.appdomain.cloud',
    apiKeyId: 'W4P-trxAlrr-Wr8Hug_VvvMziJnJQLxtn664l6-aNyJh',
    ibmAuthEndpoint: 'https://iam.ng.bluemix.net/oidc/token',
    serviceInstanceId: 'crn:v1:bluemix:public:cloud-object-storage:global:a/dc08b123363344cdb63b5c8e27bd39f4:cd33a2f5-1e70-48a9-806d-82946bab4aa6::',
};

var Storage = function (bucket) {
    var cos = new COS.S3(config);

    // see if the key exists in the bucket
    this.exists = function (key) {
        return new Promise((resolve, reject) => {
            console.log(`Looking for key ${key} in bucket ${bucket}`);

            return cos.listObjects({
                    Bucket: bucket
                }, ).promise()
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
                    resolve(str);   // return the content we actually stored
                })
                .catch((e) => {
                    console.error(`ERROR: ${e.code} - ${e.message}\n`);
                    reject(e);
                });
        });
    };
};

module.exports = Storage;