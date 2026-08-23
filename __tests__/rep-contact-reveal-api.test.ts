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

vi.mock('@/lib/operator-public-phones', () => ({
  publicDirectoryPhone: (phone: string | undefined) => phone || '',
}));

describe('GET /api/rep/[slug]/contact', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetRepBySlug.mockResolvedValue({
      id: '1',
      slug: 'robert-cashman',
      name: 'Robert Cashman',
      email: 'Robertdavidcashman@gmail.com',
      phone: '07535 494446',
      whatsappLink: 'https://wa.me/447535494446',
      address: 'Greenacre London Road West Kingsdown',
      postcode: 'TN15 6ER',
      county: 'Kent',
      stations: [],
      availability: 'Any',
      accreditation: 'DUTY SOLICITOR',
      notes: '',
    });
  });

  it('returns contact fields for a listed rep', async () => {
    const { GET } = await import('@/app/api/rep/[slug]/contact/route');
    const res = await GET(new Request('http://localhost/api/rep/robert-cashman/contact'), {
      params: Promise.resolve({ slug: 'robert-cashman' }),
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.email).toBe('Robertdavidcashman@gmail.com');
    expect(body.phone).toBe('07535 494446');
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
