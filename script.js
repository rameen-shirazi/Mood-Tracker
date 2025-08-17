import { initializeApp } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";
import { getDatabase, ref, push, onValue, query, orderByChild, remove } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyCnl5_JV6hIxNjWEN9pGunKFernCyaMsbE",
  authDomain: "mood-tracker-a2d48.firebaseapp.com",
  databaseURL: "https://mood-tracker-a2d48-default-rtdb.firebaseio.com",
  projectId: "mood-tracker-a2d48",
  storageBucket: "mood-tracker-a2d48.appspot.com",
  messagingSenderId: "685350610688",
  appId: "1:685350610688:web:e65601437a310cd7fb35e5"
};
// initializing
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

// quotes
const moodQuotes = {
    happy: [
        { text: "Happiness comes from your own actions.", author: "Dalai Lama" },
        { text: "Make the best of everything.", author: "Unknown" },
        { text: "Be happy with what you have.", author: "Helen Keller" }
    ],
    sad: [
        { text: "Every storm runs out of rain.", author: "Gary Allan" },
        { text: "Protect yourself from sadness to protect happiness.", author: "Jonathan Safran Foer" },
        { text: "Sadness flies away on the wings of time.", author: "Jean de La Fontaine" }
    ],
    angry: [
        { text: "For every minute angry, you lose 60 seconds of peace.", author: "Ralph Waldo Emerson" },
        { text: "Anger is an acid...", author: "Mark Twain" },
        { text: "Speak when angry and regret later.", author: "Ambrose Bierce" }
    ],
    anxious: [
        { text: "Stop letting thoughts control you.", author: "Dan Millman" },
        { text: "Worry empties today of strength.", author: "Corrie ten Boom" },
        { text: "Anxiety empties today of strength.", author: "Charles Spurgeon" }
    ],
    excited: [
        { text: "Enthusiasm is the electricity of life.", author: "Gordon Parks" },
        { text: "Nothing great without enthusiasm.", author: "Ralph Waldo Emerson" },
        { text: "Excitement is a practical synonym for happiness.", author: "Tim Ferriss" }
    ]
};

// DOM elements
const moodElements = document.querySelectorAll('.mood');
const quoteText = document.getElementById('quote-text');
const quoteAuthor = document.getElementById('quote-author');
const moodHistory = document.getElementById('mood-history');
const prevBtn = document.getElementById('prev-mood');
const nextBtn = document.getElementById('next-mood');
const loadingState = document.createElement('div');
loadingState.className = 'loading-state';
loadingState.textContent = 'Loading...';
document.querySelector('.history').prepend(loadingState);

//state
let moods = [];
let currentIndex = -1;

updateNavButtons();

// mood select
moodElements.forEach(el => {
    el.addEventListener('click', () => {
        const mood = el.dataset.mood;
        const selectedQuote = getRandomQuote(mood);
        saveMood(mood, selectedQuote);
        showQuote(selectedQuote);
    });
});

// save to firebase
function saveMood(mood, quote) {
    const now = new Date();
    push(ref(database, 'moods'), {
        mood: mood,
        date: now.toLocaleString(),
        timestamp: Date.now(),
        quoteText: quote.text,
        quoteAuthor: quote.author
    });
}

// quote display
function showQuote(quote) {
    quoteText.textContent = quote.text;
    quoteAuthor.textContent = quote.author;
}

// random quote picker
function getRandomQuote(mood) {
    const quotes = moodQuotes[mood];
    return quotes[Math.floor(Math.random() * quotes.length)];
}

// load mood history
function loadMoodHistory() {
    loadingState.style.display = 'block';
    
    const moodsQuery = query(ref(database, 'moods'), orderByChild('timestamp'));
    
    onValue(moodsQuery, (snapshot) => {
        loadingState.style.display = 'none';
        moods = [];
        // reverse chronological order
        snapshot.forEach(child => {
            moods.unshift({ 
                id: child.key,
                ...child.val()
            });
        });
        // show latest mood
        if (moods.length > 0) {
            currentIndex = 0; 
            showCurrentMood();
        } else {
            quoteText.textContent = "Select your mood to see a motivational quote";
            quoteAuthor.textContent = "";
            currentIndex = -1;
        }
        
        renderHistory();
        updateNavButtons();
    });
}

// current mood with its exact quote
function showCurrentMood() {
    if (currentIndex >= 0 && currentIndex < moods.length) {
        const moodData = moods[currentIndex];
        showQuote({ text: moodData.quoteText, author: moodData.quoteAuthor });
        highlightCurrentEntry();
    }
}

// history list
function renderHistory() {
    moodHistory.innerHTML = '';
    
    if (moods.length === 0) {
        moodHistory.innerHTML = '<div class="empty">No mood history yet</div>';
        return;
    }
    
    moods.forEach((mood, index) => {
        const entry = document.createElement('div');
        entry.className = `mood-entry ${index === currentIndex ? 'current' : ''}`;
        entry.innerHTML = `
            <div class="emoji">${getEmoji(mood.mood)}</div>
            <div class="mood-name">${capitalize(mood.mood)}</div>
            <div class="date">${mood.date}</div>
            <button class="delete-btn">🗑️</button>
        `;
        
        entry.addEventListener('click', () => {
            currentIndex = index;
            showCurrentMood();
            updateNavButtons();
        });
        
        // to delete mood
        const deleteBtn = entry.querySelector('.delete-btn');
        deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            deleteMood(mood.id);
        });
        
        moodHistory.appendChild(entry);
    });
}

// previous and next mood
prevBtn.addEventListener('click', () => {
    if (currentIndex < moods.length - 1) { 
        currentIndex++;
        showCurrentMood();
        updateNavButtons();
    }
});

nextBtn.addEventListener('click', () => {
    if (currentIndex > 0) { 
        currentIndex--;
        showCurrentMood();
        updateNavButtons();
    }
});

function updateNavButtons() {
    prevBtn.disabled = currentIndex >= moods.length - 1 || currentIndex === -1;
    nextBtn.disabled = currentIndex <= 0 || currentIndex === -1;
}

function highlightCurrentEntry() {
    document.querySelectorAll('.mood-entry').forEach((entry, index) => {
        entry.classList.toggle('current', index === currentIndex);
    });
}

function deleteMood(id) {
    const moodRef = ref(database, `moods/${id}`);
    remove(moodRef)
        .then(() => {
            console.log("Mood deleted successfully");
            if (currentIndex >= moods.length - 1) currentIndex = moods.length - 2;
            if (moods.length === 1) currentIndex = -1; // no moods left
        })
        .catch((err) => {
            console.error("Error deleting mood:", err);
        });
}

function getEmoji(mood) {
    const emojis = {
        happy: '😊',
        sad: '😢',
        angry: '😠',
        anxious: '😰',
        excited: '🤩'
    };
    return emojis[mood] || '😐';
}

function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

loadMoodHistory();
