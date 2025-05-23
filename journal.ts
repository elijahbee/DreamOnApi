import { VercelRequest, VercelResponse } from '@vercel/node';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.status(200).end();
    return;
  }
  // Add CORS header to all responses
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method === 'GET') {
    // Fetch all dream entries
    const entries = await prisma.dreamEntry.findMany({
      orderBy: { createdAt: 'desc' },
    });
    // Convert tags CSV string to array for API consumers
    const entriesWithTags = entries.map(e => ({
      ...e,
      tags: e.tags ? e.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
    }));
    return res.status(200).json(entriesWithTags);
  }

  if (req.method === 'PUT') {
    let body = req.body;
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch (err) {
        console.error('PUT body parse error:', err);
        return res.status(400).json({ error: 'Invalid JSON body' });
      }
    }
    const { id, title, content, date, tags } = body;
    if (!id) {
      return res.status(400).json({ error: 'Entry id is required.' });
    }
    let data: any = {};
    if (title !== undefined) data.title = title;
    if (content !== undefined) data.content = content;
    if (date !== undefined) {
      const d = new Date(date);
      if (!isNaN(d.getTime())) data.date = d;
    }
    if (tags !== undefined) {
      if (Array.isArray(tags)) {
        data.tags = tags.map((t: string) => String(t).trim()).filter(Boolean).join(",");
      } else if (typeof tags === 'string') {
        data.tags = tags;
      }
    }
    try {
      const entry = await prisma.dreamEntry.update({
        where: { id: Number(id) },
        data,
      });
      return res.status(200).json({ ...entry, tags: entry.tags ? entry.tags.split(",").map((t: string) => t.trim()).filter(Boolean) : [] });
    } catch (e: unknown) {
      return res.status(404).json({ error: 'Entry not found or update failed.' });
    }
  }

  if (req.method === 'POST') {
    let body = req.body;
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch (err) {
        console.error('POST body parse error:', err);
        return res.status(400).json({ error: 'Invalid JSON body' });
      }
    }
    const { title, content, date, tags } = body;
    if (!title || !content) {
      return res.status(400).json({ error: 'Title and content are required.' });
    }
    let entryDate: Date | undefined = undefined;
    if (date) {
      const d = new Date(date);
      if (!isNaN(d.getTime())) entryDate = d;
    }
    let entryTags: string[] = [];
    if (Array.isArray(tags)) {
      entryTags = tags.map((t: string) => String(t).trim()).filter(Boolean);
    }
    const entry = await prisma.dreamEntry.create({
      data: {
        title,
        content,
        date: entryDate,
        tags: entryTags.length > 0 ? entryTags.join(",") : null,
      },
    });
    return res.status(201).json({ ...entry, tags: entry.tags ? entry.tags.split(",").map((t: string) => t.trim()).filter(Boolean) : [] });
  }

  res.status(405).json({ error: 'Method not allowed' });
}
