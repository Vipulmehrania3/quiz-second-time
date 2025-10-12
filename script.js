document.addEventListener('DOMContentLoaded', () => {
    const subjectSelect = document.getElementById('subject-select');
    const chapterSelect = document.getElementById('chapter-select');
    const questionLimitInput = document.getElementById('question-limit');
    const startQuizBtn = document.getElementById('start-quiz-btn');
    const quizSetupDiv = document.getElementById('quiz-setup');
    const quizAreaDiv = document.getElementById('quiz-area');
    const resultAreaDiv = document.getElementById('result-area');
    const currentQuestionNumber = document.getElementById('current-question-number');
    const questionText = document.getElementById('question-text');
    const optionsContainer = document.getElementById('options-container');
    const nextQuestionBtn = document.getElementById('next-question-btn');
    const submitQuizBtn = document.getElementById('submit-quiz-btn');
    const scoreDisplay = document.getElementById('score-display');
    const detailedResultsDiv = document.getElementById('detailed-results');
    const restartQuizBtn = document.getElementById('restart-quiz-btn');
    const toggleHindiBtn = document.getElementById('toggle-hindi-btn'); // New button

    let currentQuiz = [];
    let currentQuestionIndex = 0;
    let userAnswers = [];
    let questionStartTime;

    // Load language preference from local storage or default to English
    let currentLanguage = localStorage.getItem('quizLanguage') || 'english';
    updateLanguageDisplay(); // Update button text and body class on load

    // Chapters in English (we'll assume the backend handles translation)
    const chaptersEnglish = {
        botany: ["Plant Kingdom", "Photosynthesis", "Cell Cycle", "Mineral Nutrition", "Reproduction in Flowering Plants"],
        zoology: ["Animal Kingdom", "Human Physiology", "Genetics and Evolution", "Human Reproduction", "Digestion and Absorption"],
        physics: ["Mechanics", "Electromagnetism", "Optics", "Modern Physics", "Thermodynamics"],
        chemistry: ["Organic Chemistry", "Inorganic Chemistry", "Physical Chemistry", "Atomic Structure", "Chemical Bonding"]
    };

    // Chapters in Hindi (for UI display, backend still translates dynamic content)
    const chaptersHindi = {
        botany: ["पादप जगत", "प्रकाश संश्लेषण", "कोशिका चक्र", "खनिज पोषण", "पुष्पी पादपों में लैंगिक जनन"],
        zoology: ["जंतु जगत", "मानव शरीर क्रिया विज्ञान", "आनुवंशिकी और विकास", "मानव प्रजनन", "पाचन और अवशोषण"],
        physics: ["यांत्रिकी", "विद्युत चुम्बकत्व", "प्रकाशिकी", "आधुनिक भौतिकी", "ऊष्मप्रवैगिकी"],
        chemistry: ["कार्बनिक रसायन", "अकार्बनिक रसायन", "भौतिक रसायन", "परमाणु संरचना", "रासायनिक बंधन"]
    };

    // --- Language Toggle Logic ---
    toggleHindiBtn.addEventListener('click', () => {
        currentLanguage = (currentLanguage === 'english') ? 'hindi' : 'english';
        localStorage.setItem('quizLanguage', currentLanguage); // Save preference
        updateLanguageDisplay();
        populateChapterSelect(); // Repopulate chapters based on new language
    });

    function updateLanguageDisplay() {
        if (currentLanguage === 'hindi') {
            document.body.classList.add('hindi-medium');
            toggleHindiBtn.textContent = 'Switch to English Medium';
            // Update other static text if necessary (like labels, headings)
            document.querySelector('h1').textContent = 'वीआईपीक्विज़'; // Site Name in Hindi
            document.title = 'वीआईपीक्विज़'; // Title in Hindi
            document.querySelector('label[for="subject-select"]').textContent = 'विषय चुनें:';
            document.querySelector('label[for="chapter-select"]').textContent = 'अध्याय चुनें:';
            document.querySelector('label[for="question-limit"]').textContent = 'प्रश्नों की संख्या:';
            startQuizBtn.textContent = 'क्विज़ प्रारंभ करें';
            nextQuestionBtn.textContent = 'अगला प्रश्न';
            submitQuizBtn.textContent = 'क्विज़ जमा करें';
            restartQuizBtn.textContent = 'नया क्विज़ शुरू करें';
            document.querySelector('p[style*="font-size: 0.9em;"]').textContent = 'नोट: Google AI API कुंजी को बैकएंड सर्वर द्वारा सुरक्षित रूप से संभाला जाता है। सुनिश्चित करें कि आपका बैकएंड (`app.py`) चल रहा है!';
        } else {
            document.body.classList.remove('hindi-medium');
            toggleHindiBtn.textContent = 'Switch to Hindi Medium';
            // Revert other static text
            document.querySelector('h1').textContent = 'VIPQuizs';
            document.title = 'VIPQuizs';
            document.querySelector('label[for="subject-select"]').textContent = 'Select Subject:';
            document.querySelector('label[for="chapter-select"]').textContent = 'Select Chapter:';
            document.querySelector('label[for="question-limit"]').textContent = 'Number of Questions:';
            startQuizBtn.textContent = 'Start Quiz';
            nextQuestionBtn.textContent = 'Next Question';
            submitQuizBtn.textContent = 'Submit Quiz';
            restartQuizBtn.textContent = 'Start New Quiz';
            document.querySelector('p[style*="font-size: 0.9em;"]').textContent = 'Note: Google AI API Key is handled securely by the backend server. Ensure your backend (`app.py`) is running!';

        }
        // Force re-evaluation of start button state for language context
        updateStartButtonState();
    }


    function populateChapterSelect() {
        const selectedSubject = subjectSelect.value;
        chapterSelect.innerHTML = '<option value="">-- Select Chapter --</option>'; // Clear previous chapters
        chapterSelect.disabled = true;

        const currentChaptersList = (currentLanguage === 'hindi') ? chaptersHindi : chaptersEnglish;

        if (selectedSubject && currentChaptersList[selectedSubject]) {
            currentChaptersList[selectedSubject].forEach(chapter => {
                const option = document.createElement('option');
                option.value = chapter; // Value is always in English for backend processing
                option.textContent = chapter; // Text displayed can be Hindi
                chapterSelect.appendChild(option);
            });
            chapterSelect.disabled = false;
        }
        updateStartButtonState();
    }

    subjectSelect.addEventListener('change', populateChapterSelect); // Use new populate function
    chapterSelect.addEventListener('change', updateStartButtonState);


    // --- Enable/Disable Start Quiz Button ---
    function updateStartButtonState() {
        const isSubjectSelected = subjectSelect.value !== '';
        const isChapterSelected = chapterSelect.value !== '';
        startQuizBtn.disabled = !(isSubjectSelected && isChapterSelected);

        if (currentLanguage === 'hindi') {
            startQuizBtn.textContent = startQuizBtn.disabled ? 'क्विज़ प्रारंभ करें' : 'क्विज़ प्रारंभ करें';
        } else {
            startQuizBtn.textContent = startQuizBtn.disabled ? 'Start Quiz' : 'Start Quiz';
        }
    }


    startQuizBtn.addEventListener('click', async () => {
        const selectedSubject = subjectSelect.value;
        const selectedChapter = chapterSelect.value; // Value is English for backend
        const questionLimit = parseInt(questionLimitInput.value);

        if (!selectedSubject || !selectedChapter || isNaN(questionLimit) || questionLimit < 1) {
            alert("Please select subject, chapter, and a valid number of questions."); // English alert
            if (currentLanguage === 'hindi') {
                alert("कृपया विषय, अध्याय और प्रश्नों की एक वैध संख्या का चयन करें।"); // Hindi alert
            }
            return;
        }

        startQuizBtn.textContent = (currentLanguage === 'hindi') ? 'क्विज़ बन रहा है...' : 'Generating Quiz...';
        startQuizBtn.disabled = true;

        try {
            const response = await fetch('http://localhost:5000/generate_quiz', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    subject: selectedSubject,
                    chapter: selectedChapter,
                    limit: questionLimit,
                    language: currentLanguage // Pass language preference to backend
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `HTTP error! Status: ${response.status}`);
            }

            const data = await response.json();
            currentQuiz = data.questions;

            if (currentQuiz.length === 0) {
                throw new Error("Empty quiz generated.");
            }

            currentQuestionIndex = 0;
            userAnswers = [];

            quizSetupDiv.style.display = 'none';
            quizAreaDiv.style.display = 'block';
            displayQuestion(currentQuestionIndex);

        } catch (error) {
            console.error("Error generating quiz:", error);
            const errorMessage = (currentLanguage === 'hindi')
                ? `क्विज़ उत्पन्न करने में विफल: ${error.message}। कृपया सुनिश्चित करें कि बैकएंड सर्वर चल रहा है और उसके कंसोल में त्रुटियों की जाँच करें।`
                : `Failed to generate quiz: ${error.message}. Please ensure the backend server is running and check its console for errors.`;
            alert(errorMessage);
            startQuizBtn.textContent = (currentLanguage === 'hindi') ? 'क्विज़ प्रारंभ करें' : 'Start Quiz';
            startQuizBtn.disabled = false;
            updateStartButtonState();
        }
    });

    function displayQuestion(index) {
        if (index >= currentQuiz.length) {
            submitQuiz();
            return;
        }

        const question = currentQuiz[index];
        currentQuestionNumber.textContent = `${(currentLanguage === 'hindi' ? 'प्रश्न' : 'Question')} ${index + 1} ${(currentLanguage === 'hindi' ? 'में से' : 'of')} ${currentQuiz.length}`;
        questionText.innerHTML = question.question;
        optionsContainer.innerHTML = '';

        const shuffledOptions = [...question.options].sort(() => Math.random() - 0.5);

        shuffledOptions.forEach((option, i) => {
            const label = document.createElement('label');
            const radio = document.createElement('input');
            radio.type = 'radio';
            radio.name = 'question-option';
            radio.value = option;
            label.appendChild(radio);
            label.appendChild(document.createTextNode(option));
            optionsContainer.appendChild(label);
        });

        if (index === currentQuiz.length - 1) {
            nextQuestionBtn.style.display = 'none';
            submitQuizBtn.style.display = 'block';
        } else {
            nextQuestionBtn.style.display = 'block';
            submitQuizBtn.style.display = 'none';
        }

        questionStartTime = Date.now();
    }

    function recordAnswer() {
        const selectedOption = document.querySelector('input[name="question-option"]:checked');
        const timeTaken = Date.now() - questionStartTime;

        userAnswers.push({
            questionId: currentQuiz[currentQuestionIndex].id,
            questionText: currentQuiz[currentQuestionIndex].question,
            selectedAnswer: selectedOption ? selectedOption.value : null,
            correctAnswer: currentQuiz[currentQuestionIndex].correctAnswer,
            timeTaken: timeTaken,
            solution: currentQuiz[currentQuestionIndex].solution
        });
    }

    nextQuestionBtn.addEventListener('click', () => {
        const alertMessage = (currentLanguage === 'hindi')
            ? 'अगले प्रश्न पर जाने से पहले कृपया एक विकल्प चुनें।'
            : 'Please select an option before moving to the next question.';
        if (!document.querySelector('input[name="question-option"]:checked')) {
            alert(alertMessage);
            return;
        }
        recordAnswer();
        currentQuestionIndex++;
        displayQuestion(currentQuestionIndex);
    });

    submitQuizBtn.addEventListener('click', () => {
        const alertMessage = (currentLanguage === 'hindi')
            ? 'क्विज़ जमा करने से पहले कृपया एक विकल्प चुनें।'
            : 'Please select an option before submitting the quiz.';
        if (!document.querySelector('input[name="question-option"]:checked')) {
            alert(alertMessage);
            return;
        }
        recordAnswer();
        submitQuiz();
    });

    async function submitQuiz() {
        quizAreaDiv.style.display = 'none';
        resultAreaDiv.style.display = 'block';

        scoreDisplay.textContent = (currentLanguage === 'hindi') ? 'परिणामों का विश्लेषण किया जा रहा है...' : 'Analyzing results...';
        detailedResultsDiv.innerHTML = (currentLanguage === 'hindi') ? 'AI के साथ परिणामों का विश्लेषण किया जा रहा है...' : 'Analyzing results with AI...';

        try {
            const analysisResponse = await fetch('http://localhost:5000/analyze_results', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    quiz: currentQuiz,
                    userAnswers: userAnswers,
                    language: currentLanguage // Pass language preference for analysis
                })
            });

            if (!analysisResponse.ok) {
                throw new Error(`HTTP error! Status: ${analysisResponse.status}`);
            }

            const analysisData = await analysisResponse.json();
            detailedResultsDiv.innerHTML = '';

            let score = 0;
            userAnswers.forEach((answer, index) => {
                const isCorrect = answer.selectedAnswer === answer.correctAnswer;
                if (isCorrect) {
                    score++;
                }

                const resultItem = document.createElement('div');
                resultItem.classList.add('result-item');
                resultItem.innerHTML = `
                    <h4>${(currentLanguage === 'hindi' ? 'प्रश्न' : 'Question')} ${index + 1}: ${answer.questionText}</h4>
                    <p>${(currentLanguage === 'hindi' ? 'आपका उत्तर' : 'Your Answer')}: <span class="${isCorrect ? 'correct-answer' : 'wrong-answer'}">${answer.selectedAnswer || (currentLanguage === 'hindi' ? 'उत्तर नहीं दिया' : 'Not Answered')}</span></p>
                    <p>${(currentLanguage === 'hindi' ? 'सही उत्तर' : 'Correct Answer')}: <span class="correct-answer">${answer.correctAnswer}</span></p>
                    ${!isCorrect ? `<p><strong>${(currentLanguage === 'hindi' ? 'AI समाधान' : 'AI Solution')}:</strong> ${answer.solution || (currentLanguage === 'hindi' ? 'समाधान उपलब्ध नहीं है।' : 'Solution not available.')}</p>` : ''}
                    <p>${(currentLanguage === 'hindi' ? 'लिया गया समय' : 'Time Taken')}: ${(answer.timeTaken / 1000).toFixed(1)} ${(currentLanguage === 'hindi' ? 'सेकंड' : 'seconds')}</p>
                `;
                detailedResultsDiv.appendChild(resultItem);
            });

            scoreDisplay.textContent = `${(currentLanguage === 'hindi' ? 'आपने' : 'You scored')} ${score} ${(currentLanguage === 'hindi' ? 'में से' : 'out of')} ${currentQuiz.length}${(currentLanguage === 'hindi' ? ' प्रश्न सही किए!' : ' questions correctly!')}`;


            if (analysisData.overallFeedback) {
                const feedbackDiv = document.createElement('div');
                feedbackDiv.classList.add('result-item');
                feedbackDiv.innerHTML = `<h3>${(currentLanguage === 'hindi' ? 'समग्र AI प्रतिक्रिया' : 'Overall AI Feedback')}:</h3><p>${analysisData.overallFeedback}</p>`;
                detailedResultsDiv.prepend(feedbackDiv);
            }

        } catch (error) {
            console.error("Error fetching detailed analysis:", error);
            detailedResultsDiv.innerHTML = `<p style="color: red;">${(currentLanguage === 'hindi' ? 'विस्तृत AI विश्लेषण प्राप्त करने में विफल। मूल परिणाम प्रदर्शित किए जा रहे हैं।' : 'Failed to get detailed AI analysis. Displaying basic results.')}</p>`;

            let score = 0; // Recalculate score for fallback
            userAnswers.forEach((answer, index) => {
                const isCorrect = answer.selectedAnswer === answer.correctAnswer;
                if (isCorrect) score++;

                const resultItem = document.createElement('div');
                resultItem.classList.add('result-item');
                resultItem.innerHTML = `
                    <h4>${(currentLanguage === 'hindi' ? 'प्रश्न' : 'Question')} ${index + 1}: ${answer.questionText}</h4>
                    <p>${(currentLanguage === 'hindi' ? 'आपका उत्तर' : 'Your Answer')}: <span class="${isCorrect ? 'correct-answer' : 'wrong-answer'}">${answer.selectedAnswer || (currentLanguage === 'hindi' ? 'उत्तर नहीं दिया' : 'Not Answered')}</span></p>
                    <p>${(currentLanguage === 'hindi' ? 'सही उत्तर' : 'Correct Answer')}: <span class="correct-answer">${answer.correctAnswer}</span></p>
                    <p>${(currentLanguage === 'hindi' ? 'लिया गया समय' : 'Time Taken')}: ${(answer.timeTaken / 1000).toFixed(1)} ${(currentLanguage === 'hindi' ? 'सेकंड' : 'seconds')}</p>
                `;
                detailedResultsDiv.appendChild(resultItem);
            });
            scoreDisplay.textContent = `${(currentLanguage === 'hindi' ? 'आपने' : 'You scored')} ${score} ${(currentLanguage === 'hindi' ? 'में से' : 'out of')} ${currentQuiz.length}${(currentLanguage === 'hindi' ? ' प्रश्न सही किए!' : ' questions correctly!')}`;
        }

        startQuizBtn.textContent = (currentLanguage === 'hindi') ? 'क्विज़ प्रारंभ करें' : 'Start Quiz';
        updateStartButtonState();
    }

    restartQuizBtn.addEventListener('click', () => {
        resultAreaDiv.style.display = 'none';
        quizSetupDiv.style.display = 'block';
        subjectSelect.value = '';
        chapterSelect.innerHTML = '<option value="">-- Select Chapter --</option>';
        chapterSelect.disabled = true;
        questionLimitInput.value = 10;
        updateStartButtonState();
        updateLanguageDisplay(); // Ensure language display is correct on restart
    });

    // Initial state setup
    populateChapterSelect(); // Populate chapters on initial load based on default language
    updateStartButtonState();
});