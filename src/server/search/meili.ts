import { MeiliSearch } from "meilisearch";

const INDEX = "forum_posts";

function getClient() {
  const host = process.env.MEILISEARCH_HOST;
  if (!host) return null;
  return new MeiliSearch({
    host,
    apiKey: process.env.MEILISEARCH_API_KEY,
  });
}

export function meiliEnabled() {
  return Boolean(process.env.MEILISEARCH_HOST);
}

export async function upsertSearchDocument(doc: {
  id: string;
  threadId: string;
  title: string;
  content: string;
  forumSlug?: string;
  authorUsername?: string;
  createdAt: number;
  isDeleted?: boolean;
}) {
  const client = getClient();
  if (!client) return;
  const index = client.index(INDEX);
  if (doc.isDeleted) {
    await index.deleteDocument(doc.id).catch(() => undefined);
    return;
  }
  await index.addDocuments([doc], { primaryKey: "id" }).catch(() => undefined);
}

export async function searchMeili(q: string, limit = 20) {
  const client = getClient();
  if (!client) return null;
  try {
    const index = client.index(INDEX);
    const result = await index.search(q, { limit });
    return result.hits as Array<{
      id: string;
      threadId: string;
      title: string;
      content: string;
    }>;
  } catch {
    return null;
  }
}
