ALTER TABLE "companies" ADD COLUMN "service_radius_km" INTEGER;
ALTER TABLE "companies" ADD CONSTRAINT "companies_service_radius_km_check" CHECK ("service_radius_km" IS NULL OR "service_radius_km" BETWEEN 1 AND 500);
