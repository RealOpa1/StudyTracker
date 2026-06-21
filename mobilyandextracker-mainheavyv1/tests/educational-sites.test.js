require('../lib/educational-sites.js');
const { DEFAULT_SITES, isEducational } = globalThis.__EDU;

describe('DEFAULT_SITES', () => {
  test('содержит 12 образовательных сайтов', () => {
    expect(DEFAULT_SITES.length).toBe(12);
  });

  test('каждая запись имеет domain и url_pattern', () => {
    DEFAULT_SITES.forEach(site => {
      expect(site).toHaveProperty('domain');
      expect(site).toHaveProperty('url_pattern');
    });
  });

  test('содержит stackoverflow.com', () => {
    expect(DEFAULT_SITES.some(s => s.domain === 'stackoverflow.com')).toBe(true);
  });
});

describe('isEducational', () => {
  test('возвращает true для stackoverflow.com', () => {
    expect(isEducational('https://stackoverflow.com/questions/1', DEFAULT_SITES)).toBe(true);
  });

  test('возвращает true для github.com с www', () => {
    expect(isEducational('https://www.github.com/user/repo', DEFAULT_SITES)).toBe(true);
  });

  test('возвращает true для wikipedia.org', () => {
    expect(isEducational('https://en.wikipedia.org/wiki/Test', DEFAULT_SITES)).toBe(true);
  });

  test('возвращает false для example.com', () => {
    expect(isEducational('https://example.com', DEFAULT_SITES)).toBe(false);
  });

  test('возвращает false для пустого URL', () => {
    expect(isEducational('', DEFAULT_SITES)).toBe(false);
  });

  test('возвращает false для null', () => {
    expect(isEducational(null, DEFAULT_SITES)).toBe(false);
  });

  test('возвращает false при пустом списке сайтов', () => {
    expect(isEducational('https://stackoverflow.com', [])).toBe(false);
  });

  test('обрабатывает некорректный URL без ошибки', () => {
    expect(isEducational('not-a-url', DEFAULT_SITES)).toBe(false);
  });

  test('обрабатывает поддомены stepik.org', () => {
    expect(isEducational('https://informatics.msk.ru', DEFAULT_SITES)).toBe(false);
  });
});
