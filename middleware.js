export const config = {
  matcher: '/((?!assets/|css/|js/|favicon\\.ico|sitemap\\.xml|robots\\.txt|llms\\.txt|content\\.md|404\\.md|site\\.webmanifest).*)',
};

const KNOWN_PATHS = new Set([
  '/', '/index.html',
  '/tienda', '/tienda.html',
  '/producto-argentina-titular', '/producto-argentina-titular.html',
  '/producto-francia-alternativa', '/producto-francia-alternativa.html',
  '/producto-manchester-united', '/producto-manchester-united.html',
]);

export default async function middleware(request) {
  const url = new URL(request.url);
  const accept = request.headers.get('accept') || '';
  const wantsMarkdown = accept.includes('text/markdown');

  if (!wantsMarkdown) return; // fall through to the normal HTML response

  if (url.pathname === '/' || url.pathname === '/index.html') {
    const mdUrl = new URL('/content.md', request.url);
    const mdResponse = await fetch(mdUrl);
    const body = await mdResponse.text();
    return new Response(body, {
      status: 200,
      headers: {
        'content-type': 'text/markdown; charset=utf-8',
        'vary': 'Accept, Accept-Encoding',
      },
    });
  }

  if (!KNOWN_PATHS.has(url.pathname)) {
    const mdUrl = new URL('/404.md', request.url);
    const mdResponse = await fetch(mdUrl);
    const body = await mdResponse.text();
    return new Response(body, {
      status: 404,
      headers: {
        'content-type': 'text/markdown; charset=utf-8',
        'vary': 'Accept, Accept-Encoding',
      },
    });
  }

  // Known page without a dedicated markdown variant yet: fall through to HTML.
}
