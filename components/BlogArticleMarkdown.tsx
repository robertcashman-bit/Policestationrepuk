import { marked } from 'marked';

marked.setOptions({ gfm: true, breaks: false });

function stripUnsafe(html: string): string {
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
    .replace(/\son\w+="[^"]*"/gi, '')
    .replace(/\son\w+='[^']*'/gi, '');
}

export function BlogArticleMarkdown({ markdown }: { markdown: string }) {
  const raw = marked.parse(markdown.trim(), { async: false }) as string;
  const clean = stripUnsafe(raw);

  return (
    <div
      className="blog-prose max-w-none space-y-4 text-[var(--muted)] [&_a]:font-medium [&_a]:text-[var(--gold-link)] [&_a]:underline-offset-2 hover:[&_a]:text-[var(--gold)] [&_blockquote]:border-l-4 [&_blockquote]:border-[var(--gold)]/40 [&_blockquote]:pl-4 [&_blockquote]:italic [&_h2]:mt-10 [&_h2]:scroll-mt-24 [&_h2]:border-b-2 [&_h2]:border-[var(--gold-pale)] [&_h2]:pb-2 [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:text-[var(--navy)] [&_h2]:first:mt-0 [&_h3]:mt-8 [&_h3]:text-xl [&_h3]:font-semibold [&_h3]:text-[var(--navy)] [&_h4]:mt-6 [&_h4]:text-lg [&_h4]:font-semibold [&_h4]:text-[var(--navy)] [&_li]:my-1 [&_ol]:list-decimal [&_ol]:pl-6 [&_p]:leading-[1.8] [&_ul]:list-disc [&_ul]:pl-6"
      dangerouslySetInnerHTML={{ __html: clean }}
    />
  );
}
