// Local, lightweight cultural content for the cognitive games.
// These are familiar everyday prompts, not assumptions about any person's beliefs or routine.
const CULTURAL_GAME_CONTENT = {
    en: {
        region: "North Eastern Region",
        visualMotifs: ["hills", "bamboo", "handloom", "tea gardens", "local flowers"],
        objects: [
            ["tea-cup", "☕ Tea cup"], ["bamboo-basket", "🧺 Bamboo basket"],
            ["shawl", "🧣 Shawl"], ["flower", "🌼 Flower"],
            ["fruit", "🍊 Fruit"], ["clock", "🕰️ Clock"],
            ["medicine", "💊 Medicine box"], ["water", "🥛 Water glass"],
            ["prayer", "🪔 Prayer item"], ["market-bag", "🛍️ Market bag"]
        ],
        routines: {
            morning: ["☕ Morning tea", "🪴 Water plants", "🍽️ Meal time", "💊 Medicine time"],
            afternoon: ["🛍️ Market bag", "🥛 Drink water", "☎️ Call family", "🛋️ Rest"],
            evening: ["🚶 Evening walk", "🪔 Prayer or quiet time", "🍽️ Meal time", "🛋️ Rest"]
        },
        timeLabels: { morning: "🌅 Morning", afternoon: "☀️ Afternoon", evening: "🌙 Evening" },
        text: {
            rememberObjects: "Remember these familiar items in order.",
            chooseObjects: "Tap the items in the order you remember.",
            chooseTime: "Choose Morning, Afternoon, or Evening.",
            rememberRoutine: "Remember this routine in the correct order.",
            patternRemember: "Remember the familiar item pattern shown below.",
            patternChoose: "Tap the pattern you remember.",
            checkAnswer: "Check answer",
            selectAll: "Choose all items before checking.",
            correct: "✅ Excellent! You remembered correctly.",
            tryAgain: "That is okay. Let us try another one.",
            next: "Next Round"
        }
    },
    as: {
        objects: [["tea-cup", "☕ চাহৰ কাপ"], ["bamboo-basket", "🧺 বাঁহৰ টোপোলা"], ["shawl", "🧣 চাদৰ"], ["flower", "🌼 ফুল"], ["fruit", "🍊 ফল"], ["clock", "🕰️ ঘড়ী"], ["medicine", "💊 ঔষধৰ বাকচ"], ["water", "🥛 পানীৰ গিলাচ"], ["prayer", "🪔 প্ৰাৰ্থনাৰ বস্তু"], ["market-bag", "🛍️ বজাৰৰ মোনা"]],
        routines: { morning: ["☕ পুৱাৰ চাহ", "🪴 গছত পানী", "🍽️ খোৱাৰ সময়", "💊 ঔষধৰ সময়"], afternoon: ["🛍️ বজাৰৰ মোনা", "🥛 পানী খোৱা", "☎️ পৰিয়ালক ফোন", "🛋️ বিশ্ৰাম"], evening: ["🚶 সন্ধিয়াৰ খোজ", "🪔 প্ৰাৰ্থনা বা শান্ত সময়", "🍽️ খোৱাৰ সময়", "🛋️ বিশ্ৰাম"] },
        timeLabels: { morning: "🌅 পুৱা", afternoon: "☀️ দুপৰীয়া", evening: "🌙 সন্ধিয়া" }
    },
    "mni-Mtei": {
        objects: [["tea-cup", "☕ ꯆꯥꯒꯤ ꯀꯥꯞ"], ["bamboo-basket", "🧺 ꯋꯥꯒꯤ ꯊꯨꯡ"], ["shawl", "🧣 ꯐꯤ"], ["flower", "🌼 ꯂꯩ"], ["fruit", "🍊 ꯍꯩ"], ["clock", "🕰️ ꯃꯇꯝ ꯌꯦꯡꯕꯤ"], ["medicine", "💊 ꯑꯦꯉꯥꯡꯕꯤ ꯀꯥꯏꯗꯣꯛ"], ["water", "🥛 ꯏꯁꯤꯡ ꯒ꯭ꯂꯥꯁ"], ["prayer", "🪔 ꯁꯟꯒꯥꯏ ꯄꯣꯠ"], ["market-bag", "🛍️ ꯀꯩꯊꯦꯜ ꯁꯦꯛ"]],
        routines: { morning: ["☕ ꯅꯨꯃꯤꯠꯀꯤ ꯆꯥ", "🪴 ꯄꯥꯝꯕꯤꯗ ꯏꯁꯤꯡ", "🍽️ ꯆꯥꯕꯥ ꯃꯇꯝ", "💊 ꯑꯦꯉꯥꯡꯕꯤ ꯃꯇꯝ"], afternoon: ["🛍️ ꯀꯩꯊꯦꯜ ꯁꯦꯛ", "🥛 ꯏꯁꯤꯡ ꯊꯛꯄ", "☎️ ꯏꯃꯨꯡ ꯃꯅꯨꯡꯒꯤ ꯀꯧꯕ", "🛋️ ꯉꯥꯛꯊꯣꯀꯄ"], evening: ["🚶 ꯅꯨꯃꯤꯠ ꯂꯩꯄꯤ ꯆꯠꯄ", "🪔 ꯁꯟꯒꯥꯏ ꯅꯠꯇ꯭ꯔꯒ ꯅꯤꯡꯗꯝ ꯃꯇꯝ", "🍽️ ꯆꯥꯕꯥ ꯃꯇꯝ", "🛋️ ꯉꯥꯛꯊꯣꯀꯄ"] },
        timeLabels: { morning: "🌅 ꯅꯨꯃꯤꯠ ꯍꯧꯕ", afternoon: "☀️ ꯅꯨꯃꯗꯥ", evening: "🌙 ꯅꯨꯃꯤꯠ ꯂꯩꯄ" }
    },
    lus: {
        objects: [["tea-cup", "☕ Chai no"], ["bamboo-basket", "🧺 Bawm"], ["shawl", "🧣 Puanzar"], ["flower", "🌼 Pangpar"], ["fruit", "🍊 Thei"], ["clock", "🕰️ Dar"], ["medicine", "💊 Damdawi bawm"], ["water", "🥛 Tui no"], ["prayer", "🪔 Ṭawngṭaina thil"], ["market-bag", "🛍️ Bazar ip"]],
        routines: { morning: ["☕ Chawhma chai", "🪴 Pangpar tui pek", "🍽️ Ei hun", "💊 Damdawi hun"], afternoon: ["🛍️ Bazar ip", "🥛 Tui in", "☎️ Chhungkaw phone", "🛋️ Chawl"], evening: ["🚶 Zanit lama kal", "🪔 Ṭawngṭai emaw chawl", "🍽️ Ei hun", "🛋️ Chawl"] },
        timeLabels: { morning: "🌅 Chawhma", afternoon: "☀️ Chawhnu", evening: "🌙 Zanit" }
    },
    bn: {
        objects: [["tea-cup", "☕ চায়ের কাপ"], ["bamboo-basket", "🧺 বাঁশের ঝুড়ি"], ["shawl", "🧣 শাল"], ["flower", "🌼 ফুল"], ["fruit", "🍊 ফল"], ["clock", "🕰️ ঘড়ি"], ["medicine", "💊 ওষুধের বাক্স"], ["water", "🥛 জলের গ্লাস"], ["prayer", "🪔 প্রার্থনার জিনিস"], ["market-bag", "🛍️ বাজারের ব্যাগ"]],
        routines: { morning: ["☕ সকালের চা", "🪴 গাছে জল", "🍽️ খাওয়ার সময়", "💊 ওষুধের সময়"], afternoon: ["🛍️ বাজারের ব্যাগ", "🥛 জল পান", "☎️ পরিবারকে ফোন", "🛋️ বিশ্রাম"], evening: ["🚶 সন্ধ্যার হাঁটা", "🪔 প্রার্থনা বা শান্ত সময়", "🍽️ খাওয়ার সময়", "🛋️ বিশ্রাম"] },
        timeLabels: { morning: "🌅 সকাল", afternoon: "☀️ দুপুর", evening: "🌙 সন্ধ্যা" }
    },
    ne: {
        objects: [["tea-cup", "☕ चियाको कप"], ["bamboo-basket", "🧺 बाँसको डोको"], ["shawl", "🧣 शल"], ["flower", "🌼 फूल"], ["fruit", "🍊 फल"], ["clock", "🕰️ घडी"], ["medicine", "💊 औषधिको बाकस"], ["water", "🥛 पानीको गिलास"], ["prayer", "🪔 प्रार्थनाको सामान"], ["market-bag", "🛍️ बजारको झोला"]],
        routines: { morning: ["☕ बिहानको चिया", "🪴 बिरुवामा पानी", "🍽️ खाने समय", "💊 औषधि समय"], afternoon: ["🛍️ बजारको झोला", "🥛 पानी पिउने", "☎️ परिवारलाई फोन", "🛋️ आराम"], evening: ["🚶 साँझको हिँडाइ", "🪔 प्रार्थना वा शान्त समय", "🍽️ खाने समय", "🛋️ आराम"] },
        timeLabels: { morning: "🌅 बिहान", afternoon: "☀️ दिउँसो", evening: "🌙 साँझ" }
    },
    hi: {
        objects: [["tea-cup", "☕ चाय का कप"], ["bamboo-basket", "🧺 बाँस की टोकरी"], ["shawl", "🧣 शॉल"], ["flower", "🌼 फूल"], ["fruit", "🍊 फल"], ["clock", "🕰️ घड़ी"], ["medicine", "💊 दवा का डिब्बा"], ["water", "🥛 पानी का गिलास"], ["prayer", "🪔 प्रार्थना की वस्तु"], ["market-bag", "🛍️ बाज़ार का थैला"]],
        routines: { morning: ["☕ सुबह की चाय", "🪴 पौधों को पानी", "🍽️ भोजन का समय", "💊 दवा का समय"], afternoon: ["🛍️ बाज़ार का थैला", "🥛 पानी पीना", "☎️ परिवार को फोन", "🛋️ आराम"], evening: ["🚶 शाम की सैर", "🪔 प्रार्थना या शांत समय", "🍽️ भोजन का समय", "🛋️ आराम"] },
        timeLabels: { morning: "🌅 सुबह", afternoon: "☀️ दोपहर", evening: "🌙 शाम" }
    }
};

function buildPatterns(objects) {
    const iconFor = (id) => objects.find(([objectId]) => objectId === id)[1].split(" ")[0];
    return [
        ["tea-cup", "bamboo-basket", "tea-cup", "bamboo-basket"],
        ["shawl", "flower", "shawl", "flower"],
        ["fruit", "tea-cup", "fruit", "tea-cup"],
        ["water", "medicine", "water", "medicine"]
    ].map((pattern) => pattern.map(iconFor).join(" "));
}

export function getCulturalGameContent(language) {
    const base = CULTURAL_GAME_CONTENT.en;
    const localized = CULTURAL_GAME_CONTENT[language] || base;
    const objects = localized.objects || base.objects;

    return {
        ...base,
        ...localized,
        objects,
        routines: localized.routines || base.routines,
        timeLabels: localized.timeLabels || base.timeLabels,
        text: { ...base.text, ...(localized.text || {}) },
        patterns: buildPatterns(objects)
    };
}
