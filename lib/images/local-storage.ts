import fs from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import type { createTestDatabase } from "@/lib/db/test-utils";
import { getProjectForUser } from "@/lib/repositories/projects";
import type { ImageStorageProvider } from "@/lib/images/provider";

type Db = ReturnType<typeof createTestDatabase>;

function safeFileName(fileName: string) {
  return fileName.replace(/[^a-zA-Z0-9._-]/g, "-");
}

export class LocalImageStorageProvider implements ImageStorageProvider {
  constructor(private readonly dataRoot = process.env.DATA_ROOT ?? "/app/data") {}

  async saveProjectImage(input: {
    projectId: string;
    ownerUserId: string;
    fileName: string;
    contentType: string;
    bytes: Buffer;
  }) {
    const fileName = `${randomUUID()}-${safeFileName(input.fileName)}`;
    const relativeKey = `projects/${input.projectId}/images/${fileName}`;
    const realPath = path.join(this.dataRoot, "storage", relativeKey);
    await fs.mkdir(path.dirname(realPath), { recursive: true });
    await fs.writeFile(realPath, input.bytes);

    return {
      storageKey: relativeKey,
      filePath: `/app/data/storage/${relativeKey}`,
      url: `/api/projects/${input.projectId}/images/${encodeURIComponent(fileName)}`,
      contentType: input.contentType,
    };
  }

  async readProjectImage(db: Db, storageKey: string, userId: string) {
    const match = /^projects\/([^/]+)\/images\/([^/]+)$/.exec(storageKey);
    if (!match) throw new Error("image not found");
    const [, projectId] = match;
    if (!projectId || !getProjectForUser(db, projectId, userId)) {
      throw new Error("image not found");
    }
    return fs.readFile(path.join(this.dataRoot, "storage", storageKey));
  }
}
