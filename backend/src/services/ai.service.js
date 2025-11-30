const config = require('../config/env');

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

const createChatCompletion = async (messages, systemPrompt) => {
  try {
    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.groqApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: config.groqModel,
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages,
        ],
        temperature: 0.7,
        max_tokens: 1024,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'AI API request failed');
    }

    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error('AI Service Error:', error);
    throw error;
  }
};

const buildBookSystemPrompt = (book, userContext) => {
  return `You are a thoughtful and engaging book discussion partner. 
You're helping a reader explore "${book.title}" by ${book.author}.

Book details:
- Title: ${book.title}
- Author: ${book.author}
- Genre: ${book.genre || 'Unknown'}
${book.description ? `- Synopsis: ${book.description}` : ''}

Reader's context:
- Current progress: Page ${userContext.currentPage || 0} of ${book.pageCount || 'unknown'}
- Status: ${userContext.status}
${userContext.rating ? `- Rating: ${userContext.rating}/5 stars` : ''}
${userContext.review ? `- Reader's thoughts: ${userContext.review}` : ''}

Your role:
- Ask thought-provoking questions about themes, characters, and ideas
- Encourage deeper analysis and critical thinking
- Connect concepts to broader ideas or other works
- Be curious about the reader's interpretations
- Avoid spoilers unless the reader has finished the book
- Keep responses concise (2-4 sentences) and conversational

Remember: You're a discussion partner, not a lecturer. Engage with the reader's ideas and help them discover insights on their own.`;
};

module.exports = { createChatCompletion, buildBookSystemPrompt };