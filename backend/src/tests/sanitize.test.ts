import { describe, it, expect } from 'vitest';
import {
  sanitizeString,
  sanitizeForHTML,
  sanitizeForAttribute,
  isValidWalletAddress
} from '../types/index.js';

describe('sanitizeString - XSS Prevention', () => {
  describe('Basic tag removal', () => {
    it('should strip script tags but preserve text content', () => {
      expect(sanitizeString('<script>alert("xss")</script>')).toBe('alert("xss")');
    });

    it('should remove img tags with onerror', () => {
      expect(sanitizeString('<img src=x onerror=alert(1)>')).toBe('');
    });

    it('should strip iframe tags', () => {
      expect(sanitizeString('<iframe src="javascript:alert(1)"></iframe>')).toBe('');
    });

    it('should remove object tags', () => {
      expect(sanitizeString('<object data="javascript:alert(1)"></object>')).toBe('');
    });

    it('should remove embed tags', () => {
      expect(sanitizeString('<embed src="javascript:alert(1)">')).toBe('');
    });

    it('should remove link tags', () => {
      expect(sanitizeString('<link rel="import" href="evil.com">')).toBe('');
    });

    it('should strip style tags but preserve text', () => {
      expect(sanitizeString('<style>@import"javascript:alert(1)"</style>')).toBe('@import"javascript:alert(1)"');
    });
  });

  describe('Event handler blocking', () => {
    it('should block onerror handler in img tags', () => {
      expect(sanitizeString('<img src=x onerror=alert(1)>')).toBe('');
    });

    it('should block onload handler', () => {
      expect(sanitizeString('<body onload=alert(1)>test</body>')).toBe('test');
    });

    it('should block onclick handler', () => {
      expect(sanitizeString('<div onclick="alert(1)">click</div>')).toBe('click');
    });

    it('should block onmouseover handler', () => {
      expect(sanitizeString('<img src=x onmouseover=alert(1)>')).toBe('');
    });

    it('should block onfocus handler', () => {
      expect(sanitizeString('<input onfocus=alert(1) autofocus>')).toBe('');
    });

    it('should block onpointerdown handler - removes whole SVG', () => {
      expect(sanitizeString('<svg onpointerdown=alert(1)>test</svg>')).toBe('');
    });

    it('should block oncompositionend handler', () => {
      expect(sanitizeString('<input oncompositionend=alert(1)>')).toBe('');
    });

    it('should block onfocusin handler', () => {
      expect(sanitizeString('<div onfocusin=alert(1)>test</div>')).toBe('test');
    });
  });

  describe('Protocol blocking', () => {
    it('should block javascript: protocol at start', () => {
      expect(sanitizeString('javascript:alert(1)')).toBe('');
    });

    it('should block data: protocol', () => {
      expect(sanitizeString('data:text/html,<script>alert(1)</script>')).toBe('');
    });

    it('should block vbscript: protocol', () => {
      expect(sanitizeString('vbscript:msgbox("xss")')).toBe('');
    });

    it('should block vbs: protocol', () => {
      expect(sanitizeString('vbs:msgbox("xss")')).toBe('');
    });

    it('should block javascript in href attribute', () => {
      expect(sanitizeString('<a href="javascript:alert(1)">click</a>')).toBe('click');
    });

    it('should block javascript in src attribute', () => {
      expect(sanitizeString('<img src="javascript:alert(1)">')).toBe('');
    });

    it('should block javascript in action attribute', () => {
      expect(sanitizeString('<form action="javascript:alert(1)">')).toBe('');
    });
  });

  describe('SVG and MathML blocking', () => {
    it('should block svg with script inside - removes whole SVG', () => {
      expect(sanitizeString('<svg><script>alert(1)</script></svg>')).toBe('');
    });

    it('should block svg with onerror', () => {
      expect(sanitizeString('<svg><img onerror=alert(1)></svg>')).toBe('');
    });

    it('should block svg with use', () => {
      expect(sanitizeString('<svg><use href="evil.com"></svg>')).toBe('');
    });

    it('should block svg with foreignObject', () => {
      expect(sanitizeString('<svg><foreignObject><img src=x onerror=alert(1)></foreignObject></svg>')).toBe('');
    });

    it('should block math with event handlers - removes whole element', () => {
      expect(sanitizeString('<math><mtext onload=alert(1)>test</mtext></math>')).toBe('');
    });

    it('should block self-closing svg', () => {
      expect(sanitizeString('<svg onload=alert(1)/>')).toBe('');
    });

    it('should block self-closing math', () => {
      expect(sanitizeString('<math onload=alert(1)/>')).toBe('');
    });
  });

  describe('Comment and CDATA blocking', () => {
    it('should block HTML comments', () => {
      expect(sanitizeString('<!-- comment --><script>alert(1)</script>')).toBe('alert(1)');
    });

    it('should block CDATA sections', () => {
      expect(sanitizeString('<![CDATA[<script>alert(1)</script>]]>')).toBe('alert(1)]]>');
    });

    it('should block XML declarations', () => {
      expect(sanitizeString('<?xml version="1.0"?><script>alert(1)</script>')).toBe('alert(1)');
    });
  });

  describe('Edge cases', () => {
    it('should handle nested tags', () => {
      expect(sanitizeString('<div><span><script>alert(1)</script></span></div>')).toBe('alert(1)');
    });

    it('should handle encoded tags - these are NOT dangerous since they are entity-encoded', () => {
      expect(sanitizeString('&lt;script&gt;alert(1)&lt;/script&gt;')).toBe('&lt;script&gt;alert(1)&lt;/script&gt;');
    });

    it('should handle mixed case event handlers', () => {
      expect(sanitizeString('<img SRC=X ONERROR=alert(1)>')).toBe('');
    });

    it('should handle whitespace around event handlers', () => {
      expect(sanitizeString('<img src=x onerror = alert(1)>')).toBe('');
    });

    it('should handle null/undefined input', () => {
      expect(sanitizeString(null as unknown as string)).toBe('');
      expect(sanitizeString(undefined as unknown as string)).toBe('');
      expect(sanitizeString(123 as unknown as string)).toBe('');
    });

    it('should handle empty string', () => {
      expect(sanitizeString('')).toBe('');
    });

    it('should handle string with only whitespace', () => {
      expect(sanitizeString('   ')).toBe('');
    });

    it('should normalize whitespace', () => {
      expect(sanitizeString('hello     world')).toBe('hello world');
    });
  });

  describe('Length limiting', () => {
    it('should truncate to maxLength', () => {
      const longString = 'a'.repeat(2000);
      expect(sanitizeString(longString, 100).length).toBe(100);
    });

    it('should not truncate if under maxLength', () => {
      expect(sanitizeString('hello world', 100)).toBe('hello world');
    });
  });

  describe('Real-world XSS payloads', () => {
    it('should strip script tag but preserve text', () => {
      expect(sanitizeString('<script>alert("XSS")</script>')).toBe('alert("XSS")');
    });

    it('should block img onerror with encoded char', () => {
      expect(sanitizeString('<img src=x onerror=&#97;lert(1)>')).toBe('');
    });

    it('should strip body onload but preserve text', () => {
      expect(sanitizeString('<body onload=alert(1)>content</body>')).toBe('content');
    });

    it('should strip input with autofocus but preserve text', () => {
      expect(sanitizeString('<input onfocus=alert(1) autofocus>value')).toBe('value');
    });

    it('should strip meta tag but preserve text', () => {
      expect(sanitizeString('<meta http-equiv="refresh" content="0;url=javascript:alert(1)">test')).toBe('test');
    });

    it('should strip svg animate - entire SVG removed', () => {
      expect(sanitizeString('<svg><animate onbegin=alert(1)>test</animate></svg>')).toBe('');
    });

    it('should strip div with inline style expression', () => {
      expect(sanitizeString('<div style="width:expression(alert(1))">test</div>')).toBe('test');
    });

    it('should block object data with base64', () => {
      expect(sanitizeString('<object data="data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==">')).toBe('');
    });

    it('should strip svg with use element - entire SVG removed', () => {
      expect(sanitizeString('<svg><use xlink:href="evil.com#x"></use>content</svg>')).toBe('');
    });
  });
});

describe('sanitizeForHTML - Output Encoding', () => {
  it('should encode ampersands', () => {
    expect(sanitizeForHTML('foo & bar')).toBe('foo &amp; bar');
  });

  it('should encode less than', () => {
    expect(sanitizeForHTML('foo < bar')).toBe('foo &lt; bar');
  });

  it('should encode greater than', () => {
    expect(sanitizeForHTML('foo > bar')).toBe('foo &gt; bar');
  });

  it('should encode double quotes', () => {
    expect(sanitizeForHTML('foo "bar"')).toBe('foo &quot;bar&quot;');
  });

  it('should encode single quotes', () => {
    expect(sanitizeForHTML("foo 'bar'")).toBe('foo &#x27;bar&#x27;');
  });

  it('should remove script tags but encode content', () => {
    const result = sanitizeForHTML('<b>bold</b> & <i>italic</i>');
    expect(result).not.toContain('<');
    expect(result).not.toContain('>');
    expect(result).toContain('&amp;');
  });

  it('should block dangerous content (strip tags first)', () => {
    expect(sanitizeForHTML('<script>alert(1)</script>')).toBe('alert(1)');
  });

  it('should preserve text content after tag removal', () => {
    expect(sanitizeForHTML('Hello <b>World</b>')).toBe('Hello World');
  });

  it('should encode entity-encoded attacks as literal text', () => {
    expect(sanitizeForHTML('&lt;script&gt;alert(1)&lt;/script&gt;')).toBe('&amp;lt;script&amp;gt;alert(1)&amp;lt;/script&amp;gt;');
  });
});

describe('sanitizeForAttribute - Attribute Sanitization', () => {
  it('should encode double quotes', () => {
    expect(sanitizeForAttribute('foo"bar')).toBe('foo&quot;bar');
  });

  it('should remove dangerous protocols', () => {
    expect(sanitizeForAttribute('javascript:alert(1)')).toBe('');
  });

  it('should NOT encode ampersands (only quotes)', () => {
    expect(sanitizeForAttribute('foo & bar')).toBe('foo & bar');
  });

  it('should remove script tags but preserve content', () => {
    expect(sanitizeForAttribute('<script>alert(1)</script>')).toBe('alert(1)');
  });

  it('should handle data URLs', () => {
    expect(sanitizeForAttribute('data:text/html,<script>alert(1)</script>')).toBe('');
  });

  it('should preserve normal attribute values', () => {
    expect(sanitizeForAttribute('normal text content')).toBe('normal text content');
  });

  it('should handle empty input', () => {
    expect(sanitizeForAttribute('')).toBe('');
  });

  it('should limit length', () => {
    const longString = 'a'.repeat(1000);
    expect(sanitizeForAttribute(longString).length).toBeLessThanOrEqual(500);
  });
});

describe('sanitizeString vs sanitizeForHTML vs sanitizeForAttribute', () => {
  it('sanitizeString should strip all tags but preserve text', () => {
    const input = '<b>bold</b>';
    expect(sanitizeString(input)).toBe('bold');
  });

  it('sanitizeForHTML should strip tags, encode entities', () => {
    const input = '<b>bold</b>';
    expect(sanitizeForHTML(input)).toBe('bold');
  });

  it('sanitizeForAttribute should encode quotes specially', () => {
    const input = 'foo"bar';
    expect(sanitizeForAttribute(input)).toBe('foo&quot;bar');
  });

  it('sanitizeString should block javascript: URLs at start', () => {
    const input = 'javascript:alert(1)';
    expect(sanitizeString(input)).toBe('');
  });

  it('sanitizeForAttribute should encode quotes but not ampersands', () => {
    const input = 'test & "value"';
    const attrResult = sanitizeForAttribute(input);
    expect(attrResult).toBe('test & &quot;value&quot;');
  });
});

describe('isValidWalletAddress', () => {
  it('should validate correct addresses', () => {
    expect(isValidWalletAddress('0x742d35Cc6634C0532925a3b844Bc9e7595f8bE21')).toBe(true);
  });

  it('should reject invalid addresses', () => {
    expect(isValidWalletAddress('0x742d35Cc6634C0532925a3b844Bc9e7595')).toBe(false);
    expect(isValidWalletAddress('not-an-address')).toBe(false);
    expect(isValidWalletAddress('')).toBe(false);
  });

  it('should handle null/undefined', () => {
    expect(isValidWalletAddress(null)).toBe(false);
    expect(isValidWalletAddress(undefined)).toBe(false);
  });
});