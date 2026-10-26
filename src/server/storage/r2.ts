import "server-only";

import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";

import type { PutObjectInput, StorageAdapter } from "@/server/storage/types";

interface R2Config {
  endpoint: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucket: string;
  region: string;
  forcePathStyle: boolean;
}

function readBoolean(value: string | undefined, fallback: boolean) {
  if (value === undefined || value.trim() === "") return fallback;
  return value.toLowerCase() === "true";
}

function readConfig(): R2Config {
  const accountId = process.env.R2_ACCOUNT_ID?.trim();
  const endpoint =
    process.env.R2_ENDPOINT?.trim() ||
    (accountId
      ? `https://${accountId}.r2.cloudflarestorage.com`
      : undefined);

  const accessKeyId = process.env.R2_ACCESS_KEY_ID?.trim();
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY?.trim();
  const bucket = process.env.R2_BUCKET?.trim();

  const missing = [
    !endpoint && "R2_ACCOUNT_ID (o R2_ENDPOINT)",
    !accessKeyId && "R2_ACCESS_KEY_ID",
    !secretAccessKey && "R2_SECRET_ACCESS_KEY",
    !bucket && "R2_BUCKET",
  ].filter(Boolean);

  if (missing.length > 0) {
    throw new Error(
      `Falta configuración de almacenamiento R2: ${missing.join(", ")}.`,
    );
  }

  return {
    endpoint: endpoint!,
    accessKeyId: accessKeyId!,
    secretAccessKey: secretAccessKey!,
    bucket: bucket!,
    region: process.env.R2_REGION?.trim() || "auto",
    forcePathStyle: readBoolean(process.env.R2_FORCE_PATH_STYLE, false),
  };
}

function isMissingObject(error: unknown) {
  if (!error || typeof error !== "object") return false;

  const candidate = error as {
    name?: string;
    Code?: string;
    $metadata?: { httpStatusCode?: number };
  };

  return (
    candidate.$metadata?.httpStatusCode === 404 ||
    candidate.name === "NotFound" ||
    candidate.name === "NoSuchKey" ||
    candidate.Code === "NoSuchKey"
  );
}

/**
 * Adaptador de producción: Cloudflare R2 mediante la API compatible con S3.
 *
 * Se activa con `STORAGE_DRIVER="r2"`. Las credenciales y el bucket se leen de
 * variables de entorno para que el mismo código sirva en R2, MinIO o cualquier
 * almacenamiento S3 compatible.
 */
export class R2StorageAdapter implements StorageAdapter {
  readonly driver = "r2" as const;
  private readonly client: S3Client;
  private readonly bucket: string;

  constructor(config: R2Config = readConfig()) {
    this.bucket = config.bucket;
    this.client = new S3Client({
      region: config.region,
      endpoint: config.endpoint,
      forcePathStyle: config.forcePathStyle,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
    });
  }

  async put({ key, body, contentType }: PutObjectInput): Promise<void> {
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: body,
        ContentType: contentType,
        ContentLength: body.byteLength,
      }),
    );
  }

  async get(key: string): Promise<Uint8Array> {
    const response = await this.client.send(
      new GetObjectCommand({
        Bucket: this.bucket,
        Key: key,
      }),
    );

    const body = response.Body as
      | { transformToByteArray(): Promise<Uint8Array> }
      | undefined;

    if (!body) {
      throw new Error("El objeto solicitado no tiene contenido.");
    }

    return body.transformToByteArray();
  }

  async delete(key: string): Promise<void> {
    await this.client.send(
      new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: key,
      }),
    );
  }

  async exists(key: string): Promise<boolean> {
    try {
      await this.client.send(
        new HeadObjectCommand({
          Bucket: this.bucket,
          Key: key,
        }),
      );
      return true;
    } catch (error) {
      if (isMissingObject(error)) return false;
      throw error;
    }
  }
}
