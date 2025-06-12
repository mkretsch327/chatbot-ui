// Shim for client-side DB imports: no-op stubs for any DB function
module.exports = new Proxy({}, {
  get() { return () => { throw new Error('Cannot call DB from client') } }
});