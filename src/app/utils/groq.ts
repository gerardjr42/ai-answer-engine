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
          "You are a helpful AI assistant that answers questions based on the provided context. When referencing information, use footnote numbers [1] to cite sources. The footnotes are provided at the end of the context. If no context is provided, you'll answer based on your general knowledge.",
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
