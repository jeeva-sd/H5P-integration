/**
 * Upload class wrapper to mimic AWS SDK v3 Upload from @aws-sdk/lib-storage
 * This is used by h5p-mongos3 for uploading files to S3-compatible storage
 */
class Upload {
  constructor(options) {
    this.client = options.client;
    this.params = options.params;
  }

  async done() {
    console.log(`📦 Upload.done() called for key: ${this.params.Key}`);
    try {
      const result = await this.client.putObject(this.params);
      console.log(`✓ Upload completed for: ${this.params.Key}`);
      return result;
    } catch (error) {
      console.error(`❌ Upload.done() failed for: ${this.params.Key}`, error.message);
      throw error;
    }
  }
}

module.exports = { Upload };
