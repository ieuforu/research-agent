import { ai, model } from './lib/ai.js'

const response = await ai.chat.completions.create({
  model,
  messages: [
    {
      role: 'user',
      content: '用一句话解释什么是 React Server Components。',
    },
  ],
})

console.log(response.choices[0]?.message.content)
