import {
    app,
    db,
    auth,
    PATIENT_ID,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    collection,
    addDoc,
    getDocs,
    query,
    getDoc,
    doc,
    where,
    serverTimestamp,
    deleteDoc,
    setDoc,
    updateDoc
} from "./firebase.js";

import { getCulturalGameContent } from "./cultural-content.js";
import { calculateAdaptiveDifficulty } from "./adaptive-difficulty.js";

// ================================
// USER & PATIENT CONTEXT (P0.3)
// ================================
let currentUserRole = null;
let currentUserData = null;

function getActivePatientId() {
    if (currentUserRole === "patient") {
        return auth.currentUser ? auth.currentUser.uid : PATIENT_ID;
    }
    if (currentUserRole === "caregiver") {
        return currentUserData?.patientId || PATIENT_ID;
    }
    return auth.currentUser ? auth.currentUser.uid : PATIENT_ID;
}

        
            

            // FCM
import {
    getMessaging,
    getToken,
    onMessage
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-messaging.js";
const messaging = getMessaging(app);
            
        // App Check
import {
    initializeAppCheck,
    ReCaptchaEnterpriseProvider
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-app-check.js";
// Firebase AI Logic
import {
    getAI,
    getGenerativeModel,
    GoogleAIBackend
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-ai.js";
        


        
        // ================================
// FCM NOTIFICATIONS
// ================================

const VAPID_KEY =
    "BEDkJXDRip7D_j2rKuNK2Br_SsBG_qTybDJj5GwqIwpMKTtHIvOHkL3lYs2pDUVedd322BOb7_63xhrEpEaKsi8";

// Store token until the user logs in
let pendingFCMToken = null;


// Save FCM token to the currently logged-in user
async function saveFCMToken(token) {

    const currentUser = auth.currentUser;

    if (!currentUser) {
        console.error("❌ No logged-in user found.");
        return;
    }

    try {

        await setDoc(
            doc(db, "users", currentUser.uid),
            {
                fcmToken: token
            },
            {
        recommendedForYou: "Recommended for You",
        tryThisNext: "Try this activity next.",
        basedOnRecentActivity: "Based on your recent activity",
        activityNotRecentlyTried: "You haven't tried this activity recently.",
        activityNeverAttempted: "You haven't tried this activity yet.",
        activityVariety: "This gives your recent activities some variety.",
        noActivityHistory: "Try this activity to get started.",
                merge: true
            }
        );

        console.log("✅ FCM token saved to Firestore.");

    } catch (error) {

        console.error(
            "❌ Error saving FCM token:",
            error
        );

    }
}


// Request notification permission
if (typeof Notification !== "undefined" && Notification.requestPermission) {
    Notification.requestPermission().then(async (permission) => {

    if (permission !== "granted") {

        console.log(
            "🔕 Notification permission not granted."
        );

        return;
    }

    console.log(
        "🔔 Notification permission granted!"
    );

    try {

        const token = await getToken(
            messaging,
            {
                vapidKey: VAPID_KEY
            }
        );

        if (!token) {

            console.log(
                "⚠️ No FCM registration token available."
            );

            return;
        }

        console.log(
            "🔥 FCM Token generated."
        );

        // Check whether user is already logged in
        if (auth.currentUser) {

            await saveFCMToken(token);

        } else {

            // User hasn't logged in yet.
            // Keep token temporarily.
            pendingFCMToken = token;

            console.log(
                "⏳ FCM token waiting for login..."
            );
        }

    } catch (error) {

        console.error(
            "❌ Error getting FCM token:",
            error
        );

    }

    });
}
// ================================
// AUTHENTICATION & SESSION MANAGEMENT (P0.2)
// ================================

const loginEmail =
    document.getElementById("loginEmail");

const loginPassword =
    document.getElementById("loginPassword");

const loginMessage =
    document.getElementById("loginMessage");

const userBadge =
    document.getElementById("userBadge");

const logoutBtn =
    document.getElementById("logoutBtn");

// ================================
// SINGLE-ACTIVE-VIEW NAVIGATION (P1.1)
// ================================

const patientModuleIds = [
    "mindfulPauseSection",
    "memoryGame",
    "attentionGame",
    "routineRecallGame",
    "patternGame",
    "moodCheckin",
    "remindersSection",
    "progressSection",
    "assistantSection",
    "dailyPlanSection"
];

function showCaregiverView(viewId = "dashboard") {
    if (typeof clearBreatherTimer === "function") {
        clearBreatherTimer();
    }

    const welcomeSection = document.querySelector(".welcome");
    const cardsSection = document.querySelector(".cards");
    const prioritiesSection = document.getElementById("todaysPrioritiesSection");
    const quickAccessSection = document.getElementById("quickAccessSection");
    const summaryGrid = document.getElementById("patientSummaryGrid");
    const caregiverSection = document.getElementById("caregiverSection");
    const createReminderSection = document.getElementById("createReminderSection");

    // Hide ALL patient home & card sections
    if (welcomeSection) welcomeSection.style.display = "none";
    if (cardsSection) cardsSection.style.display = "none";
    if (prioritiesSection) prioritiesSection.style.display = "none";
    if (quickAccessSection) quickAccessSection.style.display = "none";
    if (summaryGrid) summaryGrid.style.display = "none";

    // Hide all patient modules
    patientModuleIds.forEach((id) => {
        const el = document.getElementById(id);
        if (el) el.style.display = "none";
    });

    if (viewId === "remindersSection") {
        if (caregiverSection) caregiverSection.style.display = "none";
        if (createReminderSection) createReminderSection.style.display = "block";
        const remSec = document.getElementById("remindersSection");
        if (remSec) {
            remSec.style.display = "block";
            remSec.scrollIntoView({ behavior: "smooth" });
        }
        loadCaregiverReminders();
    } else if (viewId === "progressSection") {
        if (caregiverSection) caregiverSection.style.display = "none";
        if (createReminderSection) createReminderSection.style.display = "none";
        const progSec = document.getElementById("progressSection");
        if (progSec) {
            progSec.style.display = "block";
            progSec.scrollIntoView({ behavior: "smooth" });
        }
        loadPatientProgressView();
    } else if (viewId === "assistantSection") {
        if (caregiverSection) caregiverSection.style.display = "none";
        if (createReminderSection) createReminderSection.style.display = "none";
        const asstSec = document.getElementById("assistantSection");
        if (asstSec) {
            asstSec.style.display = "block";
            asstSec.scrollIntoView({ behavior: "smooth" });
        }
    } else {
        // Default: Caregiver Dashboard
        const remSec = document.getElementById("remindersSection");
        const progSec = document.getElementById("progressSection");
        const asstSec = document.getElementById("assistantSection");
        if (remSec) remSec.style.display = "none";
        if (progSec) progSec.style.display = "none";
        if (asstSec) asstSec.style.display = "none";

        if (createReminderSection) createReminderSection.style.display = "block";
        if (caregiverSection) {
            caregiverSection.style.display = "block";
            caregiverSection.scrollIntoView({ behavior: "smooth" });
        }
        loadCaregiverDashboard();
        loadCaregiverReminders();
    }
}

function showPatientView(viewId) {
    if (typeof clearBreatherTimer === "function") {
        clearBreatherTimer();
    }

    if (currentUserRole === "caregiver") {
        if (viewId === "remindersSection" || viewId === "progressSection" || viewId === "assistantSection") {
            showCaregiverView(viewId);
        } else {
            showCaregiverView("dashboard");
        }
        return;
    }

    const welcomeSection = document.querySelector(".welcome");
    const cardsSection = document.querySelector(".cards");
    const prioritiesSection = document.getElementById("todaysPrioritiesSection");
    const quickAccessSection = document.getElementById("quickAccessSection");
    const summaryGrid = document.getElementById("patientSummaryGrid");

    if (viewId === "dashboard") {
        if (welcomeSection) welcomeSection.style.display = "block";
        if (cardsSection) cardsSection.style.display = "grid";
        if (prioritiesSection) prioritiesSection.style.display = "block";
        if (quickAccessSection) quickAccessSection.style.display = "block";
        if (summaryGrid) summaryGrid.style.display = "grid";
        loadPatientPersonalizedDashboard();

        patientModuleIds.forEach((id) => {
            const el = document.getElementById(id);
            if (el) el.style.display = "none";
        });

        const appMain = document.getElementById("appMain");
        if (appMain) {
            appMain.scrollIntoView({ behavior: "smooth" });
        }
    } else {
        if (welcomeSection) welcomeSection.style.display = "none";
        if (cardsSection) cardsSection.style.display = "none";
        if (prioritiesSection) prioritiesSection.style.display = "none";
        if (quickAccessSection) quickAccessSection.style.display = "none";
        if (summaryGrid) summaryGrid.style.display = "none";

        patientModuleIds.forEach((id) => {
            const el = document.getElementById(id);
            if (el) {
                el.style.display = (id === viewId) ? "block" : "none";
            }
        });

        if (viewId === "dailyPlanSection") {
            loadPatientDailyPlan();
        }

        const activeEl = document.getElementById(viewId);
        if (activeEl) {
            activeEl.scrollIntoView({ behavior: "smooth" });
        }
    }
}

if (typeof window !== "undefined") {
    window.showCaregiverView = showCaregiverView;
    window.showPatientView = showPatientView;
}

// Wire up back-to-dashboard buttons (P1.1)
document.querySelectorAll(".back-to-dashboard-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
        if (currentUserRole === "caregiver") {
            showCaregiverView("dashboard");
        } else {
            showPatientView("dashboard");
            loadPatientPersonalizedDashboard();
        }
    });

    // Show P5.2 Floating Assistant
    const floatingAssistantContainer = document.getElementById("floatingAssistantContainer");
    if (floatingAssistantContainer) {
        floatingAssistantContainer.style.display = "block";
    }
});

// Wire up openAssistantBtn on dashboard (P1.1)
const openAssistantBtn = document.getElementById("openAssistantBtn");
if (openAssistantBtn) {
    openAssistantBtn.addEventListener("click", () => {
        showPatientView("assistantSection");
    });
}


// ==================================================
// PERSONALIZED PATIENT DASHBOARD (P3.1)
// ==================================================


// ==================================================
// P6.4 DETERMINISTIC PERSONALIZED ACTIVITY RECOMMENDATION
// ==================================================

// ==================================================
// P6.5 DETERMINISTIC PERSONAL MILESTONES
// ==================================================

// ==================================================
// P6.6 DETERMINISTIC PATIENT ACTIVE STREAK
// ==================================================

// ==================================================
// P6.6 DETERMINISTIC PATIENT ACTIVE STREAK
// ==================================================

// ==================================================
// P6.7 PATIENT PROGRESS ACTIVITY FILTER & SEARCH
// ==================================================

// ==================================================
// P6.8 MINDFUL BREATHER & FOCUS RESET LOGIC
// ==================================================
let breatherTimer = null;
let breatherPhaseIndex = 0;
let breatherPhaseTimeLeft = 4;
let breatherTotalSeconds = 60;
let isBreatherRunning = false;

function clearBreatherTimer() {
    if (breatherTimer) {
        clearInterval(breatherTimer);
        breatherTimer = null;
    }
    isBreatherRunning = false;
}

function resetBreatherCycle() {
    clearBreatherTimer();
    breatherPhaseIndex = 0;
    breatherPhaseTimeLeft = 4;
    breatherTotalSeconds = 60;

    const ring = document.getElementById("breatherRing");
    const phaseText = document.getElementById("breatherPhaseText");
    const statusText = document.getElementById("breatherStatusText");
    const startBtn = document.getElementById("startBreatherBtn");
    const pauseBtn = document.getElementById("pauseBreatherBtn");

    if (ring) ring.className = "breather-ring idle";
    if (phaseText) phaseText.textContent = t("startPause") || "Ready to begin";
    if (statusText) statusText.textContent = "60s";
    if (startBtn) startBtn.style.display = "inline-flex";
    if (pauseBtn) pauseBtn.style.display = "none";
}

function pauseBreatherCycle() {
    clearBreatherTimer();
    const startBtn = document.getElementById("startBreatherBtn");
    const pauseBtn = document.getElementById("pauseBreatherBtn");
    if (startBtn) startBtn.style.display = "inline-flex";
    if (pauseBtn) pauseBtn.style.display = "none";
}

function startBreatherCycle() {
    if (isBreatherRunning) return; // Prevent duplicate timers

    isBreatherRunning = true;
    const startBtn = document.getElementById("startBreatherBtn");
    const pauseBtn = document.getElementById("pauseBreatherBtn");
    const ring = document.getElementById("breatherRing");
    const phaseText = document.getElementById("breatherPhaseText");
    const statusText = document.getElementById("breatherStatusText");

    if (startBtn) startBtn.style.display = "none";
    if (pauseBtn) pauseBtn.style.display = "inline-flex";

    const phases = [
        { key: "phaseInhale", class: "inhale", defaultText: "Inhale gently..." },
        { key: "phaseHold", class: "hold", defaultText: "Hold peacefully..." },
        { key: "phaseExhale", class: "exhale", defaultText: "Exhale slowly..." },
        { key: "phaseRest", class: "rest", defaultText: "Rest and relax..." }
    ];

    // Set initial phase state
    const currentPhase = phases[breatherPhaseIndex];
    if (ring) ring.className = "breather-ring " + currentPhase.class;
    if (phaseText) phaseText.textContent = t(currentPhase.key) || currentPhase.defaultText;
    if (statusText) statusText.textContent = `${breatherTotalSeconds}s`;

    breatherTimer = setInterval(() => {
        breatherTotalSeconds--;
        if (statusText) statusText.textContent = `${Math.max(0, breatherTotalSeconds)}s`;

        if (breatherTotalSeconds <= 0) {
            clearBreatherTimer();
            if (ring) ring.className = "breather-ring rest";
            if (phaseText) phaseText.textContent = t("breatherComplete") || "Nice work taking a calm pause. Continue when you're ready.";
            if (startBtn) startBtn.style.display = "inline-flex";
            if (pauseBtn) pauseBtn.style.display = "none";
            return;
        }

        breatherPhaseTimeLeft--;
        if (breatherPhaseTimeLeft <= 0) {
            breatherPhaseIndex = (breatherPhaseIndex + 1) % 4;
            breatherPhaseTimeLeft = 4;
            const nextPhase = phases[breatherPhaseIndex];
            if (ring) ring.className = "breather-ring " + nextPhase.class;
            if (phaseText) phaseText.textContent = t(nextPhase.key) || nextPhase.defaultText;
        }
    }, 1000);
}

if (typeof window !== "undefined") {
    window.clearBreatherTimer = clearBreatherTimer;
    window.startBreatherCycle = startBreatherCycle;
    window.pauseBreatherCycle = pauseBreatherCycle;
    window.resetBreatherCycle = resetBreatherCycle;
    window.getBreatherState = () => ({
        isBreatherRunning,
        breatherPhaseIndex,
        breatherPhaseTimeLeft,
        breatherTotalSeconds
    });
}

let activeProgressFilter = "all";

function getGameRouteSectionId(gameType) {
    const routeMap = {
        "memory_sequence": "memoryGame",
        "attention_challenge": "attentionGame",
        "daily_routine_recall": "routineRecallGame",
        "pattern_recognition": "patternGame"
    };
    return routeMap[gameType] || "memoryGame";
}

function renderFilteredProgressHistory(activities = []) {
    const historyListElem = document.getElementById("activityHistoryList");
    if (!historyListElem) return;

    const filtered = (activeProgressFilter === "all")
        ? activities
        : activities.filter((act) => act.activityType === activeProgressFilter);

    if (filtered.length === 0) {
        if (activeProgressFilter === "all") return;
        const targetSection = getGameRouteSectionId(activeProgressFilter);
        const gameName = getFriendlyActivityName(activeProgressFilter);
        historyListElem.innerHTML = `
            <div class="filter-empty-card" role="region" aria-label="No activities for selected filter">
                <div style="font-size: 2.2rem; margin-bottom: 8px;">📭</div>
                <h4 class="filter-empty-title">${t("noActivitiesForFilter") || "No activities completed yet for this game."}</h4>
                <p class="filter-empty-sub">${gameName}</p>
                <button type="button" class="primary-continue-btn" style="min-height: 52px;" onclick="showPatientView('${targetSection}')">
                    ▶ ${t("startThisActivity") || "Start This Activity"}
                </button>
            </div>
        `;
        return;
    }

    let historyCardsHTML = "";
    filtered.forEach((act) => {
        const friendlyName = getFriendlyActivityName(act.activityType);
        const scoreVal = Number(act.score) || 0;
        const diffVal = act.difficulty !== undefined ? act.difficulty : "-";

        let formattedDate = "Recently";
        if (act.timestampDate && act.timestampDate.getTime() > 0) {
            try {
                formattedDate = act.timestampDate.toLocaleString(getCurrentLanguage(), {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit"
                });
            } catch (e) {
                formattedDate = act.timestampDate.toDateString();
            }
        }

        const modeBadge = act.mode === "cultural"
            ? `<span class="history-mode-tag cultural">${t("culturalMode") || "🌿 Cultural"}</span>`
            : act.mode === "standard"
            ? `<span class="history-mode-tag standard">${t("standardMode") || "🔢 Standard"}</span>`
            : "";

        historyCardsHTML += `
            <div class="history-item-card" role="region" aria-label="${friendlyName} - Score ${scoreVal}">
                <div class="history-item-header">
                    <div>
                        <h4 class="history-item-title">${friendlyName}</h4>
                        <div class="history-item-meta">
                            <span>📅 ${formattedDate}</span>
                            ${modeBadge}
                        </div>
                    </div>
                    <div class="history-score-badge">
                        ${scoreVal} <span style="font-size: 0.75rem; font-weight: normal;">/ 100</span>
                    </div>
                </div>
                <div class="history-item-footer">
                    <span>${t("difficultyLabel") || "Difficulty"}: <strong>${diffVal}</strong></span>
                </div>
            </div>
        `;
    });

    historyListElem.innerHTML = historyCardsHTML;
}

if (typeof window !== "undefined") {
    window.renderFilteredProgressHistory = renderFilteredProgressHistory;
    window.getActiveProgressFilter = () => activeProgressFilter;
}

function calculatePatientActiveStreak(activityResults = []) {
    if (!Array.isArray(activityResults) || activityResults.length === 0) {
        return {
            currentStreak: 0,
            weeklyActiveDays: 0,
            isStreakActiveToday: false
        };
    }

    const activeDates = new Set();
    activityResults.forEach((res) => {
        if (!res) return;
        let dateObj = null;

        if (res.timestampDate && res.timestampDate instanceof Date) {
            dateObj = res.timestampDate;
        } else if (res.timestamp && typeof res.timestamp.toDate === "function") {
            dateObj = res.timestamp.toDate();
        } else if (res.timestamp && typeof res.timestamp.seconds === "number") {
            dateObj = new Date(res.timestamp.seconds * 1000);
        } else if (typeof res.timestamp === "number" && res.timestamp > 0) {
            dateObj = new Date(res.timestamp);
        } else if (res.timestamp) {
            dateObj = new Date(res.timestamp);
        }

        if (dateObj && !isNaN(dateObj.getTime())) {
            const year = dateObj.getFullYear();
            const month = String(dateObj.getMonth() + 1).padStart(2, "0");
            const day = String(dateObj.getDate()).padStart(2, "0");
            activeDates.add(`${year}-${month}-${day}`);
        }
    });

    const getIsoDateString = (date) => {
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, "0");
        const d = String(date.getDate()).padStart(2, "0");
        return `${y}-${m}-${d}`;
    };

    const now = new Date();
    const todayStr = getIsoDateString(now);

    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = getIsoDateString(yesterday);

    const isStreakActiveToday = activeDates.has(todayStr);
    const isYesterdayActive = activeDates.has(yesterdayStr);

    let currentStreak = 0;
    if (isStreakActiveToday || isYesterdayActive) {
        let checkDate = new Date(isStreakActiveToday ? now : yesterday);
        while (activeDates.has(getIsoDateString(checkDate))) {
            currentStreak++;
            checkDate.setDate(checkDate.getDate() - 1);
        }
    }

    let weeklyActiveDays = 0;
    for (let i = 0; i < 7; i++) {
        const dayCheck = new Date(now);
        dayCheck.setDate(dayCheck.getDate() - i);
        if (activeDates.has(getIsoDateString(dayCheck))) {
            weeklyActiveDays++;
        }
    }

    return {
        currentStreak,
        weeklyActiveDays,
        isStreakActiveToday
    };
}

if (typeof window !== "undefined") {
    window.calculatePatientActiveStreak = calculatePatientActiveStreak;
}

function calculatePatientMilestones(activityResults = []) {
    const totalActivities = Array.isArray(activityResults) ? activityResults.length : 0;

    const distinctDates = new Set();
    if (Array.isArray(activityResults)) {
        activityResults.forEach((res) => {
            if (!res) return;
            let isoDate = null;
            let dateObj = null;

            if (res.timestampDate && res.timestampDate instanceof Date) {
                dateObj = res.timestampDate;
            } else if (res.timestamp && typeof res.timestamp.toDate === "function") {
                dateObj = res.timestamp.toDate();
            } else if (res.timestamp && typeof res.timestamp.seconds === "number") {
                dateObj = new Date(res.timestamp.seconds * 1000);
            } else if (typeof res.timestamp === "number" && res.timestamp > 0) {
                dateObj = new Date(res.timestamp);
            } else if (res.timestamp) {
                dateObj = new Date(res.timestamp);
            }

            if (dateObj && !isNaN(dateObj.getTime())) {
                const year = dateObj.getFullYear();
                const month = String(dateObj.getMonth() + 1).padStart(2, "0");
                const day = String(dateObj.getDate()).padStart(2, "0");
                isoDate = `${year}-${month}-${day}`;
            }

            if (isoDate) {
                distinctDates.add(isoDate);
            }
        });
    }

    const uniqueDaysCount = distinctDates.size;

    const milestones = [
        {
            id: "first_activity",
            titleKey: "milestoneFirstActivityTitle",
            defaultTitle: "First Activity",
            descKey: "milestoneFirstActivityDesc",
            defaultDesc: "Completed your first cognitive activity.",
            icon: "🌱",
            achieved: totalActivities >= 1,
            progress: `${Math.min(totalActivities, 1)} / 1`
        },
        {
            id: "three_activities",
            titleKey: "milestoneThreeActivitiesTitle",
            defaultTitle: "3 Activities Completed",
            descKey: "milestoneThreeActivitiesDesc",
            defaultDesc: "Completed 3 cognitive activities.",
            icon: "⭐",
            achieved: totalActivities >= 3,
            progress: `${Math.min(totalActivities, 3)} / 3`
        },
        {
            id: "five_activities",
            titleKey: "milestoneFiveActivitiesTitle",
            defaultTitle: "5 Activities Completed",
            descKey: "milestoneFiveActivitiesDesc",
            defaultDesc: "Completed 5 cognitive activities.",
            icon: "🏆",
            achieved: totalActivities >= 5,
            progress: `${Math.min(totalActivities, 5)} / 5`
        },
        {
            id: "three_active_days",
            titleKey: "milestoneThreeActiveDaysTitle",
            defaultTitle: "3 Active Days",
            descKey: "milestoneThreeActiveDaysDesc",
            defaultDesc: "Participated on 3 different days.",
            icon: "📅",
            achieved: uniqueDaysCount >= 3,
            progress: `${Math.min(uniqueDaysCount, 3)} / 3 days`
        },
        {
            id: "ten_activities",
            titleKey: "milestoneTenActivitiesTitle",
            defaultTitle: "10 Activities Completed",
            descKey: "milestoneTenActivitiesDesc",
            defaultDesc: "Completed 10 cognitive activities.",
            icon: "🌟",
            achieved: totalActivities >= 10,
            progress: `${Math.min(totalActivities, 10)} / 10`
        }
    ];

    const totalAchieved = milestones.filter((m) => m.achieved).length;

    return {
        milestones,
        totalAchieved,
        totalMilestones: milestones.length
    };
}

if (typeof window !== "undefined") {
    window.calculatePatientMilestones = calculatePatientMilestones;
}

function getPersonalizedActivityRecommendation(activityResults = []) {
    const supportedActivities = [
        {
            type: "memory_sequence",
            sectionId: "memoryGame",
            titleKey: "activityMemorySequence",
            defaultTitle: "Memory Sequence"
        },
        {
            type: "attention_challenge",
            sectionId: "attentionGame",
            titleKey: "activityAttentionChallenge",
            defaultTitle: "Attention Challenge"
        },
        {
            type: "daily_routine_recall",
            sectionId: "routineRecallGame",
            titleKey: "activityRoutineRecall",
            defaultTitle: "Daily Routine Recall"
        },
        {
            type: "pattern_recognition",
            sectionId: "patternGame",
            titleKey: "activityPatternRecognition",
            defaultTitle: "Pattern Recognition"
        }
    ];

    const latestTimestamps = {
        memory_sequence: null,
        attention_challenge: null,
        daily_routine_recall: null,
        pattern_recognition: null
    };

    if (Array.isArray(activityResults)) {
        activityResults.forEach((res) => {
            if (!res || !res.activityType) return;
            const type = res.activityType;
            if (Object.prototype.hasOwnProperty.call(latestTimestamps, type)) {
                let ts = 0;
                if (res.timestampDate && res.timestampDate instanceof Date) {
                    ts = res.timestampDate.getTime();
                } else if (res.timestamp && typeof res.timestamp.toMillis === "function") {
                    ts = res.timestamp.toMillis();
                } else if (res.timestamp && typeof res.timestamp.toDate === "function") {
                    ts = res.timestamp.toDate().getTime();
                } else if (res.timestamp && typeof res.timestamp.seconds === "number") {
                    ts = res.timestamp.seconds * 1000;
                } else if (typeof res.timestamp === "number") {
                    ts = res.timestamp;
                } else if (res.timestamp) {
                    ts = new Date(res.timestamp).getTime();
                }

                if (!isNaN(ts) && ts > 0) {
                    if (latestTimestamps[type] === null || ts > latestTimestamps[type]) {
                        latestTimestamps[type] = ts;
                    }
                }
            }
        });
    }

    const hasAnyHistory = Array.isArray(activityResults) && activityResults.length > 0;
    const unattempted = supportedActivities.filter((act) => latestTimestamps[act.type] === null);

    let chosen = null;
    let reasonKey = "tryThisNext";
    let defaultReason = "Try this activity next.";

    if (!hasAnyHistory) {
        chosen = supportedActivities[0];
        reasonKey = "noActivityHistory";
        defaultReason = "Try this activity to get started.";
    } else if (unattempted.length > 0) {
        chosen = unattempted[0];
        reasonKey = "activityNeverAttempted";
        defaultReason = "You haven't tried this activity yet.";
    } else {
        let oldestTs = Infinity;
        supportedActivities.forEach((act) => {
            const ts = latestTimestamps[act.type];
            if (ts < oldestTs) {
                oldestTs = ts;
                chosen = act;
            }
        });
        reasonKey = "activityNotRecentlyTried";
        defaultReason = "You haven't tried this activity recently.";
    }

    return {
        activityType: chosen.type,
        sectionId: chosen.sectionId,
        titleKey: chosen.titleKey,
        defaultTitle: chosen.defaultTitle,
        reasonKey: reasonKey,
        defaultReason: defaultReason
    };
}
if (typeof window !== "undefined") {
    window.getPersonalizedActivityRecommendation = getPersonalizedActivityRecommendation;
}

async function loadPatientPersonalizedDashboard() {
    const greetingTitle = document.getElementById("personalizedGreeting");
    const greetingSub = document.getElementById("personalizedSubtitle");
    const dateElem = document.getElementById("personalizedDate");
    const progressFill = document.getElementById("dailyProgressFill");
    const progressPct = document.getElementById("dailyProgressPct");
    const progressHelp = document.getElementById("dailyProgressHelp");
    const taskCountElem = document.getElementById("dailyProgressTaskCount");
    const primaryBtn = document.getElementById("primaryContinueBtn");

    if (!greetingTitle) return;

    // Date display
    if (dateElem) {
        try {
            const now = new Date();
            const options = { weekday: 'short', month: 'short', day: 'numeric' };
            dateElem.textContent = now.toLocaleDateString(getCurrentLanguage() || 'en-US', options);
        } catch (e) {
            dateElem.textContent = new Date().toDateString();
        }
    }

    // 1. Time-of-day greeting (using browser local time ONLY, never stored or sent to Firestore)
    const currentHour = new Date().getHours();
    let timeKey = "goodMorning";
    if (currentHour >= 12 && currentHour < 17) {
        timeKey = "goodAfternoon";
    } else if (currentHour >= 17 || currentHour < 5) {
        timeKey = "goodEvening";
    }

    greetingTitle.textContent = t(timeKey) || "Welcome 👋";
    if (greetingSub) {
        greetingSub.textContent = t("todayPlan") || "Here is your plan and summary for today.";
    }

    if (progressPct) progressPct.textContent = "...";

    try {
        const patientId = getActivePatientId();
        const todayISO = new Date().toISOString().split("T")[0];

        // Fetch data concurrently using existing patient-scoped query logic (no duplicate reads)
        const remindersPromise = getDocs(query(
            collection(db, "reminders"),
            where("patientId", "==", patientId)
        ));

        const activitiesPromise = getDocs(query(
            collection(db, "activityResults"),
            where("patientId", "==", patientId)
        ));

        const moodPromise = getDocs(query(
            collection(db, "moodCheckins"),
            where("patientId", "==", patientId)
        ));

        const [remindersSnap, activitiesSnap, moodSnap] = await Promise.all([
            remindersPromise,
            activitiesPromise,
            moodPromise
        ]);

        // Process Today's Reminders
        let todayRemindersTotal = 0;
        let todayRemindersPending = 0;
        let todayRemindersCompleted = 0;

        remindersSnap.forEach((doc) => {
            const data = doc.data();
            if (data.date === todayISO) {
                todayRemindersTotal++;
                if (data.completed) {
                    todayRemindersCompleted++;
                } else {
                    todayRemindersPending++;
                }
            }
        });

        // Reminders completion rule:
        // Counted as completed ONLY when ALL reminders scheduled today are marked completed.
        let hasRemindersToday = todayRemindersTotal > 0;
        let remindersGoalDone = hasRemindersToday && todayRemindersPending === 0 && todayRemindersCompleted === todayRemindersTotal;

        // Process Today's Cognitive Activity
        let activityCompletedToday = false;
        const allActivities = [];
        activitiesSnap.forEach((doc) => {
            const data = doc.data();
            allActivities.push(data);
            if (data.timestamp && data.timestamp.toDate) {
                const actDateISO = data.timestamp.toDate().toISOString().split("T")[0];
                if (actDateISO === todayISO) {
                    activityCompletedToday = true;
                }
            }
        });

        // Process Today's Mood Check-in
        let moodCompletedToday = false;
        let latestMoodObj = null;
        const allMoods = [];
        moodSnap.forEach((doc) => {
            const data = doc.data();
            allMoods.push(data);
        });

        if (allMoods.length > 0) {
            allMoods.sort((a, b) => {
                const timeA = a.timestamp && a.timestamp.toDate ? a.timestamp.toDate() : new Date(0);
                const timeB = b.timestamp && b.timestamp.toDate ? b.timestamp.toDate() : new Date(0);
                return timeB - timeA;
            });
            latestMoodObj = allMoods[0];
            if (latestMoodObj.timestamp && latestMoodObj.timestamp.toDate) {
                const moodDateISO = latestMoodObj.timestamp.toDate().toISOString().split("T")[0];
                if (moodDateISO === todayISO) {
                    moodCompletedToday = true;
                }
            }
        }

        // Calculate Daily Progress
        // Tasks evaluated: 1. Cognitive Activity today, 2. Mood Check-in today, 3. Reminders scheduled today (if any)
        const totalPossibleGoals = hasRemindersToday ? 3 : 2;
        const completedGoals = (activityCompletedToday ? 1 : 0) + (moodCompletedToday ? 1 : 0) + (remindersGoalDone ? 1 : 0);
        const progressPctValue = Math.round((completedGoals / totalPossibleGoals) * 100);

        if (progressFill) progressFill.style.width = `${progressPctValue}%`;
        if (progressPct) progressPct.textContent = `${progressPctValue}%`;
        if (taskCountElem) {
            taskCountElem.textContent = `${completedGoals} / ${totalPossibleGoals} ${t("completedTasksOf") || "completed"}`;
        }

        if (progressHelp) {
            progressHelp.textContent = hasRemindersToday
                ? (t("dailyProgressHelp") || "Based on today's cognitive activity, mood check-in, and reminders.")
                : (t("dailyProgressNoRemindersHelp") || "Based on today's cognitive activity and mood check-in (no reminders scheduled today).");
        }

        // Primary "Continue" Action Button routing
        if (primaryBtn) {
            if (todayRemindersPending > 0) {
                primaryBtn.textContent = t("continueReminders") || "📅 Complete Today's Reminders";
                primaryBtn.onclick = () => showPatientView("remindersSection");
            } else if (!activityCompletedToday) {
                const rec = getPersonalizedActivityRecommendation(allActivities);
                primaryBtn.textContent = t("continueActivity") || "🧠 Start Today's Cognitive Activity";
                primaryBtn.onclick = () => showPatientView(rec.sectionId);
            } else if (!moodCompletedToday) {
                primaryBtn.textContent = t("continueMood") || "😊 Complete Mood Check-In";
                primaryBtn.onclick = () => showPatientView("moodCheckin");
            } else {
                primaryBtn.textContent = t("continueGreatJob") || "🎉 All Done Today! Try Another Activity";
                primaryBtn.onclick = () => showPatientView("memoryGame");
            }
        }

        // Render Today's Priorities Cards
        const remText = document.getElementById("priorityReminderText");
        const remBtn = document.getElementById("priorityReminderActionBtn");
        if (remText && remBtn) {
            if (!hasRemindersToday) {
                remText.textContent = t("noRemindersScheduledToday") || "No reminders scheduled for today.";
            } else if (todayRemindersPending > 0) {
                remText.textContent = `${todayRemindersPending} ${t("pendingCount") || "pending"}, ${todayRemindersCompleted} ${t("completedRemindersCount") || "completed"}`;
            } else {
                remText.textContent = `All ${todayRemindersTotal} ${t("completedTodayCount") || "completed today"}`;
            }
            remBtn.onclick = () => showPatientView("remindersSection");
        }

        const actTitle = document.getElementById("priorityActivityTitle");
        const actText = document.getElementById("priorityActivityText");
        const actBtn = document.getElementById("priorityActivityActionBtn");
        if (actTitle && actText && actBtn) {
            const rec = getPersonalizedActivityRecommendation(allActivities);
            actTitle.textContent = t("recommendedForYou") || "Recommended for You";
            actText.textContent = activityCompletedToday 
                ? (t("activityCompletedToday") || "✅ Activity completed today")
                : `${t(rec.titleKey) || rec.defaultTitle} — ${t(rec.reasonKey) || rec.defaultReason}`;
            actBtn.onclick = () => showPatientView(rec.sectionId);
        }

        const moodText = document.getElementById("priorityMoodText");
        const moodBtn = document.getElementById("priorityMoodActionBtn");
        if (moodText && moodBtn) {
            moodText.textContent = moodCompletedToday
                ? (t("moodSaved") || "💙 Mood checked in today")
                : (t("noMoodCheckinToday") || "📭 No check-in today. How are you feeling?");
            moodBtn.onclick = () => showPatientView("moodCheckin");
        }

        // Wire Quick Access Shortcuts
        
        // Render P6.5 Personal Milestones Summary Widget
        const msTitle = document.getElementById("patientMilestoneTitle");
        const msBody = document.getElementById("patientMilestoneSummaryContent");
        if (msTitle && msBody) {
            msTitle.textContent = `🏅 ${t("personalMilestones") || "Personal Milestones"}`;
            const msData = calculatePatientMilestones(allActivities);
            msBody.innerHTML = `
                <div style="display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap;">
                    <div>
                        <div style="font-size: 1.4rem; font-weight: 700; color: #1e293b;">${msData.totalAchieved} / ${msData.totalMilestones}</div>
                        <div style="font-size: 0.85rem; color: #64748b;">${t("milestonesAchieved") || "Milestones Achieved"}</div>
                    </div>
                    <button type="button" class="priority-btn" style="min-height: 52px;" onclick="showPatientView('progressSection')">
                        ${t("viewMilestones") || "View Milestones"}
                    </button>
                </div>
            `;
        }

        
        // Render P6.6 Daily Consistency & Streak Widget
        const streakTitle = document.getElementById("patientStreakTitle");
        const streakBody = document.getElementById("patientStreakSummaryContent");
        if (streakTitle && streakBody) {
            streakTitle.textContent = `🔥 ${t("dailyConsistency") || "Daily Consistency"}`;
            const streakData = calculatePatientActiveStreak(allActivities);
            streakBody.innerHTML = `
                <div class="streak-metric-container">
                    <div class="streak-hero-row">
                        <div class="streak-fire-icon">🔥</div>
                        <div>
                            <div class="streak-value-display">${streakData.currentStreak} ${t("daysInARow") || "days in a row"}</div>
                            <div class="streak-sub-text">${streakData.weeklyActiveDays} / 7 ${t("activeThisWeek") || "Active Days This Week"}</div>
                        </div>
                    </div>
                    <div class="streak-encouragement">
                        ${streakData.isStreakActiveToday
                            ? (t("keepItUp") || "Great job maintaining your daily routine!")
                            : (t("startStreak") || "Complete an activity today to build your streak!")}
                    </div>
                </div>
            `;
        }

        
        // Wire P6.8 Mindful Breather Controls
        const startBBtn = document.getElementById("startBreatherBtn");
        const pauseBBtn = document.getElementById("pauseBreatherBtn");
        const resetBBtn = document.getElementById("resetBreatherBtn");
        const qaBreatherBtn = document.getElementById("quickAccessBreatherBtn");

        if (startBBtn) startBBtn.onclick = () => startBreatherCycle();
        if (pauseBBtn) pauseBBtn.onclick = () => pauseBreatherCycle();
        if (resetBBtn) resetBBtn.onclick = () => resetBreatherCycle();
        if (qaBreatherBtn) qaBreatherBtn.onclick = () => showPatientView("mindfulPauseSection");

        const qaPlan = document.getElementById("quickAccessDailyPlanBtn");
        if (qaPlan) qaPlan.onclick = () => showPatientView("dailyPlanSection");

        const qaAct = document.getElementById("quickAccessActivitiesBtn");
        if (qaAct) qaAct.onclick = () => showPatientView("memoryGame");

        const qaRem = document.getElementById("quickAccessRemindersBtn");
        if (qaRem) qaRem.onclick = () => showPatientView("remindersSection");

        const qaProg = document.getElementById("quickAccessProgressBtn");
        if (qaProg) qaProg.onclick = () => showPatientView("progressSection");

        const qaMood = document.getElementById("quickAccessMoodBtn");
        if (qaMood) qaMood.onclick = () => showPatientView("moodCheckin");

        const qaAssistant = document.getElementById("quickAccessAssistantBtn");
        if (qaAssistant) {
            qaAssistant.onclick = () => {
                if (typeof toggleFloatingAssistant === "function") {
                    toggleFloatingAssistant();
                } else {
                    document.getElementById("floatingAssistantBtn")?.click();
                }
            };
        }

        // Render Recent Performance Summary Card
        const perfBody = document.getElementById("patientPerformanceContent");
        if (perfBody) {
            if (allActivities.length === 0) {
                perfBody.innerHTML = `<p class="summary-loading">${t("noActivityResults") || "No activity results yet."}</p>`;
            } else {
                let totalScore = 0;
                let validScores = 0;
                allActivities.sort((a, b) => {
                    const timeA = a.timestamp && a.timestamp.toDate ? a.timestamp.toDate() : new Date(0);
                    const timeB = b.timestamp && b.timestamp.toDate ? b.timestamp.toDate() : new Date(0);
                    return timeB - timeA;
                });
                allActivities.forEach((act) => {
                    if (typeof act.score === "number") {
                        totalScore += act.score;
                        validScores++;
                    }
                });
                const avgScore = validScores > 0 ? Math.round(totalScore / validScores) : 0;
                const latestAct = allActivities[0];
                const latestName = getFriendlyActivityName(latestAct.activityType || "Memory Sequence");

                perfBody.innerHTML = `
                    <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                        <span>${t("totalActivities") || "Total Activities"}:</span>
                        <strong>${allActivities.length}</strong>
                    </div>
                    <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                        <span>${t("recentAverageScore") || "Average Score"}:</span>
                        <strong>${avgScore}%</strong>
                    </div>
                    <div style="display: flex; justify-content: space-between;">
                        <span>${t("latestActivityHighlight") || "Latest Activity"}:</span>
                        <strong>${latestName}</strong>
                    </div>
                `;
            }
        }

        // Render Latest Mood Summary Card
        const moodBody = document.getElementById("patientMoodContent");
        if (moodBody) {
            if (!latestMoodObj) {
                moodBody.innerHTML = `
                    <p style="margin-bottom: 12px; color: var(--secondary);">${t("noMoodCheckins") || "No mood check-ins recorded yet."}</p>
                    <button type="button" class="priority-btn" onclick="showPatientView('moodCheckin')">${t("checkIn") || "Check In"}</button>
                `;
            } else {
                const moodMap = {
                    good: { emoji: "😀", label: "Good" },
                    okay: { emoji: "🙂", label: "Okay" },
                    not_great: { emoji: "😐", label: "Not Great" },
                    worried: { emoji: "😟", label: "Worried" },
                    tired: { emoji: "😴", label: "Tired" }
                };
                const moodData = moodMap[latestMoodObj.mood] || { emoji: "🙂", label: latestMoodObj.mood || "Recorded" };
                let timeStr = "";
                if (latestMoodObj.timestamp && latestMoodObj.timestamp.toDate) {
                    timeStr = latestMoodObj.timestamp.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                }

                moodBody.innerHTML = `
                    <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 14px;">
                        <span style="font-size: 32px;">${moodData.emoji}</span>
                        <div>
                            <div style="font-weight: 700; font-size: 17px;">${moodData.label}</div>
                            <div style="font-size: 13px; color: var(--secondary);">${timeStr ? timeStr + ' ' : ''}${moodCompletedToday ? 'Today' : ''}</div>
                        </div>
                    </div>
                    <button type="button" class="priority-btn" onclick="showPatientView('moodCheckin')">${t("checkInAgain") || "Check In Again"}</button>
                `;
            }
        }

    } catch (err) {
        console.error("Error loading patient personalized dashboard:", err);
        showFeedbackMessage("error", "Could not refresh personalized dashboard.");
    }
}

// ==================================================
// SMART DAILY PLANNER (P6.2)
// ==================================================

async function loadPatientDailyPlan() {
    const totalCountElem = document.getElementById("dailyPlanTotalCount");
    const completedCountElem = document.getElementById("dailyPlanCompletedCount");
    const remainingCountElem = document.getElementById("dailyPlanRemainingCount");

    const morningList = document.getElementById("morningTasksList");
    const afternoonList = document.getElementById("afternoonTasksList");
    const eveningList = document.getElementById("eveningTasksList");
    const anytimeList = document.getElementById("anytimeTasksList");

    if (!morningList || !afternoonList || !eveningList || !anytimeList) return;

    morningList.innerHTML = `<p class="empty-group-msg">${t("nothingScheduled") || "Nothing scheduled"}</p>`;
    afternoonList.innerHTML = `<p class="empty-group-msg">${t("nothingScheduled") || "Nothing scheduled"}</p>`;
    eveningList.innerHTML = `<p class="empty-group-msg">${t("nothingScheduled") || "Nothing scheduled"}</p>`;
    anytimeList.innerHTML = `<p class="empty-group-msg">${t("nothingScheduled") || "Nothing scheduled"}</p>`;

    try {
        const patientId = getActivePatientId();
        const todayISO = new Date().toISOString().split("T")[0];

        // Fetch patient data concurrently using existing patient-scoped query logic
        const [remindersSnap, activitiesSnap, moodSnap] = await Promise.all([
            getDocs(query(collection(db, "reminders"), where("patientId", "==", patientId))),
            getDocs(query(collection(db, "activityResults"), where("patientId", "==", patientId))),
            getDocs(query(collection(db, "moodCheckins"), where("patientId", "==", patientId)))
        ]);

        const todayReminders = [];
        let todayRemindersTotal = 0;
        let todayRemindersPending = 0;
        let todayRemindersCompleted = 0;

        remindersSnap.forEach((docSnap) => {
            const data = docSnap.data();
            if (data.date === todayISO) {
                todayRemindersTotal++;
                if (data.completed) {
                    todayRemindersCompleted++;
                } else {
                    todayRemindersPending++;
                }
                todayReminders.push({ id: docSnap.id, ...data });
            }
        });

        let activityCompletedToday = false;
        activitiesSnap.forEach((docSnap) => {
            const data = docSnap.data();
            if (data.timestamp && data.timestamp.toDate) {
                if (data.timestamp.toDate().toISOString().split("T")[0] === todayISO) {
                    activityCompletedToday = true;
                }
            }
        });

        let moodCompletedToday = false;
        moodSnap.forEach((docSnap) => {
            const data = docSnap.data();
            if (data.timestamp && data.timestamp.toDate) {
                if (data.timestamp.toDate().toISOString().split("T")[0] === todayISO) {
                    moodCompletedToday = true;
                }
            }
        });

        // Task calculation matching P3.1/P6.1 rule
        const hasRemindersToday = todayRemindersTotal > 0;
        const totalTasks = hasRemindersToday ? (todayRemindersTotal + 2) : 2;
        const completedTasks = todayRemindersCompleted + (activityCompletedToday ? 1 : 0) + (moodCompletedToday ? 1 : 0);
        const remainingTasks = Math.max(0, totalTasks - completedTasks);

        if (totalCountElem) totalCountElem.textContent = totalTasks;
        if (completedCountElem) completedCountElem.textContent = completedTasks;
        if (remainingCountElem) remainingCountElem.textContent = remainingTasks;

        // Group reminders deterministically by time
        const morningItems = [];
        const afternoonItems = [];
        const eveningItems = [];
        const anytimeItems = [];

        todayReminders.forEach((rem) => {
            const itemHtml = createPlanReminderItemHtml(rem);
            if (!rem.time || typeof rem.time !== "string") {
                anytimeItems.push(itemHtml);
                return;
            }
            const hour = parseInt(rem.time.split(":")[0], 10);
            if (isNaN(hour)) {
                anytimeItems.push(itemHtml);
            } else if (hour >= 0 && hour < 12) {
                morningItems.push(itemHtml);
            } else if (hour >= 12 && hour < 17) {
                afternoonItems.push(itemHtml);
            } else if (hour >= 17 && hour <= 23) {
                eveningItems.push(itemHtml);
            } else {
                anytimeItems.push(itemHtml);
            }
        });

        // Collect all activities for daily plan recommendation
        const allPlanActivities = [];
        activitiesSnap.forEach((docSnap) => {
            allPlanActivities.push(docSnap.data());
        });
        const recPlan = getPersonalizedActivityRecommendation(allPlanActivities);

        // Add Available Activity & Mood Check-In to timeline
        const activityItemHtml = `
            <div class="plan-item-card ${activityCompletedToday ? 'completed-item' : ''}">
                <div class="plan-item-main">
                    <span class="plan-item-icon">🧠</span>
                    <div>
                        <h4 class="plan-item-title">${t("recommendedForYou") || "Recommended for You"}</h4>
                        <p class="plan-item-sub">${activityCompletedToday ? (t("activityCompletedToday") || "✅ Activity completed today") : `${t(recPlan.titleKey) || recPlan.defaultTitle} — ${t(recPlan.reasonKey) || recPlan.defaultReason}`}</p>
                    </div>
                </div>
                <span class="plan-item-badge ${activityCompletedToday ? 'completed' : 'pending'}">${activityCompletedToday ? (t("completed") || "Completed") : (t("pending") || "Pending")}</span>
                <button type="button" class="priority-btn plan-action-btn" onclick="showPatientView('${recPlan.sectionId}')">${t("startActivity") || "Start Activity"}</button>
            </div>
        `;

        const moodItemHtml = `
            <div class="plan-item-card ${moodCompletedToday ? 'completed-item' : ''}">
                <div class="plan-item-main">
                    <span class="plan-item-icon">😊</span>
                    <div>
                        <h4 class="plan-item-title">${t("moodCheckIn") || "Mood Check-In"}</h4>
                        <p class="plan-item-sub">${moodCompletedToday ? (t("moodSaved") || "💙 Mood checked in today") : (t("noMoodCheckinToday") || "How are you feeling today?")}</p>
                    </div>
                </div>
                <span class="plan-item-badge ${moodCompletedToday ? 'completed' : 'pending'}">${moodCompletedToday ? (t("completed") || "Completed") : (t("pending") || "Pending")}</span>
                <button type="button" class="priority-btn plan-action-btn" onclick="showPatientView('moodCheckin')">${moodCompletedToday ? (t("checkInAgain") || "Check In Again") : (t("checkIn") || "Check In")}</button>
            </div>
        `;

        morningItems.push(activityItemHtml);
        eveningItems.push(moodItemHtml);

        if (morningItems.length > 0) morningList.innerHTML = morningItems.join("");
        if (afternoonItems.length > 0) afternoonList.innerHTML = afternoonItems.join("");
        if (eveningItems.length > 0) eveningList.innerHTML = eveningItems.join("");
        if (anytimeItems.length > 0) anytimeList.innerHTML = anytimeItems.join("");

    } catch (err) {
        console.error("Error loading patient daily plan:", err);
        showFeedbackMessage("error", "Could not load daily plan.");
    }
}

function createPlanReminderItemHtml(rem) {
    const isDone = Boolean(rem.completed);
    const title = escapeHtml(rem.title || 'Reminder');
    const timeStr = rem.time ? `⏰ ${escapeHtml(rem.time)}` : '';
    const typeStr = rem.type ? `• ${escapeHtml(rem.type)}` : '';

    return `
        <div class="plan-item-card ${isDone ? 'completed-item' : ''}">
            <div class="plan-item-main">
                <span class="plan-item-icon">🔔</span>
                <div>
                    <h4 class="plan-item-title">${title}</h4>
                    <p class="plan-item-sub">${timeStr} ${typeStr}</p>
                </div>
            </div>
            <span class="plan-item-badge ${isDone ? 'completed' : 'pending'}">${isDone ? (t("completed") || "Completed") : (t("pending") || "Pending")}</span>
            ${!isDone ? `<button type="button" class="priority-btn plan-action-btn" onclick="markReminderDoneFromPlan('${rem.id}', this)">${t("markAsDone") || "✓ Mark as Done"}</button>` : ''}
        </div>
    `;
}

async function markReminderDoneFromPlan(reminderId, btnElem) {
    if (btnElem && btnElem.disabled) return;
    if (btnElem) {
        btnElem.disabled = true;
        btnElem.textContent = "Saving...";
    }
    try {
        await updateDoc(doc(db, "reminders", reminderId), {
            completed: true,
            completedAt: serverTimestamp()
        });
        showFeedbackMessage("success", "Reminder marked as completed!");
        loadPatientDailyPlan();
    } catch (err) {
        console.error("Error completing reminder from daily plan:", err);
        showFeedbackMessage("error", "Could not mark reminder done.");
        if (btnElem) {
            btnElem.disabled = false;
            btnElem.textContent = t("markAsDone") || "✓ Mark as Done";
        }
    }
}
window.markReminderDoneFromPlan = markReminderDoneFromPlan;

function setupUserInterface(actualRole, userData) {
    currentUserRole = actualRole;
    currentUserData = userData;

    // Hide login screen
    const loginSection = document.getElementById("loginSection");
    if (loginSection) {
        loginSection.style.display = "none";
    }

    // Show application
    const appHeader = document.getElementById("appHeader");
    const appMain = document.getElementById("appMain");
    if (appHeader) appHeader.style.display = "block";
    if (appMain) appMain.style.display = "block";

    // Update user badge and show logout button
    const email = auth.currentUser?.email || "";
    if (userBadge) {
        userBadge.style.display = "inline-flex";
        if (actualRole === "patient") {
            userBadge.textContent = "👴 Patient" + (email ? ` (${email})` : "");
        } else if (actualRole === "caregiver") {
            userBadge.textContent = "👨‍👩‍👧 Caregiver" + (email ? ` (${email})` : "");
        }
    }
    if (logoutBtn) {
        logoutBtn.style.display = "inline-block";
    }

    // Role-based interface
    const caregiverSection = document.getElementById("caregiverSection");
    const caregiverBtn = document.getElementById("caregiverBtn");
    const cognitiveActivityCard = document.getElementById("cognitiveActivityCard");
    const createReminderSection = document.getElementById("createReminderSection");

    if (actualRole === "patient") {
        if (cognitiveActivityCard) {
            cognitiveActivityCard.style.display = "flex";
        }
        if (caregiverBtn && caregiverBtn.parentElement) {
            caregiverBtn.parentElement.style.display = "none";
        }
        if (caregiverSection) {
            caregiverSection.style.display = "none";
        }
        if (createReminderSection) {
            createReminderSection.style.display = "none";
        }
        showPatientView("dashboard");
        console.log("👴 Patient view enabled. Scoped patient ID:", getActivePatientId());
    } else if (actualRole === "caregiver") {
        if (createReminderSection) {
            createReminderSection.style.display = "block";
        }
        if (caregiverSection) {
            caregiverSection.style.display = "block";
        }
        showCaregiverView("dashboard");
        console.log("👨‍👩‍👧 Caregiver view enabled. Scoped patient ID:", getActivePatientId());
    }
}

function resetToLoggedOutState() {
    currentUserRole = null;
    currentUserData = null;

    const loginSection = document.getElementById("loginSection");
    const appHeader = document.getElementById("appHeader");
    const appMain = document.getElementById("appMain");

    if (loginSection) loginSection.style.display = "block";

    const floatingContainer = document.getElementById("floatingAssistantContainer");
    const floatingPanel = document.getElementById("floatingAssistantPanel");
    if (floatingContainer) floatingContainer.style.display = "none";
    if (floatingPanel) floatingPanel.style.display = "none";
    if (appHeader) appHeader.style.display = "none";
    if (appMain) appMain.style.display = "none";

    if (userBadge) {
        userBadge.style.display = "none";
        userBadge.textContent = "";
    }
    if (logoutBtn) {
        logoutBtn.style.display = "none";
    }

    const sectionsToHide = [
        "todaysPrioritiesSection",
        "quickAccessSection",
        "patientSummaryGrid",
        "mindfulPauseSection",
        "dailyPlanSection",
        "memoryGame",
        "attentionGame",
        "routineRecallGame",
        "patternGame",
        "moodCheckin",
        "remindersSection",
        "createReminderSection",
        "progressSection",
        "caregiverSection",
        "assistantSection"
    ];
    sectionsToHide.forEach((id) => {
        const el = document.getElementById(id);
        if (el) el.style.display = "none";
    });

    if (loginEmail) loginEmail.value = "";
    if (loginPassword) loginPassword.value = "";
    if (loginMessage) loginMessage.textContent = "";
}

// Session persistence listener (P0.2)
onAuthStateChanged(auth, async (user) => {
    if (user) {
        console.log("🔄 Session found for:", user.email);
        try {
            const userDoc = await getDoc(doc(db, "users", user.uid));
            if (userDoc.exists()) {
                const userData = userDoc.data();
                setupUserInterface(userData.role, userData);
                if (pendingFCMToken) {
                    await saveFCMToken(pendingFCMToken);
                    pendingFCMToken = null;
                }
            } else {
                console.warn("⚠️ User authenticated but has no Firestore profile record.");
                resetToLoggedOutState();
            }
        } catch (error) {
            console.error("Session restore error:", error);
        }
    } else {
        console.log("🔒 User is not authenticated.");
        resetToLoggedOutState();
    }
});

if (logoutBtn) {
    logoutBtn.addEventListener("click", async () => {
        try {
            await signOut(auth);
            resetToLoggedOutState();
            console.log("🚪 User logged out successfully.");
        } catch (error) {
            console.error("Sign-out error:", error);
        }
    });
}

async function loginUser(role) {

    const email = loginEmail.value.trim();
    const password = loginPassword.value.trim();

    if (!email || !password) {
        loginMessage.textContent =
            "Please enter your email and password.";
        return;
    }

    loginMessage.textContent =
        "Signing in...";

    try {

        const userCredential =
            await signInWithEmailAndPassword(
                auth,
                email,
                password
            );

        const user = userCredential.user;

        // Get user's role from Firestore
        const userDoc = await getDoc(
            doc(db, "users", user.uid)
        );

        if (!userDoc.exists()) {

            loginMessage.textContent =
                "User role not found.";

            await signOut(auth);
            return;
        }

        const userData = userDoc.data();
        const actualRole = userData.role;

        console.log(
            "Logged in:",
            user.email,
            "Role:",
            actualRole
        );

        // Check selected login against actual role
        if (actualRole !== role) {

            loginMessage.textContent =
                "This account is not registered for this login.";

            await signOut(auth);
            return;
        }

        loginMessage.textContent =
            "Login successful!";

        if (pendingFCMToken) {
            await saveFCMToken(pendingFCMToken);
            pendingFCMToken = null;
        }

        setupUserInterface(actualRole, userData);

    } catch (error) {

        console.error(
            "Login error:",
            error
        );

        loginMessage.textContent =
            "Invalid email or password.";
    }
}


document
    .getElementById("patientLoginBtn")
    .addEventListener("click", () => {

        loginUser("patient");

    });


document
    .getElementById("caregiverLoginBtn")
    .addEventListener("click", () => {

        loginUser("caregiver");

    });

// ================================
// CAREGIVER AREA BUTTON
// ================================

const caregiverAreaButton =
    document.getElementById("caregiverBtn");

if (caregiverAreaButton) {

    caregiverAreaButton.addEventListener("click", () => {

        console.log("🔥 CAREGIVER AREA CLICKED");

        const caregiverSection =
            document.getElementById("caregiverSection");

        const createReminderSection =
            document.getElementById("createReminderSection");

        if (caregiverSection) {
            caregiverSection.style.display = "block";
        }

        if (createReminderSection) {
            createReminderSection.style.display = "block";
        }

        console.log("🔔 Create Reminder opened.");

    });

}
        // Initialize App Check
        initializeAppCheck(app, {
            provider: new ReCaptchaEnterpriseProvider(
                "6LcWg5stAAAAALngrRuWkZcle7fyTtMweFFZOOgM"
            ),
            isTokenAutoRefreshEnabled: true
        });


        // Analytics
        

        // Gemini
        const ai = getAI(app, {
            backend: new GoogleAIBackend()
        });

        const model = getGenerativeModel(ai, {
            model: "gemini-3.5-flash"
        });


        console.log("Cognitive Gaming Firebase + Gemini ready!");

        const assistantLanguages = {
            en: "English",
            as: "Assamese",
            "mni-Mtei": "Meiteilon (Manipuri), using Meetei Mayek script",
            lus: "Mizo",
            bn: "Bengali",
            ne: "Nepali",
            hi: "Hindi"
        };

        const speechLanguages = {
        recommendedForYou: "I tana rawtna",
        tryThisNext: "Heng thiltih hi ti leh rawh.",
        basedOnRecentActivity: "I thiltih hnuhnung bera innghatin",
        activityNotRecentlyTried: "Tukina hian heng thiltih hi i ti ngai lo.",
        activityNeverAttempted: "Heng thiltih hi i ti ngai miah lo.",
        activityVariety: "Hian i thiltihah inthlaichhiahna a siam.",
        noActivityHistory: "Tan nan heng thiltih hi ti rawh.",
        recommendedForYou: "নহাফমদা তৌনবগীদমক খনব",
        tryThisNext: "মথংদা থবক অসি তৌবীয়ু।",
        basedOnRecentActivity: "নহাকগী হৌখিবা থবকশিংদা য়ুমফম ওইবা",
        activityNotRecentlyTried: "নহাক্না হন্দক্তা থবক অসি তৌদ্রি।",
        activityNeverAttempted: "নহাক্না হৌজিকফাওবা থবক অসি তৌদ্রি।",
        activityVariety: "মসিনা নহাকগী থবকশিংদা খেত্নবা লৈহনগনি।",
        noActivityHistory: "হৌনবগীদমক থবক অসি তৌবীয়ু।",
        recommendedForYou: "तपाईंको लागि सिफारिस गरिएको",
        tryThisNext: "अर्को यो गतिविधि प्रयास गर्नुहोस्।",
        basedOnRecentActivity: "तपाईंको हालैको गतिविधिमा आधारित",
        activityNotRecentlyTried: "तपाईंले हालै यो गतिविधि गर्नुभएको छैन।",
        activityNeverAttempted: "तपाईंले अझै यो गतिविधि प्रयास गर्नुभएको छैन।",
        activityVariety: "यसले तपाईंको हालैका गतिविधिहरूमा विविधता दिन्छ।",
        noActivityHistory: "सुरु गर्न यो गतिविधि प्रयास गर्नुहोस्।",
        recommendedForYou: "আপনার জন্য প্রস্তাবিত",
        tryThisNext: "পরবর্তীতে এই কার্যকলাপটি চেষ্টা করুন।",
        basedOnRecentActivity: "আপনার সাম্প্রতিক কার্যকলাপের উপর ভিত্তি করে",
        activityNotRecentlyTried: "আপনি সম্প্রতি এই কার্যকলাপটি করেননি।",
        activityNeverAttempted: "আপনি এখনও এই কার্যকলাপটি চেষ্টা করেননি।",
        activityVariety: "এটি আপনার সাম্প্রতিক কার্যকলাপে বৈচিত্র্য আনে।",
        noActivityHistory: "শুরু করতে এই কার্যকলাপটি চেষ্টা করুন।",
        recommendedForYou: "আপোনাৰ বাবে চুপাৰিশ কৰা হৈছে",
        tryThisNext: "পাছত এই কাৰ্যকলাপটো চেষ্টা কৰক।",
        basedOnRecentActivity: "আপোনাৰ শেহতীয়া কাৰ্যকলাপৰ ওপৰত আধাৰিত",
        activityNotRecentlyTried: "আপুনি শেহতীয়াকৈ এই কাৰ্যকলাপটো কৰা নাই।",
        activityNeverAttempted: "আপুনি এতিয়ালৈকে এই কাৰ্যকলাপটো চেষ্টা কৰা নাই।",
        activityVariety: "ই আপোনাৰ শেহতীয়া কাৰ্যকলাপত বৈচিত্ৰ্য আনিব।",
        noActivityHistory: "আৰম্ভ কৰিবলৈ এই কাৰ্যকলাপটো চেষ্টা কৰক।",
        recommendedForYou: "आपके लिए अनुशंसित",
        tryThisNext: "आगे इस गतिविधि को आज़माएं।",
        basedOnRecentActivity: "आपकी हालिया गतिविधि के आधार पर",
        activityNotRecentlyTried: "आपने हाल ही में यह गतिविधि नहीं की है।",
        activityNeverAttempted: "आपने अभी तक यह गतिविधि नहीं आज़माई है।",
        activityVariety: "यह आपकी हालिया गतिविधियों में विविधता लाता है।",
        noActivityHistory: "शुरू करने के लिए इस गतिविधि को आज़माएं।",
            en: "en-IN",
            as: "as-IN",
            "mni-Mtei": "mni-Mtei-IN",
            lus: "lus-IN",
            bn: "bn-IN",
            ne: "ne-NP",
            hi: "hi-IN"
        };

        const promptElement = document.getElementById("prompt");
        const responseElement = document.getElementById("response");
        const listenButton = document.getElementById("startListening");
        const repeatButton = document.getElementById("repeatResponse");
        const voiceStatus = document.getElementById("voiceStatus");
        const SpeechRecognition =
            window.SpeechRecognition || window.webkitSpeechRecognition;

        function selectedSpeechLanguage() {
            const language = document.getElementById("languageSelect").value;
            return speechLanguages[language] || "en-IN";
        }

        function setVoiceStatus(message) {
            voiceStatus.textContent = message;
        }

        function speakResponse() {
            const text = responseElement.textContent.trim();
            const language = selectedSpeechLanguage();

            if (!text || text === "The assistant's response will appear here.") {
                setVoiceStatus("Ask a question first, then you can hear the answer aloud.");
                return;
            }

            if (!("speechSynthesis" in window)) {
                setVoiceStatus("Reading answers aloud is not available in this browser.");
                return;
            }

            const availableVoices = window.speechSynthesis.getVoices();
            const languageCode = language.split("-")[0].toLowerCase();
            if (availableVoices.length && !availableVoices.some((voice) =>
                voice.lang.toLowerCase().split("-")[0] === languageCode
            )) {
                setVoiceStatus("This browser does not have a voice for the selected language. The answer is available as text.");
                return;
            }

            window.speechSynthesis.cancel();
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = language;
            utterance.rate = 0.85;
            utterance.onstart = () => setVoiceStatus("Reading the answer aloud…");
            utterance.onend = () => setVoiceStatus("Finished reading the answer.");
            utterance.onerror = () => setVoiceStatus("I could not read that answer aloud.");
            window.speechSynthesis.speak(utterance);
        }

        if (!SpeechRecognition) {
            listenButton.disabled = true;
            setVoiceStatus("Voice input is not available in this browser. You can still type a question.");
        } else {
            const recognition = new SpeechRecognition();
            let shouldSubmitVoiceQuestion = false;
            recognition.continuous = false;
            recognition.interimResults = true;

            listenButton.addEventListener("click", () => {
                recognition.lang = selectedSpeechLanguage();
                shouldSubmitVoiceQuestion = false;
                try {
                    recognition.start();
                } catch (error) {
                    setVoiceStatus("Voice input is already starting. Please wait a moment.");
                }
            });

            recognition.onstart = () => {
                listenButton.classList.add("is-listening");
                listenButton.setAttribute("aria-pressed", "true");
                listenButton.textContent = "Listening…";
                setVoiceStatus("Listening. Speak your question now.");
            };

            recognition.onresult = (event) => {
                let transcript = "";
                for (let index = event.resultIndex; index < event.results.length; index += 1) {
                    transcript += event.results[index][0].transcript;
                }
                promptElement.value = transcript.trim();
                setVoiceStatus("I heard: “" + promptElement.value + "”");
                shouldSubmitVoiceQuestion = Array.from(event.results)
                    .some((result) => result.isFinal);
            };

            recognition.onerror = (event) => {
                shouldSubmitVoiceQuestion = false;
                let message = "I could not hear that. Please try again or type your question.";
                if (event.error === "not-allowed") {
                    message = "Microphone access was not allowed. Please enable it and try again.";
                } else if (event.error === "language-not-supported") {
                    message = "Voice input is not available for the selected language in this browser. Please type your question.";
                }
                setVoiceStatus(message);
            };

            recognition.onend = () => {
                listenButton.classList.remove("is-listening");
                listenButton.setAttribute("aria-pressed", "false");
                listenButton.textContent = "Start listening";
                if (shouldSubmitVoiceQuestion && promptElement.value.trim()) {
                    shouldSubmitVoiceQuestion = false;
                    setVoiceStatus("Sending your question to the assistant…");
                    document.getElementById("askGemini").click();
                }
            };
        }

        repeatButton.addEventListener("click", speakResponse);

        // Gemini Assistant
        document
            .getElementById("askGemini")
            .addEventListener("click", async () => {

                const prompt = promptElement.value.trim();


                if (!prompt) {
                    responseElement.textContent =
                        "Please type a question first.";
                    return;
                }


                responseElement.textContent =
                    "The assistant is thinking...";


                try {

                    const selectedLanguage =
                        document.getElementById("languageSelect").value;

                    const responseLanguage =
                        assistantLanguages[selectedLanguage] || "English";

                    const result =
                        await model.generateContent(
                            `You are a friendly memory assistance AI
                             for an elderly user.

                             Give simple, clear and supportive answers.
                             Do not diagnose medical conditions.
                             Do not give medical treatment instructions.
                             Respond only in ${responseLanguage}.

                             User question:
                             ${prompt}`
                        );


                    responseElement.textContent =
                        result.response.text();
                    repeatButton.disabled = false;
                    speakResponse();


                } catch (error) {

                    console.error("Gemini error:", error);

                    responseElement.textContent =
                        "Sorry, the assistant could not respond right now.";
                }

            });


        // ================================
// REMINDERS (P4.2 SILENT REFRESH & P6.3 CATEGORIES)
// ================================

let activeReminderFilter = "all";

function getReminderCategoryDetails(typeStr) {
    const raw = (typeStr || "").toLowerCase().trim();
    if (raw.includes("medication") || raw.includes("medicine") || raw.includes("pill") || raw.includes("dose")) {
        return { key: "medicationCategory", icon: "💊", label: t("medicationCategory") || "Medication" };
    }
    if (raw.includes("appointment") || raw.includes("doctor") || raw.includes("clinic") || raw.includes("visit")) {
        return { key: "appointmentCategory", icon: "🩺", label: t("appointmentCategory") || "Appointment" };
    }
    if (raw.includes("personal") || raw.includes("call") || raw.includes("family") || raw.includes("walk")) {
        return { key: "personalCategory", icon: "📝", label: t("personalCategory") || "Personal" };
    }
    if (raw.includes("activity") || raw.includes("game") || raw.includes("exercise") || raw.includes("puzzle")) {
        return { key: "activityCategory", icon: "🧠", label: t("activityCategory") || "Activity" };
    }
    if (raw.includes("hydration") || raw.includes("water") || raw.includes("drink")) {
        return { key: "hydrationCategory", icon: "💧", label: t("hydrationCategory") || "Hydration" };
    }
    return { key: "otherCategory", icon: "📌", label: typeStr ? typeStr : (t("otherCategory") || "Other") };
}

async function refreshRemindersSilently(isManualNav = false) {
    const remindersSection = document.getElementById("remindersSection");
    const remindersContent = document.getElementById("remindersContent");

    if (!remindersSection || !remindersContent) return;

    if (isManualNav) {
        showPatientView("remindersSection");
        remindersContent.innerHTML = `<div class="dashboard-loading-skeleton" role="status">${t("loadingReminders") || "Loading reminders..."}</div>`;
    } else {
        if (remindersSection.style.display === "none") return;
    }

    // Wire filter buttons if present
    const filterBtns = document.querySelectorAll(".reminder-filter-btn");
    filterBtns.forEach((btn) => {
        btn.onclick = (e) => {
            filterBtns.forEach((b) => b.classList.remove("active"));
            e.target.classList.add("active");
            activeReminderFilter = e.target.getAttribute("data-filter") || "all";
            refreshRemindersSilently(false);
        };
    });

    try {
        const reminderQuery = query(
            collection(db, "reminders"),
            where("patientId", "==", getActivePatientId())
        );

        const snapshot = await getDocs(reminderQuery);

        if (snapshot.empty) {
            remindersContent.innerHTML = `<p class="empty-group-msg">${t("noRemindersFound") || "No reminders found."}</p>`;
            return;
        }

        const reminders = [];
        snapshot.forEach((doc) => {
            reminders.push({
                id: doc.id,
                ...doc.data()
            });
        });

        // Sort reminders by date and time
        reminders.sort((a, b) => {
            const getDateTime = (reminder) => {
                if (reminder.date && reminder.time) {
                    return new Date(`${reminder.date}T${reminder.time}`);
                }
                if (reminder.time && reminder.time.toDate) {
                    return reminder.time.toDate();
                }
                return new Date(0);
            };
            return getDateTime(a) - getDateTime(b);
        });

        let filteredReminders = reminders;
        if (activeReminderFilter === "pending") {
            filteredReminders = reminders.filter((r) => !r.completed);
        } else if (activeReminderFilter === "completed") {
            filteredReminders = reminders.filter((r) => r.completed);
        }

        if (filteredReminders.length === 0) {
            remindersContent.innerHTML = `<p class="empty-group-msg">${t("noRemindersFound") || "No reminders found for this filter."}</p>`;
            return;
        }

        const now = new Date();
        let html = "";

        filteredReminders.forEach((reminder) => {
            let reminderDate;
            let reminderTime;
            let reminderDateTime;

            if (reminder.date && reminder.time) {
                reminderDate = reminder.date;
                reminderTime = reminder.time;
                reminderDateTime = new Date(`${reminder.date}T${reminder.time}`);
            } else if (reminder.time && reminder.time.toDate) {
                const oldDate = reminder.time.toDate();
                reminderDate = oldDate.toISOString().split("T")[0];
                reminderTime = oldDate.toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit"
                });
                reminderDateTime = oldDate;
            } else {
                reminderDate = "-";
                reminderTime = "-";
                reminderDateTime = new Date(0);
            }

            const isPast = reminderDateTime < now;
            const isToday = reminder.date === new Date().toISOString().split("T")[0];
            const catDetails = getReminderCategoryDetails(reminder.type);

            let statusText = t("upcoming") || "Upcoming";
            let statusStyle = "background: #eef3ff; color: #3157d5;";
            let actionButtonHTML = "";

            if (reminder.completed) {
                statusText = t("completed") || "✅ Completed";
                statusStyle = "background: #e8f7ee; color: #23864b;";

                const completedAtText = reminder.completedAt?.toDate
                    ? reminder.completedAt.toDate().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                    : "";

                actionButtonHTML = `
                    <button disabled style="
                        background: #e8f7ee;
                        color: #23864b;
                        border: 1px solid #b7ebc9;
                        padding: 8px 18px;
                        border-radius: 10px;
                        font-size: 15px;
                        font-weight: 700;
                        cursor: default;
                        box-shadow: none;
                        min-height: 42px;
                    ">
                        ${t("done") || "✅ Done"} ${completedAtText ? `(${completedAtText})` : ""}
                    </button>
                `;
            } else {
                const isDue = reminderDateTime <= now && reminderDateTime > new Date(now.getTime() - 5 * 60 * 1000);

                if (isDue) {
                    statusText = t("dueNow") || "🔔 Due Now";
                    statusStyle = "background: #fff3cd; color: #946200;";
                } else if (isPast) {
                    statusText = t("passed") || "Passed";
                    statusStyle = "background: #f1f3f5; color: #657184;";
                } else if (isToday) {
                    statusText = t("today") || "Today";
                    statusStyle = "background: #e8f7ee; color: #23864b;";
                }

                actionButtonHTML = `
                    <button type="button" class="markDoneReminderBtn" data-id="${reminder.id}" style="
                        background: var(--blue);
                        color: #ffffff;
                        border: none;
                        padding: 8px 18px;
                        border-radius: 10px;
                        font-size: 15px;
                        font-weight: 700;
                        cursor: pointer;
                        box-shadow: 0 2px 6px rgba(36, 88, 198, 0.2);
                        min-height: 42px;
                        display: inline-flex;
                        align-items: center;
                        gap: 6px;
                    ">
                        ${t("markAsDone") || "✓ Mark as Done"}
                    </button>
                `;
            }

            html += `
                <div style="
                    background: white;
                    border: 1px solid #dce2ea;
                    border-radius: 18px;
                    padding: 20px;
                    margin-top: 16px;
                    box-shadow: 0 5px 15px rgba(0,0,0,0.05);
                ">
                    <div style="margin-bottom: 8px;">
                        <span class="category-badge">${catDetails.icon} ${escapeHtml(catDetails.label)}</span>
                    </div>

                    <div style="
                        display: flex;
                        justify-content: space-between;
                        align-items: flex-start;
                        gap: 15px;
                    ">
                        <div>
                            <h3 style="
                                margin: 0 0 8px;
                                font-size: 22px;
                            ">
                                🔔 ${escapeHtml(reminder.title)}
                            </h3>
                            <p style="
                                margin: 0;
                                color: #526070;
                                font-size: 16px;
                            ">
                                ${escapeHtml(reminder.type || "Reminder")}
                            </p>
                        </div>
                        <span style="
                            ${statusStyle}
                            padding: 7px 12px;
                            border-radius: 20px;
                            font-size: 14px;
                            font-weight: bold;
                            white-space: nowrap;
                        ">
                            ${statusText}
                        </span>
                    </div>

                    <div style="
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        flex-wrap: wrap;
                        gap: 12px;
                        margin-top: 18px;
                    ">
                        <div style="display: flex; gap: 12px; flex-wrap: wrap;">
                            <div style="
                                background: #f4f7fb;
                                padding: 10px 14px;
                                border-radius: 10px;
                                font-size: 15px;
                            ">
                                📅 ${reminderDate}
                            </div>
                            <div style="
                                background: #f4f7fb;
                                padding: 10px 14px;
                                border-radius: 10px;
                                font-size: 15px;
                            ">
                                ⏰ ${reminderTime}
                            </div>
                        </div>
                        <div>
                            ${actionButtonHTML}
                        </div>
                    </div>
                </div>
            `;
        });

        // Avoid unnecessary DOM replacement if HTML has not changed
        if (remindersContent.innerHTML !== html) {
            remindersContent.innerHTML = html;
        }

    } catch (error) {
        console.error("Reminder loading error:", error);
        if (isManualNav) {
            remindersContent.innerHTML = "<p>❌ Could not load reminders.</p>";
        }
    }
}

const reminderBtn = document.getElementById("reminderBtn");
if (reminderBtn) {
    reminderBtn.addEventListener("click", () => {
        // remindersContent.innerHTML = "Loading reminders...";
        refreshRemindersSilently(true);
    });
}

// Handle reminder completion (P1.3)
document.addEventListener("click", async (event) => {
    const markDoneBtn = event.target.closest(".markDoneReminderBtn");
    if (!markDoneBtn) return;

    const reminderId = markDoneBtn.dataset.id;
    if (!reminderId) return;

    // Prevent duplicate clicks
    if (markDoneBtn.disabled) return;
    markDoneBtn.disabled = true;
    const originalText = markDoneBtn.textContent;
    markDoneBtn.textContent = "Saving...";

    try {
        await updateDoc(doc(db, "reminders", reminderId), {
            completed: true,
            completedAt: serverTimestamp()
        });

        // Update UI immediately
        markDoneBtn.style.background = "#e8f7ee";
        markDoneBtn.style.color = "#23864b";
        markDoneBtn.style.border = "1px solid #b7ebc9";
        markDoneBtn.style.boxShadow = "none";
        markDoneBtn.style.cursor = "default";
        markDoneBtn.textContent = "✅ Done";

        // Update status badge in parent card
        const card = markDoneBtn.closest("div[style*='border-radius: 18px']");
        if (card) {
            const statusBadge = card.querySelector("span[style*='border-radius: 20px']");
            if (statusBadge) {
                statusBadge.textContent = "✅ Completed";
                statusBadge.style.background = "#e8f7ee";
                statusBadge.style.color = "#23864b";
            }
        }
    } catch (error) {
        console.error("Error marking reminder as done:", error);
        markDoneBtn.disabled = false;
        markDoneBtn.textContent = originalText;
        showFeedbackMessage("error", "Could not update reminder. Please try again.");
    }
});
    // ================================
// AUTO CHECK REMINDERS
// ================================

let lastReminderNotification = "";

async function checkDueReminders() {

    try {

        const reminderQuery = query(
            collection(db, "reminders"),
            where("patientId", "==", getActivePatientId())
        );

        const snapshot =
            await getDocs(reminderQuery);

        const now = new Date();

        snapshot.forEach((doc) => {

            const reminder = doc.data();

            if (!reminder.date || !reminder.time) {
                return;
            }

            const reminderDateTime =
                new Date(
                    `${reminder.date}T${reminder.time}`
                );

            const difference =
                now - reminderDateTime;

            // Reminder is due within 1 minute after its scheduled time
            if (
                difference >= 0 &&
                difference < 60000
            ) {

                const notificationId =
                    `${doc.id}-${reminder.date}-${reminder.time}`;

                // Prevent repeated notifications
                if (
                    lastReminderNotification !==
                    notificationId
                ) {

                    lastReminderNotification =
                        notificationId;

                    showFeedbackMessage(
                        "info",
                        `🔔 ${t("dueNow") || "Due Now"}: ${reminder.title} (${reminder.type || "Reminder"})`
                    );

                }

            }

        });

    } catch (error) {

        console.error(
            "Reminder notification error:",
            error
        );

    }
}


// Check every 60 seconds (P4.2 Silent Refresh)
setInterval(() => {
    checkDueReminders();

    const remindersSection = document.getElementById("remindersSection");
    if (remindersSection && remindersSection.style.display !== "none") {
        refreshRemindersSilently(false);
    }
}, 60000);

// ==================================================
// PATIENT PROGRESS & HISTORY LOGIC (P3.2)
// ==================================================

function getFriendlyActivityName(rawType) {
    if (!rawType) return t("cognitiveActivity") || "Activity";
    const typeMap = {
        "memory_sequence": t("activityMemorySequence") || "Memory Sequence",
        "attention_challenge": t("activityAttentionChallenge") || "Attention Challenge",
        "daily_routine_recall": t("activityRoutineRecall") || "Daily Routine Recall",
        "pattern_recognition": t("activityPatternRecognition") || "Pattern Recognition"
    };
    return typeMap[rawType] || rawType.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
}


async function loadPatientProgressView() {
    const progressSection = document.getElementById("progressSection");
    const progressContent = document.getElementById("progressContent");

    if (!progressSection || !progressContent) return;

    showPatientView("progressSection");

    // Skeleton / Loading State
    progressContent.innerHTML = `
        <div class="dashboard-loading-skeleton" role="status">
            ${t("loadingProgress") || "Loading progress..."}
        </div>
    `;

    try {
        const patientId = getActivePatientId();
        const activityQuery = query(
            collection(db, "activityResults"),
            where("patientId", "==", patientId)
        );

        const snapshot = await getDocs(activityQuery);

        // Empty State Handling (P3.2 Feature 9)
        if (snapshot.empty) {
            progressContent.innerHTML = `
                <div class="progress-empty-card" role="region" aria-label="No Activity Results">
                    <div class="progress-empty-icon">📭</div>
                    <h3 class="progress-empty-title">${t("noActivitiesYetTitle") || "No Activities Completed Yet"}</h3>
                    <p class="progress-empty-sub">${t("noActivitiesYetSub") || "Complete your first cognitive activity to start tracking your progress!"}</p>
                    <div style="display: flex; gap: 12px; justify-content: center; flex-wrap: wrap;">
                        <button type="button" class="primary-continue-btn" onclick="showPatientView('memoryGame')">
                            ${t("startFirstActivity") || "▶ Start Activity"}
                        </button>
                        <button type="button" class="status-action-btn" onclick="showPatientView('dashboard')">
                            ${t("backToDashboard") || "← Back to Dashboard"}
                        </button>
                    </div>
                </div>
            `;
            return;
        }

        // Process data
        const activities = [];
        let totalScore = 0;
        let bestScore = 0;

        snapshot.forEach((doc) => {
            const data = doc.data();
            const score = Number(data.score) || 0;
            totalScore += score;
            if (score > bestScore) bestScore = score;

            activities.push({
                ...data,
                score: score,
                timestampDate: data.timestamp && data.timestamp.toDate ? data.timestamp.toDate() : new Date(0)
            });
        });

        // Sort newest activity first
        activities.sort((a, b) => b.timestampDate - a.timestampDate);

        const activityCount = activities.length;
        const averageScore = Math.round(totalScore / activityCount);
        const latestActivity = activities[0];

        // Calculate 7-Day Calendar Participation
        const dayCounts = [0, 0, 0, 0, 0, 0, 0];
        const dayLabels = [];
        const dayDates = [];
        const today = new Date();

        for (let i = 6; i >= 0; i--) {
            const d = new Date(today);
            d.setDate(d.getDate() - i);
            const dateStr = d.toISOString().split("T")[0];
            dayDates.push(dateStr);

            const dayName = d.toLocaleDateString(getCurrentLanguage(), { weekday: "short" });
            const dateName = `${d.getMonth() + 1}/${d.getDate()}`;
            dayLabels.push({ day: dayName, date: dateName, fullDate: dateStr });
        }

        activities.forEach((act) => {
            if (act.timestampDate && act.timestampDate.getTime() > 0) {
                const actDateStr = act.timestampDate.toISOString().split("T")[0];
                const dayIndex = dayDates.indexOf(actDateStr);
                if (dayIndex !== -1) {
                    dayCounts[dayIndex]++;
                }
            }
        });

        const maxDayCount = Math.max(...dayCounts, 4);
        const total7DayActivities = dayCounts.reduce((sum, c) => sum + c, 0);

        let chartBarsHTML = "";
        dayLabels.forEach((info, idx) => {
            const count = dayCounts[idx];
            const fillPercent = Math.round((count / maxDayCount) * 100);
            chartBarsHTML += `
                <div class="chart-bar-col" role="img" aria-label="${info.day} ${info.date}: ${count} activities">
                    <span class="chart-bar-val">${count > 0 ? count : ''}</span>
                    <div class="chart-bar-track">
                        <div class="chart-bar-fill ${count > 0 ? 'has-count' : ''}" style="height: ${fillPercent}%;"></div>
                    </div>
                    <span class="chart-bar-day">${info.day}</span>
                    <span class="chart-bar-date">${info.date}</span>
                </div>
            `;
        });

        const chartSummaryText = dayLabels.map((d, i) => `${d.day} ${d.date}: ${dayCounts[i]}`).join(', ');

        const chartHTML = `
            <div class="caregiver-chart-card" role="region" aria-label="7-Day Activity Participation Chart">
                <div class="chart-header">
                    <h3>${t("weeklyParticipationTitle") || "📈 7-Day Activity Participation"}</h3>
                    <span class="chart-total-badge">Total: ${total7DayActivities}</span>
                </div>
                <p class="sr-only">
                    Activity count over the last 7 days: ${chartSummaryText}. Total: ${total7DayActivities}.
                </p>
                <div class="chart-bars-wrapper">
                    ${chartBarsHTML}
                </div>
            </div>
        `;

        // Render Summary Cards
        const summaryCardsHTML = `
            <div class="progress-summary-grid">
                <div class="progress-stat-card">
                    <div class="progress-stat-icon">🧠</div>
                    <div class="progress-stat-val">${activityCount}</div>
                    <div class="progress-stat-label">${t("totalActivities") || "Total Activities"}</div>
                </div>
                <div class="progress-stat-card">
                    <div class="progress-stat-icon">📈</div>
                    <div class="progress-stat-val">${averageScore}</div>
                    <div class="progress-stat-label">${t("recentAverageScore") || "Average Score"}</div>
                </div>
                <div class="progress-stat-card">
                    <div class="progress-stat-icon">🏆</div>
                    <div class="progress-stat-val">${bestScore}</div>
                    <div class="progress-stat-label">${t("bestScore") || "Best Score"}</div>
                </div>
                <div class="progress-stat-card">
                    <div class="progress-stat-icon">📅</div>
                    <div class="progress-stat-val">${total7DayActivities}</div>
                    <div class="progress-stat-label">7-Day Total</div>
                </div>
            </div>
        `;

        // Render Latest Activity Featured Hero
        const latestDateStr = latestActivity.timestampDate.getTime() > 0 
            ? latestActivity.timestampDate.toLocaleString()
            : "Recently";
        const latestModeStr = latestActivity.mode === "cultural"
            ? (t("culturalMode") || "🌿 Cultural Objects")
            : latestActivity.mode === "standard"
            ? (t("standardMode") || "🔢 Standard Numbers")
            : "";

        const latestHeroHTML = `
            <div class="latest-activity-hero" role="region" aria-label="Latest Activity Highlight">
                <div class="latest-activity-title">
                    <span>${t("latestActivityHighlight") || "🌟 Latest Activity"}</span>
                    <span class="history-score-badge">Score: ${latestActivity.score}</span>
                </div>
                <h4 style="margin: 4px 0 10px; font-size: 20px; color: #1e293b;">
                    🧠 ${getFriendlyActivityName(latestActivity.activityType)}
                </h4>
                <div class="history-details-row">
                    ${latestActivity.difficulty ? `<span>🎯 ${t("difficultyLabel") || "Difficulty"}: <strong>${latestActivity.difficulty}</strong></span>` : ''}
                    ${latestModeStr ? `<span class="history-mode-tag">${latestModeStr}</span>` : ''}
                    <span>🕒 ${t("dateLabel") || "Date"}: ${latestDateStr}</span>
                </div>
            </div>
        `;

        // Function to build history item HTML
        const renderHistoryItems = (items) => {
            return items.map((act) => {
                const dateStr = act.timestampDate.getTime() > 0 ? act.timestampDate.toLocaleString() : "Recently";
                const modeStr = act.mode === "cultural"
                    ? (t("culturalMode") || "🌿 Cultural Objects")
                    : act.mode === "standard"
                    ? (t("standardMode") || "🔢 Standard Numbers")
                    : "";

                return `
                    <div class="history-item-card">
                        <div class="history-header-row">
                            <h4 class="history-item-name">🧠 ${getFriendlyActivityName(act.activityType)}</h4>
                            <span class="history-score-badge">Score: ${act.score}</span>
                        </div>
                        <div class="history-details-row">
                            ${act.difficulty ? `<span>🎯 ${t("difficultyLabel") || "Difficulty"}: <strong>${act.difficulty}</strong></span>` : ''}
                            ${act.attempts ? `<span>🔄 ${t("attemptsLabel") || "Attempts"}: <strong>${act.attempts}</strong></span>` : ''}
                            ${modeStr ? `<span class="history-mode-tag">${modeStr}</span>` : ''}
                            <span>🕒 ${dateStr}</span>
                        </div>
                    </div>
                `;
            }).join("");
        };

        const initialHistoryLimit = 10;
        const visibleItems = activities.slice(0, initialHistoryLimit);
        const remainingItems = activities.slice(initialHistoryLimit);

        let historyListHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px; margin-top: 24px;">
                <h3 style="font-size: 22px; color: #1e293b; margin: 0;">${t("activityHistoryTitle") || "📝 Activity History"}</h3>
            </div>
            <div id="progressFilterBar" class="progress-filter-bar" role="region" aria-label="Filter activity history by game type">
                <button type="button" class="progress-filter-btn active" data-filter="all" aria-pressed="true">${t("filterAllActivities") || "All Activities"}</button>
                <button type="button" class="progress-filter-btn" data-filter="memory_sequence" aria-pressed="false">🧠 ${t("filterMemorySequence") || "Memory Sequence"}</button>
                <button type="button" class="progress-filter-btn" data-filter="attention_challenge" aria-pressed="false">🎯 ${t("filterAttentionChallenge") || "Attention Challenge"}</button>
                <button type="button" class="progress-filter-btn" data-filter="daily_routine_recall" aria-pressed="false">🔢 ${t("filterRoutineRecall") || "Routine Recall"}</button>
                <button type="button" class="progress-filter-btn" data-filter="pattern_recognition" aria-pressed="false">🧩 ${t("filterPatternRecognition") || "Pattern Recognition"}</button>
            </div>
            <div id="activityHistoryList">
                ${renderHistoryItems(visibleItems)}
            </div>
        `;

        if (remainingItems.length > 0) {
            historyListHTML += `
                <button type="button" id="showMoreHistoryBtn" class="show-more-btn">
                    ${t("showMore") || "Show More History"} (${remainingItems.length})
                </button>
            `;
        }

        // Assemble Page Content
        progressContent.innerHTML = `
            ${summaryCardsHTML}
            ${latestHeroHTML}
            ${chartHTML}
            ${historyListHTML}
        `;

        // Wire P6.7 Progress Activity Filter Bar Buttons
        const filterBar = document.getElementById("progressFilterBar");
        if (filterBar) {
            const filterBtns = filterBar.querySelectorAll(".progress-filter-btn");
            filterBtns.forEach((btn) => {
                const filterVal = btn.dataset.filter;
                btn.onclick = () => {
                    activeProgressFilter = filterVal;
                    filterBtns.forEach((b) => {
                        const isActive = b === btn;
                        b.classList.toggle("active", isActive);
                        b.setAttribute("aria-pressed", isActive ? "true" : "false");
                    });
                    renderFilteredProgressHistory(activities);
                };
                const isInitialActive = filterVal === activeProgressFilter;
                btn.classList.toggle("active", isInitialActive);
                btn.setAttribute("aria-pressed", isInitialActive ? "true" : "false");
            });
        }

        // Wire "Show More" expansion button
        const showMoreBtn = document.getElementById("showMoreHistoryBtn");
        if (showMoreBtn) {
            showMoreBtn.onclick = () => {
                const container = document.getElementById("historyListContainer");
                if (container) {
                    container.innerHTML += renderHistoryItems(remainingItems);
                    showMoreBtn.remove();
                }
            };
        }

    } catch (err) {
        console.error("Error loading progress view:", err);
        showFeedbackMessage("error", "Could not load progress history.");
        progressContent.innerHTML = `
            <div class="progress-empty-card" style="border-color: #fecdca; background: #fff4f4;">
                <div class="progress-empty-icon">⚠️</div>
                <h3 class="progress-empty-title" style="color: #b42318;">Unable to Load Progress</h3>
                <p class="progress-empty-sub">We could not load your activity history right now.</p>
                <button type="button" class="primary-continue-btn" onclick="loadPatientProgressView()">
                    🔄 Try Again
                </button>
            </div>
        `;
    }
}

const progressBtn = document.getElementById("progressBtn");
if (progressBtn) {
    progressBtn.addEventListener("click", () => {
        loadPatientProgressView();
    });
}



// ==================================================
// ACCESSIBLE FEEDBACK & CAREGIVER CHART HELPERS (P2)
// ==================================================

function showFeedbackMessage(type, text) {
    const container = document.getElementById("toastContainer");
    if (!container) return;

    const toast = document.createElement("div");
    toast.className = `app-toast app-toast-${type}`;
    const icon = type === "success" ? "✅" : type === "error" ? "❌" : "ℹ️";
    toast.innerHTML = `<span>${icon}</span> <span>${text}</span>`;
    
    container.appendChild(toast);
    
    setTimeout(() => {
        toast.style.opacity = "0";
        toast.style.transform = "translateY(10px)";
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}

function showConfirmModal(title, message, onConfirm) {
    const overlay = document.getElementById("confirmModalOverlay");
    const titleEl = document.getElementById("modalTitle");
    const bodyEl = document.getElementById("modalBody");
    const cancelBtn = document.getElementById("modalCancelBtn");
    const confirmBtn = document.getElementById("modalConfirmBtn");

    if (!overlay || !confirmBtn || !cancelBtn) {
        onConfirm();
        return;
    }

    if (titleEl) titleEl.textContent = title;
    if (bodyEl) bodyEl.textContent = message;

    overlay.style.display = "flex";
    confirmBtn.focus();

    const cleanup = () => {
        overlay.style.display = "none";
        confirmBtn.removeEventListener("click", handleConfirm);
        cancelBtn.removeEventListener("click", handleCancel);
    };

    const handleConfirm = () => {
        cleanup();
        onConfirm();
    };

    const handleCancel = () => {
        cleanup();
    };

    confirmBtn.addEventListener("click", handleConfirm);
    cancelBtn.addEventListener("click", handleCancel);
}

function getCaregiverChartHTML(activities = []) {
    const dayCounts = [0, 0, 0, 0, 0, 0, 0];
    const dayLabels = [];
    const dayDates = [];
    const today = new Date();

    for (let i = 6; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split("T")[0];
        dayDates.push(dateStr);

        const dayName = d.toLocaleDateString(getCurrentLanguage(), { weekday: "short" });
        const dateName = `${d.getMonth() + 1}/${d.getDate()}`;
        dayLabels.push({ day: dayName, date: dateName, fullDate: dateStr });
    }

    if (Array.isArray(activities)) {
        activities.forEach((act) => {
            if (act.timestamp && act.timestamp.toDate) {
                const actDateStr = act.timestamp.toDate().toISOString().split("T")[0];
                const dayIndex = dayDates.indexOf(actDateStr);
                if (dayIndex !== -1) {
                    dayCounts[dayIndex]++;
                }
            }
        });
    }

    const maxDayCount = Math.max(...dayCounts, 4);
    const total7DayActivities = dayCounts.reduce((sum, c) => sum + c, 0);

    let chartBarsHTML = "";
    dayLabels.forEach((info, idx) => {
        const count = dayCounts[idx];
        const fillPercent = Math.round((count / maxDayCount) * 100);
        chartBarsHTML += `
            <div class="chart-bar-col" role="img" aria-label="${info.day} ${info.date}: ${count} activities">
                <span class="chart-bar-val">${count > 0 ? count : ''}</span>
                <div class="chart-bar-track">
                    <div class="chart-bar-fill ${count > 0 ? 'has-count' : ''}" style="height: ${fillPercent}%;"></div>
                </div>
                <span class="chart-bar-day">${info.day}</span>
                <span class="chart-bar-date">${info.date}</span>
            </div>
        `;
    });

    const summaryText = dayLabels.map((d, i) => `${d.day} ${d.date}: ${dayCounts[i]}`).join(', ');

    return `
        <div class="caregiver-chart-card" role="region" aria-label="7-Day Activity Participation Chart">
            <div class="chart-header">
                <h3>📈 7-Day Activity Participation</h3>
                <span class="chart-total-badge">Total: ${total7DayActivities} activities</span>
            </div>
            <p class="sr-only">
                Activity count over the last 7 days: ${summaryText}. Total: ${total7DayActivities}.
            </p>
            <div class="chart-bars-wrapper">
                ${chartBarsHTML}
            </div>
        </div>
    `;
}

// ================================
// CAREGIVER MOOD INSIGHTS (P1.2)
// ================================

async function getCaregiverMoodHTML() {
    try {
        const moodQuery = query(
            collection(db, "moodCheckins"),
            where("patientId", "==", getActivePatientId())
        );
        const moodSnapshot = await getDocs(moodQuery);
        const moods = [];
        moodSnapshot.forEach((doc) => {
            moods.push(doc.data());
        });

        moods.sort((a, b) => {
            const timeA = a.timestamp?.toDate ? a.timestamp.toDate() : new Date(0);
            const timeB = b.timestamp?.toDate ? b.timestamp.toDate() : new Date(0);
            return timeB - timeA;
        });

        const moodIcons = {
            "Good": "😀",
            "Okay": "🙂",
            "Not great": "😐",
            "Worried": "😟",
            "Tired": "😴"
        };

        if (moods.length === 0) {
            return `
                <div style="background: white; border: 1px solid #dce2ea; padding: 22px; border-radius: 16px; margin-bottom: 25px; box-shadow: 0 4px 12px rgba(0,0,0,0.04);">
                    <h3 style="margin-top: 0; font-size: 20px; color: #1f2d3d;">😊 Patient Mood Insights</h3>
                    <p style="margin: 5px 0 0; color: #657184; font-size: 15px;">
                        📭 No mood check-ins recorded yet.
                    </p>
                </div>
            `;
        }

        const latest = moods[0];
        const latestMoodDate = latest.timestamp?.toDate ? latest.timestamp.toDate().toLocaleString() : "Recently";
        const latestEmoji = moodIcons[latest.mood] || "💭";

        let moodHistoryList = "";
        moods.slice(0, 5).forEach((m) => {
            const mDate = m.timestamp?.toDate ? m.timestamp.toDate().toLocaleString() : "Recently";
            const mEmoji = moodIcons[m.mood] || "💭";
            moodHistoryList += `
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px 0; border-bottom: 1px solid #f0f2f5;">
                    <span style="font-size: 16px; font-weight: 600; color: #2d3748;">${mEmoji} ${m.mood}</span>
                    <span style="font-size: 13px; color: #718096;">${mDate}</span>
                </div>
            `;
        });

        return `
            <div style="background: white; border: 1px solid #dce2ea; padding: 22px; border-radius: 16px; margin-bottom: 25px; box-shadow: 0 4px 12px rgba(0,0,0,0.04);">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; flex-wrap: wrap; gap: 10px;">
                    <h3 style="margin: 0; font-size: 20px; color: #1f2d3d;">😊 Patient Mood Insights</h3>
                    <span style="background: #eef3ff; color: #3157d5; padding: 6px 14px; border-radius: 20px; font-weight: 700; font-size: 14px;">
                        Latest: ${latestEmoji} ${latest.mood}
                    </span>
                </div>
                <p style="margin: 0 0 14px; color: #657184; font-size: 14px;">
                    Recorded: <strong>${latestMoodDate}</strong>
                </p>
                <h4 style="margin: 14px 0 8px; font-size: 15px; color: #4a5568;">Recent Mood History</h4>
                <div style="background: #f8fafc; border-radius: 12px; padding: 4px 16px;">
                    ${moodHistoryList}
                </div>
            </div>
        `;
    } catch (moodErr) {
        console.warn("Could not load mood check-ins for caregiver:", moodErr);
        return `
            <div style="background: #fff9f0; border: 1px solid #fbd38d; padding: 15px; border-radius: 14px; margin-bottom: 25px; color: #7b341e; font-size: 14px;">
                ⚠️ Unable to load mood check-ins right now.
            </div>
        `;
    }
}

async function loadCaregiverDashboard() {
    const caregiverSection = document.getElementById("caregiverSection");
    const caregiverContent = document.getElementById("caregiverContent");

    if (!caregiverSection || !caregiverContent) {
        console.error("Caregiver dashboard elements not found.");
        return;
    }

    caregiverSection.style.display = "block";
    caregiverSection.scrollIntoView({ behavior: "smooth" });

    caregiverContent.innerHTML = `
        <div class="dashboard-loading-skeleton" role="status">
            ${t("loadingCaregiver") || "Loading caregiver dashboard..."}
        </div>
    `;

    try {
        const patientId = getActivePatientId();
        const todayISO = new Date().toISOString().split("T")[0];

        // Concurrent fetching of mood, activities, and reminders for active patient
        const moodSectionHTML = await getCaregiverMoodHTML();

        const activityPromise = getDocs(query(
            collection(db, "activityResults"),
            where("patientId", "==", patientId)
        ));
        const remindersPromise = getDocs(query(
            collection(db, "reminders"),
            where("patientId", "==", patientId)
        ));

        const [snapshot, remindersSnap] = await Promise.all([
            activityPromise,
            remindersPromise
        ]);

        // Process Reminders Summary for Insights
        let todayRemindersTotal = 0;
        let todayRemindersCompleted = 0;
        let todayRemindersPending = 0;

        remindersSnap.forEach((doc) => {
            const data = doc.data();
            if (data.date === todayISO) {
                todayRemindersTotal++;
                if (data.completed) {
                    todayRemindersCompleted++;
                } else {
                    todayRemindersPending++;
                }
            }
        });

        let reminderSummaryText = t("noRemindersScheduled") || "No reminders scheduled today.";
        let reminderValueText = "No Reminders";

        if (todayRemindersTotal > 0) {
            reminderValueText = `${todayRemindersPending} ${t("pending") || "Pending"}`;
            reminderSummaryText = `${todayRemindersPending} ${t("pendingRemindersCount") || "pending"}, ${todayRemindersCompleted} ${t("completedRemindersCount") || "completed"}`;
        }

        // Handle Empty Activities Case
        if (snapshot.empty) {
            const emptyChartHTML = getCaregiverChartHTML([]);
            const emptyInsightsHTML = `
                <div class="caregiver-insights-card" role="region" aria-label="Caregiver Insights">
                    <div class="insights-header">
                        <h3>${t("caregiverInsightsTitle") || "💡 Caregiver Insights"}</h3>
                        <p class="insights-subtitle">${t("caregiverInsightsSub") || "Summary of recent patient participation, reminder completion, and routine activity."}</p>
                    </div>
                    <div class="insights-grid">
                        <div class="insight-block">
                            <div class="insight-label">📊 ${t("activityParticipationLabel") || "Activity Participation"}</div>
                            <div class="insight-value">0 ${t("activities") || "activities"}</div>
                            <div class="insight-sub">${t("noCaregiverActivity") || "No patient activity recorded yet."}</div>
                        </div>
                        <div class="insight-block">
                            <div class="insight-label">🔔 ${t("todaysRemindersLabel") || "Today's Reminders"}</div>
                            <div class="insight-value">${reminderValueText}</div>
                            <div class="insight-sub">${reminderSummaryText}</div>
                        </div>
                        <div class="insight-block">
                            <div class="insight-label">📈 ${t("participationTrendLabel") || "Participation Trend"}</div>
                            <div class="insight-value">-</div>
                            <div class="insight-sub">${t("trendInsufficientData") || "Not enough activity history for a comparison yet."}</div>
                        </div>
                    </div>
                </div>
            `;

            caregiverContent.innerHTML = `
                ${emptyInsightsHTML}
                <div style="text-align: center; padding: 30px; background: #f4f7fb; border-radius: 15px; margin-bottom: 25px;">
                    <h3>📭 No Activity Yet</h3>
                    <p>No patient activity has been recorded yet.</p>
                </div>
                ${emptyChartHTML}
                ${moodSectionHTML}
            `;
            return;
        }

        // Process Activity Results
        let totalScore = 0;
        let activityCount = 0;
        let successfulActivities = 0;
        let bestScore = 0;
        const activities = [];

        snapshot.forEach((doc) => {
            const data = doc.data();
            const score = Number(data.score) || 0;
            totalScore += score;
            activityCount++;
            if (score > bestScore) bestScore = score;
            if (score >= 100) successfulActivities++;

            activities.push({
                ...data,
                score: score,
                timestampDate: data.timestamp && data.timestamp.toDate ? data.timestamp.toDate() : new Date(0)
            });
        });

        // Sort newest activity first
        activities.sort((a, b) => b.timestampDate - a.timestampDate);

        const averageScore = Math.round(totalScore / activityCount);
        const latestActivity = activities[0];
        const latestActivityName = getFriendlyActivityName(latestActivity.activityType);
        const latestActivityDate = latestActivity.timestampDate.getTime() > 0 ? latestActivity.timestampDate.toLocaleString() : "Not available";

        // Calculate 7-Day & 14-Day Calendar Trends
        const dayDates7 = [];
        const dayDatesPrev7 = [];
        const todayDate = new Date();

        for (let i = 6; i >= 0; i--) {
            const d = new Date(todayDate);
            d.setDate(d.getDate() - i);
            dayDates7.push(d.toISOString().split("T")[0]);
        }

        for (let i = 13; i >= 7; i--) {
            const d = new Date(todayDate);
            d.setDate(d.getDate() - i);
            dayDatesPrev7.push(d.toISOString().split("T")[0]);
        }

        const activeDaysSet = new Set();
        let count7Days = 0;
        let countPrev7Days = 0;

        activities.forEach((act) => {
            if (act.timestampDate && act.timestampDate.getTime() > 0) {
                const actDateStr = act.timestampDate.toISOString().split("T")[0];
                if (dayDates7.includes(actDateStr)) {
                    count7Days++;
                    activeDaysSet.add(actDateStr);
                }
                if (dayDatesPrev7.includes(actDateStr)) {
                    countPrev7Days++;
                }
            }
        });

        const activeDaysCount = activeDaysSet.size;

        // Determine Trend Comparison Neutral Message
        let trendSummary = t("trendInsufficientData") || "Not enough activity history for a comparison yet.";
        let trendTitleStr = `${count7Days} vs ${countPrev7Days}`;

        if (activities.length >= 2) {
            const earliestTime = activities[activities.length - 1].timestampDate.getTime();
            const daysOfHistory = (todayDate.getTime() - earliestTime) / (1000 * 60 * 60 * 24);

            if (daysOfHistory >= 4) {
                if (count7Days > countPrev7Days) {
                    trendSummary = t("trendIncreased") || "Activity participation increased compared to the previous period.";
                } else if (count7Days < countPrev7Days) {
                    trendSummary = t("trendDecreased") || "Activity participation was lower than the previous period.";
                } else {
                    trendSummary = t("trendSimilar") || "Activity participation was similar to the previous period.";
                }
            }
        }

        const insightsCardHTML = `
            <div class="caregiver-insights-card" role="region" aria-label="Caregiver Insights">
                <div class="insights-header">
                    <h3>${t("caregiverInsightsTitle") || "💡 Caregiver Insights"}</h3>
                    <p class="insights-subtitle">${t("caregiverInsightsSub") || "Summary of recent patient participation, reminder completion, and routine activity."}</p>
                </div>
                <div class="insights-grid">
                    <div class="insight-block">
                        <div class="insight-label">📊 ${t("activityParticipationLabel") || "Activity Participation"}</div>
                        <div class="insight-value">${count7Days} ${t("activities") || "activities"}</div>
                        <div class="insight-sub">${activeDaysCount} ${t("activeDaysLabel") || "active days this week"}</div>
                    </div>
                    <div class="insight-block">
                        <div class="insight-label">🔔 ${t("todaysRemindersLabel") || "Today's Reminders"}</div>
                        <div class="insight-value">${reminderValueText}</div>
                        <div class="insight-sub">${reminderSummaryText}</div>
                    </div>
                    <div class="insight-block">
                        <div class="insight-label">📈 ${t("participationTrendLabel") || "Participation Trend"}</div>
                        <div class="insight-value">${trendTitleStr}</div>
                        <div class="insight-sub">${trendSummary}</div>
                    </div>
                </div>
            </div>
        `;

        // Render Recent Activity History Items
        let historyHTML = "";
        activities.forEach((data) => {
            const actDate = data.timestampDate.getTime() > 0 ? data.timestampDate.toLocaleString() : "Not available";
            const modeStr = data.mode === "cultural" ? (t("culturalMode") || "🌿 Cultural Objects") : data.mode === "standard" ? (t("standardMode") || "🔢 Standard Numbers") : "";

            historyHTML += `
                <div style="background: #ffffff; border: 1px solid #dce2ea; padding: 20px; margin-bottom: 14px; border-radius: 16px; box-shadow: 0 4px 12px rgba(0,0,0,0.04);">
                    <div style="display: flex; justify-content: space-between; align-items: center; gap: 15px; flex-wrap: wrap;">
                        <h3 style="margin: 0; font-size: 20px;">🧠 ${getFriendlyActivityName(data.activityType)}</h3>
                        <span style="background: #eef3ff; color: #3157d5; padding: 7px 12px; border-radius: 20px; font-weight: bold;">Score: ${data.score}</span>
                    </div>
                    <div style="margin-top: 15px; line-height: 1.8; color: #526070;">
                        ${data.difficulty ? `<div>🎯 <strong>Difficulty:</strong> ${data.difficulty}</div>` : ''}
                        ${data.attempts ? `<div>🔄 <strong>Attempts:</strong> ${data.attempts}</div>` : ''}
                        ${modeStr ? `<div>🌿 <strong>Mode:</strong> ${modeStr}</div>` : ''}
                        <div>🕒 <strong>Date:</strong> ${actDate}</div>
                    </div>
                </div>
            `;
        });

        // Assemble Caregiver Dashboard Content
        caregiverContent.innerHTML = `
            ${insightsCardHTML}

            <div style="background: linear-gradient(135deg, #eef3ff, #f7f9ff); border: 1px solid #dce2ea; padding: 25px; border-radius: 18px; margin-bottom: 25px;">
                <h3 style="margin-top: 0; font-size: 24px;">📊 Patient Activity Summary</h3>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 15px; margin-top: 20px;">
                    <div style="background: white; padding: 18px; border-radius: 14px; text-align: center;">
                        <div style="font-size: 28px;">🧠</div>
                        <strong style="font-size: 24px;">${activityCount}</strong>
                        <p style="margin: 5px 0 0; color: #657184;">Activities</p>
                    </div>
                    <div style="background: white; padding: 18px; border-radius: 14px; text-align: center;">
                        <div style="font-size: 28px;">📈</div>
                        <strong style="font-size: 24px;">${averageScore}</strong>
                        <p style="margin: 5px 0 0; color: #657184;">Average Score</p>
                    </div>
                    <div style="background: white; padding: 18px; border-radius: 14px; text-align: center;">
                        <div style="font-size: 28px;">🏆</div>
                        <strong style="font-size: 24px;">${bestScore}</strong>
                        <p style="margin: 5px 0 0; color: #657184;">Best Score</p>
                    </div>
                    <div style="background: white; padding: 18px; border-radius: 14px; text-align: center;">
                        <div style="font-size: 28px;">✅</div>
                        <strong style="font-size: 24px;">${successfulActivities}</strong>
                        <p style="margin: 5px 0 0; color: #657184;">Successful</p>
                    </div>
                </div>
            </div>

            <div style="background: white; padding: 18px; border-radius: 14px; margin-top: 15px; margin-bottom: 25px; border: 1px solid #dce2ea;">
                <strong>🕒 Latest Activity</strong>
                <p style="margin: 8px 0 0; color: #526070; font-size: 16px; font-weight: bold;">${latestActivityName}</p>
                <p style="margin: 5px 0 0; color: #657184; font-size: 14px;">${latestActivityDate}</p>
            </div>

            ${getCaregiverChartHTML(activities)}

            ${moodSectionHTML}

            <h3 style="font-size: 23px; margin-bottom: 15px;">📝 Recent Activity History</h3>

            ${historyHTML}
        `;

    } catch (error) {
        console.error("Caregiver dashboard error:", error);
        showFeedbackMessage("error", "Could not load caregiver insights.");
        caregiverContent.innerHTML = `
            <div style="background: #fff4f4; border: 1px solid #fecdca; padding: 20px; border-radius: 15px; color: #b42318;">
                ❌ Could not load patient information. Please try again.
            </div>
        `;
    }
}

// ================================
// MEMORY SEQUENCE ACTIVITY
// ================================

const activityBtn = document.getElementById("activityBtn");
const memoryGame = document.getElementById("memoryGame");
const sequenceElement = document.getElementById("sequence");
const answerElement = document.getElementById("answer");
const checkAnswer = document.getElementById("checkAnswer");
const nextRound = document.getElementById("nextRound");
const gameResult = document.getElementById("gameResult");
const gameInstructions = document.getElementById("gameInstructions");
const memoryOptions = document.getElementById("memoryOptions");
const memoryStandardModeBtn = document.getElementById("memoryStandardModeBtn");
const memoryCulturalModeBtn = document.getElementById("memoryCulturalModeBtn");
const numberAnswerContainer = document.getElementById("numberAnswerContainer");

let memoryGameMode = "standard"; // "standard" | "cultural"
let currentSequence = [];
let selectedMemoryItems = [];
let currentLength = 3;
let roundTimer;

const MIN_DIFFICULTY = 2;
const MAX_DIFFICULTY = 6;

function updateMemoryModeUI() {
    if (memoryGameMode === "standard") {
        if (memoryStandardModeBtn) {
            memoryStandardModeBtn.style.background = "var(--blue)";
            memoryStandardModeBtn.style.color = "#ffffff";
            memoryStandardModeBtn.style.border = "none";
        }
        if (memoryCulturalModeBtn) {
            memoryCulturalModeBtn.style.background = "#eef3ff";
            memoryCulturalModeBtn.style.color = "#3157d5";
            memoryCulturalModeBtn.style.border = "1px solid #d4e0fc";
        }
        if (numberAnswerContainer) numberAnswerContainer.style.display = "block";
        if (memoryOptions) memoryOptions.style.display = "none";
    } else {
        if (memoryStandardModeBtn) {
            memoryStandardModeBtn.style.background = "#eef3ff";
            memoryStandardModeBtn.style.color = "#3157d5";
            memoryStandardModeBtn.style.border = "1px solid #d4e0fc";
        }
        if (memoryCulturalModeBtn) {
            memoryCulturalModeBtn.style.background = "var(--blue)";
            memoryCulturalModeBtn.style.color = "#ffffff";
            memoryCulturalModeBtn.style.border = "none";
        }
        if (numberAnswerContainer) numberAnswerContainer.style.display = "none";
        if (memoryOptions) memoryOptions.style.display = "grid";
    }
}

if (memoryStandardModeBtn) {
    memoryStandardModeBtn.addEventListener("click", () => {
        if (memoryGameMode === "standard") return;
        memoryGameMode = "standard";
        updateMemoryModeUI();
        startRound();
    });
}

if (memoryCulturalModeBtn) {
    memoryCulturalModeBtn.addEventListener("click", () => {
        if (memoryGameMode === "cultural") return;
        memoryGameMode = "cultural";
        updateMemoryModeUI();
        startRound();
    });
}

async function updateDifficulty() {

    try {

        const activityQuery = query(
            collection(db, "activityResults"),
            where("patientId", "==", getActivePatientId()),
            where("activityType", "==", "memory_sequence")
        );

        const snapshot = await getDocs(activityQuery);

        const scores = [];

        snapshot.forEach((doc) => {
            const data = doc.data();
            scores.push(data.score || 0);
        });

        if (scores.length === 0) {
            currentLength = MIN_DIFFICULTY;
            return;
        }

        // Use the most recent 5 results
        const recentScores = scores.slice(-5);

        const averageScore =
            recentScores.reduce(
                (sum, score) => sum + score,
                0
            ) / recentScores.length;

        if (averageScore >= 80) {

            currentLength = Math.min(
                currentLength + 1,
                MAX_DIFFICULTY
            );

        } else if (averageScore < 50) {

            currentLength = Math.max(
                currentLength - 1,
                MIN_DIFFICULTY
            );
        }

        console.log(
            "Adaptive difficulty:",
            currentLength,
            "Average:",
            averageScore
        );

    } catch (error) {

        console.error(
            "Adaptive difficulty error:",
            error
        );
    }
}

activityBtn.addEventListener("click", () => {
    if (currentUserRole === "caregiver") return;

    showPatientView("memoryGame");

    startRound();
});

async function startRound() {

    await updateDifficulty();

    answerElement.value = "";
    answerElement.disabled = true;
    selectedMemoryItems = [];
    memoryOptions.innerHTML = "";
    gameResult.textContent = "";

    checkAnswer.style.display = "inline-block";
    checkAnswer.disabled = true;
    nextRound.style.display = "none";

    updateMemoryModeUI();

    if (memoryGameMode === "standard") {
        gameInstructions.textContent = t("rememberNumbers") || "Remember the numbers shown below.";

        currentSequence = Array.from(
            { length: currentLength },
            () => Math.floor(Math.random() * 10)
        );

        sequenceElement.style.fontSize = "42px";
        sequenceElement.style.letterSpacing = "15px";
        sequenceElement.style.lineHeight = "normal";
        sequenceElement.textContent = currentSequence.join("");

        clearTimeout(roundTimer);
        roundTimer = setTimeout(() => {

            sequenceElement.textContent = "?".repeat(currentLength);
            gameInstructions.textContent = t("enterNumbers") || "Enter the number you remember, then check your answer.";
            answerElement.disabled = false;
            answerElement.focus();
            checkAnswer.disabled = false;

        }, 3000);
    } else {
        // Cultural Objects Mode (P1.5)
        gameInstructions.textContent = t("rememberObjects") || "Remember these familiar items in order.";

        const lang = getCurrentLanguage();
        const content = getCulturalGameContent(lang);
        const allObjects = (content && content.objects && content.objects.length > 0)
            ? content.objects
            : getCulturalGameContent("en").objects;

        // Pick currentLength unique objects randomly
        const shuffled = [...allObjects].sort(() => Math.random() - 0.5);
        currentSequence = shuffled.slice(0, Math.min(currentLength, allObjects.length));

        sequenceElement.style.fontSize = "24px";
        sequenceElement.style.letterSpacing = "normal";
        sequenceElement.style.lineHeight = "1.6";
        sequenceElement.textContent = currentSequence.map((item) => item[1]).join("  ➔  ");

        clearTimeout(roundTimer);
        roundTimer = setTimeout(() => {

            sequenceElement.textContent = currentSequence.map(() => "❓").join("  ➔  ");
            gameInstructions.textContent = t("chooseObjects") || "Tap the items in the order you remember.";

            showMemoryOptions(allObjects);

        }, 3000);
    }
}

function showMemoryOptions(objects) {
    memoryOptions.innerHTML = "";
    [...objects].sort(() => Math.random() - 0.5).forEach(([id, label]) => {
        const button = document.createElement("button");
        button.type = "button";
        button.textContent = label;
        button.className = "memory-object-option";
        button.addEventListener("click", () => {
            selectedMemoryItems.push(id);
            answerElement.value = selectedMemoryItems.join("|");
            button.disabled = true;
            button.textContent = `✓ ${label}`;
            checkAnswer.disabled = selectedMemoryItems.length !== currentSequence.length;
        });
        memoryOptions.appendChild(button);
    });
}

checkAnswer.addEventListener("click", async () => {
    let correct = false;

    if (memoryGameMode === "standard") {
        const userAnswer = answerElement.value.trim();

        if (answerElement.disabled || !userAnswer) {
            gameResult.textContent = t("placeholderEnterNumber") || "Please enter the number before checking.";
            return;
        }

        correct = userAnswer === currentSequence.join("");
    } else {
        if (selectedMemoryItems.length !== currentSequence.length) {
            gameResult.textContent = t("chooseObjects") || "Choose all items before checking.";
            return;
        }

        const targetIds = currentSequence.map((item) => item[0]).join("|");
        const userIds = selectedMemoryItems.join("|");
        correct = userIds === targetIds;
    }

    const score = correct ? 100 : 0;
    gameResult.textContent = correct ? t("memorySuccess") : t("memoryTryAgain");

    // Save the result to Firestore
    try {

        await addDoc(collection(db, "activityResults"), {

            patientId: getActivePatientId(),

            activityType: "memory_sequence",

            mode: memoryGameMode,

            score: score,

            difficulty: currentLength,

            attempts: 1,

            timestamp: serverTimestamp()

        });

        console.log("✅ Activity result saved to Firestore!");

    } catch (error) {

        console.error(
            "❌ Could not save activity result:",
            error
        );

    }

    checkAnswer.style.display = "none";
    memoryOptions.querySelectorAll("button").forEach((button) => { button.disabled = true; });
    nextRound.style.display = "inline-block";
});

nextRound.addEventListener("click", () => {
    startRound();
});

// Performance-based adaptive difficulty: gradual game settings, not a medical AI diagnosis.
async function getActivityDifficulty(activityType, levels) {
    try {
        const snapshot = await getDocs(query(
            collection(db, "activityResults"),
            where("patientId", "==", getActivePatientId()),
            where("activityType", "==", activityType)
        ));
        const results = [];

        snapshot.forEach((resultDocument) => {
            const result = resultDocument.data();
            results.push({
                score: result.score,
                difficulty: result.difficulty,
                timestamp: result.timestamp?.toMillis?.() || 0
            });
        });

        results.sort((first, second) => first.timestamp - second.timestamp);
        return calculateAdaptiveDifficulty(results, levels);
    } catch (error) {
        console.error("Adaptive difficulty could not load results:", error);
        return levels[0];
    }
}
// ================================
// ATTENTION / CONCENTRATION GAME
// ================================

const attentionBtn = document.getElementById("attentionBtn");
const attentionGame = document.getElementById("attentionGame");
const attentionGrid = document.getElementById("attentionGrid");
const startAttentionGame =
    document.getElementById("startAttentionGame");
const attentionResult =
    document.getElementById("attentionResult");
const attentionInstructions =
    document.getElementById("attentionInstructions");

let attentionCorrectAnswer = null;
let attentionChoiceCount = 9;
let attentionRoundCompleted = false;
let attentionAttempts = 1;
const ATTENTION_DIFFICULTY_LEVELS = [9, 16, 25];

async function createAttentionGame() {

    attentionChoiceCount = await getActivityDifficulty(
        "attention_challenge",
        ATTENTION_DIFFICULTY_LEVELS
    );

    attentionRoundCompleted = false;
    attentionAttempts = 1;

    attentionGrid.innerHTML = "";
    attentionResult.textContent = "";

    attentionInstructions.textContent =
        "Find the number that appears only once.";

    const normalNumber =
        Math.floor(Math.random() * 9) + 1;

    let differentNumber;

    do {
        differentNumber =
            Math.floor(Math.random() * 9) + 1;
    } while (differentNumber === normalNumber);

    const differentPosition =
        Math.floor(Math.random() * attentionChoiceCount);

    attentionCorrectAnswer = differentPosition;
    attentionGrid.style.gridTemplateColumns =
        `repeat(${Math.sqrt(attentionChoiceCount)}, 1fr)`;

    for (let i = 0; i < attentionChoiceCount; i++) {

        const button = document.createElement("button");

        button.textContent =
            i === differentPosition
                ? differentNumber
                : normalNumber;

        button.dataset.position = i;

        button.style.minHeight = "70px";
        button.style.fontSize = "28px";

        button.addEventListener("click", () => {

            if (attentionRoundCompleted) {
                return;
            }

            if (
                Number(button.dataset.position) ===
                attentionCorrectAnswer
            ) {
                attentionRoundCompleted = true;

                button.style.background = "#237a4b";
                button.style.color = "#ffffff";

                const allTiles =
                    attentionGrid.querySelectorAll("button");
                allTiles.forEach((tile) => {
                    tile.disabled = true;
                });

                attentionResult.textContent =
                    "✅ Excellent! You found it.";

                const finalScore =
                    attentionAttempts === 1
                        ? 100
                        : Math.max(40, 100 - (attentionAttempts - 1) * 15);

                saveAttentionResult(finalScore, attentionAttempts);

            } else {
                attentionAttempts++;
                button.disabled = true;
                button.style.opacity = "0.45";

                attentionResult.textContent =
                    "That's okay. Try again!";
                // Do not save to Firestore on wrong guess to prevent score poisoning
            }

        });

        attentionGrid.appendChild(button);
    }
}

async function saveAttentionResult(score, attempts = 1) {
    try {
        await addDoc(
            collection(db, "activityResults"),
            {
                patientId: getActivePatientId(),
                activityType: "attention_challenge",
                score: score,
                difficulty: attentionChoiceCount,
                attempts: attempts,
                timestamp: serverTimestamp()
            }
        );

        console.log("✅ Attention challenge result saved. Score:", score, "Attempts:", attempts);

    } catch (error) {
        console.error(
            "❌ Could not save attention challenge result:",
            error
        );
    }
}

// Open Attention Game
attentionBtn.addEventListener("click", async () => {
    if (currentUserRole === "caregiver") return;

    showPatientView("attentionGame");

    await createAttentionGame();
});


// Start / restart game
startAttentionGame.addEventListener("click", async () => {

    await createAttentionGame();

});
// ================================
// DAILY ROUTINE RECALL GAME
// ================================

const routineRecallBtn =
    document.getElementById("routineRecallBtn");
    const morningRoutineBtn =
    document.getElementById("morningRoutineBtn");

const afternoonRoutineBtn =
    document.getElementById("afternoonRoutineBtn");

const eveningRoutineBtn =
    document.getElementById("eveningRoutineBtn");

const routineTimeOptions =
    document.getElementById("routineTimeOptions");

const routineRecallGame =
    document.getElementById("routineRecallGame");

const routineSequence =
    document.getElementById("routineSequence");

const routineOptions =
    document.getElementById("routineOptions");

const nextRoutineRound =
    document.getElementById("nextRoutineRound");

const routineResult =
    document.getElementById("routineResult");

const routineInstructions =
    document.getElementById("routineInstructions");

const routineProgress =
    document.getElementById("routineProgress");

let currentRoutine = [];
let routineCurrentStep = 0;
let routineScore = 0;
let currentRoutineTime = null;

function currentGameContent() {
    return getCulturalGameContent(getCurrentLanguage());
}

function applyCulturalGameLabels() {
    const content = currentGameContent();
    morningRoutineBtn.textContent = content.timeLabels.morning;
    afternoonRoutineBtn.textContent = content.timeLabels.afternoon;
    eveningRoutineBtn.textContent = content.timeLabels.evening;
    checkAnswer.textContent = content.text.checkAnswer;
    nextRound.textContent = content.text.next;
    nextRoutineRound.textContent = content.text.next;
    nextPatternRound.textContent = content.text.next;
}


// Start a new round
function startRoutineRound(timeOfDay) {

    routineCurrentStep = 0;
    routineScore = 0;

    routineResult.textContent = "";
    routineProgress.textContent = "";

    nextRoutineRound.style.display = "none";

    const content = currentGameContent();
    currentRoutine = [...content.routines[timeOfDay]];

    routineInstructions.textContent = content.text.rememberRoutine;

    routineSequence.textContent =
        currentRoutine.join(" → ");

    routineOptions.innerHTML = "";

    setTimeout(() => {

        routineSequence.textContent =
            "● ● ● ●";

        routineInstructions.textContent = content.text.chooseObjects;

        showRoutineOptions();

    }, 10000);
}


// Show large activity buttons
function showRoutineOptions() {

    routineOptions.innerHTML = "";

    const shuffledOptions =
        [...currentRoutine]
            .sort(() => Math.random() - 0.5);

    shuffledOptions.forEach((activity) => {

        const button =
            document.createElement("button");

        button.textContent = activity;

        button.style.minHeight = "65px";
        button.style.fontSize = "20px";
        button.style.textAlign = "left";
        button.style.padding = "15px 20px";

        button.addEventListener("click", () => {

            handleRoutineSelection(
                activity,
                button
            );

        });

        routineOptions.appendChild(button);

    });

    updateRoutineProgress();
}


// Handle patient's selection
function handleRoutineSelection(
    selectedActivity,
    selectedButton
) {

    const correctActivity =
        currentRoutine[routineCurrentStep];

    const stepPoints =
        currentRoutine.length > 0
            ? Math.round(100 / currentRoutine.length)
            : 25;

    if (selectedActivity === correctActivity) {

        routineScore = Math.min(100, routineScore + stepPoints);

        selectedButton.disabled = true;

        selectedButton.textContent =
            "✅ " + selectedActivity;

        routineCurrentStep++;

        updateRoutineProgress();

        // Completed the whole routine
        if (
            routineCurrentStep ===
            currentRoutine.length
        ) {

            const finalScore = Math.min(100, Math.max(0, routineScore));

            routineResult.textContent =
                "🎉 Excellent! You remembered the whole routine.";

            routineInstructions.textContent =
                "Great job!";

            saveRoutineResult(finalScore);

            nextRoutineRound.style.display =
                "inline-block";

            return;
        }

        routineInstructions.textContent =
            "✅ Correct! Now find the next activity.";

    } else {

        routineResult.textContent =
            "That's okay! Try to remember the order.";

        selectedButton.disabled = true;

        selectedButton.textContent =
            "❌ " + selectedActivity;

        // Small penalty
        routineScore =
            Math.max(0, routineScore - 5);
    }
}


// Update progress text
function updateRoutineProgress() {

    routineProgress.textContent =
        `Activity ${routineCurrentStep + 1} of ${currentRoutine.length}`;
}


// Save result to Firestore
async function saveRoutineResult(score = routineScore) {

    const finalScore = Math.min(100, Math.max(0, score));

    try {

        await addDoc(
            collection(db, "activityResults"),
            {
                patientId: getActivePatientId(),
                activityType: "routine_recall",
                score: finalScore,
                difficulty: currentRoutine.length,
                attempts: 1,
                timestamp: serverTimestamp()
            }
        );

        console.log(
            "✅ Routine recall result saved. Score:",
            finalScore
        );

    } catch (error) {

        console.error(
            "❌ Could not save routine recall result:",
            error
        );

    }
}

routineRecallBtn.addEventListener("click", () => {
    if (currentUserRole === "caregiver") return;

    showPatientView("routineRecallGame");

    routineTimeOptions.style.display = "grid";
    routineInstructions.textContent = currentGameContent().text.chooseTime;

    routineSequence.textContent = "";

    routineOptions.innerHTML = "";

    routineResult.textContent = "";

    routineProgress.textContent = "";

    nextRoutineRound.style.display = "none";

});
morningRoutineBtn.addEventListener("click", () => {

    routineTimeOptions.style.display = "none";

    currentRoutineTime = "morning";

    routineInstructions.textContent =
        "🌅 Morning Routine — Remember the order.";

    startRoutineRound("morning");

});


afternoonRoutineBtn.addEventListener("click", () => {

    routineTimeOptions.style.display = "none";

    currentRoutineTime = "afternoon";

    routineInstructions.textContent =
        "☀️ Afternoon Routine — Remember the order.";

    startRoutineRound("afternoon");

});


eveningRoutineBtn.addEventListener("click", () => {

    routineTimeOptions.style.display = "none";

    currentRoutineTime = "evening";

    routineInstructions.textContent =
        "🌙 Evening Routine — Remember the order.";

    startRoutineRound("evening");

});

nextRoutineRound.addEventListener("click", () => {

    startRoutineRound(currentRoutineTime);

});
// ================================
// PATTERN / OBJECT RECOGNITION
// ================================

const patternGameBtn =
    document.getElementById("patternGameBtn");

const patternGame =
    document.getElementById("patternGame");

const patternDisplay =
    document.getElementById("patternDisplay");

const patternOptions =
    document.getElementById("patternOptions");

const patternInstructions =
    document.getElementById("patternInstructions");

const patternResult =
    document.getElementById("patternResult");

const nextPatternRound =
    document.getElementById("nextPatternRound");

let correctPattern = "";
let activePatterns = [];

const patterns = [
    "🔵 ⭐ 🔵 ⭐",
    "❤️ 🟢 ❤️ 🟢",
    "🔺 🟡 🔺 🟡",
    "🌸 🔷 🌸 🔷"
];


// Start a pattern round
function startPatternRound() {

    patternResult.textContent = "";

    nextPatternRound.style.display = "none";

    const content = currentGameContent();
    activePatterns = content.patterns;
    patternInstructions.textContent = content.text.patternRemember;

    correctPattern =
        activePatterns[
            Math.floor(Math.random() * activePatterns.length)
        ];

    patternDisplay.textContent =
        correctPattern;

    patternOptions.innerHTML = "";

    setTimeout(() => {

        patternDisplay.textContent =
            "● ● ● ●";

        patternInstructions.textContent = content.text.patternChoose;

        showPatternOptions();

    }, 7500);
}


// Show pattern choices
function showPatternOptions() {

    patternOptions.innerHTML = "";

    const options = [
        correctPattern,
        ...activePatterns.filter(
            pattern => pattern !== correctPattern
        ).slice(0, 3)
    ];

    options.sort(() => Math.random() - 0.5);

    options.forEach((pattern) => {

        const button =
            document.createElement("button");

        button.textContent = pattern;

        button.style.minHeight = "75px";
        button.style.fontSize = "28px";
        button.style.letterSpacing = "5px";

        button.addEventListener("click", () => {

            if (pattern === correctPattern) {

                patternResult.textContent =
                    "✅ Excellent! You remembered the pattern.";

                savePatternResult(100);

            } else {

                patternResult.textContent =
                    "That's okay. Let's try another one.";

                savePatternResult(0);
            }

            // Disable all options
            const buttons =
                patternOptions.querySelectorAll("button");

            buttons.forEach(button => {
                button.disabled = true;
            });

            nextPatternRound.style.display =
                "inline-block";

        });

        patternOptions.appendChild(button);

    });
}


// Save pattern result
async function savePatternResult(score) {

    try {

        await addDoc(
            collection(db, "activityResults"),
            {
                patientId: getActivePatientId(),
                activityType: "pattern_recognition",
                score: score,
                difficulty: 4,
                attempts: 1,
                timestamp: serverTimestamp()
            }
        );

        console.log(
            "✅ Pattern result saved."
        );

    } catch (error) {

        console.error(
            "❌ Could not save pattern result:",
            error
        );

    }
}


// Open Pattern Game
patternGameBtn.addEventListener("click", () => {
    if (currentUserRole === "caregiver") return;

    showPatientView("patternGame");

    startPatternRound();

});
// ================================
// MOOD CHECK-IN
// ================================

const moodCheckinBtn =
    document.getElementById("moodCheckinBtn");

const moodCheckin =
    document.getElementById("moodCheckin");

const moodOptions =
    document.querySelectorAll("#moodOptions button");

const moodResult =
    document.getElementById("moodResult");


// Open Mood Check-In
moodCheckinBtn.addEventListener("click", () => {
    if (currentUserRole === "caregiver") return;

    showPatientView("moodCheckin");

    moodResult.textContent =
        "";

});


// Handle mood selection
moodOptions.forEach((button) => {

    button.addEventListener("click", async () => {

        const mood =
            button.dataset.mood;

        moodResult.textContent =
            "Saving your response...";

        try {

            await addDoc(
                collection(db, "moodCheckins"),
                {
                    patientId: getActivePatientId(),
                    mood: mood,
                    timestamp: serverTimestamp()
                }
            );

            moodResult.textContent =
                "💙 Thank you for sharing how you feel.";

            console.log(
                "✅ Mood check-in saved."
            );

        } catch (error) {

            console.error(
                "❌ Could not save mood check-in:",
                error
            );

            moodResult.textContent =
                "Sorry, we could not save your response.";
        }

    });

});


// Next pattern
nextPatternRound.addEventListener("click", () => {

    startPatternRound();

});
// ================================
// SAVE REMINDER
// ================================

document
    .getElementById("saveReminderBtn")
    .addEventListener("click", async () => {

        const title =
            document.getElementById("reminderTitle").value.trim();

        const type =
            document.getElementById("reminderType").value.trim();

        const date =
            document.getElementById("reminderDate").value;

        const time =
            document.getElementById("reminderTime").value;

        const message =
            document.getElementById("reminderMessage");

        if (!title || !type || !date || !time) {

            message.textContent =
                "Please fill in all reminder details.";

            return;
        }

        try {

            await addDoc(
                collection(db, "reminders"),
                {
                    patientId: getActivePatientId(),
                    title: title,
                    type: type,
                    date: date,
                    time: time,
                    createdAt: serverTimestamp()
                }
            );

            message.textContent =
                "✅ Reminder saved successfully.";

            document.getElementById("reminderTitle").value = "";
            document.getElementById("reminderType").value = "";
            document.getElementById("reminderDate").value = "";
            document.getElementById("reminderTime").value = "";

            // Refresh saved reminders list immediately (P0.4)
            loadCaregiverReminders();

        } catch (error) {

            console.error(
                "Error saving reminder:",
                error
            );

            message.textContent =
                "❌ Failed to save reminder.";
        }

    });
    // ================================
// LOAD CAREGIVER REMINDERS
// ================================

async function loadCaregiverReminders() {

    const container =
        document.getElementById("caregiverRemindersContent");

    if (!container) {
        console.error("Saved reminders container not found.");
        return;
    }

    try {

        const reminderQuery = query(
            collection(db, "reminders"),
            where("patientId", "==", getActivePatientId())
        );

        const snapshot =
            await getDocs(reminderQuery);

        if (snapshot.empty) {

            container.innerHTML = `
                <div style="
                    background: #f4f7fb;
                    padding: 20px;
                    border-radius: 14px;
                    color: #657184;
                ">
                    📭 No reminders created yet.
                </div>
            `;

            return;
        }

        let html = "";

        snapshot.forEach((reminderDoc) => {
            const reminder = reminderDoc.data();
            const catDetails = getReminderCategoryDetails(reminder.type);

            html += `
                <div style="
                    background: #ffffff;
                    border: 1px solid #dce2ea;
                    padding: 18px;
                    margin-bottom: 12px;
                    border-radius: 14px;
                ">
                    <div style="margin-bottom: 8px;">
                        <span class="category-badge">${catDetails.icon} ${escapeHtml(catDetails.label)}</span>
                    </div>

                    <h4 style="
                        margin: 0 0 8px;
                        font-size: 20px;
                    ">
                        🔔 ${escapeHtml(reminder.title || "Reminder")}
                    </h4>

                    <p style="
                        margin: 5px 0;
                        color: #526070;
                    ">
                        Type: ${escapeHtml(reminder.type || "-")}
                    </p>

            <p style="
                margin: 5px 0;
                color: #526070;
            ">
                📅 ${reminder.date || "Date not set"}
                &nbsp;&nbsp;
                ⏰ ${reminder.time || "Time not set"}
            </p>

            <div style="margin: 8px 0 12px;">
                ${
                    reminder.completed
                        ? `<span style="background: #e8f7ee; color: #23864b; padding: 4px 10px; border-radius: 12px; font-size: 13px; font-weight: 700;">✅ Completed by Patient</span>`
                        : `<span style="background: #f1f3f5; color: #657184; padding: 4px 10px; border-radius: 12px; font-size: 13px;">⏳ Pending</span>`
                }
            </div>

            <button
                class="deleteReminderBtn"
                data-id="${reminderDoc.id}"
                style="
                    margin-top: 6px;
                    background: #d92d20;
                    color: white;
                    border: none;
                    padding: 8px 16px;
                    border-radius: 8px;
                    cursor: pointer;
                "
            >
                🗑️ Delete
            </button>

        </div>
    `;
});

        container.innerHTML = html;

    } catch (error) {

        console.error(
            "Error loading caregiver reminders:",
            error
        );

        container.innerHTML = `
            <div style="
                background: #fff4f4;
                padding: 20px;
                border-radius: 14px;
                color: #b42318;
            ">
                ❌ Could not load saved reminders.
            </div>
        `;
    }
}
// ================================
// DELETE REMINDER
// ================================

document.addEventListener("click", async (event) => {

    const deleteButton =
        event.target.closest(".deleteReminderBtn");

    if (!deleteButton) {
        return;
    }

    const reminderId =
        deleteButton.dataset.id;

    if (!reminderId) {
        return;
    }

    showConfirmModal(
        "Delete Reminder",
        "Are you sure you want to delete this reminder?",
        async () => {
            try {
                await deleteDoc(doc(db, "reminders", reminderId));
                showFeedbackMessage("success", "✅ Reminder deleted.");
                loadCaregiverReminders();
            } catch (error) {
                console.error("Error deleting reminder:", error);
                showFeedbackMessage("error", "❌ Could not delete reminder.");
            }
        }
    );

});
// ================================
// LANGUAGE SELECTION
// ================================

const languageSelect =
    document.getElementById("languageSelect");
languageSelect.addEventListener("change", () => {

    const selectedLanguage =
        languageSelect.value;

    applyLanguage(selectedLanguage);

});
// ================================
// TRANSLATIONS
// ================================

const translations = {
    en: {
        backToDashboard: "← Back to Dashboard",
        logout: "🚪 Log Out",
        welcome: "Welcome 👋",
        welcomeDesc: "This platform provides simple cognitive activities, memory assistance, and supportive tools for elderly users.",
        cognitiveActivity: "🧠 Cognitive Activity",
        cognitiveDesc: "Complete simple activities designed to exercise memory, attention, and thinking skills.",
        startActivity: "Start Activity",
        attention: "🎯 Attention Challenge",
        routine: "🔢 Daily Routine Recall",
        pattern: "🧩 Pattern Recognition",
        mood: "😊 Mood Check-In",
        reminders: "📅 Reminders",
        remindersDesc: "Keep track of important daily reminders and routines.",
        viewReminders: "View Reminders",
        progress: "📊 Progress",
        progressDesc: "View activity participation and progress over time.",
        viewProgress: "View Progress",
        caregiver: "👨‍👩‍👧 Caregiver",
        caregiverDesc: "A dedicated area for caregivers to support the user's daily activities and routines.",
        caregiverArea: "Caregiver Area",
        assistant: "🤖 Memory Assistant",
        assistantDesc: "Ask the assistant a general question or request help with using the platform.",
        openAssistant: "Open Assistant",
        memoryTitle: "🧠 Memory Sequence",
        rememberNumbers: "Remember the numbers shown below.",
        rememberObjects: "Remember these familiar items in order.",
        enterNumbers: "Enter the number you remember:",
        chooseObjects: "Tap the items in the order you remember.",
        checkAnswer: "Check Answer",
        nextRound: "Next Round",
        memorySuccess: "✅ Excellent! You remembered correctly.",
        memoryTryAgain: "That's okay. Let's try again.",
        placeholderEnterNumber: "Enter the number",
        standardMode: "🔢 Standard Numbers",
        culturalMode: "🌿 Cultural Objects",
        attentionTitle: "🎯 Attention Challenge",
        attentionInstructions: "Find the number that appears only once.",
        startAttentionGame: "Start Attention Game",
        attentionSuccess: "✅ Excellent! You found it.",
        attentionTryAgain: "That's okay. Try again!",
        routineTitle: "🔢 Daily Routine Recall",
        rememberRoutine: "Remember the activities in the order shown.",
        chooseTime: "Choose Morning, Afternoon, or Evening.",
        routineMorning: "🌅 Morning",
        routineAfternoon: "☀️ Afternoon",
        routineEvening: "🌙 Evening",
        routineSuccess: "🎉 Excellent! You remembered the whole routine.",
        routineTryAgain: "That's okay! Try to remember the order.",
        routineNextActivity: "✅ Correct! Now find the next activity.",
        patternTitle: "🧩 Pattern Recognition",
        patternInstructions: "Remember the pattern shown below.",
        patternChoose: "Tap the pattern you remember.",
        nextPatternRound: "Next Pattern",
        patternSuccess: "✅ Excellent! You remembered the pattern.",
        patternTryAgain: "That's okay. Let's try another one.",
        moodTitle: "😊 How Are You Feeling?",
        moodInstructions: "Choose the option that best describes how you feel today.",
        moodGood: "😀 I feel good",
        moodOkay: "🙂 I feel okay",
        moodNotGreat: "😐 I'm not feeling great",
        moodWorried: "😟 I feel worried",
        moodTired: "😴 I feel tired",
        moodSaving: "Saving your response...",
        moodSaved: "💙 Thank you for sharing how you feel.",
        moodError: "Sorry, we could not save your response.",
        myReminders: "📅 My Reminders",
        myRemindersDesc: "Your caregiver's reminders for today and upcoming days.",
        loadingReminders: "Loading reminders...",
        noRemindersFound: "No reminders found.",
        markAsDone: "✓ Mark as Done",
        done: "✅ Done",
        completed: "✅ Completed",
        dueNow: "🔔 Due Now",
        passed: "Passed",
        today: "Today",
        upcoming: "Upcoming",
        myProgress: "📊 My Progress",
        myProgressDesc: "Your cognitive activity performance is shown below.",
        loadingProgress: "Loading your progress...",
        noActivityResults: "No activity results yet.",
        activities: "Activities",
        averageScore: "Average Score",
        bestScore: "Best Score",
        successful: "Successful",
        caregiverDashboard: "👨‍👩‍👧 Caregiver Dashboard",
        caregiverDashboardDesc: "Monitor the patient's cognitive activity and recent performance.",
        loadingCaregiver: "Loading caregiver dashboard...",
        noCaregiverActivity: "No patient activity has been recorded yet.",
        patientActivitySummary: "📊 Patient Activity Summary",
        patientMoodInsights: "😊 Patient Mood Insights",
        noMoodCheckins: "📭 No mood check-ins recorded yet.",
        latestMood: "Latest",
        recentMoodHistory: "Recent Mood History",
        recentActivity: "📝 Recent Activity",
        createReminder: "🔔 Create Reminder",
        createReminderDesc: "Create a reminder for the patient.",
        saveReminder: "💾 Save Reminder",
        savedReminders: "📋 Saved Reminders",
        noSavedReminders: "📭 No reminders created yet.",
        deleteReminder: "🗑️ Delete",
        completedByPatient: "✅ Completed by Patient",
        pending: "⏳ Pending",
        assistantTitle: "🤖 Memory Assistant",
        promptPlaceholder: "Type your question here...",
        startListening: "Start listening",
        askAssistant: "Ask Assistant",
        readAloud: "Read answer aloud",
        voiceHelp: "Tap “Start listening” to ask your question out loud.",
        goodMorning: "Good morning 👋",
        goodAfternoon: "Good afternoon 👋",
        goodEvening: "Good evening 👋",
        todayPlan: "Here is your plan and summary for today.",
        dailyProgressTitle: "Today's Progress",
        dailyProgressHelp: "Based on today's cognitive activity, mood check-in, and reminders.",
        dailyProgressNoRemindersHelp: "Based on today's cognitive activity and mood check-in (no reminders scheduled today).",
        todaysPriorities: "🎯 Today's Priorities",
        dailyPlan: "📅 Daily Plan",
        viewDailyPlan: "View Daily Plan",
        yourPlanToday: "Your plan for today",
        morning: "Morning",
        afternoon: "Afternoon",
        evening: "Evening",
        anytime: "Anytime",
        nothingScheduled: "Nothing scheduled",
        tasksRemaining: "Tasks remaining",
        todaysActivity: "Available Activity",
        appointmentCategory: "Appointment",
        medicationCategory: "Medication",
        personalCategory: "Personal",
        activityCategory: "Activity",
        hydrationCategory: "Hydration",
        otherCategory: "Other",
        filterAll: "All",
        filterPending: "Pending",
        filterCompleted: "Completed",
        quickAccess: "⚡ Quick Access",
        completedTasksOf: "completed",
        checkIn: "Check In",
        checkInAgain: "Check In Again",
        continueReminders: "📅 Complete Today's Reminders",
        continueActivity: "🧠 Start Today's Cognitive Activity",
        continueMood: "😊 Complete Mood Check-In",
        continueGreatJob: "🎉 All Done Today! Try Another Activity",
        todayRemindersTitle: "Today's Reminders",
        pendingCount: "pending",
        completedTodayCount: "completed today",
        noRemindersScheduledToday: "No reminders scheduled for today.",
        todayActivityTitle: "Today's Cognitive Activity",
        activityCompletedToday: "✅ Activity completed today",
        noActivityToday: "⏳ No activity completed today",
        latestMoodLabel: "Latest Mood Check-In",
        noMoodCheckinToday: "📭 No check-in today. How are you feeling?",
        recentPerformanceTitle: "Recent Performance Summary",
        recentAverage: "Recent Average Score",
        noPerformanceData: "No activity results recorded yet.",
        loadingDashboard: "Loading your dashboard...",
        caregiverInsightsTitle: "💡 Caregiver Insights",
        caregiverInsightsSub: "Summary of recent patient participation, reminder completion, and routine activity.",
        activityParticipationLabel: "Activity Participation",
        activeDaysLabel: "active days this week",
        todaysRemindersLabel: "Today's Reminders",
        noRemindersScheduled: "No reminders scheduled today.",
        pendingRemindersCount: "pending",
        completedRemindersCount: "completed",
        participationTrendLabel: "Participation Trend",
        trendIncreased: "Activity participation increased compared to the previous period.",
        trendDecreased: "Activity participation was lower than the previous period.",
        trendSimilar: "Activity participation was similar to the previous period.",
        trendInsufficientData: "Not enough activity history for a comparison yet.",
        progressTitle: "📊 My Progress & History",
        progressSubtitle: "View your completed activities, recent scores, and daily participation.",
        totalActivities: "Total Activities",
        recentAverageScore: "Recent Average Score",
        latestActivityHighlight: "🌟 Latest Activity",
        weeklyParticipationTitle: "📈 7-Day Activity Participation",
        activityHistoryTitle: "📝 Activity History",
        showMore: "Show More History",
        noActivitiesYetTitle: "📭 No Activities Completed Yet",
        noActivitiesYetSub: "Complete your first cognitive activity to start tracking your progress!",
        startFirstActivity: "▶ Start Activity",
        activityMemorySequence: "Memory Sequence",
        activityAttentionChallenge: "Attention Challenge",
        activityRoutineRecall: "Daily Routine Recall",
        activityPatternRecognition: "Pattern Recognition",
        difficultyLabel: "Difficulty",
        attemptsLabel: "Attempts",
        modeLabel: "Mode",
        dateLabel: "Date",
        floatingAiAssistant: "🤖 AI Assistant",
        close: "Close",
        send: "Send",
        typeQuestion: "Type your question...",
        thinking: "The assistant is thinking...",
        aiError: "Sorry, the assistant could not respond right now.",
        aiDisclaimer: "App assistant only • Not for medical advice",
        recommendedForYou: "Recommended for You",
        tryThisNext: "Try this activity next.",
        basedOnRecentActivity: "Based on your recent activity",
        activityNotRecentlyTried: "You haven't tried this activity recently.",
        activityNeverAttempted: "You haven't tried this activity yet.",
        activityVariety: "This gives your recent activities some variety.",
        noActivityHistory: "Try this activity to get started.",
        personalMilestones: "Personal Milestones",
        milestonesAchieved: "Milestones Achieved",
        viewMilestones: "View Milestones",
        milestoneFirstActivityTitle: "First Activity",
        milestoneFirstActivityDesc: "Completed your first cognitive activity.",
        milestoneThreeActivitiesTitle: "3 Activities Completed",
        milestoneThreeActivitiesDesc: "Completed 3 cognitive activities.",
        milestoneFiveActivitiesTitle: "5 Activities Completed",
        milestoneFiveActivitiesDesc: "Completed 5 cognitive activities.",
        milestoneThreeActiveDaysTitle: "3 Active Days",
        milestoneThreeActiveDaysDesc: "Participated on 3 different days.",
        milestoneTenActivitiesTitle: "10 Activities Completed",
        milestoneTenActivitiesDesc: "Completed 10 cognitive activities.",
        milestoneAchieved: "Achieved",
        milestoneInProgress: "In Progress",
        dailyConsistency: "Daily Consistency",
        currentStreak: "Current Active Streak",
        daysInARow: "days in a row",
        activeThisWeek: "Active Days This Week",
        keepItUp: "Great job maintaining your daily routine!",
        startStreak: "Complete an activity today to build your streak!",
        dayStreakLabel: "Day Streak",
        filterAllActivities: "All Activities",
        filterMemorySequence: "Memory Sequence",
        filterAttentionChallenge: "Attention Challenge",
        filterRoutineRecall: "Routine Recall",
        filterPatternRecognition: "Pattern Recognition",
        noActivitiesForFilter: "No activities completed yet for this game.",
        startThisActivity: "Start This Activity",
        mindfulPauseTitle: "Calm Pause & Focus Reset",
        mindfulPauseSub: "Take a quiet minute to pause and breathe gently before continuing.",
        startPause: "Start Calm Pause",
        pauseBreather: "Pause",
        resetBreather: "Reset",
        phaseInhale: "Inhale gently...",
        phaseHold: "Hold peacefully...",
        phaseExhale: "Exhale slowly...",
        phaseRest: "Rest and relax...",
        breatherComplete: "Nice work taking a calm pause. Continue when you're ready."
    ,
        accessibilityDisplay: "Display & Accessibility",
        accessibilityDisplayDesc: "Adjust text size and contrast for comfortable viewing.",
        textSize: "Text Size",
        textSizeStandard: "Standard",
        textSizeLarge: "Large (+15%)",
        textSizeExtraLarge: "Extra Large (+30%)",
        highContrast: "High Contrast",
        highContrastOn: "On (Enhanced Contrast)",
        highContrastOff: "Off (Standard Calm)",
        resetDisplaySettings: "Reset to Standard",
        saveDisplaySettings: "Done",
        displaySettingsSaved: "Display settings updated."
    },
    hi: {
        backToDashboard: "← डैशबोर्ड पर वापस जाएँ",
        logout: "🚪 लॉग आउट",
        welcome: "स्वागत है 👋",
        welcomeDesc: "यह मंच बुजुर्ग उपयोगकर्ताओं के लिए सरल मानसिक गतिविधियाँ, स्मृति सहायता और सहायक उपकरण प्रदान करता है।",
        cognitiveActivity: "🧠 स्मृति गतिविधि",
        cognitiveDesc: "स्मृति, ध्यान और सोचने के कौशल को सक्रिय रखने के लिए डिज़ाइन की गई सरल गतिविधियों को पूरा करें।",
        startActivity: "गतिविधि शुरू करें",
        attention: "🎯 ध्यान चुनौती",
        routine: "🔢 दैनिक दिनचर्या याद करें",
        pattern: "🧩 पैटर्न पहचान",
        mood: "😊 मन की स्थिति",
        reminders: "📅 रिमाइंडर",
        remindersDesc: "महत्वपूर्ण दैनिक कार्यों और दिनचर्या पर नज़र रखें।",
        viewReminders: "रिमाइंडर देखें",
        progress: "📊 प्रगति",
        progressDesc: "समय के साथ अपनी गतिविधि भागीदारी और प्रगति देखें।",
        viewProgress: "प्रगति देखें",
        caregiver: "👨‍👩‍👧 देखभालकर्ता",
        caregiverDesc: "देखभालकर्ताओं के लिए उपयोगकर्ता की दैनिक गतिविधियों में सहायता करने का समर्पित क्षेत्र।",
        caregiverArea: "देखभालकर्ता क्षेत्र",
        assistant: "🤖 स्मृति सहायक",
        assistantDesc: "सहायक से कोई सामान्य प्रश्न पूछें या प्लेटफ़ॉर्म के उपयोग में मदद लें।",
        openAssistant: "सहायक खोलें",
        memoryTitle: "🧠 स्मृति क्रम",
        rememberNumbers: "नीचे दिखाई गई संख्याओं को याद रखें।",
        rememberObjects: "इन परिचित वस्तुओं को क्रम में याद रखें।",
        enterNumbers: "अब याद की गई संख्या दर्ज करें:",
        chooseObjects: "याद रखे गए क्रम में वस्तुओं पर टैप करें।",
        checkAnswer: "उत्तर जांचें",
        nextRound: "अगला राउंड",
        memorySuccess: "✅ बहुत बढ़िया! आपने सही याद रखा।",
        memoryTryAgain: "कोई बात नहीं। फिर से कोशिश करें।",
        placeholderEnterNumber: "संख्या दर्ज करें",
        standardMode: "🔢 मानक संख्याएँ",
        culturalMode: "🌿 परिचित वस्तुएँ",
        attentionTitle: "🎯 ध्यान चुनौती",
        attentionInstructions: "वह संख्या खोजें जो केवल एक बार दिखाई देती है।",
        startAttentionGame: "ध्यान खेल शुरू करें",
        attentionSuccess: "✅ बहुत बढ़िया! आपने इसे खोज लिया।",
        attentionTryAgain: "कोई बात नहीं। पुनः प्रयास करें!",
        routineTitle: "🔢 दैनिक दिनचर्या याद करें",
        rememberRoutine: "दिखाए गए क्रम में गतिविधियों को याद रखें।",
        chooseTime: "सुबह, दोपहर या शाम चुनें।",
        routineMorning: "🌅 सुबह",
        routineAfternoon: "☀️ दोपहर",
        routineEvening: "🌙 शाम",
        routineSuccess: "🎉 बहुत बढ़िया! आपने पूरी दिनचर्या याद रखी।",
        routineTryAgain: "कोई बात नहीं! क्रम याद रखने का प्रयास करें।",
        routineNextActivity: "✅ सही! अब अगली गतिविधि खोजें।",
        patternTitle: "🧩 पैटर्न पहचान",
        patternInstructions: "नीचे दिखाए गए पैटर्न को याद रखें।",
        patternChoose: "याद रखे गए पैटर्न पर टैप करें।",
        nextPatternRound: "अगला पैटर्न",
        patternSuccess: "✅ बहुत बढ़िया! आपने पैटर्न याद रखा।",
        patternTryAgain: "कोई बात नहीं। दूसरा प्रयास करें।",
        moodTitle: "😊 आज आप कैसा महसूस कर रहे हैं?",
        moodInstructions: "वह विकल्प चुनें जो आज आपकी भावना को सबसे अच्छी तरह दर्शाता है।",
        moodGood: "😀 मैं अच्छा महसूस कर रहा हूँ",
        moodOkay: "🙂 मैं ठीक महसूस कर रहा हूँ",
        moodNotGreat: "😐 मैं बहुत अच्छा महसूस नहीं कर रहा हूँ",
        moodWorried: "😟 मैं चिंतित महसूस कर रहा हूँ",
        moodTired: "😴 मैं थका हुआ महसूस कर रहा हूँ",
        moodSaving: "आपकी प्रतिक्रिया सहेजी जा रही है...",
        moodSaved: "💙 अपनी भावना साझा करने के लिए धन्यवाद।",
        moodError: "क्षमा करें, आपकी प्रतिक्रिया सहेजी नहीं जा सकी।",
        myReminders: "📅 मेरे रिमाइंडर",
        myRemindersDesc: "आज और आने वाले दिनों के लिए आपके देखभालकर्ता के रिमाइंडर।",
        loadingReminders: "रिमाइंडर लोड हो रहे हैं...",
        noRemindersFound: "कोई रिमाइंडर नहीं मिला।",
        markAsDone: "✓ पूर्ण चिह्नित करें",
        done: "✅ पूर्ण",
        completed: "✅ पूर्ण",
        dueNow: "🔔 अभी देय",
        passed: "बीत चुका",
        today: "आज",
        upcoming: "आगामी",
        myProgress: "📊 मेरी प्रगति",
        myProgressDesc: "आपकी संज्ञानात्मक गतिविधि का प्रदर्शन नीचे दिखाया गया है।",
        loadingProgress: "प्रगति लोड हो रही है...",
        noActivityResults: "अभी तक कोई गतिविधि परिणाम नहीं है।",
        activities: "गतिविधियाँ",
        averageScore: "औसत अंक",
        bestScore: "सर्वश्रेष्ठ अंक",
        successful: "सफल",
        caregiverDashboard: "👨‍👩‍👧 देखभालकर्ता डैशबोर्ड",
        caregiverDashboardDesc: "मरीज़ की संज्ञानात्मक गतिविधि और हालिया प्रदर्शन की निगरानी करें।",
        loadingCaregiver: "देखभालकर्ता डैशबोर्ड लोड हो रहा है...",
        noCaregiverActivity: "मरीज़ की कोई गतिविधि दर्ज नहीं की गई है।",
        patientActivitySummary: "📊 मरीज़ गतिविधि सारांश",
        patientMoodInsights: "😊 मरीज़ के मनोदशा अंतर्दृष्टि",
        noMoodCheckins: "📭 अभी तक कोई मनोदशा दर्ज नहीं की गई है।",
        latestMood: "नवीनतम",
        recentMoodHistory: "हाल का मनोदशा इतिहास",
        recentActivity: "📝 हालिया गतिविधि",
        createReminder: "🔔 रिमाइंडर बनाएँ",
        createReminderDesc: "मरीज़ के लिए नया रिमाइंडर बनाएँ।",
        saveReminder: "💾 रिमाइंडर सहेजें",
        savedReminders: "📋 सहेजे गए रिमाइंडर",
        noSavedReminders: "📭 कोई रिमाइंडर नहीं बनाया गया है।",
        deleteReminder: "🗑️ हटाएँ",
        completedByPatient: "✅ मरीज़ द्वारा पूर्ण",
        pending: "⏳ लंबित",
        assistantTitle: "🤖 स्मृति सहायक",
        promptPlaceholder: "अपना प्रश्न यहाँ लिखें...",
        startListening: "सुनना शुरू करें",
        askAssistant: "सहायक से पूछें",
        readAloud: "उत्तर बोलकर सुनाएँ",
        voiceHelp: "बोलकर प्रश्न पूछने के लिए “सुनना शुरू करें” पर टैप करें।",
        goodMorning: "शुभ प्रभात 👋",
        goodAfternoon: "शुभ दोपहर 👋",
        goodEvening: "शुभ संध्या 👋",
        todayPlan: "यहाँ आज के लिए आपकी योजना और सारांश है।",
        dailyProgressTitle: "आज की प्रगति",
        dailyProgressHelp: "आज की स्मृति गतिविधि, मन की स्थिति और रिमाइंडर के आधार पर।",
        dailyProgressNoRemindersHelp: "आज की स्मृति गतिविधि और मन की स्थिति के आधार पर (आज कोई रिमाइंडर नहीं है)।",
        todaysPriorities: "🎯 आज की प्राथमिकताएं",
        dailyPlan: "📅 दैनिक योजना",
        viewDailyPlan: "दैनिक योजना देखें",
        yourPlanToday: "आज की आपकी योजना",
        morning: "सुबह",
        afternoon: "दोपहर",
        evening: "शाम",
        anytime: "किसी भी समय",
        nothingScheduled: "कुछ भी निर्धारित नहीं है",
        tasksRemaining: "शेष कार्य",
        todaysActivity: "उपलब्ध गतिविधि",
        appointmentCategory: "अपॉइंटमेंट",
        medicationCategory: "दवा",
        personalCategory: "व्यक्तिगत",
        activityCategory: "गतिविधि",
        hydrationCategory: "जलपान",
        otherCategory: "अन्य",
        filterAll: "सभी",
        filterPending: "बकाया",
        filterCompleted: "पूर्ण",
        quickAccess: "⚡ त्वरित पहुंच",
        completedTasksOf: "पूर्ण",
        checkIn: "चेक-इन करें",
        checkInAgain: "पुनः चेक-इन करें",
        continueReminders: "📅 आज के रिमाइंडर पूरे करें",
        continueActivity: "🧠 आज की स्मृति गतिविधि शुरू करें",
        continueMood: "😊 मन की स्थिति दर्ज करें",
        continueGreatJob: "🎉 आज का कार्य पूर्ण! अन्य गतिविधि आज़माएँ",
        todayRemindersTitle: "आज के रिमाइंडर",
        pendingCount: "लंबित",
        completedTodayCount: "आज पूर्ण किए गए",
        noRemindersScheduledToday: "आज के लिए कोई रिमाइंडर निर्धारित नहीं है।",
        todayActivityTitle: "आज की स्मृति गतिविधि",
        activityCompletedToday: "✅ आज गतिविधि पूरी हो चुकी है",
        noActivityToday: "⏳ आज कोई गतिविधि पूरी नहीं हुई",
        latestMoodLabel: "नवीनतम मन की स्थिति",
        noMoodCheckinToday: "📭 आज कोई प्रविष्टि नहीं। आप कैसा महसूस कर रहे हैं?",
        recentPerformanceTitle: "हालिया प्रदर्शन सारांश",
        recentAverage: "हाल का औसत अंक",
        noPerformanceData: "अभी तक कोई गतिविधि परिणाम दर्ज नहीं है।",
        loadingDashboard: "आपका डैशबोर्ड लोड हो रहा है...",
        caregiverInsightsTitle: "💡 देखरेख अंतर्दृष्टि",
        caregiverInsightsSub: "हालिया रोगी भागीदारी, रिमाइंडर पूर्णता और दिनचर्या का सारांश।",
        activityParticipationLabel: "गतिविधि भागीदारी",
        activeDaysLabel: "इस सप्ताह सक्रिय दिन",
        todaysRemindersLabel: "आज के रिमाइंडर",
        noRemindersScheduled: "आज कोई रिमाइंडर निर्धारित नहीं है।",
        pendingRemindersCount: "लंबित",
        completedRemindersCount: "पूर्ण",
        participationTrendLabel: "भागीदारी रुझान",
        trendIncreased: "पिछली अवधि की तुलना में गतिविधि भागीदारी बढ़ी है।",
        trendDecreased: "पिछली अवधि की तुलना में गतिविधि भागीदारी कम थी।",
        trendSimilar: "गतिविधि भागीदारी पिछली अवधि के समान थी।",
        trendInsufficientData: "तुलना के लिए अभी पर्याप्त गतिविधि इतिहास नहीं है।",
        progressTitle: "📊 मेरी प्रगति और इतिहास",
        progressSubtitle: "अपनी गतिविधियों, हालिया अंकों और दैनिक भागीदारी को देखें।",
        totalActivities: "कुल गतिविधियाँ",
        recentAverageScore: "हाल का औसत अंक",
        latestActivityHighlight: "🌟 नवीनतम गतिविधि",
        weeklyParticipationTitle: "📈 7-दिवसीय गतिविधि भागीदारी",
        activityHistoryTitle: "📝 गतिविधि इतिहास",
        showMore: "और इतिहास देखें",
        noActivitiesYetTitle: "📭 अभी तक कोई गतिविधि पूरी नहीं हुई",
        noActivitiesYetSub: "अपनी प्रगति को ट्रैक करने के लिए अपनी पहली मानसिक गतिविधि पूरी करें!",
        startFirstActivity: "▶ गतिविधि शुरू करें",
        activityMemorySequence: "स्मृति क्रम",
        activityAttentionChallenge: "ध्यान चुनौती",
        activityRoutineRecall: "दैनिक दिनचर्या",
        activityPatternRecognition: "पैटर्न पहचान",
        difficultyLabel: "कठिनाई",
        attemptsLabel: "प्रयास",
        modeLabel: "मोड",
        dateLabel: "तिथि",
        floatingAiAssistant: "🤖 एआई सहायक",
        close: "बंद करें",
        send: "भेजें",
        typeQuestion: "अपना प्रश्न यहाँ लिखें...",
        thinking: "सहायक सोच रहा है...",
        aiError: "क्षमा करें, सहायक अभी उत्तर नहीं दे सकता।",
        aiDisclaimer: "केवल ऐप सहायता • चिकित्सा सलाह के लिए नहीं",
        recommendedForYou: "आपके लिए अनुशंसित",
        tryThisNext: "आगे इस गतिविधि को आज़माएं।",
        basedOnRecentActivity: "आपकी हालिया गतिविधि के आधार पर",
        activityNotRecentlyTried: "आपने हाल ही में यह गतिविधि नहीं की है।",
        activityNeverAttempted: "आपने अभी तक यह गतिविधि नहीं आज़माई है।",
        activityVariety: "यह आपकी हालिया गतिविधियों में विविधता लाता है।",
        noActivityHistory: "शुरू करने के लिए इस गतिविधि को आज़माएं।",
        personalMilestones: "व्यक्तिगत मील के पत्थर",
        milestonesAchieved: "हासिल किए गए मील के पत्थर",
        viewMilestones: "मील के पत्थर देखें",
        milestoneFirstActivityTitle: "पहली गतिविधि",
        milestoneFirstActivityDesc: "अपनी पहली संज्ञानात्मक गतिविधि पूरी की।",
        milestoneThreeActivitiesTitle: "3 गतिविधियां पूरी कीं",
        milestoneThreeActivitiesDesc: "3 संज्ञानात्मक गतिविधियां पूरी कीं।",
        milestoneFiveActivitiesTitle: "5 गतिविधियां पूरी कीं",
        milestoneFiveActivitiesDesc: "5 संज्ञानात्मक गतिविधियां पूरी कीं।",
        milestoneThreeActiveDaysTitle: "3 सक्रिय दिन",
        milestoneThreeActiveDaysDesc: "3 अलग-अलग दिनों में भाग लिया।",
        milestoneTenActivitiesTitle: "10 गतिविधियां पूरी कीं",
        milestoneTenActivitiesDesc: "10 संज्ञानात्मक गतिविधियां पूरी कीं।",
        milestoneAchieved: "हासिल किया",
        milestoneInProgress: "प्रगति में",
        dailyConsistency: "दैनिक निरंतरता",
        currentStreak: "वर्तमान सक्रिय सिलसिला",
        daysInARow: "दिन लगातार",
        activeThisWeek: "इस सप्ताह सक्रिय दिन",
        keepItUp: "अपनी दैनिक दिनचर्या बनाए रखने के लिए बहुत बढ़िया!",
        startStreak: "अपना सिलसिला बनाने के लिए आज एक गतिविधि पूरी करें!",
        dayStreakLabel: "दिन का सिलसिला",
        filterAllActivities: "सभी गतिविधियां",
        filterMemorySequence: "मेमोरी अनुक्रम",
        filterAttentionChallenge: "ध्यान चुनौती",
        filterRoutineRecall: "दैनिक दिनचर्या स्मरण",
        filterPatternRecognition: "पैटर्न पहचान",
        noActivitiesForFilter: "इस खेल के लिए अभी तक कोई गतिविधि पूरी नहीं हुई है।",
        startThisActivity: "यह गतिविधि शुरू करें",
        mindfulPauseTitle: "शांत विराम और फोकस रीसेट",
        mindfulPauseSub: "आगे बढ़ने से पहले रुकने और धीरे-धीरे सांस लेने के लिए एक शांत मिनट लें।",
        startPause: "शांत विराम शुरू करें",
        pauseBreather: "रोकें",
        resetBreather: "रीसेट करें",
        phaseInhale: "धीरे-धीरे सांस अंदर लें...",
        phaseHold: "शांति से सांस रोकें...",
        phaseExhale: "धीरे-धीरे सांस बाहर छोड़ें...",
        phaseRest: "आराम करें...",
        breatherComplete: "शांत विराम लेने के लिए बढ़िया काम। तैयार होने पर जारी रखें।"
    ,
        accessibilityDisplay: "प्रदर्शन और पहुँच",
        accessibilityDisplayDesc: "सुविधाजनक देखने के लिए टेक्स्ट का आकार और कंट्रास्ट समायोजित करें।",
        textSize: "टेक्स्ट का आकार",
        textSizeStandard: "मानक",
        textSizeLarge: "बड़ा (+15%)",
        textSizeExtraLarge: "बहुत बड़ा (+30%)",
        highContrast: "उच्च कंट्रास्ट",
        highContrastOn: "चालू (बढ़ा हुआ कंट्रास्ट)",
        highContrastOff: "बंद (मानक शांत)",
        resetDisplaySettings: "मानक पर रीसेट करें",
        saveDisplaySettings: "संपन्न",
        displaySettingsSaved: "प्रदर्शन सेटिंग्स सहेज ली गईं।"
    },
    as: {
        backToDashboard: "← ডেশ্বব'ৰ্ডলৈ ঘূৰি যাওক",
        logout: "🚪 লগ আউট",
        welcome: "স্বাগতম 👋",
        welcomeDesc: "এই মঞ্চই প্ৰবীণ ব্যৱহাৰকাৰীসকলৰ বাবে সৰল জ্ঞানীয় কাৰ্যকলাপ, স্মৃতি সহায় আৰু সহায়ক সা-সঁজুলি প্ৰদান কৰে।",
        cognitiveActivity: "🧠 জ্ঞানীয় কাৰ্যকলাপ",
        cognitiveDesc: "স্মৃতি, মনোযোগ আৰু চিন্তাৰ দক্ষতা বৃদ্ধি কৰিবলৈ তৈয়াৰ কৰা সৰল কাৰ্যকলাপবোৰ সম্পূৰ্ণ কৰক।",
        startActivity: "কাৰ্যকলাপ আৰম্ভ কৰক",
        attention: "🎯 মনোযোগৰ প্ৰত্যাহ্বান",
        routine: "🔢 দৈনন্দিন কাৰ্যসূচী মনত পেলাওক",
        pattern: "🧩 আৰ্হি চিনাক্তকৰণ",
        mood: "😊 মনৰ অৱস্থা",
        reminders: "📅 সোঁৱৰণী",
        remindersDesc: "গুৰুত্বপূৰ্ণ দৈনন্দিন কাম আৰু কাৰ্যসূচী মনত ৰাখক।",
        viewReminders: "সোঁৱৰণী চাওক",
        progress: "📊 অগ্ৰগতি",
        progressDesc: "সময়ৰ লগে লগে কাৰ্যকলাপত অংশগ্ৰহণ আৰু অগ্ৰগতি পৰ্যবেক্ষণ কৰক।",
        viewProgress: "অগ্ৰগতি চাওক",
        caregiver: "👨‍👩‍👧 যত্ন লওঁতা",
        caregiverDesc: "ব্যৱহাৰকাৰীৰ দৈনন্দিন কাম-কাজত সহায় কৰিবলৈ যত্ন লওঁতাসকলৰ বাবে এক নিৰ্দিষ্ট স্থান।",
        caregiverArea: "যত্ন লওঁতাৰ এলেকা",
        assistant: "🤖 স্মৃতি সহায়ক",
        assistantDesc: "সহায়কক এটা সাধাৰণ প্ৰশ্ন সোধক বা প্লেটফৰ্ম ব্যৱহাৰ কৰাত সহায় বিচাৰক।",
        openAssistant: "সহায়ক খোলক",
        memoryTitle: "🧠 স্মৃতিৰ ক্ৰম",
        rememberNumbers: "তলত দেখুওৱা সংখ্যাবোৰ মনত ৰাখক।",
        rememberObjects: "এই চিনাকি বস্তুবোৰ ক্ৰম অনুসৰি মনত ৰাখক।",
        enterNumbers: "এতিয়া মনত থকা সংখ্যাবোৰ লিখক:",
        chooseObjects: "মনত থকা ক্ৰমত বস্তুবোৰত টিপক।",
        checkAnswer: "উত্তৰ পৰীক্ষা কৰক",
        nextRound: "পৰৱৰ্তী ৰাউণ্ড",
        memorySuccess: "✅ বৰ ভাল! আপুনি সঠিকভাৱে মনত ৰাখিছে।",
        memoryTryAgain: "ঠিক আছে। আকৌ চেষ্টা কৰোঁ আহক।",
        placeholderEnterNumber: "সংখ্যা লিখক",
        standardMode: "🔢 মানক সংখ্যা",
        culturalMode: "🌿 চিনাকি বস্তু",
        attentionTitle: "🎯 মনোযোগৰ প্ৰত্যাহ্বান",
        attentionInstructions: "কেৱল এবাৰ দেখা পোৱা সংখ্যাটো বিচাৰি উলিওৱক।",
        startAttentionGame: "মনোযোগ খেল আৰম্ভ কৰক",
        attentionSuccess: "✅ বৰ ভাল! আপুনি বিচাৰি পালে।",
        attentionTryAgain: "ঠিক আছে। আকৌ চেষ্টা কৰক!",
        routineTitle: "🔢 দৈনন্দিন কাৰ্যসূচী মনত পেলাওক",
        rememberRoutine: "দেখুওৱা ক্ৰমত কামবোৰ মনত ৰাখক।",
        chooseTime: "পুৱা, দুপৰীয়া বা সন্ধিয়া বাছক।",
        routineMorning: "🌅 পুৱা",
        routineAfternoon: "☀️ দুপৰীয়া",
        routineEvening: "🌙 সন্ধিয়া",
        routineSuccess: "🎉 বৰ ভাল! আপুনি গোটেই কাৰ্যসূচী মনত ৰাখিলে।",
        routineTryAgain: "ঠিক আছে! ক্ৰমটো মনত ৰাখিবলৈ চেষ্টা কৰক।",
        routineNextActivity: "✅ শুদ্ধ! এতিয়া পিছৰ কামটো বিচাৰক।",
        patternTitle: "🧩 আৰ্হি চিনাক্তকৰণ",
        patternInstructions: "তলত দেখুওৱা আৰ্হিটো মনত ৰাখক।",
        patternChoose: "মনত থকা আৰ্হিটোত টিপক।",
        nextPatternRound: "পৰৱৰ্তী আৰ্হি",
        patternSuccess: "✅ বৰ ভাল! আপুনি আৰ্হিটো মনত ৰাখিলে।",
        patternTryAgain: "ঠিক আছে। আন এটা চেষ্টা কৰোঁ আহক।",
        moodTitle: "😊 আজি আপোনাৰ মন কেনে লাগিছে?",
        moodInstructions: "আজি আপোনাৰ অনুভৱক সঠিকভাৱে প্ৰকাশ কৰা বিকল্পটো বাছক।",
        moodGood: "😀 মই ভাল অনুভৱ কৰিছোঁ",
        moodOkay: "🙂 মই ঠিক অনুভৱ কৰিছোঁ",
        moodNotGreat: "😐 মোৰ মন বৰ ভাল লগা নাই",
        moodWorried: "😟 মই চিন্তিত অনুভৱ কৰিছোঁ",
        moodTired: "😴 মই ভাগৰুৱা অনুভৱ কৰিছোঁ",
        moodSaving: "আপোনাৰ সঁহাৰি সংৰক্ষণ কৰা হৈছে...",
        moodSaved: "💙 আপোনাৰ অনুভৱ ব্যক্ত কৰাৰ বাবে ধন্যবাদ।",
        moodError: "দুঃখিত, আপোনাৰ সঁহাৰি সংৰক্ষণ কৰিব পৰা নগ'ল।",
        myReminders: "📅 মোৰ সোঁৱৰণী",
        myRemindersDesc: "আজি আৰু আগন্তুক দিনবোৰৰ বাবে আপোনাৰ যত্ন লওঁতাৰ সোঁৱৰণী।",
        loadingReminders: "সোঁৱৰণী লোড হৈ আছে...",
        noRemindersFound: "কোনো সোঁৱৰণী পোৱা নগ'ল।",
        markAsDone: "✓ সম্পূৰ্ণ বুলি চিহ্নিত কৰক",
        done: "✅ সম্পূৰ্ণ",
        completed: "✅ সম্পূৰ্ণ",
        dueNow: "🔔 এতিয়াই কৰণীয়",
        passed: "পাৰ হৈ গ'ল",
        today: "আজি",
        upcoming: "আহিবলগীয়া",
        myProgress: "📊 মোৰ অগ্ৰগতি",
        myProgressDesc: "আপোনাৰ কাৰ্যকলাপৰ প্ৰদৰ্শন তলত দেখুওৱা হৈছে।",
        loadingProgress: "অগ্ৰগতি লোড হৈ আছে...",
        noActivityResults: "এতিয়ালৈকে কোনো কাৰ্যকলাপৰ ফলাফল নাই।",
        activities: "কাৰ্যকলাপ",
        averageScore: "গড় নম্বৰ",
        bestScore: "শ্ৰেষ্ঠ নম্বৰ",
        successful: "সফল",
        caregiverDashboard: "👨‍👩‍👧 যত্ন লওঁতাৰ ডেশ্বব'ৰ্ড",
        caregiverDashboardDesc: "ৰোগীৰ জ্ঞানীয় কাৰ্যকলাপ আৰু শেহতীয়া প্ৰদৰ্শন নিৰীক্ষণ কৰক।",
        loadingCaregiver: "যত্ন লওঁতাৰ ডেশ্বব'ৰ্ড লোড হৈ আছে...",
        noCaregiverActivity: "ৰোগীৰ কোনো কাৰ্যকলাপ এতিয়ালৈকে লিপিবদ্ধ হোৱা নাই।",
        patientActivitySummary: "📊 ৰোগীৰ কাৰ্যকলাপৰ সাৰাংশ",
        patientMoodInsights: "😊 ৰোগীৰ মনৰ অৱস্থাৰ বিৱৰণ",
        noMoodCheckins: "📭 এতিয়ালৈকে কোনো মনৰ অৱস্থা লিপিবদ্ধ কৰা হোৱা নাই।",
        latestMood: "শেহতীয়া",
        recentMoodHistory: "শেহতীয়া মনৰ ইতিহাস",
        recentActivity: "📝 শেহতীয়া কাৰ্যকলাপ",
        createReminder: "🔔 সোঁৱৰণী সৃষ্টি কৰক",
        createReminderDesc: "ৰোগীৰ বাবে এটা নতুন সোঁৱৰণী সৃষ্টি কৰক।",
        saveReminder: "💾 সোঁৱৰণী সংৰক্ষণ কৰক",
        savedReminders: "📋 সংৰক্ষিত সোঁৱৰণী",
        noSavedReminders: "📭 কোনো সোঁৱৰণী সৃষ্টি কৰা হোৱা নাই।",
        deleteReminder: "🗑️ মচক",
        completedByPatient: "✅ ৰোগীয়ে সম্পূৰ্ণ কৰিলে",
        pending: "⏳ বাকী আছে",
        assistantTitle: "🤖 স্মৃতি সহায়ক",
        promptPlaceholder: "আপোনাৰ প্ৰশ্ন ইয়াত লিখক...",
        startListening: "শুনা আৰম্ভ কৰক",
        askAssistant: "সহায়কক সোধক",
        readAloud: "উত্তৰটো স্পষ্টকৈ শুনক",
        voiceHelp: "মুখেৰে প্ৰশ্ন সুধিবলৈ “শুনা আৰম্ভ কৰক”ত টিপক।",
        goodMorning: "সুপ্রভাত 👋",
        goodAfternoon: "শুভ অপৰাহ্ন 👋",
        goodEvening: "শুভ সন্ধ্যা 👋",
        todayPlan: "ইয়াত আজিৰ বাবে আপোনাৰ পৰিকল্পনা আৰু সাৰাংশ আগবঢ়োৱা হৈছে।",
        dailyProgressTitle: "আজিৰ অগ্ৰগতি",
        dailyProgressHelp: "আজিৰ জ্ঞানীয় কাৰ্যকলাপ, মনৰ অৱস্থা আৰু সোঁৱৰণীৰ ওপৰত আধাৰিত।",
        dailyProgressNoRemindersHelp: "আজিৰ জ্ঞানীয় কাৰ্যকলাপ আৰু মনৰ অৱস্থাৰ ওপৰত আধাৰিত (আজি কোনো সোঁৱৰণী নাই)।",
        todaysPriorities: "🎯 আজিৰ প্ৰাথমিকতাসমূহ",
        dailyPlan: "📅 দৈনিক পৰিকল্পনা",
        viewDailyPlan: "দৈনিক পৰিকল্পনা চাওক",
        yourPlanToday: "আজিৰ আপোনাৰ পৰিকল্পনা",
        morning: "ৰাতিপুৱা",
        afternoon: "আবেলিলৈ",
        evening: "গধূলি",
        anytime: "যিকোনো সময়ত",
        nothingScheduled: "একো নিৰ্ধাৰিত হোৱা নাই",
        tasksRemaining: "বাকী থকা কাৰ্যসূচী",
        todaysActivity: "উপলব্ধ কাৰ্যকলাপ",
        appointmentCategory: "সাক্ষাৎকাৰ",
        medicationCategory: "ঔষধ",
        personalCategory: "ব্যক্তিগত",
        activityCategory: "কাৰ্যকলাপ",
        hydrationCategory: "পানী খোৱা",
        otherCategory: "অন্যান্য",
        filterAll: "সকলো",
        filterPending: "বাকী থকা",
        filterCompleted: "সম্পূৰ্ণ",
        quickAccess: "⚡ দ্ৰুত প্ৰৱেশ",
        completedTasksOf: "সম্পূৰ্ণ হ’ল",
        checkIn: "চেক-ইন কৰক",
        checkInAgain: "পুনৰ চেক-ইন কৰক",
        continueReminders: "📅 আজিৰ সোঁৱৰণী সম্পূৰ্ণ কৰক",
        continueActivity: "🧠 আজিৰ জ্ঞানীয় কাৰ্যকলাপ আৰম্ভ কৰক",
        continueMood: "😊 মনৰ অৱস্থা প্ৰকাশ কৰক",
        continueGreatJob: "🎉 আজি সকলো কাম সম্পূৰ্ণ! আন এটা কাৰ্যকলাপ চেষ্টা কৰক",
        todayRemindersTitle: "আজিৰ সোঁৱৰণী",
        pendingCount: "বাকী আছে",
        completedTodayCount: "আজি সম্পূৰ্ণ কৰা হ'ল",
        noRemindersScheduledToday: "আজিৰ বাবে কোনো সোঁৱৰণী নিৰ্ধাৰিত নাই।",
        todayActivityTitle: "আজিৰ জ্ঞানীয় কাৰ্যকলাপ",
        activityCompletedToday: "✅ আজি কাৰ্যকলাপ সম্পূৰ্ণ হৈছে",
        noActivityToday: "⏳ আজি কোনো কাৰ্যকলাপ সম্পূৰ্ণ হোৱা নাই",
        latestMoodLabel: "শেহতীয়া মনৰ অৱস্থা",
        noMoodCheckinToday: "📭 আজি মনৰ অৱস্থা লিপিবদ্ধ কৰা নাই। আপোনাৰ মন কেনে লাগিছে?",
        recentPerformanceTitle: "শেহতীয়া প্ৰদৰ্শনৰ সাৰাংশ",
        recentAverage: "শেহতীয়া গড় নম্বৰ",
        noPerformanceData: "এতিয়ালৈকে কোনো ফলাফল লিপিবদ্ধ হোৱা নাই।",
        loadingDashboard: "আপোনাৰ ডেশ্বব'ৰ্ড লোড হৈ আছে...",
        caregiverInsightsTitle: "💡 যত্ন লওঁতাৰ বিৱৰণ",
        caregiverInsightsSub: "শেহতীয়া ৰোগীৰ অংশগ্ৰহণ, সোঁৱৰণী সম্পূৰ্ণ কৰা আৰু নিয়মীয়া কাৰ্যসূচীৰ সাৰাংশ।",
        activityParticipationLabel: "কাৰ্যকলাপত অংশগ্ৰহণ",
        activeDaysLabel: "এই সপ্তাহত সক্ৰিয় দিন",
        todaysRemindersLabel: "আজিৰ সোঁৱৰণী",
        noRemindersScheduled: "আজি কোনো সোঁৱৰণী নিৰ্ধাৰিত নাই।",
        pendingRemindersCount: "বাকী আছে",
        completedRemindersCount: "সম্পূৰ্ণ",
        participationTrendLabel: "অংশগ্ৰহণৰ ধাৰা",
        trendIncreased: "পূৰ্বৰ তুলনাত কাৰ্যকলাপত অংশগ্ৰহণ বৃদ্ধি পাইছে।",
        trendDecreased: "পূৰ্বৰ তুলনাত কাৰ্যকলাপত অংশগ্ৰহণ কম আছিল।",
        trendSimilar: "কাৰ্যকলাপত অংশগ্ৰহণ পূৰ্বৰ সৈতে একে আছিল।",
        trendInsufficientData: "তুলনা কৰিবলৈ এতিয়ালৈকে পৰ্যাপ্ত ইতিহাস নাই।",
        progressTitle: "📊 মোৰ অগ্ৰগতি আৰু ইতিহাস",
        progressSubtitle: "আপোনাৰ সম্পূৰ্ণ হোৱা কাৰ্যকলাপ, শেহতীয়া নম্বৰ আৰু দৈনিক অংশগ্ৰহণ চাওক।",
        totalActivities: "মুঠ কাৰ্যকলাপ",
        recentAverageScore: "শেহতীয়া গড় নম্বৰ",
        latestActivityHighlight: "🌟 শেহতীয়া কাৰ্যকলাপ",
        weeklyParticipationTitle: "📈 7-দিনীয়া কাৰ্যকলাপত অংশগ্ৰহণ",
        activityHistoryTitle: "📝 কাৰ্যকলাপৰ ইতিহাস",
        showMore: "আৰু ইতিহাস চাওক",
        noActivitiesYetTitle: "📭 এতিয়ালৈকে কোনো কাৰ্যকলাপ সম্পূৰ্ণ হোৱা নাই",
        noActivitiesYetSub: "আপোনাৰ অগ্ৰগতি নিৰীক্ষণ কৰিবলৈ প্ৰথমটো জ্ঞানীয় কাৰ্যকলাপ সম্পূৰ্ণ কৰক!",
        startFirstActivity: "▶ কাৰ্যকলাপ আৰম্ভ কৰক",
        activityMemorySequence: "স্মৃতিৰ ক্ৰম",
        activityAttentionChallenge: "মনোযোগৰ প্ৰত্যাহ্বান",
        activityRoutineRecall: "দৈনন্দিন কাৰ্যসূচী",
        activityPatternRecognition: "আৰ্হি চিনাক্তকৰণ",
        difficultyLabel: "কঠিনতা",
        attemptsLabel: "প্ৰচেষ্টা",
        modeLabel: "ধৰণ",
        dateLabel: "তাৰিখ",
        floatingAiAssistant: "🤖 এআই সহায়ক",
        close: "বন্ধ কৰক",
        send: "প্ৰেৰণ কৰক",
        typeQuestion: "আপোনাৰ প্ৰশ্ন ইয়াত লিখক...",
        thinking: "সহায়ক ভাবি আছে...",
        aiError: "ক্ষমা কৰিব, সহায়কে এতিয়া উত্তৰ দিব পৰা নাই।",
        aiDisclaimer: "কেৱল অ্যাপ সাহায্য • চিকিৎসা পৰামৰ্শৰ বাবে নহয়",
        recommendedForYou: "আপোনাৰ বাবে চুপাৰিশ কৰা হৈছে",
        tryThisNext: "পাছত এই কাৰ্যকলাপটো চেষ্টা কৰক।",
        basedOnRecentActivity: "আপোনাৰ শেহতীয়া কাৰ্যকলাপৰ ওপৰত আধাৰিত",
        activityNotRecentlyTried: "আপুনি শেহতীয়াকৈ এই কাৰ্যকলাপটো কৰা নাই।",
        activityNeverAttempted: "আপুনি এতিয়ালৈকে এই কাৰ্যকলাপটো চেষ্টা কৰা নাই।",
        activityVariety: "ই আপোনাৰ শেহতীয়া কাৰ্যকলাপত বৈচিত্ৰ্য আনিব।",
        noActivityHistory: "আৰম্ভ কৰিবলৈ এই কাৰ্যকলাপটো চেষ্টা কৰক।",
        personalMilestones: "ব্যক্তিগত মাইলৰ খুঁটি",
        milestonesAchieved: "অৰ্জন কৰা মাইলৰ খুঁটি",
        viewMilestones: "মাইলৰ খুঁটি চাওক",
        milestoneFirstActivityTitle: "প্ৰথম কাৰ্যকলাপ",
        milestoneFirstActivityDesc: "আপোনাৰ প্ৰথমটো কাৰ্যকলাপ সম্পূৰ্ণ কৰিলে।",
        milestoneThreeActivitiesTitle: "৩টা কাৰ্যকলাপ সম্পূৰ্ণ",
        milestoneThreeActivitiesDesc: "৩টা কাৰ্যকলাপ সম্পূৰ্ণ কৰিলে।",
        milestoneFiveActivitiesTitle: "৫টা কাৰ্যকলাপ সম্পূৰ্ণ",
        milestoneFiveActivitiesDesc: "৫টা কাৰ্যকলাপ সম্পূৰ্ণ কৰিলে।",
        milestoneThreeActiveDaysTitle: "৩টা সক্ৰিয় দিন",
        milestoneThreeActiveDaysDesc: "৩টা ভিন্ন দিনত অংশগ্ৰহণ কৰিলে।",
        milestoneTenActivitiesTitle: "১০টা কাৰ্যকলাপ সম্পূৰ্ণ",
        milestoneTenActivitiesDesc: "১০টা কাৰ্যকলাপ সম্পূৰ্ণ কৰিলে।",
        milestoneAchieved: "অৰ্জিত",
        milestoneInProgress: "চলিয়েই আছে",
        dailyConsistency: "দৈনন্দিন ধাৰাবাহিকতা",
        currentStreak: "বৰ্তমান সক্ৰিয় ধাৰা",
        daysInARow: "দিনৰ ক্ৰমাগত ধাৰা",
        activeThisWeek: "এই সপ্তাহত সক্ৰিয় দিন",
        keepItUp: "আপোনাৰ দৈনন্দিন নিয়মানুবৰ্তিতা বজাই ৰখাৰ বাবে সুন্দৰ কাম!",
        startStreak: "আপোনাৰ ধাৰা গঢ়ি তুলিবলৈ আজি এটা কাৰ্যকলাপ সম্পূৰ্ণ কৰক!",
        dayStreakLabel: "দিনৰ ধাৰা",
        filterAllActivities: "সকলো কাৰ্যকলাপ",
        filterMemorySequence: "স্মৃতি ক্ৰম",
        filterAttentionChallenge: "মনোযোগ প্ৰত্যাহ্বান",
        filterRoutineRecall: "দৈনন্দিন নিয়ম মনত পেলোৱা",
        filterPatternRecognition: "প্ৰকাৰ চিনাক্তকৰণ",
        noActivitiesForFilter: "এই খেলৰ বাবে এতিয়ালৈকে কোনো কাৰ্যকলাপ সম্পূৰ্ণ হোৱা নাই।",
        startThisActivity: "এই কাৰ্যকলাপ আৰম্ভ কৰক",
        mindfulPauseTitle: "শান্ত বিৰাম আৰু মনোযোগ পুনৰসংহতি",
        mindfulPauseSub: "আগবাঢ়ি যোৱাৰ পূৰ্বে অলপ সময় ৰৈ লাহে লাহে উশাহ ল’বলৈ এটা শান্ত মিনিট লওক।",
        startPause: "শান্ত বিৰাম আৰম্ভ কৰক",
        pauseBreather: "ৰখাওক",
        resetBreather: "পুনৰ সংহতি কৰক",
        phaseInhale: "লাহে লাহে উশাহ লওক...",
        phaseHold: "শান্তিৰে ধৰি ৰাখক...",
        phaseExhale: "লাহে লাহে নিশাহ এৰক...",
        phaseRest: "জিৰণি লওক...",
        breatherComplete: "শান্ত বিৰাম লোৱাৰ বাবে ভাল কাম কৰিলে। সাজু হ’লে অব্যাহত ৰাখক।"
    ,
        accessibilityDisplay: "প্ৰদৰ্শন আৰু সুলভতা",
        accessibilityDisplayDesc: "সুবিধাজনক পঢ়াৰ বাবে আখৰৰ আকাৰ আৰু বৈপৰীত্য সমন্বয় কৰক।",
        textSize: "আখৰৰ আকাৰ",
        textSizeStandard: "মানক",
        textSizeLarge: "ডাঙৰ (+15%)",
        textSizeExtraLarge: "অতি ডাঙৰ (+30%)",
        highContrast: "উচ্চ বৈপৰীত্য",
        highContrastOn: "অন (উন্নত বৈপৰীত্য)",
        highContrastOff: "অফ (মানক শান্ত)",
        resetDisplaySettings: "মানকলৈ পুনৰ সংহতি",
        saveDisplaySettings: "সম্পন্ন",
        displaySettingsSaved: "প্ৰদৰ্শন ছেটিং সংৰক্ষণ কৰা হ’ল।"
    },
    bn: {
        backToDashboard: "← ড্যাশবোর্ডে ফিরে যান",
        logout: "🚪 লগ আউট",
        welcome: "স্বাগতম 👋",
        welcomeDesc: "এই প্ল্যাটফর্মটি প্রবীণ ব্যবহারকারীদের জন্য সহজ মানসিক ক্রিয়াকলাপ, স্মৃতি সহায়তা এবং সহায়ক সরঞ্জাম সরবরাহ করে।",
        cognitiveActivity: "🧠 জ্ঞানীয় কার্যকলাপ",
        cognitiveDesc: "স্মৃতি, মনোযোগ এবং চিন্তা করার দক্ষতা বৃদ্ধি করার জন্য তৈরি সহজ কার্যকলাপগুলো সম্পন্ন করুন।",
        startActivity: "কার্যকলাপ শুরু করুন",
        attention: "🎯 মনোযোগের চ্যালেঞ্জ",
        routine: "🔢 দৈনন্দিন রুটিন মনে রাখুন",
        pattern: "🧩 প্যাটার্ন সনাক্তকরণ",
        mood: "😊 মনের অবস্থা",
        reminders: "📅 অনুস্মারক",
        remindersDesc: "গুরুত্বপূর্ণ দৈনন্দিন কাজ এবং সময়সূচী মনে রাখুন।",
        viewReminders: "অনুস্মারক দেখুন",
        progress: "📊 অগ্রগতি",
        progressDesc: "সময়ের সাথে সাথে কার্যকলাপে অংশগ্রহণ এবং অগ্রগতি পর্যবেক্ষণ করুন।",
        viewProgress: "অগ্রগতি দেখুন",
        caregiver: "👨‍👩‍👧 তত্ত্বাবধায়ক",
        caregiverDesc: "ব্যবহারকারীর দৈনন্দিন কাজে সহায়তা করার জন্য তত্ত্বাবধায়কদের জন্য একটি নির্দিষ্ট এলাকা।",
        caregiverArea: "তত্ত্বাবধায়ক এলাকা",
        assistant: "🤖 স্মৃতি সহায়ক",
        assistantDesc: "সহায়ককে একটি সাধারণ প্রশ্ন জিজ্ঞাসা করুন বা প্ল্যাটফর্ম ব্যবহারের সহায়তা নিন।",
        openAssistant: "সহায়ক খুলুন",
        memoryTitle: "🧠 স্মৃতি ক্রম",
        rememberNumbers: "নিচে দেখানো সংখ্যাগুলো মনে রাখুন।",
        rememberObjects: "এই পরিচিত জিনিসগুলো ক্রমানুসারে মনে রাখুন।",
        enterNumbers: "এখন মনে থাকা সংখ্যাগুলো লিখুন:",
        chooseObjects: "মনে রাখা ক্রমে জিনিসগুলোতে ট্যাপ করুন।",
        checkAnswer: "উত্তর পরীক্ষা করুন",
        nextRound: "পরবর্তী রাউন্ড",
        memorySuccess: "✅ চমৎকার! আপনি সঠিকভাবে মনে রেখেছেন।",
        memoryTryAgain: "ঠিক আছে। আবার চেষ্টা করি।",
        placeholderEnterNumber: "সংখ্যা লিখুন",
        standardMode: "🔢 স্ট্যান্ডার্ড সংখ্যা",
        culturalMode: "🌿 পরিচিত জিনিস",
        attentionTitle: "🎯 মনোযোগের চ্যালেঞ্জ",
        attentionInstructions: "যে সংখ্যাটি কেবল একবার দেখা যায় তা খুঁজে বের করুন।",
        startAttentionGame: "মনোযোগ খেলা শুরু করুন",
        attentionSuccess: "✅ চমৎকার! আপনি এটি খুঁজে পেয়েছেন।",
        attentionTryAgain: "ঠিক আছে। আবার চেষ্টা করুন!",
        routineTitle: "🔢 দৈনন্দিন রুটিন মনে রাখুন",
        rememberRoutine: "দেখানো ক্রমে কাজগুলো মনে রাখুন।",
        chooseTime: "সকাল, দুপুর বা সন্ধ্যা বেছে নিন।",
        routineMorning: "🌅 সকাল",
        routineAfternoon: "☀️ দুপুর",
        routineEvening: "🌙 সন্ধ্যা",
        routineSuccess: "🎉 চমৎকার! আপনি পুরো রুটিন মনে রেখেছেন।",
        routineTryAgain: "ঠিক আছে! ক্রম মনে রাখার চেষ্টা করুন।",
        routineNextActivity: "✅ সঠিক! এবার পরের কাজটি খুঁজুন।",
        patternTitle: "🧩 প্যাটার্ন সনাক্তকরণ",
        patternInstructions: "নিচে দেখানো প্যাটার্নটি মনে রাখুন।",
        patternChoose: "মনে থাকা প্যাটার্নে ট্যাপ করুন।",
        nextPatternRound: "পরবর্তী প্যাটার্ন",
        patternSuccess: "✅ চমৎকার! আপনি প্যাটার্নটি মনে রেখেছেন।",
        patternTryAgain: "ঠিক আছে। অন্য একটি চেষ্টা করি।",
        moodTitle: "😊 আজ আপনি কেমন অনুভব করছেন?",
        moodInstructions: "আজ আপনার অনুভূতি সবচেয়ে ভালোভাবে বর্ণনা করে এমন বিকল্পটি বেছে নিন।",
        moodGood: "😀 আমি ভালো অনুভব করছি",
        moodOkay: "🙂 আমি মোটামুটি ভালো আছি",
        moodNotGreat: "😐 আমার মন খুব একটা ভালো নেই",
        moodWorried: "😟 আমি চিন্তিত বোধ করছি",
        moodTired: "😴 আমি ক্লান্ত বোধ করছি",
        moodSaving: "আপনার প্রতিক্রিয়া সংরক্ষণ করা হচ্ছে...",
        moodSaved: "💙 আপনার অনুভূতি ভাগ করে নেওয়ার জন্য ধন্যবাদ।",
        moodError: "দুঃখিত, আপনার প্রতিক্রিয়া সংরক্ষণ করা যায়নি।",
        myReminders: "📅 আমার অনুস্মারক",
        myRemindersDesc: "আজ এবং আসন্ন দিনগুলোর জন্য আপনার তত্ত্বাবধায়কের অনুস্মারক।",
        loadingReminders: "অনুস্মারক লোড হচ্ছে...",
        noRemindersFound: "কোনো অনুস্মারক পাওয়া যায়নি।",
        markAsDone: "✓ সম্পন্ন হিসেবে চিহ্নিত করুন",
        done: "✅ সম্পন্ন",
        completed: "✅ সম্পন্ন",
        dueNow: "🔔 এখনই করণীয়",
        passed: "অতিক্রান্ত",
        today: "আজ",
        upcoming: "আসন্ন",
        myProgress: "📊 আমার অগ্রগতি",
        myProgressDesc: "আপনার জ্ঞানীয় কার্যকলাপের কর্মক্ষমতা নিচে দেখানো হয়েছে।",
        loadingProgress: "অগ্রগতি লোড হচ্ছে...",
        noActivityResults: "এখনও পর্যন্ত কোনো কার্যকলাপের ফলাফল নেই।",
        activities: "কার্যকলাপ",
        averageScore: "গড় স্কোর",
        bestScore: "সর্বোচ্চ স্কোর",
        successful: "সফল",
        caregiverDashboard: "👨‍👩‍👧 তত্ত্বাবধায়ক ড্যাশবোর্ড",
        caregiverDashboardDesc: "রোগীর জ্ঞানীয় কার্যকলাপ এবং সাম্প্রতিক কর্মক্ষমতা নিরীক্ষণ করুন।",
        loadingCaregiver: "তত্ত্বাবধায়ক ড্যাশবোর্ড লোড হচ্ছে...",
        noCaregiverActivity: "রোগীর কোনো কার্যকলাপ এখনও রেকর্ড করা হয়নি।",
        patientActivitySummary: "📊 রোগীর কার্যকলাপের সারাংশ",
        patientMoodInsights: "😊 রোগীর মানসিক অবস্থা পর্যবেক্ষণ",
        noMoodCheckins: "📭 এখনও পর্যন্ত কোনো মানসিক অবস্থা রেকর্ড করা হয়নি।",
        latestMood: "সাম্প্রতিক",
        recentMoodHistory: "সাম্প্রতিক মেজাজের ইতিহাস",
        recentActivity: "📝 সাম্প্রতিক কার্যকলাপ",
        createReminder: "🔔 অনুস্মারক তৈরি করুন",
        createReminderDesc: "রোগীর জন্য নতুন অনুস্মারক তৈরি করুন।",
        saveReminder: "💾 অনুস্মারক সংরক্ষণ করুন",
        savedReminders: "📋 সংরক্ষিত অনুস্মারক",
        noSavedReminders: "📭 কোনো অনুস্মারক তৈরি করা হয়নি।",
        deleteReminder: "🗑️ মুছুন",
        completedByPatient: "✅ রোগী দ্বারা সম্পন্ন",
        pending: "⏳ অপেক্ষমাণ",
        assistantTitle: "🤖 স্মৃতি সহায়ক",
        promptPlaceholder: "আপনার প্রশ্ন এখানে লিখুন...",
        startListening: "শোনা শুরু করুন",
        askAssistant: "সহায়ককে জিজ্ঞাসা করুন",
        readAloud: "উত্তরটি জোরে শুনুন",
        voiceHelp: "মুখে প্রশ্ন জিজ্ঞাসা করতে “শোনা শুরু করুন”-এ ট্যাপ করুন।",
        goodMorning: "সুপ্রভাত 👋",
        goodAfternoon: "শুভ অপরাহ্ন 👋",
        goodEvening: "শুভ সন্ধ্যা 👋",
        todayPlan: "এখানে আজকের জন্য আপনার পরিকল্পনা এবং সারাংশ দেওয়া হলো।",
        dailyProgressTitle: "আজকের অগ্রগতি",
        dailyProgressHelp: "আজকের জ্ঞানীয় কার্যকলাপ, মনের অবস্থা এবং অনুস্মারকের ওপর ভিত্তি করে।",
        dailyProgressNoRemindersHelp: "আজকের জ্ঞানীয় কার্যকলাপ এবং মনের অবস্থার ওপর ভিত্তি করে (আজ কোনো অনুস্মারক নেই)।",
        todaysPriorities: "🎯 আজকের অগ্রাধিকার",
        dailyPlan: "📅 দৈনিক পরিকল্পনা",
        viewDailyPlan: "দৈনিক পরিকল্পনা দেখুন",
        yourPlanToday: "আজকের আপনার পরিকল্পনা",
        morning: "সকাল",
        afternoon: "দুপুর",
        evening: "সন্ধ্যা",
        anytime: "যেকোনো সময়",
        nothingScheduled: "কিছু নির্ধারিত নেই",
        tasksRemaining: "অবশিষ্ট কাজ",
        todaysActivity: "উপলব্ধ কার্যকলাপ",
        appointmentCategory: "অ্যাপয়েন্টমেন্ট",
        medicationCategory: "ওষুধ",
        personalCategory: "ব্যক্তিগত",
        activityCategory: "কার্যকলাপ",
        hydrationCategory: "পানীয়",
        otherCategory: "অন্যান্য",
        filterAll: "সব",
        filterPending: "বিচারাধীন",
        filterCompleted: "সম্পন্ন",
        quickAccess: "⚡ দ্রুত অ্যাক্সেস",
        completedTasksOf: "সম্পন্ন",
        checkIn: "চেক-ইন করুন",
        checkInAgain: "আবার চেক-ইন করুন",
        continueReminders: "📅 আজকের অনুস্মারক সম্পন্ন করুন",
        continueActivity: "🧠 আজকের জ্ঞানীয় কার্যকলাপ শুরু করুন",
        continueMood: "😊 মনের অবস্থা নথিভুক্ত করুন",
        continueGreatJob: "🎉 আজকের কাজ শেষ! অন্য একটি কার্যকলাপ চেষ্টা করুন",
        todayRemindersTitle: "আজকের অনুস্মারক",
        pendingCount: "অপেক্ষমাণ",
        completedTodayCount: "আজ সম্পন্ন হয়েছে",
        noRemindersScheduledToday: "আজকের জন্য কোনো অনুস্মারক নির্ধারিত নেই।",
        todayActivityTitle: "আজকের জ্ঞানীয় কার্যকলাপ",
        activityCompletedToday: "✅ আজ কার্যকলাপ সম্পন্ন হয়েছে",
        noActivityToday: "⏳ আজ কোনো কার্যকলাপ সম্পন্ন হয়নি",
        latestMoodLabel: "সাম্প্রতিক মনের অবস্থা",
        noMoodCheckinToday: "📭 আজ কোনো এন্ট্রি নেই। আপনি কেমন আছেন?",
        recentPerformanceTitle: "সাম্প্রতিক পারফরম্যান্স সারাংশ",
        recentAverage: "সাম্প্রতিক গড় স্কোর",
        noPerformanceData: "এখনও পর্যন্ত কোনো কার্যকলাপের রেকর্ড নেই।",
        loadingDashboard: "আপনার ড্যাশবোর্ড লোড হচ্ছে...",
        caregiverInsightsTitle: "💡 তত্ত্বাবধায়কের ইনসাইট",
        caregiverInsightsSub: "সাম্প্রতিক রোগীর অংশগ্রহণ, অনুস্মারক সম্পন্ন করা এবং রুটিন কার্যকলাপের সারাংশ।",
        activityParticipationLabel: "কার্যকলাপে অংশগ্রহণ",
        activeDaysLabel: "এই সপ্তাহে সক্রিয় দিন",
        todaysRemindersLabel: "আজকের অনুস্মারক",
        noRemindersScheduled: "আজ কোনো অনুস্মারক নির্ধারিত নেই।",
        pendingRemindersCount: "অপেক্ষমাণ",
        completedRemindersCount: "সম্পন্ন",
        participationTrendLabel: "অংশগ্রহণের ধারা",
        trendIncreased: "পূর্ববর্তী সময়ের তুলনায় কার্যকলাপে অংশগ্রহণ বৃদ্ধি পেয়েছে।",
        trendDecreased: "পূর্ববর্তী সময়ের তুলনায় কার্যকলাপে অংশগ্রহণ কম ছিল।",
        trendSimilar: "কার্যকলাপে অংশগ্রহণ পূর্ববর্তী সময়ের অনুরূপ ছিল।",
        trendInsufficientData: "তুলনার জন্য এখনও পর্যাপ্ত কার্যকলাপের ইতিহাস নেই।",
        progressTitle: "📊 আমার অগ্রগতি এবং ইতিহাস",
        progressSubtitle: "আপনার সম্পন্ন করা কার্যকলাপ, সাম্প্রতিক স্কোর এবং দৈনিক অংশগ্রহণ দেখুন।",
        totalActivities: "মোট কার্যকলাপ",
        recentAverageScore: "সাম্প্রতিক গড় স্কোর",
        latestActivityHighlight: "🌟 সাম্প্রতিক কার্যকলাপ",
        weeklyParticipationTitle: "📈 ৭-দিনের কার্যকলাপ অংশগ্রহণ",
        activityHistoryTitle: "📝 কার্যকলাপের ইতিহাস",
        showMore: "আরও ইতিহাস দেখুন",
        noActivitiesYetTitle: "📭 এখনও পর্যন্ত কোনো কার্যকলাপ সম্পন্ন হয়নি",
        noActivitiesYetSub: "আপনার অগ্রগতি ট্র্যাক করতে আপনার প্রথম জ্ঞানীয় কার্যকলাপটি সম্পন্ন করুন!",
        startFirstActivity: "▶ কার্যকলাপ শুরু করুন",
        activityMemorySequence: "স্মৃতি ক্রম",
        activityAttentionChallenge: "মনোযোগের চ্যালেঞ্জ",
        activityRoutineRecall: "দৈনন্দিন রুটিন",
        activityPatternRecognition: "প্যাটার্ন সনাক্তকরণ",
        difficultyLabel: "কঠিনতা",
        attemptsLabel: "প্রচেষ্টা",
        modeLabel: "মোড",
        dateLabel: "তারিখ",
        floatingAiAssistant: "🤖 এআই সহকারী",
        close: "বন্ধ করুন",
        send: "পাঠান",
        typeQuestion: "আপনার প্রশ্ন এখানে লিখুন...",
        thinking: "সহকারী চিন্তা করছে...",
        aiError: "দুঃখিত, সহকারী এখন উত্তর দিতে পারছে না।",
        aiDisclaimer: "শুধুমাত্র অ্যাপ সাহায্য • চিকিৎসা পরামর্শের জন্য নয়",
        recommendedForYou: "আপনার জন্য প্রস্তাবিত",
        tryThisNext: "পরবর্তীতে এই কার্যকলাপটি চেষ্টা করুন।",
        basedOnRecentActivity: "আপনার সাম্প্রতিক কার্যকলাপের উপর ভিত্তি করে",
        activityNotRecentlyTried: "আপনি সম্প্রতি এই কার্যকলাপটি করেননি।",
        activityNeverAttempted: "আপনি এখনও এই কার্যকলাপটি চেষ্টা করেননি।",
        activityVariety: "এটি আপনার সাম্প্রতিক কার্যকলাপে বৈচিত্র্য আনে।",
        noActivityHistory: "শুরু করতে এই কার্যকলাপটি চেষ্টা করুন।",
        personalMilestones: "ব্যক্তিগত মাইলফলক",
        milestonesAchieved: "অর্জিত মাইলফলক",
        viewMilestones: "মাইলফলক দেখুন",
        milestoneFirstActivityTitle: "প্রথম কার্যকলাপ",
        milestoneFirstActivityDesc: "আপনার প্রথম কার্যকলাপ সম্পন্ন করেছেন।",
        milestoneThreeActivitiesTitle: "৩টি কার্যকলাপ সম্পন্ন",
        milestoneThreeActivitiesDesc: "৩টি কার্যকলাপ সম্পন্ন করেছেন।",
        milestoneFiveActivitiesTitle: "৫টি কার্যকলাপ সম্পন্ন",
        milestoneFiveActivitiesDesc: "৫টি কার্যকলাপ সম্পন্ন করেছেন।",
        milestoneThreeActiveDaysTitle: "৩টি সক্রিয় দিন",
        milestoneThreeActiveDaysDesc: "৩টি বিভিন্ন দিনে অংশগ্রহণ করেছেন।",
        milestoneTenActivitiesTitle: "১০টি কার্যকলাপ সম্পন্ন",
        milestoneTenActivitiesDesc: "১০টি কার্যকলাপ সম্পন্ন করেছেন।",
        milestoneAchieved: "অর্জিত",
        milestoneInProgress: "চলমান",
        dailyConsistency: "দৈনিক ধারাবাহিকতা",
        currentStreak: "বর্তমান সক্রিয় ধারা",
        daysInARow: "দিন পরপর",
        activeThisWeek: "এই সপ্তাহে সক্রিয় দিন",
        keepItUp: "আপনার দৈনিক রুটিন বজায় রাখার জন্য দুর্দান্ত কাজ!",
        startStreak: "আপনার ধারা তৈরি করতে আজ একটি কার্যকলাপ সম্পন্ন করুন!",
        dayStreakLabel: "দিনের ধারা",
        filterAllActivities: "সমস্ত কার্যকলাপ",
        filterMemorySequence: "মেমোরি অনুক্রম",
        filterAttentionChallenge: "মনযোগ চ্যালেঞ্জ",
        filterRoutineRecall: "দৈনিক রুটিন স্মরণ",
        filterPatternRecognition: "প্যাটার্ন শনাক্তকরণ",
        noActivitiesForFilter: "এই গেমের জন্য এখনও কোনো কার্যকলাপ সম্পন্ন হয়নি।",
        startThisActivity: "এই কার্যকলাপ শুরু করুন",
        mindfulPauseTitle: "শান্ত বিরতি এবং ফোকাস রিসেট",
        mindfulPauseSub: "এগিয়ে যাওয়ার আগে একটু থেমে ধীরে ধীরে শ্বাস নেওয়ার জন্য একটি শান্ত মিনিট নিন।",
        startPause: "শান্ত বিরতি শুরু করুন",
        pauseBreather: "থামান",
        resetBreather: "রিসেট করুন",
        phaseInhale: "ধীরে ধীরে শ্বাস নিন...",
        phaseHold: "শান্তিতে ধরে রাখুন...",
        phaseExhale: "ধীরে ধীরে শ্বাস ছাড়ুন...",
        phaseRest: "বিকল্প বিশ্রাম নিন...",
        breatherComplete: "শান্ত বিরতি নেওয়ার চমৎকার কাজ করেছেন। প্রস্তুত হলে চালিয়ে যান।"
    ,
        accessibilityDisplay: "প্রদর্শন এবং অ্যাক্সেসিবিলিটি",
        accessibilityDisplayDesc: "সহজে দেখার জন্য পাঠ্যের আকার এবং বৈসাদৃশ্য সামঞ্জস্য করুন।",
        textSize: "পাঠ্যের আকার",
        textSizeStandard: "সাধারণ",
        textSizeLarge: "বড় (+15%)",
        textSizeExtraLarge: "খুব বড় (+30%)",
        highContrast: "উচ্চ বৈসাদৃশ্য",
        highContrastOn: "চালু (উন্নত বৈসাদৃশ্য)",
        highContrastOff: "বন্ধ (সাধারণ শান্ত)",
        resetDisplaySettings: "সাধারণে রিসেট করুন",
        saveDisplaySettings: "সম্পন্ন",
        displaySettingsSaved: "প্রদর্শন সেটিংস আপডেট করা হয়েছে।"
    },
    ne: {
        backToDashboard: "← ड्यासबोर्डमा फर्कनुहोस्",
        logout: "🚪 लग आउट",
        welcome: "स्वागत छ 👋",
        welcomeDesc: "यो प्लेटफर्मले ज्येष्ठ नागरिकहरूका लागि सरल स्मरण गतिविधि, स्मृति सहयोग र सहयोगी उपकरणहरू प्रदान गर्दछ।",
        cognitiveActivity: "🧠 स्मरण गतिविधि",
        cognitiveDesc: "स्मृति, ध्यान र सोच्ने क्षमता अभिवृद्धि गर्नका लागि तयार पारिएका सरल गतिविधिहरू पूरा गर्नुहोस्।",
        startActivity: "गतिविधि सुरु गर्नुहोस्",
        attention: "🎯 ध्यान चुनौती",
        routine: "🔢 दैनिक दिनचर्या सम्झनुहोस्",
        pattern: "🧩 ढाँचा पहिचान",
        mood: "😊 मनको अवस्था",
        reminders: "📅 सम्झना",
        remindersDesc: "महत्त्वपूर्ण दैनिक कार्य र दिनचर्याको ध्यान राख्नुहोस्।",
        viewReminders: "सम्झना हेर्नुहोस्",
        progress: "📊 प्रगति",
        progressDesc: "समयसँगै गतिविधि सहभागिता र प्रगति हेर्नुहोस्।",
        viewProgress: "प्रगति हेर्नुहोस्",
        caregiver: "👨‍👩‍👧 हेरचाहकर्ता",
        caregiverDesc: "प्रयोगकर्ताको दैनिक गतिविधिमा सहयोग गर्न हेरचाहकर्ताहरूका लागि समर्पित क्षेत्र।",
        caregiverArea: "हेरचाहकर्ता क्षेत्र",
        assistant: "🤖 स्मृति सहायक",
        assistantDesc: "सहायकलाई सामान्य प्रश्न सोध्नुहोस् वा प्लेटफर्म प्रयोग गर्न मद्दत लिनुहोस्।",
        openAssistant: "सहायक खोल्नुहोस्",
        memoryTitle: "🧠 स्मृति क्रम",
        rememberNumbers: "तल देखाइएका नम्बरहरू सम्झनुहोस्।",
        rememberObjects: "यी परिचित वस्तुहरू क्रमबद्ध रूपमा सम्झनुहोस्।",
        enterNumbers: "अब तपाईंलाई याद भएका नम्बरहरू लेख्नुहोस्:",
        chooseObjects: "सम्झिएको क्रममा वस्तुहरूमा ट्याप गर्नुहोस्।",
        checkAnswer: "उत्तर जाँच्नुहोस्",
        nextRound: "अर्को राउन्ड",
        memorySuccess: "✅ उत्कृष्ट! तपाईंले सही रूपमा सम्झनुभयो।",
        memoryTryAgain: "ठीक छ। फेरि प्रयास गरौँ।",
        placeholderEnterNumber: "नम्बर लेख्नुहोस्",
        standardMode: "🔢 मानक नम्बरहरू",
        culturalMode: "🌿 परिचित वस्तुहरू",
        attentionTitle: "🎯 ध्यान चुनौती",
        attentionInstructions: "एक पटक मात्र देखिने नम्बर पत्ता लगाउनुहोस्।",
        startAttentionGame: "ध्यान खेल सुरु गर्नुहोस्",
        attentionSuccess: "✅ उत्कृष्ट! तपाईंले पत्ता लगाउनुभयो।",
        attentionTryAgain: "ठीक छ। फेरि प्रयास गर्नुहोस्!",
        routineTitle: "🔢 दैनिक दिनचर्या सम्झनुहोस्",
        rememberRoutine: "देखाइएको क्रममा गतिविधिहरू सम्झनुहोस्।",
        chooseTime: "बिहान, दिउँसो वा साँझ रोज्नुहोस्।",
        routineMorning: "🌅 बिहान",
        routineAfternoon: "☀️ दिउँसो",
        routineEvening: "🌙 साँझ",
        routineSuccess: "🎉 उत्कृष्ट! तपाईंले सम्पूर्ण दिनचर्या सम्झनुभयो।",
        routineTryAgain: "ठीक छ! क्रम सम्झने प्रयास गर्नुहोस्।",
        routineNextActivity: "✅ सही! अब अर्को गतिविधि खोज्नुहोस्।",
        patternTitle: "🧩 ढाँचा पहिचान",
        patternInstructions: "तल देखाइएको ढाँचा सम्झनुहोस्।",
        patternChoose: "सम्झिएको ढाँचामा ट्याप गर्नुहोस्।",
        nextPatternRound: "अर्को ढाँचा",
        patternSuccess: "✅ उत्कृष्ट! तपाईंले ढाँचा सम्झनुभयो।",
        patternTryAgain: "ठीक छ। अर्को प्रयास गरौँ।",
        moodTitle: "😊 आज तपाईं कस्तो महसुस गर्दै हुनुहुन्छ?",
        moodInstructions: "आज तपाईंको भावना सबैभन्दा राम्रोसँग दर्शाउने विकल्प रोज्नुहोस्।",
        moodGood: "😀 म राम्रो महसुस गर्दैछु",
        moodOkay: "🙂 म ठीक महसुस गर्दैछु",
        moodNotGreat: "😐 म खासै राम्रो महसुस गर्दै छैन",
        moodWorried: "😟 म चिन्तित महसुस गर्दैछु",
        moodTired: "😴 म थकित महसुस गर्दैछु",
        moodSaving: "तपाईंको प्रतिक्रिया सुरक्षित गरिँदैछ...",
        moodSaved: "💙 आफ्नो भावना साझा गर्नुभएकोमा धन्यवाद।",
        moodError: "माफ गर्नुहोस्, प्रतिक्रिया सुरक्षित गर्न सकिएन।",
        myReminders: "📅 मेरा सम्झनाहरू",
        myRemindersDesc: "आज र आगामी दिनहरूका लागि हेरचाहकर्ताका सम्झनाहरू।",
        loadingReminders: "सम्झनाहरू लोड हुँदैछन्...",
        noRemindersFound: "कुनै सम्झना भेटिएन।",
        markAsDone: "✓ सम्पन्न भनी चिन्ह लगाउनुहोस्",
        done: "✅ सम्पन्न",
        completed: "✅ सम्पन्न",
        dueNow: "🔔 अहिले गर्नुपर्ने",
        passed: "बितिसक्यो",
        today: "आज",
        upcoming: "आगामी",
        myProgress: "📊 मेरो प्रगति",
        myProgressDesc: "तपाईंको मानसिक गतिविधि कार्यसम्पादन तल देखाइएको छ।",
        loadingProgress: "प्रगति लोड हुँदैछ...",
        noActivityResults: "अहिलेसम्म कुनै गतिविधि परिणाम छैन।",
        activities: "गतिविधिहरू",
        averageScore: "औसत अङ्क",
        bestScore: "उत्कृष्ट अङ्क",
        successful: "सफल",
        caregiverDashboard: "👨‍👩‍👧 हेरचाहकर्ता ड्यासबोर्ड",
        caregiverDashboardDesc: "बिरामीको स्मरण गतिविधि र हालको कार्यसम्पादन निगरानी गर्नुहोस्।",
        loadingCaregiver: "हेरचाहकर्ता ड्यासबोर्ड लोड हुँदैछ...",
        noCaregiverActivity: "अहिलेसम्म बिरामीको कुनै गतिविधि रेकर्ड भएको छैन।",
        patientActivitySummary: "📊 बिरामी गतिविधि सारांश",
        patientMoodInsights: "😊 बिरामीको मनको अवस्था",
        noMoodCheckins: "📭 अहिलेसम्म कुनै मनको अवस्था रेकर्ड गरिएको छैन।",
        latestMood: "हालको",
        recentMoodHistory: "हालको मुड इतिहास",
        recentActivity: "📝 हालका गतिविधिहरू",
        createReminder: "🔔 सम्झना सिर्जना गर्नुहोस्",
        createReminderDesc: "बिरामीका लागि नयाँ सम्झना सिर्जना गर्नुहोस्।",
        saveReminder: "💾 सम्झना सुरक्षित गर्नुहोस्",
        savedReminders: "📋 सुरक्षित सम्झनाहरू",
        noSavedReminders: "📭 कुनै सम्झना सिर्जना गरिएको छैन।",
        deleteReminder: "🗑️ मेटाउनुहोस्",
        completedByPatient: "✅ बिरामीद्वारा सम्पन्न",
        pending: "⏳ बाँकी",
        assistantTitle: "🤖 स्मृति सहायक",
        promptPlaceholder: "आफ्नो प्रश्न यहाँ लेख्नुहोस्...",
        startListening: "सुन्न सुरु गर्नुहोस्",
        askAssistant: "सहायकलाई सोध्नुहोस्",
        readAloud: "उत्तर ठूलो स्वरमा सुन्नुहोस्",
        voiceHelp: "बोलेर प्रश्न सोध्नका लागि “सुन्न सुरु गर्नुहोस्” मा ट्याप गर्नुहोस्।",
        goodMorning: "शुभ प्रभात 👋",
        goodAfternoon: "शुभ दिन 👋",
        goodEvening: "शुभ सन्ध्या 👋",
        todayPlan: "यहाँ आजको लागि तपाईंको योजना र सारांश प्रस्तुत छ।",
        dailyProgressTitle: "आजको प्रगति",
        dailyProgressHelp: "आजको स्मरण गतिविधि, मनको अवस्था र सम्झनाका आधारमा।",
        dailyProgressNoRemindersHelp: "आजको स्मरण गतिविधि र मनको अवस्थाका आधारमा (आज कुनै सम्झना छैन)।",
        todaysPriorities: "🎯 आजका प्राथमिकताहरू",
        dailyPlan: "📅 दैनिक योजना",
        viewDailyPlan: "दैनिक योजना हेर्नुहोस्",
        yourPlanToday: "आजको तपाईंको योजना",
        morning: "बिहान",
        afternoon: "दिउँसो",
        evening: "साँझ",
        anytime: "कुनै पनि समय",
        nothingScheduled: "केही तालिकाबद्ध गरिएको छैन",
        tasksRemaining: "बाँकी कार्यहरू",
        todaysActivity: "उपलब्ध गतिविधि",
        appointmentCategory: "भेटघाट",
        medicationCategory: "औषधि",
        personalCategory: "व्यक्तिगत",
        activityCategory: "गतिविधि",
        hydrationCategory: "पानी",
        otherCategory: "अन्य",
        filterAll: "सबै",
        filterPending: "बाँकी",
        filterCompleted: "पूरा भयो",
        quickAccess: "⚡ द्रुत पहुँच",
        completedTasksOf: "पूरा भयो",
        checkIn: "चेक-इन गर्नुहोस्",
        checkInAgain: "पुनः चेक-इन गर्नुहोस्",
        continueReminders: "📅 आजका सम्झनाहरू पूरा गर्नुहोस्",
        continueActivity: "🧠 आजको स्मरण गतिविधि सुरु गर्नुहोस्",
        continueMood: "😊 मनको अवस्था दर्ता गर्नुहोस्",
        continueGreatJob: "🎉 आजका काम पूरा! अर्को गतिविधि प्रयास गर्नुहोस्",
        todayRemindersTitle: "आजका सम्झनाहरू",
        pendingCount: "बाँकी",
        completedTodayCount: "आज सम्पन्न भएका",
        noRemindersScheduledToday: "आजका लागि कुनै सम्झना तोकिएको छैन।",
        todayActivityTitle: "आजको स्मरण गतिविधि",
        activityCompletedToday: "✅ आज गतिविधि सम्पन्न भयो",
        noActivityToday: "⏳ आज कुनै गतिविधि सम्पन्न भएको छैन",
        latestMoodLabel: "हालको मनको अवस्था",
        noMoodCheckinToday: "📭 आज कुनै प्रविष्टि छैन। तपाईंलाई कस्तो छ?",
        recentPerformanceTitle: "हालको कार्यसम्पादन सारांश",
        recentAverage: "हालको औसत अङ्क",
        noPerformanceData: "अहिलेसम्म कुनै गतिविधि नतिजा रेकर्ड भएको छैन।",
        loadingDashboard: "तपाईंको ड्यासबोर्ड लोड हुँदैछ...",
        caregiverInsightsTitle: "💡 हेरचाहकर्ता अन्तर्दृष्टि",
        caregiverInsightsSub: "हालको बिरामी सहभागिता, सम्झना पूर्णता र दिनचर्याको सारांश।",
        activityParticipationLabel: "गतिविधि सहभागिता",
        activeDaysLabel: "यो हप्ता सक्रिय दिनहरू",
        todaysRemindersLabel: "आजका सम्झनाहरू",
        noRemindersScheduled: "आज कुनै सम्झना तोकिएको छैन।",
        pendingRemindersCount: "बाँकी",
        completedRemindersCount: "सम्पन्न",
        participationTrendLabel: "सहभागिता प्रवृत्ति",
        trendIncreased: "अघिल्लो अवधिको तुलनामा गतिविधि सहभागिता बढेको छ।",
        trendDecreased: "अघिल्लो अवधिको तुलनामा गतिविधि सहभागिता कम थियो।",
        trendSimilar: "गतिविधि सहभागिता अघिल्लो अवधि जस्तै थियो।",
        trendInsufficientData: "तुलनाका लागि अहिलेसम्म पर्याप्त इतिहास छैन।",
        progressTitle: "📊 मेरो प्रगति र इतिहास",
        progressSubtitle: "आफ्ना सम्पन्न गरिएका गतिविधि, हालका अङ्क र दैनिक सहभागिता हेर्नुहोस्।",
        totalActivities: "कुल गतिविधिहरू",
        recentAverageScore: "हालको औसत अङ्क",
        latestActivityHighlight: "🌟 हालको गतिविधि",
        weeklyParticipationTitle: "📈 ७-दिने गतिविधि सहभागिता",
        activityHistoryTitle: "📝 गतिविधि इतिहास",
        showMore: "अझै इतिहास हेर्नुहोस्",
        noActivitiesYetTitle: "📭 अहिलेसम्म कुनै गतिविधि सम्पन्न भएको छैन",
        noActivitiesYetSub: "आफ्नो प्रगति ट्र्याक गर्न पहिलो स्मरण गतिविधि पूरा गर्नुहोस्!",
        startFirstActivity: "▶ गतिविधि सुरु गर्नुहोस्",
        activityMemorySequence: "स्मृति क्रम",
        activityAttentionChallenge: "ध्यान चुनौती",
        activityRoutineRecall: "दैनिक दिनचर्या",
        activityPatternRecognition: "ढाँचा पहिचान",
        difficultyLabel: "कठिनाइ",
        attemptsLabel: "प्रयास",
        modeLabel: "मोड",
        dateLabel: "मिति",
        floatingAiAssistant: "🤖 एआई सहायक",
        close: "बन्द गर्नुहोस्",
        send: "पठाउनुहोस्",
        typeQuestion: "आफ्नो प्रश्न यहाँ लेख्नुहोस्...",
        thinking: "सहायकले सोच्दैछ...",
        aiError: "माफ गर्नुहोस्, सहायकले अहिले उत्तर दिन सकेन।",
        aiDisclaimer: "केवल एप सहायता • चिकित्सा सल्लाहका लागि होइन",
        recommendedForYou: "तपाईंको लागि सिफारिस गरिएको",
        tryThisNext: "अर्को यो गतिविधि प्रयास गर्नुहोस्।",
        basedOnRecentActivity: "तपाईंको हालैको गतिविधिमा आधारित",
        activityNotRecentlyTried: "तपाईंले हालै यो गतिविधि गर्नुभएको छैन।",
        activityNeverAttempted: "तपाईंले अझै यो गतिविधि प्रयास गर्नुभएको छैन।",
        activityVariety: "यसले तपाईंको हालैका गतिविधिहरूमा विविधता दिन्छ।",
        noActivityHistory: "सुरु गर्न यो गतिविधि प्रयास गर्नुहोस्।",
        personalMilestones: "व्यक्तिगत कोसेढुङ्गा",
        milestonesAchieved: "हासिल गरिएका कोसेढुङ्गा",
        viewMilestones: "कोसेढुङ्गा हेर्नुहोस्",
        milestoneFirstActivityTitle: "पहिलो गतिविधि",
        milestoneFirstActivityDesc: "तपाईंको पहिलो गतिविधि पूरा भयो।",
        milestoneThreeActivitiesTitle: "३ गतिविधि पूरा",
        milestoneThreeActivitiesDesc: "३ वटा गतिविधि पूरा गर्नुभयो।",
        milestoneFiveActivitiesTitle: "५ गतिविधि पूरा",
        milestoneFiveActivitiesDesc: "५ वटा गतिविधि पूरा गर्नुभयो।",
        milestoneThreeActiveDaysTitle: "३ सक्रिय दिन",
        milestoneThreeActiveDaysDesc: "३ फरक दिनमा सहभागी हुनुभयो।",
        milestoneTenActivitiesTitle: "१० गतिविधि पूरा",
        milestoneTenActivitiesDesc: "१० वटा गतिविधि पूरा गर्नुभयो।",
        milestoneAchieved: "हासिल भयो",
        milestoneInProgress: "प्रगतिमा",
        dailyConsistency: "दैनिक निरन्तरता",
        currentStreak: "वर्तमान सक्रिय श्रृङ्खला",
        daysInARow: "दिन लगातार",
        activeThisWeek: "यस हप्ता सक्रिय दिनहरू",
        keepItUp: "आफ्नो दैनिक दिनचर्या कायम राख्नुभएकोमा राम्रो काम!",
        startStreak: "आफ्नो श्रृङ्खला बनाउन आज एउटा गतिविधि पूरा गर्नुहोस्!",
        dayStreakLabel: "दिनको श्रृङ्खला",
        filterAllActivities: "सबै गतिविधिहरू",
        filterMemorySequence: "स्मृति अनुक्रम",
        filterAttentionChallenge: "ध्यान चुनौती",
        filterRoutineRecall: "दैनिक तालिका स्मरण",
        filterPatternRecognition: "प्याटर्न पहिचान",
        noActivitiesForFilter: "यस खेलको लागि अहिलेसम्म कुनै गतिविधि पूरा भएको छैन।",
        startThisActivity: "यो गतिविधि सुरु गर्नुहोस्",
        mindfulPauseTitle: "शान्त विश्राम र ध्यान रीसेट",
        mindfulPauseSub: "अघि बढ्नु अघि रोकिने र बिस्तारै सास फेर्नको लागि एक शान्त मिनेट लिनुहोस्।",
        startPause: "शान्त विश्राम सुरु गर्नुहोस्",
        pauseBreather: "रोक्नुहोस्",
        resetBreather: "रीसेट गर्नुहोस्",
        phaseInhale: "बिस्तारै सास भित्र लिनुहोस्...",
        phaseHold: "शान्तिपूर्वक रोक्नुहोस्...",
        phaseExhale: "बिस्तारै सास बाहिर छाड्नुहोस्...",
        phaseRest: "आराम गर्नुहोस्...",
        breatherComplete: "शान्त विश्राम लिनुभएकोमा राम्रो काम। तयार भएपछि जारी राख्नुहोस्।"
    ,
        accessibilityDisplay: "प्रदर्शन र पहुँच",
        accessibilityDisplayDesc: "सजिलै हेर्नको लागि पाठ आकार र कन्ट्रास्ट मिलाउनुहोस्।",
        textSize: "पाठ आकार",
        textSizeStandard: "मानक",
        textSizeLarge: "ठूलो (+15%)",
        textSizeExtraLarge: "धेरै ठूलो (+30%)",
        highContrast: "उच्च कन्ट्रास्ट",
        highContrastOn: "अन (बढाइएको कन्ट्रास्ट)",
        highContrastOff: "अफ (मानक शान्त)",
        resetDisplaySettings: "मानकमा रिसेट गर्नुहोस्",
        saveDisplaySettings: "सम्पन्न",
        displaySettingsSaved: "प्रदर्शन सेटिङहरू अद्यावधिक गरियो।"
    },
    "mni-Mtei": {
        backToDashboard: "← ꯗꯦꯁꯕꯣꯔꯗꯇ ꯍꯜꯂꯛꯄ",
        logout: "🚪 ꯂꯣꯒ ꯑꯥꯎꯠ",
        welcome: "ꯇꯔꯥꯝꯅ ꯑꯣꯛꯆꯔꯤ 👋",
        welcomeDesc: "ꯃꯁꯤꯅ ꯑꯍꯜ ꯑꯣꯏꯔꯕꯁꯤꯡꯒꯤꯗꯃꯛ ꯋꯥꯈꯜ ꯍꯧꯒꯠꯍꯟꯅꯕ ꯑꯄꯤꯀꯄ ꯊꯕꯛ, ꯅꯤꯡꯁꯤꯡ ꯃꯇꯦꯡ ꯑꯃꯁꯨꯡ ꯈꯨꯗꯣꯡꯆꯥꯕꯁꯤꯡ ꯄꯤꯔꯤ।",
        cognitiveActivity: "🧠 ꯋꯥꯈꯜ ꯊꯧꯅꯥ ꯊꯕꯛ",
        cognitiveDesc: "ꯅꯤꯡꯁꯤꯡꯕ, ꯃꯤꯠꯌꯦꯡ ꯊꯝꯕ ꯑꯃꯁꯨꯡ ꯋꯥꯈꯜ ꯈꯟꯕꯒꯤ ꯍꯩꯁꯤꯡꯕ ꯍꯦꯟꯒꯠꯍꯟꯅꯕ ꯊꯕꯛꯁꯤꯡ ꯂꯣꯏꯁꯤꯜꯂꯨ।",
        startActivity: "ꯊꯕꯛ ꯍꯧꯕ",
        attention: "🎯 ꯃꯤꯠꯌꯦꯡ ꯊꯝꯕꯒꯤ ꯆꯥꯡꯌꯦꯡ",
        routine: "🔢 ꯅꯨꯃꯤꯠ ꯈꯨꯗꯤꯡꯒꯤ ꯊꯕꯛ ꯅꯤꯡꯁꯤꯡꯕ",
        pattern: "🧩 ꯃꯑꯣꯡ ꯈꯪꯗꯣꯛꯄ",
        mood: "😊 ꯄꯨꯛꯅꯤꯡꯒꯤ ꯐꯤꯚꯝ",
        reminders: "📅 ꯅꯤꯡꯁꯤꯡ ꯄꯥꯎ",
        remindersDesc: "ꯃꯔꯨꯑꯣꯏꯕ ꯅꯨꯃꯤꯠ ꯈꯨꯗꯤꯡꯒꯤ ꯊꯕꯛꯁꯤꯡ ꯅꯤꯡꯁꯤꯡꯕꯤꯌꯨ।",
        viewReminders: "ꯅꯤꯡꯁꯤꯡ ꯄꯥꯎ ꯌꯦꯡꯕ",
        progress: "📊 ꯃꯥꯡꯖꯤꯜ ꯊꯥꯕ",
        progressDesc: "ꯃꯇꯝꯒꯤ ꯃꯇꯨꯡ ꯏꯟꯅ ꯊꯕꯛ ꯇꯧꯕꯒꯤ ꯃꯥꯡꯖꯤꯜ ꯊꯥꯕ ꯌꯦꯡꯕꯤꯌꯨ।",
        viewProgress: "ꯃꯥꯡꯖꯤꯜ ꯊꯥꯕ ꯌꯦꯡꯕ",
        caregiver: "👨‍👩‍👧 ꯌꯦꯡꯁꯤꯅꯕꯤꯕ",
        caregiverDesc: "ꯌꯦꯡꯁꯤꯅꯕꯤꯕꯁꯤꯡꯅ ꯅꯨꯃꯤꯠ ꯈꯨꯗꯤꯡꯒꯤ ꯊꯕꯛꯇ ꯃꯇꯦꯡ ꯄꯥꯡꯅꯕ ꯑꯈꯟꯅꯕ ꯃꯐꯝ।",
        caregiverArea: "ꯌꯦꯡꯁꯤꯅꯕꯤꯕ ꯃꯐꯝ",
        assistant: "🤖 ꯅꯤꯡꯁꯤꯡ ꯃꯇꯦꯡ",
        assistantDesc: "ꯃꯇꯦꯡ ꯄꯥꯡꯕꯗ ꯋꯥꯍꯪ ꯍꯪꯕꯤꯌꯨ ꯅꯠꯇ꯭ꯔꯒ ꯃꯇꯦꯡ ꯂꯧꯕꯤꯌꯨ।",
        openAssistant: "ꯃꯇꯦꯡ ꯍꯥꯡꯗꯣꯛꯄ",
        memoryTitle: "🧠 ꯅꯤꯡꯁꯤꯡ ꯃꯇꯦꯡ ꯆꯥꯡꯌꯦꯡ",
        rememberNumbers: "ꯃꯈꯥꯗ ꯎꯠꯂꯤꯕ ꯃꯁꯤꯡꯁꯤꯡ ꯅꯤꯡꯁꯤꯡꯕꯤꯌꯨ।",
        rememberObjects: "ꯈꯪꯅꯔꯕ ꯄꯣꯠꯂꯝꯁꯤꯡ ꯃꯊꯪ-ꯃꯅꯥꯎ ꯅꯥꯏꯅ ꯅꯤꯡꯁꯤꯡꯕꯤꯌꯨ।",
        enterNumbers: "ꯅꯍꯥꯛꯅ ꯅꯤꯡꯁꯤꯡꯕ ꯃꯁꯤꯡ ꯏꯕꯤꯌꯨ:",
        chooseObjects: "ꯅꯤꯡꯁꯤꯡꯕ ꯃꯊꯪ-ꯃꯅꯥꯎꯗ ꯄꯣꯠꯂꯝꯁꯤꯡ ꯅꯝꯕꯤꯌꯨ।",
        checkAnswer: "ꯄꯥꯎꯈꯨꝝ ꯌꯦꯡꯁꯤꯟꯕ",
        nextRound: "ꯃꯊꯪꯒꯤ ꯇꯥꯡꯀꯛ",
        memorySuccess: "✅ ꯌꯥꯝꯅ ꯐꯔꯦ! ꯅꯍꯥꯛꯅ ꯆꯨꯝꯅ ꯅꯤꯡꯁꯤꯡꯂꯦ।",
        memoryTryAgain: "ꯌꯥꯔꯦ, ꯑꯃꯨꯛ ꯍꯟꯅ ꯍꯣꯠꯅꯁꯤ।",
        placeholderEnterNumber: "ꯃꯁꯤꯡ ꯏꯕꯤꯌꯨ",
        standardMode: "🔢 ꯃꯁꯤꯡ ꯃꯑꯣꯡ",
        culturalMode: "🌿 ꯈꯪꯅꯔꯕ ꯄꯣꯠꯂꯝꯁꯤꯡ",
        attentionTitle: "🎯 ꯃꯤꯠꯌꯦꯡ ꯊꯝꯕꯒꯤ ꯆꯥꯡꯌꯦꯡ",
        attentionInstructions: "ꯑꯃꯛꯇ ꯎꯕ ꯐꯪꯕ ꯃꯁꯤꯡ ꯑꯗꯨ ꯊꯤꯕꯤꯌꯨ।",
        startAttentionGame: "ꯁꯥꯟꯅꯕ ꯍꯧꯕ",
        attentionSuccess: "✅ ꯌꯥꯝꯅ ꯐꯔꯦ! ꯅꯍꯥꯛꯅ ꯐꯪꯂꯦ।",
        attentionTryAgain: "ꯌꯥꯔꯦ, ꯑꯃꯨꯛ ꯍꯣꯠꯅꯕꯤꯌꯨ!",
        routineTitle: "🔢 ꯅꯨꯃꯤꯠ ꯈꯨꯗꯤꯡꯒꯤ ꯊꯕꯛ ꯅꯤꯡꯁꯤꯡꯕ",
        rememberRoutine: "ꯎꯠꯂꯤꯕ ꯃꯊꯪ-ꯃꯅꯥꯎ ꯑꯗꯨ ꯅꯤꯡꯁꯤꯡꯕꯤꯌꯨ।",
        chooseTime: "ꯑꯌꯨꯛ, ꯅꯨꯡꯊꯤꯜ ꯅꯠꯇ꯭ꯔꯒ ꯅꯨꯃꯤꯗꯥꯡ ꯈꯟꯕꯤꯌꯨ।",
        routineMorning: "🌅 ꯑꯌꯨꯛ",
        routineAfternoon: "☀️ ꯅꨨꯊꯤꯜ",
        routineEvening: "🌙 ꯅꯨꯃꯤꯗꯥꯡ",
        routineSuccess: "🎉 ꯌꯥꯝꯅ ꯐꯔꯦ! ꯅꯨꯃꯤꯠ ꯈꯨꯗꯤꯡꯒꯤ ꯊꯕꯛ ꯄꯨꯝꯅꯃꯛ ꯅꯤꯡꯁꯤꯡꯂꯦ।",
        routineTryAgain: "ꯌꯥꯔꯦ! ꯃꯊꯪ-ꯃꯅꯥꯎ ꯅꯤꯡꯁꯤꯡꯅꯕ ꯍꯣꯠꯅꯕꯤꯌꯨ।",
        routineNextActivity: "✅ ꯆꯨꯝꯂꯦ! ꯃꯊꯪꯒꯤ ꯊꯕꯛ ꯊꯤꯕꯤꯌꯨ।",
        patternTitle: "🧩 ꯃꯑꯣꯡ ꯈꯪꯗꯣꯛꯄ",
        patternInstructions: "ꯃꯈꯥꗷ ꯎꯠꯂꯤꯕ ꯃꯑꯣꯡ ꯑꯁꯤ ꯅꯤꯡꯁꯤꯡꯕꯤꯌꯨ।",
        patternChoose: "ꯅꯤꯡꯁꯤꯡꯕ ꯃꯑꯣꯡ ꯑꯗꯨꯗ ꯅꯝꯕꯤꯌꯨ।",
        nextPatternRound: "ꯃꯊꯪꯒꯤ ꯃꯑꯣꯡ",
        patternSuccess: "✅ ꯌꯥꯝꯅ ꯐꯔꯦ! ꯃꯑꯣꯡ ꯑꯗꯨ ꯅꯤꯡꯁꯤꯡꯂꯦ।",
        patternTryAgain: "ꯌꯥꯔꯦ, ꯑꯇꯣꞞꯄ ꯑꯃ ꯍꯣꯠꯅꯁꯤ।",
        moodTitle: "😊 ꯉꯁꯤ ꯅꯍꯥꯛ ꯀꯔꯝꯅ ꯐꯥꯎꯔꯤꯕ?",
        moodInstructions: "ꯉꯁꯤ ꯅꯍꯥꯛꯀꯤ ꯄꯨꯛꯅꯤꯡꯒꯤ ꯐꯤꯚꯝ ꯎꯠꯄ ꯑꯃ ꯈꯟꯕꯤꯌꯨ।",
        moodGood: "😀 ꯑꯩ ꯅꯨꯡꯉꯥꯏꯅ ꯐꯥꯎꯔꯤ",
        moodOkay: "🙂 ꯑꯩ ꯆꯨꯝꯅ ꯂꯩꯔꯤ",
        moodNotGreat: "😐 ꯑꯩ ꯌꯥꯝ ꯐꯠꯇꯦ",
        moodWorried: "😟 ꯑꯩ ꯋꯥꯅ ꯐꯥꯎꯔꯤ",
        moodTired: "😴 ꯑꯩ ꯊꯧꯅꯥ ꯍꯟꯊꯔꯦ",
        moodSaving: "ꯄꯥꯎꯈꯨꯝ ꯁꯦꯚ ꯇꯧꯔꯤ...",
        moodSaved: "💙 ꯄꯨꯛꯅꯤꯡꯒꯤ ꯋꯥꯐꯝ ꯐꯣꯡꯗꯣꯛꯄꯤꯕꯒꯤꯗꯃꯛ ꯊꯥꯒꯠꯆꯔꯤ।",
        moodError: "ꯉꯥꯛꯄꯤꯌꯨ, ꯁꯦꯚ ꯇꯧꯕ ꯉꯝꯈꯤꯗ꯭ꯔꯦ।",
        myReminders: "📅 ꯑꯩꯒꯤ ꯅꯤꯡꯁꯤꯡ ꯄꯥꯎ",
        myRemindersDesc: "ꯉꯁꯤ ꯑꯃꯁꯨꯡ ꯃꯊꯪꯒꯤ ꯅꯨꯃꯤꯠꯁꯤꯡꯒꯤ ꯅꯤꯡꯁꯤꯡ ꯄꯥꯎ।",
        loadingReminders: "ꯅꯤꯡꯁꯤꯡ ꯄꯥꯎ ꯂꯣꯗ ꯇꯧꯔꯤ...",
        noRemindersFound: "ꯅꯤꯡꯁꯤꯡ ꯄꯥꯎ ꯐꯪꯗ꯭ꯔꯦ।",
        markAsDone: "✓ ꯂꯣꯏꯔꯦ ꯍꯥꯏꯅ ꯇꯥꯛꯄ",
        done: "✅ ꯂꯣꯏꯔꯦ",
        completed: "✅ ꯂꯣꯏꯔꯦ",
        dueNow: "🔔 ꯍꯧꯖꯤꯛ ꯇꯧꯒꯗꯕ",
        passed: "ꯆꯠꯈ꯭ꯔꯦ",
        today: "ꯉꯁꯤ",
        upcoming: "ꯃꯊꯪꯗ ꯂꯥꯛꯀꯗꯕ",
        myProgress: "📊 ꯑꯩꯒꯤ ꯃꯥꯡꯖꯤꯜ ꯊꯥꯕ",
        myProgressDesc: "ꯅꯍꯥꯛꯀꯤ ꯊꯕꯛ ꯇꯧꯕꯒꯤ ꯃꯑꯣꯡ ꯃꯈꯥꯗ ꯎꯠꯂꯤ।",
        loadingProgress: "ꯃꯥꯡꯖꯤꯜ ꯊꯥꯕ ꯂꯣꯗ ꯇꯧꯔꯤ...",
        noActivityResults: "ꯊꯕꯛ ꯑꯃꯠꯇ ꯂꯩꯇ꯭ꯔꯤ।",
        activities: "ꯊꯕꛛꯁꯤꯡ",
        averageScore: "ꯆꥥꯡꯆꯠ ꯃꯥꯔꯛ",
        bestScore: "ꯈ꯭ꯋꯥꯏꯗꯒꯤ ꯐꯕ ꯃꯥꯔꯛ",
        successful: "ꯃꯥꯏꯄꯥꯛꯄ",
        caregiverDashboard: "👨‍👩‍👧 ꯌꯦꯡꯁꯤꯅꯕꯤꯕꯒꯤ ꯗꯦꯁꯕꯣꯔꯗ",
        caregiverDashboardDesc: "ꯑꯅꯥꯕꯒꯤ ꯊꯕꯛ ꯑꯃꯁꯨꯡ ꯍꯟꯗꯛꯀꯤ ꯆꯥꯡ ꯌꯦꯡꯁꯤꯟꯕꯤꯌꯨ।",
        loadingCaregiver: "ꯗꯦꯁꯕꯣꯔꯗ ꯂꯣꯗ ꯇꯧꯔꯤ...",
        noCaregiverActivity: "ꯑꯅꥥꯕꯒꯤ ꯊꯕꯛ ꯑꯃꯠꯇ ꯔꯦꯀꯣꯔꯗ ꯇꯧꯗ꯭ꯔꯤ।",
        patientActivitySummary: "📊 ꯑꯅꯥꯕꯒꯤ ꯊꯕꯛ ꯄꨨꯟꯁꯤꯟꯕ",
        patientMoodInsights: "😊 ꯑꯅꯥꯕꯒꯤ ꯄꯨꯛꯅꯤꯡꯒꯤ ꯐꯤꯚꯝ",
        noMoodCheckins: "📭 ꯄꯨꯛꯅꯤꯡꯒꯤ ꯐꯤꯚꯝ ꯑꯃꯠꯇ ꯔꯦꯀꯣꯔꯗ ꯇꯧꯗ꯭ꯔꯤ।",
        latestMood: "ꯈ꯭ꯋꯥꯏꯗꯒꯤ ꯅꯧꯕ",
        recentMoodHistory: "ꯍꯟꯗꯛꯀꯤ ꯄꯨꯛꯅꯤꯡ ꯋꯥꯔꯤ",
        recentActivity: "📝 ꯍꯟꯗꯛꯀꯤ ꯊꯕꯛ",
        createReminder: "🔔 ꯅꯤꯡꯁꯤꯡ ꯄꯥꯎ ꯁꯦꯝꯕ",
        createReminderDesc: "ꯑꯅꯥꯕꯒꯤꯗꯃꯛ ꯑꯅꯧꯕ ꯅꯤꯡꯁꯤꯡ ꯄꯥꯎ ꯁꯦꯝꯕꯤꯌꯨ।",
        saveReminder: "💾 ꯅꯤꯡꯁꯤꯡ ꯄꯥꯎ ꯁꯦꯚ ꯇꯧꯕ",
        savedReminders: "📋 ꯁꯦꯚ ꯇꯧꯔꯕ ꯅꯤꯡꯁꯤꯡ ꯄꯥꯎ",
        noSavedReminders: "📭 ꯅꯤꯡꯁꯤꯡ ꯄꯥꯎ ꯑꯃꯠꯇ ꯁꯦꯃꯗ꯭ꯔꯤ।",
        deleteReminder: "🗑️ ꯃꯨꯊꯠꯄ",
        completedByPatient: "✅ ꯑꯅꯥꯕꯅ ꯂꯣꯏꯁꯤꯜꯂꯦ",
        pending: "⏳ ꯉꯥꯏꯔꯤ",
        assistantTitle: "🤖 ꯅꯤꯡꯁꯤꯡ ꯃꯇꯦꯡ",
        promptPlaceholder: "ꯅꯍꯥꯛꯀꯤ ꯋꯥꯍꯪ ꯃꯐꯝꯁꯤꯗ ꯏꯕꯤꯌꯨ...",
        startListening: "ꯇꯥꯕ ꯍꯧꯕ",
        askAssistant: "ꯃꯇꯦꯡꯗ ꯍꯪꯕ",
        readAloud: "ꯄꯥꯎꯈꯨꯝ ꯈꯣꯟꯊꯣꯛꯅ ꯇꯥꯕ",
        voiceHelp: "ꯈꯣꯟꯊꯣꯛꯅ ꯍꯪꯅꯕ “ꯇꯥꯕ ꯍꯧꯕ”ꯗ ꯅꯝꯕꯤꯌꯨ।",
        goodMorning: "ꯑꯌꯨꯛꯀꯤ ꯇꯔꯥꯝꯅ ꯑꯣꯛꯆꯔꯤ 👋",
        goodAfternoon: "ꯅꯨꯡꯊꯤꯜꯒꯤ ꯇꯔꯥꯝꯅ ꯑꯣꯛꯆꯔꯤ 👋",
        goodEvening: "ꯅꯨꯃꯤꯗꯥꯡꯒꯤ ꯇꯔꯥꯝꯅ ꯑꯣꯛꯆꯔꯤ 👋",
        todayPlan: "ꯉꯁꯤꯒꯤ ꯊꯧꯔꯥꯡ ꯑꯃꯁꯨꯡ ꯄꯨꯟꯁꯤꯟꯕ ꯃꯐꯝꯁꯤꯗ ꯄꯤꯔꯤ।",
        dailyProgressTitle: "ꯉꯁꯤꯒꯤ ꯃꯥꯡꯖꯤꯜ ꯊꯥꯕ",
        dailyProgressHelp: "ꯉꯁꯤꯒꯤ ꯊꯕꯛ, ꯄꯨꯛꯅꯤꯡꯒꯤ ꯐꯤꯚꯝ ꯑꯃꯁꯨꯡ ꯅꯤꯡꯁꯤꯡ ꯄꯥꯎꯗ ꯌꯨꯝꯐꯝ ꯑꯣꯏꯕ।",
        dailyProgressNoRemindersHelp: "ꯉꯁꯤꯒꯤ ꯊꯕꯛ ꯑꯃꯁꯨꯡ ꯄꯨꯛꯅꯤꯡꯒꯤ ꯐꯤꯚꯝꯗ ꯌꯨꯝꯐꯝ ꯑꯣꯏꯕ (ꯉꯁꯤ ꯅꯤꯡꯁꯤꯡ ꯄꯥꯎ ꯂꯩꯇꯦ)।",
        todaysPriorities: "🎯 ꯉꯁꯤꯒꯤ ꯑꯍꯥꯟꯕ ꯊꯕꯛꯁꯤꯡ",
        dailyPlan: "📅 ꯅꯨꯃꯤꯠ ꯈꯨꯗꯤꯡꯒꯤ ꯊꯧꯔꯥꯡ",
        viewDailyPlan: "ꯅꯨꯃꯤꯠ ꯈꯨꯗꯤꯡꯒꯤ ꯊꯧꯔꯥꯡ ꯌꯦꯡꯕ",
        yourPlanToday: "ꯉꯁꯤꯒꯤ ꯅꯍꯥꯛꯀꯤ ꯊꯧꯔꯥꯡ",
        morning: "ꯑꯌꯨꯛ",
        afternoon: "ꯅꯨꯃꯤꯗꯥꯡꯋꯥꯏ",
        evening: "ꯅꯨꯃꯤꯗꯥꯡ",
        anytime: "ꯃꯇꯝ ꯈꯨꯗꯤꯡꯗ",
        nothingScheduled: "ꯀꯔꯤꯃꯠꯇ ꯂꯩꯇꯦ",
        tasksRemaining: "ꯋꯥꯠꯍꯧꯔꯤꯕ ꯊꯕꯛꯁꯤꯡ",
        todaysActivity: "ꯐꯡꯕ ꯌꯥꯕ ꯊꯕꯛ",
        appointmentCategory: "ꯑꯄꯣꯏꯟ꯭ꯇꯃꯦꯟ꯭ꯇ",
        medicationCategory: "ꯍꯤꯗꯥꯛ-ꯂꯥꯡꯊꯛ",
        personalCategory: "ꯏꯁꯥꯒꯤ",
        activityCategory: "ꯊꯕꯛ-ꯊꯧꯔꯥꯡ",
        hydrationCategory: "ꯏꯁꯤꯡ ꯊꯛꯄ",
        otherCategory: "ꯑꯇꯣꯞꯄ",
        filterAll: "ꯄꯨꯝꯅꯃꯛ",
        filterPending: "ꯋꯥꯠꯍꯧꯔꯤꯕ",
        filterCompleted: "ꯂꯣꏏꯁꯤꯜꯂꯦ",
        quickAccess: "⚡ ꯌꯥꯡꯅ ꯆꯪꯕ",
        completedTasksOf: "ꯂꯣꯏꯁꯤꯜꯂꯦ",
        checkIn: "ꯆꯦꯛ-ꯏꯟ ꯇꯧꯕ",
        checkInAgain: "ꯑꯃꯨꯛ ꯍꯟꯅ ꯆꯦꯛ-ꯏꯟ ꯇꯧꯕ",
        continueReminders: "📅 ꯉꯁꯤꯒꯤ ꯅꯤꯡꯁꯤꯡ ꯄꯥꯎ ꯂꯣꯏꯁꯤꯜꯂꯨ",
        continueActivity: "🧠 ꯉꯁꯤꯒꯤ ꯋꯥꯈꯜ ꯊꯕꯛ ꯍꯧꯕꯤꯌꯨ",
        continueMood: "😊 ꯄꯨꯛꯅꯤꯡꯒꯤ ꯐꯤꯚꯝ ꯏꯕꯤꯌꯨ",
        continueGreatJob: "🎉 ꯉꯁꯤꯒꯤ ꯂꯣꯏꯔꯦ! ꯑꯇꯣꯞꯄ ꯊꯕꯛ ꯍꯣꯠꯅꯕꯤꯌꯨ",
        todayRemindersTitle: "ꯉꯁꯤꯒꯤ ꯅꯤꯡꯁꯤꯡ ꯄꯥꯎ",
        pendingCount: "ꯉꯥꯏꯔꯤ",
        completedTodayCount: "ꯉꯁꯤ ꯂꯣꯏꯁꯤꯜꯂꯦ",
        noRemindersScheduledToday: "ꯉꯁꯤꯒꯤ ꯅꯤꯡꯁꯤꯡ ꯄꯥꯎ ꯑꯃꯠꯇ ꯂꯩꯇ꯭ꯔꯤ।",
        todayActivityTitle: "ꯉꯁꯤꯒꯤ ꯋꯥꯈꯜ ꯊꯕꯛ",
        activityCompletedToday: "✅ ꯉꯁꯤꯒꯤ ꯊꯕꯛ ꯂꯣꯏꯁꯤꯜꯂꯦ",
        noActivityToday: "⏳ ꯉꯁꯤ ꯊꯕꯛ ꯑꯃꯠꯇ ꯂꯣꯏꯁꯤꯗ꯭ꯔꯤ",
        latestMoodLabel: "ꯈ꯭ꯋꯥꯏꯗꯒꯤ ꯅꯧꯕ ꯄꯨꯛꯅꯤꯡ ꯐꯤꯚꯝ",
        noMoodCheckinToday: "📭 ꯉꯁꯤ ꯄꯨꯛꯅꯤꯡ ꯐꯤꯚꯝ ꯏꯗ꯭ꯔꯤ। ꯀꯔꯝꯅ ꯐꯥꯎꯔꯤꯕ?",
        recentPerformanceTitle: "ꯍꯟꯗꯛꯀꯤ ꯊꯕꯛ ꯄꯨꯟꯁꯤꯟꯕ",
        recentAverage: "ꯍꯟꯗꯛꯀꯤ ꯆꯥꯡꯆꯠ ꯃꯥꯔꯛ",
        noPerformanceData: "ꯑꯍꯥꯟꯕ ꯔꯦꯀꯣꯔꯗ ꯑꯃꯠꯇ ꯂꯩꯇ꯭ꯔꯤ।",
        loadingDashboard: "ꯗꯦꯁꯕꯣꯔꯗ ꯂꯣꯗ ꯇꯧꯔꯤ...",
        caregiverInsightsTitle: "💡 ꯌꯦꯡꯁꯤꯅꯕꯤꯕꯒꯤ ꯋꯥꯈꯜꯂꯣꯟ",
        caregiverInsightsSub: "ꯑꯅꯥꯕꯒꯤ ꯍꯟꯗꯛꯀꯤ ꯁꯔꯨꯛ ꯌꯥꯕ, ꯅꯤꯡꯁꯤꯡ ꯄꯥꯎ ꯂꯣꯏꯁꯤꯅꯕ ꯑꯃꯁꯨꯡ ꯊꯕꯛꯀꯤ ꯄꯨꯟꯁꯤꯟꯕ।",
        activityParticipationLabel: "ꯊꯕꯛꯇ ꯁꯔꯨꯛ ꯌꯥꯕ",
        activeDaysLabel: "ꯆꯌꯣꯜ ꯁꯤꯗ ꯊꯕꯛ ꯇ꧀ꯔꯕ ꯅꯨꯃꯤꯠ",
        todaysRemindersLabel: "ꯉꯁꯤꯒꯤ ꯅꯤꯡꯁꯤꯡ ꯄꯥꯎ",
        noRemindersScheduled: "ꯉꯁꯤꯒꯤ ꯅꯤꯡꯁꯤꯡ ꯄꯥꯎ ꯑꯃꯠꯇ ꯂꯩꯇ꯭ꯔꯤ।",
        pendingRemindersCount: "ꯉꯥꯏꯔꯤ",
        completedRemindersCount: "ꯂꯣꯏꯁꯤꯜꯂꯦ",
        participationTrendLabel: "ꯁꯔꯨꯛ ꯌꯥꯕꯒꯤ ꯃꯑꯣꯡ",
        trendIncreased: "ꯃꯃꯥꯡꯒ ꯆꯥꯡꯗꯝꯅꯕꯗ ꯊꯕꯛ ꯁꯔꯨꯛ ꯌꯥꯕ ꯍꯦꯟꯒꯠꯂꯦ।",
        trendDecreased: "ꯃꯃꯥꯡꯒ ꯆꯥꯡꯗꯝꯅꯕꯗ ꯊꯕꯛ ꯁꯔꯨꯛ ꯌꯥꯕ ꯍꯟꯊꯔꯦ।",
        trendSimilar: "ꯊꯕꛛ ꯁꯔꯨꯛ ꯌꯥꯕ ꯃꯃꯥꯡꯒ ꯃꯥꯟꯅꯈ꯭ꯔꯦ।",
        trendInsufficientData: "ꯆꯥꯡꯗꯝꯅꯕꯒꯤꯗꯃꯛ ꯃꯇꯤꯛ ꯆꯥꯕ ꯋꯥꯔꯤ ꯂꯩꯇ꯭ꯔꯤ।",
        progressTitle: "📊 ꯑꯩꯒꯤ ꯃꯥꯡꯖꯤꯜ ꯊꯥꯕ ꯑꯃꯁꯨꯡ ꯋꯥꯔꯤ",
        progressSubtitle: "ꯅꯍꯥꯛꯅ ꯂꯣꯏꯁꯤꯜꯂꯕ ꯊꯕꯛ, ꯍꯟꯗꯛꯀꯤ ꯃꯥꯔꯛ ꯑꯃꯁꯨꯡ ꯅꯨꯃꯤꯠ ꯈꯨꯗꯤꯡꯒꯤ ꯁꯔꯨꯛ ꯌꯥꯕ ꯌꯦꯡꯕꯤꯌꯨ।",
        totalActivities: "ꯄꯨꯟꯁꯤꯟꯕ ꯊꯕꯛ",
        recentAverageScore: "ꯍꯟꯗꯛꯀꯤ ꯆꯥꯡꯆꯠ ꯃꯥꯔꯛ",
        latestActivityHighlight: "🌟 ꯈ꯭ꯋꯥꯏꯗꯒꯤ ꯅꯧꯕ ꯊꯕꯛ",
        weeklyParticipationTitle: "📈 ꯅꯨꯃꯤꯠ ꯷-ꯒꯤ ꯊꯕꯛ ꯁꯔꯨꯛ ꯌꯥꯕ",
        activityHistoryTitle: "📝 ꯊꯕꯛꯀꯤ ꯋꯥꯔꯤ",
        showMore: "ꯃꯈꥥ ꯇꯥꯕ ꯋꯥꯔꯤ ꯌꯦꯡꯕ",
        noActivitiesYetTitle: "📭 ꯑꯍꯥꯟꯕ ꯊꯕꯛ ꯑꯃꯠꯇ ꯂꯣꯏꯁꯤꯗ꯭ꯔꯤ",
        noActivitiesYetSub: "ꯅꯍꯥꯛꯀꯤ ꯃꯥꯡꯖꯤꯜ ꯊꯥꯕ ꯌꯦꯡꯅꯕ ꯑꯍꯥꯟꯕ ꯋꯥꯈꯜ ꯊꯕꯛ ꯂꯣꯏꯁꯤꯜꯂꯨ!",
        startFirstActivity: "▶ ꯊꯕꯛ ꯍꯧꯕ",
        activityMemorySequence: "ꯅꯤꯡꯁꯤꯡ ꯃꯇꯦꯡ ꯆꯥꯡꯌꯦꯡ",
        activityAttentionChallenge: "ꯃꯤꯠꯌꯦꯡ ꯊꯝꯕꯒꯤ ꯆꯥꯡꯌꯦꯡ",
        activityRoutineRecall: "ꯅꯨꯃꯤꯠ ꯈꯨꯗꯤꯡꯒꯤ ꯊꯕꯛ",
        activityPatternRecognition: "ꯃꯑꯣꯡ ꯈꪪꯗꯣꯛꯄ",
        difficultyLabel: "ꯑꯔꯨꯕ ꯆꯥꯡ",
        attemptsLabel: "ꯍꯣꯠꯅꯕ",
        modeLabel: "ꯃꯑꯣꯡ",
        dateLabel: "ꯇꯥꯡ",
        floatingAiAssistant: "🤖 AI Assistant",
        close: "লোইশিনবা",
        send: "থাগৎপা",
        typeQuestion: "নহাফম ইবিয়ু...",
        thinking: "খন্থরি...",
        aiError: "ঙাসি পাউখুম পীবসি ঙমদ্রে।",
        aiDisclaimer: "App Assistant • Not medical advice",
        recommendedForYou: "নহাফমদা তৌনবগীদমক খনব",
        tryThisNext: "মথংদা থবক অসি তৌবীয়ু।",
        basedOnRecentActivity: "নহাকগী হৌখিবা থবকশিংদা য়ুমফম ওইবা",
        activityNotRecentlyTried: "নহাক্না হন্দক্তা থবক অসি তৌদ্রি।",
        activityNeverAttempted: "নহাক্না হৌজিকফাওবা থবক অসি তৌদ্রি।",
        activityVariety: "মসিনা নহাকগী থবকশিংদা খেত্নবা লৈহনগনি।",
        noActivityHistory: "হৌনবগীদমক থবক অসি তৌবীয়ু।",
        personalMilestones: "ইশাগী মাই পাকপা",
        milestonesAchieved: "ফংখাবা মাই পাকপাসিং",
        viewMilestones: "মাই পাকপাসিং ꯌꯦꯡꯕ",
        milestoneFirstActivityTitle: "অহানবা থবক",
        milestoneFirstActivityDesc: "নহাকগী অহানবা থবক ꯂꯣꯏꯁꯤꯅꯈ꯭ꯔꯦ।",
        milestoneThreeActivitiesTitle: "থবক ৩ ꯂꯣꯏꯁꯤꯅꯈ꯭ꯔꯦ",
        milestoneThreeActivitiesDesc: "থবক ৩ ꯂꯣꯏꯁꯤꯅꯈ꯭ꯔꯦ।",
        milestoneFiveActivitiesTitle: "থবক ৫ ꯂꯣꯏꯁꯤꯅꯈ꯭ꯔꯦ",
        milestoneFiveActivitiesDesc: "থবক ৫ ꯂꯣꯏꯁꯤꯅꯈ꯭ꯔꯦ।",
        milestoneThreeActiveDaysTitle: "সক্রীয় নুমিৎ ৩",
        milestoneThreeActiveDaysDesc: "খেত্নবা নুমিৎ ৩দা শরুক য়াখ্রে।",
        milestoneTenActivitiesTitle: "থবক ১০ ꯂꯣꯏꯁꯤꯅꯈ꯭ꯔꯦ",
        milestoneTenActivitiesDesc: "থবক ১০ ꯂꯣꯏꯁꯤꯅꯈ꯭ꯔꯦ।",
        milestoneAchieved: "ফংখ্রে",
        milestoneInProgress: "তৌরি",
        dailyConsistency: "ꯅꯨꯃꯤꯠ ꯈꯨꯗꯤꯡꯒꯤ ꯃꯈꯥ ꯇꯥꯕ",
        currentStreak: "হৌꯖꯤꯛ ꯑꯣꯏꯔꯤꯕ ꯃꯈꯥ ꯇꯥꯕ",
        daysInARow: "ꯅꯨꯃꯤꯠ ꯂꯦꯞꯇꯅ",
        activeThisWeek: "ꯆꯌꯣꯜ ꯑꯁꯤꯗ ꯁꯛꯔꯤꯌ ꯑꯣꯏꯕ ꯅꯨꯃꯤꯠ",
        keepItUp: "ꯅꯨꯃꯤꯠ ꯈꯨꯗꯤꯡꯒꯤ ꯊꯕꯛ ꯇꯧꯕꯒꯤꯗꯃꯛ ꯅꯨꯡꯉꯥꯏꯕ ꯄꯥꯎ!",
        startStreak: "ꯅꯨꯃꯤꯠ ꯈꯨꯗꯤꯡꯒꯤ ꯊꯕꯛ ꯍꯧꯅꯕ ꯉꯁꯤ ꯊꯕꯛ ꯑꯃ ꯂꯣꯏꯁꯤꯜꯂꯨ!",
        dayStreakLabel: "ꯅꯨꯃꯤꯠꯀꯤ ꯃꯈꯥ ꯇꯥꯕ",
        filterAllActivities: "ꯄꯨꯝꯅꯃꯛ ꯊꯕꯛꯁꯤꯡ",
        filterMemorySequence: "ꯅꯤꯡꯁꯤꯡ ꯃꯊꯪ-ꯃꯅꯥꯎ",
        filterAttentionChallenge: "ꯃꯤꯠꯌꯦꯡ ꯊꯝꯕꯒꯤ ꯆꯥꯡꯌꯦꯡ",
        filterRoutineRecall: "ꯅꯨꯃꯤꯠ ꯈꯨꯗꯤꯡꯒꯤ ꯊꯕꯛ ꯅꯤꯡꯁꯤꯡꯕ",
        filterPatternRecognition: "ꯃꯑꯣꯡ ꯈꯪꯗꯣꯛꯄ",
        noActivitiesForFilter: "ꯁꯥꯟꯅꯕ ꯑꯁꯤꯒꯤꯗꯃꯛ ꯍꯧꯖꯤꯛꯐꯥꯑꯣꯕ ꯊꯕꯛ ꯂꯣꯏꯁꯤꯟꯗ꯭ꯔꯤ।",
        startThisActivity: "ꯊꯕꯛ ꯑꯁꯤ ꯍꯧꯕ",
        mindfulPauseTitle: "তপꯅ ꯂꯦꯞꯄ ꯑꯃꯁꯨꯡ ꯃꯤꯠꯌꯦꯡ ꯑꯃꯨꯛ ꯊꯝꯕ",
        mindfulPauseSub: "ꯃꯈꯥ ꯇꯥꯗ꯭ꯔꯤꯉꯩ ꯃꯃꯥꯡꯗ ꯇꯄꯅ ꯂꯦꯞꯇꯨꯅ ꯁ꯭ꯋꯥꯁ ꯍꯣꯟꯅꯕ ꯑꯄꯤꯀꯄ ꯃꯇꯝ ꯑꯃ ꯂꯧꯕꯤꯌꯨ।",
        startPause: "তপꯅ ꯂꯦꯞꯄ ꯍꯧꯕ",
        pauseBreather: "ꯂꯦꯞꯄ",
        resetBreather: "ꯑꯃꯨꯛ ꯍꯧꯕ",
        phaseInhale: "ꯇꯄꯅ ꯁ꯭ꯋꯥꯁ ꯍꯣꯜꯂꯨ...",
        phaseHold: "শান্তিনা ꯊꯝꯃꯨ...",
        phaseExhale: "ꯇꯄꯅ ꯁ꯭ꯋꯥꯁ ꯊꯥꯗꯣꯛꯎ...",
        phaseRest: "ꯄꯣꯊꯥꯕꯤꯌꯨ...",
        breatherComplete: "ꯇꯄꯅ ꯄꯣꯊꯥꯕꯒꯤꯗꯃꯛ ꯑꯐꯕ ꯊꯕꯛ। ꯁꯦꯝ-ꯁꯥꯔꯕ ꯃꯇꯝꯗ ꯃꯈꯥ ꯇꯥꯕꯤꯌꯨ।"
    ,
        accessibilityDisplay: "উৎপা ꯑꯃꯁꯨꯡ ꯌꯧꯁꯤꯅꯕ",
        accessibilityDisplayDesc: "ꯇꯞꯅ ꯌꯦꯡꯅꯕ ꯃꯌꯦꯛꯀꯤ ꯑꯄꯥꯛꯄ ꯑꯃꯁꯨꯡ ꯃꯉꯥꯜ ꯁꯦꯝꯗꯣꯛ-ꯁꯦꯝꯖꯤꯟ ꯇꯧꯕꯤꯌꯨ।",
        textSize: "ꯃꯌꯦꯛꯀꯤ ꯑꯄꯥꯛꯄ",
        textSizeStandard: "ꯆꯥꯡꯃꯥꯟꯕ",
        textSizeLarge: "ꯆꯥꯎꯕ (+15%)",
        textSizeExtraLarge: "ꯌꯥꯝꯅ ꯆꯥꯎꯕ (+30%)",
        highContrast: "ꯑꯀꯟꯕ ꯃꯉꯥꯜ",
        highContrastOn: "ꯍꯥꯡꯗꯣꯛꯄ (ꯑꯀꯟꯕ)",
        highContrastOff: "ꯊꯤꯡꯖꯤꯟꯕ (ꯆꯥꯡꯃꯥꯟꯕ)",
        resetDisplaySettings: "ꯑꯃꯨꯛ ꯍꯧꯗꯣꯛꯄ",
        saveDisplaySettings: "ꯂꯣꯏꯔꯦ",
        displaySettingsSaved: "ꯁꯦꯝꯖꯤꯟꯕ ꯇꯧꯔꯦ।"
    },
    lus: {
        backToDashboard: "← Dashboard-ah let leh rawh",
        logout: "🚪 Chhuak rawh",
        welcome: "Chibai 👋",
        welcomeDesc: "He platform hian upate tan hriatna tihchakna, hriatreng puitu leh thil pawimawhte a chhawp chhuak a ni.",
        cognitiveActivity: "🧠 Hriatna Tithar Thawhrah",
        cognitiveDesc: "Hriatna, rilru pekna leh ngaihtuahna tithar tura duan thawhrah awlsamte ti zo rawh.",
        startActivity: "Hna ṭan rawh",
        attention: "🎯 Rilru Pekna Fiahna",
        routine: "🔢 Nitin Chawlhhah Hriatrengna",
        pattern: "🧩 A Mizia Hriatfiahna",
        mood: "😊 Rilru Awmdan",
        reminders: "📅 Hriattirna",
        remindersDesc: "Nitin hna pawimawh leh chawlhhah awlsam takin vawng reng rawh.",
        viewReminders: "Hriattirna en rawh",
        progress: "📊 Hmasawnna",
        progressDesc: "Hun kal zela i hmasawnna leh i thiltihte en rawh.",
        viewProgress: "Hmasawnna en rawh",
        caregiver: "👨‍👩‍👧 Enkawltu",
        caregiverDesc: "Enkawltute tana enkawl mekte nitin hna puih theihna hmun.",
        caregiverArea: "Enkawltu Hmun",
        assistant: "🤖 Hriatna Puitu",
        assistantDesc: "Puitu hi zawhna zawt la emaw platform hman danah puihna dil rawh.",
        openAssistant: "Puitu hawng rawh",
        memoryTitle: "🧠 Hriatrengna Zawn",
        rememberNumbers: "Nambar hmuhte hi hre reng rawh.",
        rememberObjects: "Heng thil hriat larte hi indawtin hre reng rawh.",
        enterNumbers: "I hriatreng nambar chu ziak rawh:",
        chooseObjects: "I hriatreng dan indawtin thilte hmet rawh.",
        checkAnswer: "Chhanna endik rawh",
        nextRound: "A dawt leh",
        memorySuccess: "✅ A va tha em! Dik takin i hre reng e.",
        memoryTryAgain: "A pawi lo ve. Ti tha leh ang.",
        placeholderEnterNumber: "Nambar ziak rawh",
        standardMode: "🔢 Nambar Pangaite",
        culturalMode: "🌿 Thil Hriatlarte",
        attentionTitle: "🎯 Rilru Pekna Fiahna",
        attentionInstructions: "Vawikhat chauh lang nambar zawng chhuak rawh.",
        startAttentionGame: "Inelna ṭan rawh",
        attentionSuccess: "✅ A va tha em! I hmu chhuak ta.",
        attentionTryAgain: "A pawi lo ve. Ti leh chhin rawh!",
        routineTitle: "🔢 Nitin Chawlhhah Hriatrengna",
        rememberRoutine: "Thiltih indawt dan hi hre reng rawh.",
        chooseTime: "Chawhma, Chawhnu emaw Zanit thlang rawh.",
        routineMorning: "🌅 Chawhma",
        routineAfternoon: "☀️ Chawhnu",
        routineEvening: "🌙 Zanit",
        routineSuccess: "🎉 A va ropui em! A pumpuiin i hre reng e.",
        routineTryAgain: "A pawi lo ve! A indawt dan hriat tum rawh.",
        routineNextActivity: "✅ A dik e! A dawt leh zawng rawh.",
        patternTitle: "🧩 A Mizia Hriatfiahna",
        patternInstructions: "A hnuaia lang mizia hi hre reng rawh.",
        patternChoose: "I hriatreng mizia chu hmet rawh.",
        nextPatternRound: "Mizia dawt leh",
        patternSuccess: "✅ A tha lutuk! Mizia i hre reng e.",
        patternTryAgain: "A pawi lo ve. A dang ti leh ang.",
        moodTitle: "😊 Vawiin i eng nge i an?",
        moodInstructions: "Vawiina i rilru awmdan ber thlang rawh.",
        moodGood: "😀 Ka tha e",
        moodOkay: "🙂 Ka pangngai e",
        moodNotGreat: "😐 Ka nuam vak lo",
        moodWorried: "😟 Ka rilru a hah deuh",
        moodTired: "😴 Ka chau hle mai",
        moodSaving: "I chhanna kan vawng mekah...",
        moodSaved: "💙 I rilru awmdan i hrilh avangin ka lawm e.",
        moodError: "A pawi hle mai, kan vawng thei lo.",
        myReminders: "📅 Ka Hriattirnate",
        myRemindersDesc: "Vawiin leh nakin zela i enkawltu hriattirnate.",
        loadingReminders: "Hriattirna a inbuatsaih mek...",
        noRemindersFound: "Hriattirna hmuh a ni lo.",
        markAsDone: "✓ Ti zo tawh angah dah rawh",
        done: "✅ Ti zo tawh",
        completed: "✅ Ti zo tawh",
        dueNow: "🔔 Tih a hun chiah",
        passed: "A hun a liam tawh",
        today: "Vawiin",
        upcoming: "Lo la thleng tur",
        myProgress: "📊 Ka Hmasawnna",
        myProgressDesc: "I hriatna tihchakna thiltih dinhmun a hnuaiah hian a lang.",
        loadingProgress: "Hmasawnna lak mek a ni...",
        noActivityResults: "Hmasawnna hmuh a la ni lo.",
        activities: "Thiltihte",
        averageScore: "Mark lak tlangpui",
        bestScore: "Mark tha ber",
        successful: "Hlawhtling",
        caregiverDashboard: "👨‍👩‍👧 Enkawltu Dashboard",
        caregiverDashboardDesc: "Damlo hriatna tihchakna dinhmun leh hnuhnungte vil rawh.",
        loadingCaregiver: "Dashboard a inbuatsaih mek...",
        noCaregiverActivity: "Damlo thiltih hmuh tur a la awm lo.",
        patientActivitySummary: "📊 Damlo Thiltih Tlangpui",
        patientMoodInsights: "😊 Damlo Rilru Awmdan Hriatna",
        noMoodCheckins: "📭 Rilru awmdan ziah luh a la awm lo.",
        latestMood: "Hnuhnung ber",
        recentMoodHistory: "Rilru awmdan ziah luh hnuhnunge",
        recentActivity: "📝 Thiltih hnuhnungte",
        createReminder: "🔔 Hriattirna Siam rawh",
        createReminderDesc: "Damlo tana hriattirna thar siamna.",
        saveReminder: "💾 Hriattirna Vawng rawh",
        savedReminders: "📋 Hriattirna Vawn Tathte",
        noSavedReminders: "📭 Hriattirna siam a la awm lo.",
        deleteReminder: "🗑️ Nuaibo rawh",
        completedByPatient: "✅ Damloin a ti zo tawh",
        pending: "⏳ Tih tur la awm",
        assistantTitle: "🤖 Hriatna Puitu",
        promptPlaceholder: "I zawhna hetah hian ziak rawh...",
        startListening: "Ngaihthlak tan rawh",
        askAssistant: "Puitu zawt rawh",
        readAloud: "Chhanna chhiar chhuak rawh",
        voiceHelp: "Aw hmanga zawhna zawt turin “Ngaihthlak tan rawh” tih hi hmet rawh.",
        goodMorning: "Chawhma chibai 👋",
        goodAfternoon: "Chawhnu chibai 👋",
        goodEvening: "Zanit chibai 👋",
        todayPlan: "Vawiina i vawng hna leh tlangpui a hnuaiah hian a lang.",
        dailyProgressTitle: "Vawiina Hmasawnna",
        dailyProgressHelp: "Vawiina hriatna tihchakna, rilru awmdan leh hriattirna a zirin.",
        dailyProgressNoRemindersHelp: "Vawiina hriatna tihchakna leh rilru awmdan a zirin (vawiin hriattirna a awm lo).",
        todaysPriorities: "🎯 Vawiin Atana Hmaih Theih Loh Thilte",
        dailyPlan: "📅 Nitin Ruahmanna",
        viewDailyPlan: "Nitin Ruahmanna En Rawh",
        yourPlanToday: "Vawiin atana i ruahmanna",
        morning: "Zing",
        afternoon: "Chawhnu",
        evening: "Zan",
        anytime: "Eng tik hunah pawh",
        nothingScheduled: "Bawk an awm lo",
        tasksRemaining: "Hna la bawk",
        todaysActivity: "Hna Awmsa",
        appointmentCategory: "Inhmuhna",
        medicationCategory: "Damdawi",
        personalCategory: "Maltin",
        activityCategory: "Thiltih",
        hydrationCategory: "Tui in",
        otherCategory: "A dangte",
        filterAll: "Zawng zawng",
        filterPending: "Tihtur la awm",
        filterCompleted: "Tih zawh tawh",
        quickAccess: "⚡ Awlsam Takin Hawng Rawh",
        completedTasksOf: "zawh a ni tawh",
        checkIn: "Lut Rawh",
        checkInAgain: "Ti Tha Leh Rawh",
        continueReminders: "📅 Vawiina Hriattirna ti zo rawh",
        continueActivity: "🧠 Vawiina Hriatna Tithar Hna ṭan rawh",
        continueMood: "😊 Rilru Awmdan ziak lut rawh",
        continueGreatJob: "🎉 Vawiin atan a zo e! Thiltih dang ti leh chhin rawh",
        todayRemindersTitle: "Vawiina Hriattirnate",
        pendingCount: "tih tur la awm",
        completedTodayCount: "vawiin zawh tawh",
        noRemindersScheduledToday: "Vawiin atan hriattirna siam a awm lo.",
        todayActivityTitle: "Vawiina Hriatna Tithar Hna",
        activityCompletedToday: "✅ Vawiin atan thawhrah tih zawh a ni tawh",
        noActivityToday: "⏳ Vawiin atan thawhrah tih a la awm lo",
        latestMoodLabel: "Rilru Awmdan Hnuhnung Ber",
        noMoodCheckinToday: "📭 Vawiin ziah luh a la awm lo. Eng nge i an?",
        recentPerformanceTitle: "Hmasawnna Hnuhnung Tlangpui",
        recentAverage: "Mark lak tlangpui",
        noPerformanceData: "Thawhrah ziah luh a la awm lo.",
        loadingDashboard: "Dashboard a inbuatsaih mek...",
        caregiverInsightsTitle: "💡 Enkawltu Hriatpuitu",
        caregiverInsightsSub: "Damlo thiltih hmasawnna, hriattirna tih zawh leh nitin hna tlangpui.",
        activityParticipationLabel: "Thiltiha Telna",
        activeDaysLabel: "kar chhunga thiltih ni zah",
        todaysRemindersLabel: "Vawiina Hriattirnate",
        noRemindersScheduled: "Vawiin atan hriattirna siam a awm lo.",
        pendingRemindersCount: "tih tur la awm",
        completedRemindersCount: "tih zawh tawh",
        participationTrendLabel: "Hmasawnna Kalchho Dan",
        trendIncreased: "Hun hmasachhúng nen khaikhawmin thiltiha telna a sang zawk.",
        trendDecreased: "Hun hmasachhúng nen khaikhawmin thiltiha telna a hniam zawk.",
        trendSimilar: "Thiltiha telna chu hun hmasachhúng nen a inang deuh chiah.",
        trendInsufficientData: "Khaikhawm turin hriatna chanchin a la tawk lo.",
        progressTitle: "📊 Ka Hmasawnna leh Chanchin",
        progressSubtitle: "I thiltih zawh tawhte, mark lak hnuhnungte leh nitin hmasawnna en rawh.",
        totalActivities: "Thiltih zawng zawng",
        recentAverageScore: "Mark lak tlangpui",
        latestActivityHighlight: "🌟 Thiltih Hnuhnung Ber",
        weeklyParticipationTitle: "📈 Ni 7 Chhung Thiltih Hmasawnna",
        activityHistoryTitle: "📝 Thiltih Chanchin",
        showMore: "A dang en leh rawh",
        noActivitiesYetTitle: "📭 Thawhrah tih zawh a la awm lo",
        noActivitiesYetSub: "I hmasawnna vil zui turin i hriatna tihchakna hna hmasaber hi ti zo rawh!",
        startFirstActivity: "▶ Hna ṭan rawh",
        activityMemorySequence: "Hriatrengna Zawn",
        activityAttentionChallenge: "Rilru Pekna Fiahna",
        activityRoutineRecall: "Nitin Chawlhhah Hriatrengna",
        activityPatternRecognition: "A Mizia Hriatfiahna",
        difficultyLabel: "Har dan",
        attemptsLabel: "Vawi ti chhin",
        modeLabel: "Mizia",
        dateLabel: "Ni",
        floatingAiAssistant: "🤖 AI Puihtu",
        close: "Khár rawh",
        send: "Hanti rawh",
        typeQuestion: "Zawhna ziak rawh...",
        thinking: "A ngaihtuah mek...",
        aiError: "Ka tihpalh, AI puihtu hian tunah chhanna a pe thei lo.",
        aiDisclaimer: "App puihna chauh • Damdawi thurawn a ni lo",
        recommendedForYou: "I tana rawtna",
        tryThisNext: "Heng thiltih hi ti leh rawh.",
        basedOnRecentActivity: "I thiltih hnuhnung bera innghatin",
        activityNotRecentlyTried: "Tukina hian heng thiltih hi i ti ngai lo.",
        activityNeverAttempted: "Heng thiltih hi i ti ngai miah lo.",
        activityVariety: "Hian i thiltihah inthlaichhiahna a siam.",
        noActivityHistory: "Tan nan heng thiltih hi ti rawh.",
        personalMilestones: "Mali chakna",
        milestonesAchieved: "Hlawhtlinnate",
        viewMilestones: "Hlawhtlinnate en rawh",
        milestoneFirstActivityTitle: "Thiltih hmasa ber",
        milestoneFirstActivityDesc: "I thiltih hmasa ber i zo ta.",
        milestoneThreeActivitiesTitle: "Thiltih 3 zawh a ni",
        milestoneThreeActivitiesDesc: "Thiltih 3 i zo ta.",
        milestoneFiveActivitiesTitle: "Thiltih 5 zawh a ni",
        milestoneFiveActivitiesDesc: "Thiltih 5 i zo ta.",
        milestoneThreeActiveDaysTitle: "Ni 3 hman a ni",
        milestoneThreeActiveDaysDesc: "Ni 3 hrang hrangah i tel ta.",
        milestoneTenActivitiesTitle: "Thiltih 10 zawh a ni",
        milestoneTenActivitiesDesc: "Thiltih 10 i zo ta.",
        milestoneAchieved: "Hlawhtling ta",
        milestoneInProgress: "Calh lai",
        dailyConsistency: "Nitin inzawmna",
        currentStreak: "Nitin thiltih zawm zui lai",
        daysInARow: "ni zawm zatin",
        activeThisWeek: "Karkara ni hman zat",
        keepItUp: "I nitin thiltih a tluang hle mai!",
        startStreak: "I inzawmna siam turin vawiinah thiltih zo rawh!",
        dayStreakLabel: "Ni inzawmna",
        filterAllActivities: "Thiltih zawng zawng",
        filterMemorySequence: "Hriatrengna inzawmna",
        filterAttentionChallenge: "Ngaihtuahna hmun khat a dah bikna",
        filterRoutineRecall: "Nitin thiltih hriatrengna",
        filterPatternRecognition: "A zia hriatchhuahna",
        noActivitiesForFilter: "Heng game atan hian thiltih engmah zawh a la ni lo.",
        startThisActivity: "Heng thiltih hi tan rawh",
        mindfulPauseTitle: "Thaw pik chawlhna leh rilru chawlhhna",
        mindfulPauseSub: "Tih zawm leh hmain zawi muanga thawk lakna hun reilotawte hmang rawh.",
        startPause: "Thaw pik chawlhna tan rawh",
        pauseBreather: "Chawl rih rawh",
        resetBreather: "Siambha tha rawh",
        phaseInhale: "Zawi muangin thawk la rawh...",
        phaseHold: "Thaw hawk rih rawh...",
        phaseExhale: "Zawi muangin thaw chhuak rawh...",
        phaseRest: "Chawl hahdam rawh...",
        breatherComplete: "Thaw pik chawlhna tha tak i hmang e. I inpeih hunah chhunzawm rawh.",
        accessibilityDisplay: "Lanna leh Awlsamna",
        accessibilityDisplayDesc: "Hmuh nuam zawk nan hawrawp len zawng leh a rawng thlak danglam rawh.",
        textSize: "Hawrawp len zawng",
        textSizeStandard: "A pangngai",
        textSizeLarge: "A lian (+15%)",
        textSizeExtraLarge: "A lian zual (+30%)",
        highContrast: "Tualvawn fiah bik",
        highContrastOn: "On (Fiah bik)",
        highContrastOff: "Off (A pangngai)",
        resetDisplaySettings: "A pangngaiah dah let rawh",
        saveDisplaySettings: "Zo ta",
        displaySettingsSaved: "Lanna ruahmanna siam tha ta."
    }
};

function getCurrentLanguage() {
    return localStorage.getItem("cognitive_language") || languageSelect?.value || "en";
}

function t(key) {
    const language = getCurrentLanguage();
    if (translations[language] && translations[language][key]) {
        return translations[language][key];
    }
    return translations.en[key] || key;
}

function applyLanguage(language) {
    const activeDict = translations[language] || translations.en;
    if (!activeDict) return;

    try {
        localStorage.setItem("cognitive_language", language);
    } catch (e) {
        console.warn("localStorage not accessible for language persistence:", e);
    }

    // 1. Update data-i18n elements
    document.querySelectorAll("[data-i18n]").forEach((el) => {
        const key = el.getAttribute("data-i18n");
        if (activeDict[key]) {
            el.textContent = activeDict[key];
        }
    });

    // 2. Update data-i18n-placeholder elements
    document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
        const key = el.getAttribute("data-i18n-placeholder");
        if (activeDict[key]) {
            el.placeholder = activeDict[key];
        }
    });

    // 3. Update all back-to-dashboard buttons
    document.querySelectorAll(".back-to-dashboard-btn").forEach((btn) => {
        btn.textContent = activeDict.backToDashboard || "← Back to Dashboard";
    });

    // 4. Update specific core elements by ID or querySelector
    const elementMap = {
        "#accessibilityDisplayLabel": activeDict.accessibilityDisplay,
        "#accessibilityModalTitle": activeDict.accessibilityDisplay,
        "#accessibilityModalDesc": activeDict.accessibilityDisplayDesc,
        "#textSizeHeading": activeDict.textSize,
        "#textSizeStandardLabel": activeDict.textSizeStandard,
        "#textSizeLargeLabel": activeDict.textSizeLarge,
        "#textSizeExtraLargeLabel": activeDict.textSizeExtraLarge,
        "#highContrastHeading": activeDict.highContrast,
        "#highContrastOffLabel": activeDict.highContrastOff,
        "#highContrastOnLabel": activeDict.highContrastOn,
        "#resetDisplaySettingsLabel": activeDict.resetDisplaySettings,
        "#saveDisplaySettingsLabel": activeDict.saveDisplaySettings,
        ".welcome h2": activeDict.welcome,
        ".welcome p": activeDict.welcomeDesc,
        "#cognitiveActivityCard h3": activeDict.cognitiveActivity,
        "#cognitiveActivityCard p": activeDict.cognitiveDesc,
        "#activityBtn": activeDict.startActivity,
        "#attentionBtn": activeDict.attention,
        "#routineRecallBtn": activeDict.routine,
        "#patternGameBtn": activeDict.pattern,
        "#moodCheckinBtn": activeDict.mood,
        ".cards .card:nth-child(2) h3": activeDict.reminders,
        ".cards .card:nth-child(2) p": activeDict.remindersDesc,
        "#reminderBtn": activeDict.viewReminders,
        ".cards .card:nth-child(3) h3": activeDict.progress,
        ".cards .card:nth-child(3) p": activeDict.progressDesc,
        "#progressBtn": activeDict.viewProgress,
        ".cards .card:nth-child(4) h3": activeDict.caregiver,
        ".cards .card:nth-child(4) p": activeDict.caregiverDesc,
        "#caregiverBtn": activeDict.caregiverArea,
        "#assistantCard h3": activeDict.assistant,
        "#assistantCard p": activeDict.assistantDesc,
        "#openAssistantBtn": activeDict.openAssistant,

        "#memoryGame h2": activeDict.memoryTitle,
        "#memoryStandardModeBtn": activeDict.standardMode,
        "#memoryCulturalModeBtn": activeDict.culturalMode,
        "#gameInstructions": activeDict.rememberNumbers,
        "#checkAnswer": activeDict.checkAnswer,
        "#nextRound": activeDict.nextRound,
        "label[for='answer']": activeDict.enterNumbers,

        "#attentionGame h2": activeDict.attentionTitle,
        "#attentionInstructions": activeDict.attentionInstructions,
        "#startAttentionGame": activeDict.startAttentionGame,

        "#routineRecallGame h2": activeDict.routineTitle,
        "#routineInstructions": activeDict.rememberRoutine,
        "#morningRoutineBtn": activeDict.routineMorning,
        "#afternoonRoutineBtn": activeDict.routineAfternoon,
        "#eveningRoutineBtn": activeDict.routineEvening,

        "#patternGame h2": activeDict.patternTitle,
        "#patternInstructions": activeDict.patternInstructions,
        "#nextPatternRound": activeDict.nextPatternRound,

        "#moodCheckin h2": activeDict.moodTitle,
        "#moodInstructions": activeDict.moodInstructions,
        "button[data-mood='Good']": activeDict.moodGood,
        "button[data-mood='Okay']": activeDict.moodOkay,
        "button[data-mood='Not great']": activeDict.moodNotGreat,
        "button[data-mood='Worried']": activeDict.moodWorried,
        "button[data-mood='Tired']": activeDict.moodTired,

        "#remindersSection h2": activeDict.myReminders,
        "#remindersSection p": activeDict.myRemindersDesc,

        "#progressSection h2": activeDict.myProgress,
        "#progressSection p": activeDict.myProgressDesc,

        "#caregiverSection h2": activeDict.caregiverDashboard,
        "#caregiverSection p": activeDict.caregiverDashboardDesc,
        "#createReminderSection h2": activeDict.createReminder,
        "#createReminderSection p": activeDict.createReminderDesc,
        "#saveReminderBtn": activeDict.saveReminder,

        "#assistantSection h2": activeDict.assistantTitle,
        "#assistantSection > p": activeDict.assistantDesc,
        "#startListening": activeDict.startListening,
        "#askGemini": activeDict.askAssistant,
        "#repeatResponse": activeDict.readAloud,
        "#voiceStatus": activeDict.voiceHelp,

        "#logoutBtn": activeDict.logout,
        "#floatingAssistantTitle": activeDict.floatingAiAssistant || activeDict.assistantTitle,
        "#floatingAssistantDisclaimer": activeDict.aiDisclaimer
    };

    const floatingInput = document.getElementById("floatingAssistantInput");
    if (floatingInput && activeDict.typeQuestion) {
        floatingInput.placeholder = activeDict.typeQuestion;
    }
    const closeFloatingBtn = document.getElementById("closeFloatingAssistantBtn");
    if (closeFloatingBtn && activeDict.close) {
        closeFloatingBtn.setAttribute("aria-label", activeDict.close);
    }
    const sendFloatingBtn = document.getElementById("floatingAssistantSendBtn");
    if (sendFloatingBtn && activeDict.send) {
        sendFloatingBtn.setAttribute("aria-label", activeDict.send);
    }

    Object.entries(elementMap).forEach(([selector, text]) => {
        if (!text) return;
        const el = document.querySelector(selector);
        if (el) {
            el.textContent = text;
        }
    });

    const promptInput = document.getElementById("prompt");
    if (promptInput && activeDict.promptPlaceholder) {
        promptInput.placeholder = activeDict.promptPlaceholder;
    }

    const answerInput = document.getElementById("answer");
    if (answerInput && activeDict.placeholderEnterNumber) {
        answerInput.placeholder = activeDict.placeholderEnterNumber;
    }

    applyCulturalGameLabels();

    if (currentUserRole === "patient") {
        const welcomeSection = document.querySelector(".welcome");
        if (welcomeSection && welcomeSection.style.display !== "none") {
            loadPatientPersonalizedDashboard();
        }
        const progressSection = document.getElementById("progressSection");
        if (progressSection && progressSection.style.display !== "none") {
            loadPatientProgressView();
        }
    } else if (currentUserRole === "caregiver") {
        const caregiverSection = document.getElementById("caregiverSection");
        if (caregiverSection && caregiverSection.style.display !== "none") {
            loadCaregiverDashboard();
        }
    }

    console.log("🌐 UI language applied:", language);
}

// Language rehydration on load (P1.4)
const initialSavedLanguage = localStorage.getItem("cognitive_language") || "en";
if (languageSelect) {
    languageSelect.value = initialSavedLanguage;
}
applyLanguage(initialSavedLanguage);



// ==========================================================================
// P5.2 — GLOBAL FLOATING AI ASSISTANT LOGIC
// ==========================================================================

const floatingAssistantBtn = document.getElementById("floatingAssistantBtn");
const floatingAssistantPanel = document.getElementById("floatingAssistantPanel");
const closeFloatingAssistantBtn = document.getElementById("closeFloatingAssistantBtn");
const floatingAssistantInput = document.getElementById("floatingAssistantInput");
const floatingAssistantSendBtn = document.getElementById("floatingAssistantSendBtn");
const floatingAssistantMessages = document.getElementById("floatingAssistantMessages");

function toggleFloatingAssistant(open) {
    if (!floatingAssistantPanel || !floatingAssistantBtn) return;

    const shouldOpen = open !== undefined ? open : floatingAssistantPanel.style.display === "none";

    if (shouldOpen) {
        floatingAssistantPanel.style.display = "flex";
        floatingAssistantBtn.setAttribute("aria-expanded", "true");
        if (floatingAssistantInput) {
            floatingAssistantInput.focus();
        }

        // Render initial greeting if empty
        if (floatingAssistantMessages && floatingAssistantMessages.children.length === 0) {
            const initialGreeting = t("goodMorning") || "Hello! How can I help you today?";
            const aiMsg = document.createElement("div");
            aiMsg.className = "floating-msg floating-msg-ai";
            aiMsg.textContent = `👋 ${initialGreeting}`;
            floatingAssistantMessages.appendChild(aiMsg);
        }
    } else {
        floatingAssistantPanel.style.display = "none";
        floatingAssistantBtn.setAttribute("aria-expanded", "false");
        floatingAssistantBtn.focus();
    }
}

if (floatingAssistantBtn) {
    floatingAssistantBtn.addEventListener("click", () => {
        toggleFloatingAssistant();
    });
}

if (closeFloatingAssistantBtn) {
    closeFloatingAssistantBtn.addEventListener("click", () => {
        toggleFloatingAssistant(false);
    });
}

// Escape key closes floating assistant
document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && floatingAssistantPanel && floatingAssistantPanel.style.display !== "none") {
        toggleFloatingAssistant(false);
    }
});

async function submitFloatingAssistantPrompt() {
    if (!floatingAssistantInput || !floatingAssistantMessages) return;

    const userPrompt = floatingAssistantInput.value.trim();
    if (!userPrompt) return;

    // Append user message
    const userMsg = document.createElement("div");
    userMsg.className = "floating-msg floating-msg-user";
    userMsg.textContent = userPrompt;
    floatingAssistantMessages.appendChild(userMsg);

    floatingAssistantInput.value = "";
    floatingAssistantInput.disabled = true;
    if (floatingAssistantSendBtn) floatingAssistantSendBtn.disabled = true;

    // Append loading message
    const loadingMsg = document.createElement("div");
    loadingMsg.className = "floating-msg floating-msg-loading";
    loadingMsg.textContent = t("thinking") || "The assistant is thinking...";
    floatingAssistantMessages.appendChild(loadingMsg);
    floatingAssistantMessages.scrollTop = floatingAssistantMessages.scrollHeight;

    try {
        const selectedLanguage = document.getElementById("languageSelect")?.value || "en";
        const responseLanguage = assistantLanguages[selectedLanguage] || "English";
        const roleContext = currentUserRole === "caregiver" 
            ? "The user is a caregiver supporting an elderly patient." 
            : "The user is an elderly patient.";

        const systemPrompt = `You are a friendly memory assistance AI for a cognitive gaming platform. ${roleContext}
Give simple, clear, factual, and supportive answers in ${responseLanguage}.
Do not diagnose medical conditions or give clinical treatment instructions.
Do not give answers to cognitive game questions.
Explain how to use the app, view reminders, start activities, or check progress in a simple way.

User question:
${userPrompt}`;

        const result = await model.generateContent(systemPrompt);
        const responseText = result.response.text();

        loadingMsg.remove();

        const aiMsg = document.createElement("div");
        aiMsg.className = "floating-msg floating-msg-ai";
        aiMsg.textContent = responseText;
        floatingAssistantMessages.appendChild(aiMsg);

        // Simple navigation helper
        const promptLower = userPrompt.toLowerCase();
        if (promptLower.includes("reminder") || promptLower.includes("reminders") || promptLower.includes("अनुस्मारक")) {
            const reminderBtn = document.getElementById("reminderBtn");
            if (reminderBtn) reminderBtn.click();
        } else if (promptLower.includes("progress") || promptLower.includes("प्रगति") || promptLower.includes("প্রগতি")) {
            const progressBtn = document.getElementById("progressBtn");
            if (progressBtn) progressBtn.click();
        }

    } catch (error) {
        console.error("Floating assistant error:", error);
        loadingMsg.remove();

        const errorMsg = document.createElement("div");
        errorMsg.className = "floating-msg floating-msg-ai";
        errorMsg.style.color = "#b42318";
        errorMsg.textContent = t("aiError") || "Sorry, the assistant could not respond right now.";
        floatingAssistantMessages.appendChild(errorMsg);
    } finally {
        floatingAssistantInput.disabled = false;
        if (floatingAssistantSendBtn) floatingAssistantSendBtn.disabled = false;
        floatingAssistantInput.focus();
        floatingAssistantMessages.scrollTop = floatingAssistantMessages.scrollHeight;
    }
}

if (floatingAssistantSendBtn) {
    floatingAssistantSendBtn.addEventListener("click", () => {
        submitFloatingAssistantPrompt();
    });
}

if (floatingAssistantInput) {
    floatingAssistantInput.addEventListener("keydown", (event) => {
        if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();
            submitFloatingAssistantPrompt();
        }
    });
}

// ==========================================================================
// P6.9 — APPLICATION-WIDE ACCESSIBILITY & DISPLAY PREFERENCES
// ==========================================================================

const VISUAL_PREFS_STORAGE_KEY = "cognitive_visual_prefs";

const DEFAULT_VISUAL_PREFS = {
    textScale: "standard",   // "standard" | "large" | "extra-large"
    highContrast: false      // boolean
};

function getStoredVisualPrefs() {
    try {
        const raw = localStorage.getItem(VISUAL_PREFS_STORAGE_KEY);
        if (!raw) return { ...DEFAULT_VISUAL_PREFS };
        const parsed = JSON.parse(raw);
        const validScales = ["standard", "large", "extra-large"];
        const textScale = validScales.includes(parsed.textScale) ? parsed.textScale : "standard";
        const highContrast = Boolean(parsed.highContrast);
        return { textScale, highContrast };
    } catch (err) {
        console.warn("Could not read visual preferences, using defaults:", err);
        return { ...DEFAULT_VISUAL_PREFS };
    }
}

function saveVisualPrefs(prefs) {
    try {
        const validScales = ["standard", "large", "extra-large"];
        const sanitized = {
            textScale: validScales.includes(prefs.textScale) ? prefs.textScale : "standard",
            highContrast: Boolean(prefs.highContrast)
        };
        localStorage.setItem(VISUAL_PREFS_STORAGE_KEY, JSON.stringify(sanitized));
    } catch (err) {
        console.warn("Could not persist visual preferences:", err);
    }
}

function applyVisualPrefs(prefs) {
    const root = document.documentElement;
    if (!root) return;

    // 1. Text Scale
    if (prefs.textScale === "large" || prefs.textScale === "extra-large") {
        root.setAttribute("data-text-scale", prefs.textScale);
    } else {
        root.removeAttribute("data-text-scale");
    }

    // 2. High Contrast
    if (prefs.highContrast) {
        root.setAttribute("data-contrast", "on");
    } else {
        root.removeAttribute("data-contrast");
    }

    // Update Modal Controls UI
    updateAccessibilityModalUI(prefs);
}

function updateAccessibilityModalUI(prefs) {
    // Text scale buttons
    const stdBtn = document.getElementById("textSizeStandardBtn");
    const lrgBtn = document.getElementById("textSizeLargeBtn");
    const xlBtn = document.getElementById("textSizeExtraLargeBtn");

    if (stdBtn) stdBtn.setAttribute("aria-pressed", String(prefs.textScale === "standard"));
    if (lrgBtn) lrgBtn.setAttribute("aria-pressed", String(prefs.textScale === "large"));
    if (xlBtn) xlBtn.setAttribute("aria-pressed", String(prefs.textScale === "extra-large"));

    // High contrast buttons
    const offBtn = document.getElementById("highContrastOffBtn");
    const onBtn = document.getElementById("highContrastOnBtn");

    if (offBtn) offBtn.setAttribute("aria-pressed", String(!prefs.highContrast));
    if (onBtn) onBtn.setAttribute("aria-pressed", String(prefs.highContrast));
}

let activeVisualPrefs = getStoredVisualPrefs();
applyVisualPrefs(activeVisualPrefs);

let lastFocusedElementBeforeModal = null;

function openAccessibilityModal() {
    const modalOverlay = document.getElementById("accessibilityModalOverlay");
    const triggerBtn = document.getElementById("accessibilitySettingsBtn");
    if (!modalOverlay) return;

    lastFocusedElementBeforeModal = document.activeElement;
    activeVisualPrefs = getStoredVisualPrefs();
    applyVisualPrefs(activeVisualPrefs);

    modalOverlay.style.display = "flex";
    if (triggerBtn) triggerBtn.setAttribute("aria-expanded", "true");

    const closeBtn = document.getElementById("closeAccessibilityModalBtn");
    if (closeBtn) closeBtn.focus();
}

function closeAccessibilityModal() {
    const modalOverlay = document.getElementById("accessibilityModalOverlay");
    const triggerBtn = document.getElementById("accessibilitySettingsBtn");
    if (!modalOverlay) return;

    modalOverlay.style.display = "none";
    if (triggerBtn) {
        triggerBtn.setAttribute("aria-expanded", "false");
        triggerBtn.focus();
    } else if (lastFocusedElementBeforeModal && typeof lastFocusedElementBeforeModal.focus === "function") {
        lastFocusedElementBeforeModal.focus();
    }
}

function initAccessibilitySettings() {
    const triggerBtn = document.getElementById("accessibilitySettingsBtn");
    const modalOverlay = document.getElementById("accessibilityModalOverlay");
    const closeBtn = document.getElementById("closeAccessibilityModalBtn");
    const saveBtn = document.getElementById("saveDisplaySettingsBtn");
    const resetBtn = document.getElementById("resetDisplaySettingsBtn");

    const stdBtn = document.getElementById("textSizeStandardBtn");
    const lrgBtn = document.getElementById("textSizeLargeBtn");
    const xlBtn = document.getElementById("textSizeExtraLargeBtn");
    const offBtn = document.getElementById("highContrastOffBtn");
    const onBtn = document.getElementById("highContrastOnBtn");

    if (triggerBtn) {
        triggerBtn.addEventListener("click", () => openAccessibilityModal());
    }

    if (closeBtn) {
        closeBtn.addEventListener("click", () => closeAccessibilityModal());
    }

    if (modalOverlay) {
        modalOverlay.addEventListener("click", (e) => {
            if (e.target === modalOverlay) closeAccessibilityModal();
        });
        modalOverlay.addEventListener("keydown", (e) => {
            if (e.key === "Escape") {
                e.stopPropagation();
                closeAccessibilityModal();
            }
        });
    }

    if (stdBtn) {
        stdBtn.addEventListener("click", () => {
            activeVisualPrefs.textScale = "standard";
            saveVisualPrefs(activeVisualPrefs);
            applyVisualPrefs(activeVisualPrefs);
        });
    }

    if (lrgBtn) {
        lrgBtn.addEventListener("click", () => {
            activeVisualPrefs.textScale = "large";
            saveVisualPrefs(activeVisualPrefs);
            applyVisualPrefs(activeVisualPrefs);
        });
    }

    if (xlBtn) {
        xlBtn.addEventListener("click", () => {
            activeVisualPrefs.textScale = "extra-large";
            saveVisualPrefs(activeVisualPrefs);
            applyVisualPrefs(activeVisualPrefs);
        });
    }

    if (offBtn) {
        offBtn.addEventListener("click", () => {
            activeVisualPrefs.highContrast = false;
            saveVisualPrefs(activeVisualPrefs);
            applyVisualPrefs(activeVisualPrefs);
        });
    }

    if (onBtn) {
        onBtn.addEventListener("click", () => {
            activeVisualPrefs.highContrast = true;
            saveVisualPrefs(activeVisualPrefs);
            applyVisualPrefs(activeVisualPrefs);
        });
    }

    if (resetBtn) {
        resetBtn.addEventListener("click", () => {
            activeVisualPrefs = { ...DEFAULT_VISUAL_PREFS };
            saveVisualPrefs(activeVisualPrefs);
            applyVisualPrefs(activeVisualPrefs);
            if (typeof showFeedbackMessage === "function") {
                showFeedbackMessage("info", t("resetDisplaySettings") || "Reset to Standard");
            }
        });
    }

    if (saveBtn) {
        saveBtn.addEventListener("click", () => {
            saveVisualPrefs(activeVisualPrefs);
            applyVisualPrefs(activeVisualPrefs);
            closeAccessibilityModal();
            if (typeof showFeedbackMessage === "function") {
                showFeedbackMessage("success", t("displaySettingsSaved") || "Display settings updated.");
            }
        });
    }
}

if (typeof window !== "undefined") {
    window.getStoredVisualPrefs = getStoredVisualPrefs;
    window.saveVisualPrefs = saveVisualPrefs;
    window.applyVisualPrefs = applyVisualPrefs;
    window.openAccessibilityModal = openAccessibilityModal;
    window.closeAccessibilityModal = closeAccessibilityModal;
    window.initAccessibilitySettings = initAccessibilitySettings;
}

initAccessibilitySettings();
