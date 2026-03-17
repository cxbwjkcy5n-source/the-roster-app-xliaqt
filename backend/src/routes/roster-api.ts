import type { FastifyInstance } from 'fastify';
import { randomUUID } from 'crypto';
import { supabase } from '../lib/supabase.js';
import { verifySupabaseToken, extractBearerToken } from '../middleware/jwt-verify.js';
import { ensureUserProfile, transformUserProfile } from '../lib/user-helpers.js';

/**
 * Middleware to extract and verify JWT token
 */
async function requireAuth(request: any, reply: any) {
  const token = extractBearerToken(request.headers.authorization);
  if (!token) {
    return reply.status(401).send({ error: 'Missing authorization token' });
  }

  try {
    const { userId, email } = verifySupabaseToken(token);
    request.userId = userId;
    request.userEmail = email;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Token verification failed';
    return reply.status(401).send({ error: message });
  }
}

/**
 * Helper to check ownership of a roster profile
 */
async function checkRosterOwnership(userId: string, profileId: string, reply: any): Promise<boolean> {
  const { data, error } = await supabase
    .from('roster_profiles')
    .select('user_id')
    .eq('id', profileId)
    .eq('user_id', userId)
    .maybeSingle();

  if (error || !data) {
    reply.status(403).send({ error: 'Forbidden' });
    return false;
  }
  return true;
}

/**
 * Helper to transform roster profile to API format
 */
function transformRosterProfile(profile: any, flags: any[] = []): Record<string, any> {
  const redFlags = flags
    .filter((f: any) => f.type === 'red')
    .map((f: any) => ({ id: f.id, flagText: f.flag_text, type: f.type }));

  const greenFlags = flags
    .filter((f: any) => f.type === 'green')
    .map((f: any) => ({ id: f.id, flagText: f.flag_text, type: f.type }));

  return {
    id: profile.id,
    name: profile.name,
    age: profile.age,
    birthdayMonth: profile.birthday_month,
    birthdayDay: profile.birthday_day,
    zodiacSign: profile.zodiac_sign,
    favoriteColor: profile.favorite_color,
    favoriteFood: profile.favorite_food,
    relationshipType: profile.relationship_type,
    customRelationshipType: profile.custom_relationship_type,
    howYouMet: profile.how_you_met,
    location: profile.location,
    phoneNumber: profile.phone_number,
    instagram: profile.instagram,
    twitter: profile.twitter,
    facebook: profile.facebook,
    snapchat: profile.snapchat,
    notes: profile.notes,
    interestLevel: profile.interest_level,
    profileImageUrl: profile.profile_image_url,
    status: profile.status,
    benchReason: profile.bench_reason,
    sortOrder: profile.sort_order,
    sexualChemistry: profile.sexual_chemistry,
    attractiveness: profile.attractiveness,
    compatibilityScore: profile.compatibility_score,
    redFlags,
    greenFlags,
    createdAt: profile.created_at,
  };
}

export function registerRosterApiRoutes(fastify: FastifyInstance) {
  // ===== USER PROFILE ENDPOINTS =====

  // GET /api/user/profile
  fastify.get('/api/user/profile', async (request: any, reply: any) => {
    await requireAuth(request, reply);
    if (!request.userId) return;

    try {
      const profile = await ensureUserProfile(request.userId, request.userEmail || '');
      return transformUserProfile(profile);
    } catch (error) {
      console.error('Error fetching user profile:', error);
      return reply.status(500).send({ error: 'Failed to fetch profile' });
    }
  });

  // PUT /api/user/profile
  fastify.put('/api/user/profile', async (request: any, reply: any) => {
    await requireAuth(request, reply);
    if (!request.userId) return;

    try {
      await ensureUserProfile(request.userId, request.userEmail || '');

      const body = request.body as Record<string, any>;
      const updateData: Record<string, any> = {
        updated_at: new Date().toISOString(),
      };

      // Map camelCase to snake_case
      if (body.name !== undefined) updateData.name = body.name;
      if (body.phoneNumber !== undefined) updateData.phone_number = body.phoneNumber;
      if (body.location !== undefined) updateData.location = body.location;
      if (body.birthday !== undefined) updateData.birthday = body.birthday;
      if (body.datingIntention !== undefined) updateData.dating_intention = body.datingIntention;
      if (body.relationshipType !== undefined) updateData.relationship_type = body.relationshipType;
      if (body.notificationsEnabled !== undefined) updateData.notifications_enabled = body.notificationsEnabled;
      if (body.image !== undefined) updateData.profile_image_url = body.image;
      if (body.profileImageUrl !== undefined) updateData.profile_image_url = body.profileImageUrl;

      const { data, error } = await supabase
        .from('user_profiles')
        .update(updateData)
        .eq('id', request.userId)
        .select()
        .maybeSingle();

      if (error || !data) {
        console.error('Error updating user profile:', error);
        return reply.status(500).send({ error: 'Failed to update profile' });
      }

      return transformUserProfile(data);
    } catch (error) {
      console.error('Error in PUT /api/user/profile:', error);
      return reply.status(500).send({ error: 'Internal server error' });
    }
  });

  // GET /api/user/profile-status
  fastify.get('/api/user/profile-status', async (request: any, reply: any) => {
    await requireAuth(request, reply);
    if (!request.userId) return;

    try {
      const profile = await ensureUserProfile(request.userId, request.userEmail || '');
      return {
        profileCompleted: !!profile.profile_completed,
        hasName: !!profile.name,
      };
    } catch (error) {
      console.error('Error in GET /api/user/profile-status:', error);
      return reply.status(500).send({ error: 'Internal server error' });
    }
  });

  // POST /api/user/complete-profile
  fastify.post('/api/user/complete-profile', async (request: any, reply: any) => {
    await requireAuth(request, reply);
    if (!request.userId) return;

    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({ profile_completed: 1, updated_at: new Date().toISOString() })
        .eq('id', request.userId);

      if (error) {
        console.error('Error completing profile:', error);
        return reply.status(500).send({ error: 'Failed to complete profile' });
      }

      return { success: true };
    } catch (error) {
      console.error('Error in POST /api/user/complete-profile:', error);
      return reply.status(500).send({ error: 'Internal server error' });
    }
  });

  // GET /api/user/share-code
  fastify.get('/api/user/share-code', async (request: any, reply: any) => {
    await requireAuth(request, reply);
    if (!request.userId) return;

    try {
      const profile = await ensureUserProfile(request.userId, request.userEmail || '');
      return { shareCode: profile.share_code };
    } catch (error) {
      console.error('Error in GET /api/user/share-code:', error);
      return reply.status(500).send({ error: 'Internal server error' });
    }
  });

  // ===== ROSTER PROFILE ENDPOINTS =====

  // GET /api/profiles
  fastify.get('/api/profiles', async (request: any, reply: any) => {
    await requireAuth(request, reply);
    if (!request.userId) return;

    try {
      await ensureUserProfile(request.userId, request.userEmail || '');

      const { data: profiles, error } = await supabase
        .from('roster_profiles')
        .select('*')
        .eq('user_id', request.userId)
        .order('sort_order', { ascending: true, nullsFirst: true });

      if (error) {
        console.error('Error fetching profiles:', error);
        return reply.status(500).send({ error: 'Failed to fetch profiles' });
      }

      // Fetch flags for all profiles
      const profileIds = (profiles || []).map((p: any) => p.id);
      const { data: allFlags } = await supabase
        .from('profile_flags')
        .select('*')
        .in('roster_profile_id', profileIds);

      const flagsByProfile: Record<string, any[]> = {};
      if (allFlags) {
        for (const flag of allFlags) {
          if (!flagsByProfile[flag.roster_profile_id]) {
            flagsByProfile[flag.roster_profile_id] = [];
          }
          flagsByProfile[flag.roster_profile_id].push(flag);
        }
      }

      return (profiles || []).map((p: any) => transformRosterProfile(p, flagsByProfile[p.id] || []));
    } catch (error) {
      console.error('Error in GET /api/profiles:', error);
      return reply.status(500).send({ error: 'Internal server error' });
    }
  });

  // POST /api/profiles
  fastify.post('/api/profiles', async (request: any, reply: any) => {
    await requireAuth(request, reply);
    if (!request.userId) return;

    try {
      await ensureUserProfile(request.userId, request.userEmail || '');

      const body = request.body as Record<string, any>;
      const id = randomUUID();

      const insertData: Record<string, any> = {
        id,
        user_id: request.userId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // Map camelCase to snake_case
      if (body.name !== undefined) insertData.name = body.name;
      if (body.age !== undefined) insertData.age = body.age;
      if (body.birthdayMonth !== undefined) insertData.birthday_month = body.birthdayMonth;
      if (body.birthdayDay !== undefined) insertData.birthday_day = body.birthdayDay;
      if (body.zodiacSign !== undefined) insertData.zodiac_sign = body.zodiacSign;
      if (body.favoriteColor !== undefined) insertData.favorite_color = body.favoriteColor;
      if (body.favoriteFood !== undefined) insertData.favorite_food = body.favoriteFood;
      if (body.relationshipType !== undefined) insertData.relationship_type = body.relationshipType;
      if (body.customRelationshipType !== undefined) insertData.custom_relationship_type = body.customRelationshipType;
      if (body.howYouMet !== undefined) insertData.how_you_met = body.howYouMet;
      if (body.how_we_met !== undefined) insertData.how_you_met = body.how_we_met;
      if (body.location !== undefined) insertData.location = body.location;
      if (body.phoneNumber !== undefined) insertData.phone_number = body.phoneNumber;
      if (body.instagram !== undefined) insertData.instagram = body.instagram;
      if (body.twitter !== undefined) insertData.twitter = body.twitter;
      if (body.facebook !== undefined) insertData.facebook = body.facebook;
      if (body.snapchat !== undefined) insertData.snapchat = body.snapchat;
      if (body.notes !== undefined) insertData.notes = body.notes;
      if (body.interestLevel !== undefined) insertData.interest_level = body.interestLevel;
      if (body.profileImageUrl !== undefined) insertData.profile_image_url = body.profileImageUrl;
      if (body.status !== undefined) insertData.status = body.status;
      if (body.benchReason !== undefined) insertData.bench_reason = body.benchReason;
      if (body.sortOrder !== undefined) insertData.sort_order = body.sortOrder;
      if (body.sexual_chemistry !== undefined) insertData.sexual_chemistry = body.sexual_chemistry;
      if (body.sexualChemistry !== undefined) insertData.sexual_chemistry = body.sexualChemistry;
      if (body.attractiveness !== undefined) insertData.attractiveness = body.attractiveness;

      const { data, error } = await supabase
        .from('roster_profiles')
        .insert(insertData)
        .select()
        .maybeSingle();

      if (error || !data) {
        console.error('Error creating profile:', error);
        return reply.status(500).send({ error: 'Failed to create profile' });
      }

      return reply.status(201).send(transformRosterProfile(data));
    } catch (error) {
      console.error('Error in POST /api/profiles:', error);
      return reply.status(500).send({ error: 'Internal server error' });
    }
  });

  // PUT /api/profiles/:id
  fastify.put('/api/profiles/:id', async (request: any, reply: any) => {
    await requireAuth(request, reply);
    if (!request.userId) return;

    const { id } = request.params;
    const body = request.body as Record<string, any>;

    try {
      if (!(await checkRosterOwnership(request.userId, id, reply))) {
        return;
      }

      const updateData: Record<string, any> = {
        updated_at: new Date().toISOString(),
      };

      // Map fields
      ['name', 'age', 'location', 'notes'].forEach((key) => {
        if (body[key] !== undefined) updateData[key] = body[key];
      });

      // Map camelCase to snake_case
      const fieldMap: Record<string, string> = {
        birthdayMonth: 'birthday_month',
        birthdayDay: 'birthday_day',
        zodiacSign: 'zodiac_sign',
        favoriteColor: 'favorite_color',
        favoriteFood: 'favorite_food',
        relationshipType: 'relationship_type',
        customRelationshipType: 'custom_relationship_type',
        howYouMet: 'how_you_met',
        phoneNumber: 'phone_number',
        interestLevel: 'interest_level',
        profileImageUrl: 'profile_image_url',
        benchReason: 'bench_reason',
        sortOrder: 'sort_order',
        sexualChemistry: 'sexual_chemistry',
      };

      for (const [camelKey, snakeKey] of Object.entries(fieldMap)) {
        if (body[camelKey] !== undefined) updateData[snakeKey] = body[camelKey];
      }

      // Direct snake_case fields
      if (body.instagram !== undefined) updateData.instagram = body.instagram;
      if (body.twitter !== undefined) updateData.twitter = body.twitter;
      if (body.facebook !== undefined) updateData.facebook = body.facebook;
      if (body.snapchat !== undefined) updateData.snapchat = body.snapchat;
      if (body.attractiveness !== undefined) updateData.attractiveness = body.attractiveness;
      if (body.status !== undefined) updateData.status = body.status;

      const { data, error } = await supabase
        .from('roster_profiles')
        .update(updateData)
        .eq('id', id)
        .select()
        .maybeSingle();

      if (error || !data) {
        console.error('Error updating profile:', error);
        return reply.status(500).send({ error: 'Failed to update profile' });
      }

      const { data: flags } = await supabase
        .from('profile_flags')
        .select('*')
        .eq('roster_profile_id', id);

      return transformRosterProfile(data, flags || []);
    } catch (error) {
      console.error('Error in PUT /api/profiles/:id:', error);
      return reply.status(500).send({ error: 'Internal server error' });
    }
  });

  // DELETE /api/profiles/:id
  fastify.delete('/api/profiles/:id', async (request: any, reply: any) => {
    await requireAuth(request, reply);
    if (!request.userId) return;

    const { id } = request.params;

    try {
      if (!(await checkRosterOwnership(request.userId, id, reply))) {
        return;
      }

      // Delete flags first
      await supabase.from('profile_flags').delete().eq('roster_profile_id', id);

      // Delete profile
      const { error } = await supabase.from('roster_profiles').delete().eq('id', id);

      if (error) {
        console.error('Error deleting profile:', error);
        return reply.status(500).send({ error: 'Failed to delete profile' });
      }

      return { success: true };
    } catch (error) {
      console.error('Error in DELETE /api/profiles/:id:', error);
      return reply.status(500).send({ error: 'Internal server error' });
    }
  });

  // PUT /api/profiles/:id/bench
  fastify.put('/api/profiles/:id/bench', async (request: any, reply: any) => {
    await requireAuth(request, reply);
    if (!request.userId) return;

    const { id } = request.params;
    const body = request.body as Record<string, any>;

    try {
      if (!(await checkRosterOwnership(request.userId, id, reply))) {
        return;
      }

      const { data, error } = await supabase
        .from('roster_profiles')
        .update({
          status: 'bench',
          bench_reason: body.reason || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .maybeSingle();

      if (error || !data) {
        console.error('Error benching profile:', error);
        return reply.status(500).send({ error: 'Failed to bench profile' });
      }

      const { data: flags } = await supabase
        .from('profile_flags')
        .select('*')
        .eq('roster_profile_id', id);

      return transformRosterProfile(data, flags || []);
    } catch (error) {
      console.error('Error in PUT /api/profiles/:id/bench:', error);
      return reply.status(500).send({ error: 'Internal server error' });
    }
  });

  // PUT /api/profiles/:id/roster
  fastify.put('/api/profiles/:id/roster', async (request: any, reply: any) => {
    await requireAuth(request, reply);
    if (!request.userId) return;

    const { id } = request.params;

    try {
      if (!(await checkRosterOwnership(request.userId, id, reply))) {
        return;
      }

      const { data, error } = await supabase
        .from('roster_profiles')
        .update({
          status: 'roster',
          bench_reason: null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .maybeSingle();

      if (error || !data) {
        console.error('Error moving to roster:', error);
        return reply.status(500).send({ error: 'Failed to move to roster' });
      }

      const { data: flags } = await supabase
        .from('profile_flags')
        .select('*')
        .eq('roster_profile_id', id);

      return transformRosterProfile(data, flags || []);
    } catch (error) {
      console.error('Error in PUT /api/profiles/:id/roster:', error);
      return reply.status(500).send({ error: 'Internal server error' });
    }
  });

  // PUT /api/profiles/reorder
  fastify.put('/api/profiles/reorder', async (request: any, reply: any) => {
    await requireAuth(request, reply);
    if (!request.userId) return;

    try {
      const body = request.body as Record<string, any>;
      const profiles = body.profiles as Array<{ id: string; displayOrder: number }>;

      if (!Array.isArray(profiles)) {
        return reply.status(400).send({ error: 'Invalid request format' });
      }

      for (const profile of profiles) {
        await supabase
          .from('roster_profiles')
          .update({ sort_order: profile.displayOrder })
          .eq('id', profile.id)
          .eq('user_id', request.userId);
      }

      return { success: true };
    } catch (error) {
      console.error('Error in PUT /api/profiles/reorder:', error);
      return reply.status(500).send({ error: 'Internal server error' });
    }
  });

  // ===== PROFILE SHARE CODE LOOKUP =====

  // GET /api/profiles/by-code
  fastify.get('/api/profiles/by-code', async (request: any, reply: any) => {
    await requireAuth(request, reply);
    if (!request.userId) return;

    const { code } = request.query as Record<string, string>;

    if (!code) {
      return reply.status(400).send({ error: 'code parameter is required' });
    }

    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .ilike('share_code', code.toUpperCase())
        .maybeSingle();

      if (error || !data) {
        return reply.status(404).send({ error: 'Profile not found' });
      }

      return {
        id: data.id,
        name: data.name,
        age: null,
        location: data.location,
        phoneNumber: data.phone_number,
        instagram: null,
        image: data.profile_image_url,
        profileImageUrl: data.profile_image_url,
        shareCode: data.share_code,
      };
    } catch (error) {
      console.error('Error in GET /api/profiles/by-code:', error);
      return reply.status(500).send({ error: 'Internal server error' });
    }
  });

  // ===== FLAGS ENDPOINTS =====

  // POST /api/profiles/:id/flags
  fastify.post('/api/profiles/:id/flags', async (request: any, reply: any) => {
    await requireAuth(request, reply);
    if (!request.userId) return;

    const { id } = request.params;
    const body = request.body as Record<string, any>;

    try {
      if (!(await checkRosterOwnership(request.userId, id, reply))) {
        return;
      }

      const flagId = randomUUID();
      const { data, error } = await supabase
        .from('profile_flags')
        .insert({
          id: flagId,
          roster_profile_id: id,
          user_id: request.userId,
          flag_text: body.flagText,
          type: body.type,
          created_at: new Date().toISOString(),
        })
        .select()
        .maybeSingle();

      if (error || !data) {
        console.error('Error creating flag:', error);
        return reply.status(500).send({ error: 'Failed to create flag' });
      }

      return reply.status(201).send({
        id: data.id,
        flagText: data.flag_text,
        type: data.type,
        rosterId: data.roster_profile_id,
      });
    } catch (error) {
      console.error('Error in POST /api/profiles/:id/flags:', error);
      return reply.status(500).send({ error: 'Internal server error' });
    }
  });

  // DELETE /api/flags/:id
  fastify.delete('/api/flags/:id', async (request: any, reply: any) => {
    await requireAuth(request, reply);
    if (!request.userId) return;

    const { id } = request.params;

    try {
      const { data: flag, error: fetchError } = await supabase
        .from('profile_flags')
        .select('user_id')
        .eq('id', id)
        .eq('user_id', request.userId)
        .maybeSingle();

      if (fetchError || !flag) {
        return reply.status(403).send({ error: 'Forbidden' });
      }

      const { error } = await supabase.from('profile_flags').delete().eq('id', id);

      if (error) {
        console.error('Error deleting flag:', error);
        return reply.status(500).send({ error: 'Failed to delete flag' });
      }

      return { success: true };
    } catch (error) {
      console.error('Error in DELETE /api/flags/:id:', error);
      return reply.status(500).send({ error: 'Internal server error' });
    }
  });
}
