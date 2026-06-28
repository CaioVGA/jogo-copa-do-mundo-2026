-- AlterTable
ALTER TABLE "matches" ADD COLUMN     "homePenalties" INTEGER,
ADD COLUMN     "awayPenalties" INTEGER;

-- CreateTable
CREATE TABLE "oracle_knockout_predictions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "match_id" TEXT NOT NULL,
    "predicted_winner" TEXT NOT NULL,
    "points" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "oracle_knockout_predictions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "oracle_knockout_predictions_userId_groupId_match_id_key" ON "oracle_knockout_predictions"("userId", "groupId", "match_id");

-- AddForeignKey
ALTER TABLE "oracle_knockout_predictions" ADD CONSTRAINT "oracle_knockout_predictions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "oracle_knockout_predictions" ADD CONSTRAINT "oracle_knockout_predictions_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;
