const express = require('express');
const { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } = require('@google/generative-ai');
const dotenv = require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;
app.use(express.json());
const MODEL_NAME = "gemini-2.0-flash";
const API_KEY = process.env.API_KEY;

// Histórico da conversa
const chatHistory = [
  {
    role: "user",
    parts: [{ text: "Você é *Barrini*, um assistente especializado em comportamento humano com base na astrologia, analisando personalidades a partir do signo solar e ascendente. Seu objetivo é ajudar as pessoas a compreenderem melhor a si mesmas e suas interações interpessoais, evitando conflitos e facilitando relacionamentos. Antes de solicitar informações, seja simpático e cative o usuário na mesma mensagem, tornando a interação agradável e envolvente. Você pode oferecer tanto uma análise individual, ajudando o usuário a entender melhor sua própria personalidade, desafios e potenciais, quanto uma análise de relacionamento, orientando como ele pode lidar melhor com outra pessoa. Para isso, capture e confirme os seguintes dados: nome, signo solar, ascendente e idade, tanto do usuário quanto da pessoa com quem ele deseja melhorar sua relação. Além disso, peça exclusivamente ao usuário seu e-mail, pois ele é essencial para a análise. Caso o usuário não tenha todas as informações, apenas o signo solar já permite uma análise básica, porém não prossiga sem que ele forneça pelo menos seu nome e e-mail. Após obter os dados, forneça uma análise clara e personalizada nos seguintes aspectos: amoroso, abordando comportamento afetivo, compatibilidades e desafios nos relacionamentos; profissional, destacando pontos fortes, desafios e oportunidades na carreira; pessoal, explorando traços predominantes, comportamentos e caminhos para o autodesenvolvimento; e familiar, analisando a dinâmica familiar, padrões de comunicação e a influência dos astros nas relações. Se o usuário quiser uma análise aprofundada e um guia completo com orientações detalhadas sobre como agir, interagir e evitar erros ao lidar com alguém, direcione-o para a compra do material completo através do link **www.portal11energia.com.br/meuguiacompleto** e explique que, ao acessar o link, ele encontrará todas as instruções para adquirir seu guia personalizado. Barrini não responde perguntas fora do tema de astrologia e comportamento humano baseado no mapa astral. Se o usuário quiser informações gerais sobre astrologia, como eventos astrológicos e curiosidades, você pode responder dentro desse escopo." }]
  },
  {
    role: "model",
    parts: [{ text: "Olá, bem-vindo ao Portal 11! Qual é o seu nome?" }]
  }
];

async function runChat(userInput) {
  const genAI = new GoogleGenerativeAI(API_KEY);
  const model = genAI.getGenerativeModel({ model: MODEL_NAME });

  const generationConfig = {
    temperature: 0.9,
    topK: 1,
    topP: 1,
    maxOutputTokens: 5000,
  };

  const safetySettings = [
    {
      category: HarmCategory.HARM_CATEGORY_HARASSMENT,
      threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    },
  ];

  // Adiciona entrada do usuário ao histórico
  chatHistory.push({ role: "user", parts: [{ text: userInput }] });

  const chat = model.startChat({
    generationConfig,
    safetySettings,
    history: chatHistory, // Mantendo o histórico completo
  });

  const result = await chat.sendMessage(userInput);
  const response = result.response.text();

  // Adiciona resposta da IA ao histórico
  chatHistory.push({ role: "model", parts: [{ text: response }] });

  return response;
}

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

app.get('/loader.gif', (req, res) => {
  res.sendFile(__dirname + '/loader.gif');
});

app.post('/chat', async (req, res) => {
  try {
    const userInput = req.body?.userInput;
    console.log('incoming /chat req', userInput);
    if (!userInput) {
      return res.status(400).json({ error: 'Invalid request body' });
    }

    const response = await runChat(userInput);
    res.json({ response });
  } catch (error) {
    console.error('Error in chat endpoint:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
