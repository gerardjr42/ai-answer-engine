# AetherScribe

AetherScribe is an intelligent web scraping and content analysis platform that combines AI capabilities with advanced web scraping techniques. It allows users to extract, analyze, and interpret web content with the power of AI.

## Features

- 🤖 AI-Powered Analysis: Leverages Meta's Llama model through Groq's high-performance compute infrastructure for intelligent content interpretation
- 🌐 Smart Web Scraping: Advanced scraping capabilities with Puppeteer and Cheerio
- 🚀 Real-time Processing: Instant analysis and insights from web content
- 🔒 Rate Limiting: Built-in protection with Redis-based rate limiting
- 🎨 Modern UI: Sleek interface with Tailwind CSS and Framer Motion animations
- 🔐 Authentication: Secure user management with Clerk

## Tech Stack

- **Frontend**: Next.js, React, TailwindCSS, Framer Motion
- **Backend**: Next.js API Routes
- **AI/ML**: Groq SDK (Llama 3.1)
- **Scraping**: Puppeteer, Cheerio
- **Authentication**: Clerk
- **Rate Limiting**: Upstash Redis
- **Styling**: TailwindCSS, shadcn/ui
- **Code Highlighting**: Utilized rehype for syntax highlighting in code blocks, enhancing readability and user experience.

## Project Structure

- `/src/app` - Main application pages and API routes
- `/src/components` - Reusable React components
- `/src/utils` - Utility functions for scraping and AI processing
- `/src/hooks` - Custom React hooks
- `/src/lib` - Shared utilities and configurations

## Key Components

- **Web Scraping Engine**: Intelligent content extraction with fallback mechanisms
- **AI Processing**: Context-aware analysis using Groq's Llama model
- **Rate Limiting**: Request throttling for API protection
- **Responsive UI**: Mobile-friendly interface with dynamic sidebar

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Acknowledgments

- [Clerk](https://clerk.dev/) for authentication
- [Groq](https://groq.com/) for AI capabilities
- [Upstash](https://upstash.com/) for Redis services
- [shadcn/ui](https://ui.shadcn.com/) for UI components
- [Next.js](https://nextjs.org/) for the framework
- [rehype](https://rehype-pretty.pages.dev/) for HTML processing
- [DOMPurify](https://github.com/cure53/DOMPurify) for sanitizing HTML
- [Cheerio](https://cheerio.js.org/) for server-side jQuery-like manipulation
- [Puppeteer](https://pptr.dev/) for headless browser automation
- [marked](https://github.com/markedjs/marked) for Markdown parsing
- [Framer Motion](https://motion.dev/) for animations
- [Lucide React](https://lucide.dev/) for iconography
- [Turndown](https://github.com/mixmark-io/turndown) for converting HTML to Markdown
