import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const s3Client = new S3Client({
  endpoint: "https://s3images.integracolombia.com",
  region: "us-east-1",
  credentials: {
    accessKeyId: "admin",
    secretAccessKey: "uI2IU2TS826sQbiQkunDEzddw",
  },
  forcePathStyle: true, 
});

const BUCKET_NAME = "ticket";

async function testUpload() {
  try {
    console.log("Attempting upload...");
    await s3Client.send(new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: "test-file.txt",
      Body: Buffer.from("Hello world"),
      ContentType: "text/plain",
    }));
    console.log("Upload successful!");
  } catch (e) {
    console.error("Upload failed with error:", e);
  }
}

testUpload();
