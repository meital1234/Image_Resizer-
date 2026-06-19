import mongoose from 'mongoose'

const MONGODB_URI = process.env.MONGODB_URI

if (!MONGODB_URI) {
  throw new Error(
    'MONGODB_URI is not defined. Add it to .env.local'
  )
}

// In development, Next.js hot-reloads the server on every file change.
// Without this cache, each reload would open a new DB connection and exhaust the pool.
const globalWithMongoose = global as typeof globalThis & {
  mongoose: {
    conn: typeof mongoose | null
    promise: Promise<typeof mongoose> | null
  }
}

if (!globalWithMongoose.mongoose) {
  globalWithMongoose.mongoose = { conn: null, promise: null }
}

const cached = globalWithMongoose.mongoose

export async function connectDB(): Promise<typeof mongoose> {
  if (cached.conn) {
    return cached.conn
  }

  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI!)
  }

  cached.conn = await cached.promise
  return cached.conn
}
