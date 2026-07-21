/*
  Warnings:

  - A unique constraint covering the columns `[userId,date,type]` on the table `Closure` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Closure_userId_date_type_key" ON "Closure"("userId", "date", "type");
