-- CreateEnum
CREATE TYPE "ClientStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'PROSPECT');

-- AlterTable
ALTER TABLE "clients" ADD COLUMN     "budget" DOUBLE PRECISION,
ADD COLUMN     "status" "ClientStatus" NOT NULL DEFAULT 'PROSPECT';
