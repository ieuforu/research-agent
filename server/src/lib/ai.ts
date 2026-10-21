import 'dotenv/config'
import OpenAI from 'openai'

const apiKey = process.env.DEEPSEEK_API_KEY

if (!apiKey) {
  throw new Error('DEEPSEEK_API_KEY is not configured')
}

export const ai = new OpenAI({
  apiKey,
  baseURL: 'https://api.deepseek.com',
  // Bound the request so a stuck upstream cannot leave a task "running" for
  // the SDK default of ten minutes. One retry covers transient 5xx.
  timeout: 120_000,
  maxRetries: 1,
})

// `deepseek-chat` / `deepseek-reasoner` are the model ids the DeepSeek API
// accepts; client-side aliases such as `deepseek-flash` would be rejected.
export const model = process.env.DEEPSEEK_MODEL ?? 'deepseek-chat'
