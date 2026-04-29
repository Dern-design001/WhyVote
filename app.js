const apiKey = "";
const MODEL_NAME = "gemini-2.5-flash-preview-09-2025";
let currentLang = 'english';
let chatHistory = [];
let isTyping = false;

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();

// Auth State Listener
auth.onAuthStateChanged(user => {
    const authSection = document.getElementById('auth-section');
    const langSection = document.getElementById('language-section');
    const loginMsg = document.getElementById('login-status-msg');
    const logoutBtn = document.getElementById('logout-btn');

    if (user) {
        authSection.classList.add('hidden');
        langSection.classList.remove('hidden');
        loginMsg.innerText = `Welcome, ${user.displayName.split(' ')[0]}! Select a language.`;
        logoutBtn.classList.remove('hidden');
    } else {
        authSection.classList.remove('hidden');
        langSection.classList.add('hidden');
        loginMsg.innerText = "Secure login to access personalized election info";
        logoutBtn.classList.add('hidden');
        document.getElementById('login-overlay').style.display = 'flex';
    }
});

function signInWithGoogle() {
    const provider = new firebase.auth.GoogleAuthProvider();
    auth.signInWithPopup(provider).catch(error => {
        console.error("Auth Error:", error);
    });
}

function signOutUser() {
    auth.signOut();
}

function skipLogin() {
    document.getElementById('auth-section').classList.add('hidden');
    document.getElementById('language-section').classList.remove('hidden');
    document.getElementById('login-status-msg').innerText = "Browsing as Guest. Select a language.";
}

const commonQuestions = [
"How do I register as a new voter in India?","What is Form 6 and when is it used?","How to track my Voter ID application status?","What is the deadline for registration before an election?","How to fill Form 8 for correction of details?","What is Form 7 and who should fill it?","What is an EPIC number and where can I find it?","I lost my Voter ID card. How do I get a duplicate one?","How can I download my e-EPIC (digital voter card)?","Can I have more than one Voter ID card?","What IDs are valid for voting if I don't have a physical Voter ID?","Can I use my Aadhaar card as ID to vote?","What is the minimum age to be eligible to vote?","Can NRIs (Non-Resident Indians) vote?","Can a non-citizen of India vote?","How do I find my assigned polling booth?","What are the standard voting hours on polling day?","What is the process inside the polling station?","What is the 'Indelible Ink' and why is it used?","What is an EVM and how does it work?","What is VVPAT and how does it verify my vote?","How do I confirm my vote went to the right candidate on the EVM?","What happens if the EVM malfunctions during voting?","What is NOTA (None Of The Above)?","How can government employees on election duty vote?","What is a 'Tendered Vote'?","What is a 'Challenged Vote'?","Is there a facility for senior citizens to vote from home?","How are the votes counted and results declared?","Where can I find real-time results on counting day?"
];

const translations = {
english: {
heroTitle: "Every Vote <span class='text-[#FF9933]'>Counts.</span>",
heroDesc: "Understanding the world's largest democratic exercise. Follow our roadmap or chat with our assistant for ECI guidelines.",
roadmapTitle: "The Indian Election Journey",
phases: ["Registration","Know Candidate","Schedule","Polling Day","Results"],
assistantName: "Civic Assistant India",
assistantStatus: "Online & Verified",
faqLabel: "30 Common Questions (ECI Guidelines)",
inputPlaceholder: "Ask about EVMs, Voter IDs, or registration...",
botGreeting: "Namaste! I'm your Indian Election Assistant. How can I help you today?",
helplineBtn: "Helpline 1950",
helpModal: {title:"Election Helpline",subtitle:"Official ECI Contact Information",natTitle:"National Voter Helpline",natDesc:"Toll-free. Established by the Election Commission of India (ECI) for queries, registration status, and grievances.",natTip:"<strong>Tip:</strong> If calling from a mobile, prefix with your state capital STD code (e.g., <strong>044-1950</strong> for Tamil Nadu).",contactTitle:"Contact Centre",contactDesc:"Daily 8:00 AM - 8:00 PM Multi-language support",localTitle:"Local Support (Chennai)",localDesc:"District Election Control Room Toll-Free",digitalTitle:"Digital Self-Service",voterApp:"Voter Helpline App",footer:"Ready for 2026 Tamil Nadu Legislative Assembly Election"},
faqLabels: commonQuestions
}
};

function toggleSupport() {
    const modal = document.getElementById('support-modal');
    modal.style.display = modal.style.display === 'flex' ? 'none' : 'flex';
}

function selectLanguage(lang) {
    currentLang = lang;
    document.getElementById('login-overlay').style.display = 'none';
    applyLanguage();
    if (chatHistory.length === 0) {
        addBotMessage(translations[lang].botGreeting);
    }
}

function applyLanguage() {
    const t = translations[currentLang];
    const hm = t.helpModal;
    document.getElementById('hero-title').innerHTML = t.heroTitle;
    document.getElementById('hero-desc').innerText = t.heroDesc;
    document.getElementById('roadmap-title').innerText = t.roadmapTitle;
    document.getElementById('assistant-name').innerText = t.assistantName;
    document.getElementById('assistant-status').innerText = t.assistantStatus;
    document.getElementById('faq-label').innerText = t.faqLabel;
    document.getElementById('ai-input').placeholder = t.inputPlaceholder;
    document.getElementById('nav-helpline-btn').innerText = t.helplineBtn;
    document.getElementById('support-modal-title').innerText = hm.title;
    document.getElementById('support-modal-subtitle').innerText = hm.subtitle;
    document.getElementById('nat-helpline-title').innerHTML = '<i data-lucide="phone" class="w-4 h-4"></i> ' + hm.natTitle;
    document.getElementById('nat-helpline-desc').innerText = hm.natDesc;
    document.getElementById('nat-helpline-tip').innerHTML = hm.natTip;
    document.getElementById('contact-centre-title').innerText = hm.contactTitle;
    document.getElementById('contact-centre-desc').innerText = hm.contactDesc;
    document.getElementById('local-support-title').innerText = hm.localTitle;
    document.getElementById('local-support-desc').innerText = hm.localDesc;
    document.getElementById('digital-service-title').innerText = hm.digitalTitle;
    document.getElementById('voter-app-label').innerText = hm.voterApp;
    document.getElementById('support-footer').innerText = hm.footer;

    const grid = document.getElementById('roadmap-grid');
    const icons = ['user-plus','search','calendar','fingerprint','flag'];
    grid.innerHTML = t.phases.map((name, i) => {
        const question = commonQuestions[i * 6].replace(/'/g, "\\'");
        return '<div onclick="sendMessage(\'' + question + '\')" class="roadmap-card p-6 rounded-[2rem] text-center flex flex-col items-center cursor-pointer"><div class="w-12 h-12 bg-orange-50 text-orange-600 rounded-2xl flex items-center justify-center mb-4"><i data-lucide="' + icons[i] + '" class="w-6 h-6"></i></div><span class="text-[10px] font-bold text-slate-400 uppercase mb-1">Phase ' + (i+1) + '</span><h3 class="text-sm font-bold">' + name + '</h3></div>';
    }).join('');

    const faqSelect = document.getElementById('faq-select');
    faqSelect.innerHTML = '<option value="">Select a question...</option>' + t.faqLabels.map((label, i) => '<option value="' + commonQuestions[i] + '">' + label + '</option>').join('');
    lucide.createIcons();
}

async function callGemini(prompt) {
    if (!apiKey) throw new Error("API_KEY_MISSING");
    const url = 'https://generativelanguage.googleapis.com/v1beta/models/' + MODEL_NAME + ':generateContent?key=' + apiKey;
    const systemInst = 'You are WhyVote India. Answer in ' + currentLang.toUpperCase() + '. Break down Indian voting (Form 6, EPIC, EVM/VVPAT, ECI) clearly. Verify on voters.eci.gov.in. Use emojis. If user asks about contact, mention Helpline 1950.';
    chatHistory.push({ role: "user", parts: [{ text: prompt }] });
    try {
        const response = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ contents: chatHistory, systemInstruction: { parts: [{ text: systemInst }] } }) });
        const result = await response.json();
        if (result.error) throw new Error(result.error.message);
        const aiText = result.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!aiText) throw new Error("NO_RESPONSE_FROM_AI");
        chatHistory.push({ role: "model", parts: [{ text: aiText }] });
        return aiText;
    } catch (e) { 
        console.error("Gemini Error:", e);
        throw e;
    }
}

function askFaq() {
    const val = document.getElementById('faq-select').value;
    if (val) { sendMessage(val); document.getElementById('faq-select').value = ""; }
}

function addBotMessage(text) {
    const c = document.getElementById('chat-messages');
    const m = document.createElement('div');
    m.className = "flex animate-slide-up";
    m.innerHTML = '<div class="max-w-[85%] bg-white border border-slate-100 p-4 rounded-2xl chat-bubble-bot shadow-sm text-sm leading-relaxed text-slate-700">' + text.replace(/\n/g, '<br>') + '</div>';
    c.appendChild(m); c.scrollTop = c.scrollHeight;
}

function addUserMessage(text) {
    const c = document.getElementById('chat-messages');
    const m = document.createElement('div');
    m.className = "flex justify-end animate-slide-up";
    m.innerHTML = '<div class="max-w-[85%] bg-orange-600 p-4 rounded-2xl chat-bubble-user text-white text-sm shadow-lg shadow-orange-100">' + text + '</div>';
    c.appendChild(m); c.scrollTop = c.scrollHeight;
}

async function sendMessage(overrideText) {
    overrideText = overrideText || null;
    const input = document.getElementById('ai-input');
    const text = overrideText || input.value.trim();
    if (!text || isTyping) return;
    if (!overrideText) input.value = "";
    addUserMessage(text);
    isTyping = true;

    // Multi-language Local Answer Lookup
    let localAns = null;
    if (window.FAQ_ANSWERS && FAQ_ANSWERS[currentLang] && FAQ_ANSWERS[currentLang][text]) {
        localAns = FAQ_ANSWERS[currentLang][text];
    } else {
        const engIdx = commonQuestions.indexOf(text);
        if (engIdx !== -1) {
            const transQ = translations[currentLang]?.faqLabels?.[engIdx];
            if (transQ) {
                localAns = FAQ_ANSWERS[currentLang][transQ] || FAQ_ANSWERS.english[text];
            } else {
                localAns = FAQ_ANSWERS.english[text];
            }
        }
    }

    if (localAns) {
        setTimeout(() => {
            addBotMessage(localAns);
            isTyping = false;
        }, 500);
        return;
    }

    try { 
        const resp = await callGemini(text); 
        addBotMessage(resp); 
    } catch (e) { 
        let errorMsg = "I'm currently in guest mode. For AI-powered answers, please ensure the API key is configured. In the meantime, you can select questions from the FAQ dropdown! 🇮🇳";
        if (e.message !== "API_KEY_MISSING") {
            errorMsg = "I'm having trouble connecting to the AI. Please try again or use the FAQ dropdown below! 🌐";
        }
        addBotMessage(errorMsg); 
    } finally { 
        isTyping = false; 
    }
}

document.getElementById('ai-input').addEventListener('keypress', function(e) { if (e.key === 'Enter') sendMessage(); });
lucide.createIcons();