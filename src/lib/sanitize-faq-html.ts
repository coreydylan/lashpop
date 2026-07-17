import 'server-only'
import sanitizeHtml from 'sanitize-html'

const ALLOWED_TAGS = ['p', 'br', 'strong', 'b', 'em', 'i', 'ul', 'ol', 'li', 'a']

/** Keep the FAQ editor's supported formatting while dropping executable HTML. */
export function sanitizeFaqHtml(value: string): string {
  return sanitizeHtml(value, {
    allowedTags: ALLOWED_TAGS,
    allowedAttributes: {
      a: ['href', 'target', 'rel'],
    },
    allowedSchemes: ['http', 'https', 'mailto', 'tel'],
    allowProtocolRelative: false,
    enforceHtmlBoundary: true,
    transformTags: {
      a: (_tagName, attributes) => {
        const target = attributes.target === '_blank' ? '_blank' : undefined
        return {
          tagName: 'a',
          attribs: {
            ...(attributes.href ? { href: attributes.href } : {}),
            ...(target ? { target } : {}),
            rel: target ? 'noopener noreferrer' : 'nofollow',
          },
        }
      },
    },
  })
}
