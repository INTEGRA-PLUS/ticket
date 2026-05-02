import { S3Client, ListObjectsV2Command } from "@aws-sdk/client-s3";

const s3Client = new S3Client({
  endpoint: "https://s3images.integracolombia.com",
  region: "us-east-1",
  credentials: {
    accessKeyId: "admin",
    secretAccessKey: "uI2IU2TS826sQbiQkunDEzddw",
  },
  forcePathStyle: true, 
});

async function list() {
  try {
    const res = await s3Client.send(new ListObjectsV2Command({ Bucket: "ticket" }));
    console.log("Files in bucket:", res.Contents?.map(c => c.Key));
  } catch (e) {
    console.error("List failed:", e);
  }
}

list();
