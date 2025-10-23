document.addEventListener('DOMContentLoaded', () => {
    // --- IMPORTANT: CONFIGURE YOUR BACKEND URL HERE ---
    const backendUrl = "https://quiz-second-time.onrender.com"; // Replace with your actual Render URL

    // --- ELEMENT SELECTORS ---
    const screens = document.querySelectorAll('.app-screen');
    const quizSetupScreen = document.getElementById('quiz-setup');
    const quizAreaScreen = document.getElementById('quiz-area');
    const resultAreaScreen = document.getElementById('result-area');
    const loader = document.getElementById('loader');
    
    const subjectSelect = document.getElementById('subject-select');
    const chapterSelect = document.getElementById('chapter-select');
    const questionLimitInput = document.getElementById('question-limit');
    const stylePromptInput = document.getElementById('style-prompt');
    const startQuizBtn = document.getElementById('start-quiz-btn');
    const toggleHindiBtn = document.getElementById('toggle-hindi-btn');

    const quizTitle = document.getElementById('quiz-title');
    const currentQuestionNumber = document.getElementById('current-question-number');
    const questionText = document.getElementById('question-text');
    const optionsContainer = document.getElementById('options-container');
    const nextQuestionBtn = document.getElementById('next-question-btn');
    const submitQuizBtn = document.getElementById('submit-quiz-btn');

    const scoreDisplay = document.getElementById('score-display');
    const scoreSummary = document.getElementById('score-summary');
    const detailedResultsDiv = document.getElementById('detailed-results');
    const restartQuizBtn = document.getElementById('restart-quiz-btn');

    // --- STATE VARIABLES ---
    let currentQuiz = [];
    let currentQuestionIndex = 0;
    let userAnswers = [];
    let questionStartTime;
    let selectedOptionValue = null;
    let currentLanguage = localStorage.getItem('quizLanguage') || 'english';
    
    // --- (Syllabus chapters objects are the same) ---
    const chaptersEnglish = {
        physics: ["Physics and Measurement", "Kinematics", "Laws of Motion", "Work, Energy, and Power", "Rotational Motion", "Gravitation", "Properties of Solids and Liquids", "Thermodynamics", "Kinetic Theory of Gases", "Oscillations and Waves", "Electrostatics", "Current Electricity", "Magnetic Effects of Current and Magnetism", "Electromagnetic Induction and Alternating Currents", "Electromagnetic Waves", "Optics", "Dual Nature of Matter and Radiation", "Atoms and Nuclei", "Electronic Devices", "Experimental Skills"],
        chemistry: ["Some Basic Concepts in Chemistry", "Atomic Structure", "Chemical Bonding and Molecular Structure", "Chemical Thermodynamics", "Solutions", "Equilibrium", "Redox Reactions and Electrochemistry", "Chemical Kinetics", "Classification of Elements and Periodicity in Properties", "p-Block Elements", "d- and f-Block Elements", "Co-ordination Compounds", "Purification and Characterisation of Organic Compounds", "Some Basic Principles of Organic Chemistry", "Hydrocarbons", "Organic Compounds Containing Halogens", "Organic Compounds Containing Oxygen", "Organic Compounds Containing Nitrogen", "Biomolecules", "Principles Related to Practical Chemistry"],
        botany: ["The Living World", "Biological Classification", "Plant Kingdom", "Morphology of Flowering Plants", "Anatomy of Flowering Plants", "Cell: The Unit of Life", "Cell Cycle and Cell Division", "Photosynthesis in Higher Plants", "Respiration in Plants", "Plant Growth and Development", "Transport in Plants", "Mineral Nutrition", "Sexual Reproduction in Flowering Plants", "Principles of Inheritance and Variation", "Molecular Basis of Inheritance", "Evolution", "Microbes in Human Welfare", "Biotechnology: Principles and Processes", "Biotechnology and its Applications", "Organisms and Populations", "Ecosystem", "Biodiversity and Conservation", "Environmental Issues"],
        zoology: ["Animal Kingdom", "Structural Organisation in Animals", "Digestion and Absorption", "Breathing and Exchange of Gases", "Body Fluids and Circulation", "Excretory Products and their Elimination", "Locomotion and Movement", "Neural Control and Coordination", "Chemical Coordination and Integration", "Biomolecules", "Human Reproduction", "Reproductive Health", "Genetics and Evolution", "Human Health and Disease", "Immunology (as part of Human Health and Disease)"]
    };
    const chaptersHindi = {
        physics: ["भौतिकी और मापन", "गतिकी", "गति के नियम", "कार्य, ऊर्जा और शक्ति", "घूर्णी गति", "गुरुत्वाकर्षण", "ठोस और तरल पदार्थों के गुण", "ऊष्मप्रवैगिकी", "गैसों का अणुगति सिद्धांत", "दोलन और तरंगें", "स्थिरवैद्युतिकी", "विद्युत धारा", "धारा और चुंबकत्व के चुंबकीय प्रभाव", "विद्युत चुंबकीय प्रेरण और प्रत्यावर्ती धाराएं", "विद्युत चुम्बकीय तरंगें", "प्रकाशिकी", "द्रव्य और विकिरण की द्वैत प्रकृति", "परमाणु और नाभिक", "इलेक्ट्रॉनिक उपकरण", "प्रायोगिक कौशल"],
        chemistry: ["रसायन विज्ञान की कुछ मूल अवधारणाएँ", "परमाणु संरचना", "रासायनिक आबंधन और आणविक संरचना", "रासायनिक ऊष्मप्रवैगिकी", "विलयन", "साम्यावस्था", "अपचयोपचय अभिक्रियाएँ और वैद्युतरसायन", "रासायनिक गतिकी", "तत्वों का वर्गीकरण और गुणधर्मों में आवर्तिता", "p-ब्लॉक के तत्व", "d- और f-ब्लॉक के तत्व", "उपसहसंयोजन यौगिक", "कार्बनिक यौगिकों का शोधन और अभिलक्षणन", "कार्बनिक रसायन के कुछ मूल सिद्धांत", "हाइड्रोकार्बन", "हैलोजन युक्त कार्बनिक यौगिक", "ऑक्सीजन युक्त कार्बनिक यौगिक", "नाइट्रोजन युक्त कार्बनिक यौगिक", "जैव अणु", "प्रायोगिक रसायन से संबंधित सिद्धांत"],
        botany: ["जीव जगत", "जीव जगत का वर्गीकरण", "वनस्पति जगत", "पुष्पी पादपों की आकारिकी", "पुष्पी पादपों का शारीर", "कोशिका: जीवन की इकाई", "कोशिका चक्र और कोशिका विभाजन", "उच्च पादपों में प्रकाश संश्लेषण", "पादपों में श्वसन", "पादप वृद्धि एवं परिवर्धन", "पौधों में परिवहन", "खनिज पोषण", "पुष्पी पादपों में लैंगिक जनन", "वंशागति तथा विविधता के सिद्धांत", "वंशागति का आणविक आधार", "विकास", "मानव कल्याण में सूक्ष्मजीव", "जैव प्रौद्योगिकी - सिद्धांत व प्रक्रम", "जैव प्रौद्योगिकी एवं उसके उपयोग", "जीव और समष्टियाँ", "पारितंत्र", "जैव विविधता एवं संरक्षण", "पर्यावरण के मुद्दे"],
        zoology: ["प्राणि जगत", "प्राणियों में संरचनात्मक संगठन", "पाचन एवं अवशोषण", "श्वसन और गैसों का विनिमय", "शरीर द्रव तथा परिसंचरण", "उत्सर्जी उत्पाद एवं उनका निष्कासन", "गमन एवं संचलन", "तंत्रिकीय नियंत्रण एवं समन्वय", "रासायनिक समन्वय तथा एकीकरण", "जैव अणु", "मानव जनन", "जनन स्वास्थ्य", "आनुवंशिकी तथा विकास", "मानव स्वास्थ्य तथा रोग", "प्रतिरक्षा विज्ञान (मानव स्वास्थ्य तथा रोग का हिस्सा)"]
    };

    // --- CORE FUNCTIONS ---

    function showScreen(screenToShow) {
        screens.forEach(screen => {
            screen.classList.remove('active');
        });
        screenToShow.classList.add('active');
    }

    function showLoader(text) {
        document.getElementById('loader-text').textContent = text;
        loader.classList.add('active');
    }

    function hideLoader() {
        loader.classList.remove('active');
    }

    // --- SETUP & LANGUAGE ---
    
    toggleHindiBtn.addEventListener('click', () => {
        currentLanguage = (currentLanguage === 'english') ? 'hindi' : 'english';
        localStorage.setItem('quizLanguage', currentLanguage);
        updateLanguageDisplay();
        populateChapterSelect();
    });

    function updateLanguageDisplay() {
        if (currentLanguage === 'hindi') {
            document.body.classList.add('hindi-medium');
            toggleHindiBtn.textContent = 'Switch to English Medium';
            document.querySelector('h1').textContent = 'वीआईपीक्विज़';
            document.title = 'वीआईपीक्विज़';
            document.querySelector('label[for="subject-select"]').textContent = 'विषय चुनें';
            document.querySelector('label[for="chapter-select"]').textContent = 'अध्याय चुनें';
            document.querySelector('label[for="question-limit"]').textContent = 'प्रश्न';
            document.querySelector('label[for="style-prompt"]').textContent = 'प्रश्न शैली (वैकल्पिक)';
        } else {
            document.body.classList.remove('hindi-medium');
            toggleHindiBtn.textContent = 'Switch to Hindi Medium';
            document.querySelector('h1').textContent = 'VIPQuizs';
            document.title = 'VIPQuizs';
            document.querySelector('label[for="subject-select"]').textContent = 'Select Subject';
            document.querySelector('label[for="chapter-select"]').textContent = 'Select Chapter';
            document.querySelector('label[for="question-limit"]').textContent = 'Questions';
            document.querySelector('label[for="style-prompt"]').textContent = 'Question Style (Optional)';
        }
        updateStartButtonState();
    }
    
    function populateChapterSelect() {
        const selectedSubject = subjectSelect.value;
        chapterSelect.innerHTML = '<option value="">-- Choose Chapter --</option>';
        chapterSelect.disabled = true;
        const currentChaptersList = (currentLanguage === 'hindi') ? chaptersHindi : chaptersEnglish;
        if (selectedSubject && currentChaptersList[selectedSubject]) {
            const englishChapters = chaptersEnglish[selectedSubject];
            currentChaptersList[selectedSubject].forEach((chapter, index) => {
                const option = document.createElement('option');
                option.value = englishChapters[index];
                option.textContent = chapter;
                chapterSelect.appendChild(option);
            });
            chapterSelect.disabled = false;
        }
        updateStartButtonState();
    }

    function updateStartButtonState() {
        startQuizBtn.disabled = !(subjectSelect.value && chapterSelect.value);
    }
    
    subjectSelect.addEventListener('change', populateChapterSelect);
    chapterSelect.addEventListener('change', updateStartButtonState);

    // --- QUIZ LOGIC ---

    startQuizBtn.addEventListener('click', async () => {
        if (backendUrl.includes("your-render-backend-url-goes-here")) {
            alert("Configuration Error: Please update the backendUrl in script.js with your deployed Render URL.");
            return;
        }
        const selectedSubject = subjectSelect.options[subjectSelect.selectedIndex].text;
        const selectedChapter = chapterSelect.value;
        const questionLimit = parseInt(questionLimitInput.value);
        const stylePrompt = stylePromptInput.value.trim();

        showLoader((currentLanguage === 'hindi') ? 'आपका क्विज़ बन रहा है...' : 'Generating Your Quiz...');

        try {
            const response = await fetch(`${backendUrl}/generate_quiz`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    subject: selectedSubject,
                    chapter: selectedChapter,
                    limit: questionLimit,
                    language: currentLanguage,
                    style_prompt: stylePrompt
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `HTTP error! Status: ${response.status}`);
            }
            const data = await response.json();
            currentQuiz = data.questions;

            if (!currentQuiz || currentQuiz.length === 0) {
                 throw new Error("AI failed to generate questions. Please try a different prompt or chapter.");
            }

            currentQuestionIndex = 0;
            userAnswers = [];
            quizTitle.textContent = selectedSubject;
            displayQuestion(currentQuestionIndex);
            showScreen(quizAreaScreen);

        } catch (error) {
            console.error("Error generating quiz:", error);
            const errorMessage = (currentLanguage === 'hindi') ? `क्विज़ उत्पन्न करने में विफल: ${error.message}। कृपया सुनिश्चित करें कि बैकएंड सर्वर चल रहा है।` : `Failed to generate quiz: ${error.message}. Please ensure the backend server is running.`;
            alert(errorMessage);
        } finally {
            hideLoader();
        }
    });

    function displayQuestion(index) {
        selectedOptionValue = null; // Reset selection for new question
        const question = currentQuiz[index];
        currentQuestionNumber.textContent = `${(currentLanguage === 'hindi' ? 'प्रश्न' : 'Question')} ${index + 1} / ${currentQuiz.length}`;
        questionText.innerHTML = question.question;
        optionsContainer.innerHTML = '';

        const shuffledOptions = [...question.options].sort(() => Math.random() - 0.5);
        shuffledOptions.forEach(optionText => {
            const button = document.createElement('button');
            button.className = 'option-btn';
            button.innerHTML = optionText;
            button.addEventListener('click', () => {
                // Remove 'selected' from any previously selected button
                const allOptions = optionsContainer.querySelectorAll('.option-btn');
                allOptions.forEach(btn => btn.classList.remove('selected'));
                // Add 'selected' to the clicked button
                button.classList.add('selected');
                selectedOptionValue = button.innerHTML;
            });
            optionsContainer.appendChild(button);
        });

        nextQuestionBtn.style.display = (index === currentQuiz.length - 1) ? 'none' : 'block';
        submitQuizBtn.style.display = (index === currentQuiz.length - 1) ? 'block' : 'none';
        questionStartTime = Date.now();
    }

    function recordAnswer() {
        userAnswers.push({
            questionId: currentQuiz[currentQuestionIndex].id,
            questionText: currentQuiz[currentQuestionIndex].question,
            selectedAnswer: selectedOptionValue,
            correctAnswer: currentQuiz[currentQuestionIndex].correctAnswer,
            timeTaken: Date.now() - questionStartTime,
            solution: currentQuiz[currentQuestionIndex].solution
        });
    }

    function handleNextOrSubmit() {
        if (selectedOptionValue === null) {
            alert((currentLanguage === 'hindi') ? 'कृपया आगे बढ़ने से पहले एक विकल्प चुनें।' : 'Please select an option before proceeding.');
            return;
        }
        recordAnswer();
        currentQuestionIndex++;
        if (currentQuestionIndex < currentQuiz.length) {
            displayQuestion(currentQuestionIndex);
        } else {
            submitQuiz();
        }
    }

    nextQuestionBtn.addEventListener('click', handleNextOrSubmit);
    submitQuizBtn.addEventListener('click', handleNextOrSubmit);

    async function submitQuiz() {
        showScreen(resultAreaScreen);
        detailedResultsDiv.innerHTML = ''; // Clear previous results
        
        showLoader((currentLanguage === 'hindi') ? 'परिणामों का विश्लेषण किया जा रहा है...' : 'Analyzing Results...');
        
        try {
            const analysisResponse = await fetch(`${backendUrl}/analyze_results`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ quiz: currentQuiz, userAnswers, language: currentLanguage })
            });
            if (!analysisResponse.ok) throw new Error('AI analysis failed.');
            
            const analysisData = await analysisResponse.json();
            let score = analysisData.score;
            let scorePercentage = Math.round((score / currentQuiz.length) * 100);
            
            scoreDisplay.textContent = `${scorePercentage}%`;
            scoreSummary.textContent = `${(currentLanguage === 'hindi' ? 'आपने' : 'You answered')} ${score} ${(currentLanguage === 'hindi' ? 'में से' : 'out of')} ${currentQuiz.length} ${(currentLanguage === 'hindi' ? 'प्रश्न सही किए।' : 'questions correctly.')}`;
            
            if (analysisData.overallFeedback) {
                const feedbackDiv = document.createElement('div');
                feedbackDiv.classList.add('result-item');
                feedbackDiv.innerHTML = `<p>${analysisData.overallFeedback}</p>`;
                detailedResultsDiv.appendChild(feedbackDiv);
            }

            userAnswers.forEach((answer, index) => {
                const isCorrect = answer.selectedAnswer === answer.correctAnswer;
                const resultItem = document.createElement('div');
                resultItem.classList.add('result-item');
                resultItem.innerHTML = `
                    <h4>${(currentLanguage === 'hindi' ? 'प्रश्न' : 'Question')} ${index + 1}: ${answer.questionText}</h4>
                    <p>${(currentLanguage === 'hindi' ? 'आपका उत्तर' : 'Your Answer')}: <span class="${isCorrect ? 'correct-answer' : 'wrong-answer'}">${answer.selectedAnswer || (currentLanguage === 'hindi' ? 'उत्तर नहीं दिया' : 'Not Answered')}</span></p>
                    <p>${(currentLanguage === 'hindi' ? 'सही उत्तर' : 'Correct Answer')}: <span class="correct-answer">${answer.correctAnswer}</span></p>
                    ${!isCorrect ? `<p><strong>${(currentLanguage === 'hindi' ? 'AI समाधान' : 'AI Solution')}:</strong> ${answer.solution || ''}</p>` : ''}`;
                detailedResultsDiv.appendChild(resultItem);
            });

        } catch (error) {
            console.error("Error fetching detailed analysis:", error);
            // Fallback display if AI analysis fails
            let score = 0;
            userAnswers.forEach(answer => { if (answer.selectedAnswer === answer.correctAnswer) score++; });
            let scorePercentage = Math.round((score / currentQuiz.length) * 100);
            scoreDisplay.textContent = `${scorePercentage}%`;
            scoreSummary.textContent = `${(currentLanguage === 'hindi' ? 'आपने' : 'You answered')} ${score} ${(currentLanguage === 'hindi' ? 'में से' : 'out of')} ${currentQuiz.length} ${(currentLanguage === 'hindi' ? 'प्रश्न सही किए।' : 'questions correctly.')}`;
        } finally {
            hideLoader();
        }
    }

    restartQuizBtn.addEventListener('click', () => {
        stylePromptInput.value = '';
        showScreen(quizSetupScreen);
    });

    // --- INITIALIZE APP ---
    updateLanguageDisplay();
    populateChapterSelect();
    updateStartButtonState();
    showScreen(quizSetupScreen);
});
