-- Hardening: lock prediction writes after kickoff at database level.
-- This prevents bypass attempts via direct SQL/scripts against prediction tables.

-- Match predictions (home_score/away_score)
CREATE OR REPLACE FUNCTION "lock_match_predictions_after_kickoff"()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_match_date TIMESTAMP;
  v_match_status TEXT;
  v_is_non_prediction_update BOOLEAN;
BEGIN
  SELECT m."date", m."status"
  INTO v_match_date, v_match_status
  FROM "matches" m
  WHERE m."id" = COALESCE(NEW."matchId", OLD."matchId");

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Partida não encontrada para validar bloqueio de palpite.';
  END IF;

  IF TG_OP = 'UPDATE' THEN
    -- Allow scoring recalculation updates (points only) after kickoff.
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

  IF v_match_date <= NOW() OR v_match_status <> 'PENDING' THEN
    RAISE EXCEPTION 'Palpite bloqueado: a partida já iniciou ou foi encerrada.'
      USING ERRCODE = 'P0001';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS "trg_lock_match_predictions_after_kickoff" ON "match_predictions";
CREATE TRIGGER "trg_lock_match_predictions_after_kickoff"
BEFORE INSERT OR UPDATE ON "match_predictions"
FOR EACH ROW
EXECUTE FUNCTION "lock_match_predictions_after_kickoff"();

-- Oracle knockout predictions (predicted_winner)
CREATE OR REPLACE FUNCTION "lock_oracle_knockout_predictions_after_kickoff"()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_match_date TIMESTAMP;
  v_match_status TEXT;
  v_is_non_prediction_update BOOLEAN;
BEGIN
  SELECT m."date", m."status"
  INTO v_match_date, v_match_status
  FROM "matches" m
  WHERE m."id" = COALESCE(NEW."match_id", OLD."match_id");

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Partida não encontrada para validar bloqueio do Oráculo.';
  END IF;

  IF TG_OP = 'UPDATE' THEN
    -- Allow scoring recalculation updates (points only) after kickoff.
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

  IF v_match_date <= NOW() OR v_match_status <> 'PENDING' THEN
    RAISE EXCEPTION 'Palpite do Oráculo bloqueado: a partida já iniciou ou foi encerrada.'
      USING ERRCODE = 'P0001';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS "trg_lock_oracle_knockout_predictions_after_kickoff" ON "oracle_knockout_predictions";
CREATE TRIGGER "trg_lock_oracle_knockout_predictions_after_kickoff"
BEFORE INSERT OR UPDATE ON "oracle_knockout_predictions"
FOR EACH ROW
EXECUTE FUNCTION "lock_oracle_knockout_predictions_after_kickoff"();
