export default async function handler(req, res) {
  const url = `${process.env.SUPABASE_URL}/rest/v1/users?select=slug&limit=1`;
  try {
    const resp = await fetch(url, {
      headers: {
        apikey: process.env.SUPABASE_ANON_KEY,
        Authorization: `Bearer ${process.env.SUPABASE_ANON_KEY}`,
      },
    });
    if (!resp.ok) {
      return res.status(500).json({ ok: false, status: resp.status });
    }
    return res.status(200).json({ ok: true });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message });
  }
}
