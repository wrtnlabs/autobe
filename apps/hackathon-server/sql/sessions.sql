SELECT S.id, P.email, P.name, S.title, S.model, A.phase, S.created_at
FROM autobe.autobe_hackathon_sessions AS S
  INNER JOIN autobe.autobe_hackathon_participants AS P
    ON S.autobe_hackathon_participant_id = P.id
  INNER JOIN autobe.autobe_hackathon_session_aggregates AS A
    ON S.id = A.autobe_hackathon_session_id
WHERE P.email NOT LIKE '%@wrtn.io'
ORDER BY S.created_at DESC;