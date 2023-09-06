import { test, expect, beforeEach, vi } from "vitest";
import { BucketClient } from "../../src/target-tf-gcp/bucket.inflight"; // Update the import path to your GCP BucketClient implementation

vi.mock("@google-cloud/storage");

type TestPath = "happy" | "sad" | "happyJson" | "sadJson";
let TEST_PATH: TestPath;

beforeEach(() => {
  vi.clearAllMocks;
  TEST_PATH = "happy";
});

test("put an object into the bucket", async () => {
  // GIVEN
  const BUCKET_NAME = "BUCKET_NAME";
  const KEY = "KEY";
  const VALUE = "VALUE";

  // WHEN
  const client = new BucketClient(BUCKET_NAME);
  const response = await client.put(KEY, VALUE);

  // THEN
  expect(response).toEqual(undefined);
});

test("putJson an object into the bucket", async () => {
  // GIVEN
  const BUCKET_NAME = "BUCKET_NAME";
  const KEY = "KEY";
  const VALUE = { cool: "beans" };

  // WHEN
  const client = new BucketClient(BUCKET_NAME);
  const response = await client.putJson(KEY, VALUE as any);

  // THEN
  expect(response).toEqual(undefined);
});

test("get an object from the bucket", async () => {
  // GIVEN
  const BUCKET_NAME = "BUCKET_NAME";
  const KEY = "KEY";

  // WHEN
  const client = new BucketClient(BUCKET_NAME);
  TEST_PATH = "happy";

  const response = await client.get(KEY);

  // THEN
  expect(response).toEqual("some fake content");
});

test("get a non-existent object from the bucket", async () => {
  // GIVEN
  const BUCKET_NAME = "BUCKET_NAME";
  const KEY = "KEY";

  // WHEN
  const client = new BucketClient(BUCKET_NAME);
  TEST_PATH = "sad";

  // THEN
  await expect(() => client.get(KEY)).rejects.toThrowError(
    /Object does not exist/
  );
});

test("getJson an object from the bucket", async () => {
  // GIVEN
  const BUCKET_NAME = "BUCKET_NAME";
  const KEY = "KEY";

  // WHEN
  const client = new BucketClient(BUCKET_NAME);
  TEST_PATH = "happyJson";

  const response = await client.getJson(KEY);

  // THEN
  expect(response).toEqual({ cool: "beans" });
});

test("getJson a non-existent object from the bucket", async () => {
  // GIVEN
  const BUCKET_NAME = "BUCKET_NAME";
  const KEY = "KEY";

  // WHEN
  const client = new BucketClient(BUCKET_NAME);
  TEST_PATH = "sad";

  // THEN
  await expect(() => client.getJson(KEY)).rejects.toThrowError(
    /Object does not exist/
  );
});

test("delete object from the bucket", async () => {
  // GIVEN
  const BUCKET_NAME = "BUCKET_NAME";
  const KEY = "KEY";

  // WHEN
  const client = new BucketClient(BUCKET_NAME);
  const response = await client.delete(KEY);

  // THEN
  expect(response).toEqual(undefined);
});

test("List objects from bucket", async () => {
  // GIVEN
  const BUCKET_NAME = "BUCKET_NAME";

  // WHEN
  const client = new BucketClient(BUCKET_NAME);
  const response = await client.list();

  // THEN
  expect(response).toEqual(["object1", "object2"]);
});

test("check that an object exists in the bucket", async () => {
  // GIVEN
  const BUCKET_NAME = "BUCKET_NAME";

  // WHEN
  const client = new BucketClient(BUCKET_NAME);
  TEST_PATH = "happy";

  const objectExists = await client.exists("object1");

  // THEN
  expect(objectExists).toEqual(true);
});

test("check that an object doesn't exist in the bucket", async () => {
  // GIVEN
  const BUCKET_NAME = "BUCKET_NAME";

  // WHEN
  const client = new BucketClient(BUCKET_NAME);
  TEST_PATH = "sad";

  const objectExists = await client.exists("object1");

  // THEN
  expect(objectExists).toEqual(false);
});

test("tryGet an existing object from the bucket", async () => {
  // GIVEN
  const BUCKET_NAME = "BUCKET_NAME";
  const KEY = "KEY";

  // WHEN
  const client = new BucketClient(BUCKET_NAME);
  TEST_PATH = "happy";

  const objectTryGet = await client.tryGet(KEY);

  // THEN
  expect(objectTryGet).toEqual("some fake content");
});

test("tryGet a non-existent object from the bucket", async () => {
  // GIVEN
  const BUCKET_NAME = "BUCKET_NAME";
  const KEY = "KEY";

  // WHEN
  const client = new BucketClient(BUCKET_NAME);
  TEST_PATH = "sad";

  const objectTryGet = await client.tryGet(KEY);

  // THEN
  expect(objectTryGet).toEqual(undefined);
});

test("tryGetJson an existing object from the bucket", async () => {
  // GIVEN
  const BUCKET_NAME = "BUCKET_NAME";
  const KEY = "KEY";

  // WHEN
  const client = new BucketClient(BUCKET_NAME);
  TEST_PATH = "happyJson";

  const response = await client.tryGetJson(KEY);

  // THEN
  expect(response).toEqual({ cool: "beans" });
});

test("tryGetJson a non-existent object from the bucket", async () => {
  // GIVEN
  const BUCKET_NAME = "BUCKET_NAME";
  const KEY = "KEY";

  // WHEN
  const client = new BucketClient(BUCKET_NAME);
  TEST_PATH = "sad";

  const response = await client.tryGetJson(KEY);

  // THEN
  expect(response).toEqual(undefined);
});

test("tryGetJson an existing non-Json object from the bucket", async () => {
  // GIVEN
  const BUCKET_NAME = "BUCKET_NAME";
  const KEY = "KEY";

  // WHEN
  const client = new BucketClient(BUCKET_NAME);
  TEST_PATH = "sadJson";

  // THEN
  // It seems to throw a different error per OS/Node.js version
  await expect(() => client.tryGetJson(KEY)).rejects.toThrowError();
});
