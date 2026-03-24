const BASE = '/api';

async function req(path, opts = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...opts.headers },
    ...opts,
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export const api = {
  // Users
  getUsers:          ()           => req('/users'),
  getUser:           (id)         => req(`/users/${id}`),

  // Listings
  getListings:       (params={})  => req(`/listings?${new URLSearchParams(params)}`),
  getListing:        (id)         => req(`/listings/${id}`),
  createListing:     (data)       => req('/listings', { method: 'POST', body: data }),
  getSuggestions:    (id)         => req(`/listings/${id}/suggestions`),

  // Matches
  getMatches:        (userId)     => req(`/matches?user_id=${userId}`),
  createMatch:       (data)       => req('/matches', { method: 'POST', body: data }),
  updateMatch:       (id, status) => req(`/matches/${id}`, { method: 'PATCH', body: { status } }),

  // Messages
  getMessages:       (matchId)    => req(`/messages/${matchId}`),
  sendMessage:       (matchId, data) => req(`/messages/${matchId}`, { method: 'POST', body: data }),

  // Reviews
  checkReview:       (reviewer_id, match_id) => req(`/reviews/check?reviewer_id=${reviewer_id}&match_id=${match_id}`),
  createReview:      (data)       => req('/reviews', { method: 'POST', body: data }),
};
