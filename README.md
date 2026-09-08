Lingua

A web translator with a focus on actually understanding what you're saying, not just swapping words. Built with Flask, deployed on Vercel.

Live site: https://lingua-translator-eight.vercel.app

What it does
Translates text between 20 languages, including Yoruba, Igbo, Hausa and Swahili
Literal / Natural / Casual variants — see the direct translation, how a native speaker would actually say it, and how you'd say it to a friend
Explain this translation — an AI breaks down the meaning, tone, when to use the phrase, and gives an extra example. Useful for languages where a literal translation misses the point.
Voice input — speak instead of typing
Text-to-speech for translations
Translation history (last 10, stored in your browser, deletable)
A phrasebook with common phrases for greetings, travel, food, everyday talk and emergencies
Dark and light mode
Stack
Backend: Python / Flask
Translation: deep-translator (Google Translate)
Variants and explanations: Gemini API, with automatic fallback to a second model when the first one errors
Frontend: plain HTML, CSS and JavaScript — no framework
Hosting: Vercel (serverless)
Running it locally

You need Python 3.10+ and a free Gemini API key from Google AI Studio. The translator works without the key; only the AI features need it.

bash
git clone https://github.com/iamgiftedhands/lingua-translator.git
cd lingua-translator

python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # Mac/Linux

pip install -r requirements.txt

Create a .env file in the project root:

GEMINI_API_KEY=your-key-here

Then run:

bash
python app.py

and open http://127.0.0.1:5000.

API

Three JSON endpoints:

Endpoint	Method	Body	Returns
/translate	POST	{text, source, target}	{translation}
/variants	POST	{text, translation, source, target}	{natural, casual}
/explain	POST	{text, translation, source, target}	{meaning, tone, context, example}
What's next
Nigerian Pidgin support with slang explanations
User accounts with saved phrases
Author

Built by Giftedhands.