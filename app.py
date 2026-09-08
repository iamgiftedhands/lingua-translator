import json
import os

import requests
from dotenv import load_dotenv
from flask import Flask, render_template, request, jsonify
from deep_translator import GoogleTranslator

load_dotenv()

app = Flask(__name__)


languages = {
    "Auto Detect": "auto",
    "Afrikaans": "af",
    "Arabic": "ar",
    "Chinese": "zh-CN",
    "Dutch": "nl",
    "English": "en",
    "French": "fr",
    "German": "de",
    "Greek": "el",
    "Hausa": "ha",
    "Hindi": "hi",
    "Igbo": "ig",
    "Italian": "it",
    "Japanese": "ja",
    "Korean": "ko",
    "Portuguese": "pt",
    "Russian": "ru",
    "Spanish": "es",
    "Swahili": "sw",
    "Yoruba": "yo"
}


@app.route("/")
def home():
    return render_template(
        "index.html",
        languages=languages
    )


@app.route("/translate", methods=["POST"])
def translate():

    try:
        data = request.get_json()

        if not data:
            return jsonify({
                "error": "No data received."
            }), 400

        text = data.get("text", "").strip()
        source = data.get("source", "auto")
        target = data.get("target", "en")

        if not text:
            return jsonify({
                "error": "Please enter some text."
            }), 400

        if len(text) > 5000:
            return jsonify({
                "error": "Text is too long (max 5000 characters)."
            }), 400

        if not target or target == "auto":
            return jsonify({
                "error": "Please select a target language."
            }), 400

        translator = GoogleTranslator(
            source=source,
            target=target
        )

        translated = translator.translate(text)

        return jsonify({
            "translation": translated
        })

    except Exception as e:
        print("Translation error:", e)

        return jsonify({
            "error": "Translation failed. Please try again."
        }), 500


@app.route("/explain", methods=["POST"])
def explain():

    try:
        data = request.get_json()

        if not data:
            return jsonify({
                "error": "No data received."
            }), 400

        text = data.get("text", "").strip()
        translation = data.get("translation", "").strip()
        source = data.get("source", "auto")
        target = data.get("target", "en")

        if not text or not translation:
            return jsonify({
                "error": "Nothing to explain yet."
            }), 400

        if len(text) > 1000:
            return jsonify({
                "error": "Text is too long to explain (max 1000 characters)."
            }), 400

        api_key = os.environ.get("GEMINI_API_KEY")

        if not api_key:
            return jsonify({
                "error": "Explanation feature is not configured."
            }), 503

        prompt = (
            "You are a friendly language expert. A user translated a phrase.\n"
            f"Original ({source}): {text}\n"
            f"Translation ({target}): {translation}\n\n"
            "Respond ONLY with a JSON object, no markdown fences, with exactly "
            "these keys:\n"
            '"meaning": what the phrase actually means, in plain English (1-2 short sentences).\n'
            '"tone": the tone/register (e.g. formal, casual, friendly) and who you would say it to.\n'
            '"context": when to use it and any cultural note or common mistake to avoid.\n'
            '"example": one more example sentence in the target language using a key '
            "word or expression from the translation, followed by its English meaning "
            "in brackets.\n"
            "Keep every field short and simple."
        )

        models_to_try = [
            "gemini-flash-latest",
            "gemini-flash-lite-latest"
        ]

        response = None

        for model in models_to_try:

            response = requests.post(
                "https://generativelanguage.googleapis.com/v1beta/"
                f"models/{model}:generateContent",
                headers={
                    "x-goog-api-key": api_key,
                    "Content-Type": "application/json"
                },
                json={
                    "contents": [
                        {"parts": [{"text": prompt}]}
                    ]
                },
                timeout=30
            )

            if response.ok:
                break

        response.raise_for_status()

        raw = (
            response.json()
            ["candidates"][0]
            ["content"]["parts"][0]
            ["text"]
        )

        clean = raw.strip()

        if clean.startswith("```"):
            clean = clean.strip("`")
            clean = clean.removeprefix("json").strip()

        parsed = json.loads(clean)

        return jsonify({
            "meaning": str(parsed.get("meaning", "")),
            "tone": str(parsed.get("tone", "")),
            "context": str(parsed.get("context", "")),
            "example": str(parsed.get("example", ""))
        })

    except Exception as e:
        print("Explain error:", e)

        return jsonify({
            "error": "Could not generate an explanation. Please try again."
        }), 500


if __name__ == "__main__":
    app.run(debug=True)