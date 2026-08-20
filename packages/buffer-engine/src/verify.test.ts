import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import type { BufferEngineAdapter, BufferKV, SchedulablePost } from './types';
import { verifySiteBufferSchedule } from './verify';

function makeKV(): BufferKV {
  const store = new Map<string, unknown>();
  return {
    get: async <T>(key: string) => (store.has(key) ? (store.get(key) as T) : null),
    set: async (key, value) => {
      store.set(key, value);
      return 'OK';
    },
    del: async (key) => {
      store.delete(key);
      return 1;
    },
  };
}

function makeAdapter(kv: BufferKV, posts: SchedulablePost[] = []): BufferEngineAdapter {
  return {
    siteId: 'testsite',
    siteUrl: 'https://testsite.com',
    kv,
    getSchedulablePosts: () => posts,
  };
}

function makePosts(n: number): SchedulablePost[] {
  return Array.from({ length: n }, (_, i) => ({
    feedId: 'testsite',
    slug: `post-${i}`,
    title: `Post ${i}`,
    excerpt: `Excerpt ${i}`,
    url: `https://testsite.com/blog/post-${i}`,
    imageUrl: `https://testsite.com/images/post-${i}.jpg`,
    imageAlt: `Post ${i}`,
  }));
}

type ListedPost = {
  id: string;
  text: string;
  dueAt: string;
  status: 'scheduled' | 'sent';
  channelId: string;
};

let listedPosts: ListedPost[];
let listPostsVariables: Array<Record<string, unknown>>;
let createCallCount: number;

function installFetchMock(options?: { jpegOk?: boolean }) {
  listPostsVariables = [];
  createCallCount = 0;
  const jpegOk = options?.jpegOk !== false;
  const mock = (async (input: string | URL | Request, init?: RequestInit) => {
    const url = typeof input === 'string' ? input : input.toString();
    const method = (init?.method ?? 'GET').toUpperCase();

    if (url.startsWith('https://api.buffer.com')) {
      const body = JSON.parse((init?.body as string) ?? '{}');
      if (/ListPosts/.test(body.query)) {
        listPostsVariables.push(body.variables);
        const statuses: string[] = body.variables?.input?.filter?.status ?? [];
        const edges = listedPosts
          .filter((p) => statuses.length === 0 || statuses.includes(p.status))
          .map((p) => ({
            node: {
              id: p.id,
              text: p.text,
              dueAt: p.dueAt,
              status: p.status,
              channelId: p.channelId,
              channelService: 'twitter',
            },
            cursor: p.id,
          }));
        return Response.json({
          data: { posts: { edges, pageInfo: { hasNextPage: false, endCursor: null } } },
        });
      }
      if (/createPost/.test(body.query)) {
        createCallCount += 1;
        const v = body.variables.input;
        const id = `created-${createCallCount}`;
        listedPosts.push({
          id,
          text: `${v.text ?? 'hello'} https://testsite.com/blog/x`,
          dueAt: v.dueAt,
          status: 'scheduled',
          channelId: v.channelId,
        });
        return Response.json({
          data: {
            createPost: {
              __typename: 'PostActionSuccess',
              post: {
                id,
                dueAt: v.dueAt,
                channelId: v.channelId,
                channelService: 'twitter',
              },
            },
          },
        });
      }
      return Response.json({
        data: { posts: { edges: [], pageInfo: { hasNextPage: false, endCursor: null } } },
      });
    }

    if (jpegOk) {
      const headers = new Headers({ 'content-type': 'image/jpeg', 'content-length': '100' });
      if (method === 'HEAD') return new Response(null, { status: 200, headers });
      return new Response(Buffer.alloc(100), { status: 200, headers });
    }
    return new Response(null, { status: 404 });
  }) as unknown as typeof fetch;
  vi.stubGlobal('fetch', mock);
}

const BASE_ENV = { ...process.env };

beforeEach(() => {
  listedPosts = [];
  process.env = {
    ...BASE_ENV,
    BUFFER_API_KEY: 'test-key',
    BUFFER_ORGANIZATION_ID: 'a'.repeat(24),
    BUFFER_CHANNEL_TWITTER_ID: 'b'.repeat(24),
    BUFFER_SCHEDULER_POSTS_PER_FEED: '5',
  };
  installFetchMock();
});

afterEach(() => {
  process.env = { ...BASE_ENV };
  vi.unstubAllGlobals();
});

function dueAtWindow() {
  const vars = listPostsVariables[0] as { input: { filter: { dueAt: { start: string; end: string } } } };
  return vars.input.filter.dueAt;
}

describe('verifySiteBufferSchedule day-window timezone offset', () => {
  it('uses a BST (+01:00) offset for a summer date', async () => {
    const adapter = makeAdapter(makeKV());
    await verifySiteBufferSchedule(adapter, {
      now: new Date('2026-06-28T05:00:00Z'),
      gapFill: false,
    });
    const { start, end } = dueAtWindow();
    expect(start).toBe('2026-06-28T00:00:00+01:00');
    expect(end).toBe('2026-06-29T00:00:00+01:00');
  });

  it('uses a GMT (+00:00) offset for a winter date', async () => {
    const adapter = makeAdapter(makeKV());
    await verifySiteBufferSchedule(adapter, {
      now: new Date('2026-01-15T05:00:00Z'),
      gapFill: false,
    });
    const { start, end } = dueAtWindow();
    expect(start).toBe('2026-01-15T00:00:00+00:00');
    expect(end).toBe('2026-01-16T00:00:00+00:00');
  });
});

describe('verifySiteBufferSchedule quota truth', () => {
  it('counts sent posts toward today quota (not only scheduled)', async () => {
    listedPosts = Array.from({ length: 5 }, (_, i) => ({
      id: `sent-${i}`,
      text: `Update https://testsite.com/blog/p-${i}`,
      dueAt: `2026-06-28T0${8 + i}:00:00+01:00`,
      status: 'sent' as const,
      channelId: 'b'.repeat(24),
    }));

    const result = await verifySiteBufferSchedule(makeAdapter(makeKV()), {
      now: new Date('2026-06-28T12:00:00Z'),
      gapFill: false,
    });

    expect(result.scheduledCount).toBe(5);
    expect(result.ok).toBe(true);
    expect(result.gapFilled).toBe(0);
  });

  it('does not mark ok when idempotent gap-fill returns posts but Buffer count stays short', async () => {
    listedPosts = Array.from({ length: 4 }, (_, i) => ({
      id: `exist-${i}`,
      text: `Update https://testsite.com/blog/p-${i}`,
      dueAt: `2026-06-28T1${i}:00:00+01:00`,
      status: 'scheduled' as const,
      channelId: 'b'.repeat(24),
    }));

    // Scheduler "creates" nothing new in Buffer — simulate by making createPost fail
    // after ListPosts already saw 4, and ensure listedPosts stays at 4.
    const mock = (async (input: string | URL | Request, init?: RequestInit) => {
      const url = typeof input === 'string' ? input : input.toString();
      if (url.startsWith('https://api.buffer.com')) {
        const body = JSON.parse((init?.body as string) ?? '{}');
        if (/ListPosts/.test(body.query)) {
          const statuses: string[] = body.variables?.input?.filter?.status ?? [];
          const edges = listedPosts
            .filter((p) => statuses.length === 0 || statuses.includes(p.status))
            .map((p) => ({
              node: {
                id: p.id,
                text: p.text,
                dueAt: p.dueAt,
                status: p.status,
                channelId: p.channelId,
                channelService: 'twitter',
              },
              cursor: p.id,
            }));
          return Response.json({
            data: { posts: { edges, pageInfo: { hasNextPage: false, endCursor: null } } },
          });
        }
        if (/createPost/.test(body.query)) {
          // Pretend create succeeded in the API response but never appears in ListPosts
          // (historical false-success: verify trusted posts.length).
          return Response.json({
            data: {
              createPost: {
                __typename: 'PostActionSuccess',
                post: {
                  id: 'ghost',
                  dueAt: body.variables.input.dueAt,
                  channelId: body.variables.input.channelId,
                  channelService: 'twitter',
                },
              },
            },
          });
        }
      }
      const headers = new Headers({ 'content-type': 'image/jpeg', 'content-length': '100' });
      if ((init?.method ?? 'GET').toUpperCase() === 'HEAD') {
        return new Response(null, { status: 200, headers });
      }
      return new Response(Buffer.alloc(100), { status: 200, headers });
    }) as unknown as typeof fetch;
    vi.stubGlobal('fetch', mock);

    const result = await verifySiteBufferSchedule(makeAdapter(makeKV(), makePosts(20)), {
      now: new Date('2026-06-28T05:00:00Z'),
      gapFill: true,
    });

    expect(result.scheduledCount).toBe(4);
    expect(result.requiredCount).toBe(5);
    expect(result.ok).toBe(false);
    expect(result.gapFilled).toBe(0);
    expect(result.issues.some((i) => /idempotent|still at 4\/5/i.test(i))).toBe(true);
  });

  it('gap-fills the missing delta and re-counts Buffer as source of truth', async () => {
    listedPosts = Array.from({ length: 4 }, (_, i) => ({
      id: `exist-${i}`,
      text: `Update https://testsite.com/blog/p-${i}`,
      dueAt: `2026-06-28T1${i}:00:00+01:00`,
      status: 'scheduled' as const,
      channelId: 'b'.repeat(24),
    }));

    const result = await verifySiteBufferSchedule(makeAdapter(makeKV(), makePosts(20)), {
      now: new Date('2026-06-28T05:00:00Z'),
      gapFill: true,
    });

    expect(result.ok).toBe(true);
    expect(result.scheduledCount).toBe(5);
    expect(result.gapFilled).toBe(1);
    expect(createCallCount).toBe(1);
  });
});
