const { BlobServiceClient } = require("@azure/storage-blob");
const { Readable } = require("stream");

/**
 * Azure Blob Storage adapter that provides S3-compatible interface
 * for use with @lumieducation/h5p-mongos3
 */
class AzureBlobS3Adapter {
  constructor(connectionString, containerName, basePath = '') {
    this.blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
    this.containerName = containerName;
    this.basePath = basePath ? basePath.replace(/\/$/, '') : ''; // Remove trailing slash
    this.containerClient = this.blobServiceClient.getContainerClient(containerName);
  }

  /**
   * Get the full blob path with base path prefix
   */
  _getFullPath(key) {
    if (this.basePath) {
      return `${this.basePath}/${key}`;
    }
    return key;
  }

  /**
   * Initialize the container (just verify connection, don't create)
   */
  async initialize() {
    try {
      // Just verify the container exists by getting its properties
      await this.containerClient.getProperties();
      console.log(`Using existing container: ${this.containerName}`);
    } catch (error) {
      if (error.statusCode === 404) {
        throw new Error(`Container '${this.containerName}' does not exist in the storage account. Please create it first.`);
      }
      throw error;
    }
  }

  /**
   * Upload object to blob storage
   * Compatible with AWS SDK v3 putObject
   */
  async putObject(params) {
    const { Bucket, Key, Body, ACL, Metadata } = params;
    const fullPath = this._getFullPath(Key);
    const blockBlobClient = this.containerClient.getBlockBlobClient(fullPath);
    
    try {
      // Convert Body to Buffer if it's a stream
      let buffer;
      if (Body instanceof Readable) {
        buffer = await this._streamToBuffer(Body);
      } else if (Buffer.isBuffer(Body)) {
        buffer = Body;
      } else if (typeof Body === 'string') {
        buffer = Buffer.from(Body);
      } else {
        buffer = Buffer.from(JSON.stringify(Body));
      }

      console.log(`📤 Uploading to Azure Blob: ${fullPath} (${buffer.length} bytes)`);

      // Use uploadData which is more reliable than upload
      const uploadResponse = await blockBlobClient.uploadData(buffer, {
        metadata: Metadata || {},
        blobHTTPHeaders: {
          blobContentType: this._getContentType(Key)
        }
      });

      console.log(`Successfully uploaded: ${fullPath}`);
      return uploadResponse;
    } catch (error) {
      console.error(`Error uploading to Azure Blob: ${fullPath}`, error.message);
      console.error(`   Full error:`, error);
      throw error;
    }
  }

  /**
   * Determine content type based on file extension
   */
  _getContentType(filename) {
    const ext = filename.split('.').pop().toLowerCase();
    const mimeTypes = {
      'json': 'application/json',
      'js': 'application/javascript',
      'css': 'text/css',
      'html': 'text/html',
      'xml': 'application/xml',
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'gif': 'image/gif',
      'svg': 'image/svg+xml',
      'mp4': 'video/mp4',
      'webm': 'video/webm',
      'mp3': 'audio/mpeg',
      'wav': 'audio/wav',
      'pdf': 'application/pdf',
      'zip': 'application/zip',
      'txt': 'text/plain'
    };
    return mimeTypes[ext] || 'application/octet-stream';
  }

  /**
   * Get object from blob storage
   */
  async getObject(params) {
    const { Bucket, Key, Range } = params;
    const fullPath = this._getFullPath(Key);
    const blockBlobClient = this.containerClient.getBlockBlobClient(fullPath);

    try {
      let downloadOptions = {};
      
      // Handle range requests (for streaming)
      if (Range) {
        const rangeMatch = Range.match(/bytes=(\d+)-(\d*)/);
        if (rangeMatch) {
          const start = parseInt(rangeMatch[1]);
          const end = rangeMatch[2] ? parseInt(rangeMatch[2]) : undefined;
          downloadOptions.range = { offset: start, count: end ? end - start + 1 : undefined };
        }
      }

      const downloadResponse = await blockBlobClient.download(0, undefined, downloadOptions);
      
      return {
        Body: downloadResponse.readableStreamBody,
        ContentLength: downloadResponse.contentLength,
        LastModified: downloadResponse.lastModified
      };
    } catch (error) {
      if (error.statusCode === 404) {
        const notFoundError = new Error('The specified key does not exist.');
        notFoundError.name = 'NoSuchKey';
        notFoundError.$metadata = { httpStatusCode: 404 };
        throw notFoundError;
      }
      throw error;
    }
  }

  /**
   * Get object metadata (head)
   */
  async headObject(params) {
    const { Bucket, Key } = params;
    const fullPath = this._getFullPath(Key);
    const blockBlobClient = this.containerClient.getBlockBlobClient(fullPath);

    try {
      const properties = await blockBlobClient.getProperties();
      
      return {
        ContentLength: properties.contentLength,
        LastModified: properties.lastModified,
        Metadata: properties.metadata || {}
      };
    } catch (error) {
      if (error.statusCode === 404) {
        const notFoundError = new Error('Not Found');
        notFoundError.name = 'NotFound';
        notFoundError.$metadata = { httpStatusCode: 404 };
        throw notFoundError;
      }
      throw error;
    }
  }

  /**
   * Delete object from blob storage
   */
  async deleteObject(params) {
    const { Bucket, Key } = params;
    const fullPath = this._getFullPath(Key);
    const blockBlobClient = this.containerClient.getBlockBlobClient(fullPath);
    
    try {
      await blockBlobClient.delete();
      return {};
    } catch (error) {
      // Ignore 404 errors on delete
      if (error.statusCode !== 404) {
        throw error;
      }
      return {};
    }
  }

  /**
   * Delete multiple objects
   */
  async deleteObjects(params) {
    const { Bucket, Delete } = params;
    const objectsToDelete = Delete.Objects || [];

    const results = await Promise.allSettled(
      objectsToDelete.map(obj => this.deleteObject({ Bucket, Key: obj.Key }))
    );

    return {
      Deleted: objectsToDelete.map((obj, idx) => ({
        Key: obj.Key,
        DeleteMarker: false
      }))
    };
  }

  /**
   * List objects with prefix
   */
  async listObjectsV2(params) {
    const { Bucket, Prefix, ContinuationToken, MaxKeys = 1000 } = params;
    
    // Add base path to the prefix
    const fullPrefix = this._getFullPath(Prefix || '');
    
    const options = {
      prefix: fullPrefix
    };

    const contents = [];
    let isTruncated = false;
    let nextContinuationToken = null;

    try {
      const iterator = this.containerClient.listBlobsFlat(options).byPage({ 
        maxPageSize: MaxKeys,
        continuationToken: ContinuationToken 
      });

      for await (const page of iterator) {
        for (const blob of page.segment.blobItems) {
          // Remove base path from the returned key to maintain compatibility
          let key = blob.name;
          if (this.basePath && key.startsWith(this.basePath + '/')) {
            key = key.substring(this.basePath.length + 1);
          }
          
          contents.push({
            Key: key,
            Size: blob.properties.contentLength,
            LastModified: blob.properties.lastModified
          });
        }
        
        if (page.continuationToken) {
          isTruncated = true;
          nextContinuationToken = page.continuationToken;
        }
        break; // Only get first page
      }

      return {
        Contents: contents,
        IsTruncated: isTruncated,
        NextContinuationToken: nextContinuationToken,
        KeyCount: contents.length
      };
    } catch (error) {
      console.error('Error listing objects:', error);
      return {
        Contents: [],
        IsTruncated: false,
        KeyCount: 0
      };
    }
  }

  /**
   * Helper: Convert stream to buffer
   */
  async _streamToBuffer(stream) {
    return new Promise((resolve, reject) => {
      const chunks = [];
      stream.on('data', (chunk) => chunks.push(chunk));
      stream.on('end', () => resolve(Buffer.concat(chunks)));
      stream.on('error', (err) => {
        console.error('Error reading stream:', err);
        reject(err);
      });
    });
  }
}

/**
 * Create Azure Blob Storage adapter for H5P
 * @param {string} connectionString - Azure Storage connection string
 * @param {string} containerName - Container name for blob storage
 * @param {string} basePath - Base path prefix for all files (e.g., 'assets/lms/h5p/media')
 */
async function createAzureBlobAdapter(connectionString, containerName, basePath = '') {
  const adapter = new AzureBlobS3Adapter(connectionString, containerName, basePath);
  await adapter.initialize();
  return adapter;
}

module.exports = { createAzureBlobAdapter, AzureBlobS3Adapter };
