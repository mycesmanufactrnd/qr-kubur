import jwt from 'jsonwebtoken'

const secret = 'f5b93d74e7d45a9ab462558ca41f50647deedf6e400a8511d5dbac3499e780a3'

const anon = jwt.sign(
  { role: 'anon', iss: 'supabase' },
  secret,
  { expiresIn: '10y' }
)

const service = jwt.sign(
  { role: 'service_role', iss: 'supabase' },
  secret,
  { expiresIn: '10y' }
)

console.log('ANON KEY:\n', anon)
console.log('\nSERVICE ROLE KEY:\n', service)
