export interface PutObjectInput {
  key: string;
  body: Uint8Array;
  contentType: string;
}

export interface StorageAdapter {
  readonly driver: "local" | "r2";
  put(input: PutObjectInput): Promise<void>;
  get(key: string): Promise<Uint8Array>;
  delete(key: string): Promise<void>;
  exists(key: string): Promise<boolean>;
}
