from flask import Flask, render_template, request, jsonify
from deep_translator import GoogleTranslator

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


if __name__ == "__main__":
    app.run(debug=True)