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

    result.textContent =
        "Your translation will appear here...";

    counter.textContent =
        "0 / 5000";

});


/* =========================
   COPY
========================= */

copyButton.addEventListener("click", async () => {

    const text =
        result.textContent.trim();


    if (
        !text ||
        text ===
        "Your translation will appear here..."
    ) {
        return;
    }


    try {

        await navigator.clipboard.writeText(text);

        copyButton.textContent =
            "✓ Copied!";


        setTimeout(() => {

            copyButton.textContent =
                "📋 Copy";

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


    if (
        !text ||
        text ===
        "Your translation will appear here..."
    ) {
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


    if (
        result.textContent !==
        "Your translation will appear here..."
    ) {

        textInput.value =
            result.textContent;


        counter.textContent =
            `${textInput.value.length} / 5000`;


        result.textContent =
            "Your translation will appear here...";

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

        themeButton.textContent = "🌙";

        themeButton.title =
            "Switch to dark mode";

    } else {

        document.body.classList.remove("light");

        themeButton.textContent = "☀️";

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