import { NextRequest, NextResponse } from 'next/server';
import { createSession, getSession, updateSessionStatus, savePlan, saveMessage } from '@/lib/db/sessions';
import { getInterviewPlanForRole, getFirstQuestionForRole } from '@/lib/orchestration/interview';

const FIXED_TOPIC = 'BADM554 Course Survey';

const GREETING = `Welcome to BADM554 Enterprise Database Management! I'm here to learn a bit about your background before the course begins.

This quick survey will help us understand your experience with databases and data tools, so we can tailor the course to serve you better. There are no right or wrong answers—just share honestly about your background and goals.`;

export async function POST(request: NextRequest) {
  try {
    // For BADM554, we always use 'student' role
    const role = 'student';

    // Create new session with fixed topic
    const sessionId = await createSession(FIXED_TOPIC, role);

    // Get the interview plan
    const plan = getInterviewPlanForRole(role);
    await savePlan(sessionId, plan);

    // Add initial system message
    const systemMessage = {
      role: 'system' as const,
      content: `You are conducting a pre-course survey for BADM554 Enterprise Database Management. Your objectives are: ${plan.objectives.join(', ')}`,
      timestamp: new Date().toISOString()
    };
    await saveMessage(sessionId, systemMessage);

    // Add greeting with first question
    const firstQuestion = getFirstQuestionForRole(role);
    const greeting = {
      role: 'assistant' as const,
      content: `${GREETING}\n\n${firstQuestion}`,
      timestamp: new Date().toISOString()
    };
    await saveMessage(sessionId, greeting);

    await updateSessionStatus(sessionId, 'interviewing');

    const session = await getSession(sessionId);

    return NextResponse.json({
      sessionId,
      session,
      plan
    });
  } catch (error) {
    console.error('Error starting survey:', error);
    return NextResponse.json(
      { error: 'Failed to start survey' },
      { status: 500 }
    );
  }
}
