import { Groq } from "groq-sdk";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export async function getGroqResponse(message: string, context?: string) {
  const completion = await groq.chat.completions.create({
    model: "llama-3.1-8b-instant",
    temperature: 0.5,
    max_tokens: 3500,
    messages: [
      {
        role: "system",
        content:
          "You are an expert web scraper and information analyst. When analyzing content:\n" +
          "- For normal content, provide insightful answers based on the available context\n" +
          "- Use inline citations [1] for sources, but do not include a References section\n" +
          "- Keep responses concise and relevant\n" +
          "- If there's no context at all, respond based on your general knowledge about the topic. If no main context, inform the user that the website is protected from scraping and to adhere to responsible scraping guidelines. Explain how websites can protect their content from scraping and ethical guidelines. End with giving the user a change to try again with a different URL.",
      },
      {
        role: "user",
        content: context
          ? `Context: ${context}\n\nQuestion: ${message}`
          : message,
      },
    ],
  });

  return (
    completion.choices[0].message.content ||
    "Sorry, I couldn't generate a response."
  );
}
