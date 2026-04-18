-- AlterTable
ALTER TABLE "SustainabilityCert" ADD COLUMN     "status" "CertificationStatus" NOT NULL DEFAULT 'PENDING';

-- CreateIndex
CREATE INDEX "SustainabilityCert_status_idx" ON "SustainabilityCert"("status");
