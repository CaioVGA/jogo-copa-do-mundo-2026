-- Align DB lock semantics with backend:
-- lock predictions strictly by kickoff datetime, not by match status.

CREATE OR REPLACE FUNCTION "lock_match_predictions_after_kickoff"()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_match_date TIMESTAMP;
  v_is_non_prediction_update BOOLEAN;
BEGIN
  SELECT m."date"
  INTO v_match_date
  FROM "matches" m
  WHERE m."id" = COALESCE(NEW."matchId", OLD."matchId");

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Partida não encontrada para validar bloqueio de palpite.';
  END IF;

  IF TG_OP = 'UPDATE' THEN
    v_is_non_prediction_update := (
      NEW."home_score" IS NOT DISTINCT FROM OLD."home_score"
      AND NEW."away_score" IS NOT DISTINCT FROM OLD."away_score"
      AND NEW."userId" IS NOT DISTINCT FROM OLD."userId"
      AND NEW."matchId" IS NOT DISTINCT FROM OLD."matchId"
      AND NEW."group_id" IS NOT DISTINCT FROM OLD."group_id"
    );

    IF v_is_non_prediction_update THEN
      RETURN NEW;
    END IF;
  END IF;

  IF (v_match_date + INTERVAL '3 hours') <= NOW() THEN
    RAISE EXCEPTION 'Palpite bloqueado: a partida já iniciou ou foi encerrada.'
      USING ERRCODE = 'P0001';
  END IF;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION "lock_oracle_knockout_predictions_after_kickoff"()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_match_date TIMESTAMP;
  v_is_non_prediction_update BOOLEAN;
BEGIN
  SELECT m."date"
  INTO v_match_date
  FROM "matches" m
  WHERE m."id" = COALESCE(NEW."match_id", OLD."match_id");

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Partida não encontrada para validar bloqueio do Oráculo.';
  END IF;

  IF TG_OP = 'UPDATE' THEN
    v_is_non_prediction_update := (
      NEW."predicted_winner" IS NOT DISTINCT FROM OLD."predicted_winner"
      AND NEW."userId" IS NOT DISTINCT FROM OLD."userId"
      AND NEW."groupId" IS NOT DISTINCT FROM OLD."groupId"
      AND NEW."match_id" IS NOT DISTINCT FROM OLD."match_id"
    );

    IF v_is_non_prediction_update THEN
      RETURN NEW;
    END IF;
  END IF;

  IF (v_match_date + INTERVAL '3 hours') <= NOW() THEN
    RAISE EXCEPTION 'Palpite do Oráculo bloqueado: a partida já iniciou ou foi encerrada.'
      USING ERRCODE = 'P0001';
  END IF;

  RETURN NEW;
END;
$$;
