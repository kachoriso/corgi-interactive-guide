// server.js (Groq版 - 最終対策版)

// 必要なモジュールをインポートします
const express = require('express');
// GroqのAPIを利用するためのライブラリ
const Groq = require('groq-sdk');
require('dotenv').config();

// Expressアプリケーションを初期化します
const app = express();
const PORT = process.env.PORT || 3000;

// GroqのAPIキーが設定されているか確認します
if (!process.env.GROQ_API_KEY) {
  console.error('エラー: GROQ_API_KEYが.envファイルに設定されていません。');
  process.exit(1);
}

// Groq APIクライアントを初期化します
const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY,
});

// ミドルウェアを設定します
app.use(express.json());
app.use(express.static(__dirname));

// ルートURLへのGETリクエストでindex.htmlを送信します
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});


// APIエンドポイント: コーギーの名前を生成
app.post('/api/generate-name', async (req, res) => {
  try {
    const chatCompletion = await groq.chat.completions.create({
        messages: [
            {
                role: "system",
                content: "あなたは創造的なコーギーの専門家です。ユーザーの指示に従い、ユニークで魅力的なコーギーの名前と、その短い由来を創作してください。必ず「名前：(名前)、由来：(由来)」の形式で回答してください。"
            },
            {
                role: "user",
                content: "コーギーの名前を一つ提案してください。例：『名前：ビスケ、由来：こんがり焼いたビスケットのように、香ばしくて甘い性格だから。』"
            }
        ],
        // 高速で高性能なLlama3モデルを使用
        model: "llama3-8b-8192",
        temperature: 0.8,
        max_tokens: 150,
    });

    const generatedText = chatCompletion.choices[0]?.message?.content || "";
    const nameMatch = generatedText.match(/名前：(.*?)(,|、|由来|$)/);
    const storyMatch = generatedText.match(/由来：(.*?)$/);
    
    const name = nameMatch ? nameMatch[1].trim() : "名無しワンコ";
    const story = storyMatch ? storyMatch[1].trim() : "素敵な物語はこれから始まる！";

    res.json({ name, story });

  } catch (error) {
    console.error('名前生成エラー:', error);
    res.status(500).json({ error: 'AIによる名前の生成中にエラーが発生しました。' });
  }
});

// APIエンドポイント: コーギーの行動を解釈
app.post('/api/interpret-behavior', async (req, res) => {
  try {
    const { behavior } = req.body;
    if (!behavior) {
      return res.status(400).json({ error: '解釈する行動が指定されていません。' });
    }
    
    const chatCompletion = await groq.chat.completions.create({
        messages: [
            {
                role: "system",
                content: "あなたは賢くてユーモアのあるコーギーの達人です。ユーザーが観察したコーギーの行動を翻訳し、そのコーギーが何を考えているかを楽しく想像力豊かに、日本語で簡潔に2～3文で説明してください。"
            },
            {
                role: "user",
                content: `このコーギーの行動を翻訳してください：「${behavior}」`
            }
        ],
        model: "llama3-8b-8192",
        temperature: 0.7,
        max_tokens: 200,
    });

    const interpretation = chatCompletion.choices[0]?.message?.content || "";
    res.json({ interpretation });

  } catch (error) {
    console.error('行動解釈エラー:', error);
    res.status(500).json({ error: 'AIによる行動の解釈中にエラーが発生しました。' });
  }
});

// サーバーを指定したポートで起動します
app.listen(PORT, () => {
  console.log(`サーバーが http://localhost:${PORT} で起動しました`);
});
