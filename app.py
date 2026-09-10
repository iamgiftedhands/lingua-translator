import json
import os
import time

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


# lite first: it doesn't do internal "thinking", so it answers
# much faster. the fuller model is the fallback if lite errors.
GEMINI_MODELS = [
    "gemini-flash-lite-latest",
    "gemini-flash-latest"
]


def language_name(code):
    """Turn a language code into its display name so
    Gemini prompts read naturally."""

    if code == "auto":
        return "the detected language"

    for name, c in languages.items():
        if c == code:
            return name

    return code


def looks_like_error_page(text):
    """deep-translator scrapes Google's free endpoint, and when
    Google returns an error page the library hands back the page
    text as if it were a translation. Catch that."""

    if not text or not text.strip():
        return True

    markers = [
        "That's an error",
        "That\u2019s an error",
        "That's all we know",
        "That\u2019s all we know",
        "Error 500 (Server Error)",
        "Error 502",
        "Error 503",
        "(Server Error)"
    ]

    return any(m in text for m in markers)


def call_gemini(prompt):
    """Send a prompt to Gemini. Tries each model in turn and
    skips over timeouts or connection errors."""

    api_key = os.environ.get("GEMINI_API_KEY")

    if not api_key:
        return None

    response = None

    for model in GEMINI_MODELS:

        try:

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
                timeout=60
            )

        except requests.exceptions.RequestException as e:
            print("Gemini request failed:", e)
            continue

        if response.ok:
            break

    if response is None:
        raise RuntimeError("No response from Gemini.")

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

    return json.loads(clean)


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

        # Google's free endpoint is flaky and rate limits,
        # so try a few times before giving up
        last_error = None

        for attempt in range(3):

            try:

                translated = GoogleTranslator(
                    source=source,
                    target=target
                ).translate(text)

                if looks_like_error_page(translated):

                    print(
                        f"Google returned an error page "
                        f"(attempt {attempt + 1})"
                    )

                    last_error = RuntimeError(
                        "Google returned an error page."
                    )

                    time.sleep(0.7)

                    continue

                return jsonify({
                    "translation": translated
                })

            except Exception as e:

                last_error = e

                print(
                    f"Google Translate attempt {attempt + 1} failed:",
                    e
                )

                time.sleep(0.7)

        # still nothing? let Gemini handle it
        if os.environ.get("GEMINI_API_KEY"):

            print("Falling back to Gemini for translation.")

            prompt = (
                "You are a translator.\n"
                f"Translate this from {language_name(source)} "
                f"to {language_name(target)}:\n"
                f"{text}\n\n"
                "Respond ONLY with a JSON object, no markdown fences: "
                '{"translation": "..."}'
            )

            parsed = call_gemini(prompt)

            if parsed and parsed.get("translation"):
                return jsonify({
                    "translation": str(parsed["translation"])
                })

        raise last_error or RuntimeError("Translation failed.")

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

        if not os.environ.get("GEMINI_API_KEY"):
            return jsonify({
                "error": "Explanation feature is not configured."
            }), 503

        prompt = (
            "You are a friendly language expert. A user translated a phrase.\n"
            f"Original ({language_name(source)}): {text}\n"
            f"Translation ({language_name(target)}): {translation}\n\n"
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

        parsed = call_gemini(prompt)

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


@app.route("/variants", methods=["POST"])
def variants():

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
                "error": "Translate something first."
            }), 400

        if len(text) > 1000:
            return jsonify({
                "error": "Text is too long (max 1000 characters)."
            }), 400

        if not os.environ.get("GEMINI_API_KEY"):
            return jsonify({
                "error": "This feature is not configured."
            }), 503

        prompt = (
            "You are a native-level translator.\n"
            f"Original ({language_name(source)}): {text}\n"
            f"Literal translation ({language_name(target)}): {translation}\n\n"
            "Respond ONLY with a JSON object, no markdown fences, with exactly "
            "these keys:\n"
            f'"natural": how a native {language_name(target)} speaker would normally say this. '
            "Just the sentence, nothing else.\n"
            f'"casual": how you would say this to a close friend in {language_name(target)}, '
            "informal/slang where appropriate. Just the sentence, nothing else."
        )

        parsed = call_gemini(prompt)

        return jsonify({
            "natural": str(parsed.get("natural", "")),
            "casual": str(parsed.get("casual", ""))
        })

    except Exception as e:
        print("Variants error:", e)

        return jsonify({
            "error": "Could not generate variants. Please try again."
        }), 500


if __name__ == "__main__":
    app.run(debug=True)
