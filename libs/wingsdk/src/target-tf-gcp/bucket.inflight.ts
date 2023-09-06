import { Storage } from "@google-cloud/storage";
import { BucketDeleteOptions, IBucketClient } from "../cloud";
import { Json } from "../std";

export class BucketClient implements IBucketClient {
  private _public: boolean;
  private bucketName: string;
  private storage: Storage;

  constructor(bucketName: string, isPublic: boolean = false, projectId: string) {
    this._public = isPublic;
    this.bucketName = bucketName;
    this.storage = new Storage({ projectId });
  }

  public async exists(key: string): Promise<boolean> {
    try {
      const res = await this.storage.bucket(this.bucketName).file(key).exists();
      return res[0];
    } catch (err) {
      throw new Error(`Failed to check if object exists. (key=${key})`);
    }
  }

  public async put(key: string, body: string): Promise<void> {
    await this.storage.bucket(this.bucketName).file(key).save(body);
  }

  public async putJson(key: string, body: Json): Promise<void> {
    await this.put(key, JSON.stringify(body, null, 2));
  }

  public async get(key: string): Promise<string> {
    const data = await this.storage.bucket(this.bucketName).file(key).download();
    return data.toString();
  }

  public async tryGet(key: string): Promise<string | undefined> {
    if (await this.exists(key)) {
      return this.get(key);
    }
    return undefined;
  }

  public async getJson(key: string): Promise<Json> {
    return JSON.parse(await this.get(key));
  }

  public async tryGetJson(key: string): Promise<Json | undefined> {
    if (await this.exists(key)) {
      return this.getJson(key);
    }
    return undefined;
  }

  public async delete(key: string, opts: BucketDeleteOptions = {}): Promise<void> {
    const mustExist = opts.mustExist ?? false;
    try {
      await this.storage.bucket(this.bucketName).file(key).delete();
    } catch (err) {
      if (!mustExist && err) {
        return;
      }
      throw err;
    }
  }

  public async tryDelete(key: string): Promise<boolean> {
    if (await this.exists(key)) {
      await this.delete(key);
      return true;
    }
    return false;
  }

  public async list(prefix?: string): Promise<string[]> {
    const [files] = await this.storage.bucket(this.bucketName).getFiles({
      prefix,
    });
    return files.map((file) => file.name);
  }

  public async publicUrl(key: string): Promise<string> {
    this._public; // a little help for implementing public_url later on
    throw new Error(`publicUrl is not supported yet. (key=${key})`);
  }
}
