SELECT H.id, H.type, H.data, H.created_at
FROM autobe.autobe_hackathon_session_histories AS H
WHERE H.type IN ('userMessage', 'assistantMessage') AND
  H.autobe_hackathon_session_id = '019940b5-a735-74ca-9b93-daa0ba54cc55'
ORDER BY H.created_at ASC;