import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const rowsToMap = (result) => {
  const rows = Array.isArray(result?.rows) ? result.rows : Array.isArray(result) ? result : [];
  return rows.reduce((acc, row) => {
    if (row.post_id) acc[row.post_id] = row.count ?? 0;
    return acc;
  }, {});
};

const buildQuery = ({ category, q, fields = [] }) => {
  const query = {};
  if (category && category !== "all") query.category = category;
  if (q) {
    const branches = fields.map((field) => ({ [field]: { $regex: q } }));
    if (branches.length) query.$or = branches;
  }
  return query;
};

async function attachCounts(base, posts) {
  const ids = posts.map((post) => post.id);
  if (!ids.length) return { posts, likeCounts: {}, commentCounts: {} };
  const [likes, comments] = await Promise.all([
    base.asServiceRole.entities.PostLike.aggregate({ query: { post_id: { $in: ids } }, groupBy: "post_id" }),
    base.asServiceRole.entities.Comment.aggregate({ query: { post_id: { $in: ids } }, groupBy: "post_id" }),
  ]);
  return { posts, likeCounts: rowsToMap(likes), commentCounts: rowsToMap(comments) };
}

export const getFeed = createServerFn({ method: "GET" })
  .validator(z.object({ category: z.string().optional(), q: z.string().optional() }))
  .handler(async ({ data, context }) => {
    const base = context.getBase44();
    const page = await base.entities.Post.filter(
      buildQuery({ category: data.category, q: data.q, fields: ["caption", "creator_name", "category"] }),
      { sort: "-created_date", limit: 60 },
    );
    return attachCounts(base, page?.items ?? []);
  });

export const getPostDetail = createServerFn({ method: "GET" })
  .validator(z.object({ postId: z.string() }))
  .handler(async ({ data, context }) => {
    const base = context.getBase44();
    const post = await base.entities.Post.get(data.postId).catch((error) => {
      if (error?.status === 404) return null;
      throw error;
    });
    if (!post) return null;

    const [comments, likes] = await Promise.all([
      base.entities.Comment.filter({ post_id: post.id }, { sort: "created_date", limit: 100 }),
      base.asServiceRole.entities.PostLike.aggregate({ query: { post_id: post.id } }),
    ]);

    const likeRows = Array.isArray(likes?.rows) ? likes.rows : [];
    return {
      post,
      comments: comments?.items ?? [],
      likeCount: likeRows[0]?.count ?? 0,
    };
  });

export const getServices = createServerFn({ method: "GET" })
  .validator(z.object({ category: z.string().optional(), q: z.string().optional() }))
  .handler(async ({ data, context }) => {
    const base = context.getBase44();
    const page = await base.entities.Service.filter(
      buildQuery({ category: data.category, q: data.q, fields: ["title", "creator_name", "category"] }),
      { sort: "-created_date", limit: 60 },
    );
    return page?.items ?? [];
  });

export const getServiceDetail = createServerFn({ method: "GET" })
  .validator(z.object({ serviceId: z.string() }))
  .handler(async ({ data, context }) => {
    const base = context.getBase44();
    const service = await base.entities.Service.get(data.serviceId).catch((error) => {
      if (error?.status === 404) return null;
      throw error;
    });
    if (!service) return null;

    const page = await base.entities.Service.filter(
      { creator_username: service.creator_username },
      { sort: "-created_date", limit: 6 },
    );

    return { service, more: (page?.items ?? []).filter((item) => item.id !== service.id) };
  });

export const getRequests = createServerFn({ method: "GET" })
  .validator(z.object({ category: z.string().optional(), q: z.string().optional() }))
  .handler(async ({ data, context }) => {
    const base = context.getBase44();
    const page = await base.entities.SkillRequest.filter(
      { ...buildQuery({ category: data.category, q: data.q, fields: ["title", "description", "author_name"] }), status: "open" },
      { sort: "-created_date", limit: 60 },
    );
    return page?.items ?? [];
  });

export const getProfilePage = createServerFn({ method: "GET" })
  .validator(z.object({ username: z.string() }))
  .handler(async ({ data, context }) => {
    const base = context.getBase44();
    const page = await base.entities.Profile.filter({ username: data.username }, { limit: 1 });
    const profile = page?.items?.[0];
    if (!profile) return null;

    const [posts, services, completed] = await Promise.all([
      base.entities.Post.filter({ creator_username: profile.username }, { sort: "-created_date", limit: 24 }),
      base.entities.Service.filter({ creator_username: profile.username }, { sort: "-created_date", limit: 12 }),
      base.asServiceRole.entities.Order.count({ seller_id: profile.user_id, status: "completed" }),
    ]);

    return {
      profile,
      posts: posts?.items ?? [],
      services: services?.items ?? [],
      completed: completed ?? 0,
    };
  });