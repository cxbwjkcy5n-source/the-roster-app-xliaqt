import type { FastifyInstance } from 'fastify';
import { supabaseAuthMiddleware, requireAuth, type AuthenticatedRequest } from '../middleware/supabase-auth.js';
import { supabase } from '../lib/supabase.js';
import { ensureUserExists } from '../lib/ensure-user.js';

export function registerSupabaseRoutes(fastify: FastifyInstance) {
  // Register auth middleware for all protected routes
  fastify.addHook('preHandler', async (request: AuthenticatedRequest, reply) => {
    // Only apply auth to routes that need it (not /api/health, /api/sign-up, /api/sign-out, etc.)
    if (
      request.url.startsWith('/api/') &&
      !request.url.startsWith('/api/health') &&
      !request.url.startsWith('/api/sign-up') &&
      !request.url.startsWith('/api/sign-out') &&
      !request.url.startsWith('/api/sign-in') &&
      !request.url.startsWith('/api/verify-token') &&
      !request.url.startsWith('/api/session') &&
      !request.url.startsWith('/api/auth-health') &&
      !request.url.startsWith('/api/profiles/by-code')
    ) {
      await supabaseAuthMiddleware(request, reply);
      await requireAuth(request, reply);
    }
  });

  // GET /api/user/profile - Get user's own profile
  fastify.get(
    '/api/user/profile',
    {
      schema: {
        description: 'Get user\'s own profile',
        tags: ['user'],
        response: { 200: { type: 'object' } },
      },
    },
    async (request: AuthenticatedRequest, reply) => {
      try {
        const userId = request.userId!;

        // Ensure user exists
        await ensureUserExists(userId, request.userEmail!, request.userName!);

        // Query user profile
        const { data, error } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('user_id', userId)
          .maybeSingle();

        if (error) {
          console.error({ err: error, userId }, 'Error fetching user profile');
          return reply.status(500).send({ error: { message: 'Failed to fetch profile' } });
        }

        return data || {};
      } catch (error) {
        console.error({ err: error }, 'Error in GET /api/user/profile');
        return reply.status(500).send({ error: { message: 'Internal server error' } });
      }
    }
  );

  // PUT /api/user/profile - Update or create user profile
  fastify.put(
    '/api/user/profile',
    {
      schema: {
        description: 'Update or create user profile',
        tags: ['user'],
        body: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            age: { type: 'integer' },
            phone_number: { type: 'string' },
            favorite_color: { type: 'string' },
            favorite_food: { type: 'string' },
            instagram: { type: 'string' },
            twitter: { type: 'string' },
            notes: { type: 'string' },
            profile_image_url: { type: 'string' },
          },
        },
        response: { 200: { type: 'object' } },
      },
    },
    async (request: AuthenticatedRequest, reply) => {
      try {
        const userId = request.userId!;
        const body = request.body as Record<string, any>;

        // Ensure user exists
        await ensureUserExists(userId, request.userEmail!, request.userName!);

        // Check if profile exists
        const { data: existingProfile, error: selectError } = await supabase
          .from('user_profiles')
          .select('id')
          .eq('user_id', userId)
          .maybeSingle();

        if (selectError) {
          console.error({ err: selectError, userId }, 'Error checking user profile');
          return reply.status(500).send({ error: { message: 'Failed to check profile' } });
        }

        if (existingProfile) {
          // Update existing profile
          const { error: updateError } = await supabase
            .from('user_profiles')
            .update({
              ...body,
              updated_at: new Date().toISOString(),
            })
            .eq('user_id', userId);

          if (updateError) {
            console.error({ err: updateError, userId }, 'Error updating user profile');
            return reply.status(500).send({ error: { message: 'Failed to update profile' } });
          }
        } else {
          // Insert new profile
          const { error: insertError } = await supabase
            .from('user_profiles')
            .insert({
              user_id: userId,
              ...body,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            });

          if (insertError) {
            console.error({ err: insertError, userId }, 'Error creating user profile');
            return reply.status(500).send({ error: { message: 'Failed to create profile' } });
          }
        }

        // Fetch and return updated profile
        const { data: updatedProfile, error: fetchError } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('user_id', userId)
          .maybeSingle();

        if (fetchError) {
          return reply.status(500).send({ error: { message: 'Failed to fetch updated profile' } });
        }

        return updatedProfile || {};
      } catch (error) {
        console.error({ err: error }, 'Error in PUT /api/user/profile');
        return reply.status(500).send({ error: { message: 'Internal server error' } });
      }
    }
  );

  // POST /api/profiles - Create new profile
  fastify.post(
    '/api/profiles',
    {
      schema: {
        description: 'Create a new roster profile',
        tags: ['profiles'],
        body: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            age: { type: 'integer' },
            location: { type: 'string' },
            birthday_month: { type: 'string' },
            birthday_day: { type: 'integer' },
            zodiac_sign: { type: 'string' },
            favorite_color: { type: 'string' },
            favorite_food: { type: 'string' },
            relationship_type: { type: 'string' },
            custom_relationship_type: { type: 'string' },
            how_you_met: { type: 'string' },
            how_we_met: { type: 'string' },
            phone_number: { type: 'string' },
            instagram: { type: 'string' },
            twitter: { type: 'string' },
            facebook: { type: 'string' },
            snapchat: { type: 'string' },
            notes: { type: 'string' },
            image_url: { type: 'string' },
            profile_image_url: { type: 'string' },
            priority: { type: 'string' },
            interest_level: { type: 'integer' },
            status: { type: 'string' },
            bench_reason: { type: 'string' },
            sort_order: { type: 'integer' },
          },
          required: ['name'],
        },
        response: { 201: { type: 'object' } },
      },
    },
    async (request: AuthenticatedRequest, reply) => {
      try {
        const userId = request.userId!;
        const body = request.body as Record<string, any>;

        // Ensure user exists
        await ensureUserExists(userId, request.userEmail!, request.userName!);

        // Insert new profile
        const { data, error } = await supabase
          .from('profiles')
          .insert({
            user_id: userId,
            ...body,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .select();

        if (error) {
          console.error({ err: error, userId }, 'Error creating profile');
          return reply.status(500).send({ error: { message: 'Failed to create profile' } });
        }

        return reply.status(201).send(data?.[0] || {});
      } catch (error) {
        console.error({ err: error }, 'Error in POST /api/profiles');
        return reply.status(500).send({ error: { message: 'Internal server error' } });
      }
    }
  );

  // GET /api/profiles - List all profiles for user
  fastify.get(
    '/api/profiles',
    {
      schema: {
        description: 'Get all roster profiles for user',
        tags: ['profiles'],
        querystring: {
          type: 'object',
          properties: {
            relationship_type: { type: 'string' },
          },
        },
        response: { 200: { type: 'array' } },
      },
    },
    async (request: AuthenticatedRequest, reply) => {
      try {
        const userId = request.userId!;
        const query = request.query as Record<string, any>;

        let dbQuery = supabase
          .from('profiles')
          .select('*')
          .eq('user_id', userId);

        if (query.relationship_type) {
          dbQuery = dbQuery.eq('relationship_type', query.relationship_type);
        }

        const { data, error } = await dbQuery.order('created_at', { ascending: false });

        if (error) {
          console.error({ err: error, userId }, 'Error fetching profiles');
          return reply.status(500).send({ error: { message: 'Failed to fetch profiles' } });
        }

        return data || [];
      } catch (error) {
        console.error({ err: error }, 'Error in GET /api/profiles');
        return reply.status(500).send({ error: { message: 'Internal server error' } });
      }
    }
  );

  // PUT /api/profiles/:id - Update profile
  fastify.put(
    '/api/profiles/:id',
    {
      schema: {
        description: 'Update a roster profile',
        tags: ['profiles'],
        params: {
          type: 'object',
          properties: { id: { type: 'string' } },
          required: ['id'],
        },
        body: { type: 'object' },
        response: { 200: { type: 'object' } },
      },
    },
    async (request: AuthenticatedRequest, reply) => {
      try {
        const userId = request.userId!;
        const { id } = request.params as { id: string };
        const body = request.body as Record<string, any>;

        // Check ownership
        const { data: profile, error: fetchError } = await supabase
          .from('profiles')
          .select('id, user_id')
          .eq('id', id)
          .maybeSingle();

        if (fetchError) {
          return reply.status(500).send({ error: { message: 'Failed to fetch profile' } });
        }

        if (!profile) {
          return reply.status(404).send({ error: { message: 'Profile not found' } });
        }

        if (profile.user_id !== userId) {
          return reply.status(403).send({ error: { message: 'Forbidden' } });
        }

        // Update profile
        const { data, error } = await supabase
          .from('profiles')
          .update({
            ...body,
            updated_at: new Date().toISOString(),
          })
          .eq('id', id)
          .select();

        if (error) {
          console.error({ err: error, id }, 'Error updating profile');
          return reply.status(500).send({ error: { message: 'Failed to update profile' } });
        }

        return data?.[0] || {};
      } catch (error) {
        console.error({ err: error }, 'Error in PUT /api/profiles/:id');
        return reply.status(500).send({ error: { message: 'Internal server error' } });
      }
    }
  );

  // DELETE /api/profiles/:id - Delete profile
  fastify.delete(
    '/api/profiles/:id',
    {
      schema: {
        description: 'Delete a roster profile',
        tags: ['profiles'],
        params: {
          type: 'object',
          properties: { id: { type: 'string' } },
          required: ['id'],
        },
        response: { 200: { type: 'object' } },
      },
    },
    async (request: AuthenticatedRequest, reply) => {
      try {
        const userId = request.userId!;
        const { id } = request.params as { id: string };

        // Check ownership
        const { data: profile, error: fetchError } = await supabase
          .from('profiles')
          .select('id, user_id')
          .eq('id', id)
          .maybeSingle();

        if (fetchError) {
          return reply.status(500).send({ error: { message: 'Failed to fetch profile' } });
        }

        if (!profile) {
          return reply.status(404).send({ error: { message: 'Profile not found' } });
        }

        if (profile.user_id !== userId) {
          return reply.status(403).send({ error: { message: 'Forbidden' } });
        }

        // Delete profile
        const { error } = await supabase
          .from('profiles')
          .delete()
          .eq('id', id);

        if (error) {
          console.error({ err: error, id }, 'Error deleting profile');
          return reply.status(500).send({ error: { message: 'Failed to delete profile' } });
        }

        return { success: true };
      } catch (error) {
        console.error({ err: error }, 'Error in DELETE /api/profiles/:id');
        return reply.status(500).send({ error: { message: 'Internal server error' } });
      }
    }
  );

  // POST /api/upload/profile-image - Upload profile image
  fastify.post(
    '/api/upload/profile-image',
    {
      schema: {
        description: 'Upload profile image to Supabase Storage',
        tags: ['upload'],
        response: {
          200: {
            type: 'object',
            properties: { url: { type: 'string' } },
          },
        },
      },
    },
    async (request: AuthenticatedRequest, reply) => {
      try {
        const userId = request.userId!;
        const data = await request.file();

        if (!data) {
          return reply.status(400).send({ error: { message: 'No file provided' } });
        }

        const buffer = await data.toBuffer();
        const filename = `${userId}/${Date.now()}-${data.filename}`;

        const { error } = await supabase.storage
          .from('profile-images')
          .upload(filename, buffer, {
            contentType: data.mimetype,
            upsert: false,
          });

        if (error) {
          console.error({ err: error }, 'Error uploading profile image');
          return reply.status(500).send({ error: { message: 'Failed to upload image' } });
        }

        const { data: publicUrlData } = supabase.storage
          .from('profile-images')
          .getPublicUrl(filename);

        return { url: publicUrlData.publicUrl };
      } catch (error) {
        console.error({ err: error }, 'Error in POST /api/upload/profile-image');
        return reply.status(500).send({ error: { message: 'Internal server error' } });
      }
    }
  );

  // POST /api/upload/roster-image - Upload roster image
  fastify.post(
    '/api/upload/roster-image',
    {
      schema: {
        description: 'Upload roster image to Supabase Storage',
        tags: ['upload'],
        response: {
          200: {
            type: 'object',
            properties: { url: { type: 'string' } },
          },
        },
      },
    },
    async (request: AuthenticatedRequest, reply) => {
      try {
        const userId = request.userId!;
        const data = await request.file();

        if (!data) {
          return reply.status(400).send({ error: { message: 'No file provided' } });
        }

        const buffer = await data.toBuffer();
        const filename = `${userId}/${Date.now()}-${data.filename}`;

        const { error } = await supabase.storage
          .from('roster-images')
          .upload(filename, buffer, {
            contentType: data.mimetype,
            upsert: false,
          });

        if (error) {
          console.error({ err: error }, 'Error uploading roster image');
          return reply.status(500).send({ error: { message: 'Failed to upload image' } });
        }

        const { data: publicUrlData } = supabase.storage
          .from('roster-images')
          .getPublicUrl(filename);

        return { url: publicUrlData.publicUrl };
      } catch (error) {
        console.error({ err: error }, 'Error in POST /api/upload/roster-image');
        return reply.status(500).send({ error: { message: 'Internal server error' } });
      }
    }
  );

  // GET /api/dates - Get profiles for dates (same as GET /api/profiles)
  fastify.get(
    '/api/dates',
    {
      schema: {
        description: 'Get profiles for dates',
        tags: ['dates'],
        response: { 200: { type: 'array' } },
      },
    },
    async (request: AuthenticatedRequest, reply) => {
      try {
        const userId = request.userId!;

        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false });

        if (error) {
          console.error({ err: error, userId }, 'Error fetching dates');
          return reply.status(500).send({ error: { message: 'Failed to fetch dates' } });
        }

        return data || [];
      } catch (error) {
        console.error({ err: error }, 'Error in GET /api/dates');
        return reply.status(500).send({ error: { message: 'Internal server error' } });
      }
    }
  );

  // POST /api/dates - Create a new date
  fastify.post(
    '/api/dates',
    async (request: AuthenticatedRequest, reply) => {
      try {
        const userId = request.userId!;
        const body = request.body as Record<string, any>;

        const { error } = await supabase
          .from('dates')
          .insert({
            user_id: userId,
            ...body,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });

        if (error) {
          console.error({ err: error }, 'Error creating date');
          return reply.status(500).send({ error: { message: 'Failed to create date' } });
        }

        return reply.status(201).send({ success: true });
      } catch (error) {
        console.error({ err: error }, 'Error in POST /api/dates');
        return reply.status(500).send({ error: { message: 'Internal server error' } });
      }
    }
  );

  // PUT /api/dates/:id - Update a date
  fastify.put(
    '/api/dates/:id',
    async (request: AuthenticatedRequest, reply) => {
      try {
        const { id } = request.params as { id: string };
        const body = request.body as Record<string, any>;

        const { error } = await supabase
          .from('dates')
          .update({ ...body, updated_at: new Date().toISOString() })
          .eq('id', id);

        if (error) {
          console.error({ err: error }, 'Error updating date');
          return reply.status(500).send({ error: { message: 'Failed to update date' } });
        }

        return reply.status(200).send({ success: true });
      } catch (error) {
        console.error({ err: error }, 'Error in PUT /api/dates/:id');
        return reply.status(500).send({ error: { message: 'Internal server error' } });
      }
    }
  );

  // DELETE /api/dates/:id - Delete a date
  fastify.delete(
    '/api/dates/:id',
    async (request: AuthenticatedRequest, reply) => {
      try {
        const { id } = request.params as { id: string };

        await supabase.from('dates').delete().eq('id', id);

        return reply.status(200).send({ success: true });
      } catch (error) {
        console.error({ err: error }, 'Error in DELETE /api/dates/:id');
        return reply.status(500).send({ error: { message: 'Internal server error' } });
      }
    }
  );

  // GET /api/reminders - Get all reminders
  fastify.get(
    '/api/reminders',
    async (request: AuthenticatedRequest, reply) => {
      try {
        const userId = request.userId!;

        const { data, error } = await supabase
          .from('reminders')
          .select('*')
          .eq('user_id', userId)
          .order('remind_at', { ascending: true });

        if (error) {
          console.error({ err: error }, 'Error fetching reminders');
          return reply.status(500).send({ error: { message: 'Failed to fetch reminders' } });
        }

        return data || [];
      } catch (error) {
        console.error({ err: error }, 'Error in GET /api/reminders');
        return reply.status(500).send({ error: { message: 'Internal server error' } });
      }
    }
  );

  // POST /api/reminders - Create a new reminder
  fastify.post(
    '/api/reminders',
    async (request: AuthenticatedRequest, reply) => {
      try {
        const userId = request.userId!;
        const body = request.body as Record<string, any>;

        const { error } = await supabase
          .from('reminders')
          .insert({ user_id: userId, ...body });

        if (error) {
          console.error({ err: error }, 'Error creating reminder');
          return reply.status(500).send({ error: { message: 'Failed to create reminder' } });
        }

        return reply.status(201).send({ success: true });
      } catch (error) {
        console.error({ err: error }, 'Error in POST /api/reminders');
        return reply.status(500).send({ error: { message: 'Internal server error' } });
      }
    }
  );

  // PUT /api/reminders/:id - Update a reminder
  fastify.put(
    '/api/reminders/:id',
    async (request: AuthenticatedRequest, reply) => {
      try {
        const { id } = request.params as { id: string };
        const body = request.body as Record<string, any>;

        const { error } = await supabase
          .from('reminders')
          .update(body)
          .eq('id', id);

        if (error) {
          console.error({ err: error }, 'Error updating reminder');
          return reply.status(500).send({ error: { message: 'Failed to update reminder' } });
        }

        return reply.status(200).send({ success: true });
      } catch (error) {
        console.error({ err: error }, 'Error in PUT /api/reminders/:id');
        return reply.status(500).send({ error: { message: 'Internal server error' } });
      }
    }
  );

  // DELETE /api/reminders/:id - Delete a reminder
  fastify.delete(
    '/api/reminders/:id',
    async (request: AuthenticatedRequest, reply) => {
      try {
        const { id } = request.params as { id: string };

        await supabase.from('reminders').delete().eq('id', id);

        return reply.status(200).send({ success: true });
      } catch (error) {
        console.error({ err: error }, 'Error in DELETE /api/reminders/:id');
        return reply.status(500).send({ error: { message: 'Internal server error' } });
      }
    }
  );

  // GET /api/analytics - Get analytics
  fastify.get(
    '/api/analytics',
    async (request: AuthenticatedRequest, reply) => {
      try {
        const userId = request.userId!;

        const { data: profiles } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', userId);

        const { data: dates } = await supabase
          .from('dates')
          .select('*')
          .eq('user_id', userId);

        const activeProfiles = (profiles || []).filter((p: any) => p.status !== 'benched').length;
        const benchedProfiles = (profiles || []).filter((p: any) => p.status === 'benched').length;

        return {
          totalProfiles: (profiles || []).length,
          activeProfiles,
          benchedProfiles,
          totalDates: (dates || []).length,
        };
      } catch (error) {
        console.error({ err: error }, 'Error in GET /api/analytics');
        return reply.status(500).send({ error: { message: 'Internal server error' } });
      }
    }
  );

  // GET /api/nudges - Get nudges
  fastify.get(
    '/api/nudges',
    async (request: AuthenticatedRequest, reply) => {
      return { nudges: [] };
    }
  );

  // GET /api/profiles/by-code - Public profile lookup
  fastify.get(
    '/api/profiles/by-code',
    async (request, reply) => {
      try {
        const { code } = request.query as { code: string };

        if (!code) {
          return reply.status(400).send({ error: { message: 'Code required' } });
        }

        const { data, error } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('share_code', code)
          .maybeSingle();

        if (error || !data) {
          return reply.status(404).send({ error: { message: 'Profile not found' } });
        }

        return data;
      } catch (error) {
        console.error({ err: error }, 'Error in GET /api/profiles/by-code');
        return reply.status(500).send({ error: { message: 'Internal server error' } });
      }
    }
  );

  // PUT /api/profiles/:id/bench - Bench a profile
  fastify.put(
    '/api/profiles/:id/bench',
    async (request: AuthenticatedRequest, reply) => {
      try {
        const { id } = request.params as { id: string };
        const body = request.body as Record<string, any>;

        const { error } = await supabase
          .from('profiles')
          .update({ status: 'benched', bench_reason: body.benchReason || body.bench_reason })
          .eq('id', id);

        if (error) {
          return reply.status(500).send({ error: { message: 'Failed to bench profile' } });
        }

        return reply.status(200).send({ success: true });
      } catch (error) {
        console.error({ err: error }, 'Error in PUT /api/profiles/:id/bench');
        return reply.status(500).send({ error: { message: 'Internal server error' } });
      }
    }
  );

  // PUT /api/profiles/:id/roster - Move profile to active roster
  fastify.put(
    '/api/profiles/:id/roster',
    async (request: AuthenticatedRequest, reply) => {
      try {
        const { id } = request.params as { id: string };

        const { error } = await supabase
          .from('profiles')
          .update({ status: 'active', bench_reason: null })
          .eq('id', id);

        if (error) {
          return reply.status(500).send({ error: { message: 'Failed to restore profile' } });
        }

        return reply.status(200).send({ success: true });
      } catch (error) {
        console.error({ err: error }, 'Error in PUT /api/profiles/:id/roster');
        return reply.status(500).send({ error: { message: 'Internal server error' } });
      }
    }
  );

  // POST /api/profiles/:id/flags - Add flag
  fastify.post(
    '/api/profiles/:id/flags',
    async (request: AuthenticatedRequest, reply) => {
      try {
        const { id } = request.params as { id: string };
        const body = request.body as Record<string, any>;

        const { error } = await supabase
          .from('profile_flags')
          .insert({
            profile_id: id,
            flag_text: body.flagText || body.flag_text,
            type: body.type || 'red',
          });

        if (error) {
          return reply.status(500).send({ error: { message: 'Failed to add flag' } });
        }

        return reply.status(201).send({ success: true });
      } catch (error) {
        console.error({ err: error }, 'Error in POST /api/profiles/:id/flags');
        return reply.status(500).send({ error: { message: 'Internal server error' } });
      }
    }
  );

  // DELETE /api/flags/:id - Delete flag
  fastify.delete(
    '/api/flags/:id',
    async (request: AuthenticatedRequest, reply) => {
      try {
        const { id } = request.params as { id: string };

        await supabase.from('profile_flags').delete().eq('id', id);

        return reply.status(200).send({ success: true });
      } catch (error) {
        console.error({ err: error }, 'Error in DELETE /api/flags/:id');
        return reply.status(500).send({ error: { message: 'Internal server error' } });
      }
    }
  );

  // GET /api/coaching/history - Get coaching history
  fastify.get(
    '/api/coaching/history',
    async (request: AuthenticatedRequest, reply) => {
      try {
        const userId = request.userId!;

        const { data, error } = await supabase
          .from('coaching_history')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: true });

        if (error) {
          return reply.status(500).send({ error: { message: 'Failed to fetch history' } });
        }

        return data || [];
      } catch (error) {
        console.error({ err: error }, 'Error in GET /api/coaching/history');
        return reply.status(500).send({ error: { message: 'Internal server error' } });
      }
    }
  );

  // POST /api/coaching/history - Save coaching message
  fastify.post(
    '/api/coaching/history',
    async (request: AuthenticatedRequest, reply) => {
      try {
        const userId = request.userId!;
        const body = request.body as Record<string, any>;

        const { error } = await supabase
          .from('coaching_history')
          .insert({
            user_id: userId,
            role: body.role,
            content: body.content,
          });

        if (error) {
          return reply.status(500).send({ error: { message: 'Failed to save history' } });
        }

        return reply.status(201).send({ success: true });
      } catch (error) {
        console.error({ err: error }, 'Error in POST /api/coaching/history');
        return reply.status(500).send({ error: { message: 'Internal server error' } });
      }
    }
  );

  // DELETE /api/coaching/history - Delete all coaching history
  fastify.delete(
    '/api/coaching/history',
    async (request: AuthenticatedRequest, reply) => {
      try {
        const userId = request.userId!;

        await supabase
          .from('coaching_history')
          .delete()
          .eq('user_id', userId);

        return reply.status(200).send({ success: true });
      } catch (error) {
        console.error({ err: error }, 'Error in DELETE /api/coaching/history');
        return reply.status(500).send({ error: { message: 'Internal server error' } });
      }
    }
  );

  // POST /api/user/complete-profile - Mark profile as complete
  fastify.post(
    '/api/user/complete-profile',
    async (request: AuthenticatedRequest, reply) => {
      try {
        const userId = request.userId!;

        await supabase
          .from('user_profiles')
          .update({ profile_completed: true })
          .eq('user_id', userId);

        return reply.status(200).send({ success: true });
      } catch (error) {
        console.error({ err: error }, 'Error in POST /api/user/complete-profile');
        return reply.status(500).send({ error: { message: 'Internal server error' } });
      }
    }
  );
}
