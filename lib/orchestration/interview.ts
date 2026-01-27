import { ChatOpenAI } from '@langchain/openai';
import { InterviewPlan, InterviewAnalysis, EducationRole } from '@/types';

export const DEFAULT_MODEL = process.env.OPENAI_MODEL || 'gpt-4o';

// Lazy-loaded model to avoid build-time initialization errors
let _model: ChatOpenAI | null = null;

function getModel(): ChatOpenAI {
  if (!_model) {
    _model = new ChatOpenAI({
      model: DEFAULT_MODEL,
      openAIApiKey: process.env.OPENAI_API_KEY,
    });
  }
  return _model;
}

// BADM554 Enterprise Database Management Survey Plan
const BADM554_SURVEY_PLAN: InterviewPlan = {
  objectives: [
    'Understand student academic background and current program',
    'Assess prior experience with databases and data management',
    'Identify technical skill levels across key course topics',
    'Gather learning goals and areas of interest',
    'Identify anticipated challenges and support needs'
  ],
  questions: [
    'To start, could you tell me about your academic background? What was your undergraduate major, and what program are you currently in?',
    'How much work experience do you have, and has any of it involved working with data or databases?',
    'Have you taken any courses related to databases, data management, or data analytics before? If so, what did you cover?',
    'How would you describe your experience with data modeling and ER diagrams? Have you created database designs before?',
    'What about SQL and relational databases - have you written queries or worked with systems like MySQL, PostgreSQL, or SQL Server?',
    'Have you had any exposure to NoSQL databases like MongoDB, or other non-relational data stores?',
    'What about ETL processes - have you worked on extracting, transforming, and loading data between systems?',
    'Have you used any cloud data platforms like AWS, Google Cloud, or Azure for data storage or processing?',
    'Which data tools are you already familiar with? For example: Jupyter notebooks, KNIME, database clients, or cloud consoles?',
    'What concepts or skills are you most hoping to learn in this course?',
    'Are there specific tools or technologies you want hands-on experience with?',
    'What aspects of the course do you anticipate being most challenging for you?',
    'Is there anything else about your background or goals you would like to share?'
  ],
  focusAreas: [
    'Academic and professional background',
    'Prior database coursework',
    'Data modeling and ER diagram experience',
    'SQL and relational database skills',
    'NoSQL and alternative data stores',
    'ETL and data pipeline experience',
    'Cloud platform familiarity',
    'Tool proficiency',
    'Learning objectives',
    'Anticipated challenges'
  ]
};

export function getInterviewPlanForRole(_role: EducationRole): InterviewPlan {
  // For BADM554, we always return the same plan
  return BADM554_SURVEY_PLAN;
}

export function getFirstQuestionForRole(_role: EducationRole): string {
  return BADM554_SURVEY_PLAN.questions[0];
}

export async function generateInterviewResponse(
  _role: EducationRole,
  plan: InterviewPlan,
  conversationHistory: Array<{ role: string; content: string }>,
  currentMessage: string
): Promise<string> {
  const historyContext = conversationHistory
    .slice(-10) // Last 10 messages for context
    .map(msg => `${msg.role}: ${msg.content}`)
    .join('\n');

  const questionsRemaining = plan.questions.slice(1).join('\n- ');

  const prompt = `You are having a natural conversation with an incoming student for BADM554 Enterprise Database Management (Spring 2026). Your goal is to understand their background - not to run through a checklist.

Topics to explore (in whatever order feels natural):
${plan.focusAreas.map(area => `- ${area}`).join('\n')}

Conversation so far:
${historyContext}

Student just said: "${currentMessage}"

CRITICAL - Be a real conversationalist, not a form:
- If their answer is vague or short (like "a little" or "some" or "not much"), DIG DEEPER. Ask what specifically? When? What did they do?
- If they mention something interesting, follow up on THAT - don't just move to the next topic.
- NEVER start with "It's great to hear" or "That's great" or similar. Vary your responses.
- Sometimes just ask your question directly without any preamble.
- React authentically - if something is surprising or interesting, say so briefly.
- You can be curious, even playful. This isn't a job interview.

Examples of good follow-ups to short answers:
- "SQL" → "What kinds of queries have you written? Simple SELECTs, or more complex stuff with joins and subqueries?"
- "A little" → "Tell me more - what did that look like?"
- "Not really" → "No worries at all. What about [related thing]?"

Ask ONE question. Keep your response to 1-2 sentences total. Be human.`;

  const response = await getModel().invoke(prompt);
  return response.content as string;
}

export async function generateWrapUpResponse(
  _role: EducationRole,
  conversationHistory: Array<{ role: string; content: string }>,
  currentMessage: string
): Promise<string> {
  const historyContext = conversationHistory
    .slice(-6)
    .map(msg => `${msg.role}: ${msg.content}`)
    .join('\n');

  const prompt = `You are wrapping up a pre-course survey for BADM554 Enterprise Database Management with a student.

Previous conversation:
${historyContext}

Their latest response: ${currentMessage}

Your task: Write a brief, warm closing message that:
1. Acknowledges their final response (1 sentence)
2. Thanks them for sharing their background and goals
3. Expresses that their responses will help us tailor the course
4. Asks if there's anything else they'd like to add before we finish

Keep it to 2-3 sentences total. Be genuine and welcoming to the course.`;

  const response = await getModel().invoke(prompt);
  return response.content as string;
}

export async function analyzeInterview(
  _role: EducationRole,
  plan: InterviewPlan,
  transcript: Array<{ role: string; content: string }>
): Promise<InterviewAnalysis> {
  // Count actual user responses (exclude system and assistant messages)
  const userResponses = transcript.filter(msg => msg.role === 'user');

  // If no user responses or minimal engagement, return an incomplete analysis
  if (userResponses.length === 0) {
    return {
      summary: 'Survey was started but not completed. No responses were provided.',
      keyInsights: ['Survey incomplete - no responses recorded'],
      recommendations: ['Complete the survey by responding to the questions']
    };
  }

  // If only 1-2 responses, indicate minimal engagement
  if (userResponses.length <= 2) {
    return {
      summary: 'Survey was briefly started but ended early with minimal engagement.',
      keyInsights: [
        'Survey incomplete - only minimal responses provided',
        'Insufficient data to create a student profile'
      ],
      recommendations: ['Continue the survey to share your background and goals']
    };
  }

  const transcriptText = transcript
    .filter(msg => msg.role !== 'system')
    .map(msg => `${msg.role}: ${msg.content}`)
    .join('\n\n');

  const prompt = `Analyze this pre-course survey transcript for BADM554 Enterprise Database Management.

Survey Objectives:
${plan.objectives.map(obj => `- ${obj}`).join('\n')}

Transcript:
${transcriptText}

IMPORTANT: Base your analysis ONLY on what was actually discussed in the transcript. Do not make assumptions.

Provide a comprehensive student profile as JSON:
{
  "summary": "A 2-3 sentence summary of this student's background and readiness for the course",
  "keyInsights": ["insight1", "insight2", "insight3", "insight4"],
  "technicalSkillLevel": "Brief assessment of their current technical level (beginner/intermediate/advanced) with specifics",
  "priorExperienceProfile": "Summary of their relevant prior experience with databases and data",
  "areasNeedingSupport": ["area1", "area2"],
  "topicsOfInterest": ["topic1", "topic2"],
  "recommendations": ["How to best support this student", "Suggested resources or approaches"]
}

Key Insights: 3-5 main takeaways about this student's background and needs
Areas Needing Support: Specific topics where they may need extra help
Topics of Interest: What they're most excited to learn
Recommendations: How the instructor can best support this student`;

  const response = await getModel().invoke(prompt);
  const content = response.content as string;

  try {
    const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/) || content.match(/\{[\s\S]*\}/);
    const jsonStr = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : content;
    return JSON.parse(jsonStr);
  } catch (error) {
    return {
      summary: 'Survey completed. The conversation explored the student\'s background and goals for BADM554.',
      keyInsights: ['Survey completed successfully']
    };
  }
}

export function calculateCost(tokens: number, modelName: string = DEFAULT_MODEL): number {
  // OpenAI pricing (as of January 2026) in USD per 1K tokens
  const pricing: Record<string, { input: number; output: number }> = {
    'gpt-4o': { input: 0.005, output: 0.015 },
    'gpt-4o-mini': { input: 0.00015, output: 0.0006 },
    'gpt-4-turbo': { input: 0.01, output: 0.03 },
    'gpt-4': { input: 0.03, output: 0.06 },
    'gpt-3.5-turbo': { input: 0.0015, output: 0.002 }
  };

  const rates = pricing[modelName] || pricing['gpt-4o'];
  const inputRate = rates.input / 1000;
  const outputRate = rates.output / 1000;
  // Rough estimate: assume 50/50 input/output split
  return (tokens / 2) * inputRate + (tokens / 2) * outputRate;
}
