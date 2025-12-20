/**
 * Board Question Generator
 * Creates USMLE/board-style clinical vignettes with AI
 */
import { generateWithProvider, AIProvider } from './ai-provider';

export interface BoardQuestion {
  id: string;
  stem: string;
  options: QuestionOption[];
  correctAnswer: string;
  explanation: string;
  category: string;
  difficulty: 'easy' | 'medium' | 'hard';
  topic: string;
  teachingPoints: string[];
}

export interface QuestionOption {
  letter: string;
  text: string;
  isCorrect: boolean;
  whyWrong?: string;
}

export interface QuestionGenerationConfig {
  topic: string;
  count: number;
  difficulty: 'easy' | 'medium' | 'hard' | 'mixed';
  style: 'usmle-step1' | 'usmle-step2' | 'usmle-step3' | 'shelf' | 'board-certification';
  includeExplanations: boolean;
  provider?: AIProvider;
}

const QUESTION_SYSTEM_PROMPT = `You are an expert medical educator creating board-style multiple choice questions.

RULES FOR QUESTION WRITING:
1. Clinical vignettes should be realistic and appropriately detailed
2. Include relevant positives AND negatives in the history/exam
3. Distractors should be plausible but clearly wrong with reasoning
4. Avoid "all of the above" or "none of the above"
5. Questions should test clinical reasoning, not trivia
6. Match the difficulty and style to the target exam

DIFFICULTY LEVELS:
- Easy: Single-step reasoning, classic presentations
- Medium: Two-step reasoning, some atypical features
- Hard: Complex cases, subtle distinctions, rare conditions

QUESTION STRUCTURE:
- Stem: Clinical vignette with relevant details
- Question: Clear, single best answer format
- Options: 5 choices (A-E), one clearly correct
- Explanation: Teaching-focused, explains why correct is correct AND why others are wrong`;

/**
 * Generate board-style questions on a topic
 */
export async function generateBoardQuestions(
  config: QuestionGenerationConfig
): Promise<BoardQuestion[]> {
  const { topic, count, difficulty, style, includeExplanations, provider = 'gemini' } = config;

  const styleGuide = getStyleGuide(style);
  const difficultyGuide = difficulty === 'mixed' 
    ? 'Mix of easy (30%), medium (50%), and hard (20%) questions'
    : `All questions should be ${difficulty} difficulty`;

  const prompt = `Generate ${count} ${style.toUpperCase()} style board questions about: "${topic}"

${styleGuide}
${difficultyGuide}

For EACH question, provide in this exact JSON format:
{
  "questions": [
    {
      "stem": "A 45-year-old man presents to the emergency department with...",
      "question": "Which of the following is the most appropriate next step in management?",
      "options": [
        {"letter": "A", "text": "Option text", "isCorrect": false, "whyWrong": "Brief explanation"},
        {"letter": "B", "text": "Option text", "isCorrect": true},
        {"letter": "C", "text": "Option text", "isCorrect": false, "whyWrong": "Brief explanation"},
        {"letter": "D", "text": "Option text", "isCorrect": false, "whyWrong": "Brief explanation"},
        {"letter": "E", "text": "Option text", "isCorrect": false, "whyWrong": "Brief explanation"}
      ],
      "explanation": "Detailed explanation of the correct answer and teaching points",
      "category": "Cardiology",
      "difficulty": "medium",
      "teachingPoints": ["Key point 1", "Key point 2", "Key point 3"]
    }
  ]
}

Return ONLY valid JSON, no markdown code blocks.`;

  try {
    const response = await generateWithProvider(provider, prompt, [], {});
    const parsed = parseQuestionsFromResponse(response, topic);
    return parsed;
  } catch (error) {
    console.error('Error generating board questions:', error);
    throw error;
  }
}

/**
 * Generate a single question quickly
 */
export async function generateSingleQuestion(
  topic: string,
  difficulty: 'easy' | 'medium' | 'hard' = 'medium',
  provider: AIProvider = 'gemini'
): Promise<BoardQuestion> {
  const questions = await generateBoardQuestions({
    topic,
    count: 1,
    difficulty,
    style: 'usmle-step2',
    includeExplanations: true,
    provider,
  });
  
  if (questions.length === 0) {
    throw new Error('Failed to generate question');
  }
  
  return questions[0];
}

/**
 * Generate questions from lecture content
 */
export async function generateQuestionsFromContent(
  content: string,
  count: number = 5,
  provider: AIProvider = 'gemini'
): Promise<BoardQuestion[]> {
  const prompt = `Based on this lecture content, generate ${count} board-style review questions:

CONTENT:
${content.slice(0, 4000)}

Generate questions that test understanding of the KEY CONCEPTS presented.
Focus on clinical application, not memorization.

Return in JSON format:
{
  "questions": [
    {
      "stem": "Clinical vignette...",
      "question": "Question text...",
      "options": [...],
      "explanation": "...",
      "category": "...",
      "difficulty": "medium",
      "teachingPoints": [...]
    }
  ]
}

Return ONLY valid JSON.`;

  try {
    const response = await generateWithProvider(provider, prompt, [], {});
    return parseQuestionsFromResponse(response, 'Lecture Review');
  } catch (error) {
    console.error('Error generating questions from content:', error);
    throw error;
  }
}

// Helper functions
function getStyleGuide(style: QuestionGenerationConfig['style']): string {
  switch (style) {
    case 'usmle-step1':
      return `STEP 1 STYLE:
- Focus on basic science mechanisms and pathophysiology
- Include lab values and imaging findings
- Test understanding of disease mechanisms
- Less emphasis on treatment, more on diagnosis and mechanisms`;

    case 'usmle-step2':
      return `STEP 2 CK STYLE:
- Clinical vignettes with complete patient presentations
- Focus on diagnosis and management
- Include relevant physical exam and lab findings
- Test clinical decision-making`;

    case 'usmle-step3':
      return `STEP 3 STYLE:
- Complex, real-world clinical scenarios
- Include outpatient and longitudinal care
- Test systems-based practice
- Include patient safety and quality improvement`;

    case 'shelf':
      return `SHELF EXAM STYLE:
- Focused on core clerkship content
- Classic presentations emphasized
- Step-wise clinical reasoning
- Include common clinical pearls`;

    case 'board-certification':
      return `BOARD CERTIFICATION STYLE:
- Specialty-specific depth
- Current guidelines and evidence
- Management nuances
- Recent updates to practice`;

    default:
      return '';
  }
}

function parseQuestionsFromResponse(response: string, topic: string): BoardQuestion[] {
  try {
    // Try to extract JSON from response
    let jsonStr = response;
    
    // Remove markdown code blocks if present
    jsonStr = jsonStr.replace(/```json\s*/g, '').replace(/```\s*/g, '');
    
    // Try to find JSON object
    const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      jsonStr = jsonMatch[0];
    }
    
    const data = JSON.parse(jsonStr);
    const questions = data.questions || [data];
    
    return questions.map((q: any, index: number) => ({
      id: `q-${Date.now()}-${index}`,
      stem: q.stem || '',
      options: (q.options || []).map((opt: any) => ({
        letter: opt.letter || String.fromCharCode(65 + index),
        text: opt.text || '',
        isCorrect: opt.isCorrect || false,
        whyWrong: opt.whyWrong,
      })),
      correctAnswer: q.options?.find((o: any) => o.isCorrect)?.letter || 'A',
      explanation: q.explanation || '',
      category: q.category || topic,
      difficulty: q.difficulty || 'medium',
      topic: topic,
      teachingPoints: q.teachingPoints || [],
    }));
  } catch (error) {
    console.error('Failed to parse questions:', error);
    return [];
  }
}

/**
 * Format question for display
 */
export function formatQuestionForDisplay(question: BoardQuestion): string {
  let output = `${question.stem}\n\n`;
  output += `${question.question || 'Which of the following is the most appropriate next step?'}\n\n`;
  
  for (const option of question.options) {
    output += `${option.letter}. ${option.text}\n`;
  }
  
  return output;
}

/**
 * Format answer explanation
 */
export function formatExplanation(question: BoardQuestion): string {
  let output = `Correct Answer: ${question.correctAnswer}\n\n`;
  output += `${question.explanation}\n\n`;
  
  if (question.teachingPoints.length > 0) {
    output += `Teaching Points:\n`;
    question.teachingPoints.forEach((point, i) => {
      output += `${i + 1}. ${point}\n`;
    });
  }
  
  output += `\nWhy other options are wrong:\n`;
  for (const option of question.options) {
    if (!option.isCorrect && option.whyWrong) {
      output += `${option.letter}. ${option.whyWrong}\n`;
    }
  }
  
  return output;
}
