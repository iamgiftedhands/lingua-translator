# Lingua

A web translator with a focus on actually understanding what you're saying, not just swapping words. Built with Flask, deployed on Vercel.

**Live site:** https://lingua-translator-eight.vercel.app

## What it does

- Translates text between 20 languages, including Yoruba, Igbo, Hausa and Swahili
- **Explain this translation** — after translating, an AI breaks down the meaning, tone, when to use the phrase, and gives an extra example. Useful for languages where a literal translation misses the point.
- Text-to-speech for translations
- Translation history (last 10, stored in your browser, deletable)
- A phrasebook with common phrases for greetings, travel, food, everyday talk and emergencies
- Dark and light mode

## Stack

- **Backend:** Python / Flask
- **Translation:** deep-translator (Google Translate)
- **Explanations:** Gemini API, with automatic fallback to a second model when the first one errors
- **Frontend:** plain HTML, CSS and JavaScript — no framework
- **Hosting:** Vercel (serverless)

## Running it locally

You need Python 3.10+ and a free Gemini API key from [Google AI Studio](https://aistudio.google.com/apikey). The translator works without the key; only the Explain feature needs it.

```bash
git clone https://github.com/iamgiftedhands/lingua-translator.git
cd lingua-translator

python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # Mac/Linux

pip install -r requirements.txt
```

Create a `.env` file in the project root:

```
GEMINI_API_KEY=your-key-here
```

Then run:

```bash
python app.py
```

and open http://127.0.0.1:5000.

## API

Two JSON endpoints:

| Endpoint | Method | Body | Returns |
|---|---|---|---|
| `/translate` | POST | `{text, source, target}` | `{translation}` |
| `/explain` | POST | `{text, translation, source, target}` | `{meaning, tone, context, example}` |

## What's next

- Natural and casual translation variants, not just the literal one
- Nigerian Pidgin support with slang explanations
- User accounts with saved phrases

## Author

Built by [Giftedhands](https://github.com/iamgiftedhands).
