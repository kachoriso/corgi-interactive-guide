// server.js (Hugging Face版 - タイムアウト対策版)

// 必要なモジュールをインポートします
const express = require('express');
const { HfInference } = require('@huggingface/inference');
require('dotenv').config();

// Expressアプリケーションを初期化します
const app = express();
const PORT = process.env.PORT || 3000;

// Hugging Faceのアクセストークンが設定されているか確認します
if (!process.env.HUGGINGFACE_API_KEY) {
  console.error('エラー: HUGGINGFACE_API_KEYが.envファイルに設定されていません。');
  process.exit(1); // エラーでプロセスを終了します
}

// Hugging Face APIクライアントを初期化します
const hf = new HfInference(process.env.HUGGINGFACE_API_KEY);

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
    // AIに送信するプロンプト（指示）を定義します
    const prompt = `ユーザー: あなたは創造的なコーギーの専門家です。コーギーのユニークで魅力的な名前を一つ提案してください。名前とその名前の短い由来や意味も創作してください。必ず「名前：(名前)、由来：(由来)」の形式で回答してください。例：『名前：ビスケ、由来：こんがり焼いたビスケットのように、香ばしくて甘い性格だから。』\nシステム: `;
    
    // Hugging Faceのテキスト生成モデルを呼び出します
    const result = await hf.textGeneration({
      model: 'line-corporation/japanese-large-lm-1.7b-instruction-sft',
      inputs: prompt,
      parameters: {
        max_new_tokens: 100, // 生成するテキストの最大長
        temperature: 0.8,   // 創造性の度合い (高いほどランダム)
        repetition_penalty: 1.1, // 同じ言葉の繰り返しを避ける
      },
      // タイムアウト対策：モデルの準備が完了するまで待機するオプションを追加
      options: {
        wait_for_model: true
      }
    });

    // AIからの応答を解析し、整形します
    const generatedText = result.generated_text;
    const nameMatch = generatedText.match(/名前：(.*?)(,|、|由来|$)/);
    const storyMatch = generatedText.match(/由来：(.*?)$/);
    
    const name = nameMatch ? nameMatch[1].trim() : "名無しワンコ";
    const story = storyMatch ? storyMatch[1].trim() : "素敵な物語はこれから始まる！";

    // 整形した結果をフロントエンドに送信します
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
    
    const prompt = `ユーザー: あなたは賢くてユーモアのあるコーギーの達人です。ユーザーが「${behavior}」というコーギーの行動を観察しました。この行動からコーギーが何を考えているか、楽しく想像力豊かに「翻訳」してください。日本語で、簡潔に2～3文でお願いします。\nシステム: `;

    const result = await hf.textGeneration({
      model: 'line-corporation/japanese-large-lm-1.7b-instruction-sft',
      inputs: prompt,
      parameters: {
        max_new_tokens: 150,
        temperature: 0.7,
      },
      // タイムアウト対策：モデルの準備が完了するまで待機するオプションを追加
      options: {
        wait_for_model: true
      }
    });

    res.json({ interpretation: result.generated_text });

  } catch (error) {
    console.error('行動解釈エラー:', error);
    res.status(500).json({ error: 'AIによる行動の解釈中にエラーが発生しました。' });
  }
});

// サーバーを指定したポートで起動します
app.listen(PORT, () => {
  console.log(`サーバーが http://localhost:${PORT} で起動しました`);
});
