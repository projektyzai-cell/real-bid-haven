// One request per displayed article, including React effect replays.
export function createBlogViewRecorder(send: (slug: string) => Promise<number>) {
  let current: { slug: string; request: Promise<number> } | undefined;
  return (slug: string) => {
    if (current?.slug === slug) return current.request;
    const request = send(slug);
    current = { slug, request };
    return request;
  };
}