globalThis.__EDU = undefined;
globalThis.browser = {
  storage: { local: { get: jest.fn(), set: jest.fn() } },
  tabs: { query: jest.fn(), onUpdated: { addListener: jest.fn() }, onRemoved: { addListener: jest.fn() } },
  runtime: { sendMessage: jest.fn(), onMessage: { addListener: jest.fn() } },
  alarms: { create: jest.fn(), onAlarm: { addListener: jest.fn() } },
  action: {}
};
