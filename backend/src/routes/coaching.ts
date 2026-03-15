import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import type { App } from '../index.js';
import { requireDualAuth, ensureUserExists } from '../utils/auth-utils.js';
import { gateway } from '@specific-dev/framework';
import { generateText } from 'ai';

export function registerCoachingRoutes(app: App, fastify: FastifyInstance) {

  // Get dating coach suggestions and tips
  fastify.get(
    '/api/coaching',
    {
      schema: {
        description: 'Get dating coach suggestions and personalized tips',
        tags: ['coaching'],
        response: { 200: { type: 'object' } },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const session = await requireDualAuth(request, reply, app);
      if (!session) return;

      await ensureUserExists(app, session.user.id);

      app.logger.info({ userId: session.user.id }, 'Fetching dating coach suggestions');

      return {
        tips: [
          {
            id: 'tip-1',
            title: 'First Date Tips',
            description: 'Make a great impression on your first date with these proven strategies',
            category: 'first-date',
            details: [
              'Choose a comfortable location where you can have a conversation',
              'Ask open-ended questions to learn about them',
              'Be genuinely interested in their responses',
              'Avoid bringing up exes or controversial topics',
              'Keep the date to 1-2 hours for a first meeting',
            ],
          },
          {
            id: 'tip-2',
            title: 'Building Connection',
            description: 'Create deeper connections with the people you date',
            category: 'connection',
            details: [
              'Share something vulnerable about yourself',
              'Find common interests and discuss them',
              'Remember details they mentioned and follow up later',
              'Show genuine curiosity about their life and goals',
              'Be authentic and don\'t pretend to be someone you\'re not',
            ],
          },
          {
            id: 'tip-3',
            title: 'Red Flags vs Green Flags',
            description: 'Learn to identify important compatibility signals',
            category: 'compatibility',
            details: [
              'Green flags: active listening, respect for boundaries, humor, ambition',
              'Red flags: dishonesty, disrespect, lack of emotional awareness, controlling behavior',
              'Trust your intuition about how someone makes you feel',
              'Don\'t ignore warning signs hoping they\'ll change',
              'Healthy relationships require mutual effort',
            ],
          },
          {
            id: 'tip-4',
            title: 'Communication Skills',
            description: 'Improve your ability to express yourself and listen',
            category: 'communication',
            details: [
              'Use "I" statements to express your feelings',
              'Practice active listening without planning your response',
              'Ask clarifying questions if you don\'t understand something',
              'Be honest about your needs and expectations',
              'Avoid defensiveness when receiving feedback',
            ],
          },
          {
            id: 'tip-5',
            title: 'Managing Expectations',
            description: 'Navigate the dating journey with realistic expectations',
            category: 'expectations',
            details: [
              'Not every date will lead to something more, and that\'s okay',
              'Chemistry takes time to develop',
              'Different people have different relationship timelines',
              'Be clear about what you\'re looking for',
              'Respect other people\'s boundaries and timelines',
            ],
          },
        ],
        insights: {
          dateFrequency: 'Try to maintain a healthy dating pace that feels comfortable for you',
          profileMatching:
            'People with shared interests and values tend to have stronger connections',
          communicationTip: 'Regular check-ins with people you\'re interested in show genuine interest',
        },
      };
    }
  );

  // Get personalized dating coach recommendations based on user data
  fastify.get(
    '/api/coaching/recommendations',
    {
      schema: {
        description: 'Get personalized dating coach recommendations',
        tags: ['coaching'],
        response: { 200: { type: 'object' } },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const session = await requireDualAuth(request, reply, app);
      if (!session) return;

      await ensureUserExists(app, session.user.id);

      app.logger.info({ userId: session.user.id }, 'Fetching personalized coaching recommendations');

      return {
        recommendations: [
          {
            id: 'rec-1',
            title: 'Increase Your Roster Diversity',
            description: 'Try connecting with people from different backgrounds or interests',
            priority: 'medium',
            action: 'Add 2-3 new people to your roster this week',
          },
          {
            id: 'rec-2',
            title: 'Schedule Regular Date Nights',
            description: 'Consistency in dating helps you stay focused and build momentum',
            priority: 'medium',
            action: 'Plan at least one date per week',
          },
          {
            id: 'rec-3',
            title: 'Track Your Patterns',
            description: 'Use the notes feature to remember important details about each person',
            priority: 'high',
            action: 'Add notes about what you learned from recent dates',
          },
          {
            id: 'rec-4',
            title: 'Safety First',
            description: 'Always use the safety date feature when going out with new people',
            priority: 'high',
            action: 'Enable safety features for your upcoming dates',
          },
        ],
      };
    }
  );

  // AI-powered dating coach chat
  fastify.post<{
    Body: {
      message: string;
      history?: Array<{ role: string; content: string }>;
      context?: string;
    };
  }>(
    '/api/coaching/chat',
    {
      schema: {
        description: 'Chat with an AI-powered dating coach',
        tags: ['coaching'],
        body: {
          type: 'object',
          properties: {
            message: { type: 'string' },
            history: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  role: { type: 'string' },
                  content: { type: 'string' },
                },
                required: ['role', 'content'],
              },
            },
            context: { type: 'string' },
          },
          required: ['message'],
        },
        response: { 200: { type: 'object', properties: { reply: { type: 'string' } } } },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const session = await requireDualAuth(request, reply, app);
      if (!session) return;

      await ensureUserExists(app, session.user.id);

      const { message, history = [], context } = request.body as {
        message: string;
        history?: Array<{ role: string; content: string }>;
        context?: string;
      };

      app.logger.info(
        { userId: session.user.id, messageLength: message.length, hasContext: !!context },
        'Dating coach chat request'
      );

      try {
        // Determine the system prompt based on whether context is provided
        let systemPrompt: string;
        if (context && context.trim().length > 0) {
          systemPrompt = `You are a personal dating coach. Be supportive, practical, and direct. Use the user's actual dating data below to give personalized advice.\n\n${context}`;
        } else {
          systemPrompt = 'You are a personal dating coach. Be supportive, practical, and direct.';
        }

        // Build messages array with conversation history
        const messages: Array<{ role: string; content: string }> = [
          ...history,
          { role: 'user', content: message },
        ];

        // Call the AI model with the appropriate system prompt
        const { text } = await generateText({
          model: gateway('openai/gpt-5.2'),
          system: systemPrompt,
          messages: messages as any,
        });

        app.logger.info({ userId: session.user.id, responseLength: text.length }, 'Dating coach response generated');

        return { reply: text };
      } catch (error) {
        app.logger.error({ err: error, userId: session.user.id }, 'Failed to generate coaching response');
        return reply.status(500).send({ error: 'Failed to generate coaching response. Please try again.' });
      }
    }
  );
}
