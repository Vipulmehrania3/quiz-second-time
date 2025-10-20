from flask import Flask, request, jsonify
from flask_cors import CORS
import google.generativeai as genai
import os
import json
import re

# --- Basic Flask App Setup ---
app = Flask(__name__)
CORS(app)

# --- Configure Google Generative AI ---
try:
    genai.configure(api_key=os.environ["GOOGLE_API_KEY"])
except KeyError:
    print("WARNING: GOOGLE_API_KEY environment variable not found. Using hardcoded key for local testing.")
    GOOGLE_API_KEY = "AIzaSyAbDRav7Kj6yRVBEJMFaUPz_SbKDe6weoM" # Your provided API key
    genai.configure(api_key=GOOGLE_API_KEY)

# --- AI Model Selection ---
model = genai.GenerativeModel('gemini-flash-latest')


# --- (The parse_quiz_response function is unchanged, you can copy it from the previous version) ---
def parse_quiz_response(text_response):
    questions = []
    question_blocks = re.findall(r'(^##\s*(?:Question|प्रश्न)\s*\d+:\s*.*?)(?=\n^##\s*(?:Question|प्रश्न)|\Z)', text_response, re.DOTALL | re.MULTILINE | re.IGNORECASE)
    if not question_blocks:
        question_blocks = re.findall(r'((?:Question|प्रश्न)\s*\d+:.*?)(?=(?:Question|प्रश्न)\s*\d+:|\Z)', text_response, re.DOTALL | re.IGNORECASE)
    for block in question_blocks:
        block_clean = block.strip()
        block_clean = re.sub(r'^##\s*(?:Question|प्रश्न)\s*\d+:\s*', '', block_clean, flags=re.IGNORECASE | re.MULTILINE)
        question_match = re.search(r'^(.*?)(?=\n\s*(?:Options|विकल्प):)', block_clean, re.DOTALL | re.IGNORECASE)
        options_match = re.search(r'(?:Options|विकल्प):\n(.*?)(?=\n\s*(?:Correct Answer|सही उत्तर):)', block_clean, re.DOTALL | re.IGNORECASE)
        correct_answer_match = re.search(r'(?:Correct Answer|सही उत्तर):\s*(.*?)(?=\n\s*(?:Solution|समाधान):|\Z)', block_clean, re.DOTALL | re.IGNORECASE)
        solution_match = re.search(r'(?:Solution|समाधान):\s*(.*)', block_clean, re.DOTALL | re.IGNORECASE)
        if question_match and options_match and correct_answer_match and solution_match:
            question_text = question_match.group(1).strip()
            options_text = options_match.group(1).strip()
            correct_answer = correct_answer_match.group(1).strip()
            solution = solution_match.group(1).strip()
            options_list = [opt.strip() for opt in options_text.split('\n') if opt.strip()]
            options_cleaned = []
            for opt in options_list:
                cleaned_opt = re.sub(r'^[A-Dअ-द]\.\s*', '', opt, flags=re.IGNORECASE).strip()
                if cleaned_opt:
                    options_cleaned.append(cleaned_opt)
            cleaned_correct_answer = re.sub(r'^[A-Dअ-द]\.\s*', '', correct_answer, flags=re.IGNORECASE).strip()
            questions.append({"id": len(questions) + 1, "question": question_text, "options": options_cleaned, "correctAnswer": cleaned_correct_answer, "solution": solution})
        else:
            print(f"Failed to parse a question block. Missing components in: \n---Block---\n{block_clean}\n---End Block---")
    return questions


# --- API Endpoint to Generate Quiz Questions ---
@app.route('/generate_quiz', methods=['POST'])
def generate_quiz():
    data = request.json
    subject = data.get('subject')
    chapter = data.get('chapter')
    limit = data.get('limit', 10)
    language = data.get('language', 'english')
    style_prompt = data.get('style_prompt', '') # NEW: Get the style prompt

    if not all([subject, chapter, limit]):
        return jsonify({"error": "Missing subject, chapter, or limit"}), 400

    # --- NEW: Dynamically add style instructions ---
    style_instructions = ""
    if style_prompt:
        style_instructions = f"Additionally, apply the following style constraint to all questions: '{style_prompt}'."


    lang_instructions = ""
    if language == 'hindi':
        lang_instructions = f"""
        Generate all content (questions, options, correct answers, solutions) in HINDI.
        The topic is "{chapter}" in the subject "{subject}".
        Use Hindi equivalents for formatting tags.
        """
        if style_prompt: # Also translate the style instruction wrapper
             style_instructions = f"इसके अतिरिक्त, सभी प्रश्नों पर निम्नलिखित शैली बाधा लागू करें: '{style_prompt}'।"

        question_tag = "प्रश्न"
        options_tag = "विकल्प"
        correct_answer_tag = "सही उत्तर"
        solution_tag = "समाधान"
    else:
        question_tag = "Question"
        options_tag = "Options"
        correct_answer_tag = "Correct Answer"
        solution_tag = "Solution"


    prompt = f"""
    You are an expert quiz generator for NEET medical entrance exams.
    Generate {limit} multiple-choice questions for NEET students on the topic of "{chapter}" in the subject "{subject}".
    Each question must be high-quality, conceptually accurate, and at a competitive exam level.
    Each question must have exactly 4 options (A, B, C, D).
    For each question, also provide the correct answer and a detailed explanation (solution).
    
    {lang_instructions}
    {style_instructions}

    Format the output strictly as follows, with no extra text before or after the list:

    ## {question_tag} 1: [Question text]
    {options_tag}:
    A. [Option A text]
    B. [Option B text]
    C. [Option C text]
    D. [Option D text]
    {correct_answer_tag}: [Exact text of the correct option]
    {solution_tag}: [Detailed explanation]

    ## {question_tag} 2: [Question text]
    ...and so on for {limit} questions.
    """

    try:
        # ... (The rest of the function is the same as before) ...
        response = model.generate_content(prompt)
        generated_text = response.text
        print("Raw AI Response:\n", generated_text)
        questions = parse_quiz_response(generated_text)
        if not questions:
            print("Parsing resulted in zero questions.")
            return jsonify({"error": "AI generated no parsable questions. Please try again.", "raw_response": generated_text}), 500
        for q in questions:
            cleaned_correct_answer = re.sub(r'^[A-Dअ-द]\.\s*', '', q['correctAnswer'], flags=re.IGNORECASE).strip()
            matched_option = None
            for opt in q['options']:
                if opt.strip() == cleaned_correct_answer:
                    matched_option = opt
                    break
            if matched_option:
                q['correctAnswer'] = matched_option
        return jsonify({"questions": questions})
    except Exception as e:
        print(f"Error generating content: {e}")
        return jsonify({"error": f"Failed to generate quiz from AI: {str(e)}"}), 500


# --- (The /analyze_results endpoint is unchanged, so you can copy it from the previous version) ---
@app.route('/analyze_results', methods=['POST'])
def analyze_results():
    data = request.json
    quiz = data.get('quiz', [])
    user_answers = data.get('userAnswers', [])
    language = data.get('language', 'english')
    if not quiz or not user_answers:
        return jsonify({"error": "Missing quiz or user answers data for analysis"}), 400
    correct_count = 0
    wrong_questions_details = []
    for user_ans in user_answers:
        question_obj = next((q for q in quiz if q['id'] == user_ans['questionId']), None)
        if question_obj:
            if user_ans['selectedAnswer'] == question_obj['correctAnswer']:
                correct_count += 1
            else:
                wrong_questions_details.append({"question": question_obj['question'], "your_answer": user_ans['selectedAnswer'], "correct_answer": question_obj['correctAnswer'], "provided_solution": question_obj['solution']})
    lang_instructions = "Please provide your feedback and analysis in English."
    if language == 'hindi':
        lang_instructions = "कृपया अपनी प्रतिक्रिया और विश्लेषण हिंदी में प्रदान करें।"
    analysis_prompt = f"""A NEET student just completed a quiz. They answered {correct_count} out of {len(quiz)} questions correctly. Here are the details of the questions they answered incorrectly: {json.dumps(wrong_questions_details, indent=2, ensure_ascii=False)}. Based on this information, provide: 1. An overall feedback message. 2. Suggest 2-3 specific sub-topics for improvement. 3. Encourage them and suggest practical ways to practice. {lang_instructions}"""
    try:
        response = model.generate_content(analysis_prompt)
        overall_feedback = response.text.strip()
        return jsonify({"overallFeedback": overall_feedback, "score": correct_count})
    except Exception as e:
        print(f"Error analyzing results with AI: {e}")
        return jsonify({"error": f"Failed to get AI analysis: {str(e)}", "score": correct_count}), 500


# --- (The __main__ block is unchanged) ---
if __name__ == '__main__':
    app.run(debug=True, port=5000)
