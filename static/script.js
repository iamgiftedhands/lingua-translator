const textInput = document.getElementById("text");
const result = document.getElementById("result");

const sourceLanguage =
    document.getElementById("sourceLanguage");

const targetLanguage =
    document.getElementById("targetLanguage");

const translateButton =
    document.getElementById("translateButton");

const buttonText =
    document.getElementById("buttonText");

const loading =
    document.getElementById("loading");

const counter =
    document.getElementById("counter");

const clearButton =
    document.getElementById("clearButton");

const copyButton =
    document.getElementById("copyButton");

const speakButton =
    document.getElementById("speakButton");

const swapButton =
    document.getElementById("swapButton");

const themeButton =
    document.getElementById("themeButton");


/* =========================
   ICON HELPERS
========================= */

function setIcon(button, iconId) {

    const use =
        button.querySelector("use");

    if (use) {
        use.setAttribute("href", iconId);
    }
}


function setButton(button, iconId, label) {

    setIcon(button, iconId);

    const span =
        button.querySelector(".btn-label");

    if (span) {
        span.textContent = label;
    }
}

/* =========================
   CHARACTER COUNTER
========================= */

textInput.addEventListener("input", () => {

    counter.textContent =
        `${textInput.value.length} / 5000`;

});


/* =========================
   TRANSLATE
========================= */

translateButton.addEventListener("click", async () => {

    const text =
        textInput.value.trim();

    const source =
        sourceLanguage.value;

    const target =
        targetLanguage.value;


    if (!text) {

        result.textContent =
            "Please enter some text first.";

        return;
    }


    if (!target || target === "auto") {

        result.textContent =
            "Please select a target language.";

        return;
    }


    translateButton.disabled = true;

    buttonText.classList.add("hidden");

    loading.classList.remove("hidden");

    result.textContent =
        "Translating...";


    try {

        const response =
            await fetch("/translate", {

                method: "POST",

                headers: {
                    "Content-Type":
                        "application/json"
                },

                body: JSON.stringify({

                    text: text,

                    source: source,

                    target: target

                })

            });


        const data =
            await response.json();


        if (!response.ok) {

            throw new Error(
                data.error ||
                "Translation failed."
            );

        }


        result.textContent =
            data.translation;


        resetVariants(data.translation);


        saveHistoryItem({
            text: text,
            translation: data.translation,
            source: source,
            target: target
        });


    } catch (error) {

        console.error(
            "Translation error:",
            error
        );

        result.textContent =
            "Translation failed: " +
            error.message;

    } finally {

        translateButton.disabled = false;

        buttonText.classList.remove("hidden");

        loading.classList.add("hidden");

    }

});


/* =========================
   CLEAR
========================= */

clearButton.addEventListener("click", () => {

    textInput.value = "";

    result.textContent = "";

    counter.textContent =
        "0 / 5000";

});


/* =========================
   COPY
========================= */

copyButton.addEventListener("click", async () => {

    const text =
        result.textContent.trim();


    if (!text) {
        return;
    }


    try {

        await navigator.clipboard.writeText(text);

        setButton(copyButton, "#icon-check", "Copied!");


        setTimeout(() => {

            setButton(copyButton, "#icon-copy", "Copy");

        }, 1500);

    } catch (error) {

        console.error(
            "Copy error:",
            error
        );

    }

});


/* =========================
   TEXT TO SPEECH
========================= */

speakButton.addEventListener("click", () => {

    const text =
        result.textContent.trim();


    if (!text) {
        return;
    }


    const speech =
        new SpeechSynthesisUtterance(text);


    speech.lang =
        targetLanguage.value;


    window.speechSynthesis.cancel();

    window.speechSynthesis.speak(speech);

});


/* =========================
   SWAP LANGUAGES
========================= */

swapButton.addEventListener("click", () => {

    const oldSource =
        sourceLanguage.value;

    const oldTarget =
        targetLanguage.value;


    sourceLanguage.value =
        oldTarget;

    // "auto" doesn't exist in the target
    // dropdown, so keep the old target
    // if source was Auto Detect
    if (oldSource === "auto") {

        targetLanguage.value =
            oldTarget;

    } else {

        targetLanguage.value =
            oldSource;

    }


    if (result.textContent.trim()) {

        textInput.value =
            result.textContent;


        counter.textContent =
            `${textInput.value.length} / 5000`;


        result.textContent = "";

    }

});


/* =========================
   THEME
========================= */

/*
   Your CSS uses:

   body.light = LIGHT MODE
   no class   = DARK MODE

   So JavaScript must toggle "light",
   NOT "dark".
*/


function setTheme(isLight) {

    if (isLight) {

        document.body.classList.add("light");

        setIcon(themeButton, "#icon-moon");

        themeButton.title =
            "Switch to dark mode";

    } else {

        document.body.classList.remove("light");

        setIcon(themeButton, "#icon-sun");

        themeButton.title =
            "Switch to light mode";

    }


    localStorage.setItem(
        "lightMode",
        isLight
    );

}


/* =========================
   THEME BUTTON
========================= */

themeButton.addEventListener("click", () => {

    const isCurrentlyLight =
        document.body.classList.contains("light");


    setTheme(!isCurrentlyLight);

});


/* =========================
   REMEMBER THEME
========================= */

const savedTheme =
    localStorage.getItem("lightMode");


if (savedTheme === "true") {

    setTheme(true);

} else {

    setTheme(false);

}

/* =========================
   HISTORY (localStorage)
========================= */

const HISTORY_KEY = "linguaHistory";

const historyList =
    document.getElementById("historyList");

const clearHistoryButton =
    document.getElementById("clearHistoryButton");


function languageName(code) {

    if (code === "auto") return "Auto";

    const option =
        targetLanguage.querySelector(
            `option[value="${code}"]`
        ) ||
        sourceLanguage.querySelector(
            `option[value="${code}"]`
        );

    return option ? option.textContent.trim() : code;
}


function getHistory() {

    try {

        return JSON.parse(
            localStorage.getItem(HISTORY_KEY)
        ) || [];

    } catch {

        return [];
    }
}


function setHistory(items) {

    localStorage.setItem(
        HISTORY_KEY,
        JSON.stringify(items)
    );

    renderHistory();
}


function saveHistoryItem(item) {

    const items = getHistory();

    items.unshift(item);

    setHistory(items.slice(0, 10));
}


function renderHistory() {

    const items = getHistory();

    historyList.innerHTML = "";


    if (items.length === 0) {

        const note =
            document.createElement("p");

        note.className = "empty-note";

        note.textContent =
            "No translations yet.";

        historyList.appendChild(note);

        return;
    }


    items.forEach((item, index) => {

        const row =
            document.createElement("div");

        row.className = "history-item";


        const textSpan =
            document.createElement("span");

        textSpan.className = "history-text";

        textSpan.textContent =
            item.text + "  →  " + item.translation;


        const langSpan =
            document.createElement("span");

        langSpan.className = "history-langs";

        langSpan.textContent =
            languageName(item.source) +
            " → " +
            languageName(item.target);


        const deleteButton =
            document.createElement("button");

        deleteButton.className =
            "small-button";

        deleteButton.type = "button";

        deleteButton.innerHTML =
            '<svg class="icon"><use href="#icon-close"/></svg>';

        deleteButton.title = "Delete";


        deleteButton.addEventListener(
            "click",
            (event) => {

                event.stopPropagation();

                const current = getHistory();

                current.splice(index, 1);

                setHistory(current);
            }
        );


        // click a history row to reload it
        row.addEventListener("click", () => {

            textInput.value = item.text;

            counter.textContent =
                `${item.text.length} / 5000`;

            sourceLanguage.value = item.source;

            targetLanguage.value = item.target;

            result.textContent = item.translation;

            window.scrollTo({
                top: 0,
                behavior: "smooth"
            });
        });


        row.appendChild(textSpan);

        row.appendChild(langSpan);

        row.appendChild(deleteButton);

        historyList.appendChild(row);
    });
}


clearHistoryButton.addEventListener("click", () => {

    setHistory([]);

});


renderHistory();


/* =========================
   PHRASEBOOK
========================= */

const phrasebook = {

    "Greetings": [
        "Good morning",
        "Good evening",
        "How are you?",
        "Nice to meet you",
        "Welcome",
        "Long time no see"
    ],

    "Travel": [
        "Where is the bus stop?",
        "How much is this?",
        "I need a taxi",
        "Where is the hotel?",
        "Can you help me?",
        "I am looking for the market"
    ],

    "Food": [
        "I am hungry",
        "The food is delicious",
        "Water, please",
        "What do you recommend?",
        "The bill, please",
        "I don't eat pepper"
    ],

    "Everyday": [
        "Thank you very much",
        "Excuse me",
        "I don't understand",
        "Please speak slowly",
        "See you tomorrow",
        "What is your name?"
    ],

    "Emergency": [
        "Help!",
        "Call the police",
        "I need a doctor",
        "I am lost",
        "It is urgent"
    ]
};


const categoryTabs =
    document.getElementById("categoryTabs");

const phraseList =
    document.getElementById("phraseList");


function renderPhrases(category) {

    phraseList.innerHTML = "";


    phrasebook[category].forEach((phrase) => {

        const chip =
            document.createElement("button");

        chip.className = "phrase-chip";

        chip.type = "button";

        chip.textContent = phrase;


        chip.addEventListener("click", () => {

            textInput.value = phrase;

            counter.textContent =
                `${phrase.length} / 5000`;

            window.scrollTo({
                top: 0,
                behavior: "smooth"
            });

            textInput.focus();
        });


        phraseList.appendChild(chip);
    });
}


Object.keys(phrasebook).forEach(
    (category, index) => {

        const tab =
            document.createElement("button");

        tab.className = "category-tab";

        tab.type = "button";

        tab.textContent = category;


        if (index === 0) {

            tab.classList.add("active");

            renderPhrases(category);
        }


        tab.addEventListener("click", () => {

            document
                .querySelectorAll(".category-tab")
                .forEach((t) =>
                    t.classList.remove("active")
                );

            tab.classList.add("active");

            renderPhrases(category);
        });


        categoryTabs.appendChild(tab);
    }
);


/* =========================
   EXPLAIN THIS TRANSLATION
========================= */

const explainButton =
    document.getElementById("explainButton");

const explanation =
    document.getElementById("explanation");

const explainMeaning =
    document.getElementById("explainMeaning");

const explainTone =
    document.getElementById("explainTone");

const explainContext =
    document.getElementById("explainContext");

const explainExample =
    document.getElementById("explainExample");


explainButton.addEventListener("click", async () => {

    const translation =
        result.textContent.trim();


    if (
        !translation ||
        translation.startsWith("Translation failed") ||
        translation === "Translating..."
    ) {
        return;
    }


    explainButton.disabled = true;

    setButton(explainButton, "#icon-bulb", "Explaining...");


    // show the panel straight away with placeholder bars
    explanation.classList.add("loading");

    explanation.classList.remove("hidden");


    [
        explainMeaning,
        explainTone,
        explainContext,
        explainExample
    ].forEach((el) => {

        el.textContent = "";
    });


    try {

        const response =
            await fetch("/explain", {

                method: "POST",

                headers: {
                    "Content-Type":
                        "application/json"
                },

                body: JSON.stringify({

                    text: textInput.value.trim(),

                    translation: translation,

                    source: sourceLanguage.value,

                    target: targetLanguage.value

                })

            });


        const data =
            await response.json();


        if (!response.ok) {

            throw new Error(
                data.error ||
                "Explanation failed."
            );

        }


        explainMeaning.textContent =
            data.meaning;

        explainTone.textContent =
            data.tone;

        explainContext.textContent =
            data.context;

        explainExample.textContent =
            data.example;


        explanation.classList.remove("loading");

        explanation.classList.remove("hidden");


        explanation.scrollIntoView({
            behavior: "smooth",
            block: "nearest"
        });


    } catch (error) {

        console.error(
            "Explain error:",
            error
        );

        explanation.classList.remove("loading");

        explanation.classList.add("hidden");

        alert(error.message);

    } finally {

        explainButton.disabled = false;

        setButton(explainButton, "#icon-bulb", "Explain");

    }

});


/* =========================
   VOICE INPUT (speech to text)
========================= */

const micButton =
    document.getElementById("micButton");

const SpeechRecognition =
    window.SpeechRecognition ||
    window.webkitSpeechRecognition;


// map our language codes to speech locales
const speechLocales = {
    "auto": "en-US",
    "en": "en-US",
    "fr": "fr-FR",
    "es": "es-ES",
    "de": "de-DE",
    "it": "it-IT",
    "pt": "pt-PT",
    "nl": "nl-NL",
    "ru": "ru-RU",
    "ar": "ar-SA",
    "hi": "hi-IN",
    "ja": "ja-JP",
    "ko": "ko-KR",
    "zh-CN": "zh-CN",
    "el": "el-GR",
    "af": "af-ZA",
    "sw": "sw-KE",
    "yo": "yo-NG",
    "ig": "ig-NG",
    "ha": "ha-NG"
};


if (!SpeechRecognition) {

    // browser doesn't support it (e.g. Firefox)
    micButton.style.display = "none";

} else {

    let recognition = null;

    let listening = false;


    micButton.addEventListener("click", () => {

        // stop if already listening
        if (listening && recognition) {

            recognition.stop();

            return;
        }


        recognition = new SpeechRecognition();

        recognition.lang =
            speechLocales[sourceLanguage.value] ||
            "en-US";

        recognition.interimResults = false;

        recognition.maxAlternatives = 1;


        recognition.onstart = () => {

            listening = true;

            setButton(micButton, "#icon-mic", "Listening...");

            micButton.classList.add("recording");
        };


        recognition.onresult = (event) => {

            const spoken =
                event.results[0][0].transcript;


            const existing =
                textInput.value.trim();


            textInput.value =
                existing
                    ? existing + " " + spoken
                    : spoken;


            counter.textContent =
                `${textInput.value.length} / 5000`;
        };


        recognition.onerror = (event) => {

            console.error(
                "Speech error:",
                event.error
            );


            if (event.error === "not-allowed") {

                alert(
                    "Microphone access was blocked. " +
                    "Allow it in your browser to use voice input."
                );
            }
        };


        recognition.onend = () => {

            listening = false;

            setButton(micButton, "#icon-mic", "Speak");

            micButton.classList.remove("recording");
        };


        recognition.start();
    });
}


/* =========================
   TRANSLATION VARIANTS
   (Literal / Natural / Casual)
========================= */

const variantTabs =
    document.querySelectorAll(".variant-tab");


let variantData = {
    literal: null,
    natural: null,
    casual: null
};

let variantsLoading = false;


function setActiveTab(name) {

    variantTabs.forEach((tab) => {

        tab.classList.toggle(
            "active",
            tab.dataset.variant === name
        );
    });
}


function resetVariants(literalText) {

    variantData = {
        literal: literalText,
        natural: null,
        casual: null
    };

    setActiveTab("literal");
}


async function fetchVariants() {

    variantsLoading = true;


    const response =
        await fetch("/variants", {

            method: "POST",

            headers: {
                "Content-Type":
                    "application/json"
            },

            body: JSON.stringify({

                text: textInput.value.trim(),

                translation: variantData.literal,

                source: sourceLanguage.value,

                target: targetLanguage.value

            })

        });


    const data =
        await response.json();


    variantsLoading = false;


    if (!response.ok) {

        throw new Error(
            data.error ||
            "Could not get variants."
        );
    }


    variantData.natural = data.natural;

    variantData.casual = data.casual;
}


variantTabs.forEach((tab) => {

    tab.addEventListener("click", async () => {

        const name = tab.dataset.variant;


        // nothing translated yet
        if (!variantData.literal) {
            return;
        }


        if (name === "literal") {

            setActiveTab("literal");

            result.textContent =
                variantData.literal;

            return;
        }


        setActiveTab(name);


        // already fetched? just show it
        if (variantData[name]) {

            result.textContent =
                variantData[name];

            return;
        }


        if (variantsLoading) {
            return;
        }


        result.textContent =
            "Getting " + name + " version...";


        try {

            await fetchVariants();

            result.textContent =
                variantData[name];

        } catch (error) {

            console.error(
                "Variants error:",
                error
            );

            result.textContent =
                variantData.literal;

            setActiveTab("literal");

            alert(error.message);
        }
    });
});
