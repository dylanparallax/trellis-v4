-- CreateEnum
CREATE TYPE "TenureStatus" AS ENUM ('TEMPORARY', 'PROBATIONARY', 'PERMANENT');

-- AlterEnum
ALTER TYPE "ObservationType" ADD VALUE 'OTHER';

-- AlterTable
ALTER TABLE "Observation" ADD COLUMN     "subject" TEXT;

-- AlterTable
ALTER TABLE "Teacher" ADD COLUMN     "departments" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "tenureStatus" "TenureStatus";
