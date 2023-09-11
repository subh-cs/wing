import { Construct } from "constructs";
import { App } from "./app";
import { StorageBucket } from "../.gen/providers/google/storage-bucket";
import { StorageBucketIamMember } from "../.gen/providers/google/storage-bucket-iam-member";
import { StorageBucketObject } from "../.gen/providers/google/storage-bucket-object";
import { Id } from "../.gen/providers/random/id";
import * as cloud from "../cloud";
import { Function } from "./function";
import {
  CaseConventions,
  NameOptions,
  ResourceNames,
} from "../shared/resource-names";
import { IInflightHost } from "../std";

/**
 * Bucket names must be between 3 and 63 characters. We reserve 9 characters for
 * a random ID, so the maximum length is 54.
 *
 * You can use lowercase alphanumeric characters, dashes (-), underscores (_),
 * and dots (.). However, names containing dots require verification, so we
 * generate names without dots by default.
 *
 * We skip generating a hash since we need to append a random string to the
 * bucket name to make it globally unique.
 *
 * See: https://cloud.google.com/storage/docs/naming-buckets
 */
const BUCKET_NAME_OPTS: NameOptions = {
  maxLen: 54,
  case: CaseConventions.LOWERCASE,
  disallowedRegex: /([^a-z0-9_\-]+)/g,
  includeHash: false,
};



/**
 * GCP implementation of `cloud.Bucket`.
 *
 * @inflight `@winglang/sdk.cloud.IBucketClient`
 */
export class Bucket extends cloud.Bucket {
  private readonly bucket: StorageBucket;
  private readonly public: boolean;

  constructor(scope: Construct, id: string, props: cloud.BucketProps = {}) {
    super(scope, id, props);
    this.public = props.public ?? false;

    const bucketName = ResourceNames.generateName(this, BUCKET_NAME_OPTS);

    // GCP bucket names must be globally unique, but the Terraform resource
    // provider doesn't provide a mechanism like `bucketPrefix` as AWS does,
    // so we must generate a random string to append to the bucket name.
    //
    // The random string must be managed in Terraform state so that it doesn't
    // change on every subsequent compile or deployment.
    const randomId = new Id(this, "Id", {
      byteLength: 4, // 4 bytes = 8 hex characters
    });

    this.bucket = new StorageBucket(this, "Default", {
      name: bucketName + "-" + randomId.hex,
      location: (App.of(this) as App).storageLocation,
      // recommended by GCP: https://cloud.google.com/storage/docs/uniform-bucket-level-access#should-you-use
      uniformBucketLevelAccess: true,
      publicAccessPrevention: this.public ? "inherited" : "enforced",
    });

    if (this.public) {
      // https://cloud.google.com/storage/docs/access-control/making-data-public#terraform
      new StorageBucketIamMember(this, "PublicAccessIamMember", {
        bucket: this.bucket.name,
        role: "roles/storage.objectViewer",
        member: "allUsers",
      });
    }
  }

  public addObject(key: string, body: string): void {
    new StorageBucketObject(this, `Object-${key}`, {
      bucket: this.bucket.id,
      name: key,
      content: body,
    });
  }

  public bind(host: IInflightHost, ops: string[]): void {
    if (!(host instanceof Function)) {
      throw new Error("Buckets can only be bound by GCP functions for now.");
    }

    // Define the appropriate permissions and roles for GCP
    if (
      ops.includes(cloud.BucketInflightMethods.DELETE) ||
      ops.includes(cloud.BucketInflightMethods.PUT) ||
      ops.includes(cloud.BucketInflightMethods.PUT_JSON)
    ) {
      // Add permissions for write operations

      
    } else if (
      ops.includes(cloud.BucketInflightMethods.GET) ||
      ops.includes(cloud.BucketInflightMethods.LIST) ||
      ops.includes(cloud.BucketInflightMethods.GET_JSON)
    ) {
      // Add permissions for read operations
      
    }

    // host.addEnvironment(this.envName(), this.bucket.name);
    // Add other necessary environment variables for GCP as needed
    // ...

    super.bind(host, ops);
  }

  /**
   * Run an inflight whenever a file is uploaded to the bucket.
   */
  public onCreate(fn: cloud.IBucketEventHandler, opts?: cloud.BucketOnCreateProps): void {
    fn;
    opts;
    throw new Error("on_create method isn't implemented yet on the current target.");
  }

  /**
   * Run an inflight whenever a file is deleted from the bucket.
   */
  public onDelete(fn: cloud.IBucketEventHandler, opts?: cloud.BucketOnDeleteProps): void {
    fn;
    opts;
    throw new Error("on_delete method isn't implemented yet on the current target.");
  }

  /**
   * Run an inflight whenever a file is updated in the bucket.
   */
  public onUpdate(fn: cloud.IBucketEventHandler, opts?: cloud.BucketOnUpdateProps): void {
    fn;
    opts;
    throw new Error("on_update method isn't implemented yet on the current target.");
  }

  /**
   * Run an inflight whenever a file is uploaded, modified, or deleted from the bucket.
   */
  public onEvent(fn: cloud.IBucketEventHandler, opts?: cloud.BucketOnEventProps): void {
    fn;
    opts;
    throw new Error("on_event method isn't implemented yet on the current target.");
  }

  /** @internal */
  public _toInflight(): string {
    throw new Error("Method not implemented.");
  }
}
