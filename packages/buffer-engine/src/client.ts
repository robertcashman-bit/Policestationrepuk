import type { BufferChannelService } from './types';
import { buildBufferImageAssets } from './assets';
import { sanitizeGoogleBusinessPostText } from './google-business-text';
import { assertBufferPostImageReady } from './image-url';
import {
  BUFFER_GRAPHQL_MAX_RETRIES,
  isRateLimitMessage,
  noteBufferRateLimit,
  rateLimitBackoffMs,
  sleep,
  withBufferApiSlot,
} from './graphql-throttle';

const BUFFER_API_URL = 'https://api.buffer.com';
const STATUS_LOOKUP_DELAY_MS = 400;

function retryAfterMs(errors: BufferGraphQLError[] | undefined, res?: Response): number | null {
  for (const err of errors ?? []) {
    const retryAfter = (err.extensions as { retryAfter?: number } | undefined)?.retryAfter;
    if (typeof retryAfter === 'number' && retryAfter > 0) return retryAfter * 1000;
  }
  if (res) {
    const headerWait = Number(res.headers.get('retry-after'));
    if (Number.isFinite(headerWait) && headerWait > 0) return headerWait * 1000;
  }
  return null;
}

export interface BufferGraphQLError {
  message: string;
  extensions?: { code?: string };
}

type BufferMutationError = { __typename: string; message: string };

export class BufferApiError extends Error {
  constructor(
    message: string,
    readonly details?: unknown,
  ) {
    super(message);
    this.name = 'BufferApiError';
  }
}

async function bufferGraphqlOnce<T>(
  apiKey: string,
  query: string,
  variables?: Record<string, unknown>,
): Promise<{ data?: T; errors?: BufferGraphQLError[]; status: number; res: Response }> {
  const res = await fetch(BUFFER_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ query, variables }),
  });
  const json = (await res.json()) as { data?: T; errors?: BufferGraphQLError[] };
  return { ...json, status: res.status, res };
}

async function bufferGraphql<T>(
  apiKey: string,
  query: string,
  variables?: Record<string, unknown>,
): Promise<T> {
  let lastError: BufferApiError | null = null;

  for (let attempt = 0; attempt <= BUFFER_GRAPHQL_MAX_RETRIES; attempt++) {
    const { data, errors, status, res } = await withBufferApiSlot(() =>
      bufferGraphqlOnce<T>(apiKey, query, variables),
    );

    if (errors?.length) {
      const message = errors.map((e) => e.message).join('; ');
      const notFoundOnly = errors.every(
        (e) => (e.extensions as { code?: string } | undefined)?.code === 'NOT_FOUND',
      );
      if (notFoundOnly) throw new BufferApiError(message, errors);
      if (isRateLimitMessage(message) && attempt < BUFFER_GRAPHQL_MAX_RETRIES) {
        const waitMs = rateLimitBackoffMs(attempt, retryAfterMs(errors, res));
        noteBufferRateLimit(waitMs);
        await sleep(waitMs);
        continue;
      }
      throw new BufferApiError(message, errors);
    }

    if (!data) {
      lastError = new BufferApiError(`Buffer API returned no data (HTTP ${status})`, { status });
      if (status === 429 && attempt < BUFFER_GRAPHQL_MAX_RETRIES) {
        const waitMs = rateLimitBackoffMs(attempt, retryAfterMs(undefined, res));
        noteBufferRateLimit(waitMs);
        await sleep(waitMs);
        continue;
      }
      throw lastError;
    }

    return data;
  }

  throw lastError ?? new BufferApiError('Buffer API request failed after retries');
}

export interface CreatedBufferPost {
  id: string;
  dueAt: string | null;
  channelId: string;
  channelService: string;
  imageUrl?: string;
}

export interface BufferPostWithMetrics {
  id: string;
  text: string;
  status: string;
  dueAt: string | null;
  sentAt: string | null;
  createdAt: string;
  channelId: string;
  channelService: string;
  clicks?: number;
  impressions?: number;
  reactions?: number;
  comments?: number;
}

type BufferPostMetric = {
  type: string;
  value: number;
};

/** Map Buffer PostMetric[] (type/value) to legacy flat counters used by the bandit. */
export function metricsFromPostMetricArray(metrics?: BufferPostMetric[]): {
  clicks: number;
  impressions: number;
  reactions: number;
  comments: number;
} {
  const out = { clicks: 0, impressions: 0, reactions: 0, comments: 0 };
  for (const metric of metrics ?? []) {
    const value = metric.value ?? 0;
    switch (metric.type) {
      case 'clicks':
      case 'link_clicks':
        out.clicks += value;
        break;
      case 'impressions':
      case 'views':
        out.impressions += value;
        break;
      case 'reactions':
      case 'likes':
        out.reactions += value;
        break;
      case 'comments':
      case 'replies':
        out.comments += value;
        break;
      default:
        break;
    }
  }
  return out;
}

function postMetadataForService(service: BufferChannelService, url: string): Record<string, unknown> | undefined {
  if (service === 'googlebusiness') {
    return {
      google: {
        type: 'whats_new',
        detailsWhatsNew: { button: 'learn_more', link: url },
      },
    };
  }
  if (service === 'facebook') {
    return { facebook: { type: 'post' } };
  }
  return undefined;
}

export async function createScheduledBufferPost(
  apiKey: string,
  input: {
    channelId: string;
    channelService: BufferChannelService;
    text: string;
    dueAt: string;
    url: string;
    imageUrl?: string;
    imageAlt?: string;
    feedId?: string;
    siteUrl: string;
  },
): Promise<CreatedBufferPost> {
  const validatedImageUrl = await assertBufferPostImageReady(input.imageUrl, input.siteUrl, fetch, {
    channelService: input.channelService,
    feedId: input.feedId,
  });

  const metadata = postMetadataForService(input.channelService, input.url);
  const text =
    input.channelService === 'googlebusiness'
      ? sanitizeGoogleBusinessPostText(input.text)
      : input.text;
  const assets = buildBufferImageAssets({
    imageUrl: validatedImageUrl,
    imageAlt: input.imageAlt,
    title: input.text.split('\n')[0] ?? input.text,
  });

  const data = await bufferGraphql<{
    createPost:
      | { __typename: 'PostActionSuccess'; post: CreatedBufferPost }
      | BufferMutationError;
  }>(
    apiKey,
    `mutation CreateScheduledPost($input: CreatePostInput!) {
      createPost(input: $input) {
        __typename
        ... on PostActionSuccess {
          post { id dueAt channelId channelService }
        }
        ... on InvalidInputError { message }
        ... on UnauthorizedError { message }
        ... on UnexpectedError { message }
        ... on LimitReachedError { message }
        ... on NotFoundError { message }
      }
    }`,
    {
      input: {
        channelId: input.channelId,
        schedulingType: 'automatic',
        mode: 'customScheduled',
        dueAt: input.dueAt,
        text,
        assets,
        ...(metadata ? { metadata } : {}),
      },
    },
  );

  const result = data.createPost;
  if (result.__typename !== 'PostActionSuccess' || !('post' in result)) {
    const message = 'message' in result ? result.message : result.__typename;
    throw new BufferApiError(`createPost failed: ${message}`, result);
  }

  return { ...result.post, imageUrl: validatedImageUrl };
}

export async function listPostsInWindow(
  apiKey: string,
  organizationId: string,
  input: {
    status: Array<'scheduled' | 'sent' | 'error' | 'draft' | 'sending' | 'needs_approval'>;
    dueAtStart?: string;
    dueAtEnd?: string;
    createdAtStart?: string;
    channelIds?: string[];
    includeMetrics?: boolean;
  },
): Promise<BufferPostWithMetrics[]> {
  const posts: BufferPostWithMetrics[] = [];
  let after: string | undefined;

  const metricsFragment = input.includeMetrics
    ? `
      metrics {
        type
        value
      }
    `
    : '';

  do {
    const data = await bufferGraphql<{
      posts: {
        edges: Array<{
          node: BufferPostWithMetrics & {
            metrics?: BufferPostMetric[];
          };
        }>;
        pageInfo: { hasNextPage: boolean; endCursor: string | null };
      };
    }>(
      apiKey,
      `query ListPosts($input: PostsInput!, $first: Int!, $after: String) {
        posts(input: $input, first: $first, after: $after) {
          edges {
            node {
              id text status dueAt sentAt createdAt channelId channelService
              ${metricsFragment}
            }
          }
          pageInfo { hasNextPage endCursor }
        }
      }`,
      {
        first: 100,
        after,
        input: {
          organizationId,
          filter: {
            status: input.status,
            ...(input.dueAtStart || input.dueAtEnd
              ? { dueAt: { start: input.dueAtStart, end: input.dueAtEnd } }
              : {}),
            ...(input.createdAtStart ? { createdAt: { start: input.createdAtStart } } : {}),
            ...(input.channelIds?.length ? { channelIds: input.channelIds } : {}),
          },
        },
      },
    );

    for (const edge of data.posts.edges) {
      const node = edge.node;
      const parsed = metricsFromPostMetricArray(node.metrics);
      posts.push({
        ...node,
        clicks: parsed.clicks,
        impressions: parsed.impressions,
        reactions: parsed.reactions,
        comments: parsed.comments,
      });
    }

    after = data.posts.pageInfo.hasNextPage ? (data.posts.pageInfo.endCursor ?? undefined) : undefined;
  } while (after);

  return posts;
}

export async function getBufferPostById(
  apiKey: string,
  postId: string,
): Promise<{ id: string; dueAt: string | null; status: string; channelService: string } | null> {
  try {
    const data = await bufferGraphql<{
      post: { id: string; dueAt: string | null; status: string; channelService: string };
    }>(
      apiKey,
      `query GetPostStatus($input: PostInput!) {
        post(input: $input) { id dueAt status channelService }
      }`,
      { input: { id: postId } },
    );
    return data.post;
  } catch (err) {
    if (err instanceof BufferApiError && /not found/i.test(err.message)) return null;
    throw err;
  }
}

export async function deleteBufferPost(apiKey: string, postId: string): Promise<void> {
  const data = await bufferGraphql<{
    deletePost: { __typename: string; id?: string; message?: string };
  }>(
    apiKey,
    `mutation DeletePost($input: DeletePostInput!) {
      deletePost(input: $input) {
        __typename
        ... on DeletePostSuccess { id }
        ... on VoidMutationError { message }
      }
    }`,
    { input: { id: postId } },
  );

  if (data.deletePost.__typename !== 'DeletePostSuccess') {
    throw new BufferApiError(`deletePost failed: ${data.deletePost.message ?? data.deletePost.__typename}`);
  }
}

export { sleep, STATUS_LOOKUP_DELAY_MS };
