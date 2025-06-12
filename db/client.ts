// Dynamic require to prevent bundling pg into client-side bundles
let Pool
if (typeof window === 'undefined') {
  // Server-side: use pg
  const _require: any = eval('require')
  ;({ Pool } = _require('pg'))
} else {
  // Client-side stub: no-op Pool
  Pool = class {
    constructor() {}
    query() {
      return Promise.resolve({ rows: [] })
    }
  }
}
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL
})
