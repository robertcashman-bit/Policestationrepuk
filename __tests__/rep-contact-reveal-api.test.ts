import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockGetRepBySlug = vi.fn();

vi.mock('@/lib/data', () => ({
  getRepBySlug: (...args: unknown[]) => mockGetRepBySlug(...args),
  stripPrivateFields: (rep: Record<string, unknown>) => ({
    ...rep,
    postcode: '',
    dsccPin: '',
    address: '',
  }),
}));

vi.mock('@/lib/contact-guards', () => ({
  getClientIp: () => '203.0.113.9',
  rateLimitOk: async () => ({ ok: true }),
}));

vi.mock('@/lib/operator-public-phones', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/operator-public-phones')>();
  return {
    ...actual,
    // Keep directory phone passthrough for this route unit test.
    publicDirectoryPhone: (phone: string | undefined) => phone || '',
  };
});

describe('GET /api/rep/[slug]/contact', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetRepBySlug.mockResolvedValue({
      id: '1',
      slug: 'jane-rep',
      name: 'Jane Rep',
      email: 'jane.rep@example.com',
      phone: '07123 456789',
      whatsappLink: 'https://wa.me/447123456789',
      address: '1 Example Street',
      postcode: 'AA1 1AA',
      county: 'Kent',
      stations: [],
      availability: 'Any',
      accreditation: 'DUTY SOLICITOR',
      notes: '',
    });
  });

  it('returns contact fields for a listed rep', async () => {
    const { GET } = await import('@/app/api/rep/[slug]/contact/route');
    const res = await GET(new Request('http://localhost/api/rep/jane-rep/contact'), {
      params: Promise.resolve({ slug: 'jane-rep' }),
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.email).toBe('jane.rep@example.com');
    expect(body.phone).toBe('07123 456789');
    expect(body.whatsappLink).toContain('wa.me');
    expect(body.address).toBeUndefined();
  });

  it('returns 404 when slug is unknown', async () => {
    mockGetRepBySlug.mockResolvedValue(undefined);
    const { GET } = await import('@/app/api/rep/[slug]/contact/route');
    const res = await GET(new Request('http://localhost/api/rep/missing/contact'), {
      params: Promise.resolve({ slug: 'missing' }),
    });
    expect(res.status).toBe(404);
  });
});
