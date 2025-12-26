# Amazon AI Chatbot

React + Node/Express chatbot that fetches real-time Amazon product data using the Rainforest API and displays results as product cards.

## Features
- Chat UI 
- Product search via backend 
- Product cards 
- OpenAI summary for results

## Tech Stack
- React (Vite)
- Node.js + Express
- Rainforest API (Amazon product data)
- OpenAI API

## Local Setup

### 1) Install dependencies
From the project root:
```bash
npm install
npm install --prefix client
npm install --prefix server
```

### 2) Add environment variables
Create `server/.env` to store keys but don't commit.
Need to receive Rainforest API key, but OpenAI is optional.

```env
RAINFOREST_API_KEY=your_rainforest_key
OPENAI_API_KEY=your_openai_key(optional)   
PORT=5174
```

### 3) Run
```bash
npm run dev
```
- Client: `http://localhost:5173`
- Server health: `http://localhost:5174/health`

## API
- `POST /api/chat`
  - body: `{ "message": "wireless headphones under $50", "filters": {}, "conversationId": "..." }`
  - returns: `{ assistantText, products, conversationId }`


